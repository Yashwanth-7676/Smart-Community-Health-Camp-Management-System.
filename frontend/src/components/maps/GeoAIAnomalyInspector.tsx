// frontend/src/components/maps/GeoAIAnomalyInspector.tsx
/**
 * MEGA UPGRADE 5.0 — MODULE 2: GEOAI ANOMALY DETECTION ENGINE
 * Public-health trend monitoring, transparent Z-score calculations & investigation console
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  X,
  Compass,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Search,
  Filter,
  Info,
  Save,
  UserCheck,
  Building2,
  RefreshCw,
} from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

export interface GeoAIAnomalyItem {
  id: string;
  districtId: string;
  districtName: string;
  indicator: string;
  category: 'ATTENDANCE_SURGE' | 'SCREENING_POSITIVITY_SHIFT' | 'REFERRAL_SPIKE' | 'RESOURCE_SHORTAGE';
  severity: 'CRITICAL' | 'WARNING' | 'ELEVATED';
  currentValue: number;
  historicalBaseline: number;
  deltaPercent: number;
  statisticalZScore: number;
  thresholdZ: number;
  detectionFormula: string;
  observedPeriod: string;
  dataSource: string;
  status: 'PENDING_REVIEW' | 'INVESTIGATING' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  assignedAdmin?: string;
  investigationNotes?: string;
  detectedAt: string;
  updatedAt: string;
}

interface GeoAIAnomalyInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  onFocusDistrict: (districtName: string) => void;
  isAdmin?: boolean;
}

export const GeoAIAnomalyInspector: React.FC<GeoAIAnomalyInspectorProps> = ({
  isOpen,
  onClose,
  onFocusDistrict,
  isAdmin = false,
}) => {
  const [anomalies, setAnomalies] = useState<GeoAIAnomalyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAnomaly, setSelectedAnomaly] = useState<GeoAIAnomalyItem | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [investigationNote, setInvestigationNote] = useState<string>('');
  const [newStatus, setNewStatus] = useState<string>('INVESTIGATING');
  const [assignedOfficer, setAssignedOfficer] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/geo-observatory/anomalies');
      if (res.data?.data) {
        setAnomalies(res.data.data);
        if (!selectedAnomaly && res.data.data.length > 0) {
          setSelectedAnomaly(res.data.data[0]);
          setInvestigationNote(res.data.data[0].investigationNotes || '');
          setNewStatus(res.data.data[0].status);
          setAssignedOfficer(res.data.data[0].assignedAdmin || '');
        }
      }
    } catch (error) {
      toast.error('Failed to load anomaly detection feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAnomalies();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectAnomaly = (item: GeoAIAnomalyItem) => {
    setSelectedAnomaly(item);
    setInvestigationNote(item.investigationNotes || '');
    setNewStatus(item.status);
    setAssignedOfficer(item.assignedAdmin || '');
  };

  const handleSaveInvestigation = async () => {
    if (!selectedAnomaly) return;

    try {
      setSubmitting(true);
      const res = await apiClient.post(`/geo-observatory/anomalies/${selectedAnomaly.id}/investigate`, {
        status: newStatus,
        notes: investigationNote,
        assignedAdmin: assignedOfficer,
      });

      toast.success('Investigation findings and status recorded successfully.');
      if (res.data?.data) {
        setSelectedAnomaly(res.data.data);
        setAnomalies((prev) =>
          prev.map((a) => (a.id === selectedAnomaly.id ? res.data.data : a))
        );
      }
    } catch {
      toast.error('Could not save investigation finding.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredList = anomalies.filter((item) => {
    const matchesSeverity = filterSeverity === 'ALL' || item.severity === filterSeverity;
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
    return matchesSeverity && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-fade-in">
      <div className="bg-slate-900 border border-rose-500/30 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl shadow-rose-950/50 text-white overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  GeoAI Public Health Anomaly Detection Engine
                </h2>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  Module 2 • Surveillance
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Statistical moving-average shifts (Z &gt; 1.8σ) flagged for human administrative investigation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAnomalies}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh anomalies"
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

        {/* Disclaimer Warning */}
        <div className="px-6 py-2 bg-rose-950/40 border-b border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>
            <strong>Public Health Governance:</strong> An anomaly is a statistical signal for human administrative review. It does not constitute a confirmed clinical outbreak or automated diagnosis.
          </span>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Severity:
            </span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="WARNING">Warning</option>
              <option value="ELEVATED">Elevated</option>
            </select>

            <span className="text-slate-400 ml-2">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
          </div>

          <div className="text-slate-400 text-[11px]">
            Found <strong className="text-white">{filteredList.length}</strong> active statistical signals
          </div>
        </div>

        {/* Two-Pane Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Anomaly Feed */}
          <div className="w-full md:w-5/12 border-r border-slate-800 overflow-y-auto p-4 space-y-2.5">
            {filteredList.map((item) => {
              const isSelected = selectedAnomaly?.id === item.id;
              const isCrit = item.severity === 'CRITICAL';
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectAnomaly(item)}
                  className={`p-3.5 rounded-xl cursor-pointer transition border ${
                    isSelected
                      ? 'bg-rose-950/30 border-rose-500/50 shadow-md'
                      : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white text-sm">{item.districtName}</span>
                    <span
                      className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                        isCrit
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {item.severity}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-rose-300 mt-1 truncate">
                    {item.indicator}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span>
                      Δ {item.deltaPercent > 0 ? `+${item.deltaPercent}%` : `${item.deltaPercent}%`}
                    </span>
                    <span className="font-mono text-cyan-300 font-bold">
                      Z = +{item.statisticalZScore}σ
                    </span>
                    <span className="text-slate-500">{item.status.replace('_', ' ')}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Anomaly Detail & Investigation Workspace */}
          <div className="w-full md:w-7/12 overflow-y-auto p-6 space-y-5 bg-slate-900/60">
            {selectedAnomaly ? (
              <>
                {/* Title & Fly to 3D */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-mono text-cyan-400">{selectedAnomaly.id}</div>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      {selectedAnomaly.indicator} in {selectedAnomaly.districtName}
                    </h3>
                    <div className="text-xs text-slate-400 mt-1">
                      Category:{' '}
                      <span className="text-slate-200 font-medium">{selectedAnomaly.category}</span> •{' '}
                      Observed: {selectedAnomaly.observedPeriod}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onFocusDistrict(selectedAnomaly.districtName);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition flex-shrink-0"
                  >
                    <Compass className="w-4 h-4" /> Focus on 3D Map
                  </button>
                </div>

                {/* Statistical Metric Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Current Observed</div>
                    <div className="text-base font-bold text-rose-400 mt-0.5">
                      {selectedAnomaly.currentValue}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Historical Baseline</div>
                    <div className="text-base font-bold text-slate-200 mt-0.5">
                      {selectedAnomaly.historicalBaseline}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Deviation (Z-Score)</div>
                    <div className="text-base font-bold text-cyan-400 mt-0.5">
                      +{selectedAnomaly.statisticalZScore}σ
                    </div>
                  </div>
                </div>

                {/* Transparent Calculation Walkthrough */}
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-cyan-300">
                    <Info className="w-4 h-4" /> Statistical Detection Methodology
                  </div>
                  <div className="font-mono text-slate-300 text-[11px] bg-slate-900 p-2 rounded-lg border border-slate-800">
                    {selectedAnomaly.detectionFormula}
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Alert Trigger Threshold: Z &gt; {selectedAnomaly.thresholdZ}σ (95% CI statistical significance limit)
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Verified Source: {selectedAnomaly.dataSource}
                  </div>
                </div>

                {/* Administrative Investigation Form */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-rose-400" /> Administrative Review & Findings
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Last Updated: {new Date(selectedAnomaly.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Investigation Status</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500"
                      >
                        <option value="PENDING_REVIEW">PENDING_REVIEW</option>
                        <option value="INVESTIGATING">INVESTIGATING</option>
                        <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="DISMISSED">DISMISSED</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Assigned Investigating Officer</label>
                      <input
                        type="text"
                        value={assignedOfficer}
                        onChange={(e) => setAssignedOfficer(e.target.value)}
                        placeholder="e.g. Dr. Suresh Rao (DHO)"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Clinical & Operational Findings Notes
                    </label>
                    <textarea
                      value={investigationNote}
                      onChange={(e) => setInvestigationNote(e.target.value)}
                      rows={3}
                      placeholder="Record verified ground findings, water test results, follow-up camp scheduling, or operational context..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleSaveInvestigation}
                      disabled={submitting}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{submitting ? 'Recording Findings...' : 'Save Findings & Status'}</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Select an anomaly from the left feed to examine statistical telemetry and record review findings.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Engine: Statistical Poisson & Gaussian Z-Score Deviation Model • Moving 30-Day Baselines</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Close Anomaly Engine
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeoAIAnomalyInspector;
