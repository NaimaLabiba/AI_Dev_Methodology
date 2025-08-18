# SDD — Flowchart: Employee Expense Reimbursement

## Non-Functional Requirements
- A11y UI; idempotent APIs; audit logs; correlation IDs
- SLA: escalate manager review at 7 days
- Payment scheduling within 5 business days
- Timeouts: validation 5s; finance adapter 10s
- Calendars: honor weekends/holidays for payouts

## Components
- Web UI (Employee Portal)
- Claims API (validation & rules)
- Approval Service (manager workflow & SLA)
- Finance Adapter (payment scheduling)
- Notification Service (email/Slack)

## API Contracts (brief)
POST /claims { employeeId, items[], total, receipts[] }
PATCH /claims/{id}/decision { decision: "APPROVE"|"REJECT", reason? }
POST /claims/{id}/receipt { fileRef }
POST /claims/{id}/schedule-payment { bankRef, payoutDate }

## Failure/Edge Handling
- Retries with exponential backoff on transient errors
- Circuit breaker on Finance Adapter
- Idempotency key on submission (employeeId+date+amount hash)
- Validation errors return machine-readable codes

## Acceptance (System)
- Exactly-once payment scheduling for approved claims
- All state transitions logged with trace IDs; user gets clear reason on rejection

## Diagram Input — Flowchart
nodes:
  - Start
  - UI: Submit Claim
  - API: Validate
  - Decision: Valid?
  - Decision: Needs Receipt?
  - Approval: Manager Review
  - Decision: Approved?
  - Finance: Schedule Payment
  - Notify: Missing Receipt
  - Notify: Rejected
  - End
edges:
  - Start -> UI: Submit Claim -> API: Validate -> Decision: Valid?
  - Valid?:No -> Decision: Needs Receipt?
  - Needs Receipt?:Yes -> Notify: Missing Receipt -> End
  - Needs Receipt?:No -> Notify: Rejected -> End
  - Valid?:Yes -> Approval: Manager Review -> Decision: Approved?
  - Approved?:Yes -> Finance: Schedule Payment -> End
  - Approved?:No -> Notify: Rejected -> End
