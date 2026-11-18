import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TICKET_STATUS,
  createInitialState,
  joinQueue,
  callNextForBarber,
  startService,
  completeService,
  markNoShow,
  reAddNoShow,
  cancelTicket,
  toggleBarberBreak,
  toggleServiceActive,
  updateSettings,
  calculateEstimatedWait,
  getWaitingTickets,
  isOnlineJoiningOpen,
  getTodayStats,
} from '../shared/queueRules.js';

test('1. Join with 2 services computes correct total time & price; enforces max 3 services & phone validation', () => {
  const state = createInitialState(1_700_000_000_000);

  // Invalid phone
  const badPhone = joinQueue(state, {
    name: 'Test User',
    phone: '12345',
    serviceIds: ['srv-haircut'],
  });
  assert.equal(badPhone.ok, false);
  assert.equal(badPhone.error, 'INVALID_PHONE');

  // 4 services rejected
  const tooMany = joinQueue(state, {
    name: 'Test User',
    phone: '9999988888',
    serviceIds: ['srv-haircut', 'srv-beard', 'srv-spa', 'srv-wash'],
  });
  assert.equal(tooMany.ok, false);
  assert.equal(tooMany.error, 'MAX_SERVICES_EXCEEDED');

  // 2 services accepted with exact totals: Haircut (30m ₹150) + Beard Trim (15m ₹80) = 45m ₹230
  const okRes = joinQueue(state, {
    name: 'Karan Shah',
    phone: '9999988888',
    serviceIds: ['srv-haircut', 'srv-beard'],
    preferredBarberId: 'any',
  });
  assert.equal(okRes.ok, true);
  assert.equal(okRes.duplicate, false);
  assert.equal(okRes.ticket.totalMinutes, 45);
  assert.equal(okRes.ticket.totalPrice, 230);
  assert.equal(okRes.ticket.status, TICKET_STATUS.WAITING);
});

test('2. Same phone joins twice -> returns existing active spot, no duplicate created', () => {
  const base = createInitialState(1_700_000_000_000);
  const first = joinQueue(base, {
    name: 'Mihir Patel',
    phone: '9876500001',
    serviceIds: ['srv-haircut'],
  });
  assert.equal(first.ok, true);
  assert.equal(first.duplicate, false);

  const second = joinQueue(first.state, {
    name: 'Mihir Patel',
    phone: '9876500001',
    serviceIds: ['srv-beard'],
  });
  assert.equal(second.ok, true);
  assert.equal(second.duplicate, true);
  assert.equal(second.ticket.id, first.ticket.id);
  assert.equal(second.state.tickets.length, first.state.tickets.length);
});

test('3. Call next for Amit skips a customer who explicitly chose Ravi', () => {
  const base = createInitialState(1_700_000_000_000);
  // In initial state, first waiting ticket is S-12 (Kunal Desai) who chose 'ravi'.
  // Second waiting ticket is S-13 (Devansh Trivedi) who chose 'any'.
  // Amit is currently free!
  const waitingBefore = getWaitingTickets(base);
  assert.equal(waitingBefore[0].id, 'S-12');
  assert.equal(waitingBefore[0].preferredBarberId, 'ravi');
  assert.equal(waitingBefore[1].id, 'S-13');
  assert.equal(waitingBefore[1].preferredBarberId, 'any');

  const res = callNextForBarber(base, 'amit');
  assert.equal(res.ok, true);
  assert.equal(res.ticket.id, 'S-13');
  assert.equal(res.ticket.assignedBarberId, 'amit');
  assert.equal(res.ticket.status, TICKET_STATUS.CALLED);

  // S-12 must still be waiting for Ravi!
  const s12 = res.state.tickets.find((t) => t.id === 'S-12');
  assert.equal(s12.status, TICKET_STATUS.WAITING);
});

test('4. Forward-only status transitions & 1 customer per chair', () => {
  const base = createInitialState(1_700_000_000_000);
  const called = callNextForBarber(base, 'amit');
  assert.equal(called.ok, true);

  // Amit cannot call a 2nd customer while S-13 is Called
  const secondCall = callNextForBarber(called.state, 'amit');
  assert.equal(secondCall.ok, false);
  assert.equal(secondCall.error, 'BARBER_BUSY');

  // Cannot complete directly from CALLED (must Start first)
  const badDone = completeService(called.state, called.ticket.id);
  assert.equal(badDone.ok, false);
  assert.equal(badDone.error, 'INVALID_TRANSITION');

  // Start -> In Chair
  const started = startService(called.state, called.ticket.id);
  assert.equal(started.ok, true);
  assert.equal(started.ticket.status, TICKET_STATUS.IN_CHAIR);

  // Cannot cancel once In Chair
  const badCancel = cancelTicket(started.state, called.ticket.id);
  assert.equal(badCancel.ok, false);

  // Done -> leaves active queue
  const done = completeService(started.state, called.ticket.id);
  assert.equal(done.ok, true);
  assert.equal(done.ticket.status, TICKET_STATUS.DONE);
});

test('5. No-show frees barber, and Re-add places customer at END of queue with new token', () => {
  const base = createInitialState(1_700_000_000_000);
  const called = callNextForBarber(base, 'amit');
  const noShow = markNoShow(called.state, called.ticket.id);
  assert.equal(noShow.ok, true);
  assert.equal(noShow.ticket.status, TICKET_STATUS.NO_SHOW);

  const reAdded = reAddNoShow(noShow.state, called.ticket.id);
  assert.equal(reAdded.ok, true);
  assert.notEqual(reAdded.ticket.id, called.ticket.id);

  const waiting = getWaitingTickets(reAdded.state);
  const lastInQueue = waiting[waiting.length - 1];
  assert.equal(lastInQueue.id, reAdded.ticket.id);
  assert.equal(lastInQueue.name, called.ticket.name);
});

test('6. Closing online queue disables remote join, allows walk-ins, and 30-min closing cutoff works', () => {
  const base = createInitialState(1_700_000_000_000);
  const closed = updateSettings(base, { onlineQueueOpen: false }).state;

  assert.equal(isOnlineJoiningOpen(closed).open, false);

  const onlineJoin = joinQueue(closed, {
    name: 'Online User',
    phone: '9111122222',
    serviceIds: ['srv-haircut'],
    isWalkIn: false,
  });
  assert.equal(onlineJoin.ok, false);

  const walkInJoin = joinQueue(closed, {
    name: 'Walk-in User',
    phone: '9111122222',
    serviceIds: ['srv-haircut'],
    isWalkIn: true,
  });
  assert.equal(walkInJoin.ok, true);

  // Test 30-min closing cutoff rule (closing 21:00 -> 20:35 must close online joining)
  const cutoffEnabled = updateSettings(base, {
    onlineQueueOpen: true,
    closingTime: '21:00',
    enforceClosingCutoff: true,
  }).state;

  const at2015 = new Date(2026, 10, 18, 20, 15).getTime();
  const at2035 = new Date(2026, 10, 18, 20, 35).getTime();
  assert.equal(isOnlineJoiningOpen(cutoffEnabled, at2015).open, true);
  assert.equal(isOnlineJoiningOpen(cutoffEnabled, at2035).open, false);
  assert.equal(isOnlineJoiningOpen(cutoffEnabled, at2035).reason, 'CLOSING_SOON');
});

test('7. Waiting time is positive when people are ahead and decreases as customers finish', () => {
  const now = 1_700_000_000_000;
  const base = createInitialState(now);
  const lastWaiting = getWaitingTickets(base).at(-1);

  const waitBefore = calculateEstimatedWait(
    base,
    { preferredBarberId: lastWaiting.preferredBarberId, ticketId: lastWaiting.id },
    now
  );
  assert.ok(waitBefore > 0, `Expected positive wait, got ${waitBefore}`);

  // Complete Ravi's current customer (S-11) and call + finish S-13 with Amit
  let s = completeService(base, 'S-11', now).state;
  const called = callNextForBarber(s, 'amit', now);
  s = startService(called.state, called.ticket.id, now).state;
  s = completeService(s, called.ticket.id, now).state;

  const waitAfter = calculateEstimatedWait(
    s,
    { preferredBarberId: lastWaiting.preferredBarberId, ticketId: lastWaiting.id },
    now
  );
  assert.ok(
    waitAfter < waitBefore,
    `Expected wait to drop after customers finish: before=${waitBefore}, after=${waitAfter}`
  );
});

test('8. Barber on break cannot call next; hiding service blocks it from new joins; stats compute', () => {
  const base = createInitialState(1_700_000_000_000);
  // Imran starts on break
  const breakCall = callNextForBarber(base, 'imran');
  assert.equal(breakCall.ok, false);
  assert.equal(breakCall.error, 'BARBER_ON_BREAK');

  // Take Imran off break -> can now call next
  const back = toggleBarberBreak(base, 'imran', false).state;
  const okCall = callNextForBarber(back, 'imran');
  assert.equal(okCall.ok, true);

  // Hide haircut service -> joining with only haircut fails
  const hidden = toggleServiceActive(base, 'srv-haircut').state;
  const joinHidden = joinQueue(hidden, {
    name: 'Hidden Test',
    phone: '9222233333',
    serviceIds: ['srv-haircut'],
  });
  assert.equal(joinHidden.ok, false);
  assert.equal(joinHidden.error, 'SERVICE_REQUIRED');

  const stats = getTodayStats(base);
  assert.equal(stats.servedCount, 2);
  assert.equal(stats.noShowCount, 1);
  assert.equal(stats.waitingCount, 6);
  assert.ok(stats.avgWaitMinutes > 0);
});
