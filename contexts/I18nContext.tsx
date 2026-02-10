// I18n Context - Multi-language support
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { SupportedLanguage, I18nStrings, DEFAULT_I18N } from '../types';

interface I18nContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: keyof I18nStrings) => string;
  strings: I18nStrings;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'aetheria_language';

// Detect browser language
const detectLanguage = (): SupportedLanguage => {
  const browserLang = navigator.language.split('-')[0];
  const supported: SupportedLanguage[] = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'ko', 'pt', 'it', 'ru'];
  return supported.includes(browserLang as SupportedLanguage) 
    ? browserLang as SupportedLanguage 
    : 'en';
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  // Load saved language or detect from browser
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved in DEFAULT_I18N) {
        setLanguageState(saved as SupportedLanguage);
      } else {
        setLanguageState(detectLanguage());
      }
    } catch (e) {
      setLanguageState(detectLanguage());
    }
  }, []);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    
    // Update document lang attribute
    document.documentElement.lang = lang;
  }, []);

  const strings = DEFAULT_I18N[language] || DEFAULT_I18N.en;

  const t = useCallback((key: keyof I18nStrings): string => {
    return strings[key] || DEFAULT_I18N.en[key] || key;
  }, [strings]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, strings }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};

// Language selector component
export const LanguageSelector: React.FC<{ className?: string }> = ({ className }) => {
  const { language, setLanguage } = useI18n();

  const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    ja: '日本語',
    zh: '中文',
    ko: '한국어',
    pt: 'Português',
    it: 'Italiano',
    ru: 'Русский',
  };

  const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
    en: '🇺🇸',
    es: '🇪🇸',
    fr: '🇫🇷',
    de: '🇩🇪',
    ja: '🇯🇵',
    zh: '🇨🇳',
    ko: '🇰🇷',
    pt: '🇧🇷',
    it: '🇮🇹',
    ru: '🇷🇺',
  };

  return (
    <div className={`relative ${className}`}>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
        className="appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-8 text-sm cursor-pointer hover:border-white/20 focus:outline-none focus:border-white/30"
      >
        {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
          <option key={code} value={code} className="bg-black text-white">
            {LANGUAGE_FLAGS[code as SupportedLanguage]} {name}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
        ▼
      </div>
    </div>
  );
};
