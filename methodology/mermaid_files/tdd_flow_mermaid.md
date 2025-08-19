flowchart TD
  %% Flow Title: Expense Reimbursement (TDD)
  %% Behavior Source: Passing tests (AAA). SLA included only where it changes behavior.

  A([Start]) --> B[Submit Claim]
  %% Arrange/Act/Assert cues drive edges; shown here as comments.

  B --> C[Validate Claim]
  C --> D{Validation Passed?}

  D -->|No| E{Missing Receipt & Amount ≥ $50?}
  E -->|Yes| F[Outcome: Needs Receipt<br/>Notify Employee]
  F --> Z([End])

  E -->|No| G[Outcome: Rejected<br/>Notify with Reason]
  G --> Z

  D -->|Yes| H[Manager Review]
  %% SLA timer: 7 days without decision -> escalate
  H -. No action 7 days .-> K[Escalate to Delegate<br/>Notify Finance]
  K -.-> H

  H --> I{Approved?}
  I -->|Yes| J[Outcome: Paid (Scheduled)<br/>Schedule ≤ 5bd; shift on weekends/holidays]
  J --> Z
  I -->|No| G

  %% De-dup guard (idempotency) is enforced at submission time
  %% and doesn’t add a separate node; kept as a policy.
