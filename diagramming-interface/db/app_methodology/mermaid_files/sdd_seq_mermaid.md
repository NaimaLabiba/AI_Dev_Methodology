sequenceDiagram
  %% Flow Title: E-commerce Checkout (SDD)
  %% System-flavoured messages using API endpoints where helpful.

  participant UI as Customer UI
  participant Web as Web App
  participant Order as Order Service
  participant Inv as Inventory Service
  participant Pay as Payment Gateway
  participant Email as Email Service
  participant Fulfill as Fulfillment Service

  UI->>Web: Submit checkout (cart, shipping, paymentMethod, idempotencyKey)
  Web->>Order: POST /orders/draft (idempotencyKey, cart)
  Note over Order: Creates or reuses draft (idempotent)

  Order->>Inv: POST /inventory/reserve (orderId, items)
  Inv-->>Order: {status: OK | Insufficient | Partial}

  alt status == OK
    Order->>Pay: POST /payments/authorize (orderId, amount, token, threeDS?)
    Pay-->>Order: {result: Approved | Declined | Timeout | Challenge}

    alt result == Approved
      Order->>Order: POST /orders/confirm (orderId)
      Order->>Fulfill: POST /fulfillment/create (orderId, items, address)
      Order->>Email: POST /emails/order-confirmation (orderId, to)
      Order-->>Web: CheckoutResult(Confirmed, tracking)
      Web-->>UI: Show Order Confirmed
    else result == Declined
      Order->>Inv: POST /inventory/release (orderId)
      Order-->>Web: PaymentDeclined(nextSteps)
      Web-->>UI: Show Retry Payment
    else result == Timeout
      Order->>Inv: POST /inventory/release (orderId)
      Order-->>Web: PaymentTimeout(nextSteps)
      Web-->>UI: Show Retry Payment
    else result == Challenge
      Order-->>Web: Request3DSChallenge(params)
      Web-->>UI: Show 3DS Challenge
    end

  else status == Insufficient or Partial
    Order-->>Web: StockIssue(adjust/backorder/split)
    Web-->>UI: Show Adjust Stock
  end

  opt Duplicate submit (same idempotencyKey)
    UI->>Web: Submit again
    Web->>Order: POST /orders/draft (idempotencyKey)
    Note over Web,Order: Reuse existing draft; no duplicate charge/order
  end
