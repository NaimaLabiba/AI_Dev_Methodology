flowchart TD
  %% Flow Title: Expense Reimbursement (DDD)
  %% States: Draft -> PendingApproval -> (NeedsReceipt | Rejected | Scheduled)

  A([Start: Draft]) --> B[Command: SubmitClaim]
  B --> C[Apply Invariants]
  C --> D{Valid under Policy?}

  D -->|No| E{Missing Receipt & Amount ≥ $50?}
  E -->|Yes| F[State → NeedsReceipt<br/>Event: ClaimSubmitted(hasReceipt=false)<br/>Notify Employee]
  F --> Z([End])

  E -->|No| G[State → Rejected<br/>Event: ClaimRejected(reasonCode)<br/>Notify Employee]
  G --> Z

  D -->|Yes| H[State → PendingApproval<br/>Event: ClaimSubmitted(hasReceipt=true)]
  %% SLA policy (diagrammed): escalate after 7 days in PendingApproval
  H -. Pending ≥ 7 days .-> K[Event: EscalationTriggered<br/>Route to Delegate & Notify Finance]
  K -.-> H

  H --> I{ApproveClaim?}
  I -->|Yes| J[Event: ClaimApproved → Policy: Schedule ≤ 5bd<br/>State → Scheduled<br/>Event: PaymentScheduled(payoutDate)]
  J --> Z
  I -->|No| G
