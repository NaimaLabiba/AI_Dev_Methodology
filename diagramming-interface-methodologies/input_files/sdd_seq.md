# SDD — Sequence: E-commerce Checkout

## Non-Functional Requirements
- Observability with trace/correlation IDs; audit trails
- Idempotency on draft/authorize/confirm
- Timeouts: Inventory 10s; Payment 30s; Retries with backoff on transient failures
- A11y in UI; consistent error codes for failures

## Components
- Web App (SSR/SPA)
- Order Service (draft/confirm)
- Inventory Service (reserve/release)
- Payment Gateway (authorize/capture/3DS)
- Fulfillment Service (pick/pack/ship)
- Email Service (transactional)

## API Contracts (brief)
POST /orders/draft { cart, customerId, idempotencyKey }
POST /inventory/reserve { orderId, items[] }
POST /payments/authorize { orderId, amount, token, threeDS? }
POST /orders/confirm { orderId }
POST /fulfillment/create { orderId, items, address }
POST /emails/order-confirmation { orderId, to }

## Failure/Edge Handling
- Payment timeout → release reservation; show retry
- Partial stock → split shipment or quantity adjust
- Duplicate submits → blocked by idempotency key
- Address validation error → return structured field errors
- Challenge (3DS) → pause flow and surface challenge step

## Acceptance (System)
- Confirm only if Reservation OK & Payment Approved
- No double-charge; no double-reserve; all steps carry trace IDs

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
  - UI -> Web: Checkout(cart, shipping, paymentMethod, idempotencyKey)
  - Web -> Order: CreateDraftOrder
  - Order -> Inventory: Reserve(items)
  - Inventory -> Order: Reserved | Insufficient | Partial
  - Order -> Payment: Authorize(amount, token, threeDS?)
  - Payment -> Order: Approved | Declined | Timeout | Challenge
  - Order -> Fulfillment: CreateFulfillment [if Approved & Reserved]
  - Order -> Email: SendConfirmation [if Approved & Reserved]
  - Order -> Web: Result(status, nextSteps)
  - Web -> UI: Show Confirmation | Retry | Adjust Stock | 3DS Challenge
