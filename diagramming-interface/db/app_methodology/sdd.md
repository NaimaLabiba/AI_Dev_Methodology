# SDD Specification — Diagramming Interface (Single Source Markdown Truth)

## This is the specification for the sdd markdown for the diagramming web interface.

This specification defines the features, behaviors, and guardrails for a **local-only, single-user diagramming interface**, similar to Visio, Lucidchart, or Miro. The app allows users to manage shapes and connections visually, perform file operations, and export in multiple formats. The source of truth is Markdown, designed for integration with AI agents (e.g., via Cline or Copilot), enabling easy code generation and evolution.

---

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

