# BDD Specification — Diagramming Interface for a Web Application

A minimal, local-first diagramming web app with **auto-rendering workflow**. Focus: **make the canvas feel alive** (move, connect, zoom) and **turn plain Markdown into a rendered flowchart with immediate visual feedback**.

---

## Minimal Canvas 

> **Methodology Header Requirement:** The app must display the current methodology title (e.g., **"BDD"**) **fixed at the top-right** of the canvas viewport at all times.

### Essentials
- **Canvas**: Large finite stage **6000×4000**, white background with **horizontal layout optimization**.
- **Toolbar (left)**: **Select**, **Pan**, **Rectangle**, **Ellipse**, **Diamond**, **Text**, **Line (plain)**, **Connector (arrow)**, **Start**, **End**, **Render Diagram**.
- **Panels**:
  - **Preview panel (right)**: shows parsed summary (nodes/edges), and Mermaid preview when available.
  - **Document Switcher (top-left)**: open files list with methodology badge.
- **Actions (top)**: **Import (.md)**, **Export**, **Undo**, **Redo**, **Delete**.
- **HUD (top-right)**: Methodology tag (e.g., **BDD**).

### Defaults (bigger, readable)
- **Rect** 200×120 (r12) · **Ellipse** 200×130 · **Diamond** 180×180 · **Text** 18px  
- **Stroke** 3px `#111827` · **Fill** `#FFFFFF` · **Selection** `#3B82F6` (3px outline)  
- **Anchors**: N, E, S, W (4 anchors)  
- **Connector**: solid, arrowhead size 10, snap radius 12px with **label support**
- **Line (plain)**: 3px stroke, round caps, draggable endpoints (no auto-attach)

### Interactions (must work)
- **Move**: drag to reposition.  **Resize**: drag corner; **Shift** keeps aspect.  
- **Connect**: Connector tool → drag from anchor→anchor; stays attached on move.  
- **Line**: drag to draw; endpoints draggable; whole line movable.  
- **Pan**: **Space+drag** or middle-mouse.  **Zoom**: **Ctrl+wheel** (50–300%), centered under cursor.  
- **Select**: click, **Shift+click**, **marquee**.  **Delete**: removes shape + attached connectors.  
- **Text edit**: double-click → inline edit → **Enter** save / **Esc** cancel.

## Canvas Implementation — Sequence Shapes and Annotations

### Sequence Shape Classes
- **ParticipantShape**: Rectangle with centered text, 118×40px
- **LifelineShape**: Vertical line extending 500px with connection anchors
- **MessageShape**: Arrow with label, positioned chronologically
- **AnnotationShape**: Rounded rectangle for timers and notes

### Drawing Methods
- **drawParticipant**: Renders participant box with proper styling
- **drawLifeline**: Creates vertical line with anchor points
- **drawMessage**: Draws arrow with label positioning
- **drawAnnotation**: Creates annotation box with dashed connections

### Sequence Element Interactions
- **Participant selection**: Click to select, drag to reposition
- **Message editing**: Double-click to edit message text
- **Lifeline extension**: Automatic height adjustment based on message count
- **Annotation attachment**: Connect annotations to specific messages or participants

## Feature: Properties Panel — Right-Side Element Management

### Panel Structure
- **Location**: Fixed right-side panel, 300px width
- **Sections**: Selection Info, Element Properties, Bulk Actions
- **Visibility**: Always visible, content changes based on selection

### Bulk Actions
- **Select All**: Button to select all elements on canvas
- **Duplicate**: Clone selected elements with 20px offset
- **Delete**: Remove selected elements and their connections
- **Clear Selection**: Deselect all elements

### Selection-Based Content
- **No selection**: Shows canvas statistics (element count, connection count)
- **Single selection**: Shows element properties (type, label, position, styling)
- **Multi-selection**: Shows bulk action controls and selection count

### Implementation Details
- **Select All**: `Ctrl+A` shortcut + button in properties panel
- **Duplicate**: `Ctrl+D` shortcut + button, creates copies with incremented labels
- **Delete**: `Delete` key + button, removes elements and updates connections
- **Selection feedback**: Visual indicators show selected count and types

## Feature: Properties Panel — Shape Style and Layer Management

### Panel Structure
- **Location**: Right-side panel, collapsible with "Properties" header
- **Tabs**: Style tab (styling controls) and Content tab (text editing)
- **Width**: 280px fixed width with responsive controls

### Style Tab Controls
- **Fill Color**: Color picker with hex/RGB support and color swatches
- **Border Color**: Color picker matching fill color functionality  
- **Border Width**: Slider control (1px-10px) with live preview
- **Opacity**: Slider control (0%-100%) with percentage display
- **Real-time preview**: Changes apply immediately to selected shapes

### Action Buttons
- **Delete**: Red button, removes selected shapes and connections
- **Duplicate**: Creates copy with 20px offset, increments labels
- **Bring to Front**: Moves shape to top layer (highest z-index)
- **Send to Back**: Moves shape to bottom layer (lowest z-index)

### Content Tab (when applicable)
- **Text editing**: Direct text input for shape labels
- **Font controls**: Size, weight, alignment options
- **Text color**: Separate color picker for text content



### Minimal Shortcuts
**Ctrl+Z / Ctrl+Y** Undo/Redo · **Delete** Remove · **Space+Drag** Pan · **Ctrl+Wheel** Zoom · **Shift+Resize** Keep aspect

## Feature: Save/Load System — Persistent Diagram Storage

### Save Functionality
- **Manual Save**: Save button stores current canvas state
- **Auto-save**: Periodic saving every 30 seconds when changes detected
- **Save Formats**: JSON format with metadata (title, methodology, elements)
- **Save Location**: Browser localStorage with export option

### New Diagram Creation
- **New Button**: Clears canvas and creates blank workspace
- **Confirmation**: Prompts to save unsaved changes before clearing
- **Reset State**: Clears all elements, connections, and metadata

## Feature: Enhanced Zoom Controls — Detailed Implementation

### Zoom Specifications  
- **Zoom Range**: 25% to 400% in 25% increments
- **Zoom to Cursor**: Centers zoom operation under mouse cursor
- **Keyboard Shortcuts**: Ctrl+Plus, Ctrl+Minus, Ctrl+0 (reset)
- **Fit Button**: Auto-calculates optimal zoom and center position

---

## Auto-Rendering Workflow — Immediate Visual Feedback

### Core Auto-Rendering Features
- **Automatic rendering**: Diagrams render immediately after successful import without manual "Render" button clicks.
- **Loading indicators**: Visual feedback during import and rendering process.
- **Success notifications**: Shows element count and confirmation after auto-rendering.
- **Fit-to-screen**: Automatically centers and scales imported diagrams for optimal viewing.
- **Error handling**: Clear feedback for parsing failures with canvas preservation.

### Auto-Rendering Implementation
When you import a markdown file, the application automatically performs these steps in sequence:

1. **Display loading message**: Shows "Importing and auto-rendering diagram..." to keep you informed.  
2. **Process the file content**: Reads and interprets the markdown structure and converts it to diagram elements.  
3. **Place elements on canvas**: Positions all shapes and connections according to the horizontal layout rules.  
4. **Render immediately**: Draws the complete diagram on the canvas without waiting for you to click anything.  
5. **Fit to screen**: Automatically adjusts zoom and position so you can see the entire diagram clearly.  
6. **Show confirmation**: Displays a success message telling you exactly how many elements and connections were created.

This entire process happens automatically in one smooth workflow, eliminating the need to manually click "Render" after importing.

---

## Horizontal Layout System — Left-to-Right Flow

### Layout Specifications
- **Primary direction**: Left-to-Right (LR) for all flowcharts.
- **Coordinate system**: Elements positioned with horizontal progression.
- **Spacing**: Minimum 50px horizontal spacing between elements.
- **Vertical alignment**: Decision branches use Y-offset positioning.
- **Mermaid export**: All flowcharts use `flowchart LR` syntax.

# BDD — Feature: Horizontal Coordinate Mapping (Left→Right flow with vertical branches)

Background:
  Given the diagram uses a horizontal layout (Left→Right)
  And the main flow baseline Y is 200
  And coordinates are absolute pixels from the top-left of the canvas

@mainlane
Scenario Outline: Place core flow elements left-to-right on the main lane
  Given a <element> to place on the flow
  When the layout engine assigns coordinates
  Then x = <x> and y = 200
  And width = <w> and height = <h>
  And elements appear left-to-right in the order Start → Submit → Validate

  Examples:
    | element  | x   | w   | h  |
    | Start    | 50  | 120 | 60 |
    | Submit   | 220 | 140 | 60 |
    | Validate | 410 | 140 | 60 |

@decision
Scenario: Position the decision node slightly above the main lane
  Given a Decision element follows Validate
  When the layout engine assigns coordinates
  Then x = 600 and y = 180
  And width = 140 and height = 80
  And the decision visually precedes the branch split

@branches
Scenario: Route Yes/No outcomes using vertical offsets from the decision
  Given a branch anchor X of 800 for the decision outcomes
  When mapping branch targets
  Then the **Yes** target is at (x=800, y=100)  # upper branch
  And the **No** target is at (x=800, y=280)   # lower branch

@acceptance
Scenario: Visual and semantic guarantees
  Given the elements and branches are positioned
  Then the main flow reads left→right along Y=200 without overlap
  And the decision sits 20px above the main lane (y=180) with height 80
  And “Yes” edges connect to the upper target at (800, 100)
  And “No” edges connect to the lower target at (800, 280)

### Benefits of Horizontal Layout
- **Natural reading flow**: Left-to-right matches reading patterns.
- **Better screen utilization**: Wider screens accommodate longer processes.
- **Clearer decision branches**: Vertical separation for Yes/No paths.
- **Improved scalability**: Easier to extend processes horizontally.

---

## Import & Render — Markdown with Auto-Processing

### Supported input (any one of these works)
1) **Full MD with Mermaid** (has a ```mermaid``` block).  
2) **Business MD without Mermaid** (e.g., "Employee Expense Reimbursement") that contains:
   - A heading with **Methodology** and **Diagram Type**  
   - A **Behavior/Flow** section OR Gherkin **Scenarios**  
   - Optional **Parser Hints**
3) **Sequence Diagrams** with participant and message definitions

### Parser rules (plain MD → internal graph)
- Lines starting with **"Step X — Title"** → **node** labeled *Title*.  
- Sections named **Branch …** or **Decision …** → **diamond node**.  
- **"When … Then …"** pairs → **directed edge** from the current step to the next described action/step.  
- **"Outcome → NAME"** → **terminal node** (End state).  
- **SLA/Escalation** notes attach metadata to the **current node**.  
- **Decision branches** automatically get **Yes/No labels** on connections.  
- If both **Mermaid** and **plain flow** exist: **Mermaid wins** by default; user can switch to **Rebuild from Flow**.

### Sequence Diagram Parsing
- **Participants**: Extracted from `participants:` section in Diagram Input.  
- **Messages**: Parsed from `messages:` section with format `- From -> To: Message`.  
- **Lifelines**: Automatically generated for each participant.  
- **Message arrows**: Positioned based on participant order and message sequence.

---

## Feature: Import Business Input File with Auto-Rendering

**Scenario: Import a plain Markdown file with immediate rendering**  
Given an empty canvas  
And I have a `.md` file without a Mermaid block (e.g., *Employee Expense Reimbursement*)  
When I click **Import (.md)** and select the file  
Then the app parses Methodology, Diagram Type, and Flow/Scenarios  
And shows a **Preview panel** with the detected nodes/edges count  
And **automatically renders the diagram immediately** on the canvas without manual intervention  
And displays a **loading indicator** with message "Importing and auto-rendering diagram..."  
And **fits the diagram to screen** for optimal viewing with horizontal layout  
And shows a **success notification** with exact element count: "Diagram auto-rendered successfully - X elements, Y connections"  
And the **Render Diagram button becomes optional** for re-rendering only

**Scenario: Import a Markdown file that already has Mermaid with auto-rendering**  
Given a `.md` with a Mermaid block  
When I import it  
Then the diagram **renders immediately** on the **canvas (center area)** with horizontal layout  
And the **Preview panel** shows the Mermaid source (read-only)  
And the Document Switcher lists the file with a methodology badge  
And **auto-fit to screen** centers the imported content

**Scenario: Import sequence diagram with auto-rendering**  
Given a `.md` file with sequence diagram structure  
When I import it  
Then participants are **automatically positioned horizontally** with 150px spacing  
And lifelines are **generated vertically** for each participant  
And messages are **positioned chronologically** from top to bottom  
And the diagram **auto-renders immediately** with proper sequence layout

**Scenario: Invalid or missing sections**  
Given I import a `.md` without any Flow/Scenarios and without Mermaid  
When the app validates the file  
Then it shows **"File missing diagram content"**  
And the canvas remains unchanged  
And **no auto-rendering occurs**

**Scenario: Header consistency with auto-update**  
Given the header shows "BDD"  
When I import a file with Methodology "DDD"  
Then the header **automatically updates** to "DDD"  
And the diagram **auto-renders** with the new methodology context

**Scenario: Auto-rendering failure handling**  
Given I import a `.md` with parsing errors  
When the auto-rendering process encounters issues  
Then the **loading indicator disappears**  
And an **error message** specifies the parsing problem  
And the **canvas remains unchanged** (no corruption)  
And I can **retry with corrected input**

---

## Feature: Enhanced Export System — Multiple Formats with Diagram Type Detection

> The **Export** button opens a menu with **five options**:  
> **Export → Mermaid (.md)** · **Human-readable (.md)** · **PNG (image)** · **SVG (vector)** · **JSON (data)**

**Scenario: Export as Mermaid (.md) with horizontal layout**  
Given a diagram is visible on the canvas  
When I choose **Export → Mermaid (.md)**  
Then the app generates a Markdown file that contains:  
- **Front-matter**: Methodology, Diagram Type, Title  
- A single ```mermaid``` **Diagram Input** block with **`flowchart LR`** (horizontal layout)  
- **Yes/No labels** on decision branch connections: `D -->|Yes| H` and `D -->|No| E`  
- **Comment headers** with flow title and primary outcomes  
And the file downloads as `title-kebab-case-mermaid.md`

**Scenario: Export as Human-readable (.md) with diagram type detection**  
Given a **flowchart** diagram is visible  
When I choose **Export → Human-readable (.md)**  
Then the app **detects diagram type** and generates:  
- **Front-matter**: Methodology, Diagram Type, Title  
- **Behavior Flow section** with step-by-step breakdown  
- **Decision points** with branching logic  
- **Outcomes section** listing all terminal states  
And the file downloads as `title-kebab-case-readable.md`

**Scenario: Export sequence diagram as Human-readable (.md)**  
Given a **sequence** diagram is visible  
When I choose **Export → Human-readable (.md)**  
Then the app generates **sequence-specific documentation**:  
- **Participants section**: Lists all actors with descriptions  
- **Message Flow section**: Step-by-step message exchanges with Given/When/Then format  
- **Interaction Summary**: Overview of participant interactions  
- **Business Rules**: Process validation and requirements  
And the content reflects the **actual sequence structure** from the canvas

**Scenario: Export as PNG with proper framing**  
Given a diagram is visible  
When I choose **Export → PNG (image)**  
Then the app exports a PNG of the **current canvas content** with:  
- **Automatic bounds calculation** around all elements  
- **50px padding** around the diagram  
- **Configurable scale** (1x, 2x, 3x) for resolution  
- **Background options** (white, transparent)  
- **Proper element and connection rendering** matching canvas display

**Scenario: Export as SVG (vector graphics)**  
Given a diagram is visible  
When I choose **Export → SVG (vector)**  
Then the app generates **scalable vector graphics** with:  
- **XML-compliant SVG structure** with proper namespaces  
- **Vector shapes** for all elements (rectangles, diamonds, circles)  
- **Vector paths** for all connections with arrow heads  
- **Text elements** with proper positioning and styling  
- **Infinite scalability** without quality loss

**Scenario: Export reflects current canvas state (round-trip)**  
Given I imported a plain `.md` (no Mermaid), auto-rendered it, and made manual edits  
When I **Export → Mermaid (.md)**  
Then the Mermaid generated **represents the current canvas state** including manual modifications  
And re-importing that exported file **recreates the exact same diagram** with horizontal layout  
And **Yes/No labels** are preserved on decision branches

**Scenario: Export menu availability**  
Given the canvas is empty  
When I open **Export**  
Then options are disabled and a tooltip reads **"Render or draw a diagram first"**  
Given a diagram exists on canvas  
When I open **Export**  
Then all format options are **enabled and functional**

---

## Feature: Decision Branch Labeling — Yes/No Path Clarity

### Label Implementation
- **Automatic labeling**: Decision branches get Yes/No labels based on the flow logic.
- **Visual display**: Labels appear at the middle of connection lines using clear, readable text.
- **Export preservation**: Labels are maintained in both Mermaid and human-readable exports.
- **Smart labeling**: The system automatically determines which path should be labeled "Yes" and which should be "No".

### Label Specifications
When you have decision points in your diagram, the connections automatically get labeled:

- **Yes path**: The approval or positive outcome route gets a "Yes" label.
- **No path**: The rejection or negative outcome route gets a "No" label.
- **Nested decisions**: Multiple decision points each get their own Yes/No labels.
- **Visual clarity**: Labels help users understand which path represents which decision outcome.

For example, in an expense reimbursement process:
- "Validation Passed?" → "Yes" leads to Manager Review  
- "Validation Passed?" → "No" leads to Receipt Decision  
- "Missing Receipt?" → "Yes" leads to Needs Receipt outcome  
- "Missing Receipt?" → "No" leads to Rejected outcome

**Scenario: Decision branch auto-labeling**  
Given a flowchart with decision nodes  
When the diagram is rendered  
Then **Yes/No labels** appear automatically on decision branch connections  
And labels are **positioned at connection midpoints**  
And labels use **consistent styling** (12px Arial, #333333 color)

**Scenario: Label preservation in exports**  
Given a diagram with labeled decision branches  
When I export as **Mermaid (.md)**  
Then the exported mermaid includes **`|Yes|` and `|No|` syntax** on appropriate connections  
When I export as **Human-readable (.md)**  
Then the documentation **describes the decision logic** with clear branching explanations

---

## Feature: Sequence Diagram Support — Full Implementation

### Sequence Diagram Capabilities
- **Participant management**: Automatic participant extraction and positioning.
- **Lifeline generation**: Vertical lifelines for each participant with multiple connection points.
- **Message flow**: Chronological message positioning with proper arrow directions.
- **Export formats**: Both Mermaid sequence syntax and rich human-readable documentation.

### Sequence Layout System
# BDD — Feature: Sequence Layout System (Participants, Lifelines, Messages)

Background:
  Given a sequence diagram canvas
  And participants are indexed from 0 as participantIndex
  And messages are ordered by messageIndex starting at 0

@participants
Scenario Outline: Position participants left-to-right with even spacing
  Given a participant with participantIndex = <idx>
  When the layout is computed
  Then participantX equals 100 plus (participantIndex × 150)
  And participantY equals 50
  And participants appear left-to-right in index order without overlap

  Examples:
    | idx | participantX | participantY |
    |-----|--------------|--------------|
    | 0   | 100          | 50           |
    | 1   | 250          | 50           |
    | 2   | 400          | 50           |

@lifelines
Scenario Outline: Center each lifeline under its participant and extend downward
  Given a participant positioned at (participantX, 50)
  When the lifeline is drawn
  Then lifelineX equals participantX plus 59   # centered beneath participant label
  And lifelineY equals 90                      # lifeline starts below the header
  And lifelineHeight equals 500                # fixed vertical extent

  Examples:
    | participantX | lifelineX | lifelineY | lifelineHeight |
    |--------------|-----------|-----------|----------------|
    | 100          | 159       | 90        | 500            |
    | 250          | 309       | 90        | 500            |

@messages
Scenario Outline: Place messages top-to-bottom in chronological order
  Given a message with messageIndex = <midx>
  When the message position is computed
  Then messageY equals 150 plus (messageIndex × 45)
  And later messages appear strictly below earlier ones

  Examples:
    | midx | messageY |
    |------|----------|
    | 0    | 150      |
    | 1    | 195      |
    | 5    | 375      |

@acceptance
Scenario: Visual consistency and ordering guarantees
  Given participants, lifelines, and messages are laid out
  Then participants are evenly spaced with a 100px left margin and a 150px step
  And each lifeline is centered under its participant (offset +59), begins at Y=90, and has height 500
  And messages stack from Y=150 downward in 45px increments following chronological order

**Scenario: Import sequence diagram with auto-rendering**  
Given a `.md` file with sequence diagram structure containing participants and messages  
When I import the file  
Then participants are **positioned horizontally** with 150px spacing  
And **lifelines are generated automatically** extending 500px vertically  
And messages are **positioned chronologically** from top to bottom  
And the diagram **auto-renders immediately** without manual intervention  
And **fit-to-screen** optimizes the sequence view

**Scenario: Sequence diagram export as Mermaid**  
Given a sequence diagram on canvas  
When I export as **Mermaid (.md)**  
Then the output uses **`sequenceDiagram`** syntax  
And includes **participant declarations**: `participant A as Customer UI`  
And includes **message arrows**: `A->>B: POST /checkout(...)`  
And preserves **message order** and **participant relationships**

**Scenario: Sequence diagram export as Human-readable**  
Given a sequence diagram on canvas  
When I export as **Human-readable (.md)**  
Then the output includes:  
- **Participants section**: Lists all actors with descriptions  
- **Message Flow section**: Step-by-step exchanges with Given/When/Then format  
- **Interaction Summary**: Overview of the communication pattern  
- **Business Rules**: Process validation and interaction requirements

---

## Feature: Render Diagram (manual override and re-rendering)

**Scenario: Manual re-render of existing diagram**  
Given a diagram is already on the canvas  
When I click **Render Diagram**  
Then the app **re-renders the current elements** with updated positioning  
And shows **success notification**: "Diagram re-rendered - X elements"  
And **auto-fits to screen** with current zoom preserved

**Scenario: Rebuild from Flow (override Mermaid)**  
Given a file contains both Mermaid and Flow text  
When I choose **Rebuild from Flow**  
Then the app ignores the Mermaid block  
And constructs the diagram from the Flow text with **horizontal layout**  
And **auto-renders immediately** with the new structure

**Scenario: Render with no data**  
Given the canvas is empty and no pending import exists  
When I click **Render Diagram**  
Then I see **"No data to render. Please import markdown first using the Import MD button."**  
And the canvas remains unchanged

---

## Feature: Display Rendered Diagram with Horizontal Optimization

**Scenario: Canvas placement with horizontal layout**  
Given a diagram is rendered with horizontal flow  
When the render completes  
Then the diagram is **centered on the main canvas** with left-to-right orientation  
And a **breadcrumbs bar** above the canvas shows *File Title • Methodology • Diagram Type*  
And **zoom controls** (±, 100%, Fit) are visible and functional  
And **horizontal scrolling** is available for wide diagrams

**Scenario: Fit and zoom behavior for horizontal layouts**  
Given a wide horizontal diagram  
When auto-rendering finishes  
Then the view sets to **Fit to Screen** with proper aspect ratio  
And the user can zoom between **50–300%** while maintaining center focus  
And **horizontal panning** works smoothly for navigation

**Scenario: Decision branch visualization**  
Given a flowchart with decision nodes  
When the diagram renders  
Then decision branches are **clearly separated vertically**  
And **Yes/No labels** are visible at connection midpoints  
And **branch paths** are visually distinct with proper spacing

---

## Feature: Enhanced Export System — Format-Specific Generation

### Export Format Specifications

#### Mermaid Export (.md)

**File envelope**
- **Front-matter** (YAML) at top of file:
  - `title` (string), `methodology` (“BDD”/“DDD”), `diagram_type` (“flowchart”/“sequence”)
  - `flow_direction` (one of `LR`, `TD`, `RL`, `BT`) — resolved by **UI > metadata > default (LR)**
  - `version` (int, incremented), `generated_at` (ISO 8601)
- One fenced ```mermaid``` block containing the diagram.
- No other code blocks in the file.

**Header + comments**
- First line of the mermaid block is `flowchart ${direction}` (e.g., `flowchart LR`).
- Insert comments for traceability:
  - `%% Flow Title: …`
  - `%% Primary Outcomes: …`
  - `%% Timers: …`
  - `%% Direction Source: UI | metadata | default`

# BDD — Feature: Node & Edge Generation Rules (Mermaid Flowchart Export)

Background:
  Given the exporter is generating a Mermaid flowchart
  And the flow direction has been resolved (e.g., LR)
  And nodes and edges have been parsed from the input document

@ids
Scenario Outline: Generate stable node IDs from labels and resolve collisions
  Given a node label "<label>"
  When the exporter generates the node ID
  Then the ID equals the label with all non-alphanumeric characters removed, truncated to 12 characters
  And if that ID is already used, the exporter appends a numeric suffix "-<n>" starting from 2

  Examples:
    | label                         | first_id       | second_id      |
    | "Submit Claim"                | SubmitClaim    | SubmitClaim-2  |
    | "Validate: Amount ≥ $50"      | ValidateAmoun  | ValidateAmoun-2|
    | "Manager Review (SLA 7d)"     | ManagerReview  | ManagerReview-2|

@shapes
Scenario Outline: Map node types to Mermaid shapes
  Given a node of type "<type>" with label "<text>"
  When the exporter renders the node
  Then the Mermaid shape is "<shape>"

  Examples:
    | type        | text                 | shape                          |
    | Start       | Start                | ([Start])                      |
    | End         | End                  | ([End])                        |
    | Process     | Validate Claim       | [Validate Claim]               |
    | Decision    | Approved?            | {Approved?}                    |
    | Timer       | Timer: 7 days        | (["Timer: 7 days"])            |
    | Annotation  | Escalate to delegate | (["Escalate to delegate"])     |
    | Outcome     | Paid (Scheduled)     | [["Outcome: Paid (Scheduled)"]]| 

@labels_binary
Scenario: Label binary decision edges as Yes/No
  Given a decision node with two branches
  When the exporter emits edges
  Then the affirmative branch label is "Yes"
  And the negative branch label is "No"

@labels_wrap
Scenario Outline: Wrap long labels with <br/> for readability
  Given a node label "<longLabel>"
  When the label exceeds the configured width
  Then the exporter inserts "<br/>" at natural breakpoints to prevent overflow

  Examples:
    | longLabel                                          |
    | "Validate Claim (amount, date, category, totals)"  |
    | "Schedule Payment &lt;= 5 business days (shift if weekend/holiday)" |

@labels_escape
Scenario Outline: Escape special characters for Mermaid compatibility
  Given a label containing "<raw>"
  When rendering the label
  Then the exporter outputs "<escaped>"

  Examples:
    | raw                           | escaped                          |
    | "<= 5 business days"          | "&lt;= 5 business days"          |
    | "Amount ≥ 50"                 | "Amount ≥ 50"                    |
    | "x < y and y > z"             | "x &lt; y and y > z"             |

@outcomes_singleton
Scenario Outline: Create each outcome node once and reuse it
  Given an outcome named "<name>"
  And multiple branches point to that outcome
  When the exporter generates nodes
  Then only a single outcome node is created for "<name>"
  And all branches link to that outcome

  Examples:
    | name             |
    | Paid (Scheduled) |
    | Rejected         |
    | Needs Receipt    |

@outcomes_classes
Scenario Outline: Apply visual classes to outcome nodes
  Given an outcome named "<name>"
  When rendering the node
  Then the node receives the class "<class>"

  Examples:
    | name             | class    |
    | Paid (Scheduled) | success  |
    | Rejected         | failure  |
    | Needs Receipt    | neutral  |

@styling_defs
Scenario: Emit class definitions once per diagram
  Given the diagram includes outcomes with classes success, failure, and neutral
  When writing the Mermaid block
  Then the exporter emits class definitions:
    | class   | style                                                                |
    | success | fill:#e6ffe6,stroke:#0a0,stroke-width:1px,color:#073                 |
    | failure | fill:#ffe6e6,stroke:#a00,stroke-width:1px,color:#722                 |
    | neutral | fill:#eef3ff,stroke:#3357ff,stroke-width:1px,color:#244              |

@timers
Scenario: Represent timers as non-blocking annotations
  Given a timer associated with a node (e.g., Manager Review)
  When exporting
  Then the timer is rendered as an annotation node (["…"])
  And the anchor node connects to the timer with a dashed edge
  And the timer connects to an escalation node which loops back to the anchor

@acceptance
Scenario: Export integrity for nodes and edges
  Given the exporter has generated all nodes and edges
  Then every node has a unique ID (after collision suffixing)
  And decision edges are labeled per the Yes/No rule
  And long labels are wrapped safely with "<br/>"
  And special characters are escaped as specified
  And outcome nodes are singletons with the correct visual classes

- **SLA / timers**:
  - Non-blocking link from anchor node with dashed edge (`---`).
  - Timer node forwards to an Escalation node, which loops back to the anchor.

**Styling block**
- Emit class definitions once at the bottom (or top) of the block:
  - `success`: `fill:#e6ffe6,stroke:#0a0,stroke-width:1px,color:#073`
  - `failure`: `fill:#ffe6e6,stroke:#a00,stroke-width:1px,color:#722`
  - `neutral`: `fill:#eef3ff,stroke:#3357ff,stroke-width:1px,color:#244`

**Example (expanded, horizontal)**
```mermaid
flowchart LR
  %% Flow Title: Employee Expense Reimbursement
  %% Primary Outcomes: Paid (Scheduled), Rejected, Needs Receipt
  %% Timers: Manager Review SLA = 7 days (escalate to delegate; notify Finance)
  %% Direction Source: default

  %% Core nodes
  A([Start])
  B[Submit Claim]
  DUP{Duplicate submission?}
  MERGE[De-duplicate<br/>Keep latest<br/>Re-validate]
  C[Validate Claim<br/>(amount, date, category, totals)]
  D1{Missing receipt?<br/>amount ≥ 50 AND no receipt}
  D2{Other validation failures?<br/>(over limit > 200,<br/>invalid category,<br/>negative total,<br/>late submission > 60d)}
  H[Manager Review]
  I{Approved?}
  P[Schedule Payment<br/>&lt;= 5 business days<br/>(shift if weekend/holiday)]
  SLA(["Timer: 7 days<br/>no manager action"])
  ESC[Escalate to delegate<br/>Notify Finance]

  %% Outcomes (singletons)
  OUT_NEEDS[["Outcome: Needs Receipt"]]
  OUT_REJ[["Outcome: Rejected"]]
  OUT_PAID[["Outcome: Paid (Scheduled)"]]

  %% Flow (LR)
  A --> B
  B --> DUP
  DUP -- Yes --> MERGE --> C
  DUP -- No --> C

  C --> D1
  D1 -- Yes --> OUT_NEEDS:::neutral
  D1 -- No --> D2
  D2 -- Yes --> OUT_REJ:::failure
  D2 -- No --> H

  H --> I
  I -- Yes --> P --> OUT_PAID:::success
  I -- No --> OUT_REJ:::failure

  %% SLA branch (non-blocking)
  H --- SLA
  SLA --> ESC --> H

  %% Styling
  classDef success fill:#e6ffe6,stroke:#0a0,stroke-width:1px,color:#073;
  classDef failure fill:#ffe6e6,stroke:#a00,stroke-width:1px,color:#722;
  classDef neutral fill:#eef3ff,stroke:#3357ff,stroke-width:1px,color:#244;
  ```


#### Human-Readable Export (.md)
- **Flowchart format**: Step-by-step breakdown with Given/When/Then structure.
- **Sequence format**: Participant interactions with message flow documentation.
- **Decision documentation**: Clear explanation of branching logic.
- **Outcome mapping**: Terminal states with business context.
- **Parity**: Mirrors the **current canvas state** (round-trip safe).

#### Image Export (PNG/SVG)
- **Bounds calculation**: Automatic sizing around all elements with **≥ 50px** padding (minimum).
- **Scale options**: 1×, 2×, 3× (1× ≈ canvas pixels at ~96 DPI).
- **Background options**: White or transparent (PNG supports transparency).
- **Vector precision (SVG)**: Infinite scalability; text remains `<text>` with proper positioning; arrowheads are vector paths.
- **Label fidelity**: **Yes/No branch labels** and other edge labels render in both PNG and SVG.


**Scenario: Export format detection and generation**  
Given a **flowchart** diagram on canvas  
When I export in any format  
Then the system **detects diagram type** automatically  
And generates **format-appropriate content** (flowchart vs sequence)  
And preserves **horizontal layout** in Mermaid exports  
And includes **Yes/No labels** in connection syntax

**Scenario: Sequence export with rich documentation**  
Given a **sequence** diagram on canvas  
When I export as **Human-readable (.md)**  
Then the output includes:  
- **Participants section**: Lists all actors with descriptions  
- **Message Flow section**: `**Step 1**: Customer UI → Web App` with Given/When/Then format  
- **Interaction Summary**: Process overview with participant count and message count  
- **Business Rules**: Process validation and constraints  
And arrow semantics in documentation reflect the diagram (e.g., async `->>` vs sync `->`)

---

## Feature: Connection Management with Labeling

### Connection Types and Labels
- **Standard connections**: Unlabeled arrows for sequential flow.
- **Decision connections**: Labeled with Yes/No for branching logic.
- **Message connections**: Labeled with message content for sequences.
- **Timer connections**: Dashed lines for SLA escalations.

### Connection Implementation
The application creates different types of connections based on the diagram flow:

- **Standard connections**: Simple arrows that connect one step to the next in sequence.
- **Labeled connections**: Decision branch arrows that display "Yes" or "No" to show which path represents which choice.
- **Connection positioning**: Labels appear at the middle point of each connection line for clear visibility.
- **Automatic detection**: The system determines when labels are needed based on whether the connection comes from a decision point.

**Scenario: Automatic decision branch labeling**  
Given a decision node with multiple outgoing connections  
When the diagram renders  
Then **approval paths** get **"Yes"** labels automatically  
And **rejection paths** get **"No"** labels automatically  
And labels are **positioned at connection midpoints**  
And labels use **consistent styling** across all connections


---

## Feature: UI Header with Dynamic Updates

**Scenario: Display methodology with auto-updates**  
Given I am viewing the application  
When the methodology is **BDD**  
Then the title **BDD** appears at the top-right, clearly styled  
When I import a file with different methodology (e.g., **DDD**)  
Then the header **automatically updates** to show **DDD**  
And the change is **immediate** without page refresh

**Scenario: Persist header during operations**  
Given a file is open with auto-rendered diagram  
When I zoom, pan, edit, or export  
Then the header remains visible and shows **current methodology**  
And header updates reflect **active document context**

---

## Feature: Error Handling & Edge Cases with Auto-Rendering

**Scenario: Auto-rendering with large datasets**  
Given a file that would create > 100 elements  
When I import it  
Then a **progress indicator** shows during auto-rendering  
And the app remains **responsive** throughout the process  
And **auto-fit to screen** handles large diagrams appropriately

**Scenario: Import with conflicting sections and auto-processing**  
Given a file has Mermaid and Flow that disagree  
When I import it  
Then the app **auto-renders from Mermaid** by default  
And shows a **"Sections out of sync"** notice  
And provides **Rebuild from Flow** action for alternative rendering  
And **both options auto-render** when selected

**Scenario: Auto-rendering failure recovery**  
Given an import that fails during auto-rendering  
When the parsing encounters errors  
Then the **loading indicator disappears immediately**  
And a **specific error message** explains the failure  
And the **canvas state is preserved** (no corruption)  
And I can **import different content** without restart

---

## Technical Implementation Details

### Auto-Rendering Pipeline
1. **File validation**: Check for required sections and format
2. **Metadata extraction**: Parse methodology, diagram type, and title
3. **Content parsing**: Extract elements and connections based on type
4. **Element positioning**: Apply horizontal layout with proper spacing
5. **Connection labeling**: Add Yes/No labels to decision branches
6. **Immediate rendering**: Render to canvas without manual intervention
7. **Auto-fit display**: Center and scale for optimal viewing
8. **Success feedback**: Show notification with element counts

### Horizontal Layout Coordinate System
- **X-axis progression**: Elements advance left-to-right with 170-190px spacing
- **Y-axis branching**: Decision outcomes use vertical offset (±100px from main flow)
- **Connection anchors**: 4-point system (N, E, S, W) for flexible connections
- **Fit-to-screen**: Automatic bounds calculation with 50px padding

### Export Generation Logic
- **Diagram type detection**: Automatic identification of flowchart vs sequence
- **Format-specific generation**: Separate functions for each export type
- **Content preservation**: Round-trip compatibility for all formats
- **Label inclusion**: Yes/No labels preserved in Mermaid syntax

---

## Acceptance Criteria — Complete Feature Coverage
- ✅ **Auto-rendering**: Imports trigger immediate diagram rendering without manual steps
- ✅ **Horizontal layout**: All flowcharts use left-to-right orientation with proper spacing
- ✅ **Decision labeling**: Yes/No labels appear automatically on decision branches
- ✅ **Sequence support**: Full sequence diagram parsing, rendering, and export
- ✅ **Enhanced exports**: Five format options with diagram-type-specific generation
- ✅ **Loading feedback**: Visual indicators during import and rendering operations
- ✅ **Success notifications**: Element count confirmation after operations
- ✅ **Error handling**: Graceful failure with specific error messages
- ✅ **Round-trip compatibility**: Exported files re-import to identical diagrams
- ✅ **Fit-to-screen**: Automatic centering and scaling for optimal viewing

---

# Further example to reinforce learning 

## Example — Generated Mermaid with Horizontal Layout and Labels
```mermaid
flowchart LR
  %% Flow Title: Employee Expense Reimbursement
  %% Primary Outcomes: Paid (Scheduled), Rejected, Needs Receipt

  A([Start]) --> B[Submit Claim]
  B --> C[Validate Claim]
  C --> D{Validation Passed?}
  
  D -->|No| E{Missing Receipt & Amount ≥ $50?}
  E -->|Yes| F([Needs Receipt])
  E -->|No| G([Rejected])
  
  D -->|Yes| H[Manager Review]
  H --> I{Approved?}
  I -->|Yes| J[Schedule Payment ≤ 5 business days]
  I -->|No| G
  J --> Z([Paid (Scheduled)])
```

---

## Example — Sequence Diagram Export Structure
```mermaid
sequenceDiagram
  %% Flow Title: E-commerce Checkout Process
  %% Primary Outcomes: Order Confirmed, Payment Failed

  participant UI as Customer UI
  participant App as Web App
  participant Pay as Payment Service
  participant Inv as Inventory Service

  UI->>App: POST /checkout(items, payment)
  App->>Inv: GET /inventory/check(items)
  Inv-->>App: availability_status
  App->>Pay: POST /process_payment(amount, method)
  Pay-->>App: payment_result
  App-->>UI: checkout_response
```
