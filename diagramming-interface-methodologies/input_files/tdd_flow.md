# TDD — Flowchart: Employee Expense Reimbursement

## Purpose
Test-first specification for a flow that validates, routes, and resolves employee expense claims. The tests define the behavior; the diagram is generated from the passing tests.

## Scope
Single company policy, single currency. Manager approval required for valid claims. SLA escalation after **7 days** of no manager action is part of the flow.

## Actors (as test collaborators)
- Employee (requester)
- Manager (approver)
- Finance Officer/Finance System (payment)
- Notification Channel (email/Slack)

## Business Policies & Rules
- Receipt required if amount ≥ $50
- Submit within 60 days of expense date
- Valid policy category; non-negative totals
- Over-limit > $200 not reimbursed
- **SLA (diagrammed):** Escalate a pending manager review after **7 days** to the delegate; notify Finance

## Testable Units (subjects under test)
- **Validator** (rules & policy checks)
- **Approval Workflow** (manager review + SLA timer)
- **Payment Scheduler** (≤ 5 business days; business-day shift)
- **De-duplication Guard** (idempotent submission)
- **Notifier** (reasons, prompts)

## Preconditions (test setup constraints)
- Employee is active
- Expense form accessible

## Inputs (test triggers)
- Employee submits a claim

## Expected Outcomes
- **Approved →** Payment scheduled within **≤ 5 business days** (shift to next business day on weekends/holidays)
- **Rejected →** Employee notified with reason
- **Needs Receipt →** Employee prompted to attach receipt and resubmit

## Non-Functional Requirements (testable qualities)
- Accessibility (A11y)
- Idempotent submission (no duplicates)
- Audit logs & correlation IDs

---

## Unit Tests 

### validates_required_fields()
- **Arrange:** Build claim with minimal required fields.
- **Act:** Validate claim.
- **Assert:** Validation fails with specific missing-field reasons.

### requires_receipt_when_amount_ge_50()
- **Arrange:** Claim amount = $120 with no receipt.
- **Act:** Validate claim.
- **Assert:** Result = “Needs Receipt”; reason indicates missing receipt.

### rejects_when_submitted_after_60_days()
- **Arrange:** Claim date at 61 days in the past.
- **Act:** Validate claim.
- **Assert:** Result = “Rejected”; reason = “PAST_SUBMISSION_WINDOW”.

### rejects_when_over_policy_limit()
- **Arrange:** Amount = $250 (limit > $200).
- **Act:** Validate claim.
- **Assert:** Result = “Rejected”; reason = “OVER_LIMIT”.

### routes_valid_claim_to_manager()
- **Arrange:** Valid claim (receipt if ≥ $50, within window, valid category).
- **Act:** Submit claim.
- **Assert:** Status transitions to “Pending Manager Review”.

### escalates_after_7_days_no_manager_action()
- **Arrange:** Claim in “Pending Manager Review”; SLA timer = 7 days.
- **Act:** Advance time to 7 days with no decision.
- **Assert:** Escalation fired → routed to delegate; Finance notified; status remains pending.

### schedules_payment_when_approved()
- **Arrange:** Valid claim approved by manager.
- **Act:** Invoke payment scheduler.
- **Assert:** Status = “Paid (Scheduled)” within ≤ 5 business days; weekend/holiday shift applied.

### duplicate_submission_is_deduplicated()
- **Arrange:** Submit claim A; then resubmit identical claim (employeeId + date + amount).
- **Act:** Process second submission.
- **Assert:** No duplicate charge/record; latest version retained; audit logged.

---

## Integration Tests 

### submits_valid_claim_and_schedules_payment()
- **Arrange:** Valid claim with required receipt; manager available.
- **Act:** Submit → Validate → Manager approves → Schedule payment.
- **Assert:** Final outcome “Paid (Scheduled)” within ≤ 5 business days; notification sent.

### missing_receipt_prompts_upload_then_resubmit()
- **Arrange:** Amount ≥ $50, no receipt.
- **Act:** Submit → Validate.
- **Assert:** Outcome “Needs Receipt”; employee receives prompt with upload instructions.

### manager_rejects_with_reason()
- **Arrange:** Validated claim pending review.
- **Act:** Manager rejects with reason “Invalid Category”.
- **Assert:** Outcome “Rejected”; employee notified with that reason.

### SLA_escalation_path_triggers_notifications()
- **Arrange:** Pending review; no action for 7 days.
- **Act:** SLA timer elapses.
- **Assert:** Escalated to delegate; Finance notified; audit trail contains SLA breach.

---

## Rejection / Edge Tests 

### invalid_category_rejected_with_reason()
- **Arrange:** Claim with category not in policy.
- **Act:** Validate.
- **Assert:** “Rejected” with “INVALID_CATEGORY”.

### weekend_payment_shifts_to_next_business_day()
- **Arrange:** Approved claim on Friday with scheduler targeting weekend.
- **Act:** Schedule payment.
- **Assert:** Date shifts to next business day; status remains “Paid (Scheduled)”.

---

## System Acceptance Criteria 

### accepts_valid_flow_end_to_end()
- **Arrange:** Valid claim lifecycle end-to-end.
- **Act:** Submit → Validate → Approve → Schedule payment.
- **Assert:** Outcomes match Expected Outcomes; all steps audited with correlation IDs.

### all_failures_provide_actionable_next_steps()
- **Arrange:** Create scenarios for missing receipt, over limit, invalid category, late submission.
- **Act:** Run through validation and submission.
- **Assert:** Each failure returns a clear reason + user guidance; notifications sent.

---

## Diagram Input — **TDD Flow (Human-Readable)**

**Flow Title:** Expense Reimbursement  
**Methodology:** TDD  
**Diagram Type:** Flowchart  
**Behavior Source:** Passing tests in this file  
**Primary Outcomes:** `Paid (Scheduled)`, `Rejected`, `Needs Receipt`  
**Timers (in diagram):** `Manager Review SLA = 7 days` → escalate to delegate; notify Finance

### Test-Driven Flow Outline
**Step 0 — Start**  
- **Assert preconditions:** employee active; form accessible.

**Step 1 — Submit Claim**  
- **Arrange:** build claim payload.  
- **Act:** submit.  
- **Assert:** claim enters validation.

**Step 2 — Validate Claim**  
- **Assert rules:**  
  - Receipt required if amount ≥ $50  
  - Submit within 60 days  
  - Valid category; non-negative totals  
  - Over-limit > $200 → reject

**Branch A — Needs Receipt**  
- **Arrange:** amount ≥ $50 & no receipt.  
- **Act:** validate.  
- **Assert:** **Outcome → “Needs Receipt”**; notify employee; **End**.

**Branch B — Rejected (Other Failures)**  
- **Arrange:** over limit / invalid category / negative / too late.  
- **Act:** validate.  
- **Assert:** **Outcome → “Rejected”** with reason; notify; **End**.

**Branch C — Passed Validation → Manager Review (SLA 7d)**  
- **Arrange:** valid claim.  
- **Act:** route to manager; start SLA timer (7 days).  
- **Assert:** status “Pending Manager Review”.

**Decision — Approved?**  
- **If Approved:**  
  - **Act:** schedule payment.  
  - **Assert:** **Outcome → “Paid (Scheduled)”** within ≤ 5 business days (shift on weekends/holidays); **End**.  
- **If Rejected:**  
  - **Assert:** **Outcome → “Rejected”** with reason; notify; **End**.

**SLA Escalation**  
- **Arrange:** pending manager review; no action.  
- **Act:** SLA timer elapses at 7 days.  
- **Assert:** escalated to delegate; Finance notified; status still pending until decision.

**De-duplication Guard**  
- **Arrange:** second submission with identical (employeeId + date + amount).  
- **Act:** submit.  
- **Assert:** no duplicate processing; latest retained; audit recorded.

### Parser Hints (for the app)
- Lines starting with **“Step”** map to nodes.  
- **“Branch”** and **“Decision”** map to decision nodes.  
- AAA cues (**Arrange / Act / Assert**) define edge direction and expected results.  
- **“Outcome → …”** denotes terminal states.  
- **Timers** appear only where behavior changes (SLA escalation).
