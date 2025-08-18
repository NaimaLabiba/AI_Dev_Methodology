# Domain-Driven Design (DDD)

<div style="background: linear-gradient(135deg, #fd79a8 0%, #e84393 100%); padding: 20px; border-radius: 10px; color: white; margin: 20px 0;">
<h2 style="color: white; margin-top: 0;">🟠 Domain-Driven Design - Model-Driven Architecture</h2>
<p style="color: #f0f0f0;">Focus on the core domain and domain logic through rich domain models</p>
</div>

## Overview

Domain-Driven Design (DDD) emphasizes modeling the business domain and creating a shared understanding between technical and domain experts. For our diagramming interface, this means identifying the core domain concepts and building the software around them.

- **Ubiquitous Language**: Shared vocabulary between developers and domain experts
- **Bounded Contexts**: Clear boundaries between different parts of the system
- **Domain Models**: Rich objects that encapsulate business logic

## DDD Implementation for Diagramming Interface

### 1. Domain Model Identification
```javascript
// DDD approach: Rich domain models with behavior
class DiagramElement {
    constructor(id, position, dimensions) {
        this.id = id;
        this.position = position;
        this.dimensions = dimensions;
        this.connections = [];
    }
    
    // Domain behavior: Business rules embedded in the model
    canConnectTo(otherElement) {
        if (this.id === otherElement.id) return false;
        if (this.isAlreadyConnectedTo(otherElement)) return false;
        return this.isWithinConnectionRange(otherElement);
    }
    
    moveTo(newPosition) {
        // Domain rule: Elements cannot be placed outside canvas bounds
        if (!this.isValidPosition(newPosition)) {
            throw new DomainError('Invalid position for diagram element');
        }
        this.position = newPosition;
        this.notifyConnectedElements();
    }
}

class Shape extends DiagramElement {
    constructor(id, position, dimensions, shapeType) {
        super(id, position, dimensions);
        this.shapeType = shapeType;
        this.style = new ShapeStyle();
    }
    
    // Domain-specific behavior
    calculateArea() {
        return this.shapeType.calculateArea(this.dimensions);
    }
    
    isPointInside(point) {
        return this.shapeType.containsPoint(point, this.position, this.dimensions);
    }
}
```

### 2. Bounded Contexts
```javascript
// Canvas Context - Handles spatial relationships
class CanvasContext {
    constructor() {
        this.elements = new Map();
        this.spatialIndex = new SpatialIndex();
    }
    
    addElement(element) {
        this.elements.set(element.id, element);
        this.spatialIndex.insert(element);
    }
    
    findElementsAt(position) {
        return this.spatialIndex.query(position);
    }
}

// Styling Context - Handles visual appearance
class StylingContext {
    constructor() {
        this.themes = new Map();
        this.currentTheme = 'default';
    }
    
    applyStyle(element, styleProperties) {
        const theme = this.themes.get(this.currentTheme);
        return theme.createStyle(element, styleProperties);
    }
}

// Connection Context - Handles relationships
class ConnectionContext {
    constructor() {
        this.connections = new Map();
        this.connectionRules = new ConnectionRuleEngine();
    }
    
    createConnection(fromElement, toElement) {
        if (!this.connectionRules.canConnect(fromElement, toElement)) {
            throw new DomainError('Connection not allowed by domain rules');
        }
        
        const connection = new Connection(fromElement, toElement);
        this.connections.set(connection.id, connection);
        return connection;
    }
}
```

### 3. Domain Services
```javascript
// Domain Service: Complex operations that don't belong to a single entity
class DiagramLayoutService {
    constructor(canvasContext) {
        this.canvasContext = canvasContext;
    }
    
    autoLayout(elements, layoutType) {
        switch (layoutType) {
            case 'hierarchical':
                return this.applyHierarchicalLayout(elements);
            case 'circular':
                return this.applyCircularLayout(elements);
            default:
                throw new DomainError(`Unknown layout type: ${layoutType}`);
        }
    }
    
    detectOverlaps(elements) {
        // Complex domain logic for overlap detection
        return this.canvasContext.spatialIndex.findOverlaps(elements);
    }
}

class DiagramValidationService {
    validateDiagram(diagram) {
        const violations = [];
        
        // Domain rules validation
        if (diagram.elements.length === 0) {
            violations.push('Diagram must contain at least one element');
        }
        
        // Check for orphaned elements
        const orphans = this.findOrphanedElements(diagram);
        if (orphans.length > 0) {
            violations.push(`Found ${orphans.length} disconnected elements`);
        }
        
        return violations;
    }
}
```

### 4. Aggregates and Repositories
```javascript
// Aggregate Root: Diagram
class Diagram {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.elements = [];
        this.connections = [];
        this.metadata = new DiagramMetadata();
    }
    
    // Aggregate ensures consistency
    addElement(elementData) {
        const element = this.createElement(elementData);
        this.elements.push(element);
        this.metadata.recordChange('element_added', element.id);
        return element;
    }
    
    removeElement(elementId) {
        // Domain rule: Remove all connections when element is removed
        this.removeConnectionsForElement(elementId);
        this.elements = this.elements.filter(e => e.id !== elementId);
        this.metadata.recordChange('element_removed', elementId);
    }
}

// Repository: Persistence abstraction
class DiagramRepository {
    async save(diagram) {
        // Validate aggregate before saving
        const violations = this.validator.validate(diagram);
        if (violations.length > 0) {
            throw new DomainError('Cannot save invalid diagram', violations);
        }
        
        return await this.storage.persist(diagram);
    }
    
    async findById(diagramId) {
        const data = await this.storage.retrieve(diagramId);
        return this.reconstitute(data);
    }
}
```

### 5. Benefits of DDD for Diagramming
- **Rich Domain Model**: Business logic is clearly expressed
- **Maintainable**: Changes to business rules are localized
- **Testable**: Domain logic can be tested in isolation
- **Scalable**: Clear boundaries enable independent development

### 6. DDD Challenges
- **Complexity**: Requires deep domain understanding
- **Over-engineering**: Can be overkill for simple domains
- **Learning Curve**: Requires understanding of DDD patterns

<div style="background: #fdf2f8; border-left: 4px solid #fd79a8; padding: 15px; margin: 20px 0;">
<strong>🎯 Best for:</strong> Complex business domains, long-term projects, enterprise applications, collaborative development
</div>

## DDD Strategic Patterns for Diagramming

- **Core Domain**: Shape manipulation and canvas operations
- **Supporting Subdomain**: File import/export, styling
- **Generic Subdomain**: User authentication, logging

### Context Map
- **Canvas Context** ↔ **Styling Context**: Shared kernel for visual properties
- **Canvas Context** → **Connection Context**: Downstream for relationship data
- **All Contexts** → **Persistence Context**: Downstream for data storage
