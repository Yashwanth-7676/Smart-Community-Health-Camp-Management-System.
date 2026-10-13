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
    icon: 'text-cyan-400 bg-cyan-400/10',
    trend_up: 'text-green-400',
    trend_down: 'text-red-400',
    border: 'border-cyan-500/20',
    glow: 'shadow-cyan-900/30',
  },
  blue: {
    icon: 'text-blue-400 bg-blue-400/10',
    trend_up: 'text-green-400',
    trend_down: 'text-red-400',
    border: 'border-blue-500/20',
    glow: 'shadow-blue-900/30',
  },
  green: {
    icon: 'text-green-400 bg-green-400/10',
    trend_up: 'text-green-400',
    trend_down: 'text-red-400',
    border: 'border-green-500/20',
    glow: 'shadow-green-900/30',
  },
  red: {
    icon: 'text-red-400 bg-red-400/10',
    trend_up: 'text-green-400',
    trend_down: 'text-red-400',
    border: 'border-red-500/20',
    glow: 'shadow-red-900/30',
  },
  yellow: {
    icon: 'text-yellow-400 bg-yellow-400/10',
    trend_up: 'text-green-400',
    trend_down: 'text-red-400',
    border: 'border-yellow-500/20',
    glow: 'shadow-yellow-900/30',
  },
};

const SkeletonPulse: React.FC<{ className: string }> = ({ className }) => (
  <div className={`animate-pulse bg-slate-700/50 rounded ${className}`} />
);

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend = 'neutral',
  changePercent,
  changePeriod = 'vs last month',
  color = 'cyan',
  loading = false,
  darkMode = false,
}) => {
  const colors = colorMap[color];

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up' ? colors.trend_up : trend === 'down' ? colors.trend_down : 'text-slate-400';

  const bg = darkMode
    ? 'bg-[#0f172a]/80 backdrop-blur-sm border border-[#1e3a6e]/50'
    : 'bg-white/80 backdrop-blur-sm border border-slate-200';

  if (loading) {
    return (
      <div className={`rounded-2xl p-5 ${bg} shadow-lg ${colors.glow}`}>
        <div className="flex items-start justify-between mb-4">
          <SkeletonPulse className="w-24 h-3" />
          <SkeletonPulse className="w-10 h-10 rounded-xl" />
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
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`rounded-2xl p-5 ${bg} shadow-lg ${colors.glow} cursor-default select-none`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'} truncate pr-2`}>
          {title}
        </p>
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${colors.icon}`}>
          <Icon size={20} />
        </div>
      </div>

      <p className={`text-3xl font-bold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      {changePercent !== undefined && (
        <div className="flex items-center gap-1.5">
          <TrendIcon size={14} className={trendColor} />
          <span className={`text-sm font-semibold ${trendColor}`}>
            {Math.abs(changePercent).toFixed(1)}%
          </span>
          <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            {changePeriod}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export { StatCard };
export default StatCard;
