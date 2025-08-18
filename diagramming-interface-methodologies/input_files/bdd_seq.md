# BDD — Sequence: E-commerce Checkout

## Purpose
Customer confirms checkout; system authorizes payment, reserves stock, confirms order, notifies customer, and creates fulfillment.

## Participants
Customer UI, Web App, Order Service, Payment Gateway, Inventory Service, Email Service, Fulfillment Service

## Preconditions
- Customer signed in; cart has ≥1 item; shipping address & method provided

## Scenarios (Gherkin)

Feature: Checkout

Scenario: Successful payment and fulfillment
  Given an authenticated customer with items in stock
  When the customer confirms checkout and submits payment
  Then the payment is authorized
  And the inventory is reserved
  And the order is confirmed
  And a confirmation email is sent
  And a fulfillment job is created

Scenario: Payment authorization declined
  Given the customer attempted payment
  When the gateway returns "Declined"
  Then the order remains "Pending"
  And no inventory is reserved
  And the customer is shown retry and alternate payment options

Scenario: Payment timeout with retry
  Given a pending authorization request
  When the gateway does not respond within 30s
  Then the reservation (if any) is released
  And the customer is prompted to retry

Scenario: Insufficient stock during checkout
  Given the customer is at the payment step
  When Inventory Service reports insufficient stock
  Then the order is set to "Backorder" or blocked (configurable)
  And the customer is prompted to adjust quantity or remove items

Scenario: Duplicate submit prevented
  Given a user double-clicks the pay button
  When requests share the same idempotency key
  Then only one order draft/charge is processed

## Edge Cases
- Partial stock → offer split shipment or quantity adjust
- Address validation failure → block confirm and display field-level errors
- Fraud check soft-decline → request 3DS or alternative payment

## Acceptance Criteria
- No order confirmation unless Payment Authorized **and** Inventory Reserved
- All failures produce actionable UI next steps
- Idempotency prevents duplicate charges/orders

## Diagram Input — Sequence
participants:
  - Customer UI
  - Web App
  - Order Service
  - Payment Gateway
  - Inventory Service
  - Email Service
  - Fulfillment Service
messages:
  - Customer UI -> Web App: POST /checkout(cart, shipping, paymentMethod, idempotencyKey)
  - Web App -> Order Service: CreateDraftOrder(cart, idempotencyKey)
  - Order Service -> Inventory Service: CheckAndReserve(items)
  - Inventory Service -> Order Service: ReservationResult(OK|Insufficient|Partial)
  - Order Service -> Payment Gateway: Authorize(amount, token, 3DS?)
  - Payment Gateway -> Order Service: AuthResult(Approved|Declined|Timeout|Challenge)
  - Order Service -> Fulfillment Service: CreateFulfillment(orderId, items, address) [if Approved & Reserved]
  - Order Service -> Email Service: SendOrderConfirmation(orderId) [if Approved & Reserved]
  - Order Service -> Web App: CheckoutResult(status, nextSteps)
  - Web App -> Customer UI: ShowConfirmation | ShowRetry | ShowStockIssue | Show3DSChallenge
