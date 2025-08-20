// BDD Diagramming Interface - Complete Implementation
class BDDDiagrammingApp {
    constructor() {
        this.canvas = document.getElementById('diagramCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvasWrapper = document.querySelector('.canvas-wrapper');
        
        // Canvas settings - 6000x4000 finite stage
        this.canvasWidth = 6000;
        this.canvasHeight = 4000;
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        
        // State management
        this.elements = [];
        this.connections = [];
        this.selectedElements = [];
        this.currentTool = 'select';
        this.isDrawing = false;
        this.isDragging = false;
        this.isConnecting = false;
        this.isPanning = false;
        this.isResizing = false;
        
        // View state
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.viewportWidth = 0;
        this.viewportHeight = 0;
        
        // Mouse state
        this.mouseX = 0;
        this.mouseY = 0;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.mouseDown = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        
        // Drawing state
        this.currentShape = null;
        this.currentConnection = null;
        this.connectionStart = null;
        this.resizeHandle = null;
        this.textEditElement = null;
        
        // History for undo/redo
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        
        // Rendering throttle to prevent infinite loops
        this.renderRequested = false;
        
        // Default shape properties
        this.defaults = {
            rectangle: { width: 200, height: 120, borderRadius: 12 },
            ellipse: { width: 200, height: 130 },
            diamond: { width: 180, height: 180 },
            text: { width: 120, height: 30, fontSize: 18 },
            line: { strokeWidth: 3 },
            connector: { strokeWidth: 3, arrowSize: 10 }
        };
        
        // Style defaults
        this.styleDefaults = {
            stroke: '#111827',
            strokeWidth: 3,
            fill: '#FFFFFF',
            selection: '#3B82F6',
            fontSize: 18,
            fontFamily: 'Arial, sans-serif',
            textAlign: 'center'
        };
        
        // Snap settings
        this.snapRadius = 12;
        this.gridSize = 20;
        this.snapToGrid = false;
        
        // Import/Export
        this.currentDocument = {
            methodology: 'BDD',
            title: 'Untitled Diagram',
            elements: [],
            connections: []
        };
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupToolbar();
        this.setupModals();
        this.requestRender();
        this.saveState();
        this.updateUI();
    }
    
    // Throttled rendering to prevent infinite loops
    requestRender() {
        if (!this.renderRequested) {
            this.renderRequested = true;
            requestAnimationFrame(() => {
                this.render();
                this.renderRequested = false;
            });
        }
    }
    
    setupCanvas() {
        // Set up viewport
        const rect = this.canvasWrapper.getBoundingClientRect();
        this.viewportWidth = rect.width - 40; // Account for padding
        this.viewportHeight = rect.height - 40;
        
        // Set canvas display size to fit viewport
        const displayWidth = Math.min(this.viewportWidth, 1200);
        const displayHeight = Math.min(this.viewportHeight, 800);
        
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';
        
        // Set actual canvas size for drawing - use higher resolution for crisp rendering
        this.canvas.width = displayWidth * window.devicePixelRatio || displayWidth;
        this.canvas.height = displayHeight * window.devicePixelRatio || displayHeight;
        
        // Scale context to match device pixel ratio
        const ratio = window.devicePixelRatio || 1;
        if (ratio !== 1) {
            this.ctx.scale(ratio, ratio);
        }
        
        // Store display dimensions for coordinate calculations
        this.displayWidth = displayWidth;
        this.displayHeight = displayHeight;
        
        // Initialize view
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1;
    }
    
    updateCanvasTransform() {
        // Simple transform for pan and zoom
        this.ctx.setTransform(this.zoom, 0, 0, this.zoom, this.panX, this.panY);
    }
    
    setupEventListeners() {
        // Canvas events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
        
        // Window events
        window.addEventListener('resize', this.handleResize.bind(this));
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Prevent default drag behavior
        this.canvas.addEventListener('dragstart', e => e.preventDefault());
        
        // File drop support
        document.addEventListener('dragover', e => e.preventDefault());
        document.addEventListener('drop', this.handleFileDrop.bind(this));
    }
    
    setupToolbar() {
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            if (btn.dataset.tool) {
                btn.addEventListener('click', () => {
                    this.setTool(btn.dataset.tool);
                });
            }
        });
        
        // Action buttons
        document.getElementById('importBtn').addEventListener('click', () => this.showImportModal());
        document.getElementById('exportBtn').addEventListener('click', () => this.showExportModal());
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        document.getElementById('deleteBtn').addEventListener('click', () => this.deleteSelected());
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
        
        // Render Diagram button
        document.getElementById('renderDiagramBtn').addEventListener('click', () => this.renderDiagram());
    }
    
    renderDiagram() {
        if (!this.parsedImportData || !this.parsedImportData.elements || this.parsedImportData.elements.length === 0) {
            alert('No imported data to render. Please import a markdown file first.');
            return;
        }
        
        try {
            // Clear current diagram
            this.elements = [];
            this.connections = [];
            
            // Create a copy of parsed elements and enhance them
            const elementsToRender = JSON.parse(JSON.stringify(this.parsedImportData.elements));
            const connectionsToRender = JSON.parse(JSON.stringify(this.parsedImportData.connections));
            
            // Layout elements in a better arrangement
            this.layoutElements(elementsToRender);
            
            // Add elements to canvas
            this.elements = elementsToRender;
            this.connections = connectionsToRender;
            
            // Update connections to reference the new element objects
            this.connections.forEach(connection => {
                const startIndex = this.parsedImportData.elements.indexOf(connection.startElement);
                const endIndex = this.parsedImportData.elements.indexOf(connection.endElement);
                
                if (startIndex >= 0 && endIndex >= 0) {
                    connection.startElement = this.elements[startIndex];
                    connection.endElement = this.elements[endIndex];
                    
                    // Update anchor positions
                    connection.startAnchor = this.getElementAnchors(connection.startElement)[2]; // South
                    connection.endAnchor = this.getElementAnchors(connection.endElement)[0]; // North
                }
            });
            
            // Clear selection and render
            this.clearSelection();
            this.requestRender();
            this.saveState();
            this.updateUI();
            
            alert(`Diagram rendered successfully! Created ${this.elements.length} elements and ${this.connections.length} connections.`);
            
        } catch (error) {
            console.error('Error rendering diagram:', error);
            alert('Error rendering diagram: ' + error.message);
        }
    }
    
    layoutElements(elements) {
        // Simple top-down layout with better spacing
        const startX = 300;
        const startY = 100;
        const verticalSpacing = 180;
        const horizontalSpacing = 250;
        
        let currentX = startX;
        let currentY = startY;
        let maxElementsPerRow = 3;
        let elementsInCurrentRow = 0;
        
        elements.forEach((element, index) => {
            element.x = currentX;
            element.y = currentY;
            
            // Ensure proper sizing
            if (element.type === 'diamond') {
                element.width = Math.max(element.width, 180);
                element.height = Math.max(element.height, 180);
            } else {
                element.width = Math.max(element.width, 200);
                element.height = Math.max(element.height, 120);
            }
            
            elementsInCurrentRow++;
            
            // Move to next position
            if (elementsInCurrentRow >= maxElementsPerRow) {
                // Move to next row
                currentX = startX;
                currentY += verticalSpacing;
                elementsInCurrentRow = 0;
            } else {
                // Move to next column
                currentX += horizontalSpacing;
            }
        });
    }
    
    setupModals() {
        // Import modal
        const importModal = document.getElementById('importModal');
        const closeImportBtn = document.getElementById('closeImportModal');
        const cancelImportBtn = document.getElementById('cancelImportBtn');
        const previewImportBtn = document.getElementById('previewImportBtn');
        const confirmImportBtn = document.getElementById('confirmImportBtn');
        const fileInput = document.getElementById('fileInput');
        const markdownInput = document.getElementById('markdownInput');
        
        closeImportBtn.addEventListener('click', () => this.hideModal('importModal'));
        cancelImportBtn.addEventListener('click', () => this.hideModal('importModal'));
        previewImportBtn.addEventListener('click', () => this.previewImport());
        confirmImportBtn.addEventListener('click', () => this.confirmImport());
        fileInput.addEventListener('change', this.handleFileUpload.bind(this));
        markdownInput.addEventListener('input', this.enablePreviewButton.bind(this));
        
        // Export modal
        const exportModal = document.getElementById('exportModal');
        const closeExportBtn = document.getElementById('closeExportModal');
        const cancelExportBtn = document.getElementById('cancelExportBtn');
        const confirmExportBtn = document.getElementById('confirmExportBtn');
        
        closeExportBtn.addEventListener('click', () => this.hideModal('exportModal'));
        cancelExportBtn.addEventListener('click', () => this.hideModal('exportModal'));
        confirmExportBtn.addEventListener('click', () => this.confirmExport());
        
        // Text edit modal
        const textEditModal = document.getElementById('textEditModal');
        const saveTextBtn = document.getElementById('saveTextBtn');
        const cancelTextBtn = document.getElementById('cancelTextBtn');
        
        saveTextBtn.addEventListener('click', () => this.saveTextEdit());
        cancelTextBtn.addEventListener('click', () => this.cancelTextEdit());
        
        // Close modals when clicking outside
        [importModal, exportModal, textEditModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
    }
    
    // Tool Management
    setTool(tool) {
        this.currentTool = tool;
        
        // Update UI
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        
        // Update cursor
        this.updateCursor();
        
        // Clear current drawing state
        this.isDrawing = false;
        this.isConnecting = false;
        this.currentShape = null;
        this.currentConnection = null;
        this.connectionStart = null;
    }
    
    updateCursor() {
        const wrapper = this.canvasWrapper;
        wrapper.className = wrapper.className.replace(/cursor-\w+/g, '');
        
        if (this.isPanning) {
            wrapper.classList.add('cursor-panning');
        } else {
            switch (this.currentTool) {
                case 'select':
                    wrapper.classList.add('cursor-select');
                    break;
                case 'pan':
                    wrapper.classList.add('cursor-pan');
                    break;
                case 'text':
                    wrapper.classList.add('cursor-text');
                    break;
                case 'connector':
                    wrapper.classList.add('cursor-crosshair');
                    break;
                default:
                    wrapper.classList.add('cursor-crosshair');
            }
        }
    }
    
    // Event Handlers
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        // Convert screen coordinates to canvas coordinates
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        
        // Transform to world coordinates (accounting for pan and zoom)
        this.mouseX = (screenX - this.panX) / this.zoom;
        this.mouseY = (screenY - this.panY) / this.zoom;
        
        this.lastMouseX = this.mouseX;
        this.lastMouseY = this.mouseY;
        this.dragStartX = this.mouseX;
        this.dragStartY = this.mouseY;
        this.mouseDown = true;
        
        e.preventDefault();
        
        // Handle different tools
        switch (this.currentTool) {
            case 'select':
                this.handleSelectMouseDown(e);
                break;
            case 'pan':
                this.startPanning();
                break;
            case 'rectangle':
            case 'ellipse':
            case 'diamond':
            case 'text':
                this.startDrawingShape();
                break;
            case 'line':
                this.startDrawingLine();
                break;
            case 'connector':
                this.startDrawingConnector();
                break;
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        // Convert screen coordinates to canvas coordinates
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        
        // Transform to world coordinates (accounting for pan and zoom)
        this.mouseX = (screenX - this.panX) / this.zoom;
        this.mouseY = (screenY - this.panY) / this.zoom;
        
        if (this.mouseDown) {
            if (this.isPanning) {
                this.updatePanning(screenX, screenY);
            } else if (this.isDragging) {
                this.updateDragging();
            } else if (this.isDrawing) {
                this.updateDrawing();
            } else if (this.isConnecting) {
                this.updateConnecting();
            } else if (this.isResizing) {
                this.updateResizing();
            }
            
            // Only render during active interactions to prevent infinite loops
            this.requestRender();
        }
        
        this.lastMouseX = this.mouseX;
        this.lastMouseY = this.mouseY;
    }
    
    handleMouseUp(e) {
        if (this.isDrawing) {
            this.finishDrawing();
        } else if (this.isConnecting) {
            this.finishConnecting();
        } else if (this.isDragging || this.isResizing) {
            this.saveState();
        }
        
        this.mouseDown = false;
        this.isDragging = false;
        this.isDrawing = false;
        this.isConnecting = false;
        this.isResizing = false;
        this.isPanning = false;
        this.currentShape = null;
        this.currentConnection = null;
        this.connectionStart = null;
        this.resizeHandle = null;
        
        this.updateCursor();
        this.requestRender();
    }
    
    handleDoubleClick(e) {
        if (this.currentTool === 'select') {
            const element = this.getElementAt(this.mouseX, this.mouseY);
            if (element && (element.type === 'rectangle' || element.type === 'ellipse' || 
                           element.type === 'diamond' || element.type === 'text')) {
                this.editText(element);
            }
        }
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Zoom towards mouse position
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.5, Math.min(3, this.zoom * zoomFactor));
        
        if (newZoom !== this.zoom) {
            const zoomRatio = newZoom / this.zoom;
            this.panX = mouseX - (mouseX - this.panX) * zoomRatio;
            this.panY = mouseY - (mouseY - this.panY) * zoomRatio;
            this.zoom = newZoom;
            
            this.updateCanvasTransform();
            this.requestRender();
            this.updateUI();
        }
    }
    
    handleKeyDown(e) {
        // Handle space for panning
        if (e.code === 'Space' && !this.isPanning && this.currentTool !== 'text') {
            e.preventDefault();
            this.setTool('pan');
            return;
        }
        
        // Handle shortcuts
        if (e.ctrlKey || e.metaKey) {
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
                case 'a':
                    e.preventDefault();
                    this.selectAll();
                    break;
                case 'i':
                    e.preventDefault();
                    this.showImportModal();
                    break;
                case 'd':
                    e.preventDefault();
                    this.duplicateSelected();
                    break;
            }
        } else {
            switch (e.key) {
                case 'Delete':
                case 'Backspace':
                    this.deleteSelected();
                    break;
                case 'Escape':
                    this.clearSelection();
                    this.setTool('select');
                    break;
            }
        }
    }
    
    handleKeyUp(e) {
        if (e.code === 'Space' && this.currentTool === 'pan') {
            this.setTool('select');
        }
    }
    
    handleResize() {
        this.setupCanvas();
        this.requestRender();
    }
    
    handleFileDrop(e) {
        e.preventDefault();
        const files = e.dataTransfer.files;
        for (let file of files) {
            if (file.name.endsWith('.md')) {
                this.loadFile(file);
                break;
            }
        }
    }
    
    // Select Tool Handlers
    handleSelectMouseDown(e) {
        const element = this.getElementAt(this.mouseX, this.mouseY);
        
        if (element) {
            // Check for resize handle
            const handle = this.getResizeHandle(element, this.mouseX, this.mouseY);
            if (handle) {
                this.isResizing = true;
                this.resizeHandle = handle;
                this.selectElement(element);
                return;
            }
            
            // Select element
            if (!e.ctrlKey && !e.metaKey) {
                if (!this.selectedElements.includes(element)) {
                    this.selectElement(element);
                }
            } else {
                this.toggleSelection(element);
            }
            
            // Start dragging
            this.isDragging = true;
        } else {
            // Clear selection if not holding Ctrl/Cmd
            if (!e.ctrlKey && !e.metaKey) {
                this.clearSelection();
            }
            
            // Start marquee selection (not implemented in minimal version)
        }
    }
    
    // Shape Drawing
    startDrawingShape() {
        this.isDrawing = true;
        this.currentShape = {
            type: this.currentTool,
            x: this.mouseX,
            y: this.mouseY,
            width: 0,
            height: 0,
            ...this.getDefaultShapeProperties(this.currentTool)
        };
    }
    
    updateDrawing() {
        if (this.currentShape) {
            const width = Math.abs(this.mouseX - this.dragStartX);
            const height = Math.abs(this.mouseY - this.dragStartY);
            
            this.currentShape.x = Math.min(this.dragStartX, this.mouseX);
            this.currentShape.y = Math.min(this.dragStartY, this.mouseY);
            this.currentShape.width = Math.max(width, 20);
            this.currentShape.height = Math.max(height, 20);
            
            // Maintain aspect ratio for diamond with Shift
            if (this.currentShape.type === 'diamond' && event.shiftKey) {
                const size = Math.max(this.currentShape.width, this.currentShape.height);
                this.currentShape.width = size;
                this.currentShape.height = size;
            }
        }
    }
    
    finishDrawing() {
        if (this.currentShape) {
            // Apply defaults for small shapes or single clicks
            const defaults = this.defaults[this.currentShape.type];
            if (defaults && (this.currentShape.width < 50 || this.currentShape.height < 30)) {
                this.currentShape.width = defaults.width;
                this.currentShape.height = defaults.height;
            }
            
            // Ensure minimum size
            this.currentShape.width = Math.max(this.currentShape.width, 20);
            this.currentShape.height = Math.max(this.currentShape.height, 20);
            
            this.elements.push(this.currentShape);
            this.selectElement(this.currentShape);
            this.saveState();
            
            // Auto-edit text for text tool
            if (this.currentShape.type === 'text') {
                setTimeout(() => this.editText(this.currentShape), 100);
            }
        }
    }
    
    // Line Drawing
    startDrawingLine() {
        this.isDrawing = true;
        this.currentConnection = {
            type: 'line',
            startX: this.mouseX,
            startY: this.mouseY,
            endX: this.mouseX,
            endY: this.mouseY,
            ...this.getDefaultLineProperties()
        };
    }
    
    // Connector Drawing
    startDrawingConnector() {
        const element = this.getElementAt(this.mouseX, this.mouseY);
        if (element) {
            this.isConnecting = true;
            this.connectionStart = {
                element: element,
                x: this.mouseX,
                y: this.mouseY,
                anchor: this.getNearestAnchor(element, this.mouseX, this.mouseY)
            };
        }
    }
    
    updateConnecting() {
        // Visual feedback during connection
    }
    
    finishConnecting() {
        if (this.connectionStart) {
            const endElement = this.getElementAt(this.mouseX, this.mouseY);
            if (endElement && endElement !== this.connectionStart.element) {
                const endAnchor = this.getNearestAnchor(endElement, this.mouseX, this.mouseY);
                
                const connection = {
                    type: 'connector',
                    startElement: this.connectionStart.element,
                    endElement: endElement,
                    startAnchor: this.connectionStart.anchor,
                    endAnchor: endAnchor,
                    ...this.getDefaultConnectorProperties()
                };
                
                this.connections.push(connection);
                this.saveState();
            }
        }
    }
    
    // Panning
    startPanning() {
        this.isPanning = true;
        this.updateCursor();
    }
    
    updatePanning(screenX, screenY) {
        // For panning, we work with screen coordinates directly
        const rect = this.canvas.getBoundingClientRect();
        const currentScreenX = screenX || (this.mouseX * this.zoom + this.panX);
        const currentScreenY = screenY || (this.mouseY * this.zoom + this.panY);
        
        // Calculate screen delta
        const deltaX = currentScreenX - (this.lastMouseX * this.zoom + this.panX);
        const deltaY = currentScreenY - (this.lastMouseY * this.zoom + this.panY);
        
        this.panX += deltaX;
        this.panY += deltaY;
        
        this.updateCanvasTransform();
    }
    
    // Dragging
    updateDragging() {
        if (this.selectedElements.length > 0) {
            const deltaX = this.mouseX - this.lastMouseX;
            const deltaY = this.mouseY - this.lastMouseY;
            
            this.selectedElements.forEach(element => {
                element.x += deltaX;
                element.y += deltaY;
                
                // Keep within canvas bounds
                element.x = Math.max(0, Math.min(this.canvasWidth - element.width, element.x));
                element.y = Math.max(0, Math.min(this.canvasHeight - element.height, element.y));
            });
        }
    }
    
    // Resizing
    updateResizing() {
        if (this.selectedElements.length === 1 && this.resizeHandle) {
            const element = this.selectedElements[0];
            const deltaX = this.mouseX - this.lastMouseX;
            const deltaY = this.mouseY - this.lastMouseY;
            
            switch (this.resizeHandle) {
                case 'se':
                    element.width = Math.max(20, element.width + deltaX);
                    element.height = Math.max(20, element.height + deltaY);
                    break;
                case 'sw':
                    element.width = Math.max(20, element.width - deltaX);
                    element.height = Math.max(20, element.height + deltaY);
                    element.x = Math.max(0, element.x + deltaX);
                    break;
                case 'ne':
                    element.width = Math.max(20, element.width + deltaX);
                    element.height = Math.max(20, element.height - deltaY);
                    element.y = Math.max(0, element.y + deltaY);
                    break;
                case 'nw':
                    element.width = Math.max(20, element.width - deltaX);
                    element.height = Math.max(20, element.height - deltaY);
                    element.x = Math.max(0, element.x + deltaX);
                    element.y = Math.max(0, element.y + deltaY);
                    break;
            }
            
            // Maintain aspect ratio with Shift
            if (event.shiftKey) {
                const aspectRatio = element.width / element.height;
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    element.height = element.width / aspectRatio;
                } else {
                    element.width = element.height * aspectRatio;
                }
            }
        }
    }
    
    // Selection Management
    selectElement(element) {
        this.selectedElements = [element];
        this.requestRender();
    }
    
    toggleSelection(element) {
        const index = this.selectedElements.indexOf(element);
        if (index > -1) {
            this.selectedElements.splice(index, 1);
        } else {
            this.selectedElements.push(element);
        }
        this.requestRender();
    }
    
    clearSelection() {
        this.selectedElements = [];
        this.requestRender();
    }
    
    selectAll() {
        this.selectedElements = [...this.elements];
        this.requestRender();
    }
    
    deleteSelected() {
        if (this.selectedElements.length > 0) {
            // Remove connections that involve selected elements
            this.connections = this.connections.filter(conn => 
                !this.selectedElements.includes(conn.startElement) && 
                !this.selectedElements.includes(conn.endElement)
            );
            
            // Remove selected elements
            this.selectedElements.forEach(element => {
                const index = this.elements.indexOf(element);
                if (index > -1) {
                    this.elements.splice(index, 1);
                }
            });
            
            this.clearSelection();
            this.saveState();
            this.requestRender();
            this.updateUI();
        }
    }
    
    duplicateSelected() {
        if (this.selectedElements.length > 0) {
            const duplicates = [];
            this.selectedElements.forEach(element => {
                const duplicate = { ...element };
                duplicate.x += 20;
                duplicate.y += 20;
                this.elements.push(duplicate);
                duplicates.push(duplicate);
            });
            
            this.selectedElements = duplicates;
            this.saveState();
            this.requestRender();
        }
    }
    
    // Utility Functions
    getElementAt(x, y) {
        // Check in reverse order (top to bottom)
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const element = this.elements[i
