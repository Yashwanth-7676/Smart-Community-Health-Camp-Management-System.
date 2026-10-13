// src/components/common/OfflineBanner.tsx
import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { LOCAL_STORAGE_KEYS } from '@/utils/constants';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const checkPendingQueue = () => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.OFFLINE_QUEUE);
      const queue = stored ? JSON.parse(stored) : [];
      setPendingCount(Array.isArray(queue) ? queue.length : 0);
    } catch {
      setPendingCount(0);
    }
  };

  useEffect(() => {
    checkPendingQueue();

    const handleOnline = () => {
      setIsOnline(true);
      checkPendingQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.OFFLINE_QUEUE);
      const queue = stored ? JSON.parse(stored) : [];

      if (!queue || queue.length === 0) {
        toast('No offline records to sync');
        return;
      }

      const res = await apiClient.post('/offline/sync', { registrations: queue });
      if (res.data?.success) {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.OFFLINE_QUEUE);
        setPendingCount(0);
        toast.success(`Synced ${res.data.data?.syncedCount || queue.length} offline registrations!`);
      }
    } catch (err: any) {
      toast.error('Sync failed. Will retry automatically.');
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={`w-full py-2 px-4 text-xs font-medium flex items-center justify-between transition-colors shadow-sm ${
        !isOnline
          ? 'bg-amber-500 text-slate-950'
          : 'bg-emerald-600 text-white'
      }`}
    >
      <div className="flex items-center gap-2 mx-auto sm:mx-0">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4" />
            <span>
              You are currently offline. Field registrations are safely saved locally on your device.
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Back online! You have <strong>{pendingCount}</strong> pending registration(s) to synchronize.
            </span>
          </>
        )}
      </div>

      {isOnline && pendingCount > 0 && (
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="ml-4 inline-flex items-center gap-1.5 px-3 py-1 bg-white text-emerald-800 rounded-lg font-semibold hover:bg-emerald-50 transition-colors shrink-0 shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
      )}
    </div>
  );
};

export default OfflineBanner;

