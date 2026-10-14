import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral' | { value: string; isPositive?: boolean };
  changePercent?: number;
  changePeriod?: string;
  color?: 'cyan' | 'blue' | 'green' | 'red' | 'yellow';
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  loading?: boolean;
  darkMode?: boolean;
}

const colorMap = {
  cyan: {
    icon: 'text-cyan-500 bg-cyan-500/10 dark:text-cyan-400 dark:bg-cyan-500/15 border border-cyan-500/20',
    trend_up: 'text-emerald-500 dark:text-emerald-400',
    trend_down: 'text-rose-500 dark:text-rose-400',
    glow: 'hover:border-cyan-500/40 hover:shadow-glow',
  },
  blue: {
    icon: 'text-blue-500 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-500/15 border border-blue-500/20',
    trend_up: 'text-emerald-500 dark:text-emerald-400',
    trend_down: 'text-rose-500 dark:text-rose-400',
    glow: 'hover:border-blue-500/40 hover:shadow-glow',
  },
  green: {
    icon: 'text-emerald-500 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/15 border border-emerald-500/20',
    trend_up: 'text-emerald-500 dark:text-emerald-400',
    trend_down: 'text-rose-500 dark:text-rose-400',
    glow: 'hover:border-emerald-500/40 hover:shadow-glow',
  },
  red: {
    icon: 'text-rose-500 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-500/15 border border-rose-500/20',
    trend_up: 'text-emerald-500 dark:text-emerald-400',
    trend_down: 'text-rose-500 dark:text-rose-400',
    glow: 'hover:border-rose-500/40 hover:shadow-glow',
  },
  yellow: {
    icon: 'text-amber-500 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/15 border border-amber-500/20',
    trend_up: 'text-emerald-500 dark:text-emerald-400',
    trend_down: 'text-rose-500 dark:text-rose-400',
    glow: 'hover:border-amber-500/40 hover:shadow-glow',
  },
};

const SkeletonPulse: React.FC<{ className: string }> = ({ className }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`} />
);

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend = 'neutral',
  changePercent,
  changePeriod = 'this week',
  color = 'cyan',
  loading = false,
}) => {
  const colors = colorMap[color] || colorMap.cyan;

  const isTrendObject = typeof trend === 'object' && trend !== null;
  const isPositive = isTrendObject ? trend.isPositive : trend === 'up';
  const TrendIcon = isPositive ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = isPositive ? colors.trend_up : trend === 'down' ? colors.trend_down : 'text-slate-400';

  if (loading) {
    return (
      <div className="rounded-3xl p-6 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-3d">
        <div className="flex items-start justify-between mb-4">
          <SkeletonPulse className="w-24 h-4" />
          <SkeletonPulse className="w-12 h-12 rounded-2xl" />
        </div>
        <SkeletonPulse className="w-32 h-8 mb-3" />
        <SkeletonPulse className="w-20 h-3" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`rounded-3xl p-6 bg-white dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-3d ${colors.glow} transition-all duration-300 cursor-default select-none`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate pr-2 uppercase tracking-wider">
          {title}
        </p>
        <div className={`flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center ${colors.icon} shadow-sm`}>
          <Icon size={20} />
        </div>
      </div>

      <p className="text-2xl sm:text-3xl font-black tracking-tight mb-2 text-slate-900 dark:text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      {isTrendObject ? (
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span className={isPositive ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400'}>
            ● {trend.value}
          </span>
        </div>
      ) : changePercent !== undefined ? (
        <div className="flex items-center gap-1.5">
          <TrendIcon size={14} className={trendColor} />
          <span className={`text-xs font-bold ${trendColor}`}>
            {Math.abs(changePercent).toFixed(1)}%
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {changePeriod}
          </span>
        </div>
      ) : null}
    </motion.div>
  );
};

export default StatCard;
