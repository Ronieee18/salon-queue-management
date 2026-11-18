import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Scissors,
  ArrowLeft,
  LayoutGrid,
  X,
  Monitor,
  Settings,
  ClipboardList,
  UserCheck,
  Home,
  Wifi,
  HardDrive,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useQueue } from '../store/QueueContext';
import LanguageToggle from './LanguageToggle';

export default function Header({ title, backTo = null, showStaffMenu = true, maxWidth = 'max-w-lg' }) {
  const { t } = useLanguage();
  const { syncMode } = useQueue();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const staffLinks = [
    { to: '/', label: t('navHome'), icon: Home },
    { to: '/reception', label: t('navReception'), icon: ClipboardList },
    { to: '/barber/ravi', label: t('navBarber'), icon: UserCheck },
    { to: '/display', label: t('navDisplay'), icon: Monitor },
    { to: '/admin', label: t('navAdmin'), icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#111827]/95 backdrop-blur-md border-b border-gray-800">
      <div className={`${maxWidth} mx-auto px-4 py-3 flex items-center justify-between gap-2`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {backTo ? (
            <Link
              to={backTo}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-[#1F2937] border border-gray-700 text-gray-200 hover:border-[#D4A017] hover:text-[#D4A017] transition-colors shrink-0"
              aria-label={t('back')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          ) : (
            <Link
              to="/"
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#9A710B] flex items-center justify-center shadow-lg shadow-[#D4A017]/20 shrink-0"
            >
              <Scissors className="w-5 h-5 text-[#111827]" />
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="font-display font-bold text-base sm:text-lg text-white truncate leading-tight">
              {title || t('salonName')}
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
              {syncMode === 'server' ? (
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <Wifi className="w-3 h-3" />
                  {t('liveSync')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-400/90">
                  <HardDrive className="w-3 h-3" />
                  {t('localSync')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <LanguageToggle />
          {showStaffMenu && (
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-[#1F2937] border border-gray-700 text-gray-200 hover:border-[#D4A017] hover:text-[#D4A017] transition-colors cursor-pointer"
              aria-label={t('staffPortal')}
              title={t('staffPortal')}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-gray-800 bg-[#1F2937]">
          <div className={`${maxWidth} mx-auto px-4 py-3`}>
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
              {t('staffPortal')}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {staffLinks.map((item) => {
                const Icon = item.icon;
                const active =
                  item.to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.to.split('/').slice(0, 2).join('/'));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-colors ${
                      active
                        ? 'bg-[#D4A017]/15 border-[#D4A017] text-[#F5D77A]'
                        : 'bg-[#111827] border-gray-700 text-gray-200 hover:border-gray-500'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
