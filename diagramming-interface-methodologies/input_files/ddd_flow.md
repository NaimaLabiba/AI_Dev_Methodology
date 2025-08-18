# DDD — Flowchart: Employee Expense Reimbursement

## Ubiquitous Language
- Claim: reimbursement request (Draft, PendingApproval, NeedsReceipt, Rejected, Scheduled)
- LineItem, Receipt, PolicyCategory, Money, EmployeeId

## Bounded Context
Expenses

## Aggregate
Claim (root)
- Entities: LineItem, Receipt
- Value Objects: Money, PolicyCategory
- Invariants:
  - Receipt required when amount ≥ $50
  - Submission ≤ 60 days from expense date
  - Amount ≥ 0

## Commands
- SubmitClaim
- ApproveClaim
- RejectClaim(reasonCode)
- ProvideReceipt
- SchedulePayment

## Domain Events
- ClaimSubmitted(employeeId, total, hasReceipt)
- ClaimApproved(claimId, managerId)
- ClaimRejected(claimId, reasonCode)
- ReceiptProvided(claimId)
- PaymentScheduled(claimId, payoutDate)
- EscalationTriggered(claimId)

## Process Policy (for Flowchart)
1) SubmitClaim → Validate  
2) If invalid → NeedsReceipt or Rejected (with reason)  
3) If valid → PendingApproval → Approve or Reject  
4) If approved → SchedulePayment ≤ 5 business days  
5) SLA breach (7 days) → EscalationTriggered

## Rejection/Edge
- OVER_LIMIT auto-reject; notify employee
- Duplicate SubmitClaim (hash on employeeId+date+amount) → ignore/merge
- Weekend payouts → next business day

## Diagram Input — Flowchart
nodes:
  - Start
  - SubmitClaim
  - Validate
  - Valid? (Decision)
  - Needs Receipt? (Decision)
  - Notify Missing Receipt
  - Manager Review
  - Approved? (Decision)
  - Schedule Payment
  - Notify Rejected
  - End
edges:
  - Start -> SubmitClaim
  - SubmitClaim -> Validate
  - Validate -> Valid?
  - Valid?:No -> Needs Receipt?
  - Needs Receipt?:Yes -> Notify Missing Receipt -> End
  - Needs Receipt?:No -> Notify Rejected -> End
  - Valid?:Yes -> Manager Review -> Approved?
  - Approved?:Yes -> Schedule Payment -> End
  - Approved?:No -> Notify Rejected -> End
