# Royal Cuts Salon — Project Brief & Scope

## Problem
On weekends and busy evenings, salon customers wait 1–2 hours in the shop without knowing how long their turn will take. Some walk out in frustration, while others argue over who arrived first or which barber is next.

## Users
- **Customers** — browse live wait times, join the queue from their phone, and track their turn from home or nearby.
- **Receptionist** — manages the queue on a tablet, adds walk-in customers, calls the next eligible customer for each barber, and handles cancellations or no-shows.
- **Barbers** — see their current customer on their phone, start/finish sessions, preview who is next for them, and toggle On Break / Available.
- **Salon Owner** — configures services (EN/GU names, durations, prices), manages which barbers are on duty, opens/closes online joining, and reviews today's stats.

## Must-have features
1. **Live Salon Home (`/`)** — open/closed badge, live queue count & estimated wait, barber availability chips, and one-tap Join Queue button.
2. **Join Queue from Phone (`/join`)** — name + 10-digit validated phone, multi-select service cards (up to 3), preferred barber or 'Any barber (fastest)', and real-time duration/price/wait summary.
3. **Live Customer Status (`/status/:id`)** — large token badge (`S-14`), live queue position, circular wait countdown, `'Start coming to the salon'` alert when 2nd in line, full-screen gold `'It's your turn!'` alert with pulse and vibration when called, and self-cancel with confirmation.
4. **Receptionist Dashboard (`/reception`)** — landscape tablet layout with 3-column barber cards (current customer + time-left progress bar + Call Next), FIFO waiting list with >60 min amber warning, quick Add Walk-in form, No-show, Re-add, and Cancel actions.
5. **Barber Mobile View (`/barber/:name`)** — current customer details, live session timer, big `[ Start ] -> [ Done ]` buttons, `'Next for you'` preview, and Available / On Break toggle.
6. **Waiting-Area TV Display (`/display`)** — high-contrast 5-metre readable screen showing each barber's current token (`Now: S-12`), Up Next list of 5 tokens with wait times, and gold flash + audio chime when a new token is called.
7. **Owner Settings (`/admin`)** — services management (EN/GU names, minutes, price ₹, active toggle), barbers on duty today, online queue Open/Closed toggle, and today's stats (served, average wait, no-shows).
8. **Bilingual EN / Gujarati (`EN / ગુજ`) & Real-Time Sync** — instant language toggle across all screens and <5-second synchronization across phone, tablet, and TV windows/devices.

## Don't build
- Online payments or UPI checkout
- Future-date scheduled appointments or calendar booking
- SMS or WhatsApp messaging integrations
- Loyalty points, memberships, or discount coupons
- Multiple salon branches or franchise management

## Look & feel
Premium modern salon aesthetic: dark charcoal surfaces (`#1F2937` / `#111827`) with warm gold accents (`#D4A017`), rounded cards, clean typography, mobile-first touch targets (>=44px), and complete English & Gujarati labels.
