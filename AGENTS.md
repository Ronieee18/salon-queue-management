# AGENTS.md — Salon Queue Management

Queue app for **Royal Cuts Salon** (રોયલ કટ્સ સલૂન): customers join from their phone, track live wait times, and get called; reception and barbers manage the queue; waiting-area TV displays live status.

## Read first
- `docs/01-brief.md` -> problem, users, must-have features, and what NOT to build
- `docs/02-screens.md` -> every screen's layout, buttons, responsive look, and empty/error states
- `docs/03-flows-rules.md` -> end-to-end flows, queue rules, wait-time formula, and test checklist

## Stack
- Frontend: React + Vite + Tailwind CSS (`npm run dev` at root).
- Backend sync: Minimal Node + Express API in `server/` using Server-Sent Events (`/api/events`) + polling fallback so separate physical devices (phone, tablet, TV) stay in sync within 5 seconds. Automatically falls back to `localStorage` + `BroadcastChannel` when `VITE_API_URL` is not configured.
- Hosting: Vercel (frontend) + Render or Railway (Node/Express backend).
- Live link must be the first line after the title in `README.md`, with the staff test PIN (`1234`) listed right below it.

## How to work
- One screen or one feature per task; commit after each working step.
- Theme: dark charcoal (`#1F2937` / `#111827`) + gold accent (`#D4A017`), rounded cards, mobile-first with >=44px tap targets.
- All visible labels must come from the EN/GU language file (`src/i18n/translations.js`); no hard-coded UI strings.
- Queue rules live in ONE shared module (`shared/queueRules.js`) reused by both frontend and backend.
- Never add features from the 'Don't build' list in `docs/01-brief.md`.
- After each task: verify against `docs/02-screens.md` and `docs/03-flows-rules.md`, then commit cleanly.
