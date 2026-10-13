// src/contexts/LanguageContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import i18n from '@/i18n';
import { LOCAL_STORAGE_KEYS } from '@/utils/constants';

type Language = 'en' | 'kn';

interface LanguageContextType {
  language: Language;
  changeLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isKannada: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.LANGUAGE) as Language | null;
    return saved === 'kn' ? 'kn' : 'en';
  });

  useEffect(() => {
    i18n.changeLanguage(language);
    localStorage.setItem(LOCAL_STORAGE_KEYS.LANGUAGE, language);
    document.documentElement.lang = language;
  }, [language]);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'kn' : 'en'));
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        changeLanguage,
        toggleLanguage,
        isKannada: language === 'kn',
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
