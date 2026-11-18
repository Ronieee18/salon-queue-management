import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Scissors, Volume2, VolumeX, Clock, Sparkles, Home } from 'lucide-react';
import {
  TICKET_STATUS,
  calculateEstimatedWait,
  getBarberCurrentTicket,
  getBarberStatus,
  getWaitingTickets,
} from '../../shared/queueRules';
import { useLanguage } from '../i18n/LanguageContext';
import { useQueue } from '../store/QueueContext';
import LanguageToggle from '../components/LanguageToggle';
import BarberAvatar from '../components/BarberAvatar';

function playSalonChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = [587.33, 880.0]; // Warm D5 -> A5 pleasant chime
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.18);
      gain.gain.setValueAtTime(0.001, now + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.28, now + i * 0.18 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.75);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.8);
    });
  } catch {
    // Browser blocked autoplay before gesture
  }
}

export default function DisplayTvPage() {
  const { t, barberName } = useLanguage();
  const { state, now } = useQueue();

  const [clock, setClock] = useState(() => new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [flashingBarberId, setFlashingBarberId] = useState(null);
  const lastEventAtRef = useRef(state.lastCalledEvent?.at || null);

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const triggerFlashAndChime = useCallback(
    (barberId) => {
      setFlashingBarberId(barberId);
      if (soundEnabled) {
        playSalonChime();
      }
      const timeout = setTimeout(() => {
        setFlashingBarberId((cur) => (cur === barberId ? null : cur));
      }, 12000);
      return () => clearTimeout(timeout);
    },
    [soundEnabled]
  );

  // Detect newly called token across any device/window
  useEffect(() => {
    const ev = state.lastCalledEvent;
    if (ev?.at && ev.at !== lastEventAtRef.current) {
      lastEventAtRef.current = ev.at;
      return triggerFlashAndChime(ev.barberId);
    }
  }, [state.lastCalledEvent, triggerFlashAndChime]);

  const onDutyBarbers = state.barbers.filter((b) => b.onDuty);
  const upNextTickets = getWaitingTickets(state).slice(0, 5);
  const barberMap = new Map(state.barbers.map((b) => [b.id, b]));

  const formattedClock = clock.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-[#0D131F] text-white flex flex-col p-4 sm:p-6 lg:p-8 select-none">
      {/* Top TV Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4A017] to-[#9A710B] flex items-center justify-center shadow-lg shadow-[#D4A017]/25">
            <Scissors className="w-8 h-8 text-[#111827]" />
          </div>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {t('salonName')}
            </h1>
            <p className="text-sm sm:text-base text-[#F5D77A] font-semibold">
              {t('tvJoinHint')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playSalonChime();
            }}
            className={`min-h-[44px] px-4 rounded-xl border text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer transition-colors ${
              soundEnabled
                ? 'bg-[#D4A017]/15 border-[#D4A017]/50 text-[#F5D77A]'
                : 'bg-[#1F2937] border-gray-700 text-gray-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? t('tvSoundOn') : t('tvEnableSound')}</span>
          </button>

          <LanguageToggle />

          <div className="px-4 py-2 rounded-xl bg-[#1F2937] border border-gray-700 font-mono text-xl sm:text-2xl font-extrabold text-[#F5D77A]">
            {formattedClock}
          </div>

          <Link
            to="/"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-[#1F2937] border border-gray-700 text-gray-400 hover:text-white"
            aria-label={t('backHome')}
          >
            <Home className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Main TV Split Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
        {/* Left 7 Cols: Row per Barber */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-extrabold uppercase tracking-wider text-[#D4A017] flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              {t('tvTitle')}
            </h2>
          </div>

          <div className="flex-1 flex flex-col gap-4 justify-center">
            {onDutyBarbers.map((barber) => {
              const current = getBarberCurrentTicket(state, barber.id);
              const bStatus = getBarberStatus(state, barber.id);
              const isFlashing =
                flashingBarberId === barber.id || current?.status === TICKET_STATUS.CALLED;

              return (
                <div
                  key={barber.id}
                  className={`rounded-3xl p-5 sm:p-6 border-2 flex items-center justify-between gap-4 transition-all ${
                    isFlashing
                      ? 'border-[#F5C542] animate-gold-flash'
                      : 'bg-[#1F2937] border-gray-700/80'
                  }`}
                >
                  <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                    <BarberAvatar barber={barber} size="tv" />
                    <div className="min-w-0">
                      <p className="text-2xl sm:text-4xl font-extrabold text-white truncate">
                        {barberName(barber)}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        {current?.status === TICKET_STATUS.CALLED ? (
                          <span className="px-3 py-1 rounded-full bg-[#D4A017] text-[#111827] text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                            {t('tvCalledFlash')}
                          </span>
                        ) : current?.status === TICKET_STATUS.IN_CHAIR ? (
                          <span className="text-base sm:text-lg text-emerald-300 font-semibold truncate">
                            {current.name}
                          </span>
                        ) : (
                          <span className="text-base sm:text-lg text-gray-400 font-semibold">
                            {bStatus === 'on_break' ? t('tvBreak') : t('tvFree')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Giant Token Display readable from 5 metres */}
                  <div className="text-right shrink-0">
                    {current ? (
                      <div className="px-5 py-3 rounded-2xl bg-[#111827] border-2 border-[#D4A017] shadow-lg">
                        <p className="text-xs sm:text-sm uppercase tracking-widest text-gray-400 font-bold">
                          {t('tvNow')}
                        </p>
                        <p className="font-display text-4xl sm:text-6xl font-extrabold text-[#F5D77A] leading-none mt-1">
                          {current.token}
                        </p>
                      </div>
                    ) : (
                      <div className="px-5 py-4 rounded-2xl bg-[#111827]/70 border border-gray-700">
                        <p className="text-xl sm:text-2xl font-bold text-gray-500">
                          {bStatus === 'on_break' ? t('tvBreak') : t('tvFree')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right 5 Cols: Up Next (Next 5 Tokens) */}
        <section className="lg:col-span-5 bg-[#1F2937] border border-gray-700/80 rounded-3xl p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-gray-700">
            <h2 className="text-xl sm:text-2xl font-extrabold uppercase tracking-wider text-white">
              {t('tvUpNext')}
            </h2>
            <span className="px-3.5 py-1 rounded-full bg-[#111827] border border-[#D4A017]/50 text-[#F5D77A] font-extrabold text-sm">
              {t('waitingCountBadge', { count: getWaitingTickets(state).length })}
            </span>
          </div>

          {upNextTickets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 space-y-3">
              <Scissors className="w-16 h-16 text-emerald-400" />
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-300">
                {t('tvNoUpNext')}
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-3 pt-4">
              {upNextTickets.map((tk, index) => {
                const estWait = calculateEstimatedWait(
                  state,
                  { preferredBarberId: tk.preferredBarberId, ticketId: tk.id },
                  now
                );
                const prefBarber =
                  tk.preferredBarberId !== 'any' ? barberMap.get(tk.preferredBarberId) : null;

                return (
                  <div
                    key={tk.id}
                    className={`rounded-2xl px-5 py-4 border flex items-center justify-between gap-4 ${
                      index === 0
                        ? 'bg-[#D4A017]/15 border-[#D4A017]/60'
                        : 'bg-[#111827] border-gray-700/80'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="font-display text-3xl sm:text-4xl font-extrabold text-[#F5D77A] shrink-0">
                        {tk.token}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xl sm:text-2xl font-bold text-white truncate">
                          {tk.name.split(' ')[0]}
                        </p>
                        <p className="text-sm text-gray-400 font-medium">
                          {prefBarber ? barberName(prefBarber) : t('anyBarberShort')}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-1.5 text-lg sm:text-xl font-bold text-gray-200">
                      <Clock className="w-5 h-5 text-[#D4A017]" />
                      <span>
                        {estWait === 0 ? t('readyNow') : `~${estWait} ${t('min')}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
