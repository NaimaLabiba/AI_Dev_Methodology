#  DDD Specification — Diagramming Interface for a Web Application (Tech & Non-Tech Friendly)

> **Methodology Header Requirement:** The app must display the current methodology title (e.g., **“DDD”**) **fixed at the top-right** of the canvas viewport at all times.

---

##  Ubiquitous Language (Shared Vocabulary)

> Plain-language definitions used consistently by engineers, designers, and business stakeholders.

- **Domain-Driven Design (DDD):** An approach that centers software around the **business domain**, using a shared language and explicit **domain models**.
- **Bounded Context:** A clearly scoped domain area with its **own model and terms** (e.g., *Inventory*, *Payments*). Models don’t have to match outside the boundary.
- **Aggregate:** A consistency boundary that groups entities/value objects. One entity inside is the **Aggregate Root** (the entry point for changes).
- **Entity / Value Object:** Entity has identity (e.g., *Order#123*). Value object is defined by its values (e.g., *Money(USD, 10.00)*).
- **Command:** A **request to change state** (e.g., `ReserveStock`, `AuthorizePayment`). Commands are **intent** (“please do X”).
- **Event:** A **fact that happened** (e.g., `StockReserved`, `PaymentAuthorized`). Events are **past tense** (“X happened”).
- **Invariant:** A **rule that must always hold true** for an aggregate (e.g., “Order cannot confirm unless stock is reserved and payment approved”).
- **Saga / Process Manager / Policy:** A **long-running coordinator** that listens to events and sends commands across bounded contexts to drive a process.
- **Idempotency:** Performing the **same operation multiple times** yields the **same result** (protects against duplicates).
- **Outcome:** A **business-visible end state** (e.g., `Paid (Scheduled)`, `Rejected`, `Order Confirmed`).
- **Canvas:** The drawing area where diagrams are built.
- **Node / Edge:** Visual elements (shapes) and **connections** between them.
- **Lifeline / alt / opt (Sequence):** Sequence-diagram constructs for **participants** and **conditional fragments**.
- **GET / POST / PATCH (HTTP methods):**  
  - **GET**: *Retrieve* data; **no change** on the server.  
  - **POST**: *Create or send* data to the server (e.g., upload, import).  
  - **PATCH**: *Partially update* an existing item (e.g., change a setting).  
  (We reference these only to describe app actions like **export/import**; the app itself can run locally without a backend.)

---

##  Canvas Definition (Domain)

- **Canvas:** An infinite, pannable, zoomable surface that hosts nodes (shapes) and edges (connections).
- **Node (Shape):** Start, End, Action, Decision, Timer; label text; size; position; ports.
- **Edge (Connection):** Directed connection; waypoints; arrow style; optional label; follows node movement.
- **Layer:** Toggle visibility; reorder; lock/unlock.
- **Document:** Canvas metadata + nodes + edges + layers + style settings.

### Canvas Capabilities (Baseline)
- Infinite plane; pan with **space+drag**; zoom with **wheel/gesture**; fit/center controls.
- Snap-to-grid and snap-to-guides (with rulers & alignment hints).
- A11y: keyboard navigation, accessible labels, ARIA tool controls.

---

##  Feature: Import DDD Methodology Markdown

**Scenario: Import two refined DDD Markdown files**  
- Given I have **`ddd_flow.md`** and **`ddd_seq.md`** in refined human-readable format  
- When I choose **Import → Methodology Markdown** (local file picker; internally similar to **POST** semantics: we **send** files to the app)  
- Then the app parses each file and builds an internal representation for **Flow** and **Sequence**  
- And each file appears in the **Document Switcher** with a **DDD** badge and a type icon

**Scenario: Auto-detect diagram type & metadata**  
- Given each file includes a **Diagram Input** section and lines like `Flow Title:`, `Methodology:`, `Diagram Type:`, `Primary Outcomes:`, `Timers:`  
- When I import the files  
- Then the app detects **Flowchart** for `ddd_flow.md` and **Sequence** for `ddd_seq.md`  
- And it extracts **Flow Title**, **Primary Outcomes**, and **Timers** into diagram metadata

**Scenario: Parse warnings but render**  
- Given `ddd_seq.md` is missing `Primary Outcomes:`  
- When I import it  
- Then the app still renders the sequence diagram  
- And a non-blocking **Parse Warnings** panel lists the missing field

**Scenario: Round-trip export is idempotent**  
- Given I imported both DDD files and made no structural edits  
- When I export as **Methodology MD (Normalized)** (download; similar to **GET** semantics: we **retrieve** a file)  
- Then re-importing the exported files produces the **same diagram** and metadata

**Scenario: Switch between Flow and Sequence**  
- Given both files are imported  
- When I switch between **Flow** and **Sequence** views  
- Then the **DDD** methodology title remains pinned **top-right**  
- And the canvas preserves pan/zoom per view

**Scenario: Metadata wizard fallback**  
- Given `ddd_flow.md` is missing `Diagram Type`  
- When I import it  
- Then a **Metadata Wizard** asks me to confirm **Methodology**, **Diagram Type**, and **Primary Outcomes**  
- And the confirmed values are persisted into the document meta

**Scenario: Duplicate import de-duplication**  
- Given I import `ddd_flow.md` twice  
- When the second import matches file hash/title  
- Then the app offers **Replace** / **Keep Both** (suffix “(2)”) / **Skip**

---

##  Feature: Render DDD Flow from Markdown

**Scenario: Commands, invariants, events, states → nodes/edges**  
- Given `ddd_flow.md` includes lines like **`Command:`**, **`Apply Invariants:`**, **`Event:`**, **`State →`**  
- When I import the file  
- Then **Command:** lines render as **Action** nodes  
- And **Apply Invariants** render as **Decision** nodes (rule checks)  
- And **Event:** lines annotate edges and state transitions  
- And **State →** creates named state nodes where the flow lands

**Scenario: Process/Saga and Timer Policy**  
- Given the file lists **Process Policies (Sagas)** and **Timer/SLA** behavior  
- When I import  
- Then sagas appear as **annotated connectors** (policy labels) that coordinate nodes across contexts  
- And timers render as **Timer** nodes attached to their waiting states (e.g., `PendingApproval`)

**Scenario: Outcomes map to end states**  
- Given the input uses **`Outcome → NAME`** (e.g., `Scheduled`, `Rejected`, `Needs Receipt`)  
- When I import  
- Then each **Outcome** becomes a distinct **End/Outcome** node  
- And connectors route to the correct outcome

---

##  Feature: Render DDD Sequence from Markdown

**Scenario: Participants & messages with domain semantics**  
- Given `ddd_seq.md` lists **Participants** (as **Bounded Contexts** / services) and message lines **`A → B: Command/Event`**  
- When I import  
- Then the app creates **lifelines** for each participant  
- And renders messages in order with **command/event** labels

**Scenario: alt/opt fragments for domain branches**  
- Given the input contains branches (e.g., **ReservationFailed**, **PaymentDeclined**, **Challenge**)  
- When I import  
- Then the app renders **alt/opt** fragments for those conditions  
- And does **not** draw flowchart diamonds (sequence semantics only)

**Scenario: Nested alt/opt fragments**  
- Given a branch “Challenge” contains sub-branches “Success” and “Fail”  
- When I import  
- Then nested fragments render; **terminal messages** carry outcome badges

**Scenario: Outcome precedence (Sequence)**  
- Given a branch contains multiple outcome hints  
- When the diagram renders  
- Then the **last terminal outcome** in that branch drives the color and counts

---

##  Feature: Visualize Business Outcomes (Flow & Sequence)

**Scenario: Outcome chips & legend (Flow)**  
- Given `ddd_flow.md` includes outcomes (e.g., `Scheduled`, `Rejected`, `Needs Receipt`)  
- When the diagram renders  
- Then each outcome node shows a **colored chip** (success/neutral/failure palette)  
- And a **Legend** lists outcomes with **counts**

**Scenario: Filter by outcome (Flow)**  
- Given the legend is visible  
- When I select specific outcomes (e.g., **Rejected**, **Needs Receipt**)  
- Then paths to those outcomes remain **vivid**  
- And non-matching nodes/edges **dim**

**Scenario: Outcome badges & counts (Sequence)**  
- Given sequence branches lead to outcomes (e.g., `Order Confirmed`, `Retry Payment`, `3DS Challenge`)  
- When the sequence renders  
- Then terminal messages show **Outcome badges**  
- And the **Legend** shows counts per outcome across all branches

**Scenario: Cross-view consistency (DDD only)**  
- Given I imported both DDD files  
- When I open the **Outcomes** panel  
- Then I see a table of outcome counts for **Flow** and **Sequence** side-by-side  
- And **color mapping** is consistent between views

**Scenario: SLA awareness (Flow)**  
- Given the flow includes a **Timer Policy** (e.g., escalation after 7 days)  
- When I enable **Show SLA paths**  
- Then edges influenced by the timer show a **⏱** indicator  
- And the legend displays an **SLA** badge next to impacted outcomes

---

##  Feature: UI Layout & Canvas Chrome

**Scenario: Methodology header pinned (top-right)**  
- Given I open any diagram  
- When the UI renders  
- Then I see a **methodology title** (e.g., “DDD”) pinned to the **top-right** of the canvas viewport  
- And it remains visible during pan/zoom

**Scenario: Infinite canvas, pan & zoom**  
- Given the canvas is empty  
- When I hold space and drag  
- Then the canvas pans without moving shapes  
- And when I scroll/gesture  
- Then the canvas zooms smoothly around cursor

**Scenario: Grid, guides, and snapping**  
- Given snap-to-grid is enabled  
- When I drag a shape near grid lines or other shapes  
- Then snapping indicators appear and the shape aligns precisely

---

##  Feature: Manage Shapes

**Scenario: Add a rectangle**  
- Given I am on an empty canvas  
- When I add a rectangle from the toolbar  
- Then I should see a rectangle on the canvas

**Scenario: Move a shape**  
- Given a rectangle exists on the canvas  
- When I drag the rectangle to a new position  
- Then its position should update  
- And any connected lines should remain attached

**Scenario: Edit a shape label**  
- Given a rectangle exists on the canvas  
- When I edit the label to "Send Event"  
- Then the rectangle displays "Send Event"

**Scenario: Delete a shape with edges**  
- Given shapes A and B exist with a connection from A to B  
- When I delete shape A and confirm  
- Then shape A is removed  
- And the connection from A to B is also removed

**Scenario: Quick-add (ghost shapes)**  
- Given a shape is selected  
- When I click a quick-add handle  
- Then a new shape appears in that direction  
- And it is **auto-connected** to the selected shape

**Scenario: Match size, distribute, align**  
- Given three shapes of different sizes  
- When I use Match Size, Distribute Horizontally, Align Top  
- Then sizes match, spacing is even, and top edges align

**Scenario: Swap/replace shape type**  
- Given a shape is connected in a diagram  
- When I replace it with another type (e.g., Action → Decision)  
- Then connections are preserved and the new type is applied

---

##  Feature: Start/End Symbols & Method Shapes

**Scenario: Distinct Start/End appearance**  
- Given I add a **Start** and an **End** node  
- Then Start renders with a unique glyph (e.g., pill with green dot)  
- And End renders with a distinct style (e.g., double-ring red outline)

**Scenario: Decision and Timer styles**  
- Given I add a **Decision** node and a **Timer** node  
- Then Decision appears as a diamond with a bold label  
- And Timer appears with a clock icon and highlighted background

---

## 🔗 Feature: Connect Shapes

**Scenario: Connect two shapes**  
- Given shapes A and B exist  
- When I draw a connection from A to B  
- Then an arrow from A to B appears  
- And the arrow **snaps to anchors** on shape borders

**Scenario: Keep connections on move**  
- Given a connection from A to B exists  
- When I move A  
- Then the connection remains attached and **re-routes** intelligently

**Scenario: Bidirectional & labeled arrows**  
- Given shapes A and B are connected  
- When I toggle bidirectional  
- Then arrowheads appear on both ends  
- And when I edit an edge label to “OK”  
- Then the label renders centered along the path

---

##  Feature: Smart Lines & Routing

**Scenario: Automatic line routing**  
- Given multiple shapes and connections  
- When I insert a new shape between others  
- Then existing lines auto-reroute to avoid overlaps

**Scenario: Manual path adjustment**  
- Given an edge exists  
- When I drag its midpoints/segments  
- Then the path updates while staying attached to endpoints

**Scenario: Jump lines for crossings**  
- Given two edges cross  
- When jump-lines are enabled  
- Then the crossing edge displays a **bridge/jump** for clarity

**Scenario: Straight lines with Shift**  
- Given I am drawing a connector  
- When I hold **Shift**  
- Then the line snaps to straight or 45° increments

---

##  Feature: Layers & Grouping

**Scenario: Create and toggle layers**  
- Given I have a diagram  
- When I create a layer “Future State” and add shapes  
- Then toggling the layer visibility hides/shows those shapes

**Scenario: Lock and reorder layers**  
- Given layers “Base” and “Annotations”  
- When I lock “Base” and move “Annotations” above  
- Then “Base” shapes cannot be edited  
- And “Annotations” render on top

**Scenario: Group and ungroup**  
- Given multiple shapes are selected  
- When I group them, then ungroup  
- Then they move as a unit, then revert to individual selection

---

##  Feature: Selection & Bulk Actions

**Scenario: Smart select**  
- Given a complex diagram  
- When I choose “Select Similar → Decisions”  
- Then all Decision shapes are selected

**Scenario: Invert selection**  
- Given some shapes are selected  
- When I choose Invert Selection  
- Then all other shapes become selected and the initial ones are deselected

---

##  Feature: File Operations

**Scenario: Save a diagram locally**  
- Given my canvas contains shapes and connections  
- When I click “Save” (local file write; akin to **POST** into local storage)  
- Then a **JSON document** is stored locally  
- And it conforms to the schema (nodes, edges, layers, styles, meta)

**Scenario: Open a saved diagram**  
- Given I have a valid diagram JSON file  
- When I open the file (local read; akin to **GET**)  
- Then the canvas renders shapes and connections from the file

**Scenario: Export as Methodology MD (Normalized)**  
- Given my canvas has shapes and connections  
- When I export as **Methodology MD (Normalized)**  
- Then the Markdown lists shapes and edges using canonical wording  
- And importing that Markdown recreates the same canvas

**Scenario: Export as PNG/SVG**  
- Given my canvas has shapes and connections  
- When I export as PNG or SVG  
- Then a valid image file is produced at the chosen resolution/background

**Scenario: Delete a diagram with confirmation**  
- Given I have a saved diagram  
- When I choose to delete it and confirm (local removal; akin to **DELETE**)  
- Then the diagram is removed  
- And my canvas is empty

---

##  Feature: Styling & Theming

**Scenario: Change theme and line styles**  
- Given a diagram is open  
- When I switch to the “Clean” theme  
- Then nodes and edges adopt the theme’s fonts, colors, and spacing  
- And when I change an edge to dashed with a diamond head  
- Then the visual updates immediately

**Scenario: Properties panel**  
- Given a shape is selected  
- When I open the properties panel  
- Then I can edit label, size, color, border, and icon  
- And changes reflect live

---

##  Feature: Keyboard Shortcuts & A11y

**Scenario: Core shortcuts**  
- Given the canvas is focused  
- When I press Ctrl/Cmd+Z, then Ctrl/Cmd+Y (or Shift+Z)  
- Then the last action is undone and redone

**Scenario: Keyboard move & precision**  
- Given a shape is selected  
- When I use arrow keys (1px) and Shift+Arrows (10px)  
- Then the shape moves with precision

**Scenario: Screen reader support**  
- Given I navigate via keyboard  
- When I focus a shape or edge  
- Then its label and role are announced  
- And toolbar controls have ARIA labels

---

##  Feature: Guardrails (Non-Goals)

**Scenario: No real-time collaboration**  
- Given the app is single-user and local-only  
- When I use the app  
- Then there is no multi-user presence or live co-editing

**Scenario: No backend dependency**  
- Given I run the app locally (no server)  
- When I add shapes, connect, save, open, and export  
- Then all actions succeed without a backend

---

##  General Acceptance Criteria

- All scenarios above are implemented and pass manual QA.  
- Start/End **distinct symbols** are visually obvious in the default theme.  
- **Arrows follow shapes**: connectors remain attached and auto-reroute.  
- **Methodology title** (e.g., “DDD”) is persistently visible **top-right**.  
- Exports produce **valid** files (JSON, Methodology MD (Normalized), PNG/SVG) that re-import/re-render faithfully.  
- A11y checks: keyboard-only use, focus order, ARIA labels, readable contrast.  
- Performance: pan/zoom/drag smooth with **≥ 200 nodes / 300 edges** on a typical laptop.

---

##  Acceptance Criteria (on Markdown Import)

- App imports **exactly two DDD refined MD files** (`ddd_flow.md`, `ddd_seq.md`) and renders correct diagrams.  
- **Auto-detection** of diagram type, outcomes, timers, commands, events, and states works without manual hints.  
- **Business outcomes** are visible as colored chips (Flow) and badges (Sequence) with **legend + counts + filter**.  
- **Nested sequence branches** are supported and counted correctly.  
- **Outcome normalization** maps semantically similar labels to the same key across Flow and Sequence.  
- Methodology title **“DDD”** remains pinned **top-right** in both views.  
- Round-trip export/import of **normalized Methodology MD** is **idempotent**.  
- Parse warnings never block rendering; fatal errors show the offending line.

---

##  Notes / Implementation Hints (Non-binding)

- Use **snap-to-grid** (8px) + **smart guides** for alignment.  
- Provide **ghost/quick-add** handles on the four cardinal directions of a selected node.  
- Keep **edge routing** orthogonal by default; allow manual bendpoint edits.  
- Store document in a portable JSON schema: `{ meta, layers[], nodes[], edges[], styles }`.  
- Ensure idempotent save/open and **stable IDs** for nodes/edges for diffing.  
- Tooltips can display short definitions (Command/Event/Aggregate/Saga) for non-tech users.
