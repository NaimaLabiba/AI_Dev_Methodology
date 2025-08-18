# TDD — Flowchart: Employee Expense Reimbursement

## Scope
Test-first specification for submission, validation, approval/rejection, and payment scheduling.

## Unit Tests (examples)
- validates_required_fields()
- requires_receipt_when_amount_ge_50()
- rejects_when_submitted_after_60_days()
- routes_valid_claim_to_manager()
- flags_missing_receipt_to_needs_receipt()
- escalates_after_7_days_no_manager_action()

## Integration Tests
- submits_valid_claim_and_schedules_payment():
  - Arrange: valid claim + required receipt
  - Act: submit → approve
  - Assert: status "Paid (Scheduled)" within 5 business days
- rejects_over_policy_limit():
  - Arrange: amount over limit
  - Assert: status "Rejected", reason OVER_LIMIT
- duplicate_submission_is_deduplicated():
  - Arrange: same employeeId+date+amount twice
  - Assert: second submission ignored or merged; audit recorded

## Rejection/Edge Tests
- missing_receipt_prompts_upload()
- invalid_category_rejected_with_reason()
- weekend_payment_rolls_to_next_business_day()

## Acceptance (System)
- All failures return actionable reasons; audit + trace IDs for transitions

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
