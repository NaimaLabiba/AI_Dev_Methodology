# SDD — Flowchart: Employee Expense Reimbursement

## Purpose
System Design Document for the **employee expense reimbursement** workflow. Describes system blocks, interfaces, operational policies, and the **flowchart-friendly input** in SDD style. Focuses on reliability, traceability, and human-in-the-loop controls.

## Scope
Single company policy, single currency. **Manager approval is mandatory** for valid claims. **SLA escalation at 7 days** without manager action is **modeled in the flow** (timer-driven escalation).

## System Roles (Actors)
- **Employee** — submits claims, uploads receipts
- **Manager** — approves or rejects claims
- **Finance System** — schedules payouts
- **Notification Channel** — sends emails/Slack messages
- **SLA Timer Service** — monitors pending approvals and triggers escalation

## Business Policies & Rules
- Receipt required if amount ≥ $50  
- Submit within 60 days of expense date  
- Valid policy category; non-negative totals  
- Over-limit > $200 → **auto-reject** with reason `OVER_LIMIT`  
- **SLA (diagrammed):** escalate `Pending Manager Review` claims **after 7 days** → delegate + notify Finance

## Preconditions
- Employee is active
- Portal available; Claims API reachable

## Triggers (System Inputs)
- Employee submits a claim (payload with items, category, totals, receipts[])
- Manager submits a decision (approve/reject + reason)
- SLA Timer event fires (no action within 7 days)

## Expected Outcomes
- **Approved →** payment scheduled within **≤ 5 business days** (shift if weekend/holiday)
- **Rejected →** employee receives reasoned notification
- **Needs Receipt →** employee prompted to attach receipt and resubmit

## Non-Functional Requirements (System Qualities)
- **A11y:** keyboard navigation, screen reader support
- **Idempotency:** deduplicate by natural key (employeeId + date + amount)
- **Observability:** audit logs for all transitions; correlation IDs; metrics for SLA breaches
- **Resilience:** retries with backoff; circuit breakers around external adapters
- **Security:** role-based access (employee/manager/finance), PII protection

## API Contracts (Brief)

These endpoints outline the minimal interface for submitting, reviewing, and processing employee expense claims. They are expressed in a **brief form**: only core inputs, outputs, and behaviors are included — not full schemas, headers, or error codes.  

- **POST `/claims`**  
  Submits a new expense claim for an employee.  
  **Body:** `{ employeeId, items[], total, category, receipts[]?, submittedAt }`  
  **Returns:** `{ claimId, status }`  

- **POST `/claims/{id}/receipts`**  
  Attaches a receipt to an existing claim and re-validates it.  
  **Body:** `{ fileRef }`  

- **PATCH `/claims/{id}/decision`**  
  Records a manager’s decision on a claim.  
  **Body:** `{ decision: "APPROVE" | "REJECT", reasonCode? }`  

- **POST `/claims/{id}/schedule-payment`**  
  Schedules payout once a claim is approved. The scheduler automatically adjusts dates to the next business day if needed.  
  **Body:** `{ bankRef, proposedPayoutDate }`  

- **POST `/claims/{id}/events/sla-elapsed`**  
  Captures an SLA breach event (e.g., claim waiting too long in review) to trigger escalation workflows.  
  **Body:** `{ observedState: "PendingManagerReview", elapsedDays: 7 }`  

  
## Operational Policies
- **Payment window:** schedule within ≤ 5 business days; move to next business day on weekends/holidays
- **SLA timer (diagrammed):** 7 days for manager decision; escalate once per breach
- **Notification policy:** always include human-readable reason on rejection

## Failure / Edge Handling
- **Retries:** exponential backoff on transient 5xx (Claims API, Payment Scheduler)
- **Circuit breaker:** around Payment Scheduler to prevent cascading failure
- **Validation errors:** machine-readable codes (`MISSING_RECEIPT`, `OVER_LIMIT`, `PAST_SUBMISSION_WINDOW`, `INVALID_CATEGORY`)
- **Duplicate submission:** second POST `/claims` with same natural key merges/updates latest; audit entry recorded

## Acceptance Criteria (System)
- Exactly-once payment scheduling for approved claims (idempotent scheduler)
- All state transitions are audit-logged with correlation IDs
- Rejections always include a reason and trigger a notification
- SLA breaches produce a traceable escalation event and notify Finance

---

## Diagram Input — **SDD Flow (Human-Readable)**

**Flow Title:** Expense Reimbursement  
**Methodology:** SDD  
**Diagram Type:** Flowchart  
**Primary Outcomes:** `Paid (Scheduled)`, `Rejected`, `Needs Receipt`  
**Operational Timers (in diagram):** `Pending Manager Review SLA = 7 days` → escalate to delegate; notify Finance

### System Flow (Services → Decisions → Side-Effects)
**Step 0 — Start**  
- **Precheck:** Employee active; portal up; Claims API reachable.

**Step 1 — Service: Employee Portal (Submit Claim)**  
- **Action:** POST `/claims` with items, totals, category, receipts?  
- **Side-Effect:** create claim; forward to **Claims API** for validation.

**Step 2 — Service: Claims API (Validate)**  
- **Decision — Valid?**  
  - **If amount ≥ $50 & no receipt:**  
    - **Outcome → `Needs Receipt`**; **Notify Service:** prompt upload; **End**.  
  - **If over policy limit > $200:**  
    - **Outcome → `Rejected`** (`OVER_LIMIT`); **Notify Service:** send reason; **End**.  
  - **If > 60 days since expense / invalid category / negative total:**  
    - **Outcome → `Rejected`** (specific code); **Notify Service**; **End**.  
  - **Else valid:** route to **Approval Service**; **State → Pending Manager Review**; **Start SLA timer (7 days)**.

**Step 3 — Service: Approval Service (Manager Review)**  
- **Decision — Approved?**  
  - **If Approved:**  
    - Call **Payment Scheduler** → compute payout ≤ 5 business days (shift if weekend/holiday).  
    - **Outcome → `Paid (Scheduled)`**; **Notify Service:** confirmation; **End**.  
  - **If Rejected (reasonCode):**  
    - **Outcome → `Rejected`**; **Notify Service:** send reason; **End**.

**SLA Escalation — Timer Event (7 days)**  
- **Source:** SLA Timer Service observes claim still `Pending Manager Review`.  
- **Action:** POST `/claims/{id}/events/sla-elapsed` → **Approval Service** escalates to delegate; **Notify Finance**.  
- **State:** remains pending until decision taken.

**De-duplication Guard**  
- **On duplicate submission:** merge/ignore second payload; retain latest mutation; write audit log; do not spawn parallel flows.

### Parser Hints (for the app)
- Lines starting with **“Service:”** represent system blocks/nodes.  
- **“Decision — …?”** creates decision nodes.  
- **“Outcome → …”** denotes terminal states.  
- **“Timer Event …”** adds a timed branch from `Pending Manager Review`.  
- **“Notify … / Side-Effect”** indicates effect nodes (emails/Slack, scheduler calls).
