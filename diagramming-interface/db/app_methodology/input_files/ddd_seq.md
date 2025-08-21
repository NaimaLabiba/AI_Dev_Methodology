# DDD — Sequence: E-commerce Checkout

## Purpose
Express the **domain interactions** and message flow for checkout using Domain-Driven Design. Unlike BDD (user viewpoint), this focuses on **commands, events, aggregates, and bounded contexts**, producing a **sequence-diagram-friendly** (human-readable) input.

## Scope
Single merchant, single currency. Synchronous card authorization during checkout. Inventory reservation occurs before payment confirmation. **No SLA timers are modeled** in this sequence (timers that don’t add messages stay out of the diagram).

## Domain Roles (Participants)
- **Customer UI**
- **Web App**
- **Order Service** (Commerce BC; `Order` aggregate)
- **Inventory Service** (Inventory BC)
- **Payment Gateway** (Payments BC)
- **Fulfillment Service** (Fulfillment BC)
- **Email Service** (Notifications BC)

## Ubiquitous Language
- **OrderState:** `Draft`, `Pending`, `Confirmed`, `Backorder`, `Cancelled`
- **ReservationStatus:** `Reserved`, `Insufficient`, `Partial`, `Released`
- **AuthResult:** `Approved`, `Declined`, `Timeout`, `Challenge`
- **IdempotencyKey:** client-supplied key that collapses duplicate submits into one draft/charge attempt

## Bounded Contexts
- **Commerce** (Order aggregate & confirmation policy)
- **Inventory** (reservations & releases)
- **Payments** (authorization & challenges)
- **Fulfillment** (job creation)
- **Notifications** (transactional email)

## Aggregates & Invariants
**Aggregate Root:** `Order`  
**Invariant:** `Order` **cannot** transition to `Confirmed` unless `ReservationStatus = Reserved` **and** `AuthResult = Approved`.  
**Emitted Events (examples):** `OrderDrafted`, `StockReserved`, `ReservationFailed`, `ReservationPartial`, `PaymentAuthorized`, `PaymentDeclined`, `PaymentTimeout`, `OrderConfirmed`, `FulfillmentCreated`, `ConfirmationSent`.

## Commands
`CreateDraftOrder`, `ReserveStock`, `AuthorizePayment`, `ConfirmOrder`, `CreateFulfillment`, `SendOrderConfirmation`, `ReleaseReservation`.

## Preconditions
- Customer signed in
- Cart has ≥ 1 item
- Shipping address & method provided
- Valid payment method token available

## Triggers
- Customer clicks **Confirm/Pay** at checkout.

## Business Policies & Rules
- **Confirm only if** `Reserved` **and** `Approved`.
- Use **IdempotencyKey** to prevent duplicate drafts/charges.
- On `Declined` or `Timeout`, **ReleaseReservation** and keep order `Pending` with next steps.
- On `Insufficient` or `Partial`, do not authorize; propose adjust/backorder/split per config.
- 3DS **Challenge** pauses confirmation until the challenge completes.

## Non-Functional Requirements (domain-adjacent)
- Idempotent operations with correlation IDs
- Timeouts: Inventory ~5–10s; Payment ~30s; safe retries where applicable
- Clear, actionable error semantics to the Web App

## Acceptance Criteria
- No `OrderConfirmed` unless both **Reserved** and **Approved**
- Duplicate submits never create duplicate orders/charges
- Failure paths surface explicit next steps (retry, adjust stock, 3DS)

---

## Diagram Input — **DDD Sequence (Human-Readable)**

**Flow Title:** E-commerce Checkout  
**Methodology:** DDD  
**Diagram Type:** Sequence  
**Primary Outcomes:** `Order Confirmed`, `Retry Payment`, `Adjust Stock`, `3DS Challenge`

### Domain Interaction Story (Commands → Events → State)

**Step 0 — Start**
- *Given* a signed-in customer with cart, shipping, and payment token ready.

**Step 1 — Create Draft (Idempotent)**
- **Customer UI → Web App:** Submit checkout (cart, shipping, paymentMethod, **idempotencyKey**).
- **Web App → Order Service:** **Command:** `CreateDraftOrder(idempotencyKey, cart)`.
- **Order Service:** **Event:** `OrderDrafted(orderId)`; **State:** `Draft` (or return existing draft if key matches).

**Step 2 — Reserve Stock**
- **Order Service → Inventory Service:** **Command:** `ReserveStock(orderId, items)`.
- **Inventory Service → Order Service:** **Event:** `StockReserved` | `ReservationFailed` | `ReservationPartial`.

**Branch A — ReservationFailed / ReservationPartial**
- **Order Service → Web App:** StockIssue(nextSteps = adjust/backorder/split).
- **Web App → Customer UI:** Show **Adjust Stock** options. **End (no authorization attempted).**

**Step 3 — Authorize Payment (if Reserved)**
- **Order Service → Payment Gateway:** **Command:** `AuthorizePayment(orderId, amount, token, threeDS?)`.
- **Payment Gateway → Order Service:** **Event:** `PaymentAuthorized` | `PaymentDeclined` | `PaymentTimeout` | `Challenge`.

**Branch B — PaymentDeclined**
- **Order Service → Inventory Service:** **Command:** `ReleaseReservation(orderId)`.
- **Order Service → Web App:** PaymentDeclined(nextSteps = retry/alt method).
- **Web App → Customer UI:** Show **Retry Payment**. **End.**

**Branch C — PaymentTimeout**
- **Order Service → Inventory Service:** **Command:** `ReleaseReservation(orderId)` (if reserved).
- **Order Service → Web App:** PaymentTimeout(nextSteps = retry).
- **Web App → Customer UI:** Show **Retry Payment**. **End.**

**Branch D — Challenge (3DS)**
- **Order Service → Web App:** ChallengeRequired(challengeParams).
- **Web App → Customer UI:** Show **3DS Challenge**. **End (await completion).**

**Branch E — PaymentAuthorized (with Reserved)**
- **Order Service → Order Service:** **Command:** `ConfirmOrder(orderId)`  
  **Checks Invariant:** `Reserved && Approved` → ok.
- **Order Service:** **Event:** `OrderConfirmed(orderId)`; **State:** `Confirmed`.
- **Order Service → Fulfillment Service:** **Command:** `CreateFulfillment(orderId, items, address)` → **Event:** `FulfillmentCreated`.
- **Order Service → Email Service:** **Command:** `SendOrderConfirmation(orderId)` → **Event:** `ConfirmationSent`.
- **Order Service → Web App:** CheckoutResult(status = Confirmed, nextSteps = tracking).
- **Web App → Customer UI:** Show **Order Confirmed**. **End.**

**Idempotency Guard**
- On duplicate submit with same **idempotencyKey**, the Web App and Order Service **reuse the existing draft/flow**, suppress duplicate authorization and respond with the current state + next steps.

### Parser Hints (for the app)
- Lines with **“A → B:”** denote messages between participants (lifelines).
- **“Command:”** labels domain commands; **“Event:”** labels domain events; **“State:”** labels aggregate state after handling.
- **Branches** represent **alt/opt** combined fragments (message-level conditions), not flowchart diamonds.
- **End** marks terminal outcomes for a branch.
