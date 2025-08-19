// BDD Diagramming Interface - Complete Implementation
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
            flowTitle: 'Untitled Flow',
            methodology: 'BDD',
            diagramType: 'Flowchart',
            primaryOutcomes: [],
            timers: []
        };
        
        // History for undo/redo
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        
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
        this.gridVisible = true;
        this.snapToGrid = true;
        this.guidesVisible = true;
        this.gridSize = 20;
        
        // Markdown parser
        this.markdownParser = new BDDMarkdownParser();
        
        // File handling
        this.currentFileName = null;
        this.hasUnsavedChanges = false;
        
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
        this.updateMethodologyHeader();
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
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
        
        // File drag and drop
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files);
            const mdFile = files.find(file => file.name.endsWith('.md'));
            if (mdFile) {
                this.handleFileImport(mdFile);
            }
        });
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
            if (shapeType) {
                const rect = this.canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) / this.zoom - this.panX;
                const y = (e.clientY - rect.top) / this.zoom - this.panY;
                
                this.createShape(shapeType, x, y);
            }
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
        this.markUnsaved();
        
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
            // Standard 8-point connection (top, top-right, right, bottom-right, bottom, bottom-left, left, top-left)
            const cx = element.x + element.width / 2;
            const cy = element.y + element.height / 2;
            const w = element.width / 2;
            const h = element.height / 2;
            
            points.push(
                { x: cx, y: element.y }, // top
                { x: element.x + element.width, y: element.y }, // top-right
                { x: element.x + element.width, y: cy }, // right
                { x: element.x + element.width, y: element.y + element.height }, // bottom-right
                { x: cx, y: element.y + element.height }, // bottom
                { x: element.x, y: element.y + element.height }, // bottom-left
                { x: element.x, y: cy }, // left
                { x: element.x, y: element.y } // top-left
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
        if (this.isPanning) {
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
            this.markUnsaved();
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
        const newZoom = Math.max(0.25, Math.min(4, this.zoom * zoomFactor));
        
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
            this.connectionMode = false;
            this.connectionStart = null;
            this.tempConnection = null;
            this.render();
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
                case 'i':
                    e.preventDefault();
                    this.showImportModal();
                    break;
                case 'n':
                    e.preventDefault();
                    this.newDiagram();
                    break;
            }
        }
        
        // Arrow key movement
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            this.moveSelectedElements(e.key, e.shiftKey ? 10 : 1);
        }
    }
    
    handleKeyUp(e) {
        if (e.key === ' ') {
            this.isPanning = false;
            this.canvas.style.cursor = 'default';
        }
    }
    
    handleResize() {
        this.setupCanvas();
        this.render();
    }
    
    // File Operations
    newDiagram() {
        if (this.hasUnsavedChanges) {
            if (!confirm('You have unsaved changes. Are you sure you want to create a new diagram?')) {
                return;
            }
        }
        
        this.elements = [];
        this.connections = [];
        this.selectedElement = null;
        this.selectedElements = [];
        this.history = [];
        this.historyIndex = -1;
        this.currentFileName = null;
        this.hasUnsavedChanges = false;
        this.metadata = {
            flowTitle: 'Untitled Flow',
            methodology: 'BDD',
            diagramType: 'Flowchart',
            primaryOutcomes: [],
            timers: []
        };
        
        this.render();
        this.updatePropertiesPanel();
        this.updateCanvasInfo();
        this.updateMethodologyHeader();
        this.saveState();
    }
    
    showImportModal() {
        const modal = document.getElementById('importModal');
        modal.classList.add('show');
        modal.style.display = 'flex';
        
        // Reset form
        document.getElementById('fileInput').value = '';
        document.getElementById('markdownInput').value = '';
        document.getElementById('importPreview').style.display = 'none';
        document.getElementById('parseWarnings').style.display = 'none';
        document.getElementById('confirmImportBtn').disabled = true;
    }
    
    handleFileUpload(e) {
        const files = e.target.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.name.endsWith('.md')) {
                this.handleFileImport(file);
            } else {
                this.showToast('Only .md files are supported', 'error');
            }
        }
    }
    
    handleFileImport(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            document.getElementById('markdownInput').value = content;
            this.currentFileName = file.name;
            this.enablePreviewButton();
        };
        reader.readAsText(file);
    }
    
    enablePreviewButton() {
        const previewBtn = document.getElementById('previewImportBtn');
        const markdownInput = document.getElementById('markdownInput');
        previewBtn.disabled = !markdownInput.value.trim();
    }
    
    previewImport() {
        const markdownInput = document.getElementById('markdownInput').value;
        const diagramType = document.querySelector('input[name="diagramType"]:checked').value;
        
        try {
            const parsed = this.markdownParser.parse(markdownInput, diagramType);
            
            if (parsed) {
                // Show preview
                const previewContent = document.getElementById('previewContent');
                previewContent.innerHTML = `
                    <h4>Metadata</h4>
                    <p><strong>Title:</strong> ${parsed.metadata.flowTitle || 'Untitled'}</p>
                    <p><strong>Methodology:</strong> ${parsed.metadata.methodology || 'BDD'}</p>
                    <p><strong>Type:</strong> ${parsed.metadata.diagramType || 'Flowchart'}</p>
                    <p><strong>Elements:</strong> ${parsed.elements.length}</p>
                    <p><strong>Connections:</strong> ${parsed.connections.length}</p>
                `;
                
                document.getElementById('importPreview').style.display = 'block';
                document.getElementById('confirmImportBtn').disabled = false;
                
                // Show warnings if any
                if (this.markdownParser.warnings.length > 0) {
                    const warningsList = document.getElementById('warningsList');
                    warningsList.innerHTML = '';
                    this.markdownParser.warnings.forEach(warning => {
                        const li = document.createElement('li');
                        li.textContent = warning;
                        warningsList.appendChild(li);
                    });
                    document.getElementById('parseWarnings').style.display = 'block';
                }
                
                this.parsedImportData = parsed;
            } else {
                this.showToast('Failed to parse markdown file', 'error');
            }
        } catch (error) {
            this.showToast('Error parsing markdown: ' + error.message, 'error');
        }
    }
    
    confirmImport() {
        if (this.parsedImportData) {
            // Clear current diagram
            this.elements = [];
            this.connections = [];
            
            // Import parsed data
            this.elements = this.parsedImportData.elements;
            this.connections = this.parsedImportData.connections;
            this.metadata = this.parsedImportData.metadata;
            
            // Update UI
            this.updateMethodologyHeader();
            this.render();
            this.updatePropertiesPanel();
            this.updateCanvasInfo();
            this.saveState();
            this.markUnsaved();
            
            this.hideModal('importModal');
            this.showToast('Diagram imported successfully', 'success');
        }
    }
    
    saveDiagram() {
        const diagramData = {
            metadata: this.metadata,
            elements: this.elements,
            connections: this.connections,
            layers: this.layers,
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(diagramData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const fileName = this.currentFileName || `${this.metadata.flowTitle.toLowerCase().replace(/\s+/g, '-')}.json`;
        this.downloadFile(dataBlob, fileName);
        
        this.hasUnsavedChanges = false;
        this.showToast('Diagram saved successfully', 'success');
    }
    
    showExportModal() {
        if (this.elements.length === 0) {
            this.showToast('Nothing to export', 'warning');
            return;
        }
        
        const modal = document.getElementById('exportModal');
        modal.classList.add('show');
        modal.style.display = 'flex';
    }
    
    confirmExport() {
        const format = document.querySelector('input[name="exportFormat"]:checked').value;
        
        switch (format) {
            case 'json':
                this.exportAsJSON();
                break;
            case 'markdown':
                this.exportAsMarkdown();
                break;
            case 'png':
                this.exportAsPNG();
                break;
            case 'svg':
                this.exportAsSVG();
                break;
        }
        
        this.hideModal('exportModal');
    }
    
    exportAsJSON() {
        this.saveDiagram();
    }
    
    exportAsMarkdown() {
        const markdown = this.generateMarkdown();
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const fileName = `${this.metadata.flowTitle.toLowerCase().replace(/\s+/g, '-')}.md`;
        this.downloadFile(blob, fileName);
        this.showToast('Exported as Markdown', 'success');
    }
    
    exportAsPNG() {
        const background = document.getElementById('exportBackground').value;
        const scale = parseInt(document.getElementById('exportScale').value);
        
        // Create temporary canvas for export
        const exportCanvas = document.createElement('canvas');
        const exportCtx = exportCanvas.getContext('2d');
        
        // Calculate bounds
        const bounds = this.getElementsBounds();
        const padding = 50;
        
        exportCanvas.width = (bounds.width + padding * 2) * scale;
        exportCanvas.height = (bounds.height + padding * 2) * scale;
        
        exportCtx.scale(scale, scale);
        exportCtx.translate(-bounds.minX + padding, -bounds.minY + padding);
        
        // Set background
        if (background !== 'transparent') {
            exportCtx.fillStyle = background === 'white' ? '#ffffff' : '#f5f5f5';
            exportCtx.fillRect(bounds.minX - padding, bounds.minY - padding, 
                              bounds.width + padding * 2, bounds.height + padding * 2);
        }
        
        // Draw elements and connections
        this.drawElementsToContext(exportCtx);
        
        // Convert to blob and download
        exportCanvas.toBlob((blob) => {
            const fileName = `${this.metadata.flowTitle.toLowerCase().replace(/\s+/g, '-')}.png`;
            this.downloadFile(blob, fileName);
            this.showToast('Exported as PNG', 'success');
        });
    }
    
    exportAsSVG() {
        const bounds = this.getElementsBounds();
        const padding = 50;
        
        const svg = `
            <svg width="${bounds.width + padding * 2}" height="${bounds.height + padding * 2}" 
                 xmlns="http://www.w3.org/2000/svg">
                <g transform="translate(${-bounds.minX + padding}, ${-bounds.minY + padding})">
                    ${this.generateSVGElements()}
                </g>
            </svg>
        `;
        
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const fileName = `${this.metadata.flowTitle.toLowerCase().replace(/\s+/g, '-')}.svg`;
        this.downloadFile(blob, fileName);
        this.showToast('Exported as SVG', 'success');
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
        this.markUnsaved();
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
    
    // History Management
    saveState() {
        const state = {
            elements: JSON.parse(JSON.stringify(this.elements)),
            connections: JSON.parse(JSON.stringify(this.connections)),
            metadata: JSON.parse(JSON.stringify(this.metadata))
        };
        
        // Remove future history if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        this.history.push(state);
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
        
        this.updateUndoRedoButtons();
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const state = this.history[this.historyIndex];
            this.restoreState(state);
            this.markUnsaved();
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const state = this.history[this.historyIndex];
            this.restoreState(state);
            this.markUnsaved();
        }
    }
    
    restoreState(state) {
        this.elements = JSON.parse(JSON.stringify(state.elements));
        this.connections = JSON.parse(JSON.stringify(state.connections));
        this.metadata = JSON.parse(JSON.stringify(state.metadata));
        
        // Update connection points
        this.elements.forEach(element => {
            this.updateConnectionPoints(element);
        });
        
        this.clearSelection();
        this.render();
        this.updatePropertiesPanel();
        this.updateCanvasInfo();
        this.updateMethodologyHeader();
    }
    
    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) undoBtn.disabled = this.historyIndex <= 0;
        if (redoBtn) redoBtn.disabled = this.historyIndex >= this.history.length - 1;
    }
    
    // Element Operations
    deleteSelected() {
        if (this.selectedElements.length === 0) return;
        
        // Remove connections that involve selected elements
        this.connections = this.connections.filter(connection => {
            return !this.selectedElements.includes(connection.startElement) &&
                   !this.selectedElements.includes(connection.endElement);
        });
        
        // Remove selected elements
        this.selectedElements.forEach(element => {
            const index = this.elements.indexOf(element);
            if (index > -1) {
                this.elements.splice(index, 1);
            }
        });
        
        this.clearSelection();
        this.render();
        this.saveState();
        this.markUnsaved();
    }
    
    duplicateSelected() {
        if (this.selectedElements.length === 0) return;
        
        const duplicates = [];
        const offset = 20;
        
        this.selectedElements.forEach(element => {
            const duplicate = JSON.parse(JSON.stringify(element));
            duplicate.id = Date.now() + Math.random();
            duplicate.x += offset;
            duplicate.y += offset;
            this.updateConnectionPoints(duplicate);
            this.elements.push(duplicate);
            duplicates.push(duplicate);
        });
        
        this.selectedElements = duplicates;
        this.selectedElement = duplicates[duplicates.length - 1];
        this.render();
        this.updatePropertiesPanel();
        this.saveState();
        this.markUnsaved();
    }
    
    bringToFront() {
        if (!this.selectedElement) return;
        
        const index = this.elements.indexOf(this.selectedElement);
        if (index > -1) {
            this.elements.splice(index, 1);
            this.elements.push(this.selectedElement);
            this.render();
            this.saveState();
            this.markUnsaved();
        }
    }
    
    sendToBack() {
        if (!this.selectedElement) return;
        
        const index = this.elements.indexOf(this.selectedElement);
        if (index > -1) {
            this.elements.splice(index, 1);
            this.elements.unshift(this.selectedElement);
            this.render();
            this.saveState();
            this.markUnsaved();
        }
    }
    
    moveSelectedElements(direction, distance) {
        if (this.selectedElements.length === 0) return;
        
        const deltaX = direction === 'ArrowLeft' ? -distance : direction === 'ArrowRight' ? distance : 0;
        const deltaY = direction === 'ArrowUp' ? -distance : direction === 'ArrowDown' ? distance : 0;
        
        this.selectedElements.forEach(element => {
            element.x += deltaX;
            element.y += deltaY;
            if (this.snapToGrid) {
                element.x = Math.round(element.x / this.gridSize) * this.gridSize;
                element.y = Math.round(element.y / this.gridSize) * this.gridSize;
            }
            this.updateConnectionPoints(element);
        });
        
        this.updateConnections();
        this.render();
        this.updatePropertiesPanel();
        this.saveState();
        this.markUnsaved();
    }
    
    // Property Management
    switchPropertyTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }
    
    updateSelectedElementProperty(propertyId, value) {
        if (!this.selectedElement) return;
        
        const propertyMap = {
            'fillColor': 'fillColor',
            'borderColor': 'borderColor',
            'borderWidth': 'borderWidth',
            'opacity': 'opacity',
            'elementText': 'text',
            'fontSize': 'fontSize',
            'fontWeight': 'fontWeight',
            'textAlign': 'textAlign',
            'posX': 'x',
            'posY': 'y',
            'width': 'width',
            'height': 'height',
            'rotation': 'rotation'
        };
        
        const property = propertyMap[propertyId];
        if (property) {
            // Convert string values to appropriate types
            let convertedValue = value;
            if (['borderWidth', 'opacity', 'fontSize', 'x', 'y', 'width', 'height', 'rotation'].includes(property)) {
                convertedValue = parseFloat(value);
            }
            
            this.selectedElement[property] = convertedValue;
            
            // Update connection points if position or size changed
            if (['x', 'y', 'width', 'height'].includes(property)) {
                this.updateConnectionPoints(this.selectedElement);
                this.updateConnections();
            }
            
            this.render();
            this.markUnsaved();
            
            // Update range value displays
            if (propertyId === 'borderWidth') {
                document.getElementById('borderWidthValue').textContent = value + 'px';
            } else if (propertyId === 'opacity') {
                document.getElementById('opacityValue').textContent = value + '%';
            } else if (propertyId === 'fontSize') {
                document.getElementById('fontSizeValue').textContent = value + 'px';
            } else if (propertyId === 'rotation') {
                document.getElementById('rotationValue').textContent = value + '°';
            }
        }
    }
    
    updatePropertiesPanel() {
        const noSelection = document.getElementById('noSelection');
        const elementProperties = document.getElementById('elementProperties');
        
        if (this.selectedElement) {
            noSelection.style.display = 'none';
            elementProperties.style.display = 'block';
            
            // Update property values
            const fillColor = document.getElementById('fillColor');
            const borderColor = document.getElementById('borderColor');
            const borderWidth = document.getElementById('borderWidth');
            const opacity = document.getElementById('opacity');
            const elementText = document.getElementById('elementText');
            const fontSize = document.getElementById('fontSize');
            const fontWeight = document.getElementById('fontWeight');
            const textAlign = document.getElementById('textAlign');
            const posX = document.getElementById('posX');
            const posY = document.getElementById('posY');
            const width = document.getElementById('width');
            const height = document.getElementById('height');
            const rotation = document.getElementById('rotation');
            
            if (fillColor) fillColor.value = this.selectedElement.fillColor === 'transparent' ? '#ffffff' : this.selectedElement.fillColor;
            if (borderColor) borderColor.value = this.selectedElement.borderColor === 'transparent' ? '#000000' : this.selectedElement.borderColor;
            if (borderWidth) {
                borderWidth.value = this.selectedElement.borderWidth;
                document.getElementById('borderWidthValue').textContent = this.selectedElement.borderWidth + 'px';
            }
            if (opacity) {
                opacity.value = this.selectedElement.opacity;
                document.getElementById('opacityValue').textContent = this.selectedElement.opacity + '%';
            }
            if (elementText) elementText.value = this.selectedElement.text;
            if (fontSize) {
                fontSize.value = this.selectedElement.fontSize;
                document.getElementById('fontSizeValue').textContent = this.selectedElement.fontSize + 'px';
            }
            if (fontWeight) fontWeight.value = this.selectedElement.fontWeight;
            if (textAlign) textAlign.value = this.selectedElement.textAlign;
            if (posX) posX.value = Math.round(this.selectedElement.x);
            if (posY) posY.value = Math.round(this.selectedElement.y);
            if (width) width.value = Math.round(this.selectedElement.width);
            if (height) height.value = Math.round(this.selectedElement.height);
            if (rotation) {
                rotation.value = this.selectedElement.rotation;
                document.getElementById('rotationValue').textContent = this.selectedElement.rotation + '°';
            }
        } else {
            noSelection.style.display = 'block';
            elementProperties.style.display = 'none';
        }
    }
    
    // Canvas Operations
    clearCanvas() {
        if (this.elements.length === 0) return;
        
        if (confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
            this.elements = [];
            this.connections = [];
            this.clearSelection();
            this.render();
            this.saveState();
            this.markUnsaved();
        }
    }
    
    zoomIn() {
        this.zoom = Math.min(this.zoom * 1.2, 4);
        this.render();
        this.updateCanvasInfo();
    }
    
    zoomOut() {
        this.zoom = Math.max(this.zoom / 1.2, 0.25);
        this.render();
        this.updateCanvasInfo();
    }
    
    resetZoom() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.render();
        this.updateCanvasInfo();
    }
    
    fitToScreen() {
        if (this.elements.length === 0) return;
        
        const bounds = this.getElementsBounds();
        const padding = 50;
        
        const canvasWidth = this.canvas.clientWidth;
        const canvasHeight = this.canvas.clientHeight;
        
        const scaleX = (canvasWidth - padding * 2) / bounds.width;
        const scaleY = (canvasHeight - padding * 2) / bounds.height;
        
        this.zoom = Math.min(scaleX, scaleY, 2); // Max zoom of 2x
        
        // Center the diagram
        this.panX = (canvasWidth / 2 - (bounds.minX + bounds.width / 2) * this.zoom) / this.zoom;
        this.panY = (canvasHeight / 2 - (bounds.minY + bounds.height / 2) * this.zoom) / this.zoom;
        
        this.render();
        this.updateCanvasInfo();
    }
    
    getElementsBounds() {
        if (this.elements.length === 0) {
            return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
        }
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        this.elements.forEach(element => {
            minX = Math.min(minX, element.x);
            minY = Math.min(minY, element.y);
            maxX = Math.max(maxX, element.x + element.width);
            maxY = Math.max(maxY, element.y + element.height);
        });
        
        return {
            minX, minY, maxX, maxY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
    
    // Canvas Controls
    toggleGrid() {
        this.gridVisible = !this.gridVisible;
        const gridToggle = document.getElementById('gridToggle');
        if (gridToggle) {
            gridToggle.classList.toggle('active', this.gridVisible);
        }
        this.render();
    }
    
    toggleSnap() {
        this.snapToGrid = !this.snapToGrid;
        const snapToggle = document.getElementById('snapToggle');
        if (snapToggle) {
            snapToggle.classList.toggle('active', this.snapToGrid);
        }
    }
    
    toggleGuides() {
        this.guidesVisible = !this.guidesVisible;
        const guidesToggle = document.getElementById('guidesToggle');
        if (guidesToggle) {
            guidesToggle.classList.toggle('active', this.guidesVisible);
        }
    }
    
    // Panel Management
    toggleOutcomesPanel() {
        const panel = document.getElementById('outcomesPanel');
        panel.classList.toggle('open');
    }
    
    toggleLayersPanel() {
        const panel = document.getElementById('layersPanel');
        panel.classList.toggle('open');
    }
    
    // Document Management
    createNewDocument(title, type) {
        const doc = {
            id: Date.now(),
            title: title,
            type: type,
            elements: [],
            connections: [],
            metadata: {
                flowTitle: title,
                methodology: 'BDD',
                diagramType: type === 'flow' ? 'Flowchart' : 'Sequence',
                primaryOutcomes: [],
                timers: []
            }
        };
        
        this.documents.set(doc.id, doc);
        this.currentDocument = doc.id;
        this.updateDocumentSwitcher();
        
        return doc;
    }
    
    switchDocument(docId) {
        const doc = this.documents.get(docId);
        if (doc) {
            // Save current state
            if (this.currentDocument) {
                const currentDoc = this.documents.get(this.currentDocument);
                if (currentDoc) {
                    currentDoc.elements = [...this.elements];
                    currentDoc.connections = [...this.connections];
                    currentDoc.metadata = { ...this.metadata };
                }
            }
            
            // Load new document
            this.elements = [...doc.elements];
            this.connections = [...doc.connections];
            this.metadata = { ...doc.metadata };
            this.currentDocument = docId;
            
            this.clearSelection();
            this.render();
            this.updatePropertiesPanel();
            this.updateCanvasInfo();
            this.updateMethodologyHeader();
        }
    }
    
    updateDocumentSwitcher() {
        const select = document.getElementById('documentSelect');
        if (select) {
            select.innerHTML = '<option value="">Select Document...</option>';
            
            this.documents.forEach((doc, id) => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = `${doc.title} (${doc.type})`;
                if (id === this.currentDocument) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        }
    }
    
    showAddDocumentDialog() {
        const title = prompt('Enter document title:');
        if (title) {
            const type = confirm('Create a sequence diagram? (Cancel for flowchart)') ? 'sequence' : 'flow';
            this.createNewDocument(title, type);
        }
    }
    
    // Layer Management
    addLayer() {
        const name = prompt('Enter layer name:');
        if (name) {
            const layer = {
                id: Date.now(),
                name: name,
                visible: true,
                locked: false
            };
            this.layers.push(layer);
            this.updateLayersList();
        }
    }
    
    deleteLayer() {
        if (this.layers.length <= 1) {
            this.showToast('Cannot delete the last layer', 'warning');
            return;
        }
        
        const layerToDelete = this.layers.find(l => l.id === this.currentLayer);
        if (layerToDelete && confirm(`Delete layer "${layerToDelete.name}"?`)) {
            // Move elements to default layer
            this.elements.forEach(element => {
                if (element.layer === this.currentLayer) {
                    element.layer = 'default';
                }
            });
            
            this.layers = this.layers.filter(l => l.id !== this.currentLayer);
            this.currentLayer = 'default';
            this.updateLayersList();
            this.render();
        }
    }
    
    updateLayersList() {
        const layersList = document.getElementById('layersList');
        if (layersList) {
            layersList.innerHTML = '';
            
            this.layers.forEach(layer => {
                const layerItem = document.createElement('div');
                layerItem.className = `layer-item ${layer.id === this.currentLayer ? 'active' : ''}`;
                layerItem.innerHTML = `
                    <div class="layer-visibility ${layer.visible ? 'visible' : ''}" data-layer="${layer.id}">
                        ${layer.visible ? '👁' : ''}
                    </div>
                    <div class="layer-name">${layer.name}</div>
                    <div class="layer-lock ${layer.locked ? 'locked' : ''}" data-layer="${layer.id}">
                        ${layer.locked ? '🔒' : '🔓'}
                    </div>
                `;
                
                layerItem.addEventListener('click', () => {
                    this.currentLayer = layer.id;
                    this.updateLayersList();
                });
                
                layersList.appendChild(layerItem);
            });
        }
    }
    
    isLayerVisible(layerId) {
        const layer = this.layers.find(l => l.id === layerId);
        return layer ? layer.visible : true;
    }
    
    // Outcome Management
    clearOutcomeFilters() {
        this.outcomeFilters.clear();
        this.render();
    }
    
    // Modal Management
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
    }
    
    confirmMetadata() {
        const flowTitle = document.getElementById('flowTitle').value;
        const methodology = document.getElementById('methodology').value;
        const diagramType = document.getElementById('diagramType').value;
        const primaryOutcomes = document.getElementById('primaryOutcomes').value.split(',').map(s => s.trim()).filter(s => s);
        const timers = document.getElementById('timers').value.split(',').map(s => s.trim()).filter(s => s);
        
        this.metadata = {
            flowTitle: flowTitle || 'Untitled Flow',
            methodology: methodology || 'BDD',
            diagramType: diagramType || 'Flowchart',
            primaryOutcomes: primaryOutcomes,
            timers: timers
        };
        
        this.updateMethodologyHeader();
        this.hideModal('metadataModal');
        this.markUnsaved();
    }
    
    skipMetadata() {
        this.hideModal('metadataModal');
    }
    
    // UI Updates
    updateMethodologyHeader() {
        const header = document.querySelector('.methodology-text');
        if (header) {
            header.textContent = this.metadata.methodology || 'BDD';
        }
        
        const subtitle = document.querySelector('.methodology-subtitle');
        if (subtitle) {
            const subtitles = {
                'BDD': 'Given-When-Then',
                'TDD': 'Red-Green-Refactor',
                'DDD': 'Domain-Driven',
                'SDD': 'Specification-Driven'
            };
            subtitle.textContent = subtitles[this.metadata.methodology] || 'Given-When-Then';
        }
    }
    
    updateCanvasInfo() {
        const info = document.getElementById('canvasInfo');
        if (info) {
            info.textContent = `Elements: ${this.elements.length} | Connections: ${this.connections.length} | Zoom: ${Math.round(this.zoom * 100)}%`;
        }
        
        // Update zoom button text
        const resetZoomBtn = document.getElementById('resetZoomBtn');
        if (resetZoomBtn) {
            resetZoomBtn.textContent = `${Math.round(this.zoom * 100)}%`;
        }
    }
    
    markUnsaved() {
        this.hasUnsavedChanges = true;
        // Could add visual indicator here
    }
    
    // Utility Methods
    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : type === 'success' ? '#4caf50' : '#2196f3'};
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-size: 14px;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }
    
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    generateMarkdown() {
        const mermaid = this.generateMermaidDiagram();
        const translation = this.generateTranslation();
        
        return `# ${this.metadata.methodology} — ${this.metadata.diagramType}: ${this.metadata.flowTitle}

## Diagram Input

\`\`\`mermaid
${mermaid}
\`\`\`

## Translation

${translation}
`;
    }
    
    generateMermaidDiagram() {
        let mermaid = this.metadata.diagramType === 'Sequence' ? 'sequenceDiagram\n' : 'flowchart TD\n';
        
        // Add metadata comments
        mermaid += `  %% Flow Title: ${this.metadata.flowTitle} (${this.metadata.methodology})\n`;
        if (this.metadata.primaryOutcomes.length > 0) {
            mermaid += `  %% Primary Outcomes: ${this.metadata.primaryOutcomes.join(', ')}\n`;
        }
        mermaid += '\n';
        
        // Generate nodes
        this.elements.forEach((element, index) => {
            const nodeId = this.getNodeId(element);
            const nodeText = element.text || element.type;
            
            if (this.metadata.diagramType === 'Sequence') {
                // Sequence diagram syntax
                if (element.type === 'participant') {
                    mermaid += `  participant ${nodeId} as ${nodeText}\n`;
                }
            } else {
                // Flowchart syntax
                const shape = this.getMermaidShape(element.type);
                mermaid += `  ${nodeId}${shape.start}${nodeText}${shape.end}\n`;
            }
        });
        
        mermaid += '\n';
        
        // Generate connections
        this.connections.forEach(connection => {
            const startId = this.getNodeId(connection.startElement);
            const endId = this.getNodeId(connection.endElement);
            const label = connection.label ? `|${connection.label}|` : '';
            
            if (this.metadata.diagramType === 'Sequence') {
                mermaid += `  ${startId}->>+${endId}: ${label}\n`;
            } else {
                const arrow = connection.style === 'dashed' ? '-.->': '-->';
                mermaid += `  ${startId} ${arrow}${label} ${endId}\n`;
            }
        });
        
        return mermaid;
    }
    
    getNodeId(element) {
        const index = this.elements.indexOf(element);
        return String.fromCharCode(65 + index); // A, B, C, etc.
    }
    
    getMermaidShape(type) {
        const shapes = {
            'start': { start: '([', end: '])' },
            'end': { start: '([', end: '])' },
            'action': { start: '[', end: ']' },
            'decision': { start: '{', end: '}' },
            'timer': { start: '((', end: '))' },
            'participant': { start: '[', end: ']' },
            'text': { start: '[', end: ']' },
            'note': { start: '[', end: ']' }
        };
        return shapes[type] || { start: '[', end: ']' };
    }
    
    generateTranslation() {
        let translation = `**Flow Title:** ${this.metadata.flowTitle}\n`;
        translation += `**Methodology:** ${this.metadata.methodology}\n`;
        translation += `**Diagram Type:** ${this.metadata.diagramType}\n`;
        
        if (this.metadata.primaryOutcomes.length > 0) {
            translation += `**Primary Outcomes:** \`${this.metadata.primaryOutcomes.join('`, `')}\`\n`;
        }
        
        if (this.metadata.timers.length > 0) {
            translation += `**Timers:** \`${this.metadata.timers.join('`, `')}\`\n`;
        }
        
        translation += '\n### Elements\n\n';
        
        this.elements.forEach((element, index) => {
            const nodeId = this.getNodeId(element);
            translation += `**${nodeId} — ${element.type}**\n`;
            translation += `- *Text:* ${element.text}\n`;
            if (element.businessOutcome) {
                translation += `- *Outcome:* ${element.businessOutcome}\n`;
            }
            translation += '\n';
        });
        
        if (this.connections.length > 0) {
            translation += '### Connections\n\n';
            this.connections.forEach((connection, index) => {
                const startId = this.getNodeId(connection.startElement);
                const endId = this.getNodeId(connection.endElement);
                translation += `**${startId} → ${endId}**\n`;
                if (connection.label) {
                    translation += `- *Label:* ${connection.label}\n`;
                }
                translation += '\n';
            });
        }
        
        return translation;
    }
    
    generateSVGElements() {
        let svg = '';
        
        // Draw connections first
        this.connections.forEach(connection => {
            svg += `<line x1="${connection.start.x}" y1="${connection.start.y}" 
                         x2="${connection.end.x}" y2="${connection.end.y}" 
                         stroke="${connection.color}" stroke-width="2" />`;
            
            // Arrow head
            if (connection.arrowType === 'arrow') {
                const angle = Math.atan2(connection.end.y - connection.start.y, connection.end.x - connection.start.x);
                const headLength = 10;
                const x1 = connection.end.x - headLength * Math.cos(angle - Math.PI / 6);
                const y1 = connection.end.y - headLength * Math.sin(angle - Math.PI / 6);
                const x2 = connection.end.x - headLength * Math.cos(angle + Math.PI / 6);
                const y2 = connection.end.y - headLength * Math.sin(angle + Math.PI / 6);
                
                svg += `<polygon points="${connection.end.x},${connection.end.y} ${x1},${y1} ${x2},${y2}" 
                               fill="${connection.color}" />`;
            }
        });
        
        // Draw elements
        this.elements.forEach(element => {
            if (element.type === 'decision') {
                // Diamond shape
                const cx = element.x + element.width / 2;
                const cy = element.y + element.height / 2;
                svg += `<polygon points="${cx},${element.y} ${element.x + element.width},${cy} 
                                       ${cx},${element.y + element.height} ${element.x},${cy}" 
                               fill="${element.fillColor}" stroke="${element.borderColor}" 
                               stroke-width="${element.borderWidth}" />`;
            } else {
                // Rectangle
                svg += `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" 
                             fill="${element.fillColor}" stroke="${element.borderColor}" 
                             stroke-width="${element.borderWidth}" rx="4" />`;
            }
            
            // Text
            if (element.text) {
                svg += `<text x="${element.x + element.width / 2}" y="${element.y + element.height / 2}" 
                             text-anchor="middle" dominant-baseline="middle" 
                             font-family="Arial" font-size="${element.fontSize}" 
                             fill="${element.borderColor}">${element.text}</text>`;
            }
        });
        
        return svg;
    }
    
    drawElementsToContext(ctx) {
        // Save current context
        ctx.save();
        
        // Draw connections first
        this.connections.forEach(connection => {
            ctx.strokeStyle = connection.color;
            ctx.lineWidth = 2;
            
            if (connection.style === 'dashed') {
                ctx.setLineDash([5, 5]);
            } else {
                ctx.setLineDash([]);
            }
            
            ctx.beginPath();
            ctx.moveTo(connection.start.x, connection.start.y);
            ctx.lineTo(connection.end.x, connection.end.y);
            ctx.stroke();
            
            // Draw arrow head
            if (connection.arrowType === 'arrow') {
                const angle = Math.atan2(connection.end.y - connection.start.y, connection.end.x - connection.start.x);
                const headLength = 10;
                
                ctx.beginPath();
                ctx.moveTo(connection.end.x, connection.end.y);
                ctx.lineTo(
                    connection.end.x - headLength * Math.cos(angle - Math.PI / 6),
                    connection.end.y - headLength * Math.sin(angle - Math.PI / 6)
                );
                ctx.moveTo(connection.end.x, connection.end.y);
                ctx.lineTo(
                    connection.end.x - headLength * Math.cos(angle + Math.PI / 6),
                    connection.end.y - headLength * Math.sin(angle + Math.PI / 6)
                );
                ctx.stroke();
            }
        });
        
        // Draw elements
        this.elements.forEach(element => {
            ctx.fillStyle = element.fillColor;
            ctx.strokeStyle = element.borderColor;
            ctx.lineWidth = element.borderWidth;
            ctx.font = `${element.fontWeight} ${element.fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (element.type === 'decision') {
                // Diamond shape
                const cx = element.x + element.width / 2;
                const cy = element.y + element.height / 2;
                
                ctx.beginPath();
                ctx.moveTo(cx, element.y);
                ctx.lineTo(element.x + element.width, cy);
                ctx.lineTo(cx, element.y + element.height);
                ctx.lineTo(element.x, cy);
                ctx.closePath();
                
                if (element.fillColor !== 'transparent') {
                    ctx.fill();
                }
                if (element.borderColor !== 'transparent') {
                    ctx.stroke();
                }
            } else {
                // Rectangle
                ctx.beginPath();
                ctx.rect(element.x, element.y, element.width, element.height);
                
                if (element.fillColor !== 'transparent') {
                    ctx.fill();
                }
                if (element.borderColor !== 'transparent') {
                    ctx.stroke();
                }
            }
            
            // Draw text
            if (element.text) {
                ctx.fillStyle = element.borderColor !== 'transparent' ? element.borderColor : '#000000';
                ctx.fillText(element.text, element.x + element.width / 2, element.y + element.height / 2);
            }
        });
        
        ctx.restore();
    }
    
    // Rendering Methods (from original implementation)
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
}

// BDD Markdown Parser Class
class BDDMarkdownParser {
    constructor() {
        this.warnings = [];
    }
    
    parse(markdown, type = 'flow') {
        this.warnings = [];
        
        try {
            // Extract metadata from markdown
            const metadata = this.extractMetadata(markdown);
            
            // Parse elements and connections based on type
            if (type === 'flow') {
                return this.parseFlowMarkdown(markdown, metadata);
            } else if (type === 'sequence') {
                return this.parseSequenceMarkdown(markdown, metadata);
            }
            
            return null;
        } catch (error) {
            this.warnings.push(`Parse error: ${error.message}`);
            return null;
        }
    }
    
    extractMetadata(markdown) {
        const metadata = {
            flowTitle: 'Untitled Flow',
            methodology: 'BDD',
            diagramType: 'Flowchart',
            primaryOutcomes: [],
            timers: []
        };
        
        // Extract title from first heading
        const titleMatch = markdown.match(/^#\s+(.+)/m);
        if (titleMatch) {
            const fullTitle = titleMatch[1];
            // Parse "BDD — Flowchart: Title" format
            const parts = fullTitle.split(':');
            if (parts.length > 1) {
                metadata.flowTitle = parts[1].trim();
                const methodologyPart = parts[0].trim();
                const methodologyMatch = methodologyPart.match(/^(\w+)/);
                if (methodologyMatch) {
                    metadata.methodology = methodologyMatch[1];
                }
                if (methodologyPart.includes('Sequence')) {
                    metadata.diagramType = 'Sequence';
                }
            } else {
                metadata.flowTitle = fullTitle;
            }
        }
        
        // Extract outcomes and timers from content
        const outcomesMatch = markdown.match(/Primary Outcomes[:\s]+(.+)/i);
        if (outcomesMatch) {
            metadata.primaryOutcomes = outcomesMatch[1].split(',').map(s => s.trim().replace(/[`'"]/g, ''));
        }
        
        const timersMatch = markdown.match(/Timers[:\s]+(.+)/i);
        if (timersMatch) {
            metadata.timers = timersMatch[1].split(',').map(s => s.trim().replace(/[`'"]/g, ''));
        }
        
        return metadata;
    }
    
    parseFlowMarkdown(markdown, metadata) {
        const elements = [];
        const connections = [];
        
        // Simple parsing - create basic elements from text content
        const lines = markdown.split('\n');
        let yPos = 100;
        
        lines.forEach((line, index) => {
            line = line.trim();
            
            // Look for step indicators
            if (line.match(/^(Step|Branch|Decision)/i)) {
                const text = line.replace(/^(Step|Branch|Decision)\s*\d*\s*[—-]\s*/i, '').trim();
                let type = 'action';
                
                if (line.toLowerCase().includes('decision') || text.includes('?')) {
                    type = 'decision';
                } else if (line.toLowerCase().includes('start')) {
                    type = 'start';
                } else if (line.toLowerCase().includes('end')) {
                    type = 'end';
                }
                
                elements.push({
                    id: Date.now() + index,
                    type: type,
                    x: 200,
                    y: yPos,
                    width: type === 'decision' ? 120 : 160,
                    height: type === 'decision' ? 80 : 60,
                    text: text.substring(0, 50), // Limit text length
                    fillColor: this.getTypeColor(type),
                    borderColor: this.getTypeBorderColor(type),
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
                });
                
                yPos += 120;
            }
        });
        
        // Create simple sequential connections
        for (let i = 0; i < elements.length - 1; i++) {
            connections.push({
                id: Date.now() + i + 1000,
                startElement: elements[i],
                endElement: elements[i + 1],
                start: { x: elements[i].x + elements[i].width / 2, y: elements[i].y + elements[i].height },
                end: { x: elements[i + 1].x + elements[i + 1].width / 2, y: elements[i + 1].y },
                label: '',
                style: 'solid',
                arrowType: 'arrow',
                color: '#333333'
            });
        }
        
        return {
            elements: elements,
            connections: connections,
            metadata: metadata
        };
    }
    
    parseSequenceMarkdown(markdown, metadata) {
        const elements = [];
        const connections = [];
        
        // Simple sequence parsing
        const lines = markdown.split('\n');
        let xPos = 100;
        
        // Create participants
        const participants = [];
        lines.forEach(line => {
            const participantMatch = line.match(/participant\s+(\w+)\s+as\s+(.+)/i);
            if (participantMatch) {
                participants.push({
                    id: participantMatch[1],
                    name: participantMatch[2]
                });
            }
        });
        
        participants.forEach((participant, index) => {
            elements.push({
                id: Date.now() + index,
                type: 'participant',
                x: xPos,
                y: 50,
                width: 120,
                height: 40,
                text: participant.name,
                fillColor: '#9c27b0',
                borderColor: '#7b1fa2',
                borderWidth: 2,
                fontSize: 14,
                fontWeight: 'normal',
                textAlign: 'center',
                rotation: 0,
                opacity: 100,
                layer: 'default',
                connectionPoints: [],
                businessOutcome: null,
                bddProperties: { participantId: participant.id }
            });
            
            xPos += 200;
        });
        
        return {
            elements: elements,
            connections: connections,
            metadata: metadata
        };
    }
    
    getTypeColor(type) {
        const colors = {
            'start': '#4caf50',
            'action': '#2196f3',
            'decision': '#ff9800',
            'end': '#f44336',
            'timer': '#9c27b0',
            'participant': '#9c27b0'
        };
        return colors[type] || '#ffffff';
    }
    
    getTypeBorderColor(type) {
        const colors = {
            'start': '#388e3c',
            'action': '#1976d2',
            'decision': '#f57c00',
            'end': '#d32f2f',
            'timer': '#7b1fa2',
            'participant': '#7b1fa2'
        };
        return colors[type] || '#000000';
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BDDDiagrammingInterface();
});
