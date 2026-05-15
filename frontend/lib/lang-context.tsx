'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Lang, TranslationKey, translations } from './lang';

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => translations.en[key],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = localStorage.getItem('milkflow-lang') as Lang | null;
    if (stored === 'ur' || stored === 'en') {
      setLangState(stored);
      document.documentElement.lang = stored;
      document.documentElement.dir = stored === 'ur' ? 'rtl' : 'ltr';
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('milkflow-lang', l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'ur' ? 'rtl' : 'ltr';
  };

  const t = (key: TranslationKey) => translations[lang][key] as string;

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
