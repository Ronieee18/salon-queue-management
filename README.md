# Salon Queue Management System

**Live demo:** https://salon-queue-management-sigma.vercel.app
**Hosted on:** Vercel (frontend) + Render (backend)
**Staff test PIN (Reception, Barber & Owner screens):** `1234`

---

## About

**Royal Cuts Salon (રોયલ કટ્સ સલૂન)** is a mobile-first, bilingual (**English + Gujarati**) salon queue management web application. Customers join the queue from their phone, track live wait times, and receive a full-screen gold alert when it's their turn; receptionists and barbers manage chairs in real time; and the waiting-area TV displays live tokens readable from 5 metres away.

## Screens & Routes

| #   | Screen                  | Route           | Audience              | Notes                                                                                                                                      |
| --- | ----------------------- | --------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Home**                | `/`             | Customers             | Live queue count, estimated wait, barber status chips, Join Queue CTA                                                                      |
| 2   | **Join Queue**          | `/join`         | Customers             | 10-digit phone validation, max 3 services, live time/price/wait summary, barber picker                                                     |
| 3   | **My Status**           | `/status/:id`   | Customers             | Large token, circular countdown, `'Start coming'` banner, full-screen gold turn alert + vibration, cancel modal                            |
| 4   | **Reception Dashboard** | `/reception`    | Receptionist (Tablet) | PIN `1234`, 3-column barber cards with progress bars, FIFO waiting list (>60m amber highlight), walk-in modal, Call Next, No-show & Re-add |
| 5   | **Barber View**         | `/barber/:name` | Barbers (Phone)       | PIN `1234`, current customer + elapsed timer, `[ Start ] -> [ Done ]`, `'Next for you'` preview, Available / On Break toggle               |
| 6   | **Waiting Area TV**     | `/display`      | Waiting Area (TV)     | 5m-readable high-contrast screen, per-barber `Now` token, Up Next 5 tokens, gold flash + Web Audio chime                                   |
| 7   | **Owner Settings**      | `/admin`        | Salon Owner           | PIN `1234`, Today's stats cards, services EN/GU CRUD + on/off toggle, barbers on duty toggle, Online Queue Open/Closed switch              |

## Architecture & Real-Time Sync

- **Frontend:** React 19 + Vite 6 + Tailwind CSS v4 (Dark Charcoal `#1F2937` / `#111827` + Gold `#D4A017`).
- **Single Source of Truth:** All queue rules, state transitions, barber preference matching, and wait-time formulas live in [`shared/queueRules.js`](shared/queueRules.js) and are reused by both the frontend and the Express backend.
- **Cross-Device Sync (<5 seconds):**
  - **Live Sync Mode (when backend is connected):** Express API (`server/index.js`) broadcasts every queue update instantly via **Server-Sent Events (`/api/events`)** with an automatic **3-second polling fallback**, keeping separate physical phones, tablets, and TVs in sync.
  - **Local Sync Mode (automatic fallback):** If `VITE_API_URL` is not configured, the app seamlessly falls back to `localStorage` + `BroadcastChannel` so multiple tabs/windows on the same device stay in instant sync.

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run the Express real-time sync server (Terminal 1, port 3001)
npm run server

# 3. Run the Vite frontend dev server (Terminal 2, port 5173)
npm run dev

# 4. Run unit tests for queue rules
npm test
```

Open `http://localhost:5173` on your browser.

## Deployment Guide (Vercel + Render / Railway)

### 1. Push to GitHub

Create a **public** repository on your personal GitHub account and push:

```bash
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

### 2. Deploy Backend (Render or Railway)

**Option A — Render (Free Tier):**

1. Go to [render.com](https://render.com) -> **New +** -> **Web Service** -> connect your GitHub repo.
2. Settings (or use included `render.yaml`):
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm run server`
   - **Environment Variable:** `SERVE_STATIC=false`
3. Deploy and copy your live backend URL (e.g. `https://royal-cuts-salon-api.onrender.com`).

**Option B — Railway:**

1. Go to [railway.app](https://railway.app) -> **New Project** -> **Deploy from GitHub repo**.
2. Set Start Command to `npm run server` and expose public networking to get your backend URL.

### 3. Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) -> **Add New Project** -> import the same GitHub repository.
2. Vercel auto-detects **Vite** (`npm run build`, output `dist`). SPA routing is preconfigured via `vercel.json`.
3. Add Environment Variable:
   - `VITE_API_URL` = your Render/Railway backend URL (e.g. `https://royal-cuts-salon-api.onrender.com`).
4. Click **Deploy** and copy your live Vercel URL.
5. Update the **Live demo** link at the very top of this `README.md`, commit, and push!

## Documentation

- [`AGENTS.md`](AGENTS.md) — Agent working instructions & stack
- [`docs/01-brief.md`](docs/01-brief.md) — Project brief, users, must-have features & don't-build scope
- [`docs/02-screens.md`](docs/02-screens.md) — Detailed specification for all 7 screens
- [`docs/03-flows-rules.md`](docs/03-flows-rules.md) — End-to-end flows, queue rules, wait-time formula & verified test checklist
- [`prompts.md`](prompts.md) — Chronological log of prompts used
- [`reflection.md`](reflection.md) — Half-page reflection on vibe coding iterations
