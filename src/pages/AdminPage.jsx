import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Users,
  UserX,
  Power,
  Plus,
  Pencil,
  RotateCcw,
  X,
} from 'lucide-react';
import { getBarberStatus, getTodayStats } from '../../shared/queueRules';
import { useLanguage } from '../i18n/LanguageContext';
import { useQueue } from '../store/QueueContext';
import Header from '../components/Header';
import StaffPinGate from '../components/StaffPinGate';
import BarberAvatar from '../components/BarberAvatar';

function ToggleSwitch({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-8 w-14 min-h-[44px] items-center justify-center rounded-full cursor-pointer shrink-0`}
    >
      <span
        className={`h-7 w-13 rounded-full transition-colors flex items-center px-1 ${
          checked ? 'bg-[#D4A017]' : 'bg-gray-700'
        }`}
      >
        <span
          className={`w-5 h-5 rounded-full bg-[#111827] shadow transform transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  );
}

function AdminContent() {
  const { t, serviceName, barberName, barberSpecialty } = useLanguage();
  const { state, actions } = useQueue();

  const [editingService, setEditingService] = useState(null); // null or { id?, nameEn, nameGu, minutes, price }
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState('');

  const stats = getTodayStats(state);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast((cur) => (cur === msg ? '' : cur)), 3000);
  };

  const openNewService = () => {
    setFormError('');
    setEditingService({ nameEn: '', nameGu: '', minutes: 25, price: 150 });
  };

  const openEditService = (srv) => {
    setFormError('');
    setEditingService({ ...srv });
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!editingService.nameEn.trim() || Number(editingService.minutes) <= 0 || Number(editingService.price) < 0) {
      setFormError('Enter valid service name, duration (>0), and price (>=0).');
      return;
    }
    const res = await actions.upsertService(editingService);
    if (res.ok) {
      setEditingService(null);
      showToast(t('serviceSaved'));
    } else {
      setFormError(res.error || 'Error');
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm(t('resetDemoConfirm'))) return;
    await actions.resetDemo();
  };

  return (
    <div className="min-h-screen bg-[#111827] text-gray-100 flex flex-col">
      <Header title={t('adminTitle')} backTo="/" maxWidth="max-w-5xl" />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 space-y-6">
        {toast && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toast}</span>
          </div>
        )}

        {/* Today's Stats Cards */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#D4A017]">
            {t('todayStats')}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-[#1F2937] border border-gray-700/80 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{t('statServed')}</span>
              </div>
              <p className="text-3xl font-extrabold text-white mt-2">{stats.servedCount}</p>
            </div>

            <div className="bg-[#1F2937] border border-gray-700/80 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
                <Clock className="w-4 h-4 text-[#D4A017]" />
                <span>{t('statAvgWait')}</span>
              </div>
              <p className="text-3xl font-extrabold text-[#F5D77A] mt-2">
                {stats.avgWaitMinutes} <span className="text-base font-semibold">{t('min')}</span>
              </p>
            </div>

            <div className="bg-[#1F2937] border border-gray-700/80 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
                <UserX className="w-4 h-4 text-red-400" />
                <span>{t('statNoShows')}</span>
              </div>
              <p className="text-3xl font-extrabold text-white mt-2">{stats.noShowCount}</p>
            </div>

            <div className="bg-[#1F2937] border border-gray-700/80 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
                <Users className="w-4 h-4 text-sky-400" />
                <span>{t('statWaiting')}</span>
              </div>
              <p className="text-3xl font-extrabold text-white mt-2">{stats.waitingCount}</p>
            </div>
          </div>
        </section>

        {/* Queue Control & Barbers on Duty */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Online Queue Switch */}
          <section className="bg-[#1F2937] border border-gray-700/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#D4A017] flex items-center gap-2">
                <Power className="w-4 h-4" />
                {t('queueControlTitle')}
              </h2>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  state.settings.onlineQueueOpen
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-red-500/15 text-red-300 border border-red-500/30'
                }`}
              >
                {state.settings.onlineQueueOpen ? t('serviceActive') : t('closedBadge')}
              </span>
            </div>

            <div className="bg-[#111827] border border-gray-700/80 rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-sm text-white">{t('onlineJoiningSwitch')}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t('onlineJoiningDesc')}</p>
              </div>
              <ToggleSwitch
                checked={state.settings.onlineQueueOpen}
                onChange={(val) => actions.updateSettings({ onlineQueueOpen: val })}
                ariaLabel={t('onlineJoiningSwitch')}
              />
            </div>

            <div className="bg-[#111827] border border-gray-700/80 rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-sm text-white">{t('closingCutoffSwitch')}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t('closingCutoffDesc')}</p>
              </div>
              <ToggleSwitch
                checked={Boolean(state.settings.enforceClosingCutoff)}
                onChange={(val) => actions.updateSettings({ enforceClosingCutoff: val })}
                ariaLabel={t('closingCutoffSwitch')}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <label className="text-xs font-semibold text-gray-300">
                {t('closingTimeLabel')}:
              </label>
              <input
                type="time"
                value={state.settings.closingTime || '21:00'}
                onChange={(e) => actions.updateSettings({ closingTime: e.target.value })}
                className="min-h-[44px] px-3 rounded-xl bg-[#111827] border border-gray-600 text-sm text-white font-semibold"
              />
            </div>

            <div className="pt-2 border-t border-gray-700/80">
              <button
                type="button"
                onClick={handleResetDemo}
                className="w-full min-h-[44px] rounded-xl bg-[#111827] hover:bg-gray-800 border border-gray-700 text-gray-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-[#D4A017]" />
                <span>{t('resetDemoBtn')}</span>
              </button>
            </div>
          </section>

          {/* Barbers on Duty Today */}
          <section className="bg-[#1F2937] border border-gray-700/80 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#D4A017]">
              {t('barbersDutyTitle')}
            </h2>

            <div className="space-y-3">
              {state.barbers.map((barber) => {
                const st = getBarberStatus(state, barber.id);
                return (
                  <div
                    key={barber.id}
                    className="bg-[#111827] border border-gray-700/80 rounded-xl p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <BarberAvatar barber={barber} size="md" />
                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm truncate">
                          {barberName(barber)}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {barberSpecialty(barber)}
                        </p>
                        <p className="text-[11px] font-semibold text-[#F5D77A] mt-0.5">
                          {barber.onDuty
                            ? st === 'on_break'
                              ? t('statusOnBreak')
                              : st === 'in_chair'
                                ? t('statusBusy')
                                : t('onDutyLabel')
                            : t('offDutyLabel')}
                        </p>
                      </div>
                    </div>

                    <ToggleSwitch
                      checked={barber.onDuty}
                      onChange={(val) => actions.toggleBarberOnDuty(barber.id, val)}
                      ariaLabel={`${barber.name} ${t('onDutyLabel')}`}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Services Management List */}
        <section className="bg-[#1F2937] border border-gray-700/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#D4A017]">
              {t('servicesTitle')}
            </h2>
            <button
              type="button"
              onClick={openNewService}
              className="min-h-[44px] px-4 rounded-xl bg-[#D4A017] hover:bg-[#e5b226] text-[#111827] font-extrabold text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t('addServiceBtn')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {state.services.map((srv) => (
              <div
                key={srv.id}
                className={`bg-[#111827] border rounded-xl p-4 flex items-center justify-between gap-3 transition-opacity ${
                  srv.active ? 'border-gray-700/80' : 'border-gray-800 opacity-60'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-white text-sm truncate">
                      {serviceName(srv)}
                    </p>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        srv.active
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {srv.active ? t('serviceActive') : t('serviceHidden')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {srv.nameEn} · {srv.nameGu}
                  </p>
                  <p className="text-xs font-bold text-[#F5D77A] mt-1">
                    {srv.minutes} {t('min')} · ₹{srv.price}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditService(srv)}
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-[#1F2937] border border-gray-700 hover:border-[#D4A017] text-gray-300 hover:text-[#F5D77A] flex items-center justify-center cursor-pointer"
                    aria-label={t('edit')}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <ToggleSwitch
                    checked={srv.active}
                    onChange={() => actions.toggleServiceActive(srv.id)}
                    ariaLabel={`Toggle ${srv.nameEn}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Add / Edit Service Modal */}
      {editingService && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-[#1F2937] border border-gray-700 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingService.id ? t('edit') : t('addServiceBtn')}
              </h3>
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="min-h-[44px] min-w-[44px] rounded-xl bg-[#111827] text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  {t('serviceNameEn')}
                </label>
                <input
                  type="text"
                  value={editingService.nameEn}
                  onChange={(e) =>
                    setEditingService((p) => ({ ...p, nameEn: e.target.value }))
                  }
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#111827] border border-gray-600 focus:border-[#D4A017] focus:outline-none text-sm text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  {t('serviceNameGu')}
                </label>
                <input
                  type="text"
                  value={editingService.nameGu}
                  onChange={(e) =>
                    setEditingService((p) => ({ ...p, nameGu: e.target.value }))
                  }
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#111827] border border-gray-600 focus:border-[#D4A017] focus:outline-none text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    {t('durationMin')}
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={editingService.minutes}
                    onChange={(e) =>
                      setEditingService((p) => ({ ...p, minutes: Number(e.target.value) }))
                    }
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#111827] border border-gray-600 focus:border-[#D4A017] focus:outline-none text-sm text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    {t('priceInr')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingService.price}
                    onChange={(e) =>
                      setEditingService((p) => ({ ...p, price: Number(e.target.value) }))
                    }
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#111827] border border-gray-600 focus:border-[#D4A017] focus:outline-none text-sm text-white"
                    required
                  />
                </div>
              </div>

              {formError && <p className="text-xs text-red-400 font-semibold">{formError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="min-h-[44px] px-4 rounded-xl bg-[#111827] border border-gray-600 text-gray-300 font-bold text-sm cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-6 rounded-xl bg-[#D4A017] hover:bg-[#e5b226] text-[#111827] font-extrabold text-sm cursor-pointer"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { t } = useLanguage();
  return (
    <StaffPinGate screenTitle={t('adminTitle')}>
      <AdminContent />
    </StaffPinGate>
  );
}
