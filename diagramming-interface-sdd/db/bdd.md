# Behavior-Driven Development (BDD)

<div style="background: linear-gradient(135deg, #00b894 0%, #00a085 100%); padding: 20px; border-radius: 10px; color: white; margin: 20px 0;">
<h2 style="color: white; margin-top: 0;">🟢 Behavior-Driven Development - Given-When-Then</h2>
<p style="color: #f0f0f0;">Focus on behavior specification using natural language scenarios</p>
</div>

## Overview

Behavior-Driven Development (BDD) extends TDD by focusing on the behavior of the system from the user's perspective. For our diagramming interface, this means defining features through scenarios that stakeholders can understand.

- **Given**: Initial context/state
- **When**: Action or event
- **Then**: Expected outcome

## BDD Implementation for Diagramming Interface

### 1. Feature: Shape Creation
```gherkin
Feature: Shape Creation
  As a user
  I want to create shapes on the canvas
  So that I can build diagrams

  Scenario: Creating a rectangle by clicking
    Given I am on the diagramming interface
    When I click on the rectangle tool
    And I click on the canvas at position (100, 150)
    Then a rectangle should appear at position (100, 150)
    And the rectangle should be selected
    And the properties panel should show rectangle properties

  Scenario: Creating shapes by drag and drop
    Given I am on the diagramming interface
    When I drag the circle tool from the toolbox
    And I drop it on the canvas at position (200, 100)
    Then a circle should appear at position (200, 100)
    And the circle should have default properties
```

### 2. Feature: Shape Manipulation
```gherkin
Feature: Shape Manipulation
  As a user
  I want to modify shapes after creation
  So that I can customize my diagrams

  Scenario: Moving a shape
    Given I have a rectangle on the canvas at position (50, 50)
    When I click and drag the rectangle to position (150, 100)
    Then the rectangle should move to position (150, 100)
    And the position should update in the properties panel

  Scenario: Resizing a shape
    Given I have a selected circle with radius 25
    When I drag the resize handle to increase the radius to 40
    Then the circle radius should be 40
    And the size should update in the properties panel
```

### 3. BDD Implementation Code
```javascript
// BDD approach: Implement step definitions
const { Given, When, Then } = require('@cucumber/cucumber');

Given('I am on the diagramming interface', function () {
    this.app = new DiagrammingInterface();
    this.app.initialize();
});

When('I click on the rectangle tool', function () {
    this.app.selectTool('rectangle');
});

When('I click on the canvas at position \\({int}, {int}\\)', function (x, y) {
    this.app.clickCanvas(x, y);
});

Then('a rectangle should appear at position \\({int}, {int}\\)', function (x, y) {
    const shapes = this.app.getShapes();
    const rectangle = shapes.find(s => s.type === 'rectangle');
    expect(rectangle).toBeDefined();
    expect(rectangle.x).toBe(x);
    expect(rectangle.y).toBe(y);
});
```

### 4. Benefits of BDD for Diagramming
- **Clear Requirements**: Features written in natural language
- **Stakeholder Communication**: Non-technical people can understand
- **Living Documentation**: Scenarios serve as documentation
- **User-Focused**: Emphasizes user value and behavior

### 5. BDD Challenges
- **Overhead**: Writing scenarios takes time
- **Maintenance**: Scenarios need updates with requirement changes
- **Tool Complexity**: Requires BDD frameworks and tools

## BDD Workflow for Diagramming Features

1. **Define Feature** → Write user story and scenarios
2. **Write Scenarios** → Given-When-Then format
3. **Implement Steps** → Code step definitions
4. **Run Scenarios** → Execute automated tests
5. **Implement Feature** → Build actual functionality
6. **Validate** → Ensure scenarios pass

### Example: Connection Feature
```gherkin
Feature: Shape Connections
  As a user
  I want to connect shapes with arrows
  So that I can show relationships in my diagrams

  Scenario: Creating a connection between shapes
    Given I have a rectangle at position (50, 50)
    And I have a circle at position (200, 100)
    When I click on the rectangle's connection point
    And I drag to the circle's connection point
    Then an arrow should connect the rectangle to the circle
    And the connection should be visible on the canvas

  Scenario: Deleting a connection
    Given I have two shapes connected by an arrow
    When I select the connection arrow
    And I press the delete key
    Then the connection should be removed
    And the shapes should remain unconnected
```

<div style="background: #f0fff4; border-left: 4px solid #00b894; padding: 15px; margin: 20px 0;">
<strong>🌱 Best for:</strong> Complex business requirements, stakeholder collaboration, user-centric development, acceptance testing
</div>

## BDD Testing Layers

- **Acceptance Tests**: Full user scenarios
- **Integration Tests**: Component interactions
- **Unit Tests**: Individual behavior verification

### Scenario Mapping for Diagramming
- **User Goals**: Create professional diagrams
- **User Activities**: Add shapes, connect elements, customize appearance
- **User Tasks**: Click tools, drag shapes, edit properties
