# TDD Specification — Diagramming Interface for a web application

## Scope
A minimal, high-performance diagramming web interface (Visio/Lucid/Miro vibe) with shapes, connections, local file ops, and exports. Single-user, local-only.

## Non-Goals (Guardrails)
- No real-time collaboration or multi-user editing
- No backend web services required for core features
- No heavy CSS frameworks or animation bloat

---

## Test Suite: Shapes & Connections

# TBA: Define Toolbar. 

### T01_AddRectangle
**Arrange:** App opened on empty canvas  
**Act:** Add a rectangle from the toolbar  
**Assert:** Canvas contains one shape of type "rectangle" with default size/position

### T02_AddCircle
**Arrange:** Empty canvas  
**Act:** Add a circle from the toolbar  
**Assert:** Canvas contains one shape of type "circle"

### T03_AddDiamondDecision
**Arrange:** Empty canvas  
**Act:** Add a diamond (decision) from the toolbar  
**Assert:** Shape type is "diamond"

### T04_ResizeShape
**Arrange:** Canvas with one rectangle  
**Act:** Drag resize handle to increase width/height  
**Assert:** Shape’s width/height updated; label unaffected

### T05_MoveShape
**Arrange:** Two shapes on canvas  
**Act:** Drag first shape to new position  
**Assert:** New x/y persisted; any attached connections visually follow

### T06_ConnectShapes
**Arrange:** Two shapes on canvas  
**Act:** Draw a connection from Shape A to Shape B  
**Assert:** An edge A→B exists; edge endpoints snap to shape anchors

### T07_ConnectionFollowsOnMove
**Arrange:** Connected shapes A→B  
**Act:** Move shape A and retain connection  
**Assert:** Connection remains attached and follow the shape and updates rendering/anchors

### T08_EditShapeLabel
**Arrange:** One shape selected  
**Act:** Inline edit label to "Send Email"  
**Assert:** Label renders as "Send Email" and persists on save

### T09_DeleteShapeRemovesConnectedEdges
**Arrange:** Shapes A and B with edge A→B  
**Act:** Delete shape A (confirm)  
**Assert:** Shape A removed; any edges involving A removed


---

## Test Suite: File Operations

### F01_SaveDiagramToLocalStorage
**Arrange:** Canvas with 2 shapes + 1 connection  
**Act:** Click "Save"  
**Assert:** JSON persisted (key `diagram.current` or file download); schema validates

### F02_OpenDiagramFromFile
**Arrange:** A valid exported JSON file on disk  
**Act:** Open/import the file  
**Assert:** Canvas reflects shapes/connections from file; labels intact

### F03_DeleteDiagramWithConfirmation
**Arrange:** A saved diagram exists  
**Act:** Click "Delete Diagram" and confirm  
**Assert:** Diagram removed from storage; canvas resets to empty

### F04_ExportPNG
**Arrange:** Canvas with content  
**Act:** Export as PNG  
**Assert:** A PNG blob/file is produced; non-empty; dimensions >= canvas min size

### F05_ExportSVG
**Arrange:** Canvas with content  
**Act:** Export as SVG  
**Assert:** SVG text produced; includes `<svg>` root and shapes/paths

### F06_ExportMarkdown
**Arrange:** Canvas with content  
**Act:** Export as Markdown (.md)  
**Assert:** Markdown includes a diagram section listing shapes and edges; re-import regenerates identical canvas

---

## Test Suite: UI/UX & Responsiveness

### H01_DisplayTDDTitle
**Arrange:** App is running in TDD mode  
**Act:** View the application interface  
**Assert:** The title "TDD" is displayed on the top right corner  
**Assert:** The title is styled consistently with the overall application theme

### U01_DesktopLayout
**Arrange:** 1280×800 viewport  
**Act:** Load app  
**Assert:** Toolbar visible; canvas fits; no horizontal scroll on default

### U02_TabletLayout
**Arrange:** 1024×768 viewport  
**Act:** Load app  
**Assert:** Toolbar collapses or wraps cleanly; interactions usable via touch

### U03_MinimalStylingNoBloat
**Arrange:** Build bundle  
**Act:** Inspect CSS/JS sizes  
**Assert:** No large UI frameworks; dependency count minimal

---

## Test Suite: Guardrails

### G01_NoRealtimeCollab
**Arrange:** Codebase scan  
**Act:** Search for sockets/webrtc/collab endpoints  
**Assert:** None present

### G02_NoBackendRequired
**Arrange:** Run app locally  
**Act:** Use all CRUD + export features  
**Assert:** All work without a server (except optional local file APIs if used)

### G03_DeleteConfirmation
**Arrange:** Diagram with content  
**Act:** Delete diagram  
**Assert:** Confirmation modal shown and must be accepted to proceed

---

## Acceptance Criteria
- All tests above pass
- JSON schema for saved diagrams validates
- Exports (MD/PNG/SVG) succeed and match canvas content
