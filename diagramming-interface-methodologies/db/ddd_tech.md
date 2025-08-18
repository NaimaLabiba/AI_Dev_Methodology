# DDD Specification — Diagramming Interface (Tech Domain View)
*Business Domain Perspective – Single-User, Local Web Application*

---

## ✨ Purpose

This specification defines the **core business logic** and **architectural boundaries** for a lightweight, local-first diagramming interface. The tool enables technical users to create structured, flow-based visualizations (e.g., system diagrams, architecture flows, or process models) using basic shapes and connectors — without requiring logins, network access, or backend infrastructure.

It aligns with **Domain-Driven Design (DDD)** principles and serves as the **single source of truth** for system capabilities, constraints, and feature scope.

---

## 🧠 Ubiquitous Language (Glossary)

| Term | Definition |
|------|------------|
| **Diagram** | A visual graph representing logical flows, systems, or processes. |
| **Shape** | A diagram node (rectangle, circle, diamond) that can be labeled and repositioned. |
| **Connection (Edge)** | A directional line/arrow linking two shapes, auto-adjusted during movement. |
| **Canvas** | Primary workspace where diagrams are created and manipulated. |
| **Toolbar** | Control panel for shape tools, file operations, and exports. |
| **Diagram File** | Locally stored JSON representation of the canvas state. |
| **Export** | A generated asset (Markdown, PNG, SVG) representing the current diagram state. |
| **Mode Indicator** | A persistent UI element showing the active methodology (e.g., TDD, BDD, DDD, SDD). |

---

## ✅ Core Functional Requirements

### 1. Diagram Creation

- Users must be able to:
  - Add basic shapes: `rectangle`, `circle`, `diamond`
  - Move, resize, and inline-label shapes
  - Draw directional connectors that snap to shape anchors
  - Automatically delete attached edges when a shape is removed

### 2. File Operations

- Support **local file persistence**:
  - **Save**: Store diagram state as JSON
  - **Open**: Load previously saved diagram from disk
  - **Delete**: Clear stored diagrams with confirmation prompt
- Support **exporting** to:
  - `Markdown (.md)` — for documentation or AI code generation
  - `PNG` — static visual representation
  - `SVG` — resolution-independent vector graphic

### 3. UI/UX Constraints

- **Responsive layout**:
  - Desktop: canvas + full toolbar without horizontal scroll
  - Tablet: fully touch-compatible interface
- **Minimalist interface**:
  - No animations
  - No CSS/JS frameworks (e.g., Bootstrap, Tailwind, jQuery)
- **Mode indicator**:
  - Positioned in top-right corner
  - Dynamically reflects current methodology (e.g., “DDD”)
  - Styled to match app theme (light/dark mode aware)

---

## 🎨 Visual Consistency Rules

- Mode indicator must:
  - Be **persistently visible**
  - Show only **one active methodology** at a time
  - Follow the system’s global design tokens (e.g., font, border, background color)
  - Update immediately when the internal `mode` state changes

This reinforces software provenance, compliance traceability, and dev/audit trust.

---

## 🛑 Explicit Non-Goals

| Excluded Capability | Justification |
|----------------------|---------------|
| Real-time collaboration | App is scoped to single-user use cases |
| Multi-user editing | Out of business scope |
| Cloud storage or sync | No backend required |
| Authentication system | Fully local deployment |
| AI or ML modules | Kept out for performance and simplicity |
| Third-party UI libraries | Reduces footprint and tech debt |

---

## 📌 Business Acceptance Criteria

| Requirement | Validation |
|-------------|------------|
| Add, label, connect shapes | Manually verifiable via canvas interactions |
| Save/Open/Delete diagram | JSON persists and reloads without loss |
| Export in `.md`, `.png`, `.svg` | Files render identically to canvas |
| Visible methodology label | Appears top-right, updates per mode |
| Offline-only functionality | No server communication initiated |
| JSON structure compliance | Passes schema validation tool |

---

## 🔁 System Output Summary

This application is a **zero-dependency, browser-based diagramming interface** engineered for internal, offline, or air-gapped environments. It is optimized for:

- 🧠 **Mental clarity** (visual simplicity, intuitive flow)
- 💡 **Code-first thinking** (Markdown export for LLMs/dev tooling)
- 💾 **Portability** (runs from `index.html`)
- 🛡 **Maintainability** (documented with domain-driven specs)

---

> 🧾 *This file must be updated prior to feature changes or structural modifications. It serves as both a product contract and an implementation blueprint.*
