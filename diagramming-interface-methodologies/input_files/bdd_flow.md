# BDD — Flowchart: Employee Expense Reimbursement

## Purpose
Employees submit expense claims that are validated and either approved (and paid) or rejected.

## Actors
Employee, Manager, Finance Officer, Finance System

## Business Rules
- Receipt required if amount ≥ $50
- Submit within 60 days of expense date
- Valid policy category; non-negative totals

## Preconditions
- Employee is active; form accessible

## Triggers
- Employee submits a claim

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
- Duplicate submission (same employeeId+date+amount) → de-duplicate; keep latest
- Over policy limit → auto-reject with reason OVER_LIMIT
- Weekends/holidays → schedule payout next business day

## Acceptance Criteria
- Approved valid claims move to “Paid (Scheduled)” ≤ 5 business days
- Every rejection includes a reason and employee notification

## Diagram Input — Flowchart
nodes:
  - Start
  - Submit Claim
  - Validate Claim
  - Valid? (Decision)
  - Needs Receipt? (Decision)
  - Notify Employee (Missing Receipt)
  - Manager Review
  - Approved? (Decision)
  - Schedule Payment
  - Notify Employee (Rejected)
  - End
edges:
  - Start -> Submit Claim
  - Submit Claim -> Validate Claim
  - Validate Claim -> Valid?
  - Valid?:No -> Needs Receipt?
  - Needs Receipt?:Yes -> Notify Employee (Missing Receipt) -> End
  - Needs Receipt?:No -> Notify Employee (Rejected) -> End
  - Valid?:Yes -> Manager Review -> Approved?
  - Approved?:Yes -> Schedule Payment -> End
  - Approved?:No -> Notify Employee (Rejected) -> End
