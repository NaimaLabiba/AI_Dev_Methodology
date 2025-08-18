# SDD Specification — Diagramming Interface (Single Source Markdown Truth)

## Overview

This is a **local-only, single-user** diagramming web app. Markdown is the system’s specification and the AI-friendly source of truth. The app allows drawing, editing, and exporting diagrams using shapes and connections.

---

## Functional Requirements (EARS Syntax)

### Shapes & Connections

- The system **shall** allow adding: rectangle, circle, diamond  
- When a shape is added, it **shall** appear on the canvas  
- Shapes **shall** be movable, resizable, and relabelable  
- Connected edges **shall** follow shape movement  
- Deleting a shape **shall** remove its connections  
- Connections **shall** snap to anchor points  

### Shape Labeling

- The system **shall** support inline label editing  
- Edited labels **shall** persist  

---

## File Operations

- The system **shall** support saving as:  
  - JSON (reloadable)  
  - Markdown (.md)  
  - PNG / SVG  
- "Save" action **shall** serialize the diagram  
- JSON files **shall** be re-importable  
- Delete actions **shall** prompt for confirmation  
- Exported files **shall** reflect the full diagram  

---

## UI/UX

- The app **shall** include a minimal toolbar:  
  - Add shapes  
  - Connect shapes  
  - Save, Open, Delete, Export  

- Layout **shall** be responsive:  
  - Desktop: no scroll  
  - Tablet: touch-compatible  

- The UI **shall not** use animations or large frameworks  

---

## Guardrails (Non-Goals)

- No real-time collab  
- No multi-user editing  
- No backend  
- No in-app AI  
- No Tailwind/Bootstrap  

All features **shall** work in-browser using local storage  

---

## Acceptance Criteria

- Functional requirements are implemented and tested  
- Exports match canvas state  
- Delete actions require confirmation  
- App runs fully offline  
- Cline or Copilot regenerate valid code from this markdown  

---

## Output Artifacts

- `index.html`, `main.js` — minimal frontend  
- `diagram.schema.json` — JSON validator  
- `README.md` — includes setup, contribution guide, and regeneration steps  

---

## AI Usage Intent

> This Markdown is the app’s **single source of truth**.  
> It guides the UI, logic, and code generation via agents like Cline.  
> Developers and PMs can modify this spec to evolve the product.
