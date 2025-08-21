# DDD — Flowchart: Employee Expense Reimbursement

## Purpose
Define the **domain model and behaviors** for employee expense reimbursement using Domain-Driven Design. This document aligns ubiquitous language, aggregates, commands, events, and invariants, and produces a **flowchart-friendly input** in DDD style.

## Scope
Single company policy, single currency. **Manager approval is mandatory** for valid claims. **SLA escalation at 7 days** without manager action is **part of the domain behavior** (and appears in the diagram).

## Domain Roles (Actors)
- **Employee** — submits claims, provides receipt
- **Manager** — approves or rejects
- **Finance** — schedules payout
- **System Policies** — enforce rules, SLAs, de-duplication

## Ubiquitous Language
- **Claim** — a reimbursement request controlled by domain rules
- **ClaimState** — `Draft`, `PendingApproval`, `NeedsReceipt`, `Rejected`, `Scheduled`
- **LineItem** — a single expense entry with amount + category
- **Receipt** — proof-of-purchase artifact attached to a claim
- **PolicyCategory** — allowed categories under company policy
- **Money** — amount + currency (single currency scope)
- **EmployeeId** — identifier of the submitting employee
- **ReasonCode** — domain-coded reason for rejection (e.g., `OVER_LIMIT`, `PAST_SUBMISSION_WINDOW`, `INVALID_CATEGORY`)
- **PayoutDate** — scheduled business date for payment
- **SLA** — service-level limit for `PendingApproval` (7 days); breach triggers escalation

## Business Policies & Rules
- Receipt required if amount ≥ $50  
- Submit within 60 days of expense date  
- Valid policy category; non-negative totals  
- Over-limit > $200 → **auto-reject** with reason `OVER_LIMIT`  
- **SLA (diagrammed):** claims in `PendingApproval` for **≥ 7 days** escalate to delegate and notify Finance

## Aggregates & Domain Model
**Bounded Context:** `Expenses`

**Aggregate Root:** `Claim`
- **Entities:** `LineItem`, `Receipt`
- **Value Objects:** `Money`, `PolicyCategory`, `EmployeeId`
- **States:** `Draft` → `PendingApproval` → `NeedsReceipt` | `Rejected` | `Scheduled`
- **Invariants:**
  - Receipt required when amount ≥ $50
  - Submission ≤ 60 days from expense date
  - Amount ≥ 0
  - Policy category must be valid

## Preconditions
- Employee exists and is active
- Claim is created as `Draft` with at least one `LineItem`

## Triggers (Commands)
- `SubmitClaim`
- `ProvideReceipt`
- `ApproveClaim`
- `RejectClaim(reasonCode)`
- `SchedulePayment` (policy-driven after approval)

## Expected Outcomes (Business Outcomes)
- **Approved →** `PaymentScheduled` within **≤ 5 business days** (shift if weekend/holiday)
- **Rejected →** reason communicated to employee
- **NeedsReceipt →** employee prompted to attach receipt and resubmit

## Non-Functional Requirements (domain-adjacent qualities)
- Idempotent command handling (de-dup based on natural key: employeeId + date + amount)
- Audit logs & correlation IDs for all state changes
- Accessibility (A11y) for employee interactions

---

## Domain Events
- `ClaimSubmitted(employeeId, total, hasReceipt)`
- `ReceiptProvided(claimId)`
- `ClaimApproved(claimId, managerId)`
- `ClaimRejected(claimId, reasonCode)`
- `PaymentScheduled(claimId, payoutDate)`
- `EscalationTriggered(claimId)` ← **emitted on SLA breach**

## Process Policies (Sagas)
- **Validation Policy:** on `SubmitClaim`, enforce invariants; route to `NeedsReceipt` or `Rejected` or `PendingApproval`.
- **Approval Policy:** in `PendingApproval`, accept `ApproveClaim` or `RejectClaim`.
- **Payment Policy:** on `ClaimApproved`, schedule payout ≤ 5 business days (shift to next business day if weekend/holiday).
- **SLA Policy (diagrammed):** if `PendingApproval` **≥ 7 days** with no decision → emit `EscalationTriggered`, route to delegate, notify Finance.

## Rejections & Edges
- **OVER_LIMIT** (> $200): immediate `ClaimRejected(OVER_LIMIT)`
- **Duplicate SubmitClaim** (same employeeId + date + amount): ignore/merge; retain latest mutation; audit entry recorded
- **Weekend/Holiday payout:** schedule to next business day

## Acceptance Criteria
- Only **Approved** claims can lead to `PaymentScheduled`
- Every `Rejected` outcome includes a reason and employee notification
- `EscalationTriggered` is emitted exactly once per SLA breach and is auditable

---

## Diagram Input — **DDD Flow (Human-Readable)**

**Flow Title:** Expense Reimbursement  
**Methodology:** DDD  
**Diagram Type:** Flowchart  
**Primary Outcomes (states):** `Scheduled`, `Rejected`, `NeedsReceipt`  
**Timers (in diagram):** `PendingApproval SLA = 7 days` → emit `EscalationTriggered`, delegate review, notify Finance

### Domain Flow (Commands → Invariants → Events → State)
**Step 0 — Start (`Draft`)**  
- **Given** a `Claim` in `Draft` with required minimal fields.

**Step 1 — Command: `SubmitClaim`**  
- **Apply Invariants:**  
  - If amount ≥ $50 and no receipt → **State → `NeedsReceipt`**, **Event:** `ClaimSubmitted(hasReceipt=false)`; notify employee. **End**  
  - If amount > $200 → **State → `Rejected`**, **Event:** `ClaimRejected(OVER_LIMIT)`; notify employee. **End**  
  - If submitted > 60 days after expense date → **State → `Rejected`**, **Event:** `ClaimRejected(PAST_SUBMISSION_WINDOW)`; notify employee. **End**  
  - If invalid category or negative amount → **State → `Rejected`**, **Event:** `ClaimRejected(INVALID_INPUT)`; notify employee. **End**  
  - Otherwise **valid** → **State → `PendingApproval`**, **Event:** `ClaimSubmitted(hasReceipt=true)`; **start SLA timer (7 days)**.

**Branch — `NeedsReceipt`**  
- **Command:** `ProvideReceipt` → re-validate invariants.  
- If valid post-receipt → **State → `PendingApproval`**, **Event:** `ReceiptProvided` + (re)confirmation of submission; **start SLA timer**.

**Step 2 — Approval (`PendingApproval`)**  
- **Command:** `ApproveClaim` → **Event:** `ClaimApproved` → **Policy:** schedule payout within ≤ 5 business days (shift if weekend/holiday) → **State → `Scheduled`**, **Event:** `PaymentScheduled(payoutDate)`; notify employee. **End**  
- **Command:** `RejectClaim(reasonCode)` → **State → `Rejected`**, **Event:** `ClaimRejected(reasonCode)`; notify employee. **End**

**SLA Escalation (Timer Policy)**  
- **If** `PendingApproval` **≥ 7 days without decision** → **Event:** `EscalationTriggered` → route to delegate; notify Finance; remain `PendingApproval` until decision.

**De-duplication Guard**  
- **If** duplicate `SubmitClaim` detected (employeeId + date + amount) → ignore/merge; keep latest mutation; write audit event.

### Parser Hints (for the app)
- **“Command:”** lines create action nodes.  
- **“Apply Invariants”** produces validation decision nodes.  
- **“Event:”** lines annotate transitions; **State →** marks the target state node.  
- **“Timer Policy / SLA”** creates a timed branch from `PendingApproval`.  
- **“End”** denotes terminal outcomes.
