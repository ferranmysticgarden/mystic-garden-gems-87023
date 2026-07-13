import { useState, useCallback } from 'react';
import esTranslations from '@/locales/es.json';
import enTranslations from '@/locales/en.json';
import ptTranslations from '@/locales/pt.json';

type Translations = typeof esTranslations;
type Language = 'es' | 'en' | 'pt';

const translations: Record<Language, Translations> = {
  es: esTranslations,
  en: enTranslations,
  pt: ptTranslations,
};

const STORAGE_KEY = 'mg_lang_v1';
const MIGRATION_FLAG = 'mg_lang_migrated_v1';

// BUG 4 fix — migración única: si el usuario tiene 'en' persistido PERO el
// navegador prefiere español (primer idioma es-*), forzar 'es' una sola vez.
// Corrige el bug histórico de Android WebView que dejó 'en' pegado a usuarios ES.
(function migrateStuckEnglishForSpanishUsers() {
  try {
    if (typeof localStorage === 'undefined') return;
    if (localStorage.getItem(MIGRATION_FLAG)) return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en') {
      const langs: string[] = Array.isArray(navigator.languages) && navigator.languages.length
        ? Array.from(navigator.languages)
        : [navigator.language || ''];
      const primary = (langs[0] || '').toLowerCase();
      if (primary.startsWith('es')) {
        localStorage.setItem(STORAGE_KEY, 'es');
      }
    }
    localStorage.setItem(MIGRATION_FLAG, '1');
  } catch { /* ignore */ }
})();

const detectLanguage = (): Language => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'es' || stored === 'en' || stored === 'pt') return stored;
  } catch { /* ignore */ }

  // Inspect ALL preferred languages, not just navigator.language.
  // On Android WebView, navigator.language can momentarily return 'en-US'
  // even for Spanish users, while navigator.languages keeps 'es-*'.
  try {
    const langs: string[] = Array.isArray(navigator.languages) && navigator.languages.length
      ? Array.from(navigator.languages)
      : [navigator.language || ''];
    const lower = langs.map(l => (l || '').toLowerCase());
    if (lower.some(l => l.startsWith('es'))) return 'es';
    if (lower.some(l => l.startsWith('pt'))) return 'pt';
  } catch { /* ignore */ }
  return 'en';
};

export const useLanguage = () => {
  const [language, setLanguageState] = useState<Language>(detectLanguage());

  // Do NOT persist auto-detection. Only persist when the user explicitly picks a
  // language via setLanguage(). This prevents a bad first-boot detection
  // (e.g. Android WebView returning 'en-US' momentarily) from getting stuck
  // forever in localStorage.

  const setLanguage = useCallback((lang: Language) => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
    setLanguageState(lang);
  }, []);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  };

  const formatPrice = (price: number): string => {
    const locale = language === 'es' ? 'es-ES' : language === 'pt' ? 'pt-BR' : 'en-US';
    const currency = language === 'es' ? 'EUR' : language === 'pt' ? 'BRL' : 'USD';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(price);
  };

  return { language, setLanguage, t, formatPrice };
};
