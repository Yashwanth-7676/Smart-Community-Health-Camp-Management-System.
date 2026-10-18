// frontend/src/utils/offlineStorage.ts
import api from '@/api/client';

export interface OfflineRegistrationDraft {
  offlineId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  campId: string;
  campName?: string;
  timeSlot: string;
  medicalHistory?: string;
  createdAt: string;
  status: 'PENDING_SYNC' | 'SYNCING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  lastError?: string;
  syncedToken?: string;
}

const STORAGE_KEY = 'healthcamp_offline_drafts_v1';

/**
 * Retrieve all pending or synced drafts from browser storage
 */
export function getOfflineDrafts(): OfflineRegistrationDraft[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse offline drafts from localStorage:', err);
    return [];
  }
}

/**
 * Save draft with duplicate prevention check
 */
export function saveOfflineDraft(
  draft: Omit<OfflineRegistrationDraft, 'offlineId' | 'createdAt' | 'status' | 'retryCount'>
): { success: boolean; draft?: OfflineRegistrationDraft; error?: string } {
  const existing = getOfflineDrafts();

  // Duplicate prevention: check if patient with same phone number is already queued for this camp
  const duplicate = existing.find(
    (d) => d.phone.trim() === draft.phone.trim() && d.campId === draft.campId && d.status !== 'FAILED'
  );

  if (duplicate) {
    return {
      success: false,
      error: `Patient with phone ${draft.phone} is already queued for this camp (Status: ${duplicate.status}). Duplicate registration prevented.`,
    };
  }

  const newDraft: OfflineRegistrationDraft = {
    ...draft,
    offlineId: `offline-reg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    status: 'PENDING_SYNC',
    retryCount: 0,
  };

  existing.unshift(newDraft);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

  return { success: true, draft: newDraft };
}

/**
 * Sync all pending drafts with server
 */
export async function syncOfflineDrafts(): Promise<{
  total: number;
  synced: number;
  failed: number;
  results: Array<{ offlineId: string; status: string; queueToken?: string; error?: string }>;
}> {
  const drafts = getOfflineDrafts();
  const pending = drafts.filter((d) => d.status === 'PENDING_SYNC' || d.status === 'FAILED');

  if (pending.length === 0) {
    return { total: 0, synced: 0, failed: 0, results: [] };
  }

  // Mark status as SYNCING
  const updatedToSyncing = drafts.map((d) =>
    pending.some((p) => p.offlineId === d.offlineId) ? { ...d, status: 'SYNCING' as const } : d
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedToSyncing));

  try {
    const res = await api.post('/offline/sync', {
      registrations: pending.map((p) => ({
        offlineId: p.offlineId,
        firstName: p.firstName,
        lastName: p.lastName,
        phone: p.phone,
        email: p.email,
        campId: p.campId,
        timeSlot: p.timeSlot,
        medicalHistory: p.medicalHistory,
      })),
    });

    const serverResults: Array<{ offlineId: string; status: string; queueToken?: string; error?: string }> =
      res.data?.data?.results || [];

    // Update draft statuses based on server feedback
    const finalized = getOfflineDrafts().map((d) => {
      const outcome = serverResults.find((r) => r.offlineId === d.offlineId);
      if (!outcome) return d;

      if (outcome.status === 'SYNCED') {
        return {
          ...d,
          status: 'SYNCED' as const,
          syncedToken: outcome.queueToken,
          lastError: undefined,
        };
      } else {
        return {
          ...d,
          status: 'FAILED' as const,
          retryCount: d.retryCount + 1,
          lastError: outcome.error || 'Server rejected registration',
        };
      }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(finalized));

    return {
      total: pending.length,
      synced: serverResults.filter((r) => r.status === 'SYNCED').length,
      failed: serverResults.filter((r) => r.status === 'FAILED').length,
      results: serverResults,
    };
  } catch (err: any) {
    // Network or server error - restore pending status and increment retry count
    const reverted = getOfflineDrafts().map((d) =>
      pending.some((p) => p.offlineId === d.offlineId)
        ? {
            ...d,
            status: 'PENDING_SYNC' as const,
            retryCount: d.retryCount + 1,
            lastError: err.response?.data?.message || err.message || 'Network sync failed',
          }
        : d
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reverted));
    throw err;
  }
}

/**
 * Remove completed drafts older than 7 days to preserve storage space
 */
export function pruneCompletedDrafts(): void {
  const drafts = getOfflineDrafts();
  const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const filtered = drafts.filter(
    (d) => d.status !== 'SYNCED' || new Date(d.createdAt).getTime() > sevenDaysAgo
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
