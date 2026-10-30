// frontend/src/components/maps/IntelligentAlertCentreModal.tsx
/**
 * MEGA UPGRADE 5.0 — MODULE 6: INTELLIGENT ALERT CENTRE
 * Centralized surveillance alert management, severity triage & chronological action auditing
 */

import React, { useState, useEffect } from 'react';
import {
  BellRing,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  X,
  Compass,
  Filter,
  RefreshCw,
  UserCheck,
  Building2,
  FileText,
  Save,
  Info,
} from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

export interface IntelligentAlertItem {
  id: string;
  districtId: string;
  districtName: string;
  category:
    | 'UNUSUAL_HEALTH_TREND'
    | 'RESOURCE_SHORTAGE'
    | 'MEDICINE_EXPIRY'
    | 'CAPACITY_OVERLOAD'
    | 'FOLLOWUP_DELAY'
    | 'ACCESSIBILITY_GAP'
    | 'ENVIRONMENTAL_ALERT';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  reason: string;
  supportingData: Record<string, any>;
  source: string;
  timestamp: string;
  reviewStatus: 'PENDING_REVIEW' | 'INVESTIGATING' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  assignedAdmin?: string;
  actionHistory: Array<{
    action: string;
    actor: string;
    timestamp: string;
    note?: string;
  }>;
}

interface IntelligentAlertCentreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFocusDistrict: (districtName: string) => void;
  isAdmin?: boolean;
}

export const IntelligentAlertCentreModal: React.FC<IntelligentAlertCentreModalProps> = ({
  isOpen,
  onClose,
  onFocusDistrict,
  isAdmin = false,
}) => {
  const [alerts, setAlerts] = useState<IntelligentAlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAlert, setSelectedAlert] = useState<IntelligentAlertItem | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [adminNote, setAdminNote] = useState<string>('');
  const [assigneeName, setAssigneeName] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/geo-observatory/alerts');
      if (res.data?.data) {
        setAlerts(res.data.data);
        if (!selectedAlert && res.data.data.length > 0) {
          setSelectedAlert(res.data.data[0]);
          setAssigneeName(res.data.data[0].assignedAdmin || '');
        }
      }
    } catch {
      toast.error('Failed to load alert registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAlerts();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdateStatus = async (status: IntelligentAlertItem['reviewStatus']) => {
    if (!selectedAlert) return;

    try {
      setSubmitting(true);
      const res = await apiClient.patch(`/geo-observatory/alerts/${selectedAlert.id}`, {
        reviewStatus: status,
        assignedAdmin: assigneeName || undefined,
        note: adminNote || `Alert updated to ${status}`,
      });

      toast.success(`Alert updated to ${status}. Action logged to audit trail.`);
      if (res.data?.data) {
        setSelectedAlert(res.data.data);
        setAlerts((prev) =>
          prev.map((a) => (a.id === selectedAlert.id ? res.data.data : a))
        );
        setAdminNote('');
      }
    } catch {
      toast.error('Failed to update alert status.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = alerts.filter((item) => {
    const matchSev = filterSeverity === 'ALL' || item.severity === filterSeverity;
    const matchCat = filterCategory === 'ALL' || item.category === filterCategory;
    const matchStat = filterStatus === 'ALL' || item.reviewStatus === filterStatus;
    return matchSev && matchCat && matchStat;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-fade-in">
      <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl shadow-red-950/50 text-white overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <BellRing className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Intelligent Public Health Alert Centre
                </h2>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                  Module 6 • Alert Triage
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Centralized multi-category surveillance alerts with immutable action history audit trails
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAlerts}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh alerts"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters Strip */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Severity:
            </span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
            </select>

            <span className="text-slate-400 ml-2">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="UNUSUAL_HEALTH_TREND">Unusual Health Trend</option>
              <option value="RESOURCE_SHORTAGE">Resource Shortage</option>
              <option value="ENVIRONMENTAL_ALERT">Environmental Alert</option>
              <option value="ACCESSIBILITY_GAP">Accessibility Gap</option>
            </select>

            <span className="text-slate-400 ml-2">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          <div className="text-slate-400 text-[11px]">
            Found <strong className="text-white">{filtered.length}</strong> alerts
          </div>
        </div>

        {/* Content Panes */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Alert Feed */}
          <div className="w-full md:w-5/12 border-r border-slate-800 overflow-y-auto p-4 space-y-2.5">
            {filtered.map((item) => {
              const isSelected = selectedAlert?.id === item.id;
              const isCrit = item.severity === 'CRITICAL';
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedAlert(item);
                    setAssigneeName(item.assignedAdmin || '');
                    setAdminNote('');
                  }}
                  className={`p-3.5 rounded-xl cursor-pointer transition border ${
                    isSelected
                      ? 'bg-red-950/30 border-red-500/50 shadow-md'
                      : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white text-xs">{item.districtName}</span>
                    <span
                      className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                        isCrit
                          ? 'bg-red-500/20 text-red-300 border-red-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {item.severity}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-200 mt-1 line-clamp-1">
                    {item.title}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span>{item.category.replace('_', ' ')}</span>
                    <span className="text-cyan-400 font-mono text-[10px]">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                    <span className="text-slate-300 text-[10px] font-semibold">
                      {item.reviewStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Alert Details & Action Console */}
          <div className="w-full md:w-7/12 overflow-y-auto p-6 space-y-5 bg-slate-900/60">
            {selectedAlert ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-mono text-cyan-400">{selectedAlert.id}</div>
                    <h3 className="text-lg font-bold text-white mt-0.5">{selectedAlert.title}</h3>
                    <div className="text-xs text-slate-400 mt-1">
                      Region: <strong className="text-white">{selectedAlert.districtName}</strong> • Source: {selectedAlert.source}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onFocusDistrict(selectedAlert.districtName);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition flex-shrink-0"
                  >
                    <Compass className="w-4 h-4" /> Focus on 3D Map
                  </button>
                </div>

                {/* Reason & Metrics */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="text-xs text-slate-300 leading-relaxed font-medium">
                    {selectedAlert.reason}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-4 text-xs">
                    {Object.entries(selectedAlert.supportingData || {}).map(([k, v]) => (
                      <div key={k} className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] uppercase text-slate-400 block font-mono">{k}</span>
                        <span className="font-bold text-cyan-300">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Audit Trail */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-cyan-400" /> Action History Audit Trail
                  </h4>
                  <div className="space-y-2 divide-y divide-slate-850">
                    {selectedAlert.actionHistory.map((act, i) => (
                      <div key={i} className="pt-1.5 first:pt-0 text-xs flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-slate-200">
                            {act.action} by <span className="text-cyan-400">{act.actor}</span>
                          </div>
                          {act.note && <div className="text-[11px] text-slate-400 mt-0.5">{act.note}</div>}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Management Buttons */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Administrative Action Station
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Current Status: <strong className="text-amber-400">{selectedAlert.reviewStatus}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Assigned Administrator</label>
                      <input
                        type="text"
                        value={assigneeName}
                        onChange={(e) => setAssigneeName(e.target.value)}
                        placeholder="Admin / Officer Name"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Audit Note</label>
                      <input
                        type="text"
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Resolution / investigation note"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 justify-end">
                    <button
                      onClick={() => handleUpdateStatus('ACKNOWLEDGED')}
                      disabled={submitting}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('INVESTIGATING')}
                      disabled={submitting}
                      className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 text-xs font-semibold transition"
                    >
                      Investigate
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('RESOLVED')}
                      disabled={submitting}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition"
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('DISMISSED')}
                      disabled={submitting}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-semibold transition"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Surveillance Governance: Automated alarms require human officer review before administrative dispatch</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Close Alert Centre
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntelligentAlertCentreModal;

