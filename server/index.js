import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createInitialState,
  joinQueue,
  callNextForBarber,
  startService,
  completeService,
  markNoShow,
  reAddNoShow,
  cancelTicket,
  toggleBarberBreak,
  toggleBarberOnDuty,
  updateSettings,
  toggleServiceActive,
  upsertService,
} from '../shared/queueRules.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.tickets) && Array.isArray(parsed.barbers)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not load persisted state, using fresh seed:', err.message);
  }
  return createInitialState();
}

function saveState(nextState) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(nextState, null, 2), 'utf8');
  } catch (err) {
    console.warn('State persistence skipped:', err.message);
  }
}

let state = loadState();
const sseClients = new Set();

function broadcastState() {
  const payload = `data: ${JSON.stringify(state)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(payload);
    } catch {
      sseClients.delete(res);
    }
  }
}

function commitMutation(result, res) {
  if (!result.ok) {
    return res.status(400).json({ ok: false, error: result.error, state });
  }
  if (result.state !== state) {
    state = result.state;
    saveState(state);
    broadcastState();
  }
  return res.json({
    ok: true,
    duplicate: result.duplicate || false,
    ticket: result.ticket || null,
    state,
  });
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mode: 'server', version: state.version, updatedAt: state.updatedAt });
});

app.get('/api/state', (_req, res) => {
  res.json(state);
});

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  res.write(`data: ${JSON.stringify(state)}\n\n`);
  sseClients.add(res);

  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

app.post('/api/queue/join', (req, res) => {
  commitMutation(joinQueue(state, req.body), res);
});

app.post('/api/queue/call-next', (req, res) => {
  commitMutation(callNextForBarber(state, req.body.barberId), res);
});

app.post('/api/queue/:id/start', (req, res) => {
  commitMutation(startService(state, req.params.id), res);
});

app.post('/api/queue/:id/done', (req, res) => {
  commitMutation(completeService(state, req.params.id), res);
});

app.post('/api/queue/:id/noshow', (req, res) => {
  commitMutation(markNoShow(state, req.params.id), res);
});

app.post('/api/queue/:id/readd', (req, res) => {
  commitMutation(reAddNoShow(state, req.params.id), res);
});

app.post('/api/queue/:id/cancel', (req, res) => {
  commitMutation(cancelTicket(state, req.params.id), res);
});

app.post('/api/barbers/:id/break', (req, res) => {
  commitMutation(toggleBarberBreak(state, req.params.id, req.body.onBreak), res);
});

app.post('/api/barbers/:id/duty', (req, res) => {
  commitMutation(toggleBarberOnDuty(state, req.params.id, req.body.onDuty), res);
});

app.post('/api/admin/settings', (req, res) => {
  commitMutation(updateSettings(state, req.body), res);
});

app.post('/api/admin/services/toggle', (req, res) => {
  commitMutation(toggleServiceActive(state, req.body.serviceId), res);
});

app.post('/api/admin/services', (req, res) => {
  commitMutation(upsertService(state, req.body), res);
});

app.post('/api/admin/reset', (_req, res) => {
  state = createInitialState();
  saveState(state);
  broadcastState();
  res.json({ ok: true, state });
});

// Optional single-service deployment: serve built Vite frontend if present
const distDir = path.join(ROOT_DIR, 'dist');
if (process.env.SERVE_STATIC !== 'false' && fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Royal Cuts Salon Queue Server running on port ${PORT}`);
});
