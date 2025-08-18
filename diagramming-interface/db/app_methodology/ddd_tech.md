# DDD Specification — Diagramming Interface for a web application by technical domain expert
 
# Creation of a diagramming web application tool 

## Ubiquitous Language (Glossary)
- **Diagram**: A collection of Shapes and Connections displayed on a Canvas.
- **Shape**: A node on the canvas. Types: Rectangle, Circle, Diamond (Decision), Text.
- **Connection (Edge)**: A directed arrow from a `source` Shape to a `target` Shape with snapping anchors.
- **Canvas**: The drawable area hosting a Diagram.
- **Toolbar**: UI component used to add/delete shapes and trigger exports.
- **DiagramFile**: A persisted JSON representation of a Diagram.
- **Export**: A generated artifact (Markdown, PNG, SVG) representing a Diagram state.

## Value Objects
- **Position**: `{ x: number, y: number }`
- **Size**: `{ width: number, height: number }`
- **Label**: `{ text: string }`
- **ShapeId** / **EdgeId**: stable identifiers

## Entities / Aggregates

- **UIHeader**
  - `mode: Mode ∈ {TDD, BDD, DDD, SDD}`
  - `position: { x: number, y: number }`  // top right alignment
  - `label: string`  // e.g., "BDD"
  - Operations:
    - `render(mode)`: displays current mode
    - `updatePosition(position)`: enforces consistent top-right placement
    - `applyTheme()`: uses app-wide style settings

- **Diagram (Aggregate Root)**
  - `id: DiagramId`
  - `shapes: Shape[]`
  - `connections: Connection[]`
  - Operations:
    - `addShape(type, position, size, label?)`
    - `moveShape(shapeId, position)`
    - `resizeShape(shapeId, size)`
    - `editLabel(shapeId, text)`
    - `connect(sourceId, targetId)`
    - `deleteShape(shapeId)`  // cascades: remove related connections
- **Shape**
  - `id, type ∈ {rectangle, circle, diamond, text}, position, size, label`
- **Connection**
  - `id, sourceId, targetId, anchors`

## Invariants (Rules)
- I1: `sourceId` and `targetId` of a Connection MUST reference existing Shapes.
- I2: Connections MUST update anchor endpoints when Shapes move.
- I3: Deleting a Shape MUST delete all incident Connections.
- I4: Diagram serialization MUST validate against the JSON schema.
- I5: Export operations MUST reflect the current Diagram state.
- I6: UIHeader MUST display the active mode (TDD, BDD, DDD, or SDD)
- I7: UIHeader MUST be rendered in the top right corner of the interface
- I8: UIHeader MUST inherit consistent theme styling from the application


## Domain Services
- **DiagramExporter**
  - `toMarkdown(diagram) -> string`
  - `toPNG(diagram) -> Blob`
  - `toSVG(diagram) -> string`
- **DiagramRepository**
  - `save(diagram) -> Result`
  - `open(file) -> Diagram`
  - `delete(diagramId) -> Result`

## Domain Events
- `ShapeAdded(shapeId, type)`
- `ShapeMoved(shapeId, oldPos, newPos)`
- `ConnectionCreated(edgeId, sourceId, targetId)`
- `ShapeDeleted(shapeId)`
- `DiagramSaved(diagramId, location)`
- `DiagramExported(diagramId, format)`

## Bounded Contexts
- **EditingContext**: Diagram/Shape/Connection operations
- **PersistenceContext**: Saving/Opening/Deleting DiagramFile
- **ExportContext**: Markdown/PNG/SVG generation
- **UIContext**: Responsible for visual elements like the header, layout, and responsive positioning

## Anti-Requirements (Guardrails)
- No RealTimeCollaboration
- No MultiUserEditing
- No BackendDependency for core features

## Acceptance Criteria Mapping
- Adding, moving, resizing, labeling shapes → emits events; invariants I1–I3 hold
- Save/Open/Delete → repository operations succeed; schema-validated
- Export (MD/PNG/SVG) → artifacts accurately represent current Diagram
