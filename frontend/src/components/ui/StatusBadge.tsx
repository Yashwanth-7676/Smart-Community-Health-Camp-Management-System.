// src/components/ui/StatusBadge.tsx
import React from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  defaultPulse?: boolean;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  UPCOMING: {
    label: 'Upcoming',
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
    dot: 'bg-blue-500',
  },
  upcoming: {
    label: 'Upcoming',
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
    dot: 'bg-blue-500',
  },
  ONGOING: {
    label: 'Ongoing',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-500',
    defaultPulse: true,
  },
  ongoing: {
    label: 'Ongoing',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-500',
    defaultPulse: true,
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    text: 'text-slate-500 dark:text-slate-400',
    border: 'border-slate-300/50 dark:border-slate-700/50',
    dot: 'bg-slate-400',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    text: 'text-slate-500 dark:text-slate-400',
    border: 'border-slate-300/50 dark:border-slate-700/50',
    dot: 'bg-slate-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/30',
    dot: 'bg-rose-500',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/30',
    dot: 'bg-rose-500',
  },
  PENDING: {
    label: 'Pending',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-500',
  },
  pending: {
    label: 'Pending',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-500',
  },
  CONFIRMED: {
    label: 'Confirmed',
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/30',
    dot: 'bg-cyan-500',
  },
  confirmed: {
    label: 'Confirmed',
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/30',
    dot: 'bg-cyan-500',
  },
  WAITING: {
    label: 'Waiting',
    bg: 'bg-purple-500/10 dark:bg-purple-500/15',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/30',
    dot: 'bg-purple-500',
    defaultPulse: true,
  },
  waiting: {
    label: 'Waiting',
    bg: 'bg-purple-500/10 dark:bg-purple-500/15',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/30',
    dot: 'bg-purple-500',
    defaultPulse: true,
  },
  CALLED: {
    label: 'Called',
    bg: 'bg-orange-500/10 dark:bg-orange-500/15',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/30',
    dot: 'bg-orange-500',
    defaultPulse: true,
  },
  called: {
    label: 'Called',
    bg: 'bg-orange-500/10 dark:bg-orange-500/15',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/30',
    dot: 'bg-orange-500',
    defaultPulse: true,
  },
  SKIPPED: {
    label: 'Skipped',
    bg: 'bg-slate-100 dark:bg-slate-800/40',
    text: 'text-slate-500 dark:text-slate-400',
    border: 'border-slate-300/50 dark:border-slate-700/50',
    dot: 'bg-slate-400',
  },
  skipped: {
    label: 'Skipped',
    bg: 'bg-slate-100 dark:bg-slate-800/40',
    text: 'text-slate-500 dark:text-slate-400',
    border: 'border-slate-300/50 dark:border-slate-700/50',
    dot: 'bg-slate-400',
  },
  CHECKED_IN: {
    label: 'Checked In',
    bg: 'bg-violet-500/10 dark:bg-violet-500/15',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-500/30',
    dot: 'bg-violet-500',
    defaultPulse: true,
  },
  DRAFT: {
    label: 'Draft',
    bg: 'bg-slate-100 dark:bg-slate-800/40',
    text: 'text-slate-500 dark:text-slate-400',
    border: 'border-slate-300/50',
    dot: 'bg-slate-400',
  },
  PUBLISHED: {
    label: 'Published',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  MISSED: {
    label: 'Missed',
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/30',
    dot: 'bg-rose-500',
  },
};

const DEFAULT_CONFIG: StatusConfig = {
  label: 'Unknown',
  bg: 'bg-slate-100 dark:bg-slate-800/40',
  text: 'text-slate-500 dark:text-slate-400',
  border: 'border-slate-300/50',
  dot: 'bg-slate-400',
};

const SIZE_CLASSES = {
  sm: 'text-[10px] px-1.5 py-0.5 gap-1',
  md: 'text-xs px-2 py-0.5 gap-1.5',
  lg: 'text-sm px-2.5 py-1 gap-2',
};

const DOT_SIZES = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  pulse,
  className,
}) => {
  const config = STATUS_MAP[status] || DEFAULT_CONFIG;
  const shouldPulse = pulse ?? config.defaultPulse ?? false;
  const label = config.label || status;

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center font-semibold rounded-full border',
          config.bg,
          config.text,
          config.border,
          SIZE_CLASSES[size],
          className
        )
      )}
    >
      <span className={clsx('rounded-full shrink-0 relative', DOT_SIZES[size])}>
        <span
          className={clsx(
            'absolute inset-0 rounded-full',
            config.dot,
            shouldPulse && 'animate-ping opacity-75'
          )}
        />
        <span className={clsx('absolute inset-0 rounded-full', config.dot)} />
      </span>
      {label}
    </span>
  );
};

export default StatusBadge;

