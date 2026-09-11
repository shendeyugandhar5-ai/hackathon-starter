import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LANGUAGE, LANGUAGE_CODES, detectBrowserLanguage, getLanguage } from './languages';

import en from './locales/en';
import hi from './locales/hi';
import bn from './locales/bn';
import mr from './locales/mr';
import te from './locales/te';
import ta from './locales/ta';
import gu from './locales/gu';
import kn from './locales/kn';
import ml from './locales/ml';
import pa from './locales/pa';
import or from './locales/or';

const CATALOGUES = { en, hi, bn, mr, te, ta, gu, kn, ml, pa, or };

const STORAGE_KEY = 'eduhive.language';

const LanguageContext = createContext(null);

/** Walk a dotted key ('tutor.placeholder') through a catalogue object. */
function lookup(catalogue, key) {
  let node = catalogue;
  for (const part of key.split('.')) {
    if (node == null || typeof node !== 'object') return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LANGUAGE_CODES.includes(stored)) return stored;
  } catch {
    // Private browsing or blocked storage - fall through to detection.
  }
  return null;
}

export function LanguageProvider({ children }) {
  // An explicit past choice always wins; only a first-time visitor gets the
  // browser's preference, and English if that is not one we support.
  const [language, setLanguageState] = useState(
    () => readStoredLanguage() || detectBrowserLanguage(),
  );

  const setLanguage = useCallback((code) => {
    if (!LANGUAGE_CODES.includes(code)) return;
    setLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Preference just will not persist; the app still switches.
    }
  }, []);

  // The <html lang> attribute is what screen readers announce in and what the
  // browser uses to pick an Indic font - worth keeping in sync.
  useEffect(() => {
    const meta = getLanguage(language);
    document.documentElement.lang = language;
    document.documentElement.setAttribute('data-locale', meta.locale);
  }, [language]);

  const value = useMemo(() => {
    const catalogue = CATALOGUES[language] || CATALOGUES[DEFAULT_LANGUAGE];

    /**
     * Translate `key`. Missing keys fall back to English rather than showing
     * the raw key, so an incomplete translation degrades to readable English.
     * `vars` interpolates {placeholders}.
     */
    const t = (key, vars) => {
      let text = lookup(catalogue, key)
        ?? lookup(CATALOGUES[DEFAULT_LANGUAGE], key)
        ?? key;

      if (vars) {
        for (const [name, replacement] of Object.entries(vars)) {
          text = text.replaceAll(`{${name}}`, String(replacement));
        }
      }
      return text;
    };

    return {
      language,
      setLanguage,
      t,
      meta: getLanguage(language),
      isDefault: language === DEFAULT_LANGUAGE,
    };
  }, [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/**
 * `const { t, language, setLanguage } = useTranslation();`
 *
 * Falls back to English outside a provider instead of throwing - a component
 * rendered in isolation (a test, a storybook page) should still render text.
 */
export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (ctx) return ctx;

  return {
    language: DEFAULT_LANGUAGE,
    setLanguage: () => {},
    t: (key) => lookup(CATALOGUES[DEFAULT_LANGUAGE], key) ?? key,
    meta: getLanguage(DEFAULT_LANGUAGE),
    isDefault: true,
  };
}
