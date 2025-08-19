# DDD Specification — Diagramming Interface for a web application  
*Business Domain Perspective (Single-User, Local Web Application)*

---

## Static Features (Defaults)

> **Methodology Header Requirement:** The app must display the current methodology title (e.g., **“DDD”**) **fixed at the top-right** of the canvas viewport at all times.

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


##  Shared Language (Ubiquitous Terms)

| Term | Meaning |
|------|--------|
| **Diagram** | A visual representation made of shapes and arrows, used to describe logic, flow, or systems. |
| **Shape** | A visual element like a rectangle, circle, or diamond. Shapes may have labels. |
| **Connection (Edge)** | An arrow or line that links two shapes together and adjusts if shapes move. |
| **Canvas** | The main area where users create and arrange diagrams. |
| **Toolbar** | A simplified control panel for adding shapes, saving work, or exporting. |
| **Diagram File** | A saved version of the diagram stored on the user's device in JSON format. |
| **Export** | A downloaded file (Markdown, PNG, or SVG) that represents the current diagram. |
| **Mode Indicator** | A small UI label showing which design methodology the current app follows (e.g., BDD, TDD).

---

##  Core Functional Requirements

### 1. Diagram Creation

- Users can add basic shapes (rectangle, circle, diamond).
- Shapes can be resized, moved, and labeled directly.
- Shapes can be connected with arrows that "snap" to logical points.
- Deleting a shape removes all connected lines automatically.

### 2. Save, Open, and Export

- Users can save their diagram locally (JSON).
- Previously saved diagrams can be reopened at any time.
- Diagrams can be exported as:
  - **Markdown** (for documentation or AI workflows)
  - **PNG** (static image)
  - **SVG** (scalable vector for high fidelity)

- Users must confirm before deleting a diagram to avoid accidental data loss.

### 3. User Interface & Experience

- Minimal and responsive layout:
  - On desktop: full toolbar and canvas visible with no scroll.
  - On tablet: touch-friendly layout that adjusts gracefully.
- No distracting animations or bulky styling frameworks.
- A **design mode label (e.g., “BDD”) must always appear in the top-right corner** of the screen to show which methodology the app was built for.

### 4. Import Business Input File 

- Users can import a business input `.md` file (based on **BDD, DDD, TDD, or SDD**).  
- The file is always loaded **from the user’s local device** (no backend).  
- The app parses the file to detect:  
  - Methodology (e.g., BDD, DDD, TDD, SDD)  
  - Diagram Type (Flowchart, Sequence, etc.)  
  - Diagram Input (mermaid or structured text)  
  - Translation (human-readable steps)  
- Once imported, the diagram is rendered on the canvas and shown in the Document Switcher.  
- The **methodology header** at the top-right updates to reflect the imported file.  
- If the file is invalid (wrong type or missing sections), the user receives a clear error/warning, and the canvas remains unchanged.  

## 5. Export Reusable .md File

- Users can export their current diagram as a **Markdown file** (`.md`) that can later be **re-imported** back into the app.  

- The exported file always contains:
  1. **Front-matter**: Methodology (BDD, DDD, TDD, SDD), Diagram Type (Flowchart, Sequence, etc.), and Title.  
  2. **Diagram Input**: a simple **Mermaid diagram** so it can be viewed in any Markdown renderer.  
  3. **Translation**: a plain text, human-readable description of the diagram.  

- Export only works if the canvas has at least one shape or connection.  
  - If the canvas is empty, the app shows a warning: *“Nothing to export”*.  

- The exported file name is based on the diagram title (e.g., `Expense Flow` → `expense-flow.md`).  

- After export, users should be able to **import the same file back** and see the identical diagram on the canvas.  

- Export happens fully on the **local device** (no backend or internet required).  

- Errors (like failed file save) show a clear message but do not affect the current diagram.  

- Performance: Export should finish quickly (within a second for normal diagrams).  

# 6. Modify File

- Users can **edit diagrams inside the app** (e.g., move shapes, rename labels, add/remove connections).  
- Any change in the app is **saved back into the `.md` file**, keeping Mermaid + Translation updated.  
- Users can also **open the `.md` file in an external editor** and manually adjust:  
  - **Mermaid section** → updates the diagram structure.  
  - **Translation section** → updates the human-readable description.  
- When the edited `.md` file is re-imported, the canvas **must reflect all updates**.  
- The system must ensure **import/export consistency**: changes in one view (app or file) are always reproducible in the other.  

# 7. Reload Updated .md File

- Users can **reload an updated `.md` file** into the app at any time.  
- Reload can come from:
  - **External edits** (user updated the file in an editor).  
  - **In-app edits** (user changed diagram, exported, and re-imported).  
- On reload, the canvas must **fully reflect the updated file content**, ensuring consistency.  
- If the file is invalid (missing required sections/metadata), the app must **show a warning** and leave the current canvas unchanged.  
- Reload is always **explicit** — user chooses the updated file via **Import**.  




---

## Visual Consistency Rules

- The mode label (TDD, BDD, DDD, or SDD) must:
  - Be positioned in the **top-right corner**
  - Use styling consistent with the app’s theme
  - Update correctly based on active mode

This ensures visual trust and transparency for users, developers, and auditors alike.

---

## Non-Goals (What This App Will *Not* Do)

| Excluded Feature | Reason |
|------------------|--------|
| Real-time collaboration | Single-user only |
| Multi-user editing | Out of scope |
| AI integrations | Not required |
| Account/login system | Fully local |
| Backend or cloud services | Runs offline in the browser |
| Heavy CSS/JS libraries | Keeps performance and footprint lean |

---

## Business Acceptance Criteria

To be considered complete, the application must:

- Let users add, move, label, and connect shapes
- Allow saving, opening, and deleting diagrams
- Export diagrams in Markdown, PNG, and SVG formats
- Display the active methodology (e.g., BDD) clearly in the top-right corner
- Work fully offline with no server or backend setup
- Store diagrams in valid, schema-compliant JSON

---

## Output Summary

This tool will deliver a **self-contained, maintainable** diagramming interface for internal or offline use, optimized for:

- **Speed of use** (drag, drop, done)
- **Portability** (exports to Markdown, PNG, SVG)
- **Maintainability** (markdown-driven source of truth)
- **Clarity** (visible mode label, intuitive layout)


