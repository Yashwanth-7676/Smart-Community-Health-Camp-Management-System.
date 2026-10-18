// frontend/src/components/common/OfflineSyncManager.tsx
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertTriangle, Clock, ChevronDown, X } from 'lucide-react';
import { getOfflineDrafts, syncOfflineDrafts, OfflineRegistrationDraft } from '@/utils/offlineStorage';
import toast from 'react-hot-toast';

export const OfflineSyncManager: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [drafts, setDrafts] = useState<OfflineRegistrationDraft[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const refreshDrafts = () => {
    setDrafts(getOfflineDrafts());
  };

  useEffect(() => {
    refreshDrafts();

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Internet connection restored. Ready to sync offline records.');
      // Auto-sync when back online
      handleSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Network offline. Registration drafts will be saved locally.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(refreshDrafts, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    if (!navigator.onLine) {
      toast.error('Cannot sync while offline. Please connect to the internet.');
      return;
    }

    const pendingCount = drafts.filter((d) => d.status === 'PENDING_SYNC' || d.status === 'FAILED').length;
    if (pendingCount === 0) {
      toast('No pending offline registrations to sync', { icon: 'ℹ️' });
      return;
    }

    setIsSyncing(true);
    try {
      const outcome = await syncOfflineDrafts();
      refreshDrafts();
      if (outcome.synced > 0) {
        toast.success(`Successfully synchronized ${outcome.synced} offline patient records!`);
      }
      if (outcome.failed > 0) {
        toast.error(`${outcome.failed} registrations failed validation. Check drafts list.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Sync failed. Will retry automatically.');
      refreshDrafts();
    } finally {
      setIsSyncing(false);
    }
  };

  const pendingCount = drafts.filter((d) => d.status === 'PENDING_SYNC' || d.status === 'FAILED').length;

  return (
    <>
      <div className="relative inline-flex items-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
            !isOnline
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
              : pendingCount > 0
              ? 'bg-primary-500/10 text-primary-300 border-primary-500/30 hover:bg-primary-500/20'
              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
          }`}
          title={isOnline ? 'Online - All systems operational' : 'Offline Mode Active'}
        >
          {isOnline ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          )}

          <span>{isOnline ? 'Online' : 'Offline'}</span>

          {pendingCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
              {pendingCount}
            </span>
          )}

          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-navy-900 border border-slate-700/80 rounded-2xl shadow-2xl p-4 z-50 animate-fade-in text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    isOnline ? 'bg-emerald-400 ring-2 ring-emerald-400/20' : 'bg-amber-400 ring-2 ring-amber-400/20'
                  }`}
                />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  {isOnline ? 'Live Cloud Connected' : 'Offline Mode (Local Storage)'}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Queued Registrations:</span>
                <span className="font-mono text-white font-semibold">{pendingCount} pending</span>
              </div>

              {pendingCount > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {drafts
                    .filter((d) => d.status !== 'SYNCED')
                    .map((d) => (
                      <div
                        key={d.offlineId}
                        className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs flex flex-col space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-200">
                            {d.firstName} {d.lastName}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              d.status === 'FAILED'
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {d.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center justify-between">
                          <span>Phone: {d.phone}</span>
                          <span>Slot: {d.timeSlot}</span>
                        </div>
                        {d.lastError && (
                          <p className="text-[10px] text-red-400 italic mt-0.5">{d.lastError}</p>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-400/60 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-300 font-medium">All field records synchronized</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Registrations taken offline will queue here automatically.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={handleSync}
                disabled={isSyncing || pendingCount === 0 || !isOnline}
                className="w-full py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-xl flex items-center justify-center space-x-1.5 transition-colors shadow"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing with Server...' : 'Synchronize Now'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default OfflineSyncManager;

