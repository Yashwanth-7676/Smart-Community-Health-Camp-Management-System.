// src/components/ui/Toast.tsx
import React from 'react';
import toast, { Toaster as HotToaster } from 'react-hot-toast';

export const Toaster: React.FC = () => {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        className: 'dark:!bg-slate-900 dark:!text-slate-100 dark:!border-slate-800 shadow-xl rounded-xl border border-slate-200',
        success: {
          iconTheme: {
            primary: '#06b6d4',
            secondary: '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary: '#f43f5e',
            secondary: '#ffffff',
          },
        },
      }}
    />
  );
};

export const showToast = {
  success: (msg: string) => toast.success(msg),
  error: (msg: string) => toast.error(msg),
  info: (msg: string) => toast(msg),
  loading: (msg: string) => toast.loading(msg),
  dismiss: (id?: string) => toast.dismiss(id),
};

export default Toaster;

