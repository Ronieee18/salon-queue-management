# Prompts Log — Salon Queue Management System

Chronological record of the prompts and iterative decisions used while building **Royal Cuts Salon** with Google Antigravity following the Vibe Coding Guide.

---

### Prompt 1 — Kickoff & Requirements Alignment
> Read `Salon_Queue_Management_Vibe_Coding_Guide.pdf` in the workspace root. Let's build the Salon Queue Management System as a deployed full-stack app (Vercel frontend + Render/Railway Node/Express backend with local fallback) for **Royal Cuts Salon** in English + Gujarati with the Dark Charcoal & Gold theme.

*Outcome:* Clarified sync architecture (Express SSE + polling fallback + automatic `localStorage`/`BroadcastChannel` fallback) and branding before writing any code.

---

### Prompt 2 — Specifications First (First Git Commit)
> Create `AGENTS.md`, `docs/01-brief.md`, `docs/02-screens.md`, and `docs/03-flows-rules.md` covering all 7 screens, strict barber-preference queue rules, wait-time formula, no-show/cancel/break rules, don't-build boundaries, and a 10-item test checklist. Initialize git and make the first commit contain only the docs.

*Outcome:* Committed clean specification docs (`2f6487c`) before writing any application code.

---

### Prompt 3 — Step 1: Project Setup, Shared Queue Engine, Backend & i18n
> Set up React + Vite + Tailwind CSS v4, the Express SSE backend (`server/index.js`), the single shared queue rules module (`shared/queueRules.js`), the English/Gujarati translations (`src/i18n/translations.js`), dark charcoal + gold theme, staff PIN gate (`1234`), and routes for all 7 screens.

*Outcome:* Both frontend and backend import the exact same pure queue rules module so wait-time and Call Next logic never drift.

---

### Prompt 4 — Step 2: Home (`/`) & Join Queue (`/join`)
> Build Screen 1 (Home) and Screen 2 (Join Queue) from `docs/02-screens.md` with realistic Indian salon services (₹ prices, EN/GU names) and 3 barbers (Ravi, Amit, Imran). Enforce 10-digit phone validation, max 3 services, live total time/price/wait summary, and duplicate-phone redirect.

*Outcome:* Mobile-first Home and Join screens with sticky bottom summary bar and instant live calculations.

---

### Prompt 5 — Step 3: My Status (`/status/:id`)
> Build Screen 3 (My Status) with large gold token, queue position, circular SVG countdown that updates automatically, `'Start coming to the salon'` banner when 2nd in line, barber-on-break banner, full-screen gold `'It's your turn!'` alert with pulse animation and vibration, and cancel confirmation pop-up.

*Outcome:* Customers get a high-impact full-screen gold call alert within seconds of being called.

---

### Prompt 6 — Step 4: Reception Dashboard (`/reception`)
> Build Screen 4 (Reception Dashboard) for a 10-inch tablet in landscape with a 3-column barber card row showing time-left progress bars, FIFO waiting list highlighting >60 min waits in amber, quick Add Walk-in modal, strict barber-preference Call Next, No-show, Cancel, and Recent No-Shows Re-add to end.

*Outcome:* Seeded realistic demo queue including `S-12` (>60 min wait, preferred Ravi) and `S-13` (preferred Any) so barber-skipping and amber alerts are immediately testable.

---

### Prompt 7 — Step 5: Barber View (`/barber/:name`) & Waiting Area TV (`/display`)
> Build Screen 5 (Barber View) with big Start -> Done buttons, running session timer, Next for you preview, and Available / On Break toggle, plus Screen 6 (Waiting Area TV) readable from 5 metres with per-barber Now tokens, Up Next 5 tokens, gold flash, and Web Audio chime.

*Outcome:* Zero external audio file dependencies thanks to synthesized two-tone Web Audio chime.

---

### Prompt 8 — Step 6: Owner Settings (`/admin`) & Unit Tests
> Build Screen 7 (Owner Settings) with Today's Stats cards, Online Queue Open/Closed switch, 30-min pre-closing cutoff toggle, Barbers on Duty switches, and Services EN/GU management (toggle/add/edit). Add unit tests in `tests/queueRules.test.js` covering every rule in `docs/03-flows-rules.md`.

*Outcome:* 8/8 automated unit tests passing and clean production `vite build`.

---

### Prompt 9 — Step 7: Live End-to-End Browser Verification & Polish
> Start the Express backend and Vite frontend, run a full live browser QA pass across all 7 screens in both English and Gujarati, check console errors, and verify every item in `docs/03-flows-rules.md`.

*Outcome:* All 10 test checklist items passed with zero browser console errors and clean Gujarati typography without overflow.

---

### Prompt 10 — Step 8: Deployment Preparation
> Prepare the project for Vercel (frontend) + Render/Railway (backend) deployment with `vercel.json` SPA rewrites, `render.yaml`, `.env.example`, zero hardcoded localhost URLs, and update `README.md` with the required top-of-file live demo link and staff test PIN (`1234`).

*Outcome:* Deployment-ready repository with step-by-step deploy guide and submission artifacts (`prompts.md`, `reflection.md`).
