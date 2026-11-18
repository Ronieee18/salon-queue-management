import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Clock,
  Footprints,
  Scissors,
  XCircle,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  TICKET_STATUS,
  calculateEstimatedWait,
  getQueuePosition,
} from '../../shared/queueRules';
import { useLanguage } from '../i18n/LanguageContext';
import { useQueue } from '../store/QueueContext';
import Header from '../components/Header';
import BarberAvatar from '../components/BarberAvatar';

function formatElapsed(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function MyStatusPage() {
  const { id } = useParams();
  const location = useLocation();
  const { t, serviceName, barberName, ordinal } = useLanguage();
  const { state, now, actions } = useQueue();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [dismissedTurnOverlay, setDismissedTurnOverlay] = useState(false);
  const [liveTick, setLiveTick] = useState(() => Date.now());
  const [showDuplicateBanner, setShowDuplicateBanner] = useState(
    Boolean(location.state?.duplicate)
  );
  const vibratedRef = useRef(false);

  const ticket = state.tickets.find(
    (tk) => tk.id.toLowerCase() === String(id || '').toLowerCase()
  );

  // 1-second timer when In Chair so elapsed time ticks smoothly
  useEffect(() => {
    if (ticket?.status !== TICKET_STATUS.IN_CHAIR) return;
    const interval = setInterval(() => setLiveTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [ticket?.status]);

  // Trigger mobile vibration once when ticket transitions to CALLED
  useEffect(() => {
    if (ticket?.status === TICKET_STATUS.CALLED && !vibratedRef.current) {
      vibratedRef.current = true;
      setDismissedTurnOverlay(false);
      try {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate([250, 100, 250, 100, 400]);
        }
      } catch {
        // ignore unsupported vibration API
      }
    } else if (ticket?.status !== TICKET_STATUS.CALLED) {
      vibratedRef.current = false;
    }
  }, [ticket?.status]);

  if (!ticket) {
    return (
      <div className="min-h-screen bg-[#111827] text-gray-100 flex flex-col">
        <Header title={t('statusTitle')} backTo="/" />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-[#1F2937] border border-gray-700 rounded-3xl p-6 text-center space-y-4">
            <XCircle className="w-12 h-12 text-gray-500 mx-auto" />
            <h2 className="text-xl font-bold text-white">{t('ticketNotFoundTitle')}</h2>
            <p className="text-sm text-gray-400">{t('ticketNotFoundDesc')}</p>
            <Link
              to="/"
              className="inline-flex min-h-[48px] px-6 items-center justify-center rounded-xl bg-[#D4A017] text-[#111827] font-bold"
            >
              {t('backHome')}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const position = getQueuePosition(state, ticket.id);
  const estimatedWait = calculateEstimatedWait(
    state,
    { preferredBarberId: ticket.preferredBarberId, ticketId: ticket.id },
    now
  );

  const preferredBarber =
    ticket.preferredBarberId !== 'any'
      ? state.barbers.find((b) => b.id === ticket.preferredBarberId)
      : null;
  const assignedBarber = ticket.assignedBarberId
    ? state.barbers.find((b) => b.id === ticket.assignedBarberId)
    : null;

  const ticketServices = ticket.serviceIds
    .map((sid) => state.services.find((s) => s.id === sid))
    .filter(Boolean);

  const isWaiting = ticket.status === TICKET_STATUS.WAITING;
  const isCalled = ticket.status === TICKET_STATUS.CALLED;
  const isInChair = ticket.status === TICKET_STATUS.IN_CHAIR;
  const isDone = ticket.status === TICKET_STATUS.DONE;
  const isCancelled = ticket.status === TICKET_STATUS.CANCELLED;
  const isNoShow = ticket.status === TICKET_STATUS.NO_SHOW;

  // Circular countdown ring math (clamped to 60 min visual scale)
  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  const maxVisualMin = 60;
  const progressRatio = Math.max(0.08, Math.min(1, 1 - estimatedWait / maxVisualMin));
  const strokeDashoffset = circumference * (1 - progressRatio);

  const handleConfirmCancel = async () => {
    await actions.cancelTicket(ticket.id);
    setShowCancelModal(false);
  };

  // Full-screen exciting GOLD overlay when CALLED
  if (isCalled && !dismissedTurnOverlay) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5C542] via-[#D4A017] to-[#B8860B] text-[#111827] flex flex-col justify-between p-6">
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-lg">{t('salonName')}</span>
          <span className="px-3 py-1 rounded-full bg-[#111827]/15 font-bold text-xs uppercase tracking-wider">
            {ticket.token}
          </span>
        </div>

        <div className="my-auto text-center space-y-6 max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-[#111827] text-[#F5C542] flex items-center justify-center shadow-2xl animate-turn-pulse">
            <BellRing className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] opacity-80">
              {t('yourToken')} · {ticket.token}
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold leading-tight">
              {t('itsYourTurnTitle')}
            </h1>
            {assignedBarber && (
              <p className="text-2xl sm:text-3xl font-extrabold pt-2">
                {t('goToBarber', { name: barberName(assignedBarber) })}
              </p>
            )}
          </div>

          <div className="bg-[#111827]/12 border border-[#111827]/20 rounded-2xl p-4 text-left space-y-1.5">
            <p className="text-sm font-bold">{ticket.name}</p>
            <p className="text-xs font-semibold opacity-85">
              {ticketServices.map((s) => serviceName(s)).join(' · ')}
            </p>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto">
          <button
            type="button"
            onClick={() => setDismissedTurnOverlay(true)}
            className="w-full min-h-[52px] rounded-2xl bg-[#111827] text-[#F5C542] font-bold text-base shadow-xl cursor-pointer hover:bg-[#1F2937] transition-colors"
          >
            {t('viewTicketDetails')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827] text-gray-100 flex flex-col">
      <Header title={t('statusTitle')} backTo="/" />

      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Duplicate phone notice */}
        {showDuplicateBanner && (
          <div className="flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-[#D4A017]/15 border border-[#D4A017]/50 text-[#F5D77A] text-xs font-semibold">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{t('duplicateSpotToast')}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowDuplicateBanner(false)}
              className="text-xs underline shrink-0 cursor-pointer"
            >
              {t('close')}
            </button>
          </div>
        )}

        {/* Banner if CALLED and user minimized full-screen overlay */}
        {isCalled && (
          <button
            type="button"
            onClick={() => setDismissedTurnOverlay(false)}
            className="w-full min-h-[56px] p-4 rounded-2xl bg-gradient-to-r from-[#D4A017] to-[#EAB308] text-[#111827] font-extrabold flex items-center justify-between gap-3 shadow-lg cursor-pointer animate-pulse"
          >
            <span className="flex items-center gap-2 text-left">
              <BellRing className="w-5 h-5 shrink-0" />
              <span>
                {t('itsYourTurnTitle')}{' '}
                {assignedBarber ? `· ${t('goToBarber', { name: barberName(assignedBarber) })}` : ''}
              </span>
            </span>
            <span className="text-xs underline shrink-0">{t('showTurnAlert')}</span>
          </button>
        )}

        {/* When 2nd (or 1st) in line: 'Start coming to the salon' banner */}
        {isWaiting && position != null && position <= 2 && (
          <div className="p-4 rounded-2xl bg-[#D4A017]/20 border-2 border-[#D4A017] text-[#F5D77A] flex items-center gap-3 shadow-lg shadow-[#D4A017]/10">
            <div className="w-10 h-10 rounded-xl bg-[#D4A017] text-[#111827] flex items-center justify-center shrink-0">
              <Footprints className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold leading-snug">{t('startComingBanner')}</p>
          </div>
        )}

        {/* Barber on break banner if customer chose a specific barber who is currently on break */}
        {isWaiting && preferredBarber?.onBreak && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm font-semibold">
              {t('barberBreakBanner', { name: barberName(preferredBarber) })}
            </p>
          </div>
        )}

        {/* Main Token & Circular Countdown Card */}
        <section className="bg-[#1F2937] border border-gray-700/80 rounded-3xl p-6 text-center shadow-xl space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
              {t('yourToken')}
            </p>
            <div className="mt-1 inline-flex items-center justify-center px-6 py-2 rounded-2xl bg-[#111827] border-2 border-[#D4A017]/60">
              <span className="font-display text-5xl font-extrabold text-[#F5D77A] tracking-wide">
                {ticket.token}
              </span>
            </div>
            <p className="text-base font-bold text-white mt-2">{ticket.name}</p>
          </div>

          {isWaiting && (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4A017]/15 border border-[#D4A017]/40 text-[#F5D77A] font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>{t('inLinePosition', { pos: ordinal(position) })}</span>
              </div>

              {/* Circular SVG Countdown */}
              <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                <svg className="w-44 h-44 -rotate-90" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="#111827"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="#D4A017"
                    strokeWidth="12"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {t('estimatedWaitLabel')}
                  </span>
                  <span className="text-2xl font-extrabold text-white mt-0.5">
                    {estimatedWait === 0
                      ? t('readyNow')
                      : `${t('approx')} ${estimatedWait} ${t('min')}`}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#D4A017]" />
                {t('autoUpdatesNote')}
              </p>
            </>
          )}

          {isInChair && (
            <div className="py-4 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                <Scissors className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-emerald-300">{t('inChairTitle')}</h2>
              {assignedBarber && (
                <p className="text-sm text-gray-300">
                  {t('inChairWith', { name: barberName(assignedBarber) })}
                </p>
              )}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111827] border border-gray-700 text-lg font-mono font-bold text-[#F5D77A]">
                <Clock className="w-4 h-4" />
                <span>{formatElapsed(liveTick - (ticket.startedAt || liveTick))}</span>
              </div>
            </div>
          )}

          {isDone && (
            <div className="py-4 space-y-3">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
              <h2 className="text-2xl font-extrabold text-white">{t('doneTitle')}</h2>
              <p className="text-sm text-gray-300">{t('doneSubtitle')}</p>
              <Link
                to="/"
                className="inline-flex min-h-[48px] px-6 items-center justify-center rounded-xl bg-[#D4A017] text-[#111827] font-bold"
              >
                {t('backHome')}
              </Link>
            </div>
          )}

          {(isCancelled || isNoShow) && (
            <div className="py-4 space-y-3">
              <XCircle className="w-16 h-16 text-red-400 mx-auto" />
              <h2 className="text-2xl font-extrabold text-white">
                {isNoShow ? t('noShowTitle') : t('cancelledTitle')}
              </h2>
              <p className="text-sm text-gray-300">
                {isNoShow ? t('noShowSubtitle') : t('cancelledSubtitle')}
              </p>
              <Link
                to="/join"
                className="inline-flex min-h-[48px] px-6 items-center justify-center rounded-xl bg-[#D4A017] text-[#111827] font-bold"
              >
                {t('rejoinQueueBtn')}
              </Link>
            </div>
          )}
        </section>

        {/* Booking Details Card */}
        <section className="bg-[#1F2937] border border-gray-700/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-700/70">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {assignedBarber ? t('assignedBarberLabel') : t('preferredBarberLabel')}
            </span>
            <div className="flex items-center gap-2">
              {assignedBarber || preferredBarber ? (
                <>
                  <BarberAvatar barber={assignedBarber || preferredBarber} size="sm" />
                  <span className="text-sm font-bold text-white">
                    {barberName(assignedBarber || preferredBarber)}
                  </span>
                </>
              ) : (
                <span className="text-sm font-bold text-[#F5D77A]">{t('anyBarberShort')}</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {t('servicesBooked')}
            </p>
            {ticketServices.map((srv) => (
              <div
                key={srv.id}
                className="flex items-center justify-between text-sm py-1.5 border-b border-gray-800 last:border-0"
              >
                <span className="text-gray-200 font-medium">{serviceName(srv)}</span>
                <span className="text-gray-400 text-xs">
                  {srv.minutes} {t('min')} ·{' '}
                  <strong className="text-[#F5D77A]">₹{srv.price}</strong>
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-700 text-sm font-extrabold">
            <span className="text-gray-300">
              {ticket.totalMinutes} {t('min')}
            </span>
            <span className="text-[#F5D77A] text-base">₹{ticket.totalPrice}</span>
          </div>
        </section>

        {/* Cancel my spot button (only while Waiting) */}
        {isWaiting && (
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="w-full min-h-[48px] rounded-2xl bg-transparent border border-red-500/40 text-red-400 hover:bg-red-500/10 font-bold text-sm transition-colors cursor-pointer"
          >
            {t('cancelMySpot')}
          </button>
        )}
      </main>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm bg-[#1F2937] border border-gray-700 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">{t('cancelModalTitle')}</h3>
            <p className="text-sm text-gray-300">{t('cancelModalDesc')}</p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="min-h-[48px] rounded-xl bg-[#111827] border border-gray-600 text-gray-200 font-bold text-sm cursor-pointer"
              >
                {t('keepMySpot')}
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="min-h-[48px] rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm cursor-pointer"
              >
                {t('yesCancelSpot')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
