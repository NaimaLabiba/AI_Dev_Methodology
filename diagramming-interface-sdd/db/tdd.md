# Test-Driven Development (TDD)

<div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 20px; border-radius: 10px; color: white; margin: 20px 0;">
<h2 style="color: white; margin-top: 0;">🔴 Test-Driven Development - Red-Green-Refactor</h2>
<p style="color: #f0f0f0;">Write tests first, then implement code to make tests pass</p>
</div>

## Overview

Test-Driven Development (TDD) follows the Red-Green-Refactor cycle. For our diagramming interface, this means writing tests before implementing any functionality.

- **Red**: Write a failing test
- **Green**: Write minimal code to make the test pass
- **Refactor**: Improve code while keeping tests green

## TDD Implementation for Diagramming Interface

### 1. Shape Creation Tests First
```javascript
// TDD approach: Write tests before implementation
describe('Shape Creation', () => {
    test('should create rectangle with correct dimensions', () => {
        const shape = createRectangle(10, 20, 100, 50);
        expect(shape.x).toBe(10);
        expect(shape.y).toBe(20);
        expect(shape.width).toBe(100);
        expect(shape.height).toBe(50);
        expect(shape.type).toBe('rectangle');
    });
    
    test('should detect click inside rectangle', () => {
        const shape = createRectangle(10, 20, 100, 50);
        expect(isPointInside(shape, 50, 40)).toBe(true);
        expect(isPointInside(shape, 5, 5)).toBe(false);
    });
});
```

### 2. TDD Cycle for Drag & Drop
```javascript
// Step 1: RED - Write failing test
test('should move shape when dragged', () => {
    const shape = createRectangle(10, 20, 100, 50);
    dragShape(shape, 30, 40);
    expect(shape.x).toBe(40); // 10 + 30
    expect(shape.y).toBe(60); // 20 + 40
});

// Step 2: GREEN - Minimal implementation
function dragShape(shape, deltaX, deltaY) {
    shape.x += deltaX;
    shape.y += deltaY;
}

// Step 3: REFACTOR - Improve with validation
function dragShape(shape, deltaX, deltaY) {
    if (!shape || typeof deltaX !== 'number' || typeof deltaY !== 'number') {
        throw new Error('Invalid drag parameters');
    }
    shape.x = Math.max(0, shape.x + deltaX);
    shape.y = Math.max(0, shape.y + deltaY);
}
```

### 3. Benefits of TDD for Diagramming
- **Reliable Code**: Every feature is tested
- **Better Design**: Tests force good API design
- **Regression Prevention**: Changes don't break existing features
- **Documentation**: Tests serve as living documentation

### 4. TDD Challenges
- **Initial Slowdown**: Writing tests takes time upfront
- **Learning Curve**: Requires discipline and practice
- **Test Maintenance**: Tests need updates when requirements change

## TDD Workflow for Diagramming Features

1. **Write Test** → Define expected behavior
2. **Run Test** → Confirm it fails (RED)
3. **Write Code** → Minimal implementation (GREEN)
4. **Run Tests** → Ensure all tests pass
5. **Refactor** → Improve code quality
6. **Repeat** → Next feature

### Example: Connection System TDD
```javascript
// Test for connection creation
test('should create connection between two shapes', () => {
    const shape1 = createRectangle(10, 10, 50, 50);
    const shape2 = createCircle(100, 100, 25);
    const connection = createConnection(shape1, shape2);
    
    expect(connection.from).toBe(shape1);
    expect(connection.to).toBe(shape2);
    expect(connection.type).toBe('arrow');
});
```

<div style="background: #fff5f5; border-left: 4px solid #ff6b6b; padding: 15px; margin: 20px 0;">
<strong>🎯 Best for:</strong> Complex applications, team development, long-term maintenance, critical systems
</div>

## TDD Testing Pyramid for Diagramming

- **Unit Tests**: Individual shape operations, calculations
- **Integration Tests**: Shape interactions, canvas rendering
- **E2E Tests**: Complete user workflows, drag-and-drop scenarios
