// src/components/common/LanguageToggle.tsx
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors ${className}`}
      title="Switch Language / ಭಾಷೆಯನ್ನು ಬದಲಾಯಿಸಿ"
    >
      <Globe className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
      <span>{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
    </button>
  );
};

export default LanguageToggle;

