import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  createInitialState,
  joinQueue as joinQueueRule,
  callNextForBarber as callNextRule,
  startService as startServiceRule,
  completeService as completeServiceRule,
  markNoShow as markNoShowRule,
  reAddNoShow as reAddNoShowRule,
  cancelTicket as cancelTicketRule,
  toggleBarberBreak as toggleBarberBreakRule,
  toggleBarberOnDuty as toggleBarberOnDutyRule,
  updateSettings as updateSettingsRule,
  toggleServiceActive as toggleServiceActiveRule,
  upsertService as upsertServiceRule,
} from '../../shared/queueRules';

const STORAGE_KEY = 'royal_cuts_queue_state_v1';
const MY_TOKEN_KEY = 'royal_cuts_my_token_v1';
const CHANNEL_NAME = 'royal_cuts_queue_sync_v1';
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const QueueContext = createContext(null);

function loadLocalState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.tickets) && Array.isArray(parsed.barbers)) {
        return parsed;
      }
    }
  } catch {
    // ignore corrupted storage
  }
  const initial = createInitialState();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch {
    // ignore storage quota
  }
  return initial;
}

export function QueueProvider({ children }) {
  const [state, setState] = useState(() => loadLocalState());
  const [syncMode, setSyncMode] = useState('local'); // 'server' | 'local'
  const [now, setNow] = useState(() => Date.now());
  const [myTokenId, setMyTokenIdState] = useState(() => {
    try {
      return localStorage.getItem(MY_TOKEN_KEY) || null;
    } catch {
      return null;
    }
  });

  const channelRef = useRef(null);
  const syncModeRef = useRef('local');
  const stateRef = useRef(state);
  stateRef.current = state;

  const setMyTokenId = useCallback((tokenId) => {
    setMyTokenIdState(tokenId);
    try {
      if (tokenId) localStorage.setItem(MY_TOKEN_KEY, tokenId);
      else localStorage.removeItem(MY_TOKEN_KEY);
    } catch {
      // ignore
    }
  }, []);

  // Periodic clock tick so wait estimates and elapsed timers update live
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const persistLocal = useCallback((nextState) => {
    setState(nextState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch {
      // ignore
    }
    try {
      channelRef.current?.postMessage({ type: 'STATE_UPDATE', state: nextState });
    } catch {
      // ignore
    }
  }, []);

  // Multi-tab / multi-window local sync (BroadcastChannel + storage event)
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current = ch;
      ch.onmessage = (e) => {
        if (e.data?.type === 'STATE_UPDATE' && e.data.state) {
          setState((prev) =>
            e.data.state.updatedAt >= prev.updatedAt ? e.data.state : prev
          );
        }
      };
    }

    const onStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && Array.isArray(parsed.tickets)) {
            setState(parsed);
          }
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      channelRef.current?.close();
      channelRef.current = null;
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Detect Express backend & connect SSE + 3s polling fallback
  useEffect(() => {
    let cancelled = false;
    let eventSource = null;
    let pollInterval = null;

    async function connectServer() {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      try {
        const res = await fetch(`${API_BASE}/api/health`, { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) throw new Error('Backend unhealthy');
        const data = await res.json();
        if (!data?.ok || cancelled) return;

        syncModeRef.current = 'server';
        setSyncMode('server');

        const stateRes = await fetch(`${API_BASE}/api/state`);
        if (stateRes.ok && !cancelled) {
          const serverState = await stateRes.json();
          setState(serverState);
        }

        // Real-time Server-Sent Events stream (<1s sync across devices)
        if (typeof EventSource !== 'undefined') {
          eventSource = new EventSource(`${API_BASE}/api/events`);
          eventSource.onmessage = (event) => {
            if (cancelled) return;
            try {
              const incoming = JSON.parse(event.data);
              if (incoming && Array.isArray(incoming.tickets)) {
                setState(incoming);
              }
            } catch {
              // ignore malformed SSE chunk
            }
          };
        }

        // Lightweight 3-second polling safety net (guarantees <5s sync even if SSE is buffered)
        pollInterval = setInterval(async () => {
          if (cancelled) return;
          try {
            const r = await fetch(`${API_BASE}/api/state`);
            if (r.ok) {
              const s = await r.json();
              if (s && Array.isArray(s.tickets)) {
                setState((prev) =>
                  s.version !== prev.version || s.updatedAt !== prev.updatedAt ? s : prev
                );
              }
            }
          } catch {
            // keep current state on transient hiccup
          }
        }, 3000);
      } catch {
        clearTimeout(timeout);
        syncModeRef.current = 'local';
        setSyncMode('local');
      }
    }

    connectServer();

    return () => {
      cancelled = true;
      eventSource?.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  const runAction = useCallback(
    async (endpoint, body, localReducer) => {
      if (syncModeRef.current === 'server') {
        try {
          const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body || {}),
          });
          const data = await res.json();
          if (data.state) {
            setState(data.state);
          }
          return data;
        } catch {
          // Fall back to local mode cleanly if server goes offline
          syncModeRef.current = 'local';
          setSyncMode('local');
        }
      }

      const result = localReducer(stateRef.current);
      if (result.ok && result.state !== stateRef.current) {
        persistLocal(result.state);
      }
      return result;
    },
    [persistLocal]
  );

  const actions = {
    joinQueue: async (payload) => {
      const res = await runAction('/api/queue/join', payload, (s) => joinQueueRule(s, payload));
      if (res.ok && res.ticket && !payload.isWalkIn) {
        setMyTokenId(res.ticket.id);
      }
      return res;
    },
    callNext: (barberId) =>
      runAction('/api/queue/call-next', { barberId }, (s) => callNextRule(s, barberId)),
    startService: (ticketId) =>
      runAction(`/api/queue/${encodeURIComponent(ticketId)}/start`, {}, (s) =>
        startServiceRule(s, ticketId)
      ),
    completeService: (ticketId) =>
      runAction(`/api/queue/${encodeURIComponent(ticketId)}/done`, {}, (s) =>
        completeServiceRule(s, ticketId)
      ),
    markNoShow: (ticketId) =>
      runAction(`/api/queue/${encodeURIComponent(ticketId)}/noshow`, {}, (s) =>
        markNoShowRule(s, ticketId)
      ),
    reAddNoShow: (ticketId) =>
      runAction(`/api/queue/${encodeURIComponent(ticketId)}/readd`, {}, (s) =>
        reAddNoShowRule(s, ticketId)
      ),
    cancelTicket: (ticketId) =>
      runAction(`/api/queue/${encodeURIComponent(ticketId)}/cancel`, {}, (s) =>
        cancelTicketRule(s, ticketId)
      ),
    toggleBarberBreak: (barberId, onBreak) =>
      runAction(`/api/barbers/${encodeURIComponent(barberId)}/break`, { onBreak }, (s) =>
        toggleBarberBreakRule(s, barberId, onBreak)
      ),
    toggleBarberOnDuty: (barberId, onDuty) =>
      runAction(`/api/barbers/${encodeURIComponent(barberId)}/duty`, { onDuty }, (s) =>
        toggleBarberOnDutyRule(s, barberId, onDuty)
      ),
    updateSettings: (patch) =>
      runAction('/api/admin/settings', patch, (s) => updateSettingsRule(s, patch)),
    toggleServiceActive: (serviceId) =>
      runAction('/api/admin/services/toggle', { serviceId }, (s) =>
        toggleServiceActiveRule(s, serviceId)
      ),
    upsertService: (serviceInput) =>
      runAction('/api/admin/services', serviceInput, (s) => upsertServiceRule(s, serviceInput)),
    resetDemo: () =>
      runAction('/api/admin/reset', {}, () => ({ ok: true, state: createInitialState() })),
  };

  return (
    <QueueContext.Provider
      value={{
        state,
        now,
        syncMode,
        myTokenId,
        setMyTokenId,
        actions,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const ctx = useContext(QueueContext);
  if (!ctx) throw new Error('useQueue must be used within QueueProvider');
  return ctx;
}
