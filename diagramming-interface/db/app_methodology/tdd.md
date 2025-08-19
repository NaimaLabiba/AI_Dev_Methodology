# TDD Specification — Diagramming Interface for a web application

## Scope
A minimal, high-performance diagramming web interface (Visio/Lucid/Miro vibe) with shapes, connections, local file ops, and exports. Single-user, local-only.

## Non-Goals (Guardrails)
- No real-time collaboration or multi-user editing
- No backend web services required for core features
- No heavy CSS frameworks or animation bloat

> **Methodology Header Requirement:** The app must display the current methodology title (e.g., **“TDD”**) **fixed at the top-right** of the canvas viewport at all times.


---
## Static Features (Defaults)

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

# Test Suite:  Reload Updated .md File

### T01_ReloadAfterExternalEdit
**Arrange:** `.md` file updated externally (Mermaid changed A→B → A→C)  
**Act:** Re-import updated file  
**Assert:** Canvas shows A→C connection

### T02_ReloadAfterInAppEdit
**Arrange:** Exported `.md` after editing shape label "Start" → "Login"  
**Act:** Re-import exported file  
**Assert:** Canvas displays label "Login"

### T03_ReloadInvalidFile
**Arrange:** `.md` file missing Diagram Input section  
**Act:** Re-import file  
**Assert:** Warning displayed; canvas remains unchanged


# Test Suite: Import Business Input File

### T01_SuccessfulImportRendersDiagram
**Arrange:** Empty canvas; valid `.md` file with Methodology + Diagram Type + required sections  
**Act:** Click "Import" and select the file  
**Assert:** File read successfully; diagram rendered on canvas; Document Switcher shows file with badge + icon; header updated to methodology  

### T02_RejectNonMdFiles
**Arrange:** Empty canvas; select `diagram.txt` file  
**Act:** Click "Import" and choose invalid file type  
**Assert:** Error toast "Only .md files are supported"; canvas remains unchanged  

### T03_MissingRequiredSections
**Arrange:** `.md` file missing `## Diagram Input` or `## Translation`  
**Act:** Import the file  
**Assert:** Warning toast "File missing required sections"; diagram not rendered; canvas unchanged  

### T04_HeaderUpdatesOnImport
**Arrange:** Header initially shows "BDD"; valid `.md` file has Methodology "DDD"  
**Act:** Import the file  
**Assert:** Header text updates to "DDD"  

### T05_PreserveCanvasOnFailedImport
**Arrange:** Canvas contains shapes; attempt to import malformed `.md` file  
**Act:** Import fails  
**Assert:** Canvas state remains unchanged; no overwrite occurs  \

# Test Suite: Export Reusable .md File

### T01_ExportIncludesMermaidAndTranslation
**Arrange:** Canvas contains shapes and connections  
**Act:** Click "Export (.md)"  
**Assert:** File generated with `## Diagram Input` (Mermaid) and `## Translation` (human-readable)

### T02_ExportedFileIsReimportable
**Arrange:** A diagram is exported as `.md`  
**Act:** Import the same file back into the app  
**Assert:** Diagram renders identically on canvas

### T03_MetadataPreserved
**Arrange:** Diagram has Methodology = "BDD", Diagram Type = "Flowchart", Title = "Expense Flow"  
**Act:** Export as `.md`  
**Assert:** Front-matter contains Methodology, Diagram Type, and Title fields

### T04_EmptyCanvasExport
**Arrange:** Empty canvas  
**Act:** Click "Export (.md)"  
**Assert:** Warning toast "Nothing to export"; no file downloaded

### T05_ConsistentFormatting
**Arrange:** Any valid diagram on canvas  
**Act:** Export as `.md`  
**Assert:** Sections appear in order → (1) Front-matter, (2) `## Diagram Input` (Mermaid), (3) `## Translation`

### T06_FileNaming
**Arrange:** Diagram Title = "Expense Flow"  
**Act:** Export as `.md`  
**Assert:** Downloaded file name is `expense-flow.md`

# Test Suite — Modify File

### T01_ModifyThroughAppUpdatesMd
**Arrange:** Imported `.md` file with one shape labeled "Start"  
**Act:** Edit label in app → "Login"  
**Assert:** Canvas shows "Login"; exported `.md` file contains "Login"

### T02_ModifyMermaidDirectly
**Arrange:** `.md` file opened in external editor  
**Act:** Change Mermaid context from `A-->B` to `A-->C`  
**Assert:** On re-import, canvas shows A→C connection

### T03_ModifyTranslationDirectly
**Arrange:** `.md` file with Translation = "Send Email"  
**Act:** Edit to "Send Report"  
**Assert:** On re-import, properties/notes display "Send Report"




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
