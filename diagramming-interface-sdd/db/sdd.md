# Specification-Driven Development (SDD)

<div style="background: linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%); padding: 20px; border-radius: 10px; color: white; margin: 20px 0;">
<h2 style="color: white; margin-top: 0;">🟣 Specification-Driven Development - Formal Specifications</h2>
<p style="color: #f0f0f0;">Development guided by formal specifications and mathematical models</p>
</div>

## Overview

Specification-Driven Development (SDD) emphasizes creating formal, mathematical specifications before implementation. For our diagramming interface, this means defining precise behavioral contracts and invariants that the system must maintain.

- **Formal Specifications**: Mathematical descriptions of system behavior
- **Invariants**: Properties that must always hold true
- **Contracts**: Pre-conditions, post-conditions, and side effects

## SDD Implementation for Diagramming Interface

### 1. Formal Shape Specifications
```javascript
/**
 * Shape Specification
 * 
 * Invariants:
 * - ∀ shape: shape.x ≥ 0 ∧ shape.y ≥ 0
 * - ∀ shape: shape.width > 0 ∧ shape.height > 0
 * - ∀ shape: shape.id is unique within canvas
 * 
 * @specification
 */
class Shape {
    /**
     * @precondition x ≥ 0 ∧ y ≥ 0 ∧ width > 0 ∧ height > 0
     * @postcondition this.x = x ∧ this.y = y ∧ this.width = width ∧ this.height = height
     * @invariant this.area() = this.width * this.height
     */
    constructor(x, y, width, height) {
        assert(x >= 0 && y >= 0, 'Position must be non-negative');
        assert(width > 0 && height > 0, 'Dimensions must be positive');
        
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.id = generateUniqueId();
    }
    
    /**
     * @precondition newX ≥ 0 ∧ newY ≥ 0
     * @postcondition this.x = newX ∧ this.y = newY
     * @modifies this.x, this.y
     */
    moveTo(newX, newY) {
        assert(newX >= 0 && newY >= 0, 'New position must be non-negative');
        
        const oldX = this.x;
        const oldY = this.y;
        
        this.x = newX;
        this.y = newY;
        
        assert(this.x === newX && this.y === newY, 'Position update failed');
    }
    
    /**
     * @precondition point.x ≥ 0 ∧ point.y ≥ 0
     * @postcondition result = (point.x ≥ this.x ∧ point.x ≤ this.x + this.width ∧
     *                         point.y ≥ this.y ∧ point.y ≤ this.y + this.height)
     * @pure
     */
    contains(point) {
        assert(point.x >= 0 && point.y >= 0, 'Point coordinates must be non-negative');
        
        return point.x >= this.x && 
               point.x <= this.x + this.width &&
               point.y >= this.y && 
               point.y <= this.y + this.height;
    }
}
```

### 2. Canvas State Specification
```javascript
/**
 * Canvas Specification
 * 
 * State Space: S = {shapes: Set<Shape>, connections: Set<Connection>, selectedShape: Shape?}
 * 
 * Invariants:
 * - |shapes| ≥ 0 (non-negative number of shapes)
 * - ∀ s1, s2 ∈ shapes: s1.id ≠ s2.id (unique shape IDs)
 * - selectedShape ∈ shapes ∨ selectedShape = null
 * - ∀ connection ∈ connections: connection.from ∈ shapes ∧ connection.to ∈ shapes
 * 
 * @specification
 */
class Canvas {
    /**
     * @postcondition this.shapes = ∅ ∧ this.connections = ∅ ∧ this.selectedShape = null
     */
    constructor() {
        this.shapes = new Set();
        this.connections = new Set();
        this.selectedShape = null;
        
        this.assertInvariants();
    }
    
    /**
     * @precondition shape ∉ this.shapes
     * @postcondition this.shapes = this.shapes@pre ∪ {shape}
     * @modifies this.shapes
     */
    addShape(shape) {
        assert(!this.shapes.has(shape), 'Shape already exists on canvas');
        assert(shape instanceof Shape, 'Must be a valid Shape instance');
        
        const oldSize = this.shapes.size;
        this.shapes.add(shape);
        
        assert(this.shapes.size === oldSize + 1, 'Shape addition failed');
        assert(this.shapes.has(shape), 'Shape not found after addition');
        
        this.assertInvariants();
    }
    
    /**
     * @precondition shape ∈ this.shapes
     * @postcondition this.shapes = this.shapes@pre \ {shape}
     * @postcondition ∀ c ∈ this.connections: c.from ≠ shape ∧ c.to ≠ shape
     * @modifies this.shapes, this.connections, this.selectedShape
     */
    removeShape(shape) {
        assert(this.shapes.has(shape), 'Shape not found on canvas');
        
        const oldSize = this.shapes.size;
        
        // Remove all connections involving this shape
        this.connections = new Set([...this.connections].filter(
            c => c.from !== shape && c.to !== shape
        ));
        
        // Clear selection if removing selected shape
        if (this.selectedShape === shape) {
            this.selectedShape = null;
        }
        
        this.shapes.delete(shape);
        
        assert(this.shapes.size === oldSize - 1, 'Shape removal failed');
        assert(!this.shapes.has(shape), 'Shape still exists after removal');
        
        this.assertInvariants();
    }
    
    /**
     * @precondition from ∈ this.shapes ∧ to ∈ this.shapes ∧ from ≠ to
     * @postcondition ∃ c ∈ this.connections: c.from = from ∧ c.to = to
     * @modifies this.connections
     */
    createConnection(from, to) {
        assert(this.shapes.has(from), 'Source shape not on canvas');
        assert(this.shapes.has(to), 'Target shape not on canvas');
        assert(from !== to, 'Cannot connect shape to itself');
        
        const connection = new Connection(from, to);
        const oldSize = this.connections.size;
        
        this.connections.add(connection);
        
        assert(this.connections.size === oldSize + 1, 'Connection creation failed');
        
        this.assertInvariants();
        return connection;
    }
    
    /**
     * Verify all canvas invariants
     * @pure
     */
    assertInvariants() {
        // Non-negative number of shapes
        assert(this.shapes.size >= 0, 'Invalid shapes count');
        
        // Unique shape IDs
        const ids = new Set([...this.shapes].map(s => s.id));
        assert(ids.size === this.shapes.size, 'Duplicate shape IDs detected');
        
        // Selected shape must be on canvas or null
        if (this.selectedShape !== null) {
            assert(this.shapes.has(this.selectedShape), 'Selected shape not on canvas');
        }
        
        // All connections must reference existing shapes
        for (const connection of this.connections) {
            assert(this.shapes.has(connection.from), 'Connection references non-existent source');
            assert(this.shapes.has(connection.to), 'Connection references non-existent target');
        }
    }
}
```

### 3. Drag Operation Specification
```javascript
/**
 * Drag Operation Specification
 * 
 * State Transitions:
 * IDLE → DRAGGING: startDrag(shape, point)
 * DRAGGING → DRAGGING: updateDrag(point)
 * DRAGGING → IDLE: endDrag()
 * 
 * @specification
 */
class DragController {
    /**
     * @precondition this.state = IDLE ∧ shape ∈ canvas.shapes ∧ shape.contains(startPoint)
     * @postcondition this.state = DRAGGING ∧ this.draggedShape = shape ∧ this.startPoint = startPoint
     * @modifies this.state, this.draggedShape, this.startPoint
     */
    startDrag(shape, startPoint) {
        assert(this.state === 'IDLE', 'Cannot start drag while already dragging');
        assert(shape.contains(startPoint), 'Start point must be inside shape');
        
        this.state = 'DRAGGING';
        this.draggedShape = shape;
        this.startPoint = startPoint;
        this.lastPoint = startPoint;
        
        assert(this.state === 'DRAGGING', 'State transition failed');
    }
    
    /**
     * @precondition this.state = DRAGGING ∧ currentPoint.x ≥ 0 ∧ currentPoint.y ≥ 0
     * @postcondition this.draggedShape.x = this.draggedShape.x@pre + (currentPoint.x - this.lastPoint.x)
     * @postcondition this.draggedShape.y = this.draggedShape.y@pre + (currentPoint.y - this.lastPoint.y)
     * @modifies this.draggedShape.x, this.draggedShape.y, this.lastPoint
     */
    updateDrag(currentPoint) {
        assert(this.state === 'DRAGGING', 'Cannot update drag when not dragging');
        assert(currentPoint.x >= 0 && currentPoint.y >= 0, 'Invalid drag point');
        
        const deltaX = currentPoint.x - this.lastPoint.x;
        const deltaY = currentPoint.y - this.lastPoint.y;
        
        const oldX = this.draggedShape.x;
        const oldY = this.draggedShape.y;
        
        this.draggedShape.moveTo(
            Math.max(0, oldX + deltaX),
            Math.max(0, oldY + deltaY)
        );
        
        this.lastPoint = currentPoint;
        
        // Verify shape moved correctly (within canvas bounds)
        assert(this.draggedShape.x >= 0, 'Shape moved outside left boundary');
        assert(this.draggedShape.y >= 0, 'Shape moved outside top boundary');
    }
    
    /**
     * @precondition this.state = DRAGGING
     * @postcondition this.state = IDLE ∧ this.draggedShape = null
     * @modifies this.state, this.draggedShape, this.startPoint, this.lastPoint
     */
    endDrag() {
        assert(this.state === 'DRAGGING', 'Cannot end drag when not dragging');
        
        this.state = 'IDLE';
        this.draggedShape = null;
        this.startPoint = null;
        this.lastPoint = null;
        
        assert(this.state === 'IDLE', 'State transition failed');
    }
}
```

### 4. Benefits of SDD for Diagramming
- **Correctness**: Mathematical proofs of system properties
- **Reliability**: Formal verification prevents many bugs
- **Documentation**: Specifications serve as precise documentation
- **Maintenance**: Clear contracts make changes safer

### 5. SDD Challenges
- **Complexity**: Requires mathematical modeling skills
- **Time Investment**: Writing specifications takes significant time
- **Tool Support**: Limited tooling for formal verification
- **Over-specification**: Can lead to rigid, hard-to-change systems

<div style="background: #f8f7ff; border-left: 4px solid #a29bfe; padding: 15px; margin: 20px 0;">
<strong>🔬 Best for:</strong> Safety-critical systems, financial applications, mathematical software, systems requiring high reliability
</div>

## SDD Verification Techniques

### Model Checking
- **State Space Exploration**: Verify all possible system states
- **Temporal Logic**: Express properties over time
- **Counterexample Generation**: Find violations automatically

### Theorem Proving
- **Interactive Proofs**: Manual proof construction with tool assistance
- **Automated Reasoning**: Automatic proof search for simple properties
- **Proof Assistants**: Tools like Coq, Lean, or Isabelle/HOL

### Contract-Based Design
- **Design by Contract**: Preconditions, postconditions, invariants
- **Runtime Verification**: Check contracts during execution
- **Static Analysis**: Verify contracts without execution
