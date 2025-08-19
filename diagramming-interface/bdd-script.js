// BDD Diagramming Interface - Main Application
class BDDDiagrammingInterface {
    constructor() {
        this.canvas = document.getElementById('diagramCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvasOverlay = document.getElementById('canvasOverlay');
        
        // State management
        this.elements = [];
        this.connections = [];
        this.layers = [{ id: 'default', name: 'Default', visible: true, locked: false }];
        this.currentLayer = 'default';
        this.selectedElement = null;
        this.selectedElements = [];
        this.draggedElement = null;
        this.isDrawing = false;
        this.isDragging = false;
        this.isConnecting = false;
        this.connectionStart = null;
        this.connectionEnd = null;
        this.isResizing = false;
        this.resizeHandle = null;
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        
        // BDD-specific state
        this.currentDocument = null;
        this.documents = new Map();
        this.businessOutcomes = new Map();
        this.outcomeFilters = new Set();
        this.currentDiagramType = 'flow'; // 'flow' or 'sequence'
        this.metadata = {
            flowTitle: '',
            methodology: 'BDD',
            diagramType: 'Flowchart',
            primaryOutcomes: [],
            timers: []
        };
        
        // History for undo/redo
        this.history = [];
        this.historyIndex = -1;
        
        // Mouse state
        this.mouseX = 0;
        this.mouseY = 0;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.isMouseDown = false;
        this.isPanning = false;
        
        // Connection mode
        this.connectionMode = false;
        this.tempConnection = null;
        
        // Canvas settings
        this.gridVisible = false;
        this.snapToGrid = true;
        this.guidesVisible = true;
        this.gridSize = 20;
        
        // Markdown parser
        this.markdownParser = new BDDMarkdownParser();
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.setupToolbar();
        this.setupProperties();
        this.setupModals();
        this.setupPanels();
        this.render();
        this.saveState();
        
        // Initialize with default document
        this.createNewDocument('Untitled Flow', 'flow');
    }
    
    setupCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        this.canvas.width = rect.width - 32;
        this.canvas.height = rect.height - 80; // Account for info bar
        this.canvas.style.width = (rect.width - 32) + 'px';
        this.canvas.style.height = (rect.height - 80) + 'px';
        
        // Set up high DPI support
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;
        
        this.canvas.width = displayWidth * dpr;
        this.canvas.height = displayHeight * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';
    }
    
    setupEventListeners() {
        // Canvas events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        
        // Window events
        window.addEventListener('resize', this.handleResize.bind(this));
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    }
    
    setupDragAndDrop() {
        const shapeItems = document.querySelectorAll('.shape-item');
        
        shapeItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const shapeType = item.dataset.shape;
                const centerX = this.canvas.width / (2 * window.devicePixelRatio);
                const centerY = this.canvas.height / (2 * window.devicePixelRatio);
                this.createShape(shapeType, centerX, centerY);
            });
            
            item.addEventListener('dragstart', (e) => {
                const shapeType = item.dataset.shape;
                e.dataTransfer.setData('text/plain', shapeType);
                item.classList.add('dragging');
            });
            
            item.addEventListener('dragend', (e) => {
                item.classList.remove('dragging');
            });
        });
        
        // Canvas drop zone
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.canvas.parentElement.classList.add('drag-over');
        });
        
        this.canvas.addEventListener('dragleave', (e) => {
            this.canvas.parentElement.classList.remove('drag-over');
        });
        
        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            this.canvas.parentElement.classList.remove('drag-over');
            
            const shapeType = e.dataTransfer.getData('text/plain');
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / this.zoom - this.panX;
            const y = (e.clientY - rect.top) / this.zoom - this.panY;
            
            this.createShape(shapeType, x, y);
        });
    }
    
    setupToolbar() {
        // File operations
        document.getElementById('newBtn').addEventListener('click', () => this.newDiagram());
        document.getElementById('importBtn').addEventListener('click', () => this.showImportModal());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveDiagram());
        document.getElementById('exportBtn').addEventListener('click', () => this.showExportModal());
        
        // Edit operations
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        
        // Zoom operations
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
        document.getElementById('resetZoomBtn').addEventListener('click', () => this.resetZoom());
        document.getElementById('fitToScreenBtn').addEventListener('click', () => this.fitToScreen());
        
        // Document switcher
        document.getElementById('documentSelect').addEventListener('change', (e) => {
            if (e.target.value) {
                this.switchDocument(e.target.value);
            }
        });
        document.getElementById('addDocumentBtn').addEventListener('click', () => this.showAddDocumentDialog());
        
        // Panel toggles
        document.getElementById('outcomesBtn').addEventListener('click', () => this.toggleOutcomesPanel());
        document.getElementById('layersBtn').addEventListener('click', () => this.toggleLayersPanel());
        
        // Canvas controls
        document.getElementById('gridToggle').addEventListener('click', () => this.toggleGrid());
        document.getElementById('snapToggle').addEventListener('click', () => this.toggleSnap());
        document.getElementById('guidesToggle').addEventListener('click', () => this.toggleGuides());
    }
    
    setupProperties() {
        // Property tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchPropertyTab(tabName);
            });
        });
        
        // Property change listeners
        const propertyInputs = [
            'fillColor', 'borderColor', 'borderWidth', 'opacity',
            'elementText', 'fontSize', 'fontWeight', 'textAlign',
            'posX', 'posY', 'width', 'height', 'rotation'
        ];
        
        propertyInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                const eventType = element.type === 'range' ? 'input' : 'change';
                element.addEventListener(eventType, (e) => {
                    this.updateSelectedElementProperty(id, e.target.value);
                });
            }
        });
        
        // Action buttons
        document.getElementById('deleteElement').addEventListener('click', () => this.deleteSelected());
        document.getElementById('duplicateElement').addEventListener('click', () => this.duplicateSelected());
        document.getElementById('bringToFrontBtn').addEventListener('click', () => this.bringToFront());
        document.getElementById('sendToBackBtn').addEventListener('click', () => this.sendToBack());
        
        // Canvas actions
        document.getElementById('selectAllBtn').addEventListener('click', () => this.selectAll());
        document.getElementById('clearCanvasBtn').addEventListener('click', () => this.clearCanvas());
    }
    
    setupModals() {
        // Import modal
        this.setupImportModal();
        
        // Export modal
        this.setupExportModal();
        
        // Metadata modal
        this.setupMetadataModal();
    }
    
    setupImportModal() {
        const modal = document.getElementById('importModal');
        const closeBtn = document.getElementById('closeImportModal');
        const cancelBtn = document.getElementById('cancelImportBtn');
        const previewBtn = document.getElementById('previewImportBtn');
        const confirmBtn = document.getElementById('confirmImportBtn');
        const fileInput = document.getElementById('fileInput');
        const markdownInput = document.getElementById('markdownInput');
        
        closeBtn.addEventListener('click', () => this.hideModal('importModal'));
        cancelBtn.addEventListener('click', () => this.hideModal('importModal'));
        
        previewBtn.addEventListener('click', () => this.previewImport());
        confirmBtn.addEventListener('click', () => this.confirmImport());
        
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        markdownInput.addEventListener('input', () => this.enablePreviewButton());
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal('importModal');
            }
        });
    }
    
    setupExportModal() {
        const modal = document.getElementById('exportModal');
        const closeBtn = document.getElementById('closeExportModal');
        const cancelBtn = document.getElementById('cancelExportBtn');
        const confirmBtn = document.getElementById('confirmExportBtn');
        
        closeBtn.addEventListener('click', () => this.hideModal('exportModal'));
        cancelBtn.addEventListener('click', () => this.hideModal('exportModal'));
        confirmBtn.addEventListener('click', () => this.confirmExport());
        
        // Format change handler
        document.querySelectorAll('input[name="exportFormat"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const imageSettings = document.getElementById('imageSettings');
                if (e.target.value === 'png' || e.target.value === 'svg') {
                    imageSettings.style.display = 'block';
                } else {
                    imageSettings.style.display = 'none';
                }
            });
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal('exportModal');
            }
        });
    }
    
    setupMetadataModal() {
        const modal = document.getElementById('metadataModal');
        const confirmBtn = document.getElementById('confirmMetadataBtn');
        const skipBtn = document.getElementById('skipMetadataBtn');
        
        confirmBtn.addEventListener('click', () => this.confirmMetadata());
        skipBtn.addEventListener('click', () => this.skipMetadata());
    }
    
    setupPanels() {
        // Outcomes panel
        document.getElementById('closeOutcomesPanel').addEventListener('click', () => {
            this.toggleOutcomesPanel();
        });
        
        document.getElementById('clearFiltersBtn').addEventListener('click', () => {
            this.clearOutcomeFilters();
        });
        
        // Layers panel
        document.getElementById('closeLayersPanel').addEventListener('click', () => {
            this.toggleLayersPanel();
        });
        
        document.getElementById('addLayerBtn').addEventListener('click', () => {
            this.addLayer();
        });
        
        document.getElementById('deleteLayerBtn').addEventListener('click', () => {
            this.deleteLayer();
        });
        
        // Panel toggles
        document.querySelectorAll('.panel-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const panel = e.target.closest('.toolbox-panel, .properties-panel');
                const content = panel.querySelector('.panel-content');
                const isCollapsed = content.style.display === 'none';
                
                content.style.display = isCollapsed ? 'block' : 'none';
                e.target.textContent = isCollapsed ? '−' : '+';
            });
        });
    }
    
    // Shape Creation and Management
    createShape(type, x, y) {
        const element = {
            id: Date.now() + Math.random(),
            type: type,
            x: this.snapToGrid ? Math.round(x / this.gridSize) * this.gridSize : x,
            y: this.snapToGrid ? Math.round(y / this.gridSize) * this.gridSize : y,
            width: 100,
            height: 50,
            fillColor: '#ffffff',
            borderColor: '#000000',
            borderWidth: 2,
            text: this.getDefaultText(type),
            fontSize: 14,
            fontWeight: 'normal',
            textAlign: 'center',
            rotation: 0,
            opacity: 100,
            layer: this.currentLayer,
            connectionPoints: [],
            businessOutcome: null,
            bddProperties: {}
        };
        
        // Adjust properties based on shape type
        this.configureShapeDefaults(element, type);
        
        // Update connection points
        this.updateConnectionPoints(element);
        
        this.elements.push(element);
        this.selectElement(element);
        this.render();
        this.saveState();
        
        return element;
    }
    
    getDefaultText(type) {
        const textMap = {
            'start': 'Start',
            'action': 'Action',
            'decision': 'Decision?',
            'end': 'End',
            'timer': 'Timer',
            'participant': 'Participant',
            'lifeline': '',
            'message': 'Message',
            'fragment': 'alt',
            'text': 'Text',
            'note': 'Note'
        };
        return textMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
    }
    
    configureShapeDefaults(element, type) {
        const configs = {
            'start': {
                width: 120, height: 60, fillColor: '#4caf50',
                borderColor: '#388e3c', borderWidth: 3
            },
            'action': {
                width: 140, height: 60, fillColor: '#2196f3',
                borderColor: '#1976d2'
            },
            'decision': {
                width: 100, height: 80, fillColor: '#ff9800',
                borderColor: '#f57c00'
            },
            'end': {
                width: 100, height: 60, fillColor: '#f44336',
                borderColor: '#d32f2f', borderWidth: 3
            },
            'timer': {
                width: 80, height: 80, fillColor: '#9c27b0',
                borderColor: '#7b1fa2'
            },
            'participant': {
                width: 120, height: 40, fillColor: '#9c27b0',
                borderColor: '#7b1fa2'
            },
            'lifeline': {
                width: 2, height: 200, fillColor: '#666666',
                borderColor: '#666666'
            },
            'message': {
                width: 150, height: 20, fillColor: 'transparent',
                borderColor: '#333333'
            },
            'fragment': {
                width: 200, height: 100, fillColor: '#fff3e0',
                borderColor: '#ff9800'
            },
            'text': {
                width: 120, height: 30, fillColor: 'transparent',
                borderColor: 'transparent'
            },
            'note': {
                width: 100, height: 80, fillColor: '#ffeb3b',
                borderColor: '#fbc02d'
            }
        };
        
        const config = configs[type];
        if (config) {
            Object.assign(element, config);
        }
    }
    
    updateConnectionPoints(element) {
        const points = [];
        
        if (element.type === 'lifeline') {
            // Vertical line with multiple connection points
            for (let i = 0; i <= 10; i++) {
                points.push({
                    x: element.x + element.width / 2,
                    y: element.y + (element.height / 10) * i
                });
            }
        } else {
            // Standard 4-point connection
            points.push(
                { x: element.x + element.width / 2, y: element.y }, // top
                { x: element.x + element.width, y: element.y + element.height / 2 }, // right
                { x: element.x + element.width / 2, y: element.y + element.height }, // bottom
                { x: element.x, y: element.y + element.height / 2 } // left
            );
        }
        
        element.connectionPoints = points;
    }
    
    // Event Handlers
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = (e.clientX - rect.left) / this.zoom - this.panX;
        this.mouseY = (e.clientY - rect.top) / this.zoom - this.panY;
        this.lastMouseX = this.mouseX;
        this.lastMouseY = this.mouseY;
        this.isMouseDown = true;
        
        // Check for space key for panning
        if (e.key === ' ' || this.isPanning) {
            this.isPanning = true;
            this.canvas.style.cursor = 'grabbing';
            e.preventDefault();
            return;
        }
        
        // Check connection points first
        const connectionPoint = this.getConnectionPointAt(this.mouseX, this.mouseY);
        if (connectionPoint && this.selectedElement) {
            this.connectionMode = true;
            this.connectionStart = {
                element: this.selectedElement,
                point: connectionPoint
            };
            this.canvas.style.cursor = 'crosshair';
            e.preventDefault();
            return;
        }
        
        // Check for element selection
        const clickedElement = this.getElementAt(this.mouseX, this.mouseY);
        
        if (clickedElement) {
            if (!e.ctrlKey && !e.metaKey) {
                this.selectElement(clickedElement);
            } else {
                this.toggleElementSelection(clickedElement);
            }
            
            if (!this.connectionMode) {
                this.isDragging = true;
                this.draggedElement = clickedElement;
                this.canvas.style.cursor = 'grabbing';
            }
        } else {
            // Clear selection if not holding Ctrl/Cmd
            if (!e.ctrlKey && !e.metaKey) {
                this.clearSelection();
            }
        }
        
        e.preventDefault();
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = (e.clientX - rect.left) / this.zoom - this.panX;
        this.mouseY = (e.clientY - rect.top) / this.zoom - this.panY;
        
        // Handle panning
        if (this.isPanning && this.isMouseDown) {
            const deltaX = this.mouseX - this.lastMouseX;
            const deltaY = this.mouseY - this.lastMouseY;
            this.panX += deltaX;
            this.panY += deltaY;
            this.render();
            this.lastMouseX = this.mouseX;
            this.lastMouseY = this.mouseY;
            return;
        }
        
        // Handle connection mode
        if (this.connectionMode && this.connectionStart) {
            this.tempConnection = {
                start: this.connectionStart.point,
                end: { x: this.mouseX, y: this.mouseY }
            };
            this.render();
            return;
        }
        
        // Update cursor
        this.updateCursor();
        
        // Handle dragging
        if (this.isDragging && this.draggedElement && this.isMouseDown) {
            const deltaX = this.mouseX - this.lastMouseX;
            const deltaY = this.mouseY - this.lastMouseY;
            
            if (this.selectedElements.length > 1) {
                // Move all selected elements
                this.selectedElements.forEach(element => {
                    element.x += deltaX;
                    element.y += deltaY;
                    if (this.snapToGrid) {
                        element.x = Math.round(element.x / this.gridSize) * this.gridSize;
                        element.y = Math.round(element.y / this.gridSize) * this.gridSize;
                    }
                    this.updateConnectionPoints(element);
                });
            } else {
                this.draggedElement.x += deltaX;
                this.draggedElement.y += deltaY;
                if (this.snapToGrid) {
                    this.draggedElement.x = Math.round(this.draggedElement.x / this.gridSize) * this.gridSize;
                    this.draggedElement.y = Math.round(this.draggedElement.y / this.gridSize) * this.gridSize;
                }
                this.updateConnectionPoints(this.draggedElement);
            }
            
            this.updateConnections();
            this.render();
            this.updatePropertiesPanel();
        }
        
        this.lastMouseX = this.mouseX;
        this.lastMouseY = this.mouseY;
    }
    
    handleMouseUp(e) {
        if (this.isDragging) {
            this.saveState();
        }
        
        // Handle connection completion
        if (this.connectionMode && this.connectionStart) {
            const targetElement = this.getElementAt(this.mouseX, this.mouseY);
            
            if (targetElement && targetElement !== this.connectionStart.element) {
                this.createConnection(this.connectionStart.element, targetElement);
            }
            
            this.connectionMode = false;
            this.connectionStart = null;
            this.tempConnection = null;
        }
        
        this.isDragging = false;
        this.draggedElement = null;
        this.isMouseDown = false;
        this.isPanning = false;
        this.canvas.style.cursor = 'default';
        this.render();
    }
    
    handleClick(e) {
        // Click handling is done in mousedown for better responsiveness
    }
    
    handleDoubleClick(e) {
        const clickedElement = this.getElementAt(this.mouseX, this.mouseY);
        if (clickedElement) {
            document.getElementById('elementText').focus();
            document.getElementById('elementText').select();
        }
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(3, this.zoom * zoomFactor));
        
        // Zoom towards mouse position
        const zoomRatio = newZoom / this.zoom;
        this.panX = mouseX / newZoom - (mouseX / this.zoom - this.panX) * zoomRatio;
        this.panY = mouseY / newZoom - (mouseY / this.zoom - this.panY) * zoomRatio;
        
        this.zoom = newZoom;
        this.render();
        this.updateCanvasInfo();
    }
    
    handleKeyDown(e) {
        if (e.key === 'Delete' && this.selectedElements.length > 0) {
            this.deleteSelected();
        } else if (e.key === 'Escape') {
            this.clearSelection();
        } else if (e.key === ' ') {
            this.isPanning = true;
            this.canvas.style.cursor = 'grab';
            e.preventDefault();
        } else if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    this.redo();
                    break;
                case 'd':
                    e.preventDefault();
                    this.duplicateSelected();
                    break;
                case 'a':
                    e.preventDefault();
                    this.selectAll();
                    break;
                case 's':
                    e.preventDefault();
                    this.saveDiagram();
                    break;
            }
        }
        
        // Arrow key movement
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            this.moveSelectedElements(e.key, e.shiftKey ? 10 : 1);
        }
    }
    
    handleResize() {
        this.setupCanvas();
        this.render();
    }
    
    // Utility Methods
    getElementAt(x, y) {
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const element = this.elements[i];
            if (this.isPointInElement(x, y, element)) {
                return element;
            }
        }
        return null;
    }
    
    getConnectionPointAt(x, y) {
        if (!this.selectedElement) return null;
        
        for (let point of this.selectedElement.connectionPoints) {
            const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
            if (distance <= 8) {
                return point;
            }
        }
        return null;
    }
    
    isPointInElement(x, y, element) {
        switch (element.type) {
            case 'circle':
                const centerX = element.x + element.width / 2;
                const centerY = element.y + element.height / 2;
                const radius = Math.min(element.width, element.height) / 2;
                const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                return distance <= radius;
                
            case 'diamond':
            case 'decision':
                const diamondCenterX = element.x + element.width / 2;
                const diamondCenterY = element.y + element.height / 2;
                const relX = Math.abs(x - diamondCenterX);
                const relY = Math.abs(y - diamondCenterY);
                return (relX / (element.width / 2) + relY / (element.height / 2)) <= 1;
                
            default:
                return x >= element.x && x <= element.x + element.width &&
                       y >= element.y && y <= element.y + element.height;
        }
    }
    
    updateCursor() {
        const connectionPoint = this.getConnectionPointAt(this.mouseX, this.mouseY);
        if (connectionPoint && this.selectedElement) {
            this.canvas.style.cursor = 'crosshair';
        } else {
            const elementUnderMouse = this.getElementAt(this.mouseX, this.mouseY);
            if (elementUnderMouse && !this.isDragging && !this.connectionMode) {
                this.canvas.style.cursor = 'grab';
            } else if (!this.isDragging && !this.connectionMode && !this.isPanning) {
                this.canvas.style.cursor = 'default';
            }
        }
    }
    
    // Selection Management
    selectElement(element) {
        this.selectedElement = element;
        this.selectedElements = [element];
        this.updatePropertiesPanel();
        this.render();
    }
    
    toggleElementSelection(element) {
        const index = this.selectedElements.indexOf(element);
        if (index > -1) {
            this.selectedElements.splice(index, 1);
        } else {
            this.selectedElements.push(element);
        }
        
        this.selectedElement = this.selectedElements[this.selectedElements.length - 1] || null;
        this.updatePropertiesPanel();
        this.render();
    }
    
    clearSelection() {
        this.selectedElement = null;
        this.selectedElements = [];
        this.updatePropertiesPanel();
        this.render();
    }
    
    selectAll() {
        this.selectedElements = [...this.elements];
        this.selectedElement = this.selectedElements[this.selectedElements.length - 1] || null;
        this.updatePropertiesPanel();
        this.render();
    }
    
    // Connection Management
    createConnection(startElement, endElement) {
        // Find closest connection points
        let startPoint = startElement.connectionPoints[0];
        let endPoint = endElement.connectionPoints[0];
        let minDistance = Infinity;
        
        startElement.connectionPoints.forEach(sp => {
            endElement.connectionPoints.forEach(ep => {
                const distance = Math.sqrt((sp.x - ep.x) ** 2 + (sp.y - ep.y) ** 2);
                if (distance < minDistance) {
                    minDistance = distance;
                    startPoint = sp;
                    endPoint = ep;
                }
            });
        });
        
        const connection = {
            id: Date.now() + Math.random(),
            startElement: startElement,
            endElement: endElement,
            start: { ...startPoint },
            end: { ...endPoint },
            label: '',
            style: 'solid',
            arrowType: 'arrow',
            color: '#333333'
        };
        
        this.connections.push(connection);
        this.saveState();
        this.render();
    }
    
    updateConnections() {
        this.connections.forEach(connection => {
            // Update connection points when elements move
            const startElement = connection.startElement;
            const endElement = connection.endElement;
            
            if (startElement && endElement) {
                // Find closest points again
                let startPoint = startElement.connectionPoints[0];
                let endPoint = endElement.connectionPoints[0];
                let minDistance = Infinity;
                
                startElement.connectionPoints.forEach(sp => {
                    endElement.connectionPoints.forEach(ep => {
                        const distance = Math.sqrt((sp.x - ep.x) ** 2 + (sp.y - ep.y) ** 2);
                        if (distance < minDistance) {
                            minDistance = distance;
                            startPoint = sp;
                            endPoint = ep;
                        }
                    });
                });
                
                connection.start = { ...startPoint };
                connection.end = { ...endPoint };
            }
        });
    }
    
    // Rendering Methods
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(this.panX, this.panY);
        
        // Draw grid if visible
        if (this.gridVisible) {
            this.drawGrid();
        }
        
        // Draw connections first (behind elements)
        this.connections.forEach(connection => {
            this.drawConnection(connection);
        });
        
        // Draw elements
        this.elements.forEach(element => {
            if (this.isLayerVisible(element.layer)) {
                this.drawElement(element);
            }
        });
        
        // Draw selection outlines
        this.selectedElements.forEach(element => {
            this.drawSelection(element);
        });
        
        // Draw connection points for selected element
        if (this.selectedElement) {
            this.drawConnectionPoints(this.selectedElement);
        }
        
        // Draw temporary connection
        if (this.tempConnection) {
            this.drawTempConnection();
        }
        
        this.ctx.restore();
        
        this.updateCanvasInfo();
    }
    
    drawGrid() {
        const gridSize = this.gridSize;
        const width = this.canvas.width / this.zoom;
        const height = this.canvas.height / this.zoom;
        
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 0.5;
        this.ctx.globalAlpha = 0.5;
        
        this.ctx.beginPath();
        
        // Vertical lines
        for (let x = -this.panX % gridSize; x < width; x += gridSize) {
            this.ctx.moveTo(x, -this.panY);
            this.ctx.lineTo(x, height - this.panY);
        }
        
        // Horizontal lines
        for (let y = -this.panY % gridSize; y < height; y += gridSize) {
            this.ctx.moveTo(-this.panX, y);
            this.ctx.lineTo(width - this.panX, y);
        }
        
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
    }
    
    drawElement(element) {
        this.ctx.save();
        
        // Apply opacity
        this.ctx.globalAlpha = element.opacity / 100;
        
        // Apply rotation if needed
        if (element.rotation !== 0) {
            const centerX = element.x + element.width / 2;
            const centerY = element.y + element.height / 2;
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate((element.rotation * Math.PI) / 180);
            this.ctx.translate(-centerX, -centerY);
        }
        
        // Set styles
        this.ctx.fillStyle = element.fillColor;
        this.ctx.strokeStyle = element.borderColor;
        this.ctx.lineWidth = element.borderWidth;
        this.ctx.font = `${element.fontWeight} ${element.fontSize}px Arial`;
        this.ctx.textAlign = element.textAlign;
        this.ctx.textBaseline = 'middle';
        
        // Draw shape based on type
        switch (element.type) {
            case 'start':
                this.drawStartShape(element);
                break;
            case 'action':
                this.drawActionShape(element);
                break;
            case 'decision':
                this.drawDecisionShape(element);
                break;
            case 'end':
                this.drawEndShape(element);
                break;
            case 'timer':
                this.drawTimerShape(element);
                break;
            case 'participant':
                this.drawParticipantShape(element);
                break;
            case 'lifeline':
                this.drawLifelineShape(element);
                break;
            case 'message':
                this.drawMessageShape(element);
                break;
            case 'fragment':
                this.drawFragmentShape(element);
                break;
            case 'text':
                this.drawTextShape(element);
                break;
            case 'note':
                this.drawNoteShape(element);
                break;
            default:
                this.drawRectangleShape(element);
        }
        
        this.ctx.restore();
    }
    
    drawStartShape(element) {
        const radius = Math.min(element.width, element.height) / 4;
        
        this.ctx.beginPath();
        this.ctx.roundRect(element.x, element.y, element.width, element.height, radius);
        
        if (element.fillColor !== 'transparent') {
            this.ctx.fill();
        }
        if (element.borderColor !== 'transparent') {
            this.ctx.stroke();
        }
        
        // Draw start symbol
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(element.x + element.width / 2, element.y + element.height / 2, 8, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw text
        if (element.text) {
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(element.text, element.x + element.width / 2, element.y + element.height / 2 + 20);
        }
    }
    
    drawActionShape(element) {
        this.ctx.beginPath();
        this.ctx.rect(element.x, element.y, element.width, element.height);
        
        if (element.fillColor !== 'transparent') {
            this.ctx.fill();
        }
        if (element.borderColor !== 'transparent') {
            this.ctx.stroke();
        }
        
        // Draw text
        if (element.text) {
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(element.text, element.x + element.width / 2, element.y + element.height / 2);
        }
    }
    
    drawDecisionShape(element) {
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, element.y);
        this.ctx.lineTo(element.x + element.width, centerY);
        this.ctx.lineTo(centerX, element.y + element.height);
        this.ctx.lineTo(element.x, centerY);
        this.ctx.closePath();
        
        if (element.fillColor !== 'transparent') {
            this.ctx.fill();
        }
        if (element.borderColor !== 'transparent') {
            this.ctx.stroke();
        }
        
        // Draw text
        if (element.text) {
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(element.text, centerX, centerY);
        }
    }
    
    drawEndShape(element) {
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        const radius = Math.min(element.width, element.height) / 2;
        
        // Outer circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        
        if (element.fillColor !== 'transparent') {
            this.ctx.fill();
        }
        if (element.borderColor !== 'transparent') {
            this.ctx.stroke();
        }
        
        // Inner circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius - 8, 0, 2 * Math.PI);
        this.ctx.fillStyle = element.borderColor;
        this.ctx.fill();
        
        // Draw text below
        if (element.text) {
            this.ctx.fillStyle = element.borderColor;
            this.ctx.fillText(element.text, centerX, centerY + radius + 20);
        }
    }
    
    drawTimerShape(element) {
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        const radius = Math.min(element.width, element.height) / 2;
        
        // Circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        
        if (element.fillColor !== 'transparent') {
            this.ctx.fill();
        }
        if (element.borderColor !== 'transparent') {
            this.ctx.stroke();
        }
        
        // Clock hands
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(centerX, centerY - radius * 0.6);
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(centerX + radius * 0.4, centerY);
        this.ctx.stroke();
        
        // Draw text
        if (element.text) {
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(element.text, centerX, centerY + radius + 20);
        }
    }
    
    drawParticipantShape(element) {
        this.ctx.beginPath();
        this.ctx.rect(element.x, element.y, element.width, element.height);
        
        if (element.fillColor !== 'transparent') {
            this.ctx.fill();
        }
        if (element.borderColor !== 'transparent') {
            this.ctx.stroke();
        }
        
        // Draw text
        if (element.text) {
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(element.text, element.x + element.width / 2, element.y + element.height / 2);
        }
    }
    
    drawLifelineShape(element) {
        this.ctx.beginPath();
        this.ctx.rect(element.x, element.y, element.width, element.height);
        
        if (element.fillColor !== 'transparent') {
            this.ctx.fill();
        }
        if (element.borderColor !== 'transparent') {
            this.ctx.stroke();
        }
    }
    
    drawMessageShape(element) {
        this.ctx.beginPath();
        this.ctx.moveTo(element.x, element.y + element.height / 2);
        this.ctx.lineTo(element.x + element.width, element.y + element.height / 2);
        
        // Arrow head
        const headSize = 8;
        this.ctx.lineTo(element.x + element.width - headSize, element.y + element.height / 2 - headSize / 2);
        this.ctx.moveTo(element.x + element.width, element.y + element.height / 2);
        this.ctx.lineTo(element.x + element.width - headSize, element.y + element.height / 2 + headSize / 2);
        
        this.ctx.stroke();
        
        // Draw text
        if (element.text) {
            this.ctx.fillStyle = element.borderColor;
            this.ctx.fillText(element.text, element.x + element.width / 2, element.y + element.height / 2 - 10);
        }
    }
    
    drawFragmentShape(element) {
        this.ctx.beginPath();
        this.ctx.rect(element.x, element.y, element.width, element.height);
        
        if (element.fillColor !== 'transparent') {
            this.ctx.fill();
        }
        if (element.borderColor !== 'transparent') {
            this.ctx.stroke();
        }
        
        // Draw fragment label
        this.ctx.beginPath();
        this.ctx.rect(element.x, element.y, 40, 20);
        this.ctx.fillStyle = element.borderColor;
        this.ctx.fill();
        
        // Draw text
        if (element.text) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText(element.text, element.x + 20, element.y + 10);
        }
    }
    
    drawTextShape(element) {
        // Draw background if not transparent
        if (element.fillColor !== 'transparent') {
            this.ctx.beginPath();
            this.ctx.rect(element.x, element.y, element.width, element.height);
            this.ctx.fill();
        }
        
        // Draw text
        if (element.text) {
            this.ctx.fillStyle = element.borderColor !== 'transparent' ? element.borderColor : '#000000';
            this.ctx.fillText(element.text, element.x + element.width / 2, element.y + element.height / 2);
        }
    }
    
    drawNoteShape(element) {
        // Draw note with folded corner
        const cornerSize = 10;
        
        this.ctx.beginPath();
        this.ctx.moveTo(element.x, element.y);
        this.ctx.lineTo(element.x + element.width - cornerSize, element.y);
        this.ctx.lineTo(element.x + element.width, element.y + cornerSize);
        this.ctx.lineTo(element.x + element.width, element.y + element.height);
        this.ctx.lineTo(element.x, element.y + element.height);
        this.ctx.closePath();
        
        if (element.fillColor !== 'transparent') {
            this.ctx.fill();
        }
        if (element.borderColor !== 'transparent') {
            this.ctx.stroke();
        }
        
        // Draw folded corner
        this.ctx.beginPath();
        this.ctx.moveTo(element.x + element.width - cornerSize, element.y);
        this.ctx.lineTo(element.x + element.width - cornerSize, element.y + cornerSize);
        this.ctx.lineTo(element.x + element.width, element.y + cornerSize);
        this.ctx.stroke();
        
        // Draw text
        if (element.text) {
            this.ctx.fillStyle = '#333333';
            this.ctx.fillText(element.text, element.x + element.width / 2, element.y + element.height / 2);
        }
    }
    
    drawRectangleShape(element) {
        this.ctx.beginPath();
        this.ctx.rect(element.x, element.y, element.width, element.height);
        
        if (element.fillColor !== 'transparent') {
            this.ctx.fill();
        }
        if (element.borderColor !== 'transparent') {
            this.ctx.stroke();
        }
        
        // Draw text
        if (element.text) {
            this.ctx.fillStyle = '#333333';
            this.ctx.fillText(element.text, element.x + element.width / 2, element.y + element.height / 2);
        }
    }
    
    drawConnection(connection) {
        this.ctx.strokeStyle = connection.color;
        this.ctx.lineWidth = 2;
        
        if (connection.style === 'dashed') {
            this.ctx.setLineDash([5, 5]);
        } else {
            this.ctx.setLineDash([]);
        }
        
        this.ctx.beginPath();
        this.ctx.moveTo(connection.start.x, connection.start.y);
        this.ctx.lineTo(connection.end.x, connection.end.y);
        this.ctx.stroke();
        
        // Draw arrow head
        if (connection.arrowType === 'arrow') {
            const angle = Math.atan2(connection.end.y - connection.start.y, connection.end.x - connection.start.x);
            const headLength = 10;
            
            this.ctx.beginPath();
            this.ctx.moveTo(connection.end.x, connection.end.y);
            this.ctx.lineTo(
                connection.end.x - headLength * Math.cos(angle - Math.PI / 6),
                connection.end.y - headLength * Math.sin(angle - Math.PI / 6)
            );
            this.ctx.moveTo(connection.end.x, connection.end.y);
            this.ctx.lineTo(
                connection.end.x - headLength * Math.cos(angle + Math.PI / 6),
                connection.end.y - headLength * Math.sin(angle + Math.PI / 6)
            );
            this.ctx.stroke();
        }
        
        // Draw label
        if (connection.label) {
            const midX = (connection.start.x + connection.end.x) / 2;
            const midY = (connection.start.y + connection.end.y) / 2;
            
            this.ctx.fillStyle = '#333333';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(connection.label, midX, midY - 5);
        }
        
        this.ctx.setLineDash([]);
    }
    
    drawSelection(element) {
        this.ctx.strokeStyle = '#2196f3';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(element.x - 2, element.y - 2, element.width + 4, element.height + 4);
        this.ctx.setLineDash([]);
        
        // Draw resize handles
        const handles = [
            { x: element.x - 4, y: element.y - 4 },
            { x: element.x + element.width - 4, y: element.y - 4 },
            { x: element.x - 4, y: element.y + element.height - 4 },
            { x: element.x + element.width - 4, y: element.y + element.height - 4 }
        ];
        
        this.ctx.fillStyle = '#2196f3';
        handles.forEach(handle => {
            this.ctx.fillRect(handle.x, handle.y, 8, 8);
        });
    }
    
    drawConnectionPoints(element) {
        this.ctx.fillStyle = '#ff4444';
        element.connectionPoints.forEach(point => {
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }
    
    drawTempConnection() {
        if (!this.tempConnection) return;
        
        this.ctx.strokeStyle = '#2196f3';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.tempConnection.start.x, this.tempConnection.start.y);
        this.ctx.lineTo(this.tempConnection.end.x, this.tempConnection.end.y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    // Utility methods for the interface
    updateCanvasInfo() {
        const info = document.getElementById('canvasInfo');
        if (info) {
            info.textContent = `Elements: ${this.elements.length} | Connections: ${this.connections.length} | Zoom: ${Math.round(this.zoom * 100)}%`;
        }
    }
    
    updatePropertiesPanel() {
        // Implementation for updating properties panel
        const noSelection = document.getElementById('noSelection');
        const elementProperties = document.getElementById('elementProperties');
        
        if (this.selectedElement) {
            noSelection.style.display = 'none';
            elementProperties.style.display = 'block';
            
            // Update property values
            const fillColor = document.getElementById('fillColor');
            const borderColor = document.getElementById('borderColor');
            const elementText = document.getElementById('elementText');
            
            if (fillColor) fillColor.value = this.selectedElement.fillColor === 'transparent' ? '#ffffff' : this.selectedElement.fillColor;
            if (borderColor) borderColor.value = this.selectedElement.borderColor === 'transparent' ? '#000000' : this.selectedElement.borderColor;
            if (elementText) elementText.value = this.selectedElement.text;
        } else {
            noSelection.style.display = 'block';
            elementProperties.style.display = 'none';
        }
    }
    
    // Placeholder methods for missing functionality
    newDiagram() { console.log('New diagram'); }
    showImportModal() { console.log('Show import modal'); }
    saveDiagram() { console.log('Save diagram'); }
    showExportModal() { console.log('Show export modal'); }
    undo() { console.log('Undo'); }
    redo() { console.log('Redo'); }
    zoomIn() { this.zoom = Math.min(this.zoom * 1.2, 3); this.render(); }
    zoomOut() { this.zoom = Math.max(this.zoom / 1.2, 0.1); this.render(); }
    resetZoom() { this.zoom = 1; this.panX = 0; this.panY = 0; this.render(); }
    fitToScreen() { console.log('Fit to screen'); }
    switchDocument() { console.log('Switch document'); }
    showAddDocumentDialog() { console.log('Add document'); }
    toggleOutcomesPanel() { console.log('Toggle outcomes panel'); }
    toggleLayersPanel() { console.log('Toggle layers panel'); }
    toggleGrid() { this.gridVisible = !this.gridVisible; this.render(); }
    toggleSnap() { this.snapToGrid = !this.snapToGrid; }
    toggleGuides() { this.guidesVisible = !this.guidesVisible; }
    switchPropertyTab() { console.log('Switch property tab'); }
    updateSelectedElementProperty() { console.log('Update property'); }
    deleteSelected() { console.log('Delete selected'); }
    duplicateSelected() { console.log('Duplicate selected'); }
    bringToFront() { console.log('Bring to front'); }
    sendToBack() { console.log('Send to back'); }
    clearCanvas() { this.elements = []; this.connections = []; this.render(); }
    moveSelectedElements() { console.log('Move selected elements'); }
    isLayerVisible() { return true; }
    saveState() { console.log('Save state'); }
    createNewDocument() { console.log('Create new document'); }
    hideModal() { console.log('Hide modal'); }
    previewImport() { console.log('Preview import'); }
    confirmImport() { console.log('Confirm import'); }
    handleFileUpload() { console.log('Handle file upload'); }
    enablePreviewButton() { console.log('Enable preview button'); }
    confirmExport() { console.log('Confirm export'); }
    confirmMetadata() { console.log('Confirm metadata'); }
    skipMetadata() { console.log('Skip metadata'); }
    clearOutcomeFilters() { console.log('Clear outcome filters'); }
    addLayer() { console.log('Add layer'); }
    deleteLayer() { console.log('Delete layer'); }
}

// BDD Markdown Parser Class
class BDDMarkdownParser {
    constructor() {
        this.warnings = [];
    }
    
    parse(markdown, type = 'flow') {
        this.warnings = [];
        
        if (type === 'flow') {
            return this.parseFlowMarkdown(markdown);
        } else if (type === 'sequence') {
            return this.parseSequenceMarkdown(markdown);
        }
        
        return null;
    }
    
    parseFlowMarkdown(markdown) {
        // Implementation for parsing BDD flow markdown
        console.log('Parsing flow markdown');
        return {
            elements: [],
            connections: [],
            metadata: {}
        };
    }
    
    parseSequenceMarkdown(markdown) {
        // Implementation for parsing BDD sequence markdown
        console.log('Parsing sequence markdown');
        return {
            elements: [],
            connections: [],
            metadata: {}
        };
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BDDDiagrammingInterface();
});
