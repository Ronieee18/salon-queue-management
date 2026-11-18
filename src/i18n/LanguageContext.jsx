import { createContext, useContext, useEffect, useState } from 'react';
import { translations, formatOrdinal } from './translations';

const LANG_STORAGE_KEY = 'royal_cuts_lang';
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      return saved === 'gu' ? 'gu' : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // ignore storage errors
    }
    document.documentElement.lang = lang === 'gu' ? 'gu' : 'en';
  }, [lang]);

  const toggleLang = () => setLang((prev) => (prev === 'en' ? 'gu' : 'en'));

  const t = (key, vars = {}) => {
    const dict = translations[lang] || translations.en;
    let str = dict[key] ?? translations.en[key] ?? key;
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, String(v));
    }
    return str;
  };

  const serviceName = (srv) => {
    if (!srv) return '';
    return lang === 'gu' ? srv.nameGu || srv.nameEn : srv.nameEn;
  };

  const barberName = (barber) => {
    if (!barber) return '';
    return lang === 'gu' ? barber.nameGu || barber.name : barber.name;
  };

  const barberSpecialty = (barber) => {
    if (!barber) return '';
    return lang === 'gu' ? barber.specialtyGu || barber.specialtyEn : barber.specialtyEn;
  };

  const ordinal = (n) => formatOrdinal(n, lang);

  return (
    <LanguageContext.Provider
      value={{ lang, setLang, toggleLang, t, serviceName, barberName, barberSpecialty, ordinal }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
