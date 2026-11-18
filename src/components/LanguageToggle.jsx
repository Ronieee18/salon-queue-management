import { useLanguage } from '../i18n/LanguageContext';

export default function LanguageToggle({ compact = false }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className="inline-flex items-center rounded-xl bg-[#111827] border border-gray-700 p-1 shrink-0"
      role="group"
      aria-label="Language toggle"
    >
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`min-h-[36px] min-w-[40px] px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          lang === 'en'
            ? 'bg-[#D4A017] text-[#111827] shadow-sm'
            : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang('gu')}
        className={`min-h-[36px] min-w-[44px] px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          lang === 'gu'
            ? 'bg-[#D4A017] text-[#111827] shadow-sm'
            : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        {compact ? 'ગુ' : 'ગુજ'}
      </button>
    </div>
  );
}
