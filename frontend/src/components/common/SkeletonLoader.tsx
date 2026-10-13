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

export const SkeletonLoader = {
  Shimmer,
  CardSkeleton,
  StatCardSkeleton,
  TableRowSkeleton,
  ListItemSkeleton,
};

export default SkeletonLoader;

