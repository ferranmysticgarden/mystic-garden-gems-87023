import { useState, useEffect } from 'react';
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

const detectLanguage = (): Language => {
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('es')) return 'es';
  if (browserLang.startsWith('pt')) return 'pt';
  return 'en';
};

export const useLanguage = () => {
  const [language, setLanguage] = useState<Language>(detectLanguage());

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
