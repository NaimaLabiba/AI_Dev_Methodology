flowchart TD
  %% Flow Title: Expense Reimbursement (SDD)
  %% System-flavoured labels; no separate component list, just step names.

  A([Start]) --> B[Employee Portal: Submit Claim]
  B --> C[Claims API: Validate]
  C --> D{Valid?}

  D -->|No| E{Amount ≥ $50 & No Receipt?}
  E -->|Yes| F[Notify: Needs Receipt]
  F --> Z([End])

  E -->|No| G[Notify: Rejected (Reason Code)]
  G --> Z

  D -->|Yes| H[Approval Service: Manager Review]
  %% Operational Timer (diagrammed): 7-day SLA
  H -. No action 7 days .-> K[SLA Timer Event → Escalate to Delegate<br/>Notify Finance]
  K -.-> H

  H --> I{Approved?}
  I -->|Yes| J[Payment Scheduler: Schedule ≤ 5bd<br/>(shift if weekend/holiday)]
  J --> Z([End])
  I -->|No| G
