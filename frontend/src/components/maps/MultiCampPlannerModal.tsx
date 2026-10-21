// src/components/maps/MultiCampPlannerModal.tsx
import React, { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import { MapCamp } from '@/pages/camps/CampMapPage';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Navigation,
  Calendar,
  Users,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/utils/helpers';

interface MultiCampPlanStop {
  campId?: string;
  name: string;
  location: string;
  district: string;
  latitude: number;
  longitude: number;
  plannedDate: string;
  targetCapacity: number;
  services: string[];
  assignedStaff: string[];
}

interface MultiCampPlan {
  id: string;
  title: string;
  targetRegion: string;
  status: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  stops: MultiCampPlanStop[];
  totalEstimatedPatients: number;
  totalCircuitDistanceKm: number;
  estimatedTransitHours: number;
  scheduleConflicts: string[];
  resourceWarnings: string[];
  createdAt: string;
  notes: string;
}

interface MultiCampPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCamps: MapCamp[];
  onPlanApproved?: () => void;
  onFocusCamp?: (camp: MapCamp) => void;
}

export const MultiCampPlannerModal: React.FC<MultiCampPlannerModalProps> = ({
  isOpen,
  onClose,
  availableCamps,
  onPlanApproved,
  onFocusCamp,
}) => {
  const [plans, setPlans] = useState<MultiCampPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  // Form State for creating a new circuit plan
  const [title, setTitle] = useState<string>('');
  const [targetRegion, setTargetRegion] = useState<string>('North Karnataka');
  const [notes, setNotes] = useState<string>('');
  const [selectedStops, setSelectedStops] = useState<MultiCampPlanStop[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/camps/multi-plans');
      if (res.data?.success && res.data?.data) {
        setPlans(res.data.data);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to fetch multi-camp circuit plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  // Add stop from existing available camps
  const handleAddStopFromCamp = (camp: MapCamp) => {
    if (selectedStops.some((s) => s.campId === camp.id)) {
      toast.error('Camp is already added to this circuit plan.');
      return;
    }

    const newStop: MultiCampPlanStop = {
      campId: camp.id,
      name: camp.name,
      location: camp.location,
      district: camp.address?.split(',')[1]?.trim() || camp.location,
      latitude: camp.latitude,
      longitude: camp.longitude,
      plannedDate: new Date(Date.now() + (selectedStops.length + 5) * 86400000).toISOString(),
      targetCapacity: camp.capacity || 120,
      services: camp.services || ['General Medicine'],
      assignedStaff: ['Dr. Senior Specialist', 'Medical Team A'],
    };

    setSelectedStops([...selectedStops, newStop]);
  };

  const handleRemoveStop = (idx: number) => {
    setSelectedStops(selectedStops.filter((_, i) => i !== idx));
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedStops.length === 0) {
      toast.error('Please enter a circuit title and at least one stop.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient.post('/camps/multi-plans', {
        title,
        targetRegion,
        stops: selectedStops,
        notes,
      });

      if (res.data?.success) {
        toast.success('Draft multi-camp mobile circuit plan created!');
        setTitle('');
        setSelectedStops([]);
        setNotes('');
        setActiveTab('list');
        fetchPlans();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create plan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprovePlan = async (planId: string) => {
    try {
      const res = await apiClient.post(`/camps/multi-plans/${planId}/approve`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Plan approved and scheduled!');
        fetchPlans();
        if (onPlanApproved) onPlanApproved();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to approve plan.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl p-6 text-white flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Administrator Access Only
              </span>
              <span className="text-[10px] text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800">
                PROPOSAL / DRAFT STAGE
              </span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-cyan-400" />
              <span>Multi-Camp Itinerary & Mobile Clinic Planner</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 py-3 border-b border-slate-800/80 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-4 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'list'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Existing Circuit Plans ({plans.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-4 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Design New Circuit
          </button>
        </div>

        {/* Tab 1: Existing Plans List */}
        {activeTab === 'list' && (
          <div className="flex-1 overflow-y-auto py-3 space-y-3">
            {loading ? (
              <div className="py-20 text-center text-cyan-400 space-y-2">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold">Loading multi-camp plans...</p>
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                No draft circuit plans recorded. Click &ldquo;Design New Circuit&rdquo; to build an outreach itinerary.
              </div>
            ) : (
              plans.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            p.status === 'APPROVED'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {p.status}
                        </span>
                        <span className="text-[10px] text-slate-400">{p.targetRegion}</span>
                      </div>
                      <h4 className="text-sm font-black text-white">{p.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{p.notes}</p>
                    </div>

                    {p.status !== 'APPROVED' && (
                      <button
                        type="button"
                        onClick={() => handleApprovePlan(p.id)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Promote
                      </button>
                    )}
                  </div>

                  {/* Circuit Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-xs bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Stops</span>
                      <strong className="text-white font-mono">{p.stops.length} Taluk Stops</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Circuit Distance</span>
                      <strong className="text-cyan-400 font-mono">{p.totalCircuitDistanceKm} km road</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Estimated Transit</span>
                      <strong className="text-emerald-400 font-mono">~{p.estimatedTransitHours} hrs driving</strong>
                    </div>
                  </div>

                  {/* Stops Sequence */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Sequential Stop Itinerary:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      {p.stops.map((s, idx) => (
                        <React.Fragment key={idx}>
                          <div className="bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800 text-slate-300">
                            <span className="text-cyan-400 font-bold mr-1">#{idx + 1}</span>
                            <span>{s.name}</span>
                            <span className="text-[10px] text-slate-500 ml-1">({formatDate(s.plannedDate)})</span>
                          </div>
                          {idx < p.stops.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-cyan-500 shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Warnings or Conflicts */}
                  {p.resourceWarnings.length > 0 && (
                    <div className="text-[10px] text-amber-300 bg-amber-950/40 p-2 rounded-xl border border-amber-800/80 space-y-1">
                      {p.resourceWarnings.map((w, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Create New Circuit Plan Form */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreatePlan} className="flex-1 overflow-y-auto py-3 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Circuit Plan Title:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Malnad Taluk Rural Dental Circuit"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Target Region / Zone:
                </label>
                <select
                  value={targetRegion}
                  onChange={(e) => setTargetRegion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="North Karnataka">North Karnataka</option>
                  <option value="Coastal Karnataka">Coastal Karnataka</option>
                  <option value="Central Karnataka">Central Karnataka</option>
                  <option value="South Karnataka">South Karnataka</option>
                  <option value="Bengaluru Metropolitan">Bengaluru Metropolitan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Operational Notes & Directives:
              </label>
              <textarea
                placeholder="Logistics, staff accommodations, vehicle transit requirements..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none text-xs"
              />
            </div>

            {/* Select Stops from Available Camps */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Add Stops to Circuit ({selectedStops.length} selected):
                </span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {availableCamps.slice(0, 10).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleAddStopFromCamp(c)}
                    className="shrink-0 p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs transition space-y-1"
                  >
                    <span className="font-bold text-white block truncate max-w-[150px]">{c.name}</span>
                    <span className="text-[10px] text-cyan-400 block">{c.location}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Stops Sequence */}
            {selectedStops.length > 0 && (
              <div className="space-y-2 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Circuit Sequence Order:
                </span>
                <div className="space-y-1.5">
                  {selectedStops.map((stop, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold text-[10px]">
                          {i + 1}
                        </span>
                        <div>
                          <span className="font-bold text-white">{stop.name}</span>
                          <span className="text-[10px] text-slate-400 ml-2">({stop.district})</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(i)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Calculating Routes...' : 'Save Draft Circuit'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer Notice */}
        <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>
            Draft circuit itineraries require explicit Administrator approval before scheduling or publishing live announcements.
          </span>
        </div>
      </div>
    </div>
  );
};

export default MultiCampPlannerModal;
