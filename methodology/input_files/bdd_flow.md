# BDD — Flowchart: Employee Expense Reimbursement

## Purpose
Employees submit expense claims that are validated and either approved (and paid) or rejected. This document defines behavior from the user’s perspective and produces a flowchart-friendly input.

## Scope
Single company policy, single currency. Manager approval required for valid claims.

## Actors
- Employee
- Manager
- Finance Officer
- Finance System

## Business Policies & Rules
- Receipt required if amount ≥ $50
- Submit within 60 days of expense date
- Valid policy category; non-negative totals
- Over-limit > $200 not reimbursed
- **SLA (used in diagram):** Escalate a pending manager review after **7 days** to the delegate; notify Finance

## Systems Involved
- Employee Portal (submission)
- Approval Service (manager workflow + SLA timer)
- Finance System (payment scheduling)
- Notification Channel (email/Slack)

## Preconditions
- Employee is active
- Expense form accessible

## Triggers
- Employee submits a claim

## Business Outcomes
- **Approved →** Payment scheduled (within 5 business days; next business day if weekend/holiday)
- **Rejected →** Employee notified with reason
- **Needs Receipt →** Employee prompted to attach receipt and resubmit

## Non-Functional Requirements ( how the system should behave)
- Accessibility (A11y)
- Idempotent submission (prevents duplicates)
- Audit logs & correlation IDs

## Scenarios (Gherkin)

Feature: Expense reimbursement

Scenario: Valid claim gets approved and scheduled for payment
  Given an active employee with a valid claim under policy
  And a receipt is attached when the amount is $50 or more
  When the employee submits the claim
  Then the system validates amount, date, and category
  And routes the claim to the manager for review
  And when the manager approves
  Then the Finance System schedules payment within 5 business days

Scenario: Manager rejects a claim
  Given a submitted claim pending manager review
  When the manager rejects with a reason
  Then the employee is notified with the reason
  And the claim status becomes "Rejected"

Scenario: Validation fails due to missing receipt
  Given a claim of $120 without a receipt
  When validation runs
  Then the claim is flagged "Needs Receipt"
  And the employee is prompted to attach a receipt

Scenario: No manager action within SLA
  Given a claim pending manager review for 7 days
  When the SLA is reached
  Then the system escalates to the manager's delegate
  And Finance is notified

## Edge Cases
- Duplicate submission (same employeeId + date + amount) means de-duplicate; keep latest
- Over policy limit > $200 means auto-reject with reason OVER_LIMIT
- Weekends/holidays means schedule payout next business day

## Acceptance Criteria
- Approved valid claims move to “Paid (Scheduled)” ≤ 5 business days
- Every rejection includes a reason and employee notification

## Diagram Input — BDD Flow (Human-Readable)

**Flow Title:** Expense Reimbursement  
**Methodology:** BDD  
**Diagram Type:** Flowchart  
**Primary Outcomes:** `Paid (Scheduled)`, `Rejected`, `Needs Receipt`  
**Timers:** `Manager Review SLA = 7 days` (escalate to delegate; notify Finance)

### Behavior Flow
**Step 0 — Start**  
- *Given* the employee is active and the expense form is accessible.  
- *Then* the flow awaits submission.

**Step 1 — Submit Claim**  
- *When* the employee submits a claim.  
- *Then* proceed to **Validate Claim**.

**Step 2 — Validate Claim**  
- *Then* evaluate the business rules:  
  - Receipt required if amount ≥ $50  
  - Submitted within 60 days of expense date  
  - Valid category and non-negative totals  
  - Over-limit > $200 is not reimbursable

**Branch A — Validation: Missing Receipt**  
- *If* amount ≥ $50 **and** no receipt is attached,  
- *Outcome →* **Needs Receipt**: notify the employee to attach a receipt, *and end the flow*.

**Branch B — Validation: Other Failures**  
- *If* validation fails for any other rule (e.g., over-limit, invalid category, negative total, late submission),  
- *Outcome →* **Rejected**: notify the employee with reason, *and end the flow*.

**Branch C — Validation: Passed**  
- *If* validation passes,  
- *Then* route to **Manager Review** and **start the SLA timer (7 days)**.

**Step 3 — Manager Review (SLA 7d)**  
- *When* the manager reviews the claim, they **Approve** or **Reject**.

**Decision — Approved?**  
- *If* **Approved**,  
  - *Then* **Schedule Payment** within **≤ 5 business days** (shift to the next business day if weekend/holiday).  
  - *Outcome →* **Paid (Scheduled)**, *and end the flow*.  
- *If* **Rejected**,  
  - *Outcome →* **Rejected**: notify the employee with reason, *and end the flow*.

### Escalation (SLA)
- *If* no manager action occurs within **7 days**,  
  - *Then* **escalate** to the manager’s delegate **and** notify Finance.  
  - The claim remains in **Manager Review** until a decision is made.

### De-duplication
- *If* a duplicate submission (same `employeeId + date + amount`) occurs,  
  - *Then* de-duplicate and keep the latest version before re-validating.

### Payout Calendar Note
- Payments scheduled on weekends/holidays move to the **next business day**.

### Parser Hints (for the app)
- Treat lines starting with **“Step”** as nodes.  
- Treat **“Branch”** and **“Decision”** as decision nodes.  
- **“When … Then …”** pairs imply directed edges.  
- **“Outcome → …”** implies a terminal node (end state).  
- **“SLA …”** and **“Escalation …”** define timers and side-effects on the **Manager Review** node.
