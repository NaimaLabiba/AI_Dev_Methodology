# TDD — Sequence: E-commerce Checkout

## Scope
Test-first spec for order draft, idempotency, stock reservation, payment authorization, confirmation, email, and fulfillment.

## Unit/Component Tests
- OrderService_createsDraft_withIdempotency()
- Inventory_reservesAtomically_and_releasesOnFailure()
- Payment_authorize_handlesApprovedDeclinedTimeoutChallenge()
- Order_confirms_only_when(ReservationOK && PaymentApproved)()
- Email_sends_on_confirmed_order()
- Fulfillment_creates_job_on_confirmed_order()

## Integration/E2E Tests
- happy_path_checkout_confirms_and_fulfills()
- declined_payment_does_not_reserve_or_confirm()
- insufficient_stock_prompts_adjustment()
- payment_timeout_releases_reservation_and_prompts_retry()
- duplicate_submit_single_charge_and_single_order()

## Rejection/Edge Tests
- address_validation_failure_blocks_confirm()
- partial_stock_allows_split_shipment_option()
- fraud_soft_decline_triggers_3DS_challenge_flow()

## Acceptance
- Exactly one captured auth per order; reservations released on any failure
- Clear next steps surfaced to UI for all failure states

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
  - Order -> Payment: Authorize(amount, token)
  - Payment -> Order: Approved | Declined | Timeout | Challenge
  - Order -> Fulfillment: CreateFulfillment [if Approved & Reserved]
  - Order -> Email: SendConfirmation [if Approved & Reserved]
  - Order -> Web: Result(status, nextSteps)
  - Web -> UI: Show Confirmation | Retry | Adjust Stock | 3DS Challenge
