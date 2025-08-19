flowchart TD
  %% Flow Title: Expense Reimbursement (BDD)
  %% Primary Outcomes: Paid (Scheduled), Rejected, Needs Receipt

  A([Start]) --> B[Submit Claim]
  B --> C[Validate Claim]
  C --> D{Validation Passed?}

  D -->|No| E{Missing Receipt & Amount ≥ $50?}
  E -->|Yes| F[Notify Employee: Needs Receipt]
  F --> Z([End])

  E -->|No| G[Notify Employee: Rejected (Reason)]
  G --> Z

  D -->|Yes| H[Manager Review]
  %% SLA (diagrammed): escalation after 7 days
  H -. No action 7 days .-> K[Escalate to Delegate<br/>Notify Finance]
  K -.-> H

  H --> I{Approved?}
  I -->|Yes| J[Schedule Payment ≤ 5 business days<br/>(shift if weekend/holiday)]
  J --> Z
  I -->|No| G
