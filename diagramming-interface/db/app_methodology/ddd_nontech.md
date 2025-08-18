# DDD Specification — Diagramming Interface for a web application  
*Business Domain Perspective (Single-User, Local Web Application)*

---

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


