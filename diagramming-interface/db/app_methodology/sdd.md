# SDD Specification — Diagramming Interface (Single Source Markdown Truth)

## This is the specification for the sdd markdown for the diagramming web interface.

This specification defines the features, behaviors, and guardrails for a **local-only, single-user diagramming interface**, similar to Visio, Lucidchart, or Miro. The app allows users to manage shapes and connections visually, perform file operations, and export in multiple formats. The source of truth is Markdown, designed for integration with AI agents (e.g., via Cline or Copilot), enabling easy code generation and evolution.


> **Methodology Header Requirement:** The app must display the current methodology title (e.g., **“SDD”**) **fixed at the top-right** of the canvas viewport at all times.


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



## Functional Requirements (EARS(Easy Approach to Requirements Syntax) Syntax)

### Shapes & Connection Management

- The system **shall** allow the user to add basic shapes including: `rectangle`, `circle`, and `diamond (decision)`.
- When the user drags a shape from the toolbar, the system **shall** render the shape on the canvas.
- The system **shall** allow users to **move**, **resize**, and **relabel** shapes.
- When shapes are moved, the system **shall** ensure that all connected lines remain attached and repositioned accordingly.
- The system **shall** allow users to draw directional connections (edges) between two shapes, snapping intelligently to anchor points.
- When a shape is deleted, the system **shall** also remove all connections attached to it.

### Shape Labeling

- The system **shall** allow inline label editing for each shape.
- When a user edits a label, the new label text **shall** be rendered and persisted.

---

## File Operations

- The system **shall** allow saving the current diagram as:
  - `JSON` (for reloading)
  - `Markdown (.md)` (as AI-parsable source of truth)
  - `PNG` and `SVG` (for visuals)
- When the user clicks "Save", the current state **shall** be serialized and saved locally.
- The system **shall** allow re-importing diagrams from valid JSON.
- When deleting a diagram, the system **shall** prompt for confirmation before removing it.
- When exporting, the system **shall** include all shapes, connections, and labels in the output.

---

## UI/UX Requirements

- The system **shall** provide a **minimal toolbar** with buttons for:
  - Add shape (with dropdown options)
  - Connect shapes
  - Save / Open / Delete / Export

- The layout **shall** be responsive:
  - On desktop: toolbar and canvas visible without scroll.
  - On tablet: UI elements usable via touch; layout adapts gracefully.

- The UI **shall** display the current development mode (e.g., `BDD`, `TDD`, `SDD`, or `DDD`) as a title in the **top-right corner** of the application.
  - The title **shall** be clearly visible and styled consistently with the overall app theme.
  - When the mode changes, the title **shall** update dynamically to reflect the current methodology.

- The UI **shall not** use unnecessary animations or heavy styling frameworks.

## Import Requirements (SDD)

- The system **shall** provide an **Import** action accessible via:
  - Top bar button **Import**
  - Keyboard shortcut **Ctrl+I**
  - **Drag & drop** onto the canvas

- The system **shall** accept only **`.md` (UTF-8)** files as input.

- The system **shall** validate required metadata and sections:
  - Front-matter keys: **Methodology** (BDD/DDD/TDD/SDD), **Diagram Type**, **Title**
  - Sections: **## Diagram Input**, **## Translation**

- The system **shall** reject files that:
  - Are not `.md`
  - Exceed **2 MB**
  - Omit any required keys/sections
  - On rejection, the system **shall** display a non-blocking error message and **shall not** alter the canvas.

- The system **shall** parse the file and construct an internal model matching **Diagram Type** (Flowchart or Sequence).

- The system **shall** render the parsed model on the **canvas** and update UI state:
  - Add an entry to **Document Switcher** with **Title**, **Methodology badge**, and **type icon**
  - Update the **top-right header** to the current **Methodology**

- The system **shall** read files **from local device storage** only (no network/backend dependency).

- The system **shall** preserve existing canvas state on any **failed import**.

- The system **shall** be accessible:
  - Import control **shall** be keyboard-focusable and labeled (e.g., `aria-label="Import .md file"`)
  - Status updates **shall** be announced via an ARIA live region

- The system **shall** complete import and initial render within **500 ms** for files ≤ 200 KB on target hardware.

- The system **shall** not persist imported content to remote services; all processing **shall** occur locally.

- The system **shall** log (local dev console or telemetry stub) the outcome: `import_success|import_failure` with reason codes.

- The system **shall not** perform schema auto-correction or mutate the source file during import.

## Export Requirements

- The system **shall** provide an **Export (.md)** action in:
  - Top bar menu and overflow menu
  - Keyboard shortcut **Ctrl+E**
  - Context menu on canvas

- The system **shall** export a single UTF-8 `.md` file containing:
  1) **Front-matter** with `Methodology`, `Diagram Type`, `Title`
  2) `## Diagram Input` (Mermaid)
  3) `## Translation` (human-readable)

- The exported file **shall** be **re-importable** to reproduce the same diagram.

- If the canvas is empty, the system **shall** show a warning **“Nothing to export”** and **shall not** create a file.

- File naming **shall** use kebab-case of Title (e.g., `expense-flow.md`).

- The export **shall** occur **locally** (no network/backend dependency).

- The system **shall** complete export for files ≤ 200 KB within **300 ms** on target hardware.

- Accessibility:
  - Export controls **shall** be keyboard-focusable with `aria-label="Export as Markdown"`.
  - Success/failure **shall** be announced via an ARIA live region.

- The system **shall not** modify canvas state during export, and **shall not** auto-correct schema on export.

- The system **shall** log `export_success|export_failure` with reason codes to local telemetry/dev console.

#  Modify File Requirements

- The system **shall** allow modification of diagrams **through the app interface** (edit labels, move shapes, adjust connectors).  
- The system **shall** immediately reflect edits in both the **canvas** and the **backing `.md` data model**.  
- The system **shall** allow users to directly edit the `.md` file outside the app.  
- The system **shall** update the diagram on re-import to reflect:  
  - Changes in the **Mermaid context** (diagram logic).  
  - Changes in the **Translation** (human-readable description).  
- The system **shall** maintain consistency between canvas view and `.md` file contents.  
- The system **shall not** overwrite manual `.md` edits unless the user explicitly re-imports or saves.  

#  Reload Requirements

- The system **shall** allow a previously exported or externally updated `.md` file to be re-imported.  
- The system **shall** parse the updated file and render the new diagram on the canvas.  
- The system **shall** ensure consistency: any edits (Mermaid or Translation) appear in the reloaded diagram.  
- The system **shall** reject invalid `.md` files with a warning message and preserve the current canvas.  
- The reload action **shall** be available via the existing **Import** workflow (no separate button).  
- The system **shall not** auto-refresh files — reload occurs only when the user explicitly re-imports.  



---

## Guardrails (Non-Goals)

- The system **shall not** include:
  - Real-time collaboration
  - Multi-user editing
  - AI integration inside the app
  - Backend dependencies for any core feature
- The system **shall not** use large UI libraries or CSS frameworks (e.g., Bootstrap, Tailwind).
- All operations **shall** run entirely in the browser using local storage or native browser APIs.

---

## Acceptance Criteria

- All functional requirements are implemented and tested.
- Exported `Markdown`, `PNG`, `SVG`, and `JSON` match the current canvas state.
- Deleting shapes and diagrams requires user confirmation.
- The app runs without backend services or setup.
- Cline or Copilot can regenerate codebase from the Markdown spec without missing intent.
- Code is modular, readable, and minimal in dependencies.

---

## Output Artifacts

- `index.html` / `main.js` or equivalent — minimal runnable frontend
- `diagram.schema.json` — validation schema for exported JSON
- `README.md` — includes:
  - Setup instructions
  - How to add a new shape
  - How to maintain code or spec
  - How to regenerate code from this Markdown

---

## AI Usage Intent

> This Markdown is designed to act as the **single source of truth** for your diagramming tool. It is intended to be parsed by an AI agent (e.g., Cline) that generates C#/JS/TS code for the UI and logic layer.  
> Any changes to functionality should be made in this file.  
> Developers or product owners can edit this file directly to maintain or evolve the app without deep technical knowledge.

