import React, { useEffect, useRef, useState } from 'react';
import { Check, Globe } from 'lucide-react';
import { LANGUAGES, useTranslation } from '../../i18n';

/**
 * Language picker.
 *
 * Each option shows its own script first and the English name second: a
 * student looking for Marathi scans for "मराठी", not for "Marathi". The
 * trigger shows the native name for the same reason.
 *
 * `variant="compact"` is the icon-only form used in the app top bar;
 * `"full"` is the labelled form used on the public pages, where there is
 * room and a first-time visitor needs to find it without hunting.
 */
export default function LanguageSwitcher({ variant = 'compact', className = '' }) {
  const { language, setLanguage, meta, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onPointerDown(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const compact = variant === 'compact';

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={t('common.chooseLanguage')}
        aria-label={t('common.chooseLanguage')}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={
          compact
            ? 'flex items-center gap-1.5 px-2 py-1.5 rounded-full hover:bg-[#EAE5DC] text-[#57534E] transition-colors cursor-pointer'
            : 'flex items-center gap-2 px-3 py-2 rounded-full border border-[#DDD5C5] bg-white/80 hover:bg-white text-[#57534E] text-sm transition-colors cursor-pointer'
        }
      >
        <Globe className="w-4 h-4 shrink-0" />
        <span className={compact ? 'hidden sm:inline text-xs font-medium' : 'font-medium'}>
          {meta.nativeName}
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t('common.language')}
          className="absolute right-0 mt-2 w-56 max-h-[22rem] overflow-y-auto rounded-xl bg-white border border-[#EAE5DC] shadow-lg py-1.5 z-50 animate-fade-in"
        >
          <div className="px-3.5 py-2 border-b border-[#F0ECE1] text-[10px] font-mono uppercase tracking-wider text-[#8C827A]">
            {t('common.chooseLanguage')}
          </div>

          {LANGUAGES.map((option) => {
            const selected = option.code === language;
            return (
              <button
                key={option.code}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setLanguage(option.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2 text-left transition-colors cursor-pointer ${
                  selected
                    ? 'bg-[#FAF7F2] text-[#1C1917]'
                    : 'text-[#57534E] hover:bg-[#FAF7F2] hover:text-[#1C1917]'
                }`}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium truncate">{option.nativeName}</span>
                  {option.nativeName !== option.name && (
                    <span className="block text-[11px] text-[#8C827A] truncate">{option.name}</span>
                  )}
                </span>
                {selected && <Check className="w-4 h-4 text-[#A8421E] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
