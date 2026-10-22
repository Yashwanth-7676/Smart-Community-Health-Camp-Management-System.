// src/components/common/SkeletonLoader.tsx
import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={twMerge(
      'animate-pulse bg-slate-200 dark:bg-slate-800 rounded-lg',
      className
    )}
  />
);

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${className}`}>
    <Shimmer className="h-6 w-3/4 mb-4" />
    <Shimmer className="h-4 w-full mb-2" />
    <Shimmer className="h-4 w-5/6 mb-6" />
    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
      <Shimmer className="h-4 w-1/4" />
      <Shimmer className="h-9 w-24 rounded-xl" />
    </div>
  </div>
);

export const StatCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <Shimmer className="h-4 w-28" />
      <Shimmer className="h-10 w-10 rounded-xl" />
    </div>
    <Shimmer className="h-8 w-20 mb-2" />
    <Shimmer className="h-3 w-32" />
  </div>
);

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-4">
        <Shimmer className="h-4 w-full max-w-[120px]" />
      </td>
    ))}
  </tr>
);

export const ListItemSkeleton: React.FC = () => (
  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800">
    <div className="flex items-center gap-3">
      <Shimmer className="h-10 w-10 rounded-full" />
      <div className="space-y-1.5">
        <Shimmer className="h-4 w-32" />
        <Shimmer className="h-3 w-24" />
      </div>
    </div>
    <Shimmer className="h-8 w-20 rounded-lg" />
  </div>
);

// ─── New variant-based SkeletonBlock ──────────────────────────────────────────

export type SkeletonVariant = 'card' | 'list' | 'table' | 'stat' | 'form' | 'default';

interface SkeletonBlockProps {
  variant?: SkeletonVariant;
  /** Number of rows/items to render (for list, table, form variants) */
  rows?: number;
  /** Number of table columns (table variant only) */
  cols?: number;
  className?: string;
}

const CardVariant: React.FC<{ className?: string }> = ({ className }) => (
  <CardSkeleton className={className} />
);

const ListVariant: React.FC<{ rows: number }> = ({ rows }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <ListItemSkeleton key={i} />
    ))}
  </div>
);

const TableVariant: React.FC<{ rows: number; cols: number }> = ({ rows, cols }) => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
    <table className="w-full">
      <thead>
        <tr className="bg-slate-100 dark:bg-slate-800/60">
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="px-4 py-3">
              <Shimmer className="h-3 w-20" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} cols={cols} />
        ))}
      </tbody>
    </table>
  </div>
);

const StatVariant: React.FC<{ rows: number }> = ({ rows }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: rows }).map((_, i) => (
      <StatCardSkeleton key={i} />
    ))}
  </div>
);

const FormVariant: React.FC<{ rows: number }> = ({ rows }) => (
  <div className="space-y-5 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="space-y-1.5">
        <Shimmer className="h-3.5 w-28" />
        <Shimmer className="h-10 w-full rounded-xl" />
      </div>
    ))}
    <div className="flex justify-end pt-2">
      <Shimmer className="h-10 w-32 rounded-xl" />
    </div>
  </div>
);

const DefaultVariant: React.FC = () => (
  <div className="space-y-3 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
    <Shimmer className="h-6 w-1/2" />
    <Shimmer className="h-4 w-full" />
    <Shimmer className="h-4 w-5/6" />
    <Shimmer className="h-4 w-4/6" />
  </div>
);

export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({
  variant = 'default',
  rows = 3,
  cols = 5,
  className,
}) => {
  switch (variant) {
    case 'card':
      return <CardVariant className={className} />;
    case 'list':
      return <ListVariant rows={rows} />;
    case 'table':
      return <TableVariant rows={rows} cols={cols} />;
    case 'stat':
      return <StatVariant rows={rows} />;
    case 'form':
      return <FormVariant rows={rows} />;
    default:
      return (
        <div className={twMerge(clsx('', className))}>
          <DefaultVariant />
        </div>
      );
  }
};

export interface SkeletonLoaderProps extends SkeletonBlockProps {}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> & {
  Shimmer: typeof Shimmer;
  CardSkeleton: typeof CardSkeleton;
  StatCardSkeleton: typeof StatCardSkeleton;
  TableRowSkeleton: typeof TableRowSkeleton;
  ListItemSkeleton: typeof ListItemSkeleton;
  Block: typeof SkeletonBlock;
} = Object.assign(
  (props: SkeletonLoaderProps) => <SkeletonBlock {...props} />,
  {
    Shimmer,
    CardSkeleton,
    StatCardSkeleton,
    TableRowSkeleton,
    ListItemSkeleton,
    Block: SkeletonBlock,
  }
);

export default SkeletonLoader;

