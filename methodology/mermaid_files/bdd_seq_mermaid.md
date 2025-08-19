sequenceDiagram
  %% Flow Title: E-commerce Checkout (BDD)
  %% Primary Outcomes: Order Confirmed, Retry Payment, Adjust Stock, 3DS Challenge

  participant UI as Customer UI
  participant Web as Web App
  participant Order as Order Service
  participant Inv as Inventory Service
  participant Pay as Payment Gateway
  participant Email as Email Service
  participant Fulfill as Fulfillment Service

  UI->>Web: Submit checkout (cart, shipping, paymentMethod, idempotencyKey)
  Web->>Order: CreateDraftOrder(cart, idempotencyKey)
  Note over Order: Draft created or reused (idempotent)

  Order->>Inv: CheckAndReserve(items)
  Inv-->>Order: ReservationResult (OK | Insufficient | Partial)

  alt Reservation OK
    Order->>Pay: Authorize(amount, token, 3DS?)
    Pay-->>Order: AuthResult (Approved | Declined | Timeout | Challenge)

    alt Approved
      Order->>Fulfill: CreateFulfillment(orderId, items, address)
      Order->>Email: SendOrderConfirmation(orderId)
      Order-->>Web: CheckoutResult(Confirmed, tracking)
      Web-->>UI: Show Order Confirmed
    else Declined
      Order->>Inv: ReleaseReservation(items)
      Order-->>Web: PaymentDeclined(nextSteps)
      Web-->>UI: Show Retry / Alternate Method
    else Timeout
      Order->>Inv: ReleaseReservation(items)
      Order-->>Web: PaymentTimeout(nextSteps)
      Web-->>UI: Show Retry Payment
    else Challenge (3DS)
      Order-->>Web: Request3DSChallenge(params)
      Web-->>UI: Show 3DS Challenge
    end

  else Insufficient / Partial
    Order-->>Web: StockIssue(adjust/backorder/split)
    Web-->>UI: Show Adjust Stock
  end

  opt Duplicate submit (same idempotencyKey)
    UI->>Web: Submit again
    Web->>Order: CreateDraftOrder(idempotencyKey)
    Note over Web,Order: Reuse existing draft; suppress duplicate charge/order
  end
