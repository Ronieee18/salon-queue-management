# Screens & Features Specification

All screens share the dark charcoal (`#1F2937` / `#111827`) + gold (`#D4A017`) theme, rounded cards, an English / Gujarati (`EN / ગુજ`) language toggle in the header, and minimum 44px touch targets on mobile. Staff screens (`/reception`, `/barber`, `/admin`) are protected by a simple 4-digit test PIN (`1234`) that stays unlocked for the browser session.

---

## Screen 1: Home (`/`)
- **Who uses it & why:** Customers checking current wait times before walking in or joining remotely.
- **UI elements (top to bottom):**
  1. Top header: Royal Cuts Salon logo & name, `'Open · Closes 9 PM'` (or `'Online Queue Closed'`) status pill, EN/GU language toggle, and a subtle Staff Portal menu button.
  2. Hero Live Status Card: large live queue summary (`'6 people waiting · about 50 min'`), active barbers count, and sync badge.
  3. Barber Status Chips row: horizontal wrap of on-duty barbers with status dots — e.g. `Ravi (busy)` · `Amit (free)` · `Imran (on break)`.
  4. Primary CTA: full-width gold button `[ Join Queue ]` (min 52px tall).
  5. Active Token quick link (if user already joined on this device) + lookup by phone link.
- **Button behavior:**
  - `[ Join Queue ]` -> navigates to `/join`. Disabled with clear notice when online joining is closed or within 30 minutes of closing time.
  - `[ View My Token ]` -> jumps straight to `/status/:id`.
- **Responsive look:** Single-column centered mobile-first layout (`max-w-md` on desktop/phone), generous spacing.
- **Empty & error states:**
  - 0 people waiting: friendly badge `'No one waiting — walk right in!'` with `~0 min` wait.
  - All barbers off-duty / queue closed: amber notice explaining online joining is closed and walk-ins are welcome at reception.

---

## Screen 2: Join Queue (`/join`)
- **Who uses it & why:** Remote or in-salon customers reserving their queue token from their phone.
- **UI elements (top to bottom):**
  1. Header with back arrow to `/`, page title `'Join Queue'`, and EN/GU toggle.
  2. Customer Details card: Full Name input and 10-digit Mobile Number input (numeric keypad on mobile, instant validation).
  3. Service Selection grid: selectable rounded cards showing EN/GU name, duration (`30 min`), and price (`₹150`). Displays counter `Selected: X / 3`.
     - Only active services enabled in Owner Settings are listed.
     - Attempting to pick a 4th service shows inline notice `'Maximum 3 services allowed'`.
  4. Barber Picker: `'Any barber (fastest)'` highlighted card + individual on-duty barber avatar cards showing name, specialty, and live status (`Free`, `Busy`, `On break`). Selecting an on-break barber shows a gentle warning (`'Ravi is currently on break'`).
  5. Sticky Bottom Summary bar: `'Total 45 min · ₹230 · Expected wait ~35 min'` + big gold `[ Confirm ]` button.
- **Button behavior:**
  - Service card tap -> toggles service (enforcing max 3) and recalculates total time, price, and estimated wait immediately.
  - `[ Confirm ]` -> validates name, 10-digit phone, and >=1 service. Creates token (`S-1`, `S-2`, …) or redirects to existing active token if phone number is already in queue (no duplicate). Navigates to `/status/:id`.
- **Responsive look:** Mobile-first 2-column service grid on phones, 3-column on wider screens, sticky bottom action bar so `[ Confirm ]` is always reachable with one thumb.
- **Empty & error states:**
  - Invalid phone -> inline red validation message (`'Enter a valid 10-digit mobile number'`).
  - Online queue closed -> replaces form CTA with clear closed message and link back to Home.
  - No active services -> friendly notice to contact reception.

---

## Screen 3: My Status (`/status/:id`)
- **Who uses it & why:** Customers monitoring their queue position and waiting for their turn alert.
- **UI elements (top to bottom):**
  1. Header with back to Home, token reference, and EN/GU toggle.
  2. Alert Banner (conditional):
     - If chosen barber is on break: amber alert `'Ravi is on break — your turn will resume once they return'`.
     - When **2nd in line** (or 1st in line while Waiting): pulsing gold-trimmed banner `'Start coming to the salon'`.
  3. Token & Position Hero Card: giant gold token `'S-14'`, ordinal position `'4th in line'`, assigned/preferred barber pill, and status badge.
  4. Circular Countdown Ring: animated SVG progress circle showing `'about 35 min'` that automatically updates within 5 seconds as customers ahead complete.
  5. Booking Summary Card: chosen services list, total duration, and total ₹ price.
  6. Footer action: `[ Cancel my spot ]` outlined danger button (only while `Waiting`).
  7. **Full-Screen Called Overlay** (when status === `Called`):
     - Full-screen vibrant gold background (`#D4A017`), bold charcoal text `'It's your turn! Go to Ravi'`, large token `'S-14'`, gentle pulse animation, and `navigator.vibrate` pulse on mobile devices.
     - Dismiss/minimize toggle to view ticket details while staying highlighted.
- **Button behavior:**
  - `[ Cancel my spot ]` -> opens confirmation modal pop-up; confirming changes status to `Cancelled`.
- **Responsive look:** Mobile-first centered card layout optimized for one-hand viewing on a phone screen.
- **Empty & error states:**
  - Unknown token ID -> `'Token not found'` card with button to return Home.
  - Status `In chair` -> `'You're in the chair with Ravi'` with live session timer.
  - Status `Done` -> `'All done! Thanks for visiting Royal Cuts Salon'` + Home button.
  - Status `Cancelled` or `No-show` -> clear status badge + `[ Join Queue Again ]` button.

---

## Screen 4: Reception Dashboard (`/reception`) — Tablet Landscape
- **Who uses it & why:** Salon receptionist coordinating barbers, calling next customers, adding walk-ins, and handling no-shows.
- **UI elements:**
  1. Top Bar: Salon title, live clock, queue summary count, `[ + Add walk-in ]` gold button, quick links to `/display` (TV) and `/admin` (Owner), EN/GU toggle.
  2. **Barber Cards Row (3-column grid on tablet/desktop)**:
     - Each on-duty barber card shows avatar, name, status badge (`Free` / `Busy` / `Called` / `On Break`), current customer token & name, services, **time-left progress bar** (remaining min / total min), and big `[ Call next ]` gold button.
     - If a customer is currently `Called` for that barber: shows elapsed minutes since called (highlighting 10-min window) and `[ No-show ]` button right on the card.
  3. **Waiting List Panel** (ordered strictly FIFO):
     - Rows showing: Position `#`, Token (`S-14`), Customer Name & Phone, Services pills, Preferred Barber badge, Live Waiting Time (`18 min`).
     - Any customer waiting **> 60 min** is highlighted with an **amber** row tint and amber clock badge.
     - Row action buttons: `[ Cancel ]` (for Waiting) and `[ No-show ]` (for Called).
  4. **Recent No-Shows Drawer/Section**: lists today's No-show customers with a one-click `[ Re-add to end ]` button that appends them to the END of the queue with a brand-new token.
  5. **Add Walk-in Modal**: quick form (Name, 10-digit Phone, up to 3 Services, Preferred Barber) — works even when online joining is closed.
- **Button behavior:**
  - `[ Call next ]` -> finds earliest Waiting customer who chose this barber or `'Any'`, marks them `Called` and assigns them to this barber.
  - `[ No-show ]` -> marks a `Called` customer as `No-show` and frees the barber.
  - `[ Cancel ]` -> cancels a `Waiting` customer after confirmation.
  - `[ + Add walk-in ]` -> opens modal and appends walk-in to the end of the queue.
- **Responsive look:** Designed for 10-inch tablet in landscape (3-column barber row on top, full waiting list below/side-by-side); stacks cleanly on phone screens.
- **Empty & error states:**
  - Empty waiting list: `'No one waiting — walk right in!'` illustration/card.
  - `[ Call next ]` disabled with tooltip if barber is busy, on break, or no matching waiting customer exists.

---

## Screen 5: Barber View (`/barber/:name` and `/barber`) — Phone
- **Who uses it & why:** Individual barber keeping track of their current chair, timing the haircut, and taking breaks on their phone.
- **UI elements (top to bottom):**
  1. Top bar: Barber selector pills (quick switch between Ravi / Amit / Imran), salon logo, EN/GU toggle.
  2. Status Toggle Banner: large pill switch **Available / On Break** (immediately notifies waiting customers who picked this barber).
  3. Current Customer Card:
     - Token (`S-12`), Customer Name, Services list, total duration, and live running timer (`08:24 elapsed`) since `[ Start ]`.
     - Huge thumb-friendly action buttons (min 56px height):
       - When customer is `Called`: gold `[ Start ]` button (plus secondary `[ No-show ]` option).
       - When customer is `In chair`: emerald/gold `[ Done ]` button.
       - When chair is empty: friendly `'Chair is free'` state + `[ Call Next ]` shortcut button if an eligible customer is waiting.
  4. `'Next for you'` Card: previews the very next eligible waiting customer for this barber — e.g. `'Next for you: S-15 Kunal (Haircut)'` — or `'No customers waiting for you'`.
- **Button behavior:**
  - `[ Start ]` -> moves current customer from `Called` -> `In chair`, starts session timer, updates Reception & TV within 5s.
  - `[ Done ]` -> moves current customer from `In chair` -> `Done`, frees barber, decrements wait times everywhere within 5s.
  - `Available / On Break` toggle -> updates barber status across Home, My Status, Reception, and TV.
- **Responsive look:** Dedicated single-column mobile phone layout (`max-w-md`), oversized tap targets for wet/busy hands.
- **Empty & error states:**
  - Barber marked Off Duty in Owner Settings -> displays `'You are marked off duty today'` notice.
  - Unknown barber name in URL -> displays barber chooser cards.

---

## Screen 6: Waiting Area TV (`/display`) — TV / Large Screen
- **Who uses it & why:** Mounted waiting-area TV readable from 5 metres away so customers can see who is currently in each chair and who is up next.
- **UI elements:**
  1. High-contrast Header: Salon Name & Gold Emblem, live clock, active chime toggle button (`Sound On / Tap to enable chime`), EN/GU toggle.
  2. Left Column (60% width): **Now Serving — Row per on-duty barber**:
     - Large circular avatar, bold Barber Name, status badge (`In Chair` / `Called` / `Available` / `On Break`), and giant high-contrast token display (`Now: S-12`).
     - Newly-called token row **flashes bright gold** with an animated pulse and plays a pleasant two-tone Web Audio chime!
  3. Right Column (40% width): **Up Next (Next 5 Tokens)**:
     - Clean numbered cards for the next 5 waiting tokens showing giant Token (`S-14`), first name, preferred barber pill (`Any` or `Ravi`), and estimated wait (`~15 min`).
- **Responsive look:** Full-viewport (`100vh`) landscape dark layout with giant legible typography (`text-3xl` to `text-6xl`), zero clutter; adapts gracefully on smaller viewports.
- **Empty & error states:**
  - Empty queue: large welcoming banner `'No one waiting — walk right in!'` + QR/URL hint to join from phone.

---

## Screen 7: Owner Settings (`/admin`)
- **Who uses it & why:** Salon owner managing daily operations, services, staff roster, online queue availability, and viewing daily performance metrics.
- **UI elements (top to bottom):**
  1. Header: `'Owner Settings'`, quick links to Reception & Home, EN/GU toggle.
  2. **Today's Stats Cards** (4-card grid): Customers Served, Average Wait (min), No-Shows, Currently Waiting.
  3. **Online Queue Control Card**: big Open / Closed switch for online joining, closing time selector (default `21:00` / `9:00 PM`, noting 30-min automatic cutoff before closing), and a `'Reset Demo Data'` utility button.
  4. **Barbers on Duty Today**: list of barbers with On Duty toggle switch (off-duty barbers are hidden from Join & TV) and current status pill (`Free` / `Busy` / `On Break`).
  5. **Services Management List**: each service shows English name, Gujarati name, duration (min), price (`₹`), edit button, and an **Active On/Off toggle** (turning off immediately hides it from `/join`). Includes `[ + Add Service ]` inline form.
- **Button behavior:**
  - Service toggle -> immediately enables/disables service on `/join`.
  - Barber on-duty toggle -> immediately updates Home, Join, Reception, and TV.
  - Queue switch -> immediately enables/disables online joining on `/` and `/join` (walk-ins remain enabled on `/reception`).
- **Responsive look:** 2-column desktop/tablet layout, clean stacked cards on mobile with >=44px switches.
- **Empty & error states:**
  - Validation prevents saving a service with empty name, <=0 minutes, or negative price.
