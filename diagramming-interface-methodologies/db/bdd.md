# BDD Specification — Diagramming Interface for a Web Application

## Feature: Manage Shapes

Scenario: Add a rectangle  
  Given I am on an empty canvas  
  When I add a rectangle from the toolbar  
  Then I should see a rectangle on the canvas

Scenario: Move a shape  
  Given a rectangle exists on the canvas  
  When I drag the rectangle to a new position  
  Then its position should update  
  And any connected lines should remain attached

Scenario: Edit a shape label  
  Given a rectangle exists on the canvas  
  When I edit the label to "Send Email"  
  Then the rectangle should display "Send Email"

Scenario: Delete a shape with edges  
  Given shapes A and B exist with a connection from A to B  
  When I delete shape A and confirm  
  Then shape A is removed  
  And the connection from A to B is also removed

---

## Feature: Connect Shapes

Scenario: Connect two shapes  
  Given shapes A and B exist  
  When I draw a connection from A to B  
  Then an arrow from A to B should appear  
  And the arrow should snap to shape anchors

Scenario: Keep connections on move  
  Given a connection from A to B exists  
  When I move A  
  Then the connection should remain attached and update its endpoints

---

## Feature: File Operations

Scenario: Save a diagram locally  
  Given my canvas contains two shapes and one connection  
  When I click "Save"  
  Then a JSON diagram should be stored locally  
  And it should conform to the diagram JSON schema

Scenario: Open a saved diagram  
  Given I have a valid diagram JSON file  
  When I open the file  
  Then the canvas should render shapes and connections from the file

Scenario: Export as Markdown  
  Given my canvas has shapes and connections  
  When I export as Markdown  
  Then the Markdown should list shapes and edges  
  And importing that Markdown should recreate the same canvas

Scenario: Export as PNG/SVG  
  Given my canvas has shapes and connections  
  When I export as PNG or SVG  
  Then a valid image file should be produced

Scenario: Delete a diagram with confirmation  
  Given I have a saved diagram  
  When I choose to delete it and confirm  
  Then the diagram should be removed  
  And my canvas should be empty

---

## Feature: UI/UX & Responsiveness

Scenario: Desktop layout  
  Given I open the app on a desktop viewport  
  When the app loads  
  Then the toolbar and canvas should be visible without horizontal scrolling

Scenario: Tablet layout  
  Given I open the app on a tablet viewport  
  When the app loads  
  Then the controls should be usable via touch  
  And the layout should adapt without breaking

---

## Feature: Guardrails (Non-Goals)

Scenario: No real-time collaboration  
  Given the app is single-user and local-only  
  When I use the app  
  Then there should be no multi-user or collaboration features

Scenario: No backend dependency  
  Given I run the app locally  
  When I add shapes, connect, save, open, and export  
  Then I should not need a backend server for these actions
