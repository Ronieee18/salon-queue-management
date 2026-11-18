import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  Users,
  ArrowRight,
  Sparkles,
  Search,
  AlertCircle,
  Ticket,
  Scissors,
} from 'lucide-react';
import {
  ACTIVE_STATUSES,
  calculateEstimatedWait,
  findActiveTicketByPhone,
  getBarberStatus,
  getWaitingTickets,
  isOnlineJoiningOpen,
  isValidPhone,
} from '../../shared/queueRules';
import { useLanguage } from '../i18n/LanguageContext';
import { useQueue } from '../store/QueueContext';
import Header from '../components/Header';
import BarberAvatar from '../components/BarberAvatar';

export default function HomePage() {
  const { t, barberName } = useLanguage();
  const { state, now, myTokenId, setMyTokenId } = useQueue();
  const navigate = useNavigate();

  const [showLookup, setShowLookup] = useState(false);
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupError, setLookupError] = useState('');

  const waitingTickets = getWaitingTickets(state);
  const waitingCount = waitingTickets.length;
  const estWait = calculateEstimatedWait(state, { preferredBarberId: 'any' }, now);
  const onlineStatus = isOnlineJoiningOpen(state, now);

  const onDutyBarbers = state.barbers.filter((b) => b.onDuty);
  const workingBarbersCount = onDutyBarbers.filter((b) => !b.onBreak).length;

  const myActiveTicket = myTokenId
    ? state.tickets.find((tk) => tk.id === myTokenId && ACTIVE_STATUSES.has(tk.status))
    : null;

  const statusMeta = (barberStatus) => {
    switch (barberStatus) {
      case 'free':
        return { label: t('statusFree'), dot: 'bg-emerald-400', text: 'text-emerald-300' };
      case 'in_chair':
        return { label: t('statusBusy'), dot: 'bg-[#D4A017]', text: 'text-[#F5D77A]' };
      case 'called':
        return { label: t('statusCalled'), dot: 'bg-amber-400', text: 'text-amber-300' };
      case 'on_break':
        return { label: t('statusOnBreak'), dot: 'bg-gray-400', text: 'text-gray-400' };
      default:
        return { label: t('statusOffDuty'), dot: 'bg-gray-600', text: 'text-gray-500' };
    }
  };

  const handleLookup = (e) => {
    e.preventDefault();
    if (!isValidPhone(lookupPhone)) {
      setLookupError(t('errInvalidPhone'));
      return;
    }
    const found = findActiveTicketByPhone(state, lookupPhone);
    if (!found) {
      setLookupError(t('tokenNotFoundPhone'));
      return;
    }
    setMyTokenId(found.id);
    navigate(`/status/${found.id}`);
  };

  const openBadgeText = onlineStatus.open
    ? t('openBadge')
    : onlineStatus.reason === 'CLOSING_SOON'
      ? t('closingSoonBadge')
      : t('closedBadge');

  return (
    <div className="min-h-screen bg-[#111827] text-gray-100 flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Salon Hero Badge */}
        <section className="flex flex-col items-center text-center pt-1">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
              onlineStatus.open
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                onlineStatus.open ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            {openBadgeText}
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mt-3 tracking-tight">
            {t('salonName')}
          </h2>
          <p className="text-sm text-gray-400 mt-1">{t('salonTagline')}</p>
        </section>

        {/* Active Token Shortcut if user already joined */}
        {myActiveTicket && (
          <section className="bg-gradient-to-r from-[#D4A017]/20 to-[#D4A017]/5 border border-[#D4A017]/50 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#D4A017] text-[#111827] flex items-center justify-center shrink-0">
                <Ticket className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[#F5D77A] font-semibold uppercase tracking-wider">
                  {t('myActiveToken')}
                </p>
                <p className="text-lg font-extrabold text-white truncate">
                  {myActiveTicket.token} · {myActiveTicket.name}
                </p>
              </div>
            </div>
            <Link
              to={`/status/${myActiveTicket.id}`}
              className="min-h-[44px] px-4 rounded-xl bg-[#D4A017] hover:bg-[#e5b226] text-[#111827] font-bold text-sm flex items-center gap-1.5 shrink-0 transition-colors"
            >
              {t('viewMyStatus')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </section>
        )}

        {/* Live Queue Status Card */}
        <section className="bg-[#1F2937] border border-gray-700/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-[#D4A017]/10 blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D4A017] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              {t('liveQueueTitle')}
            </span>
            <span className="text-xs text-gray-400 bg-[#111827] px-2.5 py-1 rounded-full border border-gray-700">
              {t('activeBarbersLabel', { count: workingBarbersCount })}
            </span>
          </div>

          {waitingCount === 0 ? (
            <div className="py-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <Scissors className="w-6 h-6" />
              </div>
              <p className="text-xl font-bold text-emerald-300">{t('noOneWaiting')}</p>
              <p className="text-sm text-gray-400 mt-1">
                {estWait === 0 ? t('readyNow') : t('aboutWait', { min: estWait })}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#111827] border border-gray-700/80 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1">
                  <Users className="w-4 h-4 text-[#D4A017]" />
                  <span>{t('waitingListTitle')}</span>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white">{waitingCount}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {waitingCount === 1
                    ? t('onePersonWaiting')
                    : t('peopleWaiting', { count: waitingCount })}
                </p>
              </div>

              <div className="bg-[#111827] border border-gray-700/80 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1">
                  <Clock className="w-4 h-4 text-[#D4A017]" />
                  <span>{t('estimatedWaitLabel')}</span>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#F5D77A]">
                  ~{estWait} <span className="text-base font-semibold">{t('min')}</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {estWait === 0 ? t('readyNow') : t('aboutWait', { min: estWait })}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Barber Status Chips */}
        <section className="bg-[#1F2937] border border-gray-700/80 rounded-2xl p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
            {t('barbersOnDuty')}
          </h3>
          {onDutyBarbers.length === 0 ? (
            <p className="text-sm text-gray-400">{t('noBarbersNotice')}</p>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {onDutyBarbers.map((barber) => {
                const st = getBarberStatus(state, barber.id);
                const meta = statusMeta(st);
                return (
                  <div
                    key={barber.id}
                    className="flex items-center gap-2.5 bg-[#111827] border border-gray-700/80 rounded-xl px-3 py-2 min-h-[44px]"
                  >
                    <BarberAvatar barber={barber} size="sm" />
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">
                        {barberName(barber)}
                      </p>
                      <p className={`text-xs font-medium flex items-center gap-1.5 ${meta.text}`}>
                        <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Primary Join Queue CTA */}
        <section className="space-y-3">
          {!onlineStatus.open && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p>
                {onlineStatus.reason === 'CLOSING_SOON'
                  ? t('closingSoonNotice')
                  : onlineStatus.reason === 'NO_BARBERS_ON_DUTY'
                    ? t('noBarbersNotice')
                    : t('onlineClosedNotice')}
              </p>
            </div>
          )}

          {onlineStatus.open ? (
            <Link
              to="/join"
              className="w-full min-h-[56px] rounded-2xl bg-gradient-to-r from-[#D4A017] to-[#EAB308] hover:from-[#e0ac22] hover:to-[#f0c020] text-[#111827] font-extrabold text-lg shadow-lg shadow-[#D4A017]/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <span>{t('joinQueueCta')}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="w-full min-h-[56px] rounded-2xl bg-gray-700 text-gray-400 font-bold text-lg flex items-center justify-center gap-2 cursor-not-allowed opacity-70"
            >
              <span>{t('joinQueueCta')}</span>
            </button>
          )}
        </section>

        {/* Lookup Existing Token by Phone */}
        <section className="pt-1">
          {!showLookup ? (
            <button
              type="button"
              onClick={() => setShowLookup(true)}
              className="w-full min-h-[44px] text-sm text-gray-400 hover:text-[#F5D77A] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{t('checkExistingSpot')}</span>
            </button>
          ) : (
            <form
              onSubmit={handleLookup}
              className="bg-[#1F2937] border border-gray-700 rounded-2xl p-4 space-y-3"
            >
              <div className="flex gap-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={lookupPhone}
                  onChange={(e) => {
                    setLookupPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                    setLookupError('');
                  }}
                  placeholder={t('findTokenPlaceholder')}
                  className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-[#111827] border border-gray-600 focus:border-[#D4A017] focus:outline-none text-white text-sm"
                />
                <button
                  type="submit"
                  className="min-h-[44px] px-4 rounded-xl bg-[#D4A017] text-[#111827] font-bold text-sm cursor-pointer"
                >
                  {t('findTokenBtn')}
                </button>
              </div>
              {lookupError && <p className="text-xs text-red-400">{lookupError}</p>}
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
