import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { HeartPulse, Sparkles, Languages } from 'lucide-react';

export interface HealthTip {
  id: string;
  category: string;
  titleEn: string;
  titleKn: string;
  descEn: string;
  descKn: string;
  icon?: string;
  author?: string;
}

export const HealthTipCard: React.FC<{ tip: HealthTip; className?: string }> = ({ tip, className = '' }) => {
  const [useKannada, setUseKannada] = useState(false);

  return (
    <div className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <HeartPulse className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              {tip.category}
            </span>
          </div>
          <button
            onClick={() => setUseKannada(!useKannada)}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors"
          >
            <Languages className="w-3 h-3" />
            {useKannada ? 'English' : 'ಕನ್ನಡ'}
          </button>
        </div>

        <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
          {useKannada ? tip.titleKn : tip.titleEn}
        </h4>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
          {useKannada ? tip.descKn : tip.descEn}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>Verified by Camp Doctors</span>
        <span className="flex items-center gap-1 text-cyan-500 font-medium">
          <Sparkles className="w-3 h-3" /> Daily Tip
        </span>
      </div>
    </div>
  );
};

export default HealthTipCard;

