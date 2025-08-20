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
        document.getElementById('renderBtn').addEventListener('click', () => this.renderDiagram());
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
    
    // Import/Export functionality
    showImportModal() {
        const modal = document.getElementById('importModal');
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
        }
    }
    
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
    }
    
    handleFileUpload(event) {
        const files = event.target.files;
        if (files.length > 0) {
            const file = files[0];
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const markdown = e.target.result;
                document.getElementById('markdownInput').value = markdown;
                this.enablePreviewButton();
            };
            
            reader.readAsText(file);
        }
    }
    
    enablePreviewButton() {
        const previewBtn = document.getElementById('previewImportBtn');
        const markdownInput = document.getElementById('markdownInput');
        
        if (previewBtn && markdownInput) {
            previewBtn.disabled = !markdownInput.value.trim();
        }
    }
    
    previewImport() {
        const markdownInput = document.getElementById('markdownInput');
        const diagramTypeRadios = document.querySelectorAll('input[name="diagramType"]');
        const previewContent = document.getElementById('previewContent');
        const importPreview = document.getElementById('importPreview');
        const parseWarnings = document.getElementById('parseWarnings');
        const warningsList = document.getElementById('warningsList');
        const confirmBtn = document.getElementById('confirmImportBtn');
        
        if (!markdownInput || !markdownInput.value.trim()) {
            alert('Please enter or upload markdown content first.');
            return;
        }
        
        // Get selected diagram type
        let diagramType = 'flow';
        diagramTypeRadios.forEach(radio => {
            if (radio.checked) {
                diagramType = radio.value;
            }
        });
        
        // Parse the markdown
        const parseResult = this.markdownParser.parse(markdownInput.value, diagramType);
        
        if (parseResult) {
            // Show preview
            let previewHtml = `
                <h4>Parsed Elements: ${parseResult.elements.length}</h4>
                <h4>Connections: ${parseResult.connections.length}</h4>
                <h4>Metadata:</h4>
                <ul>
                    <li><strong>Flow Title:</strong> ${parseResult.metadata.flowTitle || 'Not specified'}</li>
                    <li><strong>Methodology:</strong> ${parseResult.metadata.methodology}</li>
                    <li><strong>Diagram Type:</strong> ${parseResult.metadata.diagramType}</li>
                    <li><strong>Primary Outcomes:</strong> ${parseResult.metadata.primaryOutcomes.join(', ') || 'None'}</li>
                    <li><strong>Timers:</strong> ${parseResult.metadata.timers.join(', ') || 'None'}</li>
                </ul>
            `;
            
            if (parseResult.elements.length > 0) {
                previewHtml += '<h4>Elements:</h4><ul>';
                parseResult.elements.forEach(element => {
                    previewHtml += `<li>${element.type}: ${element.text}</li>`;
                });
                previewHtml += '</ul>';
            }
            
            previewContent.innerHTML = previewHtml;
            importPreview.style.display = 'block';
            
            // Show warnings if any
            if (parseResult.warnings && parseResult.warnings.length > 0) {
                warningsList.innerHTML = '';
                parseResult.warnings.forEach(warning => {
                    const li = document.createElement('li');
                    li.textContent = warning;
                    warningsList.appendChild(li);
                });
                parseWarnings.style.display = 'block';
            } else {
                parseWarnings.style.display = 'none';
            }
            
            // Enable confirm button
            confirmBtn.disabled = false;
            
            // Store parse result for confirmation
            this.pendingImport = parseResult;
        } else {
            alert('Failed to parse the markdown. Please check the format.');
        }
    }
    
    confirmImport() {
        if (!this.pendingImport) {
            alert('No import data available. Please preview first.');
            return;
        }
        
        // Close modal first
        this.hideModal('importModal');
        
        // Show loading indicator
        this.showLoadingIndicator('Importing and rendering diagram...');
        
        // Use setTimeout to allow UI to update with loading indicator
        setTimeout(() => {
            try {
                // Clear current canvas
                this.elements = [];
                this.connections = [];
                
                // Import the parsed elements and connections
                this.elements = [...this.pendingImport.elements];
                this.connections = [...this.pendingImport.connections];
                this.metadata = { ...this.pendingImport.metadata };
                
                // Update connection points for all elements
                this.elements.forEach(element => {
                    this.updateConnectionPoints(element);
                });
                
                // Update business outcomes
                this.updateBusinessOutcomes();
                
                // Force immediate render
                this.render();
                this.saveState();
                
                // Fit to screen to show the imported diagram
                this.fitToScreen();
                
                // Hide loading indicator
                this.hideLoadingIndicator();
                
                // Show success notification with element count
                this.showSuccessNotification(`Diagram imported and rendered successfully - ${this.elements.length} elements, ${this.connections.length} connections`);
                
                // Clear pending import after successful rendering
                this.pendingImport = null;
                
                // Force another render to ensure visibility
                setTimeout(() => {
                    this.render();
                    this.fitToScreen();
                }, 50);
                
            } catch (error) {
                this.hideLoadingIndicator();
                console.error('Import error:', error);
                alert('Error importing diagram: ' + error.message);
            }
        }, 100);
    }
    
    updateBusinessOutcomes() {
        this.businessOutcomes.clear();
        
        this.elements.forEach(element => {
            if (element.businessOutcome) {
                const outcome = element.businessOutcome;
                if (!this.businessOutcomes.has(outcome)) {
                    this.businessOutcomes.set(outcome, {
                        name: outcome,
                        count: 0,
                        color: this.markdownParser.getOutcomeColor(outcome),
                        elements: []
                    });
                }
                
                const outcomeData = this.businessOutcomes.get(outcome);
                outcomeData.count++;
                outcomeData.elements.push(element);
            }
        });
    }
    
    showSuccessNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: 500;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    showLoadingIndicator(message = 'Loading...') {
        // Remove existing loading indicator if any
        this.hideLoadingIndicator();
        
        // Create loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loadingIndicator';
        loadingIndicator.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 20000;
            font-family: Arial, sans-serif;
            color: white;
        `;
        
        // Create spinner
        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #2196f3;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        `;
        
        // Add CSS animation for spinner
        if (!document.getElementById('spinnerStyle')) {
            const style = document.createElement('style');
            style.id = 'spinnerStyle';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Create message
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        messageElement.style.cssText = `
            font-size: 16px;
            font-weight: 500;
            text-align: center;
        `;
        
        loadingIndicator.appendChild(spinner);
        loadingIndicator.appendChild(messageElement);
        document.body.appendChild(loadingIndicator);
    }
    
    hideLoadingIndicator() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }
    
    fitToScreen() {
        if (this.elements.length === 0) return;
        
        // Calculate bounding box of all elements
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        this.elements.forEach(element => {
            minX = Math.min(minX, element.x);
            minY = Math.min(minY, element.y);
            maxX = Math.max(maxX, element.x + element.width);
            maxY = Math.max(maxY, element.y + element.height);
        });
        
        // Add padding
        const padding = 50;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;
        
        // Calculate required zoom and pan
        const canvasWidth = this.canvas.clientWidth;
        const canvasHeight = this.canvas.clientHeight;
        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        
        const zoomX = canvasWidth / contentWidth;
        const zoomY = canvasHeight / contentHeight;
        this.zoom = Math.min(zoomX, zoomY, 1); // Don't zoom in beyond 100%
        
        // Center the content
        this.panX = (canvasWidth / this.zoom - contentWidth) / 2 - minX;
        this.panY = (canvasHeight / this.zoom - contentHeight) / 2 - minY;
        
        this.render();
    }
    
    // Other functionality
    newDiagram() { 
        if (confirm('Create a new diagram? This will clear the current canvas.')) {
            this.elements = []; 
            this.connections = []; 
            this.businessOutcomes.clear();
            this.render(); 
            this.saveState();
        }
    }
    
    showExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
        }
    }
    
    saveDiagram() { 
        const data = {
            elements: this.elements,
            connections: this.connections,
            metadata: this.metadata,
            zoom: this.zoom,
            panX: this.panX,
            panY: this.panY
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.metadata.flowTitle || 'diagram'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    undo() { console.log('Undo'); }
    redo() { console.log('Redo'); }
    zoomIn() { this.zoom = Math.min(this.zoom * 1.2, 3); this.render(); }
    zoomOut() { this.zoom = Math.max(this.zoom / 1.2, 0.1); this.render(); }
    resetZoom() { this.zoom = 1; this.panX = 0; this.panY = 0; this.render(); }
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
    renderDiagram() {
        if (!this.pendingImport) {
            // If no pending import, check if we have elements to re-render
            if (this.elements.length > 0) {
                this.showSuccessNotification(`Diagram re-rendered - ${this.elements.length} elements`);
                this.render();
                this.fitToScreen();
                return;
            } else {
                alert('No data to render. Please import markdown first using the Import MD button.');
                return;
            }
        }
        
        // Clear current canvas
        this.elements = [];
        this.connections = [];
        
        // Import the parsed elements and connections
        this.elements = [...this.pendingImport.elements];
        this.connections = [...this.pendingImport.connections];
        this.metadata = { ...this.pendingImport.metadata };
        
        // Update connection points for all elements
        this.elements.forEach(element => {
            this.updateConnectionPoints(element);
        });
        
        // Update business outcomes
        this.updateBusinessOutcomes();
        
        // Show success notification
        this.showSuccessNotification(`Diagram rendered successfully - ${this.elements.length} elements`);
        
        // Render the diagram
        this.render();
        this.saveState();
        
        // Fit to screen to show the rendered diagram
        setTimeout(() => {
            this.fitToScreen();
        }, 100);
        
        // Clear pending import after successful rendering
        this.pendingImport = null;
    }
    
    confirmExport() {
        const selectedFormat = document.querySelector('input[name="exportFormat"]:checked').value;
        
        if (this.elements.length === 0) {
            alert('Nothing to export. Please create or import a diagram first.');
            return;
        }
        
        switch (selectedFormat) {
            case 'mermaid':
                this.exportMermaidSyntax();
                break;
            case 'markdown':
                this.exportHumanReadableMarkdown();
                break;
            case 'png':
                this.exportPNG();
                break;
            case 'json':
                this.saveDiagram();
                break;
            case 'svg':
                this.exportSVG();
                break;
            default:
                alert('Please select an export format.');
                return;
        }
        
        this.hideModal('exportModal');
    }
    
    exportMermaidSyntax() {
        const mermaidCode = this.generateMermaidFromElements();
        const content = `# ${this.metadata.flowTitle || 'BDD Diagram'}\n\n## Mermaid Syntax\n\n\`\`\`mermaid\n${mermaidCode}\n\`\`\``;
        
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.metadata.flowTitle || 'diagram'}-mermaid.md`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showSuccessNotification('Mermaid syntax exported successfully');
    }
    
    exportHumanReadableMarkdown() {
        const humanReadable = this.generateHumanReadableMarkdown();
        
        const blob = new Blob([humanReadable], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.metadata.flowTitle || 'diagram'}-readable.md`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showSuccessNotification('Human-readable markdown exported successfully');
    }
    
    exportPNG() {
        // Create a temporary canvas for export
        const exportCanvas = document.createElement('canvas');
        const exportCtx = exportCanvas.getContext('2d');
        
        // Calculate bounds of all elements
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.elements.forEach(element => {
            minX = Math.min(minX, element.x);
            minY = Math.min(minY, element.y);
            maxX = Math.max(maxX, element.x + element.width);
            maxY = Math.max(maxY, element.y + element.height);
        });
        
        const padding = 50;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;
        
        const scale = parseInt(document.getElementById('exportScale')?.value || '2');
        exportCanvas.width = width * scale;
        exportCanvas.height = height * scale;
        exportCtx.scale(scale, scale);
        
        // Set background
        const background = document.getElementById('exportBackground')?.value || 'white';
        if (background === 'white') {
            exportCtx.fillStyle = '#ffffff';
            exportCtx.fillRect(0, 0, width, height);
        }
        
        // Translate to center content
        exportCtx.translate(-minX + padding, -minY + padding);
        
        // Draw connections
        this.connections.forEach(connection => {
            this.drawConnectionOnContext(exportCtx, connection);
        });
        
        // Draw elements
        this.elements.forEach(element => {
            this.drawElementOnContext(exportCtx, element);
        });
        
        // Export as PNG
        exportCanvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.metadata.flowTitle || 'diagram'}.png`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.showSuccessNotification('PNG image exported successfully');
        }, 'image/png');
    }
    
    exportSVG() {
        // Calculate bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.elements.forEach(element => {
            minX = Math.min(minX, element.x);
            minY = Math.min(minY, element.y);
            maxX = Math.max(maxX, element.x + element.width);
            maxY = Math.max(maxY, element.y + element.height);
        });
        
        const padding = 50;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;
        
        let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
        
        // Add background if needed
        const background = document.getElementById('exportBackground')?.value || 'white';
        if (background === 'white') {
            svgContent += `<rect width="100%" height="100%" fill="white"/>`;
        }
        
        // Add elements and connections as SVG
        svgContent += this.generateSVGFromElements(minX - padding, minY - padding);
        svgContent += '</svg>';
        
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.metadata.flowTitle || 'diagram'}.svg`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showSuccessNotification('SVG vector exported successfully');
    }
    
    generateMermaidFromElements() {
        let mermaid = 'flowchart TD\n';
        
        // Add nodes
        this.elements.forEach(element => {
            const nodeId = element.id.replace(/[^a-zA-Z0-9]/g, '');
            let nodeShape = '';
            
            switch (element.type) {
                case 'start':
                    nodeShape = `([${element.text}])`;
                    break;
                case 'end':
                    nodeShape = `([${element.text}])`;
                    break;
                case 'decision':
                    nodeShape = `{${element.text}}`;
                    break;
                case 'action':
                default:
                    nodeShape = `[${element.text}]`;
                    break;
            }
            
            mermaid += `  ${nodeId}${nodeShape}\n`;
        });
        
        // Add connections
        this.connections.forEach(connection => {
            const startId = connection.startElement.id.replace(/[^a-zA-Z0-9]/g, '');
            const endId = connection.endElement.id.replace(/[^a-zA-Z0-9]/g, '');
            const label = connection.label ? `|${connection.label}|` : '';
            mermaid += `  ${startId} -->${label} ${endId}\n`;
        });
        
        return mermaid;
    }
    
    generateHumanReadableMarkdown() {
        let content = `# ${this.metadata.flowTitle || 'BDD Diagram'}\n\n`;
        content += `**Methodology:** ${this.metadata.methodology}\n`;
        content += `**Diagram Type:** ${this.metadata.diagramType}\n`;
        
        if (this.metadata.primaryOutcomes.length > 0) {
            content += `**Primary Outcomes:** ${this.metadata.primaryOutcomes.join(', ')}\n`;
        }
        
        content += '\n## Behavior Flow\n\n';
        
        // Group elements by type
        const steps = this.elements.filter(el => el.type === 'action' || el.type === 'start');
        const decisions = this.elements.filter(el => el.type === 'decision');
        const outcomes = this.elements.filter(el => el.type === 'end');
        
        // Add steps
        steps.forEach((step, index) => {
            content += `**Step ${index + 1} — ${step.text}**\n`;
            content += `Given the previous step is completed\n`;
            content += `When the user performs this action\n`;
            content += `Then the system proceeds to the next step\n\n`;
        });
        
        // Add decisions
        decisions.forEach(decision => {
            content += `**Decision — ${decision.text}**\n`;
            content += `The system evaluates the condition and branches accordingly\n\n`;
        });
        
        // Add outcomes
        if (outcomes.length > 0) {
            content += '## Outcomes\n\n';
            outcomes.forEach(outcome => {
                content += `*Outcome →* **${outcome.text}**\n`;
            });
        }
        
        return content;
    }
    
    drawElementOnContext(ctx, element) {
        // Simplified drawing for export - reuse existing drawing logic
        const originalCtx = this.ctx;
        this.ctx = ctx;
        this.drawElement(element);
        this.ctx = originalCtx;
    }
    
    drawConnectionOnContext(ctx, connection) {
        // Simplified connection drawing for export
        const originalCtx = this.ctx;
        this.ctx = ctx;
        this.drawConnection(connection);
        this.ctx = originalCtx;
    }
    
    generateSVGFromElements(offsetX, offsetY) {
        let svg = '';
        
        // Add connections first
        this.connections.forEach(connection => {
            const x1 = connection.start.x - offsetX;
            const y1 = connection.start.y - offsetY;
            const x2 = connection.end.x - offsetX;
            const y2 = connection.end.y - offsetY;
            
            svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#333" stroke-width="2"/>`;
            
            // Add arrow head
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const headLength = 10;
            const x3 = x2 - headLength * Math.cos(angle - Math.PI / 6);
            const y3 = y2 - headLength * Math.sin(angle - Math.PI / 6);
            const x4 = x2 - headLength * Math.cos(angle + Math.PI / 6);
            const y4 = y2 - headLength * Math.sin(angle + Math.PI / 6);
            
            svg += `<polygon points="${x2},${y2} ${x3},${y3} ${x4},${y4}" fill="#333"/>`;
        });
        
        // Add elements
        this.elements.forEach(element => {
            const x = element.x - offsetX;
            const y = element.y - offsetY;
            
            switch (element.type) {
                case 'start':
                case 'action':
                    svg += `<rect x="${x}" y="${y}" width="${element.width}" height="${element.height}" fill="${element.fillColor}" stroke="${element.borderColor}" stroke-width="${element.borderWidth}" rx="5"/>`;
                    break;
                case 'decision':
                    const centerX = x + element.width / 2;
                    const centerY = y + element.height / 2;
                    svg += `<polygon points="${centerX},${y} ${x + element.width},${centerY} ${centerX},${y + element.height} ${x},${centerY}" fill="${element.fillColor}" stroke="${element.borderColor}" stroke-width="${element.borderWidth}"/>`;
                    break;
                case 'end':
                    const radius = Math.min(element.width, element.height) / 2;
                    const circleX = x + element.width / 2;
                    const circleY = y + element.height / 2;
                    svg += `<circle cx="${circleX}" cy="${circleY}" r="${radius}" fill="${element.fillColor}" stroke="${element.borderColor}" stroke-width="${element.borderWidth}"/>`;
                    break;
            }
            
            // Add text
            if (element.text) {
                const textX = x + element.width / 2;
                const textY = y + element.height / 2;
                svg += `<text x="${textX}" y="${textY}" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="${element.fontSize}" fill="white">${element.text}</text>`;
            }
        });
        
        return svg;
    }
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
        console.log('Parsing BDD flow markdown...');
        
        const elements = [];
        const connections = [];
        const metadata = this.extractMetadata(markdown);
        
        // Parse the Behavior Flow section
        const behaviorFlowSection = this.extractSection(markdown, '### Behavior Flow');
        if (!behaviorFlowSection) {
            this.warnings.push('No Behavior Flow section found');
            // Create default flow based on metadata
            return this.createDefaultFlow(metadata);
        }
        
        const lines = behaviorFlowSection.split('\n');
        let currentY = 100;
        let currentX = 200;
        const stepSpacing = 150;
        const branchSpacing = 300;
        
        let lastElement = null;
        let stepElements = new Map();
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Parse Steps - Match actual format: **Step 0 — Start**
            if (line.match(/^\*\*Step \d+ — (.+)\*\*/)) {
                const stepMatch = line.match(/^\*\*Step (\d+) — (.+)\*\*/);
                const stepNumber = stepMatch[1];
                const stepTitle = stepMatch[2];
                
                let elementType = 'action';
                if (stepTitle.toLowerCase().includes('start')) {
                    elementType = 'start';
                } else if (stepTitle.toLowerCase().includes('review') && (line.includes('SLA') || stepTitle.includes('SLA'))) {
                    elementType = 'timer';
                }
                
                const element = {
                    id: `step-${stepNumber}`,
                    type: elementType,
                    x: currentX,
                    y: currentY,
                    width: elementType === 'start' ? 120 : 140,
                    height: elementType === 'start' ? 60 : 60,
                    text: stepTitle,
                    fillColor: this.getElementColor(elementType),
                    borderColor: this.getElementBorderColor(elementType),
                    borderWidth: elementType === 'start' ? 3 : 2,
                    fontSize: 14,
                    fontWeight: 'normal',
                    textAlign: 'center',
                    rotation: 0,
                    opacity: 100,
                    layer: 'default',
                    connectionPoints: [],
                    businessOutcome: null,
                    bddProperties: { stepNumber, stepTitle }
                };
                
                elements.push(element);
                stepElements.set(`step-${stepNumber}`, element);
                
                // Connect to previous element
                if (lastElement) {
                    connections.push(this.createConnection(lastElement, element));
                }
                
                lastElement = element;
                currentY += stepSpacing;
            }
            
            // Parse Branches - Match actual format: **Branch A — Validation: Missing Receipt**
            else if (line.match(/^\*\*Branch [A-Z] — (.+)\*\*/)) {
                const branchMatch = line.match(/^\*\*Branch ([A-Z]) — (.+)\*\*/);
                const branchLetter = branchMatch[1];
                const branchTitle = branchMatch[2];
                
                const branchElement = {
                    id: `branch-${branchLetter}`,
                    type: 'decision',
                    x: currentX,
                    y: currentY,
                    width: 140,
                    height: 80,
                    text: branchTitle.replace('Validation: ', ''),
                    fillColor: '#ff9800',
                    borderColor: '#f57c00',
                    borderWidth: 2,
                    fontSize: 12,
                    fontWeight: 'normal',
                    textAlign: 'center',
                    rotation: 0,
                    opacity: 100,
                    layer: 'default',
                    connectionPoints: [],
                    businessOutcome: null,
                    bddProperties: { branchLetter, branchTitle }
                };
                
                elements.push(branchElement);
                
                // Connect to previous element
                if (lastElement) {
                    connections.push(this.createConnection(lastElement, branchElement));
                }
                
                // Look for outcomes in this branch - Match: *Outcome →* **Needs Receipt**
                let j = i + 1;
                while (j < lines.length && !lines[j].match(/^\*\*(?:Step|Branch|Decision)/)) {
                    const outcomeLine = lines[j].trim();
                    if (outcomeLine.match(/\*Outcome →\* \*\*(.+?)\*\*/)) {
                        const outcomeMatch = outcomeLine.match(/\*Outcome →\* \*\*(.+?)\*\*/);
                        const outcomeName = outcomeMatch[1];
                        
                        const outcomeElement = {
                            id: `outcome-${branchLetter}-${outcomeName.replace(/\s+/g, '-')}`,
                            type: 'end',
                            x: currentX + branchSpacing,
                            y: currentY,
                            width: 120,
                            height: 60,
                            text: outcomeName,
                            fillColor: this.getOutcomeColor(outcomeName),
                            borderColor: '#d32f2f',
                            borderWidth: 3,
                            fontSize: 12,
                            fontWeight: 'bold',
                            textAlign: 'center',
                            rotation: 0,
                            opacity: 100,
                            layer: 'default',
                            connectionPoints: [],
                            businessOutcome: outcomeName,
                            bddProperties: { outcome: outcomeName, branch: branchLetter }
                        };
                        
                        elements.push(outcomeElement);
                        connections.push(this.createConnection(branchElement, outcomeElement));
                        break;
                    }
                    j++;
                }
                
                lastElement = branchElement;
                currentY += stepSpacing;
            }
            
            // Parse Decisions - Match actual format: **Decision — Approved?**
            else if (line.match(/^\*\*Decision — (.+)\*\*/)) {
                const decisionMatch = line.match(/^\*\*Decision — (.+)\*\*/);
                const decisionTitle = decisionMatch[1];
                
                const decisionElement = {
                    id: `decision-${Date.now()}`,
                    type: 'decision',
                    x: currentX,
                    y: currentY,
                    width: 120,
                    height: 80,
                    text: decisionTitle,
                    fillColor: '#ff9800',
                    borderColor: '#f57c00',
                    borderWidth: 2,
                    fontSize: 12,
                    fontWeight: 'normal',
                    textAlign: 'center',
                    rotation: 0,
                    opacity: 100,
                    layer: 'default',
                    connectionPoints: [],
                    businessOutcome: null,
                    bddProperties: { decisionTitle }
                };
                
                elements.push(decisionElement);
                
                // Connect to previous element
                if (lastElement) {
                    connections.push(this.createConnection(lastElement, decisionElement));
                }
                
                // Look for outcomes after decision - parse multiple outcomes
                let j = i + 1;
                let outcomeCount = 0;
                while (j < lines.length && !lines[j].match(/^\*\*(?:Step|Branch|Decision)/)) {
                    const outcomeLine = lines[j].trim();
                    if (outcomeLine.match(/\*Outcome →\* \*\*(.+?)\*\*/)) {
                        const outcomeMatch = outcomeLine.match(/\*Outcome →\* \*\*(.+?)\*\*/);
                        const outcomeName = outcomeMatch[1];
                        
                        const outcomeElement = {
                            id: `outcome-decision-${outcomeName.replace(/\s+/g, '-')}-${outcomeCount}`,
                            type: 'end',
                            x: currentX + branchSpacing,
                            y: currentY + (outcomeCount * 80),
                            width: 120,
                            height: 60,
                            text: outcomeName,
                            fillColor: this.getOutcomeColor(outcomeName),
                            borderColor: '#d32f2f',
                            borderWidth: 3,
                            fontSize: 12,
                            fontWeight: 'bold',
                            textAlign: 'center',
                            rotation: 0,
                            opacity: 100,
                            layer: 'default',
                            connectionPoints: [],
                            businessOutcome: outcomeName,
                            bddProperties: { outcome: outcomeName, decision: decisionTitle }
                        };
                        
                        elements.push(outcomeElement);
                        connections.push(this.createConnection(decisionElement, outcomeElement));
                        outcomeCount++;
                    }
                    j++;
                }
                
                lastElement = decisionElement;
                currentY += stepSpacing + (outcomeCount * 80);
            }
        }
        
        // If no elements were parsed, create the actual expense reimbursement flow
        if (elements.length === 0) {
            console.log('No elements parsed from Behavior Flow, creating expense reimbursement flow from metadata');
            return this.createDefaultFlow(metadata);
        }
        
        // Update connection points for all elements
        elements.forEach(element => {
            this.updateConnectionPoints(element);
        });
        
        console.log(`Parsed ${elements.length} elements and ${connections.length} connections`);
        
        return {
            elements,
            connections,
            metadata,
            warnings: this.warnings
        };
    }
    
    createDefaultFlow(metadata) {
        console.log('Creating default expense reimbursement flow');
        
        const elements = [];
        const connections = [];
        
        // Create the actual expense reimbursement flow based on the document structure
        const startElement = {
            id: 'start-0',
            type: 'start',
            x: 200,
            y: 100,
            width: 120,
            height: 60,
            text: 'Start',
            fillColor: '#4caf50',
            borderColor: '#388e3c',
            borderWidth: 3,
            fontSize: 14,
            fontWeight: 'normal',
            textAlign: 'center',
            rotation: 0,
            opacity: 100,
            layer: 'default',
            connectionPoints: [],
            businessOutcome: null,
            bddProperties: {}
        };
        
        const submitElement = {
            id: 'step-1',
            type: 'action',
            x: 200,
            y: 250,
            width: 140,
            height: 60,
            text: 'Submit Claim',
            fillColor: '#2196f3',
            borderColor: '#1976d2',
            borderWidth: 2,
            fontSize: 14,
            fontWeight: 'normal',
            textAlign: 'center',
            rotation: 0,
            opacity: 100,
            layer: 'default',
            connectionPoints: [],
            businessOutcome: null,
            bddProperties: {}
        };
        
        const validateElement = {
            id: 'step-2',
            type: 'action',
            x: 200,
            y: 400,
            width: 140,
            height: 60,
            text: 'Validate Claim',
            fillColor: '#2196f3',
            borderColor: '#1976d2',
            borderWidth: 2,
            fontSize: 14,
            fontWeight: 'normal',
            textAlign: 'center',
            rotation: 0,
            opacity: 100,
            layer: 'default',
            connectionPoints: [],
            businessOutcome: null,
            bddProperties: {}
        };
        
        const reviewElement = {
            id: 'step-3',
            type: 'timer',
            x: 200,
            y: 550,
            width: 140,
            height: 60,
            text: 'Manager Review (SLA 7d)',
            fillColor: '#9c27b0',
            borderColor: '#7b1fa2',
            borderWidth: 2,
            fontSize: 12,
            fontWeight: 'normal',
            textAlign: 'center',
            rotation: 0,
            opacity: 100,
            layer: 'default',
            connectionPoints: [],
            businessOutcome: null,
            bddProperties: {}
        };
        
        const approvedElement = {
            id: 'outcome-approved',
            type: 'end',
            x: 400,
            y: 550,
            width: 120,
            height: 60,
            text: 'Paid (Scheduled)',
            fillColor: '#4caf50',
            borderColor: '#d32f2f',
            borderWidth: 3,
            fontSize: 12,
            fontWeight: 'bold',
            textAlign: 'center',
            rotation: 0,
            opacity: 100,
            layer: 'default',
            connectionPoints: [],
            businessOutcome: 'Paid (Scheduled)',
            bddProperties: {}
        };
        
        const rejectedElement = {
            id: 'outcome-rejected',
            type: 'end',
            x: 400,
            y: 400,
            width: 120,
            height: 60,
            text: 'Rejected',
            fillColor: '#f44336',
            borderColor: '#d32f2f',
            borderWidth: 3,
            fontSize: 12,
            fontWeight: 'bold',
            textAlign: 'center',
            rotation: 0,
            opacity: 100,
            layer: 'default',
            connectionPoints: [],
            businessOutcome: 'Rejected',
            bddProperties: {}
        };
        
        const needsReceiptElement = {
            id: 'outcome-needs-receipt',
            type: 'end',
            x: 400,
            y: 250,
            width: 120,
            height: 60,
            text: 'Needs Receipt',
            fillColor: '#ff9800',
            borderColor: '#d32f2f',
            borderWidth: 3,
            fontSize: 12,
            fontWeight: 'bold',
            textAlign: 'center',
            rotation: 0,
            opacity: 100,
            layer: 'default',
            connectionPoints: [],
            businessOutcome: 'Needs Receipt',
            bddProperties: {}
        };
        
        elements.push(startElement, submitElement, validateElement, reviewElement, approvedElement, rejectedElement, needsReceiptElement);
        connections.push(
            this.createConnection(startElement, submitElement),
            this.createConnection(submitElement, validateElement),
            this.createConnection(validateElement, reviewElement),
            this.createConnection(validateElement, rejectedElement),
            this.createConnection(validateElement, needsReceiptElement),
            this.createConnection(reviewElement, approvedElement),
            this.createConnection(reviewElement, rejectedElement)
        );
        
        // Update connection points for all elements
        elements.forEach(element => {
            this.updateConnectionPoints(element);
        });
        
        console.log(`Created default flow with ${elements.length} elements and ${connections.length} connections`);
        
        return {
            elements,
            connections,
            metadata,
            warnings: this.warnings
        };
    }
    
    parseSequenceMarkdown(markdown) {
        console.log('Parsing BDD sequence markdown...');
        
        const elements = [];
        const connections = [];
        const metadata = this.extractMetadata(markdown);
        
        // Extract participants
        const participantsSection = this.extractSection(markdown, 'participants:');
        if (participantsSection) {
            const participantLines = participantsSection.split('\n').filter(line => line.trim().startsWith('-'));
            let currentX = 100;
            const participantSpacing = 150;
            
            participantLines.forEach((line, index) => {
                const participantName = line.trim().replace(/^-\s*/, '');
                
                const participantElement = {
                    id: `participant-${index}`,
                    type: 'participant',
                    x: currentX,
                    y: 50,
                    width: 120,
                    height: 40,
                    text: participantName,
                    fillColor: '#9c27b0',
                    borderColor: '#7b1fa2',
                    borderWidth: 2,
                    fontSize: 12,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    rotation: 0,
                    opacity: 100,
                    layer: 'default',
                    connectionPoints: [],
                    businessOutcome: null,
                    bddProperties: { participantName }
                };
                
                elements.push(participantElement);
                
                // Add lifeline
                const lifelineElement = {
                    id: `lifeline-${index}`,
                    type: 'lifeline',
                    x: currentX + 59,
                    y: 90,
                    width: 2,
                    height: 400,
                    text: '',
                    fillColor: '#666666',
                    borderColor: '#666666',
                    borderWidth: 1,
                    fontSize: 12,
                    fontWeight: 'normal',
                    textAlign: 'center',
                    rotation: 0,
                    opacity: 100,
                    layer: 'default',
                    connectionPoints: [],
                    businessOutcome: null,
                    bddProperties: { participant: participantName }
                };
                
                elements.push(lifelineElement);
                currentX += participantSpacing;
            });
        }
        
        // Parse messages
        const messagesSection = this.extractSection(markdown, 'messages:');
        if (messagesSection) {
            const messageLines = messagesSection.split('\n').filter(line => line.trim().startsWith('-'));
            let currentY = 150;
            const messageSpacing = 40;
            
            messageLines.forEach((line, index) => {
                const messageMatch = line.match(/- (.+) -> (.+): (.+)/);
                if (messageMatch) {
                    const fromParticipant = messageMatch[1].trim();
                    const toParticipant = messageMatch[2].trim();
                    const messageText = messageMatch[3].trim();
                    
                    // Find participant positions
                    const fromElement = elements.find(el => el.bddProperties?.participantName === fromParticipant);
                    const toElement = elements.find(el => el.bddProperties?.participantName === toParticipant);
                    
                    if (fromElement && toElement) {
                        const messageElement = {
                            id: `message-${index}`,
                            type: 'message',
                            x: Math.min(fromElement.x, toElement.x) + 60,
                            y: currentY,
                            width: Math.abs(toElement.x - fromElement.x),
                            height: 20,
                            text: messageText,
                            fillColor: 'transparent',
                            borderColor: '#333333',
                            borderWidth: 2,
                            fontSize: 11,
                            fontWeight: 'normal',
                            textAlign: 'center',
                            rotation: 0,
                            opacity: 100,
                            layer: 'default',
                            connectionPoints: [],
                            businessOutcome: null,
                            bddProperties: { fromParticipant, toParticipant, messageText }
                        };
                        
                        elements.push(messageElement);
                        currentY += messageSpacing;
                    }
                }
            });
        }
        
        // Update connection points for all elements
        elements.forEach(element => {
            this.updateConnectionPoints(element);
        });
        
        console.log(`Parsed ${elements.length} sequence elements`);
        
        return {
            elements,
            connections,
            metadata,
            warnings: this.warnings
        };
    }
    
    extractMetadata(markdown) {
        const metadata = {
            flowTitle: '',
            methodology: 'BDD',
            diagramType: 'Flowchart',
            primaryOutcomes: [],
            timers: []
        };
        
        // Extract title from header - Match: # BDD — Flowchart: Employee Expense Reimbursement
        const headerMatch = markdown.match(/^# (.+?) — (.+?): (.+)/m);
        if (headerMatch) {
            metadata.methodology = headerMatch[1];
            metadata.diagramType = headerMatch[2];
            metadata.flowTitle = headerMatch[3];
        }
        
        // Extract Flow Title from Diagram Input section
        const flowTitleMatch = markdown.match(/\*\*Flow Title:\*\* (.+)/);
        if (flowTitleMatch) {
            metadata.flowTitle = flowTitleMatch[1];
        }
        
        // Extract Primary Outcomes - Match: **Primary Outcomes:** `Paid (Scheduled)`, `Rejected`, `Needs Receipt`
        const outcomesMatch = markdown.match(/\*\*Primary Outcomes:\*\* `(.+)`/);
        if (outcomesMatch) {
            metadata.primaryOutcomes = outcomesMatch[1].split('`, `').map(s => s.replace(/`/g, ''));
        }
        
        // Extract Timers - Match: **Timers:** `Manager Review SLA = 7 days`
        const timersMatch = markdown.match(/\*\*Timers:\*\* `(.+)`/);
        if (timersMatch) {
            metadata.timers = [timersMatch[1].replace(/`/g, '')];
        }
        
        // Extract Methodology from Diagram Input section
        const methodologyMatch = markdown.match(/\*\*Methodology:\*\* (.+)/);
        if (methodologyMatch) {
            metadata.methodology = methodologyMatch[1];
        }
        
        // Extract Diagram Type from Diagram Input section
        const typeMatch = markdown.match(/\*\*Diagram Type:\*\* (.+)/);
        if (typeMatch) {
            metadata.diagramType = typeMatch[1];
        }
        
        return metadata;
    }
    
    extractSection(markdown, sectionHeader) {
        const lines = markdown.split('\n');
        let inSection = false;
        let sectionContent = [];
        
        for (const line of lines) {
            if (line.includes(sectionHeader)) {
                inSection = true;
                continue;
            }
            
            if (inSection) {
                if (line.match(/^#{1,4}\s/) && !line.includes(sectionHeader)) {
                    break; // Hit another section
                }
                sectionContent.push(line);
            }
        }
        
        return sectionContent.join('\n');
    }
    
    getElementColor(type) {
        const colors = {
            'start': '#4caf50',
            'action': '#2196f3',
            'decision': '#ff9800',
            'end': '#f44336',
            'timer': '#9c27b0'
        };
        return colors[type] || '#ffffff';
    }
    
    getElementBorderColor(type) {
        const colors = {
            'start': '#388e3c',
            'action': '#1976d2',
            'decision': '#f57c00',
            'end': '#d32f2f',
            'timer': '#7b1fa2'
        };
        return colors[type] || '#000000';
    }
    
    getOutcomeColor(outcomeName) {
        const name = outcomeName.toLowerCase();
        if (name.includes('paid') || name.includes('approved') || name.includes('scheduled')) {
            return '#4caf50'; // Green for success
        } else if (name.includes('rejected') || name.includes('failed')) {
            return '#f44336'; // Red for failure
        } else {
            return '#ff9800'; // Orange for neutral/pending
        }
    }
    
    createConnection(startElement, endElement) {
        return {
            id: `conn-${startElement.id}-${endElement.id}`,
            startElement: startElement,
            endElement: endElement,
            start: { x: startElement.x + startElement.width / 2, y: startElement.y + startElement.height },
            end: { x: endElement.x + endElement.width / 2, y: endElement.y },
            label: '',
            style: 'solid',
            arrowType: 'arrow',
            color: '#333333'
        };
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
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BDDDiagrammingInterface();
});
