# 🧩 SDD Specification — Diagramming Interface for a Web Application (Tech & Non-Tech Friendly)

> **Methodology Header Requirement:** The app must display the current methodology title (e.g., **“SDD”**) **fixed at the top-right** of the canvas viewport at all times.

---

## 📚 System Glossary (Shared Language)

> Plain-language definitions used consistently by engineers, designers, and stakeholders.

- **SDD (System Design Document):** A specification that focuses on **components**, **interfaces**, **data contracts**, **operational behaviors**, and **quality attributes** (performance, reliability, accessibility).
- **Canvas:** The infinite drawing area where diagrams are built.
- **Node / Shape:** Visual elements such as **Start**, **End**, **Action**, **Decision**, **Timer**, **Service/Component**, **Notification**.
- **Edge / Connection:** A directed line between nodes; can carry a **label** (e.g., “Yes/No”, “200 OK”).
- **Lifeline / alt / opt (Sequence):** Sequence-diagram constructs for participants and conditional fragments.
- **Layer:** A named stratum for organizing nodes/edges; can be **shown/hidden**, **locked**, and **reordered**.
- **Outcome:** A business-visible end state (e.g., `Paid (Scheduled)`, `Rejected`, `Order Confirmed`).
- **Idempotency:** Performing the same operation multiple times yields the **same effect** (guards against duplicates).
- **Parser:** Code that **reads Markdown** and builds an internal diagram model.
- **Renderer:** Code that **draws** the model on the canvas (flow or sequence).
- **Normalized MD:** Canonical Markdown format produced by export; designed for **round-trip** import/export without changes.
- **HTTP Methods (used to describe app actions, even if running locally):**  
  - **GET:** *Retrieve* (no state change).  
  - **POST:** *Create or send* data (e.g., import/upload).  
  - **PATCH:** *Partially update* existing data (e.g., update properties).  
  - **DELETE:** *Remove* data.

---

## 🧱 Canvas Definition (Domain)

- **Canvas:** Infinite, pannable, zoomable; hosts nodes (shapes) and edges (connections).
- **Node (Shape):** Type, label, size, position, ports/anchors.
- **Edge (Connection):** Directed; waypoints; arrow style; optional label; follows node movement.
- **Layer:** Toggle visibility; lock/unlock; reorder.
- **Document:** `{ meta, layers[], nodes[], edges[], styles }` + diagram-type.

### Canvas Capabilities (Baseline)
- Infinite plane; pan with **space+drag**; zoom with **wheel/gesture**; fit/center controls.
- Snap-to-grid and snap-to-guides (rulers & alignment hints).
- A11y: keyboard navigation, accessible labels, ARIA tool controls.

---

## 📥 Feature: Import SDD Methodology Markdown

**Scenario: Import two refined SDD Markdown files**  
- Given I have **`sdd_flow.md`** and **`sdd_seq.md`** in refined human-readable format  
- When I choose **Import → Methodology Markdown** and select both files (**POST-like**: we send files to the app)  
- Then the app parses each file and builds internal representations for **Flow** and **Sequence**  
- And each file appears in the **Document Switcher** with an **SDD** badge and a type icon

**Scenario: Auto-detect diagram type & metadata**  
- Given each file includes a **Diagram Input** section with `Flow Title:`, `Methodology:`, `Diagram Type:`, `Primary Outcomes:`, `Operational Timers:`  
- When I import the files  
- Then the app detects **Flowchart** for `sdd_flow.md` and **Sequence** for `sdd_seq.md`  
- And extracts **Flow Title**, **Primary Outcomes**, and **Operational Timers** into metadata

**Scenario: Parse warnings but render**  
- Given `sdd_seq.md` is missing `Primary Outcomes:`  
- When I import it  
- Then the app still renders the sequence diagram  
- And a non-blocking **Parse Warnings** panel lists the missing field

**Scenario: Round-trip export is idempotent**  
- Given I imported both SDD files and made no structural edits  
- When I export as **Methodology MD (Normalized)** (**GET-like**: we retrieve a file)  
- Then re-importing the exported files produces the **same diagram** and metadata

**Scenario: Switch between Flow and Sequence**  
- Given both files are imported  
- When I switch between **Flow** and **Sequence** views  
- Then the **SDD** methodology title remains pinned **top-right**  
- And the canvas preserves pan/zoom per view

**Scenario: Metadata wizard fallback**  
- Given `sdd_flow.md` is missing `Diagram Type`  
- When I import it  
- Then a **Metadata Wizard** asks me to confirm **Methodology**, **Diagram Type**, and **Primary Outcomes**  
- And the confirmed values are persisted in the document meta

**Scenario: Duplicate import de-duplication**  
- Given I import `sdd_flow.md` twice  
- When the second import matches file hash/title  
- Then the app offers **Replace** / **Keep Both** (suffix “(2)”) / **Skip**

---

## 🧩 Feature: Render SDD Flow from Markdown

**Scenario: Services → Decisions → Side-Effects**  
- Given `sdd_flow.md` uses lines like **`Service:`**, **`Decision — … ?`**, **`Side-Effect:`**, **`Notify …`**  
- When I import the file  
- Then **Service:** lines render as **Service/Component** nodes  
- And **Decision — ?** lines render as **Decision** nodes with labeled edges  
- And **Side-Effect/Notify** render as **Action/Notification** nodes with outgoing edges

**Scenario: Operational timers (SLA/Timeout) as Timer nodes**  
- Given the flow lists **Operational Timers** (e.g., “Pending Review SLA = 7 days”)  
- When I import it  
- Then a **Timer** node is attached to the waiting state  
- And any escalation path is drawn with a **⏱** marker on affected edges

**Scenario: Outcomes map to end states**  
- Given the input uses **`Outcome → NAME`** (e.g., `Paid (Scheduled)`, `Rejected`, `Needs Receipt`)  
- When I import  
- Then each **Outcome** becomes a distinct **End/Outcome** node  
- And connectors route to the correct outcome

---

## 📡 Feature: Render SDD Sequence from Markdown

**Scenario: Participants & messages (with HTTP hints when present)**  
- Given `sdd_seq.md` lists **Participants** (UI, Services, Adapters) and lines `A → B: Message`  
- When I import it  
- Then the app creates **lifelines** for each participant  
- And renders message lines in order; if a message starts with `GET/POST/PATCH/DELETE`, the label includes a **brief definition** tooltip

**Scenario: alt/opt fragments for operational branches**  
- Given the input contains branches (e.g., **Timeout**, **Declined**, **Challenge**)  
- When I import  
- Then the app renders **alt/opt** fragments (sequence semantics)  
- And does **not** draw flowchart diamonds

**Scenario: Nested alt/opt fragments**  
- Given a branch “Challenge” has sub-branches “Success/Fail”  
- When I import  
- Then nested fragments render; **terminal messages** carry outcome badges

**Scenario: Outcome precedence (Sequence)**  
- Given a branch includes multiple possible outcomes  
- When the diagram renders  
- Then the **last terminal outcome** in that branch determines the color and counts

---

## 🎯 Feature: Visualize Business Outcomes (Flow & Sequence)

**Scenario: Outcome chips & legend (Flow)**  
- Given `sdd_flow.md` includes outcomes `Paid (Scheduled)`, `Rejected`, `Needs Receipt`  
- When the diagram renders  
- Then each outcome node shows a **colored chip** (success/neutral/failure palette)  
- And a **Legend** lists outcomes with **counts**

**Scenario: Filter by outcome (Flow)**  
- Given the legend is visible  
- When I select specific outcomes  
- Then paths to those outcomes remain **vivid**  
- And non-matching nodes/edges **dim**

**Scenario: Outcome badges & counts (Sequence)**  
- Given terminal messages correspond to outcomes (e.g., `Order Confirmed`, `Retry Payment`)  
- When the sequence renders  
- Then terminal messages show **Outcome badges**  
- And the legend shows **counts** per outcome across branches

**Scenario: Cross-view consistency (SDD only)**  
- Given both SDD files are imported  
- When I open the **Outcomes** panel  
- Then I see counts for **Flow** and **Sequence** side-by-side  
- And outcome **color mapping** is consistent between views

**Scenario: SLA awareness (Flow)**  
- Given the flow includes a **Timer** (e.g., SLA escalation)  
- When I enable **Show SLA paths**  
- Then edges influenced by the timer show a **⏱** indicator  
- And the legend displays an **SLA** badge next to impacted outcomes

---

## 🖼️ Feature: UI Layout & Canvas Chrome

**Scenario: Methodology header pinned (top-right)**  
- Given I open any diagram  
- When the UI renders  
- Then I see **“SDD”** pinned to the **top-right** of the canvas viewport  
- And it remains visible during pan/zoom

**Scenario: Infinite canvas, pan & zoom**  
- Given the canvas is empty  
- When I hold space and drag  
- Then the canvas pans without moving shapes  
- And scrolling/gesture zooms around the cursor

**Scenario: Grid, guides, and snapping**  
- Given snap-to-grid is enabled  
- When I drag a shape near guides or other shapes  
- Then snapping indicators appear and the shape aligns precisely

---

## 🧰 Feature: Manage Shapes

**Scenario: Add a rectangle**  
- Given an empty canvas  
- When I add a rectangle from the toolbar  
- Then a rectangle appears on the canvas

**Scenario: Move a shape**  
- Given a rectangle exists  
- When I drag it to a new position  
- Then its position updates  
- And connected lines remain attached

**Scenario: Edit a shape label**  
- Given a rectangle exists  
- When I edit its label to “Service: Approval”  
- Then the rectangle displays “Service: Approval”

**Scenario: Delete a shape with edges**  
- Given shapes A and B with A→B connection  
- When I delete A and confirm  
- Then A and the A→B connection are removed

**Scenario: Quick-add (ghost shapes)**  
- Given a shape is selected  
- When I click a quick-add handle  
- Then a new shape appears in that direction and is **auto-connected**

**Scenario: Match size, distribute, align**  
- Given three shapes of different sizes  
- When I use **Match Size**, **Distribute Horizontally**, **Align Top**  
- Then sizes match, spacing is even, and top edges align

**Scenario: Swap/replace shape type**  
- Given a shape is connected  
- When I replace it (e.g., **Action → Decision**)  
- Then connections are preserved and the new type is applied

---

## 🏁 Feature: Start/End Symbols & Method Shapes

**Scenario: Distinct Start/End appearance**  
- Given I add **Start** and **End** nodes  
- Then Start renders with a unique glyph (e.g., pill with green dot)  
- And End renders with a distinct style (e.g., double-ring red outline)

**Scenario: Decision and Timer styles**  
- Given I add a **Decision** and a **Timer** node  
- Then Decision appears as a diamond with a bold label  
- And Timer appears with a clock icon and highlighted background

---

## 🔗 Feature: Connect Shapes

**Scenario: Connect two shapes**  
- Given shapes A and B exist  
- When I draw a connection A→B  
- Then an arrow appears from A to B  
- And the arrow **snaps to anchors** on shape borders

**Scenario: Keep connections on move**  
- Given a connection A→B exists  
- When I move A  
- Then the connection remains attached and **re-routes** intelligently

**Scenario: Bidirectional & labeled arrows**  
- Given shapes A and B are connected  
- When I toggle bidirectional  
- Then arrowheads appear on both ends  
- And editing the edge label centers the text along the path

---

## 🧠 Feature: Smart Lines & Routing

**Scenario: Automatic line routing**  
- Given multiple shapes and connections  
- When I insert a new shape between others  
- Then existing lines **auto-reroute** to avoid overlaps

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

## 🗂️ Feature: Layers & Grouping

**Scenario: Create and toggle layers**  
- Given a diagram  
- When I create a layer “Future State” and add shapes  
- Then toggling the layer visibility hides/shows those shapes

**Scenario: Lock and reorder layers**  
- Given layers “Base” and “Annotations”  
- When I lock “Base” and move “Annotations” above it  
- Then “Base” shapes cannot be edited  
- And “Annotations” render on top

**Scenario: Group and ungroup**  
- Given multiple shapes selected  
- When I group them, then ungroup  
- Then they move as a unit, then revert to individual selection

---

## 🧼 Feature: Selection & Bulk Actions

**Scenario: Smart select**  
- Given a complex diagram  
- When I choose **Select Similar → Decisions**  
- Then all Decision shapes are selected

**Scenario: Invert selection**  
- Given some shapes are selected  
- When I choose **Invert Selection**  
- Then all other shapes become selected and the initial ones are deselected

---

## 💾 Feature: File Operations

**Scenario: Save a diagram locally**  
- Given my canvas contains shapes and connections  
- When I click **Save** (local write; **POST-like**)  
- Then a **JSON document** is stored locally  
- And it conforms to the schema (nodes, edges, layers, styles, meta)

**Scenario: Open a saved diagram**  
- Given I have a valid diagram JSON file  
- When I open the file (local read; **GET-like**)  
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
- When I choose **Delete** and confirm (**DELETE-like**)  
- Then the diagram is removed  
- And my canvas is empty

---

## 🎨 Feature: Styling & Theming

**Scenario: Change theme and line styles**  
- Given a diagram is open  
- When I switch to the “Clean” theme  
- Then nodes and edges adopt the theme’s fonts, colors, spacing  
- And changing an edge to dashed with a diamond head updates immediately

**Scenario: Properties panel**  
- Given a shape is selected  
- When I open the properties panel  
- Then I can edit label, size, color, border, and icon  
- And changes reflect live

---

## ⌨️ Feature: Keyboard Shortcuts & A11y

**Scenario: Core shortcuts**  
- Given the canvas is focused  
- When I press **Ctrl/Cmd+Z** and then **Ctrl/Cmd+Y (or Shift+Z)**  
- Then the last action is undone and redone

**Scenario: Keyboard move & precision**  
- Given a shape is selected  
- When I use **arrow keys (1px)** and **Shift+Arrows (10px)**  
- Then the shape moves with precision

**Scenario: Screen reader support**  
- Given I navigate via keyboard  
- When I focus a shape or edge  
- Then its label and role are announced  
- And toolbar controls have ARIA labels

---

## 🛡️ Feature: Guardrails (Non-Goals)

**Scenario: No real-time collaboration**  
- Given the app is single-user and local-only  
- When I use the app  
- Then there is no multi-user presence or live co-editing

**Scenario: No backend dependency**  
- Given I run the app locally (no server)  
- When I add shapes, connect, save, open, and export  
- Then all actions succeed without a backend

---

## ✅ General Acceptance Criteria

- All scenarios above are implemented and pass manual QA.  
- Start/End **distinct symbols** are visually obvious in the default theme.  
- **Arrows follow shapes**: connectors remain attached and auto-reroute.  
- **Methodology title** (e.g., “SDD”) is persistently visible **top-right**.  
- Exports produce **valid** files (JSON, Methodology MD (Normalized), PNG/SVG) that re-import/re-render faithfully.  
- A11y checks: keyboard-only use, focus order, ARIA labels, readable contrast.  
- Performance: pan/zoom/drag smooth with **≥ 200 nodes / 300 edges** on a typical laptop.

---

## ✅ Acceptance Criteria (on Markdown Import)

- App imports **exactly two SDD refined MD files** (`sdd_flow.md`, `sdd_seq.md`) and renders correct diagrams.  
- **Auto-detection** of diagram type, outcomes, and operational timers works without manual hints.  
- **Business outcomes** are visible as colored chips (Flow) and badges (Sequence) with **legend + counts + filter**.  
- **Nested sequence branches** are supported and counted correctly.  
- **Outcome normalization** maps semantically similar labels to the same key across Flow and Sequence.  
- Methodology title **“SDD”** remains pinned **top-right** in both views.  
- Round-trip export/import of **normalized Methodology MD** is **idempotent**.  
- Parse warnings never block rendering; fatal errors show the offending line.

---

## 🗒️ Notes / Implementation Hints (Non-binding)

- Use **snap-to-grid** (8px) + **smart guides** for alignment.  
- Provide **ghost/quick-add** handles on the four cardinal directions of a selected node.  
- Keep **edge routing** orthogonal by default; allow manual bendpoint edits.  
- Store document in a portable JSON schema: `{ meta, layers[], nodes[], edges[], styles }`.  
- Ensure idempotent save/open and **stable IDs** for nodes/edges for diffing.  
- Offer tooltips for HTTP verbs (**GET/POST/PATCH/DELETE**) to aid non-technical users.
