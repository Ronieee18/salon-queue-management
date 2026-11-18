import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  PhoneCall,
  Clock,
  AlertTriangle,
  X,
  RotateCcw,
  Monitor,
  Settings,
  Check,
  UserX,
  Play,
  CheckCircle2,
  Ban,
} from 'lucide-react';
import {
  LONG_WAIT_AMBER_MINUTES,
  MAX_SERVICES_PER_TICKET,
  NO_SHOW_GRACE_MINUTES,
  TICKET_STATUS,
  getBarberCurrentTicket,
  getBarberStatus,
  getNextEligibleTicketForBarber,
  getRecentNoShows,
  getRemainingMinutesForTicket,
  getWaitingTickets,
  isValidPhone,
} from '../../shared/queueRules';
import { useLanguage } from '../i18n/LanguageContext';
import { useQueue } from '../store/QueueContext';
import Header from '../components/Header';
import StaffPinGate from '../components/StaffPinGate';
import BarberAvatar from '../components/BarberAvatar';

function ReceptionContent() {
  const { t, serviceName, barberName } = useLanguage();
  const { state, now, actions } = useQueue();

  const [toast, setToast] = useState('');
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInServices, setWalkInServices] = useState([]);
  const [walkInBarber, setWalkInBarber] = useState('any');
  const [walkInError, setWalkInError] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast((cur) => (cur === msg ? '' : cur)), 3500);
  };

  const onDutyBarbers = state.barbers.filter((b) => b.onDuty);
  const waitingTickets = getWaitingTickets(state);
  const recentNoShows = getRecentNoShows(state);
  const activeServices = state.services.filter((s) => s.active);
  const serviceMap = new Map(state.services.map((s) => [s.id, s]));
  const barberMap = new Map(state.barbers.map((b) => [b.id, b]));

  const handleCallNext = async (barber) => {
    const res = await actions.callNext(barber.id);
    if (res.ok && res.ticket) {
      showToast(
        t('calledSuccess', { token: res.ticket.token, barber: barberName(barber) })
      );
    }
  };

  const handleMarkNoShow = async (ticket) => {
    if (!window.confirm(t('confirmNoShowCustomer', { token: ticket.token, name: ticket.name }))) {
      return;
    }
    await actions.markNoShow(ticket.id);
  };

  const handleCancelTicket = async (ticket) => {
    if (!window.confirm(t('confirmCancelCustomer', { token: ticket.token, name: ticket.name }))) {
      return;
    }
    await actions.cancelTicket(ticket.id);
  };

  const handleReAddNoShow = async (ticket) => {
    const res = await actions.reAddNoShow(ticket.id);
    if (res.ok && res.ticket) {
      showToast(
        t('reAddedSuccess', { name: res.ticket.name, token: res.ticket.token })
      );
    }
  };

  const toggleWalkInService = (srvId) => {
    setWalkInError('');
    if (walkInServices.includes(srvId)) {
      setWalkInServices((prev) => prev.filter((id) => id !== srvId));
    } else if (walkInServices.length < MAX_SERVICES_PER_TICKET) {
      setWalkInServices((prev) => [...prev, srvId]);
    } else {
      setWalkInError(t('maxServicesAlert'));
    }
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    if (!walkInName.trim()) {
      setWalkInError(t('errNameRequired'));
      return;
    }
    if (!isValidPhone(walkInPhone)) {
      setWalkInError(t('errInvalidPhone'));
      return;
    }
    if (walkInServices.length === 0) {
      setWalkInError(t('errServiceRequired'));
      return;
    }

    const res = await actions.joinQueue({
      name: walkInName.trim(),
      phone: walkInPhone,
      serviceIds: walkInServices,
      preferredBarberId: walkInBarber,
      isWalkIn: true,
    });

    if (res.ok && res.ticket) {
      setWalkInOpen(false);
      setWalkInName('');
      setWalkInPhone('');
      setWalkInServices([]);
      setWalkInBarber('any');
      setWalkInError('');
      showToast(
        res.duplicate
          ? t('duplicateSpotToast')
          : t('walkInAddedSuccess', { name: res.ticket.name, token: res.ticket.token })
      );
    } else {
      setWalkInError(res.error || 'Error');
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] text-gray-100 flex flex-col">
      <Header title={t('receptionTitle')} backTo="/" maxWidth="max-w-7xl" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-5 space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-3.5 py-1.5 rounded-full bg-[#1F2937] border border-gray-700 text-sm font-bold text-[#F5D77A]">
              {t('waitingCountBadge', { count: waitingTickets.length })}
            </span>
            <Link
              to="/display"
              className="min-h-[44px] px-3.5 rounded-xl bg-[#1F2937] border border-gray-700 hover:border-[#D4A017] text-xs font-semibold text-gray-200 inline-flex items-center gap-1.5 transition-colors"
            >
              <Monitor className="w-4 h-4 text-[#D4A017]" />
              {t('navDisplay')}
            </Link>
            <Link
              to="/admin"
              className="min-h-[44px] px-3.5 rounded-xl bg-[#1F2937] border border-gray-700 hover:border-[#D4A017] text-xs font-semibold text-gray-200 inline-flex items-center gap-1.5 transition-colors"
            >
              <Settings className="w-4 h-4 text-[#D4A017]" />
              {t('navAdmin')}
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setWalkInOpen(true)}
            className="min-h-[48px] px-5 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#EAB308] hover:from-[#e0ac22] hover:to-[#f0c020] text-[#111827] font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-[#D4A017]/20 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('addWalkIn')}</span>
          </button>
        </div>

        {/* Toast feedback */}
        {toast && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        {/* 3-Column Barber Cards Row (with time-left progress bars) */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            {t('barbersChairs')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {onDutyBarbers.map((barber) => {
              const bStatus = getBarberStatus(state, barber.id);
              const current = getBarberCurrentTicket(state, barber.id);
              const nextEligible = getNextEligibleTicketForBarber(state, barber.id);
              const remainingMin = current ? getRemainingMinutesForTicket(current, now) : 0;
              const totalMin = current?.totalMinutes || 30;
              const progressPct = current
                ? Math.min(100, Math.max(5, Math.round(((totalMin - remainingMin) / totalMin) * 100)))
                : 0;
              const calledMinutesAgo =
                current?.status === TICKET_STATUS.CALLED && current.calledAt
                  ? Math.max(0, Math.floor((now - current.calledAt) / 60000))
                  : 0;

              const statusBadge =
                bStatus === 'free'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : bStatus === 'in_chair'
                    ? 'bg-[#D4A017]/15 text-[#F5D77A] border-[#D4A017]/40'
                    : bStatus === 'called'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-gray-700/60 text-gray-300 border-gray-600';

              const statusText =
                bStatus === 'free'
                  ? t('statusFree')
                  : bStatus === 'in_chair'
                    ? t('statusBusy')
                    : bStatus === 'called'
                      ? t('statusCalled')
                      : t('statusOnBreak');

              const canCallNext = bStatus === 'free' && Boolean(nextEligible);

              return (
                <div
                  key={barber.id}
                  className="bg-[#1F2937] border border-gray-700/80 rounded-2xl p-4 flex flex-col justify-between gap-4 shadow-lg"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <BarberAvatar barber={barber} size="md" />
                      <div className="min-w-0">
                        <Link
                          to={`/barber/${barber.id}`}
                          className="font-bold text-base text-white hover:text-[#F5D77A] transition-colors truncate block"
                        >
                          {barberName(barber)}
                        </Link>
                        <span
                          className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border mt-0.5 ${statusBadge}`}
                        >
                          {statusText}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Current Customer Panel */}
                  <div className="bg-[#111827] border border-gray-700/80 rounded-xl p-3.5 min-h-[112px] flex flex-col justify-between">
                    {current ? (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-xs font-extrabold text-[#F5D77A] tracking-wide">
                              {current.token}
                            </span>
                            <p className="font-bold text-white text-sm truncate">{current.name}</p>
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              {current.serviceIds
                                .map((id) => serviceName(serviceMap.get(id)))
                                .filter(Boolean)
                                .join(', ')}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-gray-300 shrink-0 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#D4A017]" />
                            {t('timeLeft', { min: remainingMin })}
                          </span>
                        </div>

                        {/* Time-left progress bar */}
                        <div className="mt-3 space-y-1.5">
                          <div className="h-2.5 w-full rounded-full bg-gray-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                current.status === TICKET_STATUS.CALLED
                                  ? 'bg-amber-400 animate-pulse'
                                  : 'bg-gradient-to-r from-[#D4A017] to-[#F5C542]'
                              }`}
                              style={{
                                width: `${current.status === TICKET_STATUS.CALLED ? 15 : progressPct}%`,
                              }}
                            />
                          </div>

                          {current.status === TICKET_STATUS.CALLED && (
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <span
                                className={`text-[11px] font-semibold ${
                                  calledMinutesAgo >= NO_SHOW_GRACE_MINUTES
                                    ? 'text-red-400'
                                    : 'text-amber-300'
                                }`}
                              >
                                {calledMinutesAgo >= NO_SHOW_GRACE_MINUTES
                                  ? t('graceWindowExceeded')
                                  : t('calledSince', { min: calledMinutesAgo })}
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="my-auto text-center py-2">
                        <p className="text-sm font-semibold text-gray-400">
                          {bStatus === 'on_break' ? t('statusOnBreak') : t('chairEmpty')}
                        </p>
                        {nextEligible && bStatus === 'free' && (
                          <p className="text-xs text-[#F5D77A] mt-1">
                            {t('nextForYou')}: <strong>{nextEligible.token}</strong> ({nextEligible.name})
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer Action Buttons */}
                  {current?.status === TICKET_STATUS.CALLED ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => actions.startService(current.id)}
                        className="min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        {t('startBtn')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkNoShow(current)}
                        className="min-h-[44px] rounded-xl bg-red-600/20 border border-red-500/50 hover:bg-red-600/30 text-red-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        {t('markNoShow')}
                      </button>
                    </div>
                  ) : current?.status === TICKET_STATUS.IN_CHAIR ? (
                    <button
                      type="button"
                      onClick={() => actions.completeService(current.id)}
                      className="w-full min-h-[44px] rounded-xl bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-300 font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {t('doneBtn')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!canCallNext}
                      onClick={() => handleCallNext(barber)}
                      className={`w-full min-h-[48px] rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all ${
                        canCallNext
                          ? 'bg-[#D4A017] hover:bg-[#e5b226] text-[#111827] shadow-md shadow-[#D4A017]/20 cursor-pointer'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>
                        {canCallNext
                          ? `${t('callNext')} (${nextEligible.token})`
                          : bStatus === 'on_break'
                            ? t('statusOnBreak')
                            : t('noEligibleShort')}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Waiting List Panel (FIFO, >60m amber highlight) */}
        <section className="bg-[#1F2937] border border-gray-700/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-5 py-4 border-b border-gray-700/80 flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-white">{t('waitingListTitle')}</h2>
            <span className="text-xs text-gray-400">
              {t('waitingCountBadge', { count: waitingTickets.length })}
            </span>
          </div>

          {waitingTickets.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <p className="text-lg font-bold text-emerald-300">{t('noOneWaiting')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700/70">
              {waitingTickets.map((tk, idx) => {
                const waitedMin = Math.max(0, Math.floor((now - tk.joinedAt) / 60000));
                const isLongWait = waitedMin > LONG_WAIT_AMBER_MINUTES;
                const prefBarber =
                  tk.preferredBarberId !== 'any' ? barberMap.get(tk.preferredBarberId) : null;

                return (
                  <div
                    key={tk.id}
                    className={`p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-colors ${
                      isLongWait
                        ? 'bg-amber-500/12 border-l-4 border-l-amber-400'
                        : 'hover:bg-[#111827]/40'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <span className="w-7 text-center text-xs font-bold text-gray-500 shrink-0">
                        #{idx + 1}
                      </span>
                      <Link
                        to={`/status/${tk.id}`}
                        className="px-3 py-1.5 rounded-xl bg-[#111827] border border-[#D4A017]/50 text-[#F5D77A] font-extrabold text-sm shrink-0 hover:border-[#D4A017]"
                      >
                        {tk.token}
                      </Link>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">{tk.name}</span>
                          <span className="text-xs text-gray-400">{tk.phone}</span>
                          {isLongWait && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[11px] font-bold">
                              <AlertTriangle className="w-3 h-3" />
                              {t('longWaitTag')}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {tk.serviceIds.map((sid) => {
                            const srv = serviceMap.get(sid);
                            if (!srv) return null;
                            return (
                              <span
                                key={sid}
                                className="text-[11px] px-2 py-0.5 rounded-md bg-[#111827] border border-gray-700 text-gray-300"
                              >
                                {serviceName(srv)}
                              </span>
                            );
                          })}
                          <span className="text-[11px] text-gray-400">
                            · {tk.totalMinutes} {t('min')} · ₹{tk.totalPrice}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-3 pl-10 lg:pl-0 shrink-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                            prefBarber
                              ? 'bg-[#D4A017]/15 border-[#D4A017]/40 text-[#F5D77A]'
                              : 'bg-gray-800 border-gray-700 text-gray-300'
                          }`}
                        >
                          {prefBarber ? barberName(prefBarber) : t('anyBarberShort')}
                        </span>

                        <span
                          className={`text-xs font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg ${
                            isLongWait
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-[#111827] text-gray-300'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {t('waitingFor', { min: waitedMin })}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCancelTicket(tk)}
                        className="min-h-[44px] px-3.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 text-red-300 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent No-Shows Section (Re-add at END with new token) */}
        {recentNoShows.length > 0 && (
          <section className="bg-[#1F2937] border border-gray-700/80 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {t('recentNoShows', { count: recentNoShows.length })}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentNoShows.slice(0, 6).map((tk) => (
                <div
                  key={tk.id}
                  className="bg-[#111827] border border-gray-700/80 rounded-xl p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      <span className="text-red-400 mr-1.5">{tk.token}</span>
                      {tk.name}
                    </p>
                    <p className="text-xs text-gray-400">{tk.phone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleReAddNoShow(tk)}
                    className="min-h-[44px] px-3 rounded-xl bg-[#D4A017]/15 hover:bg-[#D4A017]/25 border border-[#D4A017]/50 text-[#F5D77A] font-bold text-xs inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {t('reAddToEnd')}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Quick Walk-In Modal */}
      {walkInOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-[#1F2937] border border-gray-700 rounded-3xl p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-white">{t('walkInModalTitle')}</h3>
              <button
                type="button"
                onClick={() => setWalkInOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-[#111827] text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-400">{t('walkInModalNote')}</p>

            <form onSubmit={handleWalkInSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder={t('fullNamePlaceholder')}
                  className="min-h-[46px] px-3.5 rounded-xl bg-[#111827] border border-gray-600 focus:border-[#D4A017] focus:outline-none text-sm text-white"
                />
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={walkInPhone}
                  onChange={(e) =>
                    setWalkInPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                  }
                  placeholder={t('phonePlaceholder')}
                  className="min-h-[46px] px-3.5 rounded-xl bg-[#111827] border border-gray-600 focus:border-[#D4A017] focus:outline-none text-sm text-white"
                />
              </div>

              <div>
                <p className="text-xs font-bold text-gray-300 mb-2">
                  {t('selectServices')} ({t('selectedCount', { count: walkInServices.length })})
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {activeServices.map((srv) => {
                    const selected = walkInServices.includes(srv.id);
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => toggleWalkInService(srv.id)}
                        className={`min-h-[44px] px-3 py-2 rounded-xl border text-left text-xs font-semibold flex items-center justify-between gap-2 cursor-pointer ${
                          selected
                            ? 'bg-[#D4A017]/20 border-[#D4A017] text-white'
                            : 'bg-[#111827] border-gray-700 text-gray-300'
                        }`}
                      >
                        <span className="truncate">{serviceName(srv)}</span>
                        <span className="text-[#F5D77A] shrink-0 flex items-center gap-1">
                          ₹{srv.price}
                          {selected && <Check className="w-3.5 h-3.5" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-300 mb-2">{t('chooseBarber')}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setWalkInBarber('any')}
                    className={`min-h-[44px] px-3.5 rounded-xl border text-xs font-bold cursor-pointer ${
                      walkInBarber === 'any'
                        ? 'bg-[#D4A017] border-[#D4A017] text-[#111827]'
                        : 'bg-[#111827] border-gray-700 text-gray-300'
                    }`}
                  >
                    {t('anyBarberShort')}
                  </button>
                  {onDutyBarbers.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setWalkInBarber(b.id)}
                      className={`min-h-[44px] px-3.5 rounded-xl border text-xs font-bold cursor-pointer ${
                        walkInBarber === b.id
                          ? 'bg-[#D4A017] border-[#D4A017] text-[#111827]'
                          : 'bg-[#111827] border-gray-700 text-gray-300'
                      }`}
                    >
                      {barberName(b)}
                    </button>
                  ))}
                </div>
              </div>

              {walkInError && <p className="text-xs text-red-400 font-semibold">{walkInError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWalkInOpen(false)}
                  className="min-h-[46px] px-4 rounded-xl bg-[#111827] border border-gray-600 text-gray-300 font-bold text-sm cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="min-h-[46px] px-6 rounded-xl bg-[#D4A017] hover:bg-[#e5b226] text-[#111827] font-extrabold text-sm cursor-pointer"
                >
                  {t('addWalkInSubmit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReceptionPage() {
  const { t } = useLanguage();
  return (
    <StaffPinGate screenTitle={t('receptionTitle')}>
      <ReceptionContent />
    </StaffPinGate>
  );
}
