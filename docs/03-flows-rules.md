# Flows, Queue Rules & Test Checklist

All queue rules live in ONE shared module (`shared/queueRules.js`) used by both the frontend and the Express backend so every screen computes identical positions, wait times, and transitions.

---

## Main Flows

### Flow 1: Remote Customer
1. Customer opens Home (`/`) -> checks live wait time -> taps `[ Join Queue ]`.
2. On `/join`, enters Name & 10-digit Phone, selects up to 3 services (e.g. Haircut + Beard Trim) and chooses a preferred barber or `'Any barber'`. Live summary updates total minutes, price (`₹`), and expected wait.
3. Taps `[ Confirm ]` -> receives token `S-14` -> automatically redirected to My Status (`/status/S-14`).
4. Watches live countdown from home. When they reach **2nd in line** (or 1st while waiting), sees `'Start coming to the salon'` banner.
5. Receptionist taps `[ Call next ]` on Amit's card -> `S-14` changes to `Called` and is assigned to Amit.
6. Within 5 seconds, customer's phone shows the full-screen gold `'It's your turn! Go to Amit'` screen (pulse + vibration), and the Waiting Area TV flashes `S-14` in gold with a chime.
7. Customer sits down -> Amit taps `[ Start ]` (`In chair`), then `[ Done ]` (`Done`) -> `S-14` leaves the active queue and waiting times for remaining customers drop automatically.

### Flow 2: Walk-In Customer
1. Customer walks into the salon (even if online joining is closed).
2. Receptionist taps `[ + Add walk-in ]` on `/reception` -> enters name, 10-digit phone, services (max 3), and preferred barber -> submits.
3. Walk-in customer receives the next sequential token and joins the **same queue at the END** (strict first come, first served).

---

## Statuses & Allowed Transitions

Statuses move **forward only — never backwards**:
- `Waiting` -> `Called` -> `In chair` -> `Done`
- `Waiting` -> `Cancelled`
- `Called` -> `No-show`

Invalid transitions (e.g., `Done` -> `Waiting`, `In chair` -> `Waiting`, `Cancelled` -> `Called`) are rejected by the queue engine.

---

## Queue & Barber Assignment Rules

1. **First Come, First Served (FIFO):** Waiting customers are always ordered by their queue sequence / join timestamp.
2. **Barber Preference Matching:** `[ Call next ]` for barber `X` selects the **earliest** `Waiting` customer whose `preferredBarberId` is `X` OR `'any'`.
3. **Strict Preference Protection:** A customer who explicitly chose `Ravi` is **never** assigned to `Amit` or `Imran`.
4. **One Customer Per Chair:** A barber can have at most ONE active customer (`Called` or `In chair`) at any time. `[ Call next ]` is disabled if the barber already has a customer, is `onBreak`, or is not `onDuty`.
5. **One Active Spot Per Phone Number:** If a 10-digit phone number already has an active ticket (`Waiting`, `Called`, or `In chair`), submitting Join Queue returns their **existing spot** without creating a duplicate token.
6. **Service Limit:** A customer must select between 1 and 3 active services per visit.

---

## Waiting-Time Rule

Let `workingBarbers` = count of barbers who are `onDuty === true && onBreak === false` (minimum `1` in denominator to prevent division by zero).

- **Remaining chair time** for each active barber (`Called` or `In chair`):
  - If `Called`: full `totalMinutes` of that ticket.
  - If `In chair`: `max(1, totalMinutes - elapsedMinutesSinceStart)`.
- **For a customer choosing `'Any barber'`:**
  - `waitingAheadMins` = sum of `totalMinutes` of all `Waiting` customers ahead of them.
  - If there are 0 customers ahead and at least one working barber is currently free -> `0 min` (ready now).
  - If there are 0 customers ahead and all working barbers are busy -> `min(remainingChairTimes)` of busy working barbers.
  - Otherwise -> `Math.ceil((sumOfWorkingBarbersRemainingMins + waitingAheadMins) / workingBarbers)`.
- **For a customer choosing a specific barber `B`:**
  - `remainingB` = remaining minutes of barber `B`'s current customer (`0` if free).
  - `aheadForB` = sum of `totalMinutes` of all `Waiting` customers ahead of them who specifically chose `B`.
  - `aheadAnyShare` = `Math.floor(sumOfWaitingAheadAnyMins / workingBarbers)`.
  - `estimatedWait = remainingB + aheadForB + aheadAnyShare`.
  - If `B` is on break, add a minimum buffer of 10 min and display the `'Ravi is on break'` alert banner.

This guarantees that whenever customers are ahead in line, the estimated wait is strictly positive and drops smoothly as customers finish.

---

## No-Show, Cancel, Break & Closing Rules

- **No-Show Rule:** When a customer is `Called` and does not arrive within **10 minutes**, the receptionist can mark them `No-show` (the dashboard shows a live called timer and highlights at >= 10 min; receptionist can also confirm early no-show if customer explicitly leaves).
- **Re-adding a No-Show:** If a `No-show` customer arrives later and is re-added (either via `[ Re-add to end ]` or `/join`), they are placed at the **END** of the queue with a **new token** (e.g. `S-20`), never back at the top.
- **Cancel Rule:** A `Waiting` customer can cancel from My Status (with confirmation modal) or be cancelled by the receptionist. Their status becomes `Cancelled` and they leave the queue immediately.
- **Waiting > 60 Minutes:** On the Reception Dashboard, any `Waiting` customer who has waited more than 60 minutes is visually highlighted in **amber**.
- **Online Joining Cutoff:** Online joining via `/` and `/join` closes automatically when the owner flips the Queue Switch to `Closed` OR within **30 minutes before closing time** (default closing time `21:00`, so online cutoff is `20:30`). Walk-ins added via `/reception` are still allowed.
- **Barber On Break:** When barber `X` toggles `On break`, customers who specifically chose `X` see `'X is on break'` on My Status and Join Queue, and `Call next` is disabled for `X`.

---

## Test Checklist

- [x] **1. Multi-service total & limit:** Join with 2 services (e.g. Haircut 30m ₹150 + Beard Trim 15m ₹80) -> live summary shows `45 min` and `₹230`; attempting a 4th service is blocked. *(Verified via unit test + live browser QA)*
- [x] **2. Phone validation & no duplicates:** Invalid phone (<10 digits) is rejected; submitting the same 10-digit phone twice redirects to the existing active spot without creating a duplicate token. *(Verified via unit test + live browser QA)*
- [x] **3. Barber preference respected:** Customer A chooses `Ravi`, Customer B (behind A) chooses `'Any'`. Tapping `[ Call next ]` for `Amit` skips Customer A and calls Customer B. *(Verified via unit test + live browser QA)*
- [x] **4. Live 'It's your turn!' alert:** Tapping `[ Call next ]` on Reception updates the customer's My Status window to the full-screen gold `'It's your turn!'` screen within 5 seconds. *(Verified via live sync + SSE/polling)*
- [x] **5. Barber Start/Done sync:** Tapping `[ Start ]` and `[ Done ]` on Barber View updates Reception Dashboard, Waiting Area TV, and My Status within 5 seconds. *(Verified via live browser QA)*
- [x] **6. No-show & Re-add to end:** Marking a `Called` customer as `No-show` frees the barber; re-adding that customer appends them to the **END** of the waiting list with a **new token**. *(Verified via unit test)*
- [x] **7. Close online queue:** Flipping the Queue Switch to `Closed` in Owner Settings disables the `[ Join Queue ]` button with a clear message, while Reception `[ + Add walk-in ]` still works. *(Verified via unit test + live browser QA)*
- [x] **8. Bilingual Gujarati toggle:** Switching to Gujarati (`ગુજ`) translates all labels across all 7 screens cleanly with no text overflow and >=44px tap targets on phone screens. *(Verified via live browser QA)*
- [x] **9. Decreasing wait time:** Completing a customer (`Done`) reduces the estimated wait time shown for remaining waiting customers on Home and My Status. *(Verified via unit test)*
- [x] **10. Multi-window sync & Barber on break:** Opening Phone (`/status/:id`), Tablet (`/reception`), Barber (`/barber/ravi`), and TV (`/display`) simultaneously keeps all 4 windows in sync, and toggling `Ravi` On Break shows `'Ravi is on break'` to customers waiting for Ravi. *(Verified via SSE + unit test + live browser QA)*
