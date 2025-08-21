# SDD — Sequence: E-commerce Checkout

## Purpose
System Design Document for the checkout interaction. Describes system roles, interfaces, operational policies, and a **sequence-diagram-friendly input** in SDD style. Focus is on reliability, idempotency, and clear message flow.

## Scope
Single merchant, single currency. Synchronous card authorization during checkout. Inventory reservation occurs before confirmation. **No SLA timers are modeled** in this sequence (timers that don’t add messages are documented elsewhere, not drawn).

## Participants (System Roles)
- **Customer UI**
- **Web App**
- **Order Service** (draft, confirm)
- **Inventory Service** (reserve, release)
- **Payment Gateway** (authorize, challenge/3DS)
- **Fulfillment Service** (create job)
- **Email Service** (send confirmation)

## Business Policies & Rules
- Confirm **only if** Payment **Authorized** **and** Inventory **Reserved**.
- **IdempotencyKey** collapses duplicate submits (no double draft/charge).
- On **Declined** or **Timeout**, release any reservation; surface retry/alt payment.
- On **Insufficient** or **Partial**, do not authorize; prompt adjust/backorder/split (per config).
- **3DS Challenge** pauses the interaction until the challenge completes.

## Preconditions
- Customer signed in; cart has ≥ 1 item.
- Shipping address & method provided; valid payment token present.

## Triggers
- Customer clicks **Confirm / Pay**.

## Expected Outcomes
- **Order Confirmed →** Confirmation email sent; Fulfillment job created.
- **Declined/Timeout/Insufficient/Partial →** No confirmation; actionable next steps (retry, adjust stock, 3DS).

## Non-Functional Requirements (System Qualities)
- **Observability:** audit logs, correlation IDs, metrics on failures.
- **Idempotency:** draft/authorize/confirm are idempotent operations.
- **Timeouts/Retries:** Inventory ~5–10s; Payment ~30s; safe retries with backoff.
- **A11y & UX:** clear error semantics; accessible UI.

## API Contracts (Brief)
These are concise descriptions (not full schemas) of the key endpoints.

- **POST `/orders/draft`**  
  Create or reuse an order draft (idempotent by `idempotencyKey`).  
  **Body:** `{ cart, customerId, idempotencyKey }`  
  **Returns:** `{ orderId, state }`

- **POST `/inventory/reserve`**  
  Attempt to hold stock for the order.  
  **Body:** `{ orderId, items[] }`  
  **Returns:** `{ status: "OK"|"Insufficient"|"Partial", details? }`

- **POST `/payments/authorize`**  
  Request card authorization; may return a 3DS challenge.  
  **Body:** `{ orderId, amount, token, threeDS? }`  
  **Returns:** `{ result: "Approved"|"Declined"|"Timeout"|"Challenge", params? }`

- **POST `/orders/confirm`**  
  Confirm order when both reservation and authorization succeeded.  
  **Body:** `{ orderId }`  
  **Returns:** `{ state: "Confirmed" }`

- **POST `/fulfillment/create`**  
  Create fulfillment job for a confirmed order.  
  **Body:** `{ orderId, items, address }`  
  **Returns:** `{ fulfillmentId }`

- **POST `/emails/order-confirmation`**  
  Send transactional confirmation email.  
  **Body:** `{ orderId, to }`  
  **Returns:** `{ messageId }`

## Operational Policies
- **No confirm without both prerequisites** (Reserved & Approved).
- **Release reservations on payment failure or timeout.**
- **Surface next steps** to the UI for every failure path.

## Failure / Edge Handling
- Payment timeout → release reservation; show retry.
- Partial/Insufficient stock → suggest adjust/backorder/split; skip auth.
- Duplicate submit → blocked by idempotency; reuse draft.
- Address validation error → return structured field errors.
- 3DS challenge → pause flow; resume after completion.

## Acceptance Criteria (System)
- Exactly one captured authorization; no duplicate orders/charges.
- Confirm only when prerequisites met; all steps carry trace IDs.
- Failure paths consistently produce actionable guidance to the UI.

---

## Diagram Input — **SDD Sequence (Human-Readable)**

**Flow Title:** E-commerce Checkout  
**Methodology:** SDD  
**Diagram Type:** Sequence  
**Primary Outcomes:** `Order Confirmed`, `Retry Payment`, `Adjust Stock`, `3DS Challenge`  
**Timers:** _None modeled in this interaction_

### System Interaction Story (Services → Messages → Effects)

**Step 0 — Start**
- **Precheck:** signed-in customer; valid cart, shipping, payment token.

**Step 1 — Submit & Draft (Idempotent)**
- **Customer UI → Web App:** Submit checkout (cart, shipping, paymentMethod, **idempotencyKey**).
- **Web App → Order Service:** CreateDraftOrder(idempotencyKey, cart).
- **Effect:** draft created or reused; `orderId` returned.

**Step 2 — Reserve Inventory**
- **Order Service → Inventory Service:** Reserve(items).
- **Inventory Service → Order Service:** `ReservationResult = OK | Insufficient | Partial`.

**Branch A — Insufficient / Partial**
- **Order Service → Web App:** StockIssue(nextSteps = adjust/backorder/split).
- **Web App → Customer UI:** Show **Adjust Stock** options. **End.**

**Step 3 — Authorize Payment (only if Reservation OK)**
- **Order Service → Payment Gateway:** Authorize(amount, token, 3DS?).
- **Payment Gateway → Order Service:** `Approved | Declined | Timeout | Challenge`.

**Branch B — Declined**
- **Order Service → Inventory Service:** ReleaseReservation(orderId).
- **Order Service → Web App:** PaymentDeclined(nextSteps = retry/alt method).
- **Web App → Customer UI:** Show **Retry Payment**. **End.**

**Branch C — Timeout**
- **Order Service → Inventory Service:** ReleaseReservation(orderId).
- **Order Service → Web App:** PaymentTimeout(nextSteps = retry).
- **Web App → Customer UI:** Show **Retry Payment**. **End.**

**Branch D — 3DS Challenge**
- **Order Service → Web App:** Request3DSChallenge(params).
- **Web App → Customer UI:** Show **3DS Challenge** step. **End (await completion).**

**Branch E — Approved (with Reservation OK)**
- **Order Service → Order Service:** ConfirmOrder(orderId) (policy: Reserved & Approved required).
- **Order Service → Fulfillment Service:** CreateFulfillment(orderId, items, address).
- **Order Service → Email Service:** SendOrderConfirmation(orderId).
- **Order Service → Web App:** CheckoutResult(Confirmed, tracking).
- **Web App → Customer UI:** Show **Order Confirmed**. **End.**

**Idempotency Guard**
- Repeated submit with the same **idempotencyKey** reuses draft/flow; suppress duplicate auth; return current state and next steps.

### Parser Hints (for the app)
- Lines with **“A → B:”** are message exchanges (lifelines).
- **Branch** sections represent **alt/opt** message conditions (not flowchart diamonds).
- **End** marks a terminal outcome for that path.
