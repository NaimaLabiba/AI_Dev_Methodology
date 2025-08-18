# DDD — Sequence: E-commerce Checkout

## Ubiquitous Language
- Order: {Draft, Pending, Confirmed, Backorder, Cancelled}
- Reservation: {Reserved, Failed, Released, Partial}
- Authorization: {Approved, Declined, Timeout, Challenge}

## Bounded Contexts
- Commerce (Order aggregate)
- Inventory (Reservation)
- Payments (Authorization)
- Fulfillment (Shipment)
- Notifications (Email)

## Aggregates & Invariants
Order (root)
- Invariant: cannot Confirm unless Reservation == Reserved AND Authorization == Approved
- Emits: OrderDrafted, StockReserved, ReservationFailed, PaymentAuthorized, PaymentDeclined, PaymentTimeout, OrderConfirmed, FulfillmentCreated, ConfirmationSent

## Commands
- CreateDraftOrder
- ReserveStock
- AuthorizePayment
- ConfirmOrder
- CreateFulfillment
- SendOrderConfirmation
- ReleaseReservation

## Process (Sequence)
CreateDraftOrder → ReserveStock → AuthorizePayment → if (Reserved & Approved) ConfirmOrder → CreateFulfillment → SendOrderConfirmation

## Rejection/Edge Policies
- On PaymentDeclined/Timeout → ReleaseReservation, keep Order.Pending
- On ReservationFailed → do not call AuthorizePayment; prompt cart update
- On Partial reservation → offer split shipment or adjust quantities

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
  - UI -> Web: Checkout(cart)
  - Web -> Order: CreateDraftOrder(idempotencyKey)
  - Order -> Inventory: Reserve(items)
  - Inventory -> Order: Reserved | Failed | Partial
  - Order -> Payment: Authorize(amount, token)
  - Payment -> Order: Approved | Declined | Timeout | Challenge
  - Order -> Order: ConfirmOrder() [if Reserved & Approved]
  - Order -> Fulfillment: CreateFulfillment(orderId, items, address)
  - Order -> Email: SendOrderConfirmation(orderId)
  - Order -> Web: Result(status, nextSteps)
  - Web -> UI: Show Confirmation | Retry | Adjust Stock | Complete 3DS
