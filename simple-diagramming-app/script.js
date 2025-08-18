class SimpleDiagrammingApp {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvasOverlay = document.getElementById('canvasOverlay');
        
        // State management
        this.shapes = [];
        this.connections = [];
        this.selectedShape = null;
        this.draggedShape = null;
        this.isDragging = false;
        this.isConnecting = false;
        this.connectionStart = null;
        this.tempConnection = null;
        
        // Mouse state
        this.mouseX = 0;
        this.mouseY = 0;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Shape counter for unique IDs
        this.shapeCounter = 0;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.render();
        this.updateStatus('Ready - Click "Add Rectangle" or "Add Circle" to start');
    }
    
    setupCanvas() {
        // Set canvas size to match container
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }
    
    setupEventListeners() {
        // Toolbar buttons
        document.getElementById('addRectangleBtn').addEventListener('click', () => this.addRectangle());
        document.getElementById('addCircleBtn').addEventListener('click', () => this.addCircle());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveDiagram());
        document.getElementById('loadBtn').addEventListener('click', () => this.loadDiagram());
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileLoad(e));
        document.getElementById('exportMarkdownBtn').addEventListener('click', () => this.exportMarkdown());
        document.getElementById('exportPngBtn').addEventListener('click', () => this.exportPNG());
        document.getElementById('exportSvgBtn').addEventListener('click', () => this.exportSVG());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearDiagram());
        
        // Properties panel
        document.getElementById('shapeLabel').addEventListener('input', (e) => this.updateShapeLabel(e.target.value));
        document.getElementById('shapeColor').addEventListener('change', (e) => this.updateShapeColor(e.target.value));
        document.getElementById('deleteShapeBtn').addEventListener('click', () => this.deleteSelectedShape());
        document.getElementById('closePropertiesBtn').addEventListener('click', () => this.closePropertiesPanel());
        
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
    
    addRectangle() {
        const shape = {
            id: ++this.shapeCounter,
            type: 'rectangle',
            x: Math.random() * (this.canvas.width - 120) + 60,
            y: Math.random() * (this.canvas.height - 80) + 40,
            width: 120,
            height: 60,
            label: 'Rectangle',
            color: '#e3f2fd',
            borderColor: '#2196f3'
        };
        
        this.shapes.push(shape);
        this.selectShape(shape);
        this.render();
        this.updateStatus(`Added rectangle "${shape.label}"`);
    }
    
    addCircle() {
        const shape = {
            id: ++this.shapeCounter,
            type: 'circle',
            x: Math.random() * (this.canvas.width - 100) + 50,
            y: Math.random() * (this.canvas.height - 100) + 50,
            width: 80,
            height: 80,
            label: 'Circle',
            color: '#fff3e0',
            borderColor: '#ff9800'
        };
        
        this.shapes.push(shape);
        this.selectShape(shape);
        this.render();
        this.updateStatus(`Added circle "${shape.label}"`);
    }
    
    selectShape(shape) {
        this.selectedShape = shape;
        this.showPropertiesPanel();
        this.render();
    }
    
    showPropertiesPanel() {
        if (this.selectedShape) {
            const panel = document.getElementById('propertiesPanel');
            const labelInput = document.getElementById('shapeLabel');
            const colorInput = document.getElementById('shapeColor');
            
            labelInput.value = this.selectedShape.label;
            colorInput.value = this.selectedShape.color;
            
            panel.style.display = 'block';
        }
    }
    
    closePropertiesPanel() {
        document.getElementById('propertiesPanel').style.display = 'none';
        this.selectedShape = null;
        this.render();
    }
    
    updateShapeLabel(label) {
        if (this.selectedShape) {
            this.selectedShape.label = label;
            this.render();
            this.updateStatus(`Updated label to "${label}"`);
        }
    }
    
    updateShapeColor(color) {
        if (this.selectedShape) {
            this.selectedShape.color = color;
            this.render();
            this.updateStatus('Updated shape color');
        }
    }
    
    deleteSelectedShape() {
        if (this.selectedShape) {
            const shapeId = this.selectedShape.id;
            
            // Remove the shape
            this.shapes = this.shapes.filter(shape => shape.id !== shapeId);
            
            // Remove any connections to this shape
            this.connections = this.connections.filter(conn => 
                conn.startId !== shapeId && conn.endId !== shapeId
            );
            
            this.closePropertiesPanel();
            this.render();
            this.updateStatus('Deleted shape and its connections');
        }
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        this.lastMouseX = this.mouseX;
        this.lastMouseY = this.mouseY;
        
        // Check if clicking on a shape
        const clickedShape = this.getShapeAt(this.mouseX, this.mouseY);
        
        if (clickedShape) {
            if (e.shiftKey && this.selectedShape && this.selectedShape !== clickedShape) {
                // Shift+click to create connection
                this.createConnection(this.selectedShape, clickedShape);
            } else {
                // Regular click to select and potentially drag
                this.selectShape(clickedShape);
                this.isDragging = true;
                this.draggedShape = clickedShape;
                this.canvas.style.cursor = 'grabbing';
            }
        } else {
            // Click on empty space
            this.closePropertiesPanel();
        }
        
        e.preventDefault();
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        
        // Update cursor based on what's under the mouse
        const shapeUnderMouse = this.getShapeAt(this.mouseX, this.mouseY);
        if (shapeUnderMouse && !this.isDragging) {
            this.canvas.style.cursor = 'grab';
        } else if (!this.isDragging) {
            this.canvas.style.cursor = 'default';
        }
        
        // Handle dragging
        if (this.isDragging && this.draggedShape) {
            const deltaX = this.mouseX - this.lastMouseX;
            const deltaY = this.mouseY - this.lastMouseY;
            
            this.draggedShape.x += deltaX;
            this.draggedShape.y += deltaY;
            
            // Update connections that involve this shape
            this.updateConnectionsForShape(this.draggedShape);
            
            this.render();
        }
        
        this.lastMouseX = this.mouseX;
        this.lastMouseY = this.mouseY;
    }
    
    handleMouseUp(e) {
        if (this.isDragging && this.draggedShape) {
            this.updateStatus(`Moved "${this.draggedShape.label}"`);
        }
        
        this.isDragging = false;
        this.draggedShape = null;
        this.canvas.style.cursor = 'default';
        
        // Update cursor for shape under mouse
        const shapeUnderMouse = this.getShapeAt(this.mouseX, this.mouseY);
        if (shapeUnderMouse) {
            this.canvas.style.cursor = 'grab';
        }
    }
    
    handleClick(e) {
        // Click handling is done in mousedown for better responsiveness
    }
    
    handleDoubleClick(e) {
        const clickedShape = this.getShapeAt(this.mouseX, this.mouseY);
        if (clickedShape) {
            // Focus on label input for editing
            document.getElementById('shapeLabel').focus();
            document.getElementById('shapeLabel').select();
        }
    }
    
    handleResize() {
        this.setupCanvas();
        this.render();
    }
    
    handleKeyDown(e) {
        if (e.key === 'Delete' && this.selectedShape) {
            this.deleteSelectedShape();
        } else if (e.key === 'Escape') {
            this.closePropertiesPanel();
        }
    }
    
    getShapeAt(x, y) {
        // Check shapes in reverse order (top to bottom)
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            const shape = this.shapes[i];
            if (this.isPointInShape(x, y, shape)) {
                return shape;
            }
        }
        return null;
    }
    
    isPointInShape(x, y, shape) {
        if (shape.type === 'circle') {
            const centerX = shape.x + shape.width / 2;
            const centerY = shape.y + shape.height / 2;
            const radius = Math.min(shape.width, shape.height) / 2;
            const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            return distance <= radius;
        } else {
            // Rectangle
            return x >= shape.x && x <= shape.x + shape.width &&
                   y >= shape.y && y <= shape.y + shape.height;
        }
    }
    
    createConnection(startShape, endShape) {
        // Check if connection already exists
        const existingConnection = this.connections.find(conn => 
            (conn.startId === startShape.id && conn.endId === endShape.id) ||
            (conn.startId === endShape.id && conn.endId === startShape.id)
        );
        
        if (existingConnection) {
            this.updateStatus('Connection already exists between these shapes');
            return;
        }
        
        const connection = {
            id: Date.now(),
            startId: startShape.id,
            endId: endShape.id,
            startX: startShape.x + startShape.width / 2,
            startY: startShape.y + startShape.height / 2,
            endX: endShape.x + endShape.width / 2,
            endY: endShape.y + endShape.height / 2
        };
        
        this.connections.push(connection);
        this.render();
        this.updateStatus(`Connected "${startShape.label}" to "${endShape.label}"`);
    }
    
    updateConnectionsForShape(shape) {
        this.connections.forEach(conn => {
            if (conn.startId === shape.id) {
                conn.startX = shape.x + shape.width / 2;
                conn.startY = shape.y + shape.height / 2;
            }
            if (conn.endId === shape.id) {
                conn.endX = shape.x + shape.width / 2;
                conn.endY = shape.y + shape.height / 2;
            }
        });
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw connections first (behind shapes)
        this.connections.forEach(connection => {
            this.drawConnection(connection);
        });
        
        // Draw shapes
        this.shapes.forEach(shape => {
            this.drawShape(shape);
        });
        
        // Draw selection outline
        if (this.selectedShape) {
            this.drawSelection(this.selectedShape);
        }
    }
    
    drawShape(shape) {
        this.ctx.save();
        
        // Set styles
        this.ctx.fillStyle = shape.color;
        this.ctx.strokeStyle = shape.borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        if (shape.type === 'circle') {
            // Draw circle
            const centerX = shape.x + shape.width / 2;
            const centerY = shape.y + shape.height / 2;
            const radius = Math.min(shape.width, shape.height) / 2;
            
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Draw label
            this.ctx.fillStyle = '#333';
            this.ctx.fillText(shape.label, centerX, centerY);
        } else {
            // Draw rectangle
            this.ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
            this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            
            // Draw label
            this.ctx.fillStyle = '#333';
            this.ctx.fillText(shape.label, 
                shape.x + shape.width / 2, 
                shape.y + shape.height / 2);
        }
        
        this.ctx.restore();
    }
    
    drawConnection(connection) {
        this.ctx.save();
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 2;
        
        // Draw line
        this.ctx.beginPath();
        this.ctx.moveTo(connection.startX, connection.startY);
        this.ctx.lineTo(connection.endX, connection.endY);
        this.ctx.stroke();
        
        // Draw arrow head
        const angle = Math.atan2(connection.endY - connection.startY, connection.endX - connection.startX);
        const headLength = 15;
        
        this.ctx.beginPath();
        this.ctx.moveTo(connection.endX, connection.endY);
        this.ctx.lineTo(
            connection.endX - headLength * Math.cos(angle - Math.PI / 6),
            connection.endY - headLength * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(connection.endX, connection.endY);
        this.ctx.lineTo(
            connection.endX - headLength * Math.cos(angle + Math.PI / 6),
            connection.endY - headLength * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawSelection(shape) {
        this.ctx.save();
        this.ctx.strokeStyle = '#4a90e2';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        
        if (shape.type === 'circle') {
            const centerX = shape.x + shape.width / 2;
            const centerY = shape.y + shape.height / 2;
            const radius = Math.min(shape.width, shape.height) / 2;
            
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius + 3, 0, 2 * Math.PI);
            this.ctx.stroke();
        } else {
            this.ctx.strokeRect(shape.x - 3, shape.y - 3, shape.width + 6, shape.height + 6);
        }
        
        this.ctx.setLineDash([]);
        this.ctx.restore();
    }
    
    // File operations
    saveDiagram() {
        const data = {
            shapes: this.shapes,
            connections: this.connections,
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diagram.json';
        a.click();
        URL.revokeObjectURL(url);
        
        this.updateStatus('Diagram saved as JSON');
    }
    
    loadDiagram() {
        document.getElementById('fileInput').click();
    }
    
    handleFileLoad(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                this.shapes = data.shapes || [];
                this.connections = data.connections || [];
                this.selectedShape = null;
                this.closePropertiesPanel();
                this.render();
                this.updateStatus(`Loaded diagram with ${this.shapes.length} shapes and ${this.connections.length} connections`);
            } catch (error) {
                this.updateStatus('Error loading diagram: Invalid JSON file');
            }
        };
        reader.readAsText(file);
    }
    
    exportMarkdown() {
        let markdown = '# Diagram Export\n\n';
        
        markdown += '## Shapes\n';
        this.shapes.forEach(shape => {
            markdown += `- ${shape.type}: "${shape.label}" at (${Math.round(shape.x)}, ${Math.round(shape.y)})\n`;
        });
        
        markdown += '\n## Connections\n';
        this.connections.forEach(conn => {
            const startShape = this.shapes.find(s => s.id === conn.startId);
            const endShape = this.shapes.find(s => s.id === conn.endId);
            if (startShape && endShape) {
                markdown += `- "${startShape.label}" → "${endShape.label}"\n`;
            }
        });
        
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diagram.md';
        a.click();
        URL.revokeObjectURL(url);
        
        this.updateStatus('Diagram exported as Markdown');
    }
    
    exportPNG() {
        const link = document.createElement('a');
        link.download = 'diagram.png';
        link.href = this.canvas.toDataURL();
        link.click();
        
        this.updateStatus('Diagram exported as PNG');
    }
    
    exportSVG() {
        // Create SVG content
        let svg = `<svg width="${this.canvas.width}" height="${this.canvas.height}" xmlns="http://www.w3.org/2000/svg">`;
        
        // Add connections
        this.connections.forEach(conn => {
            svg += `<line x1="${conn.startX}" y1="${conn.startY}" x2="${conn.endX}" y2="${conn.endY}" stroke="#666" stroke-width="2"/>`;
            
            // Add arrow head
            const angle = Math.atan2(conn.endY - conn.startY, conn.endX - conn.startX);
            const headLength = 15;
            const x1 = conn.endX - headLength * Math.cos(angle - Math.PI / 6);
            const y1 = conn.endY - headLength * Math.sin(angle - Math.PI / 6);
            const x2 = conn.endX - headLength * Math.cos(angle + Math.PI / 6);
            const y2 = conn.endY - headLength * Math.sin(angle + Math.PI / 6);
            
            svg += `<line x1="${conn.endX}" y1="${conn.endY}" x2="${x1}" y2="${y1}" stroke="#666" stroke-width="2"/>`;
            svg += `<line x1="${conn.endX}" y1="${conn.endY}" x2="${x2}" y2="${y2}" stroke="#666" stroke-width="2"/>`;
        });
        
        // Add shapes
        this.shapes.forEach(shape => {
            if (shape.type === 'circle') {
                const centerX = shape.x + shape.width / 2;
                const centerY = shape.y + shape.height / 2;
                const radius = Math.min(shape.width, shape.height) / 2;
                
                svg += `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="${shape.color}" stroke="${shape.borderColor}" stroke-width="2"/>`;
                svg += `<text x="${centerX}" y="${centerY}" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="14" fill="#333">${shape.label}</text>`;
            } else {
                svg += `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="${shape.color}" stroke="${shape.borderColor}" stroke-width="2"/>`;
                svg += `<text x="${shape.x + shape.width/2}" y="${shape.y + shape.height/2}" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="14" fill="#333">${shape.label}</text>`;
            }
        });
        
        svg += '</svg>';
        
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diagram.svg';
        a.click();
        URL.revokeObjectURL(url);
        
        this.updateStatus('Diagram exported as SVG');
    }
    
    clearDiagram() {
        if (this.shapes.length > 0 || this.connections.length > 0) {
            if (confirm('Are you sure you want to clear the diagram? This action cannot be undone.')) {
                this.shapes = [];
                this.connections = [];
                this.selectedShape = null;
                this.closePropertiesPanel();
                this.render();
                this.updateStatus('Diagram cleared');
            }
        } else {
            this.updateStatus('Diagram is already empty');
        }
    }
    
    updateStatus(message) {
        document.getElementById('statusText').textContent = message;
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SimpleDiagrammingApp();
});
