/**
 * Supported languages: English (default) plus ten Indian languages.
 *
 * `nativeName` is what the switcher shows - a speaker looking for their own
 * language scans for their own script, not for the English word for it.
 * `locale` is used for Intl number/date formatting and the <html lang>
 * attribute, which is what screen readers and the browser's own font
 * fallback rely on to pick a correct Indic font.
 */
export const LANGUAGES = [
  { code: 'en', name: 'English',   nativeName: 'English',   locale: 'en-IN' },
  { code: 'hi', name: 'Hindi',     nativeName: 'हिन्दी',      locale: 'hi-IN' },
  { code: 'bn', name: 'Bengali',   nativeName: 'বাংলা',      locale: 'bn-IN' },
  { code: 'mr', name: 'Marathi',   nativeName: 'मराठी',      locale: 'mr-IN' },
  { code: 'te', name: 'Telugu',    nativeName: 'తెలుగు',     locale: 'te-IN' },
  { code: 'ta', name: 'Tamil',     nativeName: 'தமிழ்',      locale: 'ta-IN' },
  { code: 'gu', name: 'Gujarati',  nativeName: 'ગુજરાતી',    locale: 'gu-IN' },
  { code: 'kn', name: 'Kannada',   nativeName: 'ಕನ್ನಡ',      locale: 'kn-IN' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം',    locale: 'ml-IN' },
  { code: 'pa', name: 'Punjabi',   nativeName: 'ਪੰਜਾਬੀ',     locale: 'pa-IN' },
  { code: 'or', name: 'Odia',      nativeName: 'ଓଡ଼ିଆ',      locale: 'or-IN' },
];

export const DEFAULT_LANGUAGE = 'en';

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);

export function getLanguage(code) {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
}

/**
 * Best supported match for the browser's preferred languages.
 *
 * Only consulted when the user has never made a choice - an explicit
 * selection always wins and is never silently overridden.
 */
export function detectBrowserLanguage() {
  const preferred = typeof navigator !== 'undefined'
    ? navigator.languages || [navigator.language]
    : [];

  for (const tag of preferred) {
    if (!tag) continue;
    const base = String(tag).toLowerCase().split('-')[0];
    if (LANGUAGE_CODES.includes(base)) return base;
  }
  return DEFAULT_LANGUAGE;
}
