import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Check,
  Clock,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  User,
  Phone,
  Zap,
} from 'lucide-react';
import {
  MAX_SERVICES_PER_TICKET,
  calculateEstimatedWait,
  calculateTotals,
  getBarberStatus,
  isOnlineJoiningOpen,
  isValidPhone,
} from '../../shared/queueRules';
import { useLanguage } from '../i18n/LanguageContext';
import { useQueue } from '../store/QueueContext';
import Header from '../components/Header';
import BarberAvatar from '../components/BarberAvatar';

export default function JoinQueuePage() {
  const { t, serviceName, barberName, barberSpecialty } = useLanguage();
  const { state, now, actions } = useQueue();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [preferredBarberId, setPreferredBarberId] = useState('any');
  const [maxAlert, setMaxAlert] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const onlineStatus = isOnlineJoiningOpen(state, now);
  const activeServices = state.services.filter((s) => s.active);
  const onDutyBarbers = state.barbers.filter((b) => b.onDuty);

  const { totalMinutes, totalPrice } = calculateTotals(state.services, selectedServiceIds);
  const expectedWait = calculateEstimatedWait(state, { preferredBarberId }, now);

  const selectedBarberObj =
    preferredBarberId !== 'any'
      ? onDutyBarbers.find((b) => b.id === preferredBarberId)
      : null;

  const toggleService = (serviceId) => {
    setErrors((prev) => ({ ...prev, services: '' }));
    if (selectedServiceIds.includes(serviceId)) {
      setSelectedServiceIds((prev) => prev.filter((id) => id !== serviceId));
      setMaxAlert(false);
    } else {
      if (selectedServiceIds.length >= MAX_SERVICES_PER_TICKET) {
        setMaxAlert(true);
        return;
      }
      setSelectedServiceIds((prev) => [...prev, serviceId]);
      setMaxAlert(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!name.trim()) nextErrors.name = t('errNameRequired');
    if (!isValidPhone(phone)) nextErrors.phone = t('errInvalidPhone');
    if (selectedServiceIds.length === 0) nextErrors.services = t('errServiceRequired');

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    const res = await actions.joinQueue({
      name: name.trim(),
      phone,
      serviceIds: selectedServiceIds,
      preferredBarberId,
      isWalkIn: false,
    });
    setSubmitting(false);

    if (res.ok && res.ticket) {
      navigate(`/status/${res.ticket.id}`, {
        state: { duplicate: Boolean(res.duplicate) },
      });
    } else {
      setErrors({ form: res.error || t('onlineClosedNotice') });
    }
  };

  const barberStatusLabel = (bId) => {
    const st = getBarberStatus(state, bId);
    if (st === 'free') return { text: t('statusFree'), cls: 'text-emerald-400' };
    if (st === 'on_break') return { text: t('statusOnBreak'), cls: 'text-amber-400' };
    return { text: t('statusBusy'), cls: 'text-[#F5D77A]' };
  };

  return (
    <div className="min-h-screen bg-[#111827] text-gray-100 flex flex-col pb-32">
      <Header title={t('joinTitle')} backTo="/" maxWidth="max-w-2xl" />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-5 space-y-6">
        {!onlineStatus.open ? (
          <div className="bg-[#1F2937] border border-amber-500/40 rounded-3xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white">{t('closedBadge')}</h2>
            <p className="text-sm text-gray-300">
              {onlineStatus.reason === 'CLOSING_SOON'
                ? t('closingSoonNotice')
                : t('onlineClosedNotice')}
            </p>
            <Link
              to="/"
              className="inline-flex min-h-[48px] px-6 items-center justify-center rounded-xl bg-[#D4A017] text-[#111827] font-bold"
            >
              {t('backHome')}
            </Link>
          </div>
        ) : (
          <form id="join-queue-form" onSubmit={handleConfirm} className="space-y-6" noValidate>
            {/* Customer Details */}
            <section className="bg-[#1F2937] border border-gray-700/80 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#D4A017]">
                {t('yourDetails')}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    {t('fullNameLabel')}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setErrors((p) => ({ ...p, name: '' }));
                      }}
                      placeholder={t('fullNamePlaceholder')}
                      className={`w-full min-h-[48px] pl-10 pr-3.5 rounded-xl bg-[#111827] border text-white text-sm focus:outline-none ${
                        errors.name
                          ? 'border-red-500'
                          : 'border-gray-600 focus:border-[#D4A017]'
                      }`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-red-400 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    {t('phoneLabel')}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                        setErrors((p) => ({ ...p, phone: '' }));
                      }}
                      placeholder={t('phonePlaceholder')}
                      className={`w-full min-h-[48px] pl-10 pr-3.5 rounded-xl bg-[#111827] border text-white text-sm tracking-wider focus:outline-none ${
                        errors.phone
                          ? 'border-red-500'
                          : 'border-gray-600 focus:border-[#D4A017]'
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-red-400 mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Service Cards (multi-select max 3) */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#D4A017]">
                  {t('selectServices')}
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#1F2937] border border-gray-700 text-gray-300">
                  {t('selectedCount', { count: selectedServiceIds.length })}
                </span>
              </div>

              {maxAlert && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs font-medium">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{t('maxServicesAlert')}</span>
                </div>
              )}

              {errors.services && (
                <p className="text-xs text-red-400 font-medium">{errors.services}</p>
              )}

              {activeServices.length === 0 ? (
                <div className="p-5 rounded-2xl bg-[#1F2937] border border-gray-700 text-sm text-gray-400 text-center">
                  {t('noActiveServices')}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {activeServices.map((srv) => {
                    const selected = selectedServiceIds.includes(srv.id);
                    const disabled =
                      !selected && selectedServiceIds.length >= MAX_SERVICES_PER_TICKET;
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => toggleService(srv.id)}
                        className={`min-h-[96px] p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          selected
                            ? 'bg-[#D4A017]/15 border-[#D4A017] shadow-md shadow-[#D4A017]/15'
                            : disabled
                              ? 'bg-[#1F2937]/60 border-gray-800 opacity-60 hover:opacity-80'
                              : 'bg-[#1F2937] border-gray-700/80 hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 w-full">
                          <span className="font-bold text-sm text-white leading-snug">
                            {serviceName(srv)}
                          </span>
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                              selected
                                ? 'bg-[#D4A017] border-[#D4A017] text-[#111827]'
                                : 'border-gray-600'
                            }`}
                          >
                            {selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </span>
                        </div>

                        <div className="flex items-center justify-between w-full mt-3 pt-2 border-t border-gray-700/60">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {srv.minutes} {t('min')}
                          </span>
                          <span className="text-sm font-extrabold text-[#F5D77A]">
                            ₹{srv.price}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Barber Picker */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#D4A017]">
                {t('chooseBarber')}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Any Barber Option */}
                <button
                  type="button"
                  onClick={() => setPreferredBarberId('any')}
                  className={`min-h-[72px] p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer sm:col-span-2 ${
                    preferredBarberId === 'any'
                      ? 'bg-[#D4A017]/15 border-[#D4A017] shadow-md shadow-[#D4A017]/15'
                      : 'bg-[#1F2937] border-gray-700/80 hover:border-gray-500'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#D4A017]/20 border border-[#D4A017]/50 text-[#F5D77A] flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{t('anyBarber')}</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {t('fastestBadge')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t('expectedWait', {
                        min: calculateEstimatedWait(state, { preferredBarberId: 'any' }, now),
                      })}
                    </p>
                  </div>
                  {preferredBarberId === 'any' && (
                    <div className="w-6 h-6 rounded-full bg-[#D4A017] text-[#111827] flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </button>

                {/* Specific On-Duty Barbers */}
                {onDutyBarbers.map((barber) => {
                  const selected = preferredBarberId === barber.id;
                  const bStatus = barberStatusLabel(barber.id);
                  return (
                    <button
                      key={barber.id}
                      type="button"
                      onClick={() => setPreferredBarberId(barber.id)}
                      className={`min-h-[76px] p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        selected
                          ? 'bg-[#D4A017]/15 border-[#D4A017]'
                          : 'bg-[#1F2937] border-gray-700/80 hover:border-gray-500'
                      }`}
                    >
                      <BarberAvatar barber={barber} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm truncate">
                          {barberName(barber)}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {barberSpecialty(barber)}
                        </p>
                        <p className={`text-xs font-semibold mt-0.5 ${bStatus.cls}`}>
                          {bStatus.text}
                        </p>
                      </div>
                      {selected && (
                        <div className="w-6 h-6 rounded-full bg-[#D4A017] text-[#111827] flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedBarberObj?.onBreak && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    {t('barberOnBreakWarn', { name: barberName(selectedBarberObj) })}
                  </span>
                </div>
              )}
            </section>

            {errors.form && (
              <p className="text-sm text-red-400 font-medium text-center">{errors.form}</p>
            )}
          </form>
        )}
      </main>

      {/* Sticky Live Summary & Confirm Bar */}
      {onlineStatus.open && (
        <div className="fixed bottom-0 inset-x-0 z-20 bg-[#1F2937]/95 backdrop-blur-md border-t border-gray-700 shadow-2xl">
          <div className="max-w-2xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#D4A017] shrink-0" />
                <span>
                  {t('liveSummaryTotal', { min: totalMinutes, price: totalPrice })}
                </span>
              </p>
              <p className="text-xs text-[#F5D77A] font-medium">
                {t('expectedWait', { min: expectedWait })}
              </p>
            </div>

            <button
              type="submit"
              form="join-queue-form"
              disabled={submitting}
              className="w-full sm:w-auto min-h-[50px] px-7 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#EAB308] hover:from-[#e0ac22] hover:to-[#f0c020] text-[#111827] font-extrabold text-base shadow-lg shadow-[#D4A017]/20 transition-all cursor-pointer disabled:opacity-60"
            >
              {t('confirmJoinBtn')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
