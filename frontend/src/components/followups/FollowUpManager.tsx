// frontend/src/components/followups/FollowUpManager.tsx
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  RotateCcw,
  History,
  Plus,
  ShieldCheck,
  User,
  MapPin,
  RefreshCw,
  Search,
} from 'lucide-react';

export interface FollowUpItem {
  id: string;
  patientId: string;
  doctorId: string;
  campId: string;
  scheduledDate: string | Date;
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'MISSED';
  notes?: string;
  priority?: 'ROUTINE' | 'URGENT' | 'HIGH';
  consentGranted: boolean;
  notificationDeliveryStatus: 'PENDING_CONFIRMATION' | 'DELIVERED' | 'FAILED' | 'NOT_SENT';
  retryCount: number;
  lastAttemptAt?: string | Date;
  patient?: { firstName: string; lastName: string; phone?: string; email: string };
  doctor?: { firstName: string; lastName: string };
  camp?: { name: string; location: string };
}

export interface NotificationAttempt {
  id: string;
  followUpId: string;
  attemptNumber: number;
  channel: 'SMS' | 'EMAIL' | 'IN_APP';
  recipientMasked: string;
  status: 'DELIVERED' | 'FAILED' | 'PENDING_CONFIRMATION';
  providerMessageId: string;
  failureReason?: string;
  timestamp: string | Date;
}

export const FollowUpManager: React.FC = () => {
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Action States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<NotificationAttempt[]>([]);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUpItem | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Form State
  const [newPatientId, setNewPatientId] = useState('user-patient-1');
  const [newCampId, setNewCampId] = useState('camp-1');
  const [newScheduledDate, setNewScheduledDate] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newPriority, setNewPriority] = useState<'ROUTINE' | 'URGENT' | 'HIGH'>('ROUTINE');

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const res = await fetch('/api/v1/follow-ups', {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setFollowUps(data.data);
      }
    } catch (err) {
      console.error('Failed to load follow-ups', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const res = await fetch('/api/v1/follow-ups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          patientId: newPatientId,
          campId: newCampId,
          scheduledDate: newScheduledDate,
          notes: newNotes,
          priority: newPriority,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreateModalOpen(false);
        setNewNotes('');
        setNewScheduledDate('');
        fetchFollowUps();
      }
    } catch (err) {
      console.error('Error creating follow-up task', err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setActionLoadingId(id);
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/follow-ups/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchFollowUps();
      }
    } catch (err) {
      console.error('Error updating status', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSendNotification = async (id: string) => {
    try {
      setActionLoadingId(id);
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/follow-ups/${id}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ channel: 'SMS' }),
      });
      const data = await res.json();
      if (data.success || data.data) {
        fetchFollowUps();
      }
    } catch (err) {
      console.error('Error dispatching notification', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRetryNotification = async (id: string) => {
    try {
      setActionLoadingId(id);
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/follow-ups/${id}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const data = await res.json();
      if (data.success) {
        fetchFollowUps();
      }
    } catch (err) {
      console.error('Error retrying notification', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleViewHistory = async (item: FollowUpItem) => {
    setSelectedFollowUp(item);
    setHistoryModalOpen(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/follow-ups/${item.id}/history`, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setHistoryItems(data.data);
      }
    } catch (err) {
      console.error('Error fetching history', err);
    }
  };

  const filteredItems = followUps.filter((item) => {
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
    const matchesSearch =
      (item.patient?.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.patient?.lastName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="w-full space-y-6">
      {/* ── Header & Filter Bar ───────────────────────────────────────── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Follow-Up & Clinical Continuity
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800">
                Consent Verified
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Track scheduled reviews, monitor delivery receipts, and manage retries with positive provider confirmations.
            </p>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Follow-Up</span>
          </button>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-5 pt-4 border-t border-slate-800">
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {['ALL', 'SCHEDULED', 'PENDING', 'COMPLETED', 'MISSED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filterStatus === st
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search patients or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* ── Follow-Up List Table / Cards ──────────────────────────────── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
            <span>Loading follow-up tasks...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No follow-up tasks match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notification Status</th>
                  <th className="py-3 px-4">Notes / Priority</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Patient */}
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold text-xs border border-cyan-800/50">
                          {item.patient?.firstName?.[0] || 'P'}
                        </div>
                        <div>
                          <div>
                            {item.patient?.firstName} {item.patient?.lastName}
                          </div>
                          <div className="text-[10px] text-slate-400">{item.camp?.name}</div>
                        </div>
                      </div>
                    </td>

                    {/* Scheduled Date */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{new Date(item.scheduledDate).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800'
                            : item.status === 'SCHEDULED'
                            ? 'bg-blue-950/70 text-blue-400 border-blue-800'
                            : item.status === 'MISSED'
                            ? 'bg-red-950/70 text-red-400 border-red-800'
                            : 'bg-amber-950/70 text-amber-400 border-amber-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* Notification Delivery Receipt */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {item.notificationDeliveryStatus === 'DELIVERED' ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[11px] flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            Confirmed Delivered
                          </span>
                        ) : item.notificationDeliveryStatus === 'FAILED' ? (
                          <span className="px-2 py-0.5 rounded bg-red-950/60 border border-red-800/60 text-red-300 text-[11px] flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-red-400" />
                            Gateway Failed ({item.retryCount}/3 retries)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px]">
                            Not Dispatched
                          </span>
                        )}
                        <button
                          onClick={() => handleViewHistory(item)}
                          className="p-1 text-slate-400 hover:text-cyan-400"
                          title="View Delivery History"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Notes */}
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-400">
                      {item.notes || 'Routine follow-up review'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleStatusChange(item.id, 'COMPLETED')}
                            className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded text-[11px]"
                          >
                            Mark Completed
                          </button>
                        )}

                        {item.notificationDeliveryStatus === 'FAILED' ? (
                          <button
                            onClick={() => handleRetryNotification(item.id)}
                            disabled={actionLoadingId === item.id}
                            className="px-2 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded text-[11px] flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Retry
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSendNotification(item.id)}
                            disabled={actionLoadingId === item.id}
                            className="px-2 py-1 bg-blue-950 hover:bg-blue-900 text-cyan-300 border border-blue-800 rounded text-[11px] flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            Notify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create Follow-Up Modal ────────────────────────────────────── */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Schedule New Follow-Up</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Target Patient ID</label>
                <input
                  type="text"
                  value={newPatientId}
                  onChange={(e) => setNewPatientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Camp ID</label>
                <input
                  type="text"
                  value={newCampId}
                  onChange={(e) => setNewCampId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Scheduled Review Date</label>
                <input
                  type="date"
                  value={newScheduledDate}
                  onChange={(e) => setNewScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="ROUTINE">Routine</option>
                  <option value="URGENT">Urgent (Missed Risk)</option>
                  <option value="HIGH">High Priority</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Clinical Instructions / Notes</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Blood pressure titration review"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Schedule Follow-Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Notification History Modal ────────────────────────────────── */}
      {historyModalOpen && selectedFollowUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Delivery Audit Trail</h3>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Provider delivery receipts for follow-up{' '}
              <strong className="text-slate-200">#{selectedFollowUp.id}</strong> (
              {selectedFollowUp.patient?.firstName} {selectedFollowUp.patient?.lastName})
            </p>

            <div className="space-y-3 max-h-72 overflow-y-auto">
              {historyItems.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-950 rounded-xl">
                  No notification attempts recorded yet.
                </div>
              ) : (
                historyItems.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-white">
                        Attempt #{att.attemptNumber} via {att.channel}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          att.status === 'DELIVERED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-red-950 text-red-400 border border-red-800'
                        }`}
                      >
                        {att.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      <span>Recipient: {att.recipientMasked}</span> &bull;{' '}
                      <span>MsgID: {att.providerMessageId}</span>
                    </div>
                    {att.failureReason && (
                      <div className="text-[11px] text-red-300 bg-red-950/40 p-1.5 rounded border border-red-900/50 mt-1">
                        Reason: {att.failureReason}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500">
                      {new Date(att.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUpManager;
