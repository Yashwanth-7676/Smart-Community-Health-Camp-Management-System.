// src/components/ui/EmptyState.tsx
import React from 'react';
import {
  LucideIcon,
  FolderSearch,
  SearchX,
  DatabaseZap,
  AlertCircle,
  ShieldOff,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type EmptyStateVariant = 'default' | 'search' | 'data' | 'error' | 'permission';

interface VariantConfig {
  icon: LucideIcon;
  defaultTitle: string;
  defaultDescription: string;
  iconWrapperClass: string;
  iconClass: string;
}

const variantConfig: Record<EmptyStateVariant, VariantConfig> = {
  default: {
    icon: FolderSearch,
    defaultTitle: 'Nothing here yet',
    defaultDescription: 'Get started by adding your first item.',
    iconWrapperClass: 'bg-cyan-50 dark:bg-cyan-950/50 border-cyan-100 dark:border-cyan-900/50',
    iconClass: 'text-cyan-600 dark:text-cyan-400',
  },
  search: {
    icon: SearchX,
    defaultTitle: 'No results found',
    defaultDescription: 'Try adjusting your search terms or filters.',
    iconWrapperClass: 'bg-violet-50 dark:bg-violet-950/50 border-violet-100 dark:border-violet-900/50',
    iconClass: 'text-violet-600 dark:text-violet-400',
  },
  data: {
    icon: DatabaseZap,
    defaultTitle: 'No data available',
    defaultDescription: 'Data will appear here once records are added.',
    iconWrapperClass: 'bg-blue-50 dark:bg-blue-950/50 border-blue-100 dark:border-blue-900/50',
    iconClass: 'text-blue-600 dark:text-blue-400',
  },
  error: {
    icon: AlertCircle,
    defaultTitle: 'Something went wrong',
    defaultDescription: 'An error occurred while loading content. Please try again.',
    iconWrapperClass: 'bg-rose-50 dark:bg-rose-950/50 border-rose-100 dark:border-rose-900/50',
    iconClass: 'text-rose-600 dark:text-rose-400',
  },
  permission: {
    icon: ShieldOff,
    defaultTitle: 'Access denied',
    defaultDescription: "You don't have permission to view this content.",
    iconWrapperClass: 'bg-amber-50 dark:bg-amber-950/50 border-amber-100 dark:border-amber-900/50',
    iconClass: 'text-amber-600 dark:text-amber-400',
  },
};

export interface EmptyStateProps {
  /** Custom icon override */
  icon?: LucideIcon;
  /** Title text — falls back to variant default if omitted */
  title?: string;
  description?: string;
  /** Optional action element (e.g. a Button) */
  action?: React.ReactNode;
  className?: string;
  /** Controls icon, colours, and default copy */
  variant?: EmptyStateVariant;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
  variant = 'default',
}) => {
  const cfg = variantConfig[variant];
  const Icon = icon ?? cfg.icon;
  const resolvedTitle = title ?? cfg.defaultTitle;
  const resolvedDescription = description ?? cfg.defaultDescription;

  return (
    <div
      className={twMerge(
        clsx(
          'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40',
          className
        )
      )}
    >
      <div
        className={twMerge(
          clsx(
            'w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm border',
            cfg.iconWrapperClass
          )
        )}
      >
        <Icon className={twMerge(clsx('w-7 h-7', cfg.iconClass))} />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
        {resolvedTitle}
      </h3>
      {resolvedDescription && (
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
          {resolvedDescription}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;

