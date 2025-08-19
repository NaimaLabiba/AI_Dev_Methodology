# BDD Specification — Diagramming Interface for a web application
 
# I want to create a simple minimalistic web application that is used to diagram.
# Define the canvas the static features

## Static Features (Defaults)

> **Methodology Header Requirement:** The app must display the current methodology title (e.g., **“BDD”**) **fixed at the top-right** of the canvas viewport at all times.

- **Canvas**: Infinite, white bg, grid 10px (snap ON), zoom 25–400%, pan (Space/trackpad)
- **Toolbar**: Select, Pan, Shapes (Rect, Ellipse, Diamond, Triangle, Text), Connectors (Line, Arrow, Orthogonal), Undo/Redo, Delete, Duplicate
- **Defaults**: Fill #FFF, Stroke #111827 (2px), Font 14px system-ui, Arrow 8px
- **Shapes**: Rect 120×72 (r8), Ellipse 120×80, Diamond 120×120, Triangle 120×100, Text "Label"
- **Connectors**: 8 anchors, snap 8px, solid/dash/dot, arrow/dot/none
- **Selection**: Resize, rotate, Shift=aspect, Alt=duplicate, multi-select
- **Properties**: Shape (text, fill, stroke, opacity, radius), Connector (style, markers, label), Canvas (grid/bg)
- **Layers**: Bring/send, group/ungroup, lock/unlock
- **Align/Distribute**: L/C/R, T/M/B, h/v spacing
- **Status Bar**: Zoom %, grid toggle
- **Shortcuts**: Ctrl+Z/Y, Delete, Ctrl+C/V/D, Arrows=1px, Shift+Arrows=10px, Ctrl±/0 zoom

## Import Button Definition

- **Who clicks**: The user (single-user, local app).  
- **Where**: Top bar → "Import" button (also Ctrl+I shortcut, or drag-drop onto canvas).  
- **What happens**: Opens file picker → user selects `.md` file (BDD/DDD/TDD/SDD).  
- **Source of file**: Local device storage (no external DB, no backend).  
- **Load process**: App reads `.md` text → parses Methodology + Diagram Type + sections.  
- **Render**: Parsed content is converted into shapes/connectors → drawn onto the infinite canvas.  
- **UI result**: The file appears in the Document Switcher with methodology badge + type icon; diagram visible on canvas.  



## Feature: UI Header

Scenario: Display BDD title on top right corner
  Given I am viewing the application interface
  When the application is in BDD specification
  Then the title "BDD" should be displayed on the top right corner of the screen
  And the title should be clearly visible and styled consistently with the app theme

# Feature: Reload Updated .md File

Scenario: Reload after external edit
  Given I have modified the `.md` file outside the app
  When I re-import the updated file
  Then the canvas renders the new diagram content

Scenario: Reload after in-app edit
  Given I changed a label inside the app and exported
  When I re-import the exported `.md`
  Then the canvas shows the updated label consistently

Scenario: Reload invalid update
  Given the `.md` file is missing the Diagram Input section
  When I re-import the file
  Then the app shows a warning and the canvas remains unchanged
  # Feature: Modify File (App or Direct Edit)

Scenario: Modify via app interface
  Given I have imported a valid `.md` file
  When I change a shape label in the app
  Then the app updates the diagram on canvas
  And the underlying `.md` file content updates accordingly

Scenario: Modify Mermaid context directly
  Given I open the `.md` file in a text editor
  When I update the Mermaid section
  Then re-importing the file reflects the changes on the canvas

Scenario: Modify Translation directly
  Given I open the `.md` file in a text editor
  When I update the Translation section
  Then re-importing the file displays the new text in the properties panel


  ## Feature: Export Reusable .md File

Scenario: Export includes Mermaid + Translation
  Given my canvas has shapes and connections
  When I click "Export (.md)"
  Then the app generates a `.md` file
  And the file contains a **Mermaid** section (simple context)
  And the file contains a **Translation** section (human-readable)

Scenario: Exported file is re-importable
  Given I exported a `.md` file from the app
  When I import that same file
  Then the app parses it successfully
  And the canvas renders the same diagram

Scenario: Metadata preserved
  Given the current diagram has Methodology and Diagram Type
  When I export as `.md`
  Then the file front-matter includes **Methodology**, **Diagram Type**, and **Title**

Scenario: Empty canvas export
  Given the canvas is empty
  When I click "Export (.md)"
  Then the app shows a warning "Nothing to export"
  And no file is downloaded

Scenario: Consistent formatting
  Given I export any valid diagram
  When I open the `.md` file
  Then sections appear in this order:
    1) Front-matter (Methodology, Diagram Type, Title)
    2) `## Diagram Input` (Mermaid)
    3) `## Translation` (human-readable)

Scenario: File naming
  Given the diagram Title is "Expense Flow"
  When I export
  Then the downloaded file name is `expense-flow.md`


  ## Feature: Import Business Input File

Scenario: Successful import and render
  Given I am on the app with an empty canvas
  And I have a valid `.md` file (BDD, DDD, TDD, or SDD)
  When I click the "Import" button and select the file
  Then the app reads the `.md` file from my device
  And parses the Methodology, Diagram Type, and sections
  And renders the diagram on the canvas
  And shows the file in the Document Switcher with a badge and icon

Scenario: Invalid file type
  Given I click the "Import" button
  And I select a file that is not `.md`
  When the app tries to load the file
  Then the app shows an error toast "Only .md files are supported"
  And the canvas remains unchanged

Scenario: Missing required sections
  Given I import a `.md` file without Diagram Input or Translation sections
  When the app validates the file
  Then it shows a warning "File missing required sections"
  And does not render the diagram

Scenario: Keep header consistent
  Given I import a valid `.md` file with Methodology = "DDD"
  When the import completes
  Then the top-right header updates to "DDD"



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

## Feature: Guardrails (Non-Goals)
Scenario: No real-time collaboration
  Given the app is single-user and local-only
  When I use the app
  Then there should be no multi-user or collaboration features

Scenario: No backend dependency
  Given I run the app locally
  When I add shapes, connect, save, open, and export
  Then I should not need a backend server for these actions

## Acceptance Criteria
All scenarios are implemented.
