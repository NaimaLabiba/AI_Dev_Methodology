# TDD — Sequence: E-commerce Checkout

## Purpose
Test-first specification for the checkout interaction. The tests define behavior; the **sequence-diagram-friendly input** below is derived from passing tests (human-readable, no Mermaid).

## Scope
Single merchant, single currency. Synchronous card authorization during checkout. Inventory reservation occurs before confirmation. **No SLA timers are modeled** in this sequence (timers that don’t add messages stay out of the diagram).

## Participants (as test collaborators)
- **Customer UI**
- **Web App**
- **Order Service**
- **Payment Gateway**
- **Inventory Service**
- **Email Service**
- **Fulfillment Service**

## Business Policies & Rules
- Confirm order **only if** Payment is **Authorized** **and** Inventory is **Reserved**.
- Use **idempotencyKey** to prevent duplicate drafts/charges on repeat submit.
- On **Declined** or **Timeout**, release any reservation and surface retry/alternate options.
- On **Insufficient** or **Partial** stock, do not authorize; prompt adjust/backorder/split per config.
- **3DS Challenge** pauses the flow pending challenge completion.

## Preconditions
- Customer is signed in.
- Cart has ≥ 1 item; shipping address & method provided.
- Valid payment method token is available.

## Triggers
- Customer clicks **Confirm/Pay**.

## Expected Outcomes
- **Order Confirmed →** Confirmation email sent; Fulfillment job created.
- **Declined/Timeout/Insufficient/Partial →** No confirmation; actionable next steps shown (retry payment, adjust stock, complete 3DS).

## Non-Functional Requirements (testable qualities)
- Idempotent APIs with correlation IDs for traceability.
- Timeouts: Inventory ~5–10s; Payment ~30s.
- Clear, actionable messages for all failure paths.

---

## Unit/Component Tests (AAA)

### OrderService_createsDraft_withIdempotency()
- **Arrange:** cart + `idempotencyKey`.
- **Act:** submit checkout via Web → Order.
- **Assert:** draft created once; subsequent submits return same draft.

### Inventory_reservesAtomically_and_releasesOnFailure()
- **Arrange:** drafted order with items.
- **Act:** reserve; then simulate failure after reservation.
- **Assert:** reservation either fully held or released; no leaking holds.

### Payment_authorize_handlesApprovedDeclinedTimeoutChallenge()
- **Arrange:** reserved order.
- **Act:** authorize with gateway (simulate all outcomes).
- **Assert:** Approved/Declined/Timeout/Challenge states and next steps are correct.

### Order_confirms_only_when_ReservationOK_and_PaymentApproved()
- **Arrange:** combinations of (reservation OK/KO) × (auth Approved/Declined).
- **Act:** confirm.
- **Assert:** confirm succeeds **only** when (OK & Approved).

### Email_sends_on_confirmed_order()
- **Arrange:** confirmed order.
- **Act:** trigger post-confirm hooks.
- **Assert:** confirmation email requested exactly once.

### Fulfillment_creates_job_on_confirmed_order()
- **Arrange:** confirmed order with shippable items.
- **Act:** create fulfillment.
- **Assert:** one fulfillment job created with correct items/address.

### Reservation_released_on_decline_or_timeout()
- **Arrange:** reserved order.
- **Act:** simulate Declined/Timeout.
- **Assert:** reservation released and user prompted to retry.

---

## Integration/E2E Tests (AAA)

### happy_path_checkout_confirms_and_fulfills()
- **Arrange:** in-stock cart; valid token.
- **Act:** draft → reserve OK → authorize Approved → confirm.
- **Assert:** Order Confirmed; email sent; fulfillment job created.

### declined_payment_does_not_confirm_and_releases_reservation()
- **Arrange:** reserve OK; gateway Declined.
- **Act:** authorize.
- **Assert:** no confirmation; reservation released; retry options surfaced.

### insufficient_stock_prompts_adjustment()
- **Arrange:** inventory returns Insufficient/Partial.
- **Act:** attempt reserve.
- **Assert:** no auth call; UI shows adjust/backorder options.

### payment_timeout_releases_reservation_and_prompts_retry()
- **Arrange:** reserve OK; gateway Timeout.
- **Act:** authorize.
- **Assert:** reservation released; retry surfaced.

### duplicate_submit_single_charge_and_single_order()
- **Arrange:** two submits with same `idempotencyKey`.
- **Act:** call draft twice.
- **Assert:** one draft, one auth attempt; same result returned.

---

## Rejection/Edge Tests (AAA)

### address_validation_failure_blocks_confirm()
- **Arrange:** invalid shipping address.
- **Act:** attempt confirm.
- **Assert:** confirmation blocked; field-level errors returned.

### partial_stock_allows_split_shipment_option()
- **Arrange:** partial reservation allowed by config.
- **Act:** reserve returns Partial.
- **Assert:** UI offers split shipment; confirm only when policy satisfied.

### fraud_soft_decline_triggers_3DS_challenge_flow()
- **Arrange:** gateway returns Challenge.
- **Act:** authorize.
- **Assert:** UI shows 3DS step; flow paused until completion.

---

## System Acceptance Criteria (AAA)

### exactly_one_auth_and_no_duplicate_orders()
- **Arrange:** multiple submits with same `idempotencyKey`.
- **Act:** complete checkout.
- **Assert:** one captured auth; no duplicate orders.

### clear_next_steps_for_all_failures()
- **Arrange:** simulate Declined, Timeout, Insufficient, Partial.
- **Act:** run flows.
- **Assert:** user sees actionable guidance for each case.

### all_tests_pass_end_to_end()
- **Arrange:** full test suite.
- **Act:** run CI.
- **Assert:** all unit/integration tests green.

---

## Diagram Input — **TDD Sequence (Human-Readable)**

**Flow Title:** E-commerce Checkout  
**Methodology:** TDD  
**Diagram Type:** Sequence  
**Behavior Source:** Passing tests in this file  
**Primary Outcomes:** `Order Confirmed`, `Retry Payment`, `Adjust Stock`, `3DS Challenge`  
**Timers:** _None modeled (no message-level behavior added)_

### Test-Driven Interaction Outline (AAA cues)

**Step 0 — Start**
- **Assert preconditions:** signed-in customer; valid cart, shipping, payment token.

**Step 1 — Submit & Draft (Idempotent)**
- **Arrange:** cart + `idempotencyKey`.
- **Act:** **Customer UI → Web App:** submit checkout.  
  **Web App → Order Service:** CreateDraftOrder(`idempotencyKey`, cart).
- **Assert:** draft created or reused; no duplicate drafts.

**Step 2 — Reserve Inventory**
- **Arrange:** drafted order.
- **Act:** **Order Service → Inventory Service:** Reserve(items).  
  **Inventory Service → Order Service:** `ReservationResult = OK | Insufficient | Partial`.
- **Assert:** reservation state recorded.

**Branch A — Insufficient / Partial**
- **Arrange:** result = Insufficient or Partial.
- **Act:** **Order Service → Web App:** StockIssue(nextSteps).
- **Assert:** **Customer UI:** Show **Adjust Stock** options. **End.**

**Step 3 — Authorize Payment (only if Reservation OK)**
- **Arrange:** reservation OK.
- **Act:** **Order Service → Payment Gateway:** Authorize(amount, token, 3DS?).  
  **Payment Gateway → Order Service:** `Approved | Declined | Timeout | Challenge`.
- **Assert:** auth result captured.

**Branch B — Declined**
- **Arrange:** auth = Declined.
- **Act:** **Order Service → Inventory Service:** ReleaseReservation(items).  
  **Order Service → Web App:** PaymentDeclined(nextSteps).
- **Assert:** **Customer UI:** Show **Retry Payment**. **End.**

**Branch C — Timeout**
- **Arrange:** auth = Timeout.
- **Act:** **Order Service → Inventory Service:** ReleaseReservation(items).  
  **Order Service → Web App:** PaymentTimeout(nextSteps).
- **Assert:** **Customer UI:** Show **Retry Payment**. **End.**

**Branch D — 3DS Challenge**
- **Arrange:** auth = Challenge.
- **Act:** **Order Service → Web App:** Request3DSChallenge(challengeParams).
- **Assert:** **Customer UI:** Show **3DS Challenge**. **End (await completion).**

**Branch E — Approved (with Reservation OK)**
- **Arrange:** auth = Approved & reservation OK.
- **Act:**  
  - **Order Service → Order Service:** ConfirmOrder()  
  - **Order Service → Fulfillment Service:** CreateFulfillment(orderId, items, address)  
  - **Order Service → Email Service:** SendOrderConfirmation(orderId)  
  - **Order Service → Web App:** CheckoutResult(Confirmed, tracking)
- **Assert:** **Customer UI:** Show **Order Confirmed**. **End.**

**Idempotency Guard**
- **Arrange:** repeat submit with same `idempotencyKey`.
- **Act:** process request.
- **Assert:** reuse existing draft/flow; suppress duplicate auth; return current state.

### Parser Hints (for the app)
- Lines with **“A → B:”** are messages between participants (lifelines).
- **AAA cues** (Arrange/Act/Assert) indicate causal direction and expected outcomes.
- **Branch** sections map to **alt/opt** message fragments (not flowchart diamonds).
- **End** marks terminal outcomes for a branch.
