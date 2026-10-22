// src/components/ui/ConfirmDialog.tsx
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, HelpCircle, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger' | 'warning';
  isLoading?: boolean;
}

interface VariantTheme {
  icon: React.ReactNode;
  iconWrapper: string;
  confirmVariant: 'primary' | 'danger';
  confirmClass?: string;
}

const variantThemes: Record<NonNullable<ConfirmDialogProps['variant']>, VariantTheme> = {
  default: {
    icon: <HelpCircle className="w-6 h-6" />,
    iconWrapper:
      'bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200/60 dark:border-cyan-700/40 text-cyan-600 dark:text-cyan-400',
    confirmVariant: 'primary',
  },
  danger: {
    icon: <AlertCircle className="w-6 h-6" />,
    iconWrapper:
      'bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-700/40 text-rose-600 dark:text-rose-400',
    confirmVariant: 'danger',
  },
  warning: {
    icon: <AlertTriangle className="w-6 h-6" />,
    iconWrapper:
      'bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-700/40 text-amber-600 dark:text-amber-400',
    // Button component doesn't have 'warning', so we use 'primary' with override
    confirmVariant: 'primary',
    confirmClass:
      'bg-amber-500 hover:bg-amber-400 text-white shadow-md shadow-amber-500/20 focus:ring-amber-400 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-white',
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
}) => {
  const theme = variantThemes[variant];

  // Keyboard handler & body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          {/* Dialog Panel */}
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={twMerge(
              clsx(
                'relative w-full max-w-md rounded-2xl z-10',
                'bg-white dark:bg-slate-900',
                'border border-slate-200 dark:border-slate-800',
                'shadow-2xl shadow-slate-950/30',
                'p-6'
              )
            )}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              disabled={isLoading}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon + Title */}
            <div className="flex items-start gap-4 mb-4">
              <div
                className={twMerge(
                  clsx(
                    'flex items-center justify-center w-12 h-12 rounded-xl shrink-0',
                    theme.iconWrapper
                  )
                )}
              >
                {theme.icon}
              </div>
              <div className="pt-0.5">
                <h3
                  id="confirm-dialog-title"
                  className="text-base font-semibold text-slate-900 dark:text-slate-100"
                >
                  {title}
                </h3>
                <p
                  id="confirm-dialog-message"
                  className="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed"
                >
                  {message}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-100 dark:bg-slate-800 -mx-6 mb-5" />

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isLoading}
              >
                {cancelLabel}
              </Button>
              <Button
                variant={theme.confirmVariant}
                size="sm"
                onClick={onConfirm}
                isLoading={isLoading}
                className={theme.confirmClass}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
