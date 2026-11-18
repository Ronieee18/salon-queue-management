export const TICKET_STATUS = {
  WAITING: 'WAITING',
  CALLED: 'CALLED',
  IN_CHAIR: 'IN_CHAIR',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
};

export const ACTIVE_STATUSES = new Set([
  TICKET_STATUS.WAITING,
  TICKET_STATUS.CALLED,
  TICKET_STATUS.IN_CHAIR,
]);

export const ALLOWED_TRANSITIONS = {
  [TICKET_STATUS.WAITING]: [TICKET_STATUS.CALLED, TICKET_STATUS.CANCELLED],
  [TICKET_STATUS.CALLED]: [TICKET_STATUS.IN_CHAIR, TICKET_STATUS.NO_SHOW],
  [TICKET_STATUS.IN_CHAIR]: [TICKET_STATUS.DONE],
  [TICKET_STATUS.DONE]: [],
  [TICKET_STATUS.CANCELLED]: [],
  [TICKET_STATUS.NO_SHOW]: [],
};

export const STAFF_PIN = '1234';
export const MAX_SERVICES_PER_TICKET = 3;
export const NO_SHOW_GRACE_MINUTES = 10;
export const LONG_WAIT_AMBER_MINUTES = 60;
export const ONLINE_CLOSING_BUFFER_MINUTES = 30;

export function canTransition(fromStatus, toStatus) {
  return (ALLOWED_TRANSITIONS[fromStatus] || []).includes(toStatus);
}

export function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '').slice(-10);
}

export function isValidPhone(phone) {
  return /^\d{10}$/.test(String(phone || '').replace(/\D/g, ''));
}

export function createInitialServices() {
  return [
    { id: 'srv-haircut', nameEn: 'Haircut', nameGu: 'હેરકટ', minutes: 30, price: 150, active: true },
    { id: 'srv-beard', nameEn: 'Beard Trim', nameGu: 'દાઢી ટ્રીમ', minutes: 15, price: 80, active: true },
    { id: 'srv-spa', nameEn: 'Hair Spa', nameGu: 'હેર સ્પા', minutes: 45, price: 400, active: true },
    { id: 'srv-wash', nameEn: 'Hair Wash & Styling', nameGu: 'હેર વૉશ અને સ્ટાઇલિંગ', minutes: 20, price: 120, active: true },
    { id: 'srv-massage', nameEn: 'Head Massage', nameGu: 'માથાની માલિશ', minutes: 20, price: 150, active: true },
    { id: 'srv-shave', nameEn: 'Classic Shave', nameGu: 'ક્લાસિક શેવ', minutes: 20, price: 100, active: true },
    { id: 'srv-color', nameEn: 'Hair Coloring', nameGu: 'હેર કલરિંગ', minutes: 45, price: 450, active: true },
    { id: 'srv-facial', nameEn: 'Facial Cleanup', nameGu: 'ફેશિયલ ક્લીનઅપ', minutes: 35, price: 350, active: true },
  ];
}

export function createInitialBarbers() {
  return [
    {
      id: 'ravi',
      name: 'Ravi',
      nameGu: 'રવિ',
      specialtyEn: 'Master Stylist',
      specialtyGu: 'માસ્ટર સ્ટાઇલિસ્ટ',
      initials: 'RK',
      accent: '#D4A017',
      onDuty: true,
      onBreak: false,
    },
    {
      id: 'amit',
      name: 'Amit',
      nameGu: 'અમિત',
      specialtyEn: 'Fade & Beard Pro',
      specialtyGu: 'ફેડ અને દાઢી નિષ્ણાત',
      initials: 'AP',
      accent: '#38BDF8',
      onDuty: true,
      onBreak: false,
    },
    {
      id: 'imran',
      name: 'Imran',
      nameGu: 'ઇમરાન',
      specialtyEn: 'Spa & Grooming',
      specialtyGu: 'સ્પા અને ગ્રૂમિંગ',
      initials: 'IK',
      accent: '#34D399',
      onDuty: true,
      onBreak: true,
    },
  ];
}

export function createInitialState(now = Date.now()) {
  const services = createInitialServices();
  const barbers = createInitialBarbers();
  const min = 60 * 1000;

  const makeTicket = ({
    seq,
    name,
    phone,
    serviceIds,
    preferredBarberId = 'any',
    status = TICKET_STATUS.WAITING,
    assignedBarberId = null,
    joinedAgoMin = 10,
    calledAgoMin = null,
    startedAgoMin = null,
    completedAgoMin = null,
    noShowAgoMin = null,
    isWalkIn = false,
  }) => {
    const totals = calculateTotals(services, serviceIds);
    return {
      id: `S-${seq}`,
      token: `S-${seq}`,
      queueOrder: seq,
      name,
      phone,
      serviceIds,
      totalMinutes: totals.totalMinutes,
      totalPrice: totals.totalPrice,
      preferredBarberId,
      assignedBarberId,
      status,
      isWalkIn,
      joinedAt: now - joinedAgoMin * min,
      calledAt: calledAgoMin != null ? now - calledAgoMin * min : null,
      startedAt: startedAgoMin != null ? now - startedAgoMin * min : null,
      completedAt: completedAgoMin != null ? now - completedAgoMin * min : null,
      noShowAt: noShowAgoMin != null ? now - noShowAgoMin * min : null,
      cancelledAt: null,
    };
  };

  // Seed realistic today's history + 8 active customers (1 in chair, 1 called, 6 waiting including >60m)
  const tickets = [
    makeTicket({
      seq: 8,
      name: 'Nikhil Shah',
      phone: '9825011001',
      serviceIds: ['srv-haircut'],
      preferredBarberId: 'ravi',
      assignedBarberId: 'ravi',
      status: TICKET_STATUS.DONE,
      joinedAgoMin: 115,
      calledAgoMin: 95,
      startedAgoMin: 93,
      completedAgoMin: 63,
    }),
    makeTicket({
      seq: 9,
      name: 'Jayesh Patel',
      phone: '9825011002',
      serviceIds: ['srv-haircut', 'srv-beard'],
      preferredBarberId: 'any',
      assignedBarberId: 'amit',
      status: TICKET_STATUS.DONE,
      joinedAgoMin: 105,
      calledAgoMin: 80,
      startedAgoMin: 78,
      completedAgoMin: 35,
    }),
    makeTicket({
      seq: 10,
      name: 'Rohan Mehta',
      phone: '9825011003',
      serviceIds: ['srv-beard'],
      preferredBarberId: 'any',
      assignedBarberId: 'amit',
      status: TICKET_STATUS.NO_SHOW,
      joinedAgoMin: 95,
      calledAgoMin: 72,
      noShowAgoMin: 60,
    }),
    makeTicket({
      seq: 11,
      name: 'Aarav Joshi',
      phone: '9825011004',
      serviceIds: ['srv-haircut', 'srv-beard'],
      preferredBarberId: 'ravi',
      assignedBarberId: 'ravi',
      status: TICKET_STATUS.IN_CHAIR,
      joinedAgoMin: 55,
      calledAgoMin: 22,
      startedAgoMin: 20,
    }),
    makeTicket({
      seq: 12,
      name: 'Kunal Desai',
      phone: '9825011005',
      serviceIds: ['srv-haircut'],
      preferredBarberId: 'ravi',
      status: TICKET_STATUS.WAITING,
      joinedAgoMin: 68, // > 60 min -> highlighted in amber on Reception!
    }),
    makeTicket({
      seq: 13,
      name: 'Devansh Trivedi',
      phone: '9825011006',
      serviceIds: ['srv-haircut', 'srv-wash'],
      preferredBarberId: 'any',
      status: TICKET_STATUS.WAITING,
      joinedAgoMin: 42,
    }),
    makeTicket({
      seq: 14,
      name: 'Harshil Panchal',
      phone: '9825011007',
      serviceIds: ['srv-beard', 'srv-massage'],
      preferredBarberId: 'amit',
      status: TICKET_STATUS.WAITING,
      joinedAgoMin: 31,
      isWalkIn: true,
    }),
    makeTicket({
      seq: 15,
      name: 'Meet Solanki',
      phone: '9825011008',
      serviceIds: ['srv-spa'],
      preferredBarberId: 'imran',
      status: TICKET_STATUS.WAITING,
      joinedAgoMin: 24,
    }),
    makeTicket({
      seq: 16,
      name: 'Pratik Parmar',
      phone: '9825011009',
      serviceIds: ['srv-haircut'],
      preferredBarberId: 'any',
      status: TICKET_STATUS.WAITING,
      joinedAgoMin: 15,
    }),
    makeTicket({
      seq: 17,
      name: 'Sagar Bhatt',
      phone: '9825011010',
      serviceIds: ['srv-shave', 'srv-massage'],
      preferredBarberId: 'any',
      status: TICKET_STATUS.WAITING,
      joinedAgoMin: 7,
      isWalkIn: true,
    }),
  ];

  return {
    version: 1,
    nextSequence: 18,
    updatedAt: now,
    lastCalledEvent: null,
    settings: {
      salonNameEn: 'Royal Cuts Salon',
      salonNameGu: 'રોયલ કટ્સ સલૂન',
      onlineQueueOpen: true,
      closingTime: '21:00',
      enforceClosingCutoff: false,
    },
    services,
    barbers,
    tickets,
  };
}

export function calculateTotals(services, selectedServiceIds) {
  const map = new Map(services.map((s) => [s.id, s]));
  let totalMinutes = 0;
  let totalPrice = 0;
  for (const id of selectedServiceIds) {
    const srv = map.get(id);
    if (srv) {
      totalMinutes += Number(srv.minutes) || 0;
      totalPrice += Number(srv.price) || 0;
    }
  }
  return { totalMinutes, totalPrice };
}

export function parseTimeToMinutes(hhmm) {
  const [h, m] = String(hhmm || '21:00').split(':').map(Number);
  return (Number.isFinite(h) ? h : 21) * 60 + (Number.isFinite(m) ? m : 0);
}

export function isWithinClosingCutoff(closingTime, now = Date.now()) {
  const d = new Date(now);
  const currentMinutes = d.getHours() * 60 + d.getMinutes();
  const closingMinutes = parseTimeToMinutes(closingTime);
  const cutoffMinutes = closingMinutes - ONLINE_CLOSING_BUFFER_MINUTES;
  return currentMinutes >= cutoffMinutes;
}

export function isOnlineJoiningOpen(state, now = Date.now()) {
  if (!state.settings.onlineQueueOpen) {
    return { open: false, reason: 'CLOSED_BY_OWNER' };
  }
  if (state.settings.enforceClosingCutoff && isWithinClosingCutoff(state.settings.closingTime, now)) {
    return { open: false, reason: 'CLOSING_SOON' };
  }
  const anyBarberOnDuty = state.barbers.some((b) => b.onDuty);
  if (!anyBarberOnDuty) {
    return { open: false, reason: 'NO_BARBERS_ON_DUTY' };
  }
  return { open: true, reason: null };
}

export function getBarberCurrentTicket(state, barberId) {
  return (
    state.tickets.find(
      (t) =>
        t.assignedBarberId === barberId &&
        (t.status === TICKET_STATUS.IN_CHAIR || t.status === TICKET_STATUS.CALLED)
    ) || null
  );
}

export function getBarberStatus(state, barberId) {
  const barber = state.barbers.find((b) => b.id === barberId);
  if (!barber || !barber.onDuty) return 'off_duty';
  const current = getBarberCurrentTicket(state, barberId);
  if (current?.status === TICKET_STATUS.IN_CHAIR) return 'in_chair';
  if (current?.status === TICKET_STATUS.CALLED) return 'called';
  if (barber.onBreak) return 'on_break';
  return 'free';
}

export function getWaitingTickets(state) {
  return state.tickets
    .filter((t) => t.status === TICKET_STATUS.WAITING)
    .sort((a, b) => a.queueOrder - b.queueOrder);
}

export function getRecentNoShows(state) {
  return state.tickets
    .filter((t) => t.status === TICKET_STATUS.NO_SHOW)
    .sort((a, b) => (b.noShowAt || 0) - (a.noShowAt || 0));
}

export function getNextEligibleTicketForBarber(state, barberId) {
  const waiting = getWaitingTickets(state);
  return (
    waiting.find(
      (t) => t.preferredBarberId === barberId || t.preferredBarberId === 'any'
    ) || null
  );
}

export function getRemainingMinutesForTicket(ticket, now = Date.now()) {
  if (!ticket) return 0;
  if (ticket.status === TICKET_STATUS.CALLED) {
    return Math.max(1, ticket.totalMinutes || 15);
  }
  if (ticket.status === TICKET_STATUS.IN_CHAIR) {
    const elapsedMin = ticket.startedAt ? Math.floor((now - ticket.startedAt) / 60000) : 0;
    return Math.max(1, (ticket.totalMinutes || 15) - elapsedMin);
  }
  return 0;
}

export function getQueuePosition(state, ticketId) {
  const waiting = getWaitingTickets(state);
  const idx = waiting.findIndex((t) => t.id === ticketId);
  return idx === -1 ? null : idx + 1;
}

export function calculateEstimatedWait(state, options = {}, now = Date.now()) {
  const { preferredBarberId = 'any', ticketId = null } = options;

  if (ticketId) {
    const existing = state.tickets.find((t) => t.id === ticketId);
    if (!existing || existing.status !== TICKET_STATUS.WAITING) return 0;
  }

  const workingBarbers = state.barbers.filter((b) => b.onDuty && !b.onBreak);
  const workingCount = Math.max(1, workingBarbers.length);

  const waiting = getWaitingTickets(state);
  let aheadTickets = waiting;
  if (ticketId) {
    const idx = waiting.findIndex((t) => t.id === ticketId);
    aheadTickets = idx >= 0 ? waiting.slice(0, idx) : waiting;
  }

  if (preferredBarberId && preferredBarberId !== 'any') {
    const barber = state.barbers.find((b) => b.id === preferredBarberId);
    const current = getBarberCurrentTicket(state, preferredBarberId);
    const remainingCurrent = getRemainingMinutesForTicket(current, now);

    const aheadSameBarber = aheadTickets
      .filter((t) => t.preferredBarberId === preferredBarberId)
      .reduce((sum, t) => sum + (t.totalMinutes || 0), 0);

    const aheadAny = aheadTickets
      .filter((t) => t.preferredBarberId === 'any')
      .reduce((sum, t) => sum + (t.totalMinutes || 0), 0);

    const shareOfAny = Math.floor(aheadAny / workingCount);
    let total = remainingCurrent + aheadSameBarber + shareOfAny;
    if (barber?.onBreak) {
      total += 10;
    }
    return Math.max(0, Math.round(total));
  }

  // 'any' barber calculation: total minutes of services ahead ÷ barbers working
  const workingChairRemaining = workingBarbers.map((b) =>
    getRemainingMinutesForTicket(getBarberCurrentTicket(state, b.id), now)
  );
  const hasFreeWorkingBarber = workingBarbers.some(
    (b) => !getBarberCurrentTicket(state, b.id)
  );

  if (aheadTickets.length === 0) {
    if (hasFreeWorkingBarber && workingBarbers.length > 0) return 0;
    if (workingChairRemaining.length > 0) {
      return Math.min(...workingChairRemaining);
    }
    // All on-duty barbers are currently on break
    return 15;
  }

  const remainingSum = workingChairRemaining.reduce((sum, m) => sum + m, 0);
  const waitingAheadSum = aheadTickets.reduce((sum, t) => sum + (t.totalMinutes || 0), 0);
  const rawEstimate = Math.ceil((remainingSum + waitingAheadSum) / workingCount);

  return Math.max(1, rawEstimate);
}

export function findActiveTicketByPhone(state, phone) {
  const clean = normalizePhone(phone);
  if (!clean) return null;
  return (
    state.tickets.find(
      (t) => normalizePhone(t.phone) === clean && ACTIVE_STATUSES.has(t.status)
    ) || null
  );
}

export function joinQueue(state, payload, now = Date.now()) {
  const {
    name,
    phone,
    serviceIds = [],
    preferredBarberId = 'any',
    isWalkIn = false,
  } = payload;

  const trimmedName = String(name || '').trim();
  const cleanPhone = String(phone || '').replace(/\D/g, '');

  if (!trimmedName) {
    return { ok: false, error: 'NAME_REQUIRED', state };
  }
  if (!isValidPhone(cleanPhone)) {
    return { ok: false, error: 'INVALID_PHONE', state };
  }

  // Check duplicate active spot BEFORE online-closed check so returning customer can always find their spot
  const existing = findActiveTicketByPhone(state, cleanPhone);
  if (existing) {
    return { ok: true, duplicate: true, ticket: existing, state };
  }

  if (!isWalkIn) {
    const onlineStatus = isOnlineJoiningOpen(state, now);
    if (!onlineStatus.open) {
      return { ok: false, error: onlineStatus.reason || 'QUEUE_CLOSED', state };
    }
  }

  const activeServiceIds = new Set(state.services.filter((s) => s.active).map((s) => s.id));
  const uniqueValidServices = [...new Set(serviceIds)].filter((id) => activeServiceIds.has(id));

  if (uniqueValidServices.length === 0) {
    return { ok: false, error: 'SERVICE_REQUIRED', state };
  }
  if (uniqueValidServices.length > MAX_SERVICES_PER_TICKET) {
    return { ok: false, error: 'MAX_SERVICES_EXCEEDED', state };
  }

  let validBarberId = 'any';
  if (preferredBarberId && preferredBarberId !== 'any') {
    const barber = state.barbers.find((b) => b.id === preferredBarberId && b.onDuty);
    if (barber) {
      validBarberId = barber.id;
    }
  }

  const totals = calculateTotals(state.services, uniqueValidServices);
  const seq = state.nextSequence;
  const ticket = {
    id: `S-${seq}`,
    token: `S-${seq}`,
    queueOrder: seq,
    name: trimmedName,
    phone: cleanPhone,
    serviceIds: uniqueValidServices,
    totalMinutes: totals.totalMinutes,
    totalPrice: totals.totalPrice,
    preferredBarberId: validBarberId,
    assignedBarberId: null,
    status: TICKET_STATUS.WAITING,
    isWalkIn: Boolean(isWalkIn),
    joinedAt: now,
    calledAt: null,
    startedAt: null,
    completedAt: null,
    noShowAt: null,
    cancelledAt: null,
  };

  const nextState = {
    ...state,
    version: state.version + 1,
    nextSequence: seq + 1,
    updatedAt: now,
    tickets: [...state.tickets, ticket],
  };

  return { ok: true, duplicate: false, ticket, state: nextState };
}

export function callNextForBarber(state, barberId, now = Date.now()) {
  const barber = state.barbers.find((b) => b.id === barberId);
  if (!barber || !barber.onDuty) {
    return { ok: false, error: 'BARBER_OFF_DUTY', state };
  }
  if (barber.onBreak) {
    return { ok: false, error: 'BARBER_ON_BREAK', state };
  }
  if (getBarberCurrentTicket(state, barberId)) {
    return { ok: false, error: 'BARBER_BUSY', state };
  }

  const nextTicket = getNextEligibleTicketForBarber(state, barberId);
  if (!nextTicket) {
    return { ok: false, error: 'NO_ELIGIBLE_CUSTOMER', state };
  }
  if (!canTransition(nextTicket.status, TICKET_STATUS.CALLED)) {
    return { ok: false, error: 'INVALID_TRANSITION', state };
  }

  const updatedTicket = {
    ...nextTicket,
    status: TICKET_STATUS.CALLED,
    assignedBarberId: barberId,
    calledAt: now,
  };

  const nextState = {
    ...state,
    version: state.version + 1,
    updatedAt: now,
    lastCalledEvent: {
      ticketId: updatedTicket.id,
      token: updatedTicket.token,
      barberId,
      barberName: barber.name,
      at: now,
    },
    tickets: state.tickets.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)),
  };

  return { ok: true, ticket: updatedTicket, state: nextState };
}

export function startService(state, ticketId, now = Date.now()) {
  const ticket = state.tickets.find((t) => t.id === ticketId);
  if (!ticket) return { ok: false, error: 'TICKET_NOT_FOUND', state };
  if (!canTransition(ticket.status, TICKET_STATUS.IN_CHAIR)) {
    return { ok: false, error: 'INVALID_TRANSITION', state };
  }

  const updatedTicket = {
    ...ticket,
    status: TICKET_STATUS.IN_CHAIR,
    startedAt: now,
  };

  return {
    ok: true,
    ticket: updatedTicket,
    state: {
      ...state,
      version: state.version + 1,
      updatedAt: now,
      tickets: state.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
    },
  };
}

export function completeService(state, ticketId, now = Date.now()) {
  const ticket = state.tickets.find((t) => t.id === ticketId);
  if (!ticket) return { ok: false, error: 'TICKET_NOT_FOUND', state };
  if (!canTransition(ticket.status, TICKET_STATUS.DONE)) {
    return { ok: false, error: 'INVALID_TRANSITION', state };
  }

  const updatedTicket = {
    ...ticket,
    status: TICKET_STATUS.DONE,
    completedAt: now,
  };

  return {
    ok: true,
    ticket: updatedTicket,
    state: {
      ...state,
      version: state.version + 1,
      updatedAt: now,
      tickets: state.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
    },
  };
}

export function markNoShow(state, ticketId, now = Date.now()) {
  const ticket = state.tickets.find((t) => t.id === ticketId);
  if (!ticket) return { ok: false, error: 'TICKET_NOT_FOUND', state };
  if (!canTransition(ticket.status, TICKET_STATUS.NO_SHOW)) {
    return { ok: false, error: 'INVALID_TRANSITION', state };
  }

  const updatedTicket = {
    ...ticket,
    status: TICKET_STATUS.NO_SHOW,
    noShowAt: now,
  };

  return {
    ok: true,
    ticket: updatedTicket,
    state: {
      ...state,
      version: state.version + 1,
      updatedAt: now,
      tickets: state.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
    },
  };
}

export function reAddNoShow(state, ticketId, now = Date.now()) {
  const oldTicket = state.tickets.find((t) => t.id === ticketId);
  if (!oldTicket || oldTicket.status !== TICKET_STATUS.NO_SHOW) {
    return { ok: false, error: 'NOT_A_NO_SHOW', state };
  }

  // Always joins at the END of the queue with a brand-new sequential token
  return joinQueue(
    state,
    {
      name: oldTicket.name,
      phone: oldTicket.phone,
      serviceIds: oldTicket.serviceIds,
      preferredBarberId: oldTicket.preferredBarberId,
      isWalkIn: true,
    },
    now
  );
}

export function cancelTicket(state, ticketId, now = Date.now()) {
  const ticket = state.tickets.find((t) => t.id === ticketId);
  if (!ticket) return { ok: false, error: 'TICKET_NOT_FOUND', state };
  if (!canTransition(ticket.status, TICKET_STATUS.CANCELLED)) {
    return { ok: false, error: 'INVALID_TRANSITION', state };
  }

  const updatedTicket = {
    ...ticket,
    status: TICKET_STATUS.CANCELLED,
    cancelledAt: now,
  };

  return {
    ok: true,
    ticket: updatedTicket,
    state: {
      ...state,
      version: state.version + 1,
      updatedAt: now,
      tickets: state.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
    },
  };
}

export function toggleBarberBreak(state, barberId, onBreak, now = Date.now()) {
  const exists = state.barbers.some((b) => b.id === barberId);
  if (!exists) return { ok: false, error: 'BARBER_NOT_FOUND', state };

  return {
    ok: true,
    state: {
      ...state,
      version: state.version + 1,
      updatedAt: now,
      barbers: state.barbers.map((b) =>
        b.id === barberId ? { ...b, onBreak: Boolean(onBreak) } : b
      ),
    },
  };
}

export function toggleBarberOnDuty(state, barberId, onDuty, now = Date.now()) {
  const exists = state.barbers.some((b) => b.id === barberId);
  if (!exists) return { ok: false, error: 'BARBER_NOT_FOUND', state };

  return {
    ok: true,
    state: {
      ...state,
      version: state.version + 1,
      updatedAt: now,
      barbers: state.barbers.map((b) =>
        b.id === barberId ? { ...b, onDuty: Boolean(onDuty) } : b
      ),
    },
  };
}

export function updateSettings(state, patch, now = Date.now()) {
  return {
    ok: true,
    state: {
      ...state,
      version: state.version + 1,
      updatedAt: now,
      settings: {
        ...state.settings,
        ...patch,
      },
    },
  };
}

export function toggleServiceActive(state, serviceId, now = Date.now()) {
  const exists = state.services.some((s) => s.id === serviceId);
  if (!exists) return { ok: false, error: 'SERVICE_NOT_FOUND', state };

  return {
    ok: true,
    state: {
      ...state,
      version: state.version + 1,
      updatedAt: now,
      services: state.services.map((s) =>
        s.id === serviceId ? { ...s, active: !s.active } : s
      ),
    },
  };
}

export function upsertService(state, serviceInput, now = Date.now()) {
  const nameEn = String(serviceInput.nameEn || '').trim();
  const nameGu = String(serviceInput.nameGu || nameEn).trim();
  const minutes = Number(serviceInput.minutes);
  const price = Number(serviceInput.price);

  if (!nameEn || !Number.isFinite(minutes) || minutes <= 0 || !Number.isFinite(price) || price < 0) {
    return { ok: false, error: 'INVALID_SERVICE', state };
  }

  const existingIdx = serviceInput.id
    ? state.services.findIndex((s) => s.id === serviceInput.id)
    : -1;

  let services;
  if (existingIdx >= 0) {
    services = state.services.map((s) =>
      s.id === serviceInput.id
        ? {
            ...s,
            nameEn,
            nameGu,
            minutes: Math.round(minutes),
            price: Math.round(price),
            active: serviceInput.active ?? s.active,
          }
        : s
    );
  } else {
    const id = `srv-${now.toString(36)}`;
    services = [
      ...state.services,
      {
        id,
        nameEn,
        nameGu,
        minutes: Math.round(minutes),
        price: Math.round(price),
        active: true,
      },
    ];
  }

  return {
    ok: true,
    state: {
      ...state,
      version: state.version + 1,
      updatedAt: now,
      services,
    },
  };
}

export function getTodayStats(state) {
  const servedTickets = state.tickets.filter((t) => t.status === TICKET_STATUS.DONE);
  const noShows = state.tickets.filter((t) => t.status === TICKET_STATUS.NO_SHOW);
  const waiting = getWaitingTickets(state);

  const waitSamples = servedTickets
    .filter((t) => t.joinedAt && (t.startedAt || t.calledAt))
    .map((t) => Math.max(0, Math.round(((t.startedAt || t.calledAt) - t.joinedAt) / 60000)));

  const avgWaitMinutes =
    waitSamples.length > 0
      ? Math.round(waitSamples.reduce((a, b) => a + b, 0) / waitSamples.length)
      : 0;

  return {
    servedCount: servedTickets.length,
    avgWaitMinutes,
    noShowCount: noShows.length,
    waitingCount: waiting.length,
  };
}
