# BDD Specification — Diagramming Interface for a Web Application

> **Methodology Header Requirement:** The app must display the current methodology title (e.g., **“BDD”**) **fixed at the top-right** of the canvas viewport at all times.

---

## Canvas Definition (Domain)

- **Canvas:** An infinite, pannable, zoomable surface that hosts nodes (shapes) and edges (connections).
- **Node (Shape):** Visual element with a type (e.g., Start, End, Action, Decision, Timer), label text, size, position, and ports/anchors for connections.
- **Edge (Connection):** Directed connection between nodes; has route (waypoints), arrow style, optional label, and follows node movements.
- **Layer:** A named grouping stratum for nodes/edges; layers can be toggled (show/hide), reordered, and locked.
- **Document:** A diagram file containing canvas metadata, nodes, edges, layers, and style settings.

### Canvas Capabilities (Baseline)
- Infinite plane; pan with **space+drag**; zoom with **wheel/gesture**; fit/center controls.
- Snap-to-grid and snap-to-guides (with rulers & alignment hints).
- A11y: keyboard navigation, accessible labels, and ARIA for tool controls.

---

## Feature: Import BDD Methodology Markdown 

**Scenario: Import two refined BDD Markdown files**  
- Given I have **`bdd_flow.md`** and **`bdd_seq.md`** in the refined human-readable format  
- When I choose **Import → Methodology Markdown** and select both files  
- Then the app parses each file and builds an internal representation for **Flow** and **Sequence**  
- And each file appears in the **Document Switcher** with a **BDD** badge and a type icon

**Scenario: Auto-detect diagram type & metadata**  
- Given the files include a **Diagram Input** section and lines like `Flow Title:`, `Methodology:`, `Diagram Type:`, `Primary Outcomes:`, `Timers:`  
- When I import the files  
- Then the app auto-detects **Flowchart** for `bdd_flow.md` and **Sequence** for `bdd_seq.md`  
- And it extracts **Flow Title**, **Primary Outcomes**, and any **Timers** into diagram metadata

**Scenario: Parse warnings but render**  
- Given `bdd_seq.md` is missing `Primary Outcomes:`  
- When I import it  
- Then the app still renders the sequence diagram  
- And a non-blocking **Parse Warnings** panel lists the missing field

**Scenario: Round-trip export is idempotent**  
- Given I imported both BDD files and made no structural edits  
- When I export as **Methodology MD (Normalized)**  
- Then re-importing the exported files produces the **same diagram** and metadata

**Scenario: Switch between Flow and Sequence**  
- Given both files are imported  
- When I switch between **Flow** and **Sequence** views  
- Then the **BDD** methodology title remains pinned **top-right**  
- And the canvas preserves pan/zoom per view

**Scenario: Metadata wizard fallback**  
- Given `bdd_flow.md` is missing `Diagram Type`  
- When I import it  
- Then a **Metadata Wizard** asks me to confirm **Methodology**, **Diagram Type**, and **Primary Outcomes**  
- And the confirmed values are persisted into the document meta

**Scenario: Duplicate import de-duplication**  
- Given I import `bdd_flow.md` twice  
- When the second import matches file hash/title  
- Then the app offers **Replace** / **Keep Both** (suffix “(2)”) / **Skip**

---

## Feature: Render BDD Flow from Markdown 

**Scenario: Steps become action nodes**  
- Given `bdd_flow.md` uses headings like **“Step N — Label”**  
- When I import the file  
- Then each step becomes an **Action** node linked in reading order

**Scenario: Decisions, branches, timers**  
- Given the input contains **“Decision — … ?”**, **“Branch — …”**, and **“SLA Escalation”** lines  
- When I import it  
- Then **Decision** and **Branch** lines become **Decision** nodes with labeled edges  
- And **SLA** becomes a **Timer** node attached to the relevant review step

**Scenario: Outcomes map to end states**  
- Given the input uses **“Outcome → NAME”** lines (e.g., `Paid (Scheduled)`, `Rejected`, `Needs Receipt`)  
- When I import it  
- Then each **Outcome** becomes a distinct **End/Outcome** node  
- And connectors route to the correct outcome

---

## Feature: Render BDD Sequence from Markdown 

**Scenario: Participants & messages**  
- Given `bdd_seq.md` lists **Participants** and lines like **`A → B: Message`**  
- When I import it  
- Then the app creates lifelines for each participant  
- And renders messages in order from sender to receiver

**Scenario: Branches (alt/opt) without flow diamonds**  
- Given the input contains branch sections (e.g., **Declined**, **Timeout**, **3DS Challenge**)  
- When I import it  
- Then the app renders **alt/opt fragments** for those conditions  
- And does **not** draw flowchart diamonds (sequence semantics only)

**Scenario: Nested alt/opt fragments**  
- Given a branch “Challenge” contains sub-branches “Success” and “Fail”  
- When I import it  
- Then the app renders **nested fragments**  
- And the **terminal message** in each sub-branch carries its own outcome badge

**Scenario: Outcome precedence (Sequence)**  
- Given a branch contains multiple outcome hints  
- When the diagram renders  
- Then the **last terminal outcome** in that branch is used for counting and coloring

**Scenario: Terminal steps become outcomes**  
- Given a branch ends with “Show **Retry Payment**. **End.**” or “Show **Order Confirmed**. **End.**”  
- When I import it  
- Then the final message in that branch is tagged with a **Business Outcome** badge

---

## Feature: Visualize Business Outcomes (Flow & Sequence)

**Scenario: Outcome chips & legend (Flow)**  
- Given `bdd_flow.md` includes outcomes `Paid (Scheduled)`, `Rejected`, `Needs Receipt`  
- When the diagram renders  
- Then each outcome node shows a **colored chip** (success/neutral/failure palette)  
- And a **Legend** lists outcomes with **counts** for the current diagram

**Scenario: Filter by outcome (Flow)**  
- Given the legend is visible  
- When I select **Rejected** and **Needs Receipt**  
- Then paths to those outcomes remain vivid  
- And all non-matching nodes/edges dim

**Scenario: Outcome badges & counts (Sequence)**  
- Given `bdd_seq.md` includes branches for **Approved**, **Declined**, **Timeout**, **Challenge**  
- When the sequence renders  
- Then terminal messages show **Outcome badges** (e.g., `Order Confirmed`, `Retry Payment`, `3DS Challenge`)  
- And the legend shows **counts** per outcome across all branches

**Scenario: Cross-view consistency (BDD only)**  
- Given I imported both BDD files  
- When I open the **Outcomes** panel  
- Then I see a table of outcome counts for **Flow** and **Sequence** side by side  
- And outcome color mapping is **consistent** between the two views

**Scenario: SLA awareness (Flow)**  
- Given the flow includes a **Manager Review SLA = 7 days** timer that triggers escalation  
- When I enable **Show SLA paths**  
- Then edges leading to SLA-driven outcomes show a small **⏱** indicator  
- And the legend displays an SLA badge next to affected outcomes

---

## Feature: UI Layout & Canvas Chrome

**Scenario: Methodology header pinned (top-right)**  
- Given I open any diagram  
- When the UI renders  
- Then I see a **methodology title** (e.g., “BDD”) pinned to the **top-right** of the canvas viewport  
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

## Feature: Manage Shapes

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
- When I edit the label to "Send Email"  
- Then the rectangle should display "Send Email"

**Scenario: Delete a shape with edges**  
- Given shapes A and B exist with a connection from A to B  
- When I delete shape A and confirm  
- Then shape A is removed  
- And the connection from A to B is also removed

**Scenario: Quick-add (ghost shapes)**  
- Given a shape is selected  
- When I click a quick-add handle/ghost  
- Then a new shape appears in that direction  
- And it is **auto-connected** to the selected shape

**Scenario: Match size, distribute, align**  
- Given three shapes of different sizes  
- When I choose Match Size  
- Then they share identical width/height  
- And when I choose Distribute Horizontally and Align Top  
- Then spacing is even and top edges align

**Scenario: Swap/replace shape type**  
- Given a shape is connected in a diagram  
- When I replace it with another type (e.g., Action → Decision)  
- Then connections are preserved and the new type is applied

---

## Feature: Start/End Symbols & Method Shapes

**Scenario: Distinct Start/End appearance**  
- Given I add a **Start** and an **End** node  
- Then Start renders with a unique glyph (e.g., pill with green dot)  
- And End renders with a distinct style (e.g., double-ring red outline)

**Scenario: Decision and Timer styles**  
- Given I add a **Decision** node and a **Timer** node  
- Then Decision appears as a diamond with a bold label  
- And Timer appears with a clock icon and highlighted background

---

## Feature: Connect Shapes

**Scenario: Connect two shapes**  
- Given shapes A and B exist  
- When I draw a connection from A to B  
- Then an arrow from A to B should appear  
- And the arrow **snaps to anchors** on the shape borders

**Scenario: Keep connections on move**  
- Given a connection from A to B exists  
- When I move A  
- Then the connection remains attached and **re-routes** intelligently

**Scenario: Bidirectional & labeled arrows**  
- Given shapes A and B are connected  
- When I toggle bidirectional  
- Then arrowheads appear on both ends  
- And when I edit an edge label to “Yes”  
- Then the label renders centered along the path

---

## Feature: Smart Lines & Routing

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
- When I hold Shift  
- Then the line snaps to straight or 45° increments

---

## Feature: Layers & Grouping

**Scenario: Create and toggle layers**  
- Given I have a diagram  
- When I create a layer “Future State” and add shapes to it  
- Then toggling the layer visibility hides/shows those shapes

**Scenario: Lock and reorder layers**  
- Given two layers “Base” and “Annotations”  
- When I lock “Base” and move “Annotations” above it  
- Then “Base” shapes cannot be edited  
- And “Annotations” render on top

**Scenario: Group and ungroup**  
- Given multiple shapes are selected  
- When I group them  
- Then they move as one unit  
- And when I ungroup  
- Then they return to individual selection

---

## Feature: Selection & Bulk Actions

**Scenario: Smart select**  
- Given a complex diagram  
- When I choose “Select Similar → Decisions”  
- Then all Decision shapes are selected

**Scenario: Invert selection**  
- Given some shapes are selected  
- When I choose Invert Selection  
- Then all other shapes become selected and the initial ones are deselected

---

## Feature: File Operations

**Scenario: Save a diagram locally**  
- Given my canvas contains two shapes and one connection  
- When I click “Save”  
- Then a **JSON document** is stored locally  
- And it conforms to the diagram JSON schema (nodes, edges, layers, styles, meta)

**Scenario: Open a saved diagram**  
- Given I have a valid diagram JSON file  
- When I open the file  
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
- When I choose to delete it and confirm  
- Then the diagram is removed  
- And my canvas is empty

---

## Feature: Styling & Theming

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

## Feature: Keyboard Shortcuts & A11y

**Scenario: Core shortcuts**  
- Given the canvas is focused  
- When I press Ctrl/Cmd+Z  
- Then the last action is undone  
- And Ctrl/Cmd+Y (or Shift+Z) redoes it

**Scenario: Keyboard move & precision**  
- Given a shape is selected  
- When I use arrow keys  
- Then it moves by 1px; with Shift it moves by 10px

**Scenario: Screen reader support**  
- Given I navigate via keyboard  
- When I focus a shape or edge  
- Then its label and role are announced  
- And toolbar controls have ARIA labels

---

## Feature: Guardrails (Non-Goals)

**Scenario: No real-time collaboration**  
- Given the app is single-user and local-only  
- When I use the app  
- Then there is no multi-user presence or live co-editing

**Scenario: No backend dependency**  
- Given I run the app locally  
- When I add shapes, connect, save, open, and export  
- Then I do not need a backend server for these actions

---

## General Acceptance Criteria

- All scenarios above are implemented and pass manual QA.
- Start/End **distinct symbols** are visually obvious in default theme.
- **Arrows follow shapes**: connectors remain attached and re-route on movement.
- **Methodology title** (e.g., “BDD”) is persistently visible **top-right**.
- Exports produce **valid** files (JSON, Methodology MD (Normalized), PNG/SVG) that re-import/re-render faithfully.
- A11y checks: keyboard-only use, focus order, ARIA labels for tools, readable contrast.
- Performance: pan/zoom and drag remain smooth with **≥ 200 nodes / 300 edges** on a typical laptop.

## Acceptance Criteria (when we import a markdown)

- The app imports **exactly two BDD refined MD files** (`bdd_flow.md`, `bdd_seq.md`) and renders correct diagrams.  
- **Auto-detection** of diagram type, outcomes, and timers works without manual hints.  
- **Business outcomes** are visible as colored chips (Flow nodes) and badges (Sequence terminals) with **legend + counts + filter**.  
- **Nested sequence branches** are supported and counted correctly in the outcome legend.  
- **Outcome normalization** maps semantically similar labels to the same key across Flow and Sequence.  
- Methodology title **“BDD”** remains pinned **top-right** in both views.  
- Round-trip export/import of **normalized Methodology MD** is **idempotent**.  
- Parse warnings never block rendering; fatal errors are reported with the offending line.

---

## Notes / Implementation Hints (Non-binding)

- Use **snap-to-grid** (8px) + **smart guides** for alignment hints.
- Provide **ghost/quick-add** handles on the four cardinal directions of a selected node.
- Keep **edge routing** orthogonal by default with manual bendpoint edits supported.
- Store document in a portable JSON schema: `{ meta, layers[], nodes[], edges[], styles }`.
- Ensure idempotent operations for save/open and stable IDs for nodes/edges for diffing.
