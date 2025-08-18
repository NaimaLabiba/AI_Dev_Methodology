class DiagrammingInterface {
    constructor() {
        this.canvas = document.getElementById('diagramCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvasOverlay = document.getElementById('canvasOverlay');
        
        // State management
        this.elements = [];
        this.connections = [];
        this.selectedElement = null;
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
        
        // History for undo/redo
        this.history = [];
        this.historyIndex = -1;
        
        // Mouse state
        this.mouseX = 0;
        this.mouseY = 0;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.isMouseDown = false;
        
        // Connection mode
        this.connectionMode = false;
        this.connectionStart = null;
        this.connectionEnd = null;
        this.tempConnection = null;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.setupToolbar();
        this.setupProperties();
        this.render();
        this.saveState();
    }
    
    setupCanvas() {
        // Set canvas size to match container without DPI scaling issues
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        this.canvas.width = rect.width - 32; // Account for margin
        this.canvas.height = rect.height - 32;
        this.canvas.style.width = (rect.width - 32) + 'px';
        this.canvas.style.height = (rect.height - 32) + 'px';
    }
    
    setupEventListeners() {
        // Canvas events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        
        // Window events
        window.addEventListener('resize', this.handleResize.bind(this));
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    }
    
    setupDragAndDrop() {
        const shapeItems = document.querySelectorAll('.shape-item');
        
        shapeItems.forEach(item => {
            // Add click handler as fallback for drag-and-drop
            item.addEventListener('click', (e) => {
                const shapeType = item.dataset.shape;
                // Create shape at center of canvas
                const centerX = this.canvas.width / 2;
                const centerY = this.canvas.height / 2;
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
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.createShape(shapeType, x, y);
        });
    }
    
    setupToolbar() {
        // File operations
        document.getElementById('newBtn').addEventListener('click', () => this.newDiagram());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveDiagram());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportDiagram());
        
        // Edit operations
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        
        // Zoom operations
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
        document.getElementById('resetZoomBtn').addEventListener('click', () => this.resetZoom());
    }
    
    setupProperties() {
        // Property change listeners
        document.getElementById('fillColor').addEventListener('change', (e) => {
            if (this.selectedElement) {
                this.selectedElement.fillColor = e.target.value;
                this.render();
                this.saveState();
            }
        });
        
        document.getElementById('borderColor').addEventListener('change', (e) => {
            if (this.selectedElement) {
                this.selectedElement.borderColor = e.target.value;
                this.render();
                this.saveState();
            }
        });
        
        document.getElementById('borderWidth').addEventListener('input', (e) => {
            if (this.selectedElement) {
                this.selectedElement.borderWidth = parseInt(e.target.value);
                document.getElementById('borderWidthValue').textContent = e.target.value + 'px';
                this.render();
                this.saveState();
            }
        });
        
        document.getElementById('elementText').addEventListener('input', (e) => {
            if (this.selectedElement) {
                this.selectedElement.text = e.target.value;
                this.render();
                this.saveState();
            }
        });
        
        document.getElementById('fontSize').addEventListener('input', (e) => {
            if (this.selectedElement) {
                this.selectedElement.fontSize = parseInt(e.target.value);
                document.getElementById('fontSizeValue').textContent = e.target.value + 'px';
                this.render();
                this.saveState();
            }
        });
        
        // Position and size inputs
        ['posX', 'posY', 'width', 'height'].forEach(id => {
            document.getElementById(id).addEventListener('change', (e) => {
                if (this.selectedElement) {
                    const value = parseFloat(e.target.value);
                    if (id === 'posX') this.selectedElement.x = value;
                    else if (id === 'posY') this.selectedElement.y = value;
                    else if (id === 'width') this.selectedElement.width = Math.max(20, value);
                    else if (id === 'height') this.selectedElement.height = Math.max(20, value);
                    this.render();
                    this.saveState();
                }
            });
        });
        
        // Action buttons
        document.getElementById('deleteElement').addEventListener('click', () => this.deleteSelected());
        document.getElementById('duplicateElement').addEventListener('click', () => this.duplicateSelected());
    }
    
    createShape(type, x, y) {
        const element = {
            id: Date.now() + Math.random(),
            type: type,
            x: x - 50,
            y: y - 25,
            width: 100,
            height: 50,
            fillColor: '#ffffff',
            borderColor: '#000000',
            borderWidth: 2,
            text: type.charAt(0).toUpperCase() + type.slice(1),
            fontSize: 14,
            rotation: 0,
            connectionPoints: []
        };
        
        // Adjust default sizes and properties for different shapes
        switch (type) {
            case 'circle':
                element.width = element.height = 80;
                element.fillColor = '#e3f2fd';
                break;
            case 'diamond':
            case 'decision':
                element.width = element.height = 80;
                element.fillColor = '#fff3e0';
                break;
            case 'triangle':
                element.width = 80;
                element.height = 70;
                element.fillColor = '#f3e5f5';
                break;
            case 'text':
                element.width = 120;
                element.height = 30;
                element.fillColor = 'transparent';
                element.borderColor = 'transparent';
                element.text = 'Text';
                break;
            case 'arrow':
                element.width = 100;
                element.height = 20;
                element.fillColor = '#333333';
                element.text = '';
                break;
            case 'process':
                element.fillColor = '#e8f5e8';
                break;
            case 'start-end':
                element.fillColor = '#fff8e1';
                element.width = 120;
                element.height = 60;
                break;
        }
        
        // Add connection points
        this.updateConnectionPoints(element);
        
        this.elements.push(element);
        this.selectElement(element);
        this.render();
        this.saveState();
    }
    
    updateConnectionPoints(element) {
        element.connectionPoints = [
            { x: element.x + element.width / 2, y: element.y }, // top
            { x: element.x + element.width, y: element.y + element.height / 2 }, // right
            { x: element.x + element.width / 2, y: element.y + element.height }, // bottom
            { x: element.x, y: element.y + element.height / 2 } // left
        ];
    }
    
    selectElement(element) {
        this.selectedElement = element;
        this.updatePropertiesPanel();
        this.render();
    }
    
    updatePropertiesPanel() {
        const noSelection = document.getElementById('noSelection');
        const elementProperties = document.getElementById('elementProperties');
        
        if (this.selectedElement) {
            noSelection.style.display = 'none';
            elementProperties.style.display = 'block';
            
            // Update property values
            document.getElementById('fillColor').value = this.selectedElement.fillColor === 'transparent' ? '#ffffff' : this.selectedElement.fillColor;
            document.getElementById('borderColor').value = this.selectedElement.borderColor === 'transparent' ? '#000000' : this.selectedElement.borderColor;
            document.getElementById('borderWidth').value = this.selectedElement.borderWidth;
            document.getElementById('borderWidthValue').textContent = this.selectedElement.borderWidth + 'px';
            document.getElementById('elementText').value = this.selectedElement.text;
            document.getElementById('fontSize').value = this.selectedElement.fontSize;
            document.getElementById('fontSizeValue').textContent = this.selectedElement.fontSize + 'px';
            document.getElementById('posX').value = Math.round(this.selectedElement.x);
            document.getElementById('posY').value = Math.round(this.selectedElement.y);
            document.getElementById('width').value = Math.round(this.selectedElement.width);
            document.getElementById('height').value = Math.round(this.selectedElement.height);
        } else {
            noSelection.style.display = 'block';
            elementProperties.style.display = 'none';
        }
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        this.lastMouseX = this.mouseX;
        this.lastMouseY = this.mouseY;
        this.isMouseDown = true;
        
        // Check if clicking on a connection point first
        const connectionPoint = this.getConnectionPointAt(this.mouseX, this.mouseY);
        if (connectionPoint && this.selectedElement) {
            // Start connection mode
            this.connectionMode = true;
            this.connectionStart = {
                element: this.selectedElement,
                point: connectionPoint
            };
            this.canvas.style.cursor = 'crosshair';
            e.preventDefault();
            return;
        }
        
        // Check if clicking on an element
        const clickedElement = this.getElementAt(this.mouseX, this.mouseY);
        
        if (clickedElement) {
            this.selectElement(clickedElement);
            if (!this.connectionMode) {
                this.isDragging = true;
                this.draggedElement = clickedElement;
                this.canvas.style.cursor = 'grabbing';
            }
        } else {
            this.selectedElement = null;
            this.connectionMode = false;
            this.connectionStart = null;
            this.tempConnection = null;
            this.updatePropertiesPanel();
            this.render();
        }
        
        e.preventDefault();
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        
        // Handle connection mode
        if (this.connectionMode && this.connectionStart) {
            // Update temporary connection line
            this.tempConnection = {
                start: this.connectionStart.point,
                end: { x: this.mouseX, y: this.mouseY }
            };
            this.render();
            this.drawTempConnection();
            return;
        }
        
        // Update cursor based on what's under the mouse
        const connectionPoint = this.getConnectionPointAt(this.mouseX, this.mouseY);
        if (connectionPoint && this.selectedElement) {
            this.canvas.style.cursor = 'crosshair';
        } else {
            const elementUnderMouse = this.getElementAt(this.mouseX, this.mouseY);
            if (elementUnderMouse && !this.isDragging && !this.connectionMode) {
                this.canvas.style.cursor = 'grab';
            } else if (!this.isDragging && !this.connectionMode) {
                this.canvas.style.cursor = 'default';
            }
        }
        
        if (this.isDragging && this.draggedElement && this.isMouseDown) {
            const deltaX = this.mouseX - this.lastMouseX;
            const deltaY = this.mouseY - this.lastMouseY;
            
            this.draggedElement.x += deltaX;
            this.draggedElement.y += deltaY;
            
            // Update connection points
            this.updateConnectionPoints(this.draggedElement);
            
            // Update any connections to this element
            this.connections.forEach(conn => {
                if (conn.startElement === this.draggedElement) {
                    conn.start = this.draggedElement.connectionPoints.find(p => 
                        Math.abs(p.x - conn.start.x) < 10 && Math.abs(p.y - conn.start.y) < 10
                    ) || conn.start;
                }
                if (conn.endElement === this.draggedElement) {
                    conn.end = this.draggedElement.connectionPoints.find(p => 
                        Math.abs(p.x - conn.end.x) < 10 && Math.abs(p.y - conn.end.y) < 10
                    ) || conn.end;
                }
            });
            
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
            const targetConnectionPoint = this.getConnectionPointAt(this.mouseX, this.mouseY);
            
            if (targetElement && targetElement !== this.connectionStart.element) {
                // Find the closest connection point on the target element
                let closestPoint = targetElement.connectionPoints[0];
                let minDistance = Infinity;
                
                targetElement.connectionPoints.forEach(point => {
                    const distance = Math.sqrt((this.mouseX - point.x) ** 2 + (this.mouseY - point.y) ** 2);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestPoint = point;
                    }
                });
                
                // Create the connection
                const connection = {
                    id: Date.now() + Math.random(),
                    startElement: this.connectionStart.element,
                    endElement: targetElement,
                    start: { ...this.connectionStart.point },
                    end: { ...closestPoint }
                };
                
                this.connections.push(connection);
                this.saveState();
            }
            
            // Reset connection mode
            this.connectionMode = false;
            this.connectionStart = null;
            this.tempConnection = null;
            this.render();
        }
        
        this.isDragging = false;
        this.draggedElement = null;
        this.isMouseDown = false;
        this.canvas.style.cursor = 'default';
        
        // Update cursor for element under mouse
        const elementUnderMouse = this.getElementAt(this.mouseX, this.mouseY);
        if (elementUnderMouse) {
            this.canvas.style.cursor = 'grab';
        }
    }
    
    handleClick(e) {
        // Click handling is done in mousedown for better responsiveness
    }
    
    handleDoubleClick(e) {
        const clickedElement = this.getElementAt(this.mouseX, this.mouseY);
        if (clickedElement) {
            // Focus on text input for editing
            document.getElementById('elementText').focus();
            document.getElementById('elementText').select();
        }
    }
    
    handleResize() {
        this.setupCanvas();
        this.render();
    }
    
    handleKeyDown(e) {
        if (e.key === 'Delete' && this.selectedElement) {
            this.deleteSelected();
        } else if (e.key === 'Escape') {
            this.selectedElement = null;
            this.updatePropertiesPanel();
            this.render();
        } else if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z') {
                e.preventDefault();
                this.undo();
            } else if (e.key === 'y') {
                e.preventDefault();
                this.redo();
            } else if (e.key === 'd') {
                e.preventDefault();
                this.duplicateSelected();
            }
        }
    }
    
    getElementAt(x, y) {
        // Check elements in reverse order (top to bottom)
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
            if (distance <= 8) { // 8px radius for connection point hit detection
                return point;
            }
        }
        return null;
    }
    
    isPointInElement(x, y, element) {
        // Handle different shape types for more accurate hit detection
        switch (element.type) {
            case 'circle':
                const centerX = element.x + element.width / 2;
                const centerY = element.y + element.height / 2;
                const radius = Math.min(element.width, element.height) / 2;
                const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                return distance <= radius;
                
            case 'diamond':
            case 'decision':
                // Diamond hit detection
                const diamondCenterX = element.x + element.width / 2;
                const diamondCenterY = element.y + element.height / 2;
                const relX = Math.abs(x - diamondCenterX);
                const relY = Math.abs(y - diamondCenterY);
                return (relX / (element.width / 2) + relY / (element.height / 2)) <= 1;
                
            case 'triangle':
                // Simple triangle hit detection (could be improved)
                return x >= element.x && x <= element.x + element.width &&
                       y >= element.y && y <= element.y + element.height;
                
            default:
                // Rectangle hit detection
                return x >= element.x && x <= element.x + element.width &&
                       y >= element.y && y <= element.y + element.height;
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply zoom and pan
        this.ctx.save();
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(this.panX, this.panY);
        
        // Draw all connections first (behind elements)
        this.connections.forEach(connection => {
            this.drawConnection(connection);
        });
        
        // Draw all elements
        this.elements.forEach(element => {
            this.drawElement(element);
        });
        
        // Draw selection outline and handles
        if (this.selectedElement) {
            this.drawSelection(this.selectedElement);
            this.drawConnectionPoints(this.selectedElement);
        }
        
        this.ctx.restore();
        
        // Update canvas info
        document.getElementById('canvasInfo').textContent = 
            `Elements: ${this.elements.length} | Connections: ${this.connections.length} | Zoom: ${Math.round(this.zoom * 100)}%`;
    }
    
    drawElement(element) {
        this.ctx.save();
        
        // Set styles
        this.ctx.fillStyle = element.fillColor;
        this.ctx.strokeStyle = element.borderColor;
        this.ctx.lineWidth = element.borderWidth;
        this.ctx.font = `${element.fontSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Draw shape based on type
        switch (element.type) {
            case 'rectangle':
            case 'process':
                this.drawRectangle(element);
                break;
            case 'circle':
                this.drawCircle(element);
                break;
            case 'diamond':
            case 'decision':
                this.drawDiamond(element);
                break;
            case 'triangle':
                this.drawTriangle(element);
                break;
            case 'start-end':
                this.drawRoundedRectangle(element);
                break;
            case 'text':
                this.drawText(element);
                break;
            case 'arrow':
                this.drawArrow(element);
                break;
        }
        
        this.ctx.restore();
    }
    
    drawRectangle(element) {
        if (element.fillColor !== 'transparent') {
            this.ctx.fillRect(element.x, element.y, element.width, element.height);
        }
        if (element.borderColor !== 'transparent') {
            this.ctx.strokeRect(element.x, element.y, element.width, element.height);
        }
        
        // Draw text
        if (element.text) {
            this.ctx.fillStyle = '#000000';
            this.ctx.fillText(element.text, 
                element.x + element.width / 2, 
                element.y + element.height / 2);
        }
    }
    
    drawCircle(element) {
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        const radius = Math.min(element.width, element.height) / 2;
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        
        if (element.fillColor !== 'transparent') {
            this.ctx.fill();
        }
        if (element.borderColor !== 'transparent') {
            this.ctx.stroke();
        }
        
        // Draw text
        if (element.text) {
            this.ctx.fillStyle = '#000000';
            this.ctx.fillText(element.text, centerX, centerY);
        }
    }
    
    drawDiamond(element) {
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
            this.ctx.fillStyle = '#000000';
            this.ctx.fillText(element.text, centerX, centerY);
        }
    }
    
    drawTriangle(element) {
        const centerX = element.x + element.width / 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, element.y);
        this.ctx.lineTo(element.x + element.width, element.y + element.height);
        this.ctx.lineTo(element.x, element.y + element.height);
        this.ctx.closePath();
        
        if (element.fillColor !== 'transparent') {
            this.ctx.fill();
        }
        if (element.borderColor !== 'transparent') {
            this.ctx.stroke();
        }
        
        // Draw text
        if (element.text) {
            this.ctx.fillStyle = '#000000';
            this.ctx.fillText(element.text, centerX, element.y + element.height * 0.6);
        }
    }
    
    drawRoundedRectangle(element) {
        const radius = Math.min(element.width, element.height) / 4;
        
        this.ctx.beginPath();
        this.ctx.roundRect(element.x, element.y, element.width, element.height, radius);
        
        if (element.fillColor !== 'transparent') {
            this.ctx.fill();
        }
        if (element.borderColor !== 'transparent') {
            this.ctx.stroke();
        }
        
        // Draw text
        if (element.text) {
            this.ctx.fillStyle = '#000000';
            this.ctx.fillText(element.text, 
                element.x + element.width / 2, 
                element.y + element.height / 2);
        }
    }
    
    drawText(element) {
        // Draw background if not transparent
        if (element.fillColor !== 'transparent') {
            this.ctx.fillStyle = element.fillColor;
            this.ctx.fillRect(element.x, element.y, element.width, element.height);
        }
        
        this.ctx.fillStyle = '#000000';
        this.ctx.fillText(element.text, 
            element.x + element.width / 2, 
            element.y + element.height / 2);
    }
    
    drawArrow(element) {
        const headLength = 15;
        const headWidth = 8;
        
        this.ctx.beginPath();
        this.ctx.moveTo(element.x, element.y + element.height / 2);
        this.ctx.lineTo(element.x + element.width - headLength, element.y + element.height / 2);
        
        // Arrow head
        this.ctx.lineTo(element.x + element.width - headLength, element.y + element.height / 2 - headWidth);
        this.ctx.lineTo(element.x + element.width, element.y + element.height / 2);
        this.ctx.lineTo(element.x + element.width - headLength, element.y + element.height / 2 + headWidth);
        this.ctx.lineTo(element.x + element.width - headLength, element.y + element.height / 2);
        
        this.ctx.strokeStyle = element.fillColor;
        this.ctx.lineWidth = element.borderWidth;
        this.ctx.stroke();
    }
    
    drawSelection(element) {
        this.ctx.strokeStyle = '#2196f3';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(element.x - 2, element.y - 2, element.width + 4, element.height + 4);
        this.ctx.setLineDash([]);
        
        // Draw resize handles
        const handles = [
            { x: element.x - 4, y: element.y - 4 }, // top-left
            { x: element.x + element.width - 4, y: element.y - 4 }, // top-right
            { x: element.x - 4, y: element.y + element.height - 4 }, // bottom-left
            { x: element.x + element.width - 4, y: element.y + element.height - 4 } // bottom-right
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
    
    drawConnection(connection) {
        this.ctx.strokeStyle = '#666666';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(connection.start.x, connection.start.y);
        this.ctx.lineTo(connection.end.x, connection.end.y);
        this.ctx.stroke();
        
        // Draw arrow head
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
        
        // Draw temporary arrow head
        const angle = Math.atan2(
            this.tempConnection.end.y - this.tempConnection.start.y, 
            this.tempConnection.end.x - this.tempConnection.start.x
        );
        const headLength = 10;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.tempConnection.end.x, this.tempConnection.end.y);
        this.ctx.lineTo(
            this.tempConnection.end.x - headLength * Math.cos(angle - Math.PI / 6),
            this.tempConnection.end.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(this.tempConnection.end.x, this.tempConnection.end.y);
        this.ctx.lineTo(
            this.tempConnection.end.x - headLength * Math.cos(angle + Math.PI / 6),
            this.tempConnection.end.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.stroke();
    }
    
    // File operations
    newDiagram() {
        this.elements = [];
        this.connections = [];
        this.selectedElement = null;
        this.updatePropertiesPanel();
        this.render();
        this.saveState();
    }
    
    saveDiagram() {
        const data = {
            elements: this.elements,
            connections: this.connections,
            zoom: this.zoom,
            panX: this.panX,
            panY: this.panY
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diagram.json';
        a.click();
        URL.revokeObjectURL(url);
    }
    
    exportDiagram() {
        const link = document.createElement('a');
        link.download = 'diagram.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }
    
    // Edit operations
    deleteSelected() {
        if (this.selectedElement) {
            const index = this.elements.indexOf(this.selectedElement);
            if (index > -1) {
                // Remove connections to this element
                this.connections = this.connections.filter(conn => 
                    conn.startElement !== this.selectedElement && 
                    conn.endElement !== this.selectedElement
                );
                
                this.elements.splice(index, 1);
                this.selectedElement = null;
                this.updatePropertiesPanel();
                this.render();
                this.saveState();
            }
        }
    }
    
    duplicateSelected() {
        if (this.selectedElement) {
            const newElement = { ...this.selectedElement };
            newElement.id = Date.now() + Math.random();
            newElement.x += 20;
            newElement.y += 20;
            this.updateConnectionPoints(newElement);
            this.elements.push(newElement);
            this.selectElement(newElement);
            this.render();
            this.saveState();
        }
    }
    
    // History management
    saveState() {
        const state = JSON.stringify({
            elements: this.elements,
            connections: this.connections
        });
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(state);
        this.historyIndex++;
        
        // Limit history size
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const state = JSON.parse(this.history[this.historyIndex]);
            this.elements = state.elements;
            this.connections = state.connections;
            this.selectedElement = null;
            this.updatePropertiesPanel();
            this.render();
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const state = JSON.parse(this.history[this.historyIndex]);
            this.elements = state.elements;
            this.connections = state.connections;
            this.selectedElement = null;
            this.updatePropertiesPanel();
            this.render();
        }
    }
    
    // Zoom operations
    zoomIn() {
        this.zoom = Math.min(this.zoom * 1.2, 3);
        this.render();
    }
    
    zoomOut() {
        this.zoom = Math.max(this.zoom / 1.2, 0.1);
        this.render();
    }
    
    resetZoom() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.render();
    }
}

// UIHeader component - Persistent methodology display
class UIHeader {
    constructor() {
        this.currentMode = 'manual';
        this.headerElement = null;
        this.methodologySelect = document.getElementById('methodologySelect');
        
        this.init();
    }
    
    init() {
        this.createHeader();
        this.updateHeader();
        this.setupEventListeners();
    }
    
    createHeader() {
        // Remove any existing header
        const existingHeader = document.getElementById('uiHeader');
        if (existingHeader) {
            existingHeader.remove();
        }
        
        // Create new header element
        this.headerElement = document.createElement('div');
        this.headerElement.id = 'uiHeader';
        this.headerElement.className = 'ui-header';
        
        // Add to body
        document.body.appendChild(this.headerElement);
    }
    
    setupEventListeners() {
        // Listen for methodology changes
        if (this.methodologySelect) {
            this.methodologySelect.addEventListener('change', (e) => {
                this.setMode(e.target.value);
            });
        }
    }
    
    setMode(mode) {
        this.currentMode = mode;
        this.updateHeader();
    }
    
    updateHeader() {
        if (!this.headerElement) return;
        
        const methodologyConfig = {
            manual: {
                icon: '⚙️',
                text: 'Manual',
                subtitle: 'Free-form'
            },
            tdd: {
                icon: '🔴',
                text: 'TDD',
                subtitle: 'Red-Green-Refactor'
            },
            bdd: {
                icon: '🟢',
                text: 'BDD',
                subtitle: 'Given-When-Then'
            },
            ddd: {
                icon: '🏗️',
                text: 'DDD',
                subtitle: 'Domain-Driven'
            },
            sdd: {
                icon: '📋',
                text: 'SDD',
                subtitle: 'Specification-Driven'
            }
        };
        
        const config = methodologyConfig[this.currentMode] || methodologyConfig.manual;
        
        // Update header class for styling
        this.headerElement.className = `ui-header ${this.currentMode}`;
        
        // Update header content
        this.headerElement.innerHTML = `
            <div class="ui-header-content">
                <span class="ui-header-icon">${config.icon}</span>
                <span class="ui-header-text">${config.text}</span>
                <span class="ui-header-subtitle">${config.subtitle}</span>
            </div>
        `;
    }
    
    updatePosition(position) {
        if (!this.headerElement) return;
        
        this.headerElement.style.top = `${position.y}px`;
        this.headerElement.style.right = `${20}px`; // Always keep 20px from right edge
    }
    
    applyTheme() {
        // Theme is applied via CSS classes based on current mode
        this.updateHeader();
    }
    
    render(mode) {
        if (mode && mode !== this.currentMode) {
            this.setMode(mode);
        }
        // Header is always visible, no need to show/hide
    }
}

// Methodology functionality
class MethodologyManager {
    constructor() {
        this.modal = document.getElementById('methodologyModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalContent = document.getElementById('methodologyContent');
        this.methodologySelect = document.getElementById('methodologySelect');
        this.viewMethodologyBtn = document.getElementById('viewMethodologyBtn');
        this.closeModal = document.getElementById('closeModal');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        
        // Initialize UIHeader
        this.uiHeader = new UIHeader();
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.viewMethodologyBtn.addEventListener('click', () => {
            this.showMethodology();
        });
        
        this.closeModal.addEventListener('click', () => {
            this.hideModal();
        });
        
        this.closeModalBtn.addEventListener('click', () => {
            this.hideModal();
        });
        
        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.hideModal();
            }
        });
        
        // Listen for methodology changes
        this.methodologySelect.addEventListener('change', () => {
            this.updateMethodologyTitle();
        });
        
        // Initialize methodology title on load
        this.updateMethodologyTitle();
    }
    
    async showMethodology() {
        const selectedMethodology = this.methodologySelect.value;
        const methodologyNames = {
            'manual': 'Manual Development',
            'tdd': 'Test-Driven Development (TDD)',
            'bdd': 'Behavior-Driven Development (BDD)',
            'ddd': 'Domain-Driven Design (DDD)',
            'sdd': 'Specification-Driven Development (SDD)'
        };
        
        this.modalTitle.textContent = methodologyNames[selectedMethodology];
        
        // Show loading state
        this.modalContent.innerHTML = '<div class="loading">Loading methodology content...</div>';
        this.modal.style.display = 'block';
        
        try {
            const response = await fetch(`db/${selectedMethodology}.md`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const markdown = await response.text();
            
            if (!markdown.trim()) {
                throw new Error('Empty content received');
            }
            
            this.modalContent.innerHTML = this.parseMarkdown(markdown);
            
            // Update BDD title display if BDD is selected
            if (selectedMethodology === 'bdd') {
                this.updateBDDTitle();
            }
            
        } catch (error) {
            console.error('Error loading methodology:', error);
            this.modalContent.innerHTML = `
                <div class="error-message">
                    <h3>⚠️ Error Loading Content</h3>
                    <p>Failed to load ${methodologyNames[selectedMethodology]} content.</p>
                    <p class="error-details">Error: ${error.message}</p>
                    <button onclick="location.reload()" class="retry-btn">Retry</button>
                </div>
            `;
        }
    }
    
    hideModal() {
        this.modal.style.display = 'none';
        // Remove BDD title when modal is closed
        this.removeBDDTitle();
    }
    
    updateBDDTitle() {
        // Remove existing BDD title if any
        this.removeBDDTitle();
        
        // Create BDD title element
        const bddTitle = document.createElement('div');
        bddTitle.id = 'bddTitle';
        bddTitle.className = 'bdd-title';
        bddTitle.innerHTML = `
            <div class="bdd-title-content">
                <span class="bdd-icon">🟢</span>
                <span class="bdd-text">BDD Mode</span>
                <span class="bdd-subtitle">Given-When-Then</span>
            </div>
        `;
        
        // Add to top right corner of the page
        document.body.appendChild(bddTitle);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.removeBDDTitle();
        }, 5000);
    }
    
    removeBDDTitle() {
        const existingTitle = document.getElementById('bddTitle');
        if (existingTitle) {
            existingTitle.remove();
        }
    }
    
    updateMethodologyTitle() {
        // Remove any existing methodology titles
        this.removeBDDTitle();
        this.removeTDDTitle();
        
        const selectedMethodology = this.methodologySelect.value;
        
        // Show TDD title if TDD is selected
        if (selectedMethodology === 'tdd') {
            this.updateTDDTitle();
        }
    }
    
    updateTDDTitle() {
        // Remove existing TDD title if any
        this.removeTDDTitle();
        
        // Create TDD title element
        const tddTitle = document.createElement('div');
        tddTitle.id = 'tddTitle';
        tddTitle.className = 'tdd-title';
        tddTitle.innerHTML = `
            <div class="tdd-title-content">
                <span class="tdd-icon">🔴</span>
                <span class="tdd-text">TDD</span>
                <span class="tdd-subtitle">Red-Green-Refactor</span>
            </div>
        `;
        
        // Add to top right corner of the page
        document.body.appendChild(tddTitle);
    }
    
    removeTDDTitle() {
        const existingTitle = document.getElementById('tddTitle');
        if (existingTitle) {
            existingTitle.remove();
        }
    }
    
    parseMarkdown(markdown) {
        if (!markdown || typeof markdown !== 'string') {
            return '<p>No content available</p>';
        }
        
        try {
            // Escape HTML first to prevent XSS
            const escapeHtml = (text) => {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            };
            
            // Split into lines for better processing
            const lines = markdown.split('\n');
            const processedLines = [];
            let inCodeBlock = false;
            let codeBlockContent = [];
            let codeBlockLanguage = '';
            
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                
                // Handle code blocks
                if (line.startsWith('```')) {
                    if (!inCodeBlock) {
                        inCodeBlock = true;
                        codeBlockLanguage = line.substring(3).trim();
                        codeBlockContent = [];
                    } else {
                        inCodeBlock = false;
                        const codeContent = codeBlockContent.join('\n');
                        processedLines.push(`<pre><code class="language-${codeBlockLanguage}">${escapeHtml(codeContent)}</code></pre>`);
                        codeBlockContent = [];
                        codeBlockLanguage = '';
                    }
                    continue;
                }
                
                if (inCodeBlock) {
                    codeBlockContent.push(line);
                    continue;
                }
                
                // Process headers
                if (line.startsWith('#### ')) {
                    processedLines.push(`<h4>${escapeHtml(line.substring(5))}</h4>`);
                } else if (line.startsWith('### ')) {
                    processedLines.push(`<h3>${escapeHtml(line.substring(4))}</h3>`);
                } else if (line.startsWith('## ')) {
                    processedLines.push(`<h2>${escapeHtml(line.substring(3))}</h2>`);
                } else if (line.startsWith('# ')) {
                    processedLines.push(`<h1>${escapeHtml(line.substring(2))}</h1>`);
                }
                // Process lists
                else if (line.match(/^\s*[-*+]\s+/)) {
                    const content = line.replace(/^\s*[-*+]\s+/, '');
                    processedLines.push(`<li>${this.processInlineMarkdown(content)}</li>`);
                } else if (line.match(/^\s*\d+\.\s+/)) {
                    const content = line.replace(/^\s*\d+\.\s+/, '');
                    processedLines.push(`<li>${this.processInlineMarkdown(content)}</li>`);
                }
                // Process regular paragraphs
                else if (line.trim()) {
                    processedLines.push(`<p>${this.processInlineMarkdown(line)}</p>`);
                }
                // Empty lines
                else {
                    processedLines.push('<br>');
                }
            }
            
            // Group consecutive list items
            let html = processedLines.join('\n');
            html = html.replace(/(<li>.*?<\/li>\s*)+/gs, (match) => {
                return `<ul>${match}</ul>`;
            });
            
            return html;
            
        } catch (error) {
            console.error('Error parsing markdown:', error);
            return `<p>Error parsing content: ${error.message}</p>`;
        }
    }
    
    processInlineMarkdown(text) {
        if (!text) return '';
        
        try {
            return text
                // Bold
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                // Italic
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                // Inline code
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                // Links (basic support)
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        } catch (error) {
            console.error('Error processing inline markdown:', error);
            return text;
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DiagrammingInterface();
    new MethodologyManager();
});
