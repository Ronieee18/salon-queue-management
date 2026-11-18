import { useState } from 'react';
import { Lock, Scissors } from 'lucide-react';
import { STAFF_PIN } from '../../shared/queueRules';
import { useLanguage } from '../i18n/LanguageContext';
import Header from './Header';

const PIN_SESSION_KEY = 'royal_cuts_staff_unlocked';

export default function StaffPinGate({ screenTitle, children }) {
  const { t } = useLanguage();
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem(PIN_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (unlocked) {
    return children;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin.trim() === STAFF_PIN) {
      try {
        sessionStorage.setItem(PIN_SESSION_KEY, 'true');
      } catch {
        // ignore
      }
      setUnlocked(true);
      setError('');
    } else {
      setError(t('staffPinError'));
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] flex flex-col">
      <Header title={screenTitle} backTo="/" />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#1F2937] border border-gray-700 rounded-2xl p-6 shadow-2xl">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#D4A017]/15 border border-[#D4A017]/40 flex items-center justify-center">
            <Lock className="w-7 h-7 text-[#D4A017]" />
          </div>
          <h2 className="text-xl font-bold text-center text-white">{t('staffPinTitle')}</h2>
          <p className="text-sm text-gray-400 text-center mt-1">{t('staffPinSubtitle')}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                setError('');
              }}
              placeholder={t('staffPinPlaceholder')}
              className="w-full min-h-[52px] px-4 rounded-xl bg-[#111827] border border-gray-600 focus:border-[#D4A017] focus:outline-none text-center text-2xl tracking-[0.6em] font-bold text-white"
              autoFocus
            />

            {error && (
              <p className="text-sm text-red-400 text-center font-medium">{error}</p>
            )}

            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-[#D4A017] hover:bg-[#e5b226] text-[#111827] font-bold text-base transition-colors cursor-pointer"
            >
              {t('staffPinUnlock')}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-700/80 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Scissors className="w-3.5 h-3.5 text-[#D4A017]" />
            <span>{t('staffPinHint')}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
