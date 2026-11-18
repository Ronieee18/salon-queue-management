import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Play,
  CheckCircle2,
  Coffee,
  Clock,
  Scissors,
  PhoneCall,
  UserX,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import {
  TICKET_STATUS,
  getBarberCurrentTicket,
  getNextEligibleTicketForBarber,
} from '../../shared/queueRules';
import { useLanguage } from '../i18n/LanguageContext';
import { useQueue } from '../store/QueueContext';
import Header from '../components/Header';
import StaffPinGate from '../components/StaffPinGate';
import BarberAvatar from '../components/BarberAvatar';

function formatTimer(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function BarberContent() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { t, serviceName, barberName, barberSpecialty } = useLanguage();
  const { state, actions } = useQueue();
  const [tick, setTick] = useState(() => Date.now());

  const barber =
    state.barbers.find(
      (b) =>
        b.id.toLowerCase() === String(name || '').toLowerCase() ||
        b.name.toLowerCase() === String(name || '').toLowerCase()
    ) || null;

  const current = barber ? getBarberCurrentTicket(state, barber.id) : null;
  const nextForMe = barber ? getNextEligibleTicketForBarber(state, barber.id) : null;
  const serviceMap = new Map(state.services.map((s) => [s.id, s]));

  useEffect(() => {
    if (current?.status !== TICKET_STATUS.IN_CHAIR) return;
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [current?.status]);

  if (!barber) {
    return (
      <div className="min-h-screen bg-[#111827] text-gray-100 flex flex-col">
        <Header title={t('barberViewTitle')} backTo="/" />
        <main className="flex-1 w-full max-w-md mx-auto px-4 py-8 space-y-4">
          <h2 className="text-xl font-bold text-center text-white">
            {t('chooseYourProfile')}
          </h2>
          <div className="space-y-3">
            {state.barbers.map((b) => (
              <Link
                key={b.id}
                to={`/barber/${b.id}`}
                className="min-h-[72px] p-4 rounded-2xl bg-[#1F2937] border border-gray-700 hover:border-[#D4A017] flex items-center gap-4 transition-colors"
              >
                <BarberAvatar barber={b} size="md" />
                <div>
                  <p className="font-bold text-lg text-white">{barberName(b)}</p>
                  <p className="text-xs text-gray-400">{barberSpecialty(b)}</p>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    );
  }

  const handleToggleBreak = async (onBreak) => {
    await actions.toggleBarberBreak(barber.id, onBreak);
  };

  return (
    <div className="min-h-screen bg-[#111827] text-gray-100 flex flex-col">
      <Header title={`${barberName(barber)} · ${t('barberViewTitle')}`} backTo="/" />

      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Quick Barber Switcher Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {state.barbers.map((b) => {
            const active = b.id === barber.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => navigate(`/barber/${b.id}`)}
                className={`min-h-[44px] px-4 rounded-xl text-sm font-bold border transition-all shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#D4A017] border-[#D4A017] text-[#111827]'
                    : 'bg-[#1F2937] border-gray-700 text-gray-300 hover:border-gray-500'
                }`}
              >
                {barberName(b)}
              </button>
            );
          })}
        </div>

        {/* Off Duty Notice */}
        {!barber.onDuty && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 flex items-center gap-3 text-sm font-semibold">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{t('barberOffDutyMsg')}</span>
          </div>
        )}

        {/* Available / On Break Segmented Toggle */}
        <section className="bg-[#1F2937] border border-gray-700/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <BarberAvatar barber={barber} size="md" />
              <div>
                <p className="font-bold text-lg text-white leading-tight">
                  {barberName(barber)}
                </p>
                <p className="text-xs text-gray-400">{barberSpecialty(barber)}</p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                barber.onBreak
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              }`}
            >
              {barber.onBreak ? t('onBreakBtn') : t('availableBtn')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-[#111827] p-1.5 rounded-xl border border-gray-700">
            <button
              type="button"
              onClick={() => handleToggleBreak(false)}
              className={`min-h-[48px] rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                !barber.onBreak
                  ? 'bg-emerald-500 text-[#111827] shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Scissors className="w-4 h-4" />
              {t('availableBtn')}
            </button>
            <button
              type="button"
              onClick={() => handleToggleBreak(true)}
              className={`min-h-[48px] rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                barber.onBreak
                  ? 'bg-amber-400 text-[#111827] shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Coffee className="w-4 h-4" />
              {t('onBreakBtn')}
            </button>
          </div>
        </section>

        {/* Current Customer Card */}
        <section className="bg-[#1F2937] border border-gray-700/80 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D4A017]">
              {t('currentCustomer')}
            </span>
            {current && (
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  current.status === TICKET_STATUS.IN_CHAIR
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                }`}
              >
                {current.status === TICKET_STATUS.IN_CHAIR
                  ? t('inChairNow')
                  : t('waitingForCustomer')}
              </span>
            )}
          </div>

          {current ? (
            <>
              <div className="bg-[#111827] border border-gray-700/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-xl bg-[#D4A017]/15 border border-[#D4A017]/50 text-[#F5D77A] font-extrabold text-xl">
                      {current.token}
                    </span>
                    <h2 className="text-2xl font-extrabold text-white mt-2">
                      {current.name}
                    </h2>
                  </div>

                  {current.status === TICKET_STATUS.IN_CHAIR && (
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                        {t('elapsedTime')}
                      </p>
                      <p className="text-2xl font-mono font-extrabold text-[#F5D77A] flex items-center justify-end gap-1.5 mt-0.5">
                        <Clock className="w-5 h-5" />
                        {formatTimer(tick - (current.startedAt || tick))}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-800">
                  {current.serviceIds.map((sid) => {
                    const srv = serviceMap.get(sid);
                    if (!srv) return null;
                    return (
                      <span
                        key={sid}
                        className="px-3 py-1.5 rounded-xl bg-[#1F2937] border border-gray-700 text-sm font-semibold text-gray-200"
                      >
                        {serviceName(srv)} ({srv.minutes} {t('min')})
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Big Action Buttons: [ Start ] -> [ Done ] */}
              {current.status === TICKET_STATUS.CALLED ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => actions.startService(current.id)}
                    className="w-full min-h-[64px] rounded-2xl bg-gradient-to-r from-[#D4A017] to-[#EAB308] hover:from-[#e0ac22] hover:to-[#f0c020] text-[#111827] font-extrabold text-xl flex items-center justify-center gap-2.5 shadow-lg shadow-[#D4A017]/25 cursor-pointer active:scale-[0.99]"
                  >
                    <Play className="w-6 h-6 fill-current" />
                    <span>{t('startBtn')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          t('confirmNoShowCustomer', {
                            token: current.token,
                            name: current.name,
                          })
                        )
                      ) {
                        actions.markNoShow(current.id);
                      }
                    }}
                    className="w-full min-h-[48px] rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 text-red-300 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserX className="w-4 h-4" />
                    <span>{t('markNoShow')}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => actions.completeService(current.id)}
                  className="w-full min-h-[64px] rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#111827] font-extrabold text-xl flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/25 cursor-pointer active:scale-[0.99]"
                >
                  <CheckCircle2 className="w-6 h-6" />
                  <span>{t('doneBtn')}</span>
                </button>
              )}
            </>
          ) : (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#111827] border border-gray-700 text-gray-400 flex items-center justify-center">
                {barber.onBreak ? (
                  <Coffee className="w-8 h-8 text-amber-400" />
                ) : (
                  <Scissors className="w-8 h-8 text-[#D4A017]" />
                )}
              </div>
              <div>
                <p className="text-lg font-bold text-white">
                  {barber.onBreak ? t('onBreakBtn') : t('chairFreeMsg')}
                </p>
                {barber.onBreak && (
                  <p className="text-xs text-amber-300/90 mt-1">{t('youAreOnBreak')}</p>
                )}
              </div>

              {!barber.onBreak && barber.onDuty && nextForMe && (
                <button
                  type="button"
                  onClick={() => actions.callNext(barber.id)}
                  className="w-full min-h-[56px] rounded-2xl bg-[#D4A017] hover:bg-[#e5b226] text-[#111827] font-extrabold text-base flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <PhoneCall className="w-5 h-5" />
                  <span>
                    {t('callNext')} ({nextForMe.token} · {nextForMe.name})
                  </span>
                </button>
              )}
            </div>
          )}
        </section>

        {/* Next For You Preview Card */}
        <section className="bg-[#1F2937] border border-gray-700/80 rounded-2xl p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#D4A017]" />
            {t('nextForYou')}
          </p>
          {nextForMe ? (
            <div className="flex items-center justify-between gap-3 bg-[#111827] border border-gray-700/80 rounded-xl p-3.5">
              <div className="min-w-0">
                <p className="font-bold text-white text-base truncate">
                  <span className="text-[#F5D77A] mr-2">{nextForMe.token}</span>
                  {nextForMe.name}
                </p>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {nextForMe.serviceIds
                    .map((sid) => serviceName(serviceMap.get(sid)))
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <span className="text-xs font-bold text-[#F5D77A] shrink-0">
                {nextForMe.totalMinutes} {t('min')}
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-400">{t('noNextForYou')}</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default function BarberPage() {
  const { t } = useLanguage();
  return (
    <StaffPinGate screenTitle={t('barberViewTitle')}>
      <BarberContent />
    </StaffPinGate>
  );
}
