// src/components/admin/AICampPlannerModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Users,
  MapPin,
  Stethoscope,
  Package,
  Clock,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Check,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';
import { formatDate } from '@/utils/helpers';

interface AICampProposal {
  id: string;
  district: string;
  proposedName: string;
  proposedLocation: string;
  proposedAddress: string;
  latitude: number;
  longitude: number;
  targetStartDate: string;
  targetEndDate: string;
  recommendedCapacity: number;
  recommendedServices: string[];
  recommendedStaffing: {
    doctors: number;
    nurses: number;
    pharmacists: number;
    volunteers: number;
    labTechnicians: number;
  };
  recommendedSupplies: Array<{
    name: string;
    batchType: string;
    quantity: number;
    unit: string;
  }>;
  estimatedAttendance: number;
  confidenceScore: number;
  uncertaintyMargin: string;
  evidence: string[];
  assumptions: string[];
  guardrailNotice: string;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
}

interface AICampPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProposalApproved?: (createdCamp: any) => void;
}

export const AICampPlannerModal: React.FC<AICampPlannerModalProps> = ({
  isOpen,
  onClose,
  onProposalApproved,
}) => {
  const [proposals, setProposals] = useState<AICampProposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<AICampProposal | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editCapacity, setEditCapacity] = useState<number>(150);
  const [reviewNotes, setReviewNotes] = useState<string>('');

  const fetchProposals = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/ai-planner/proposals');
      const list: AICampProposal[] = res.data?.data?.proposals || [];
      setProposals(list);
      if (list.length > 0 && !selectedProposal) {
        setSelectedProposal(list[0]);
        setEditName(list[0].proposedName);
        setEditCapacity(list[0].recommendedCapacity);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to generate AI camp proposals.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProposals();
    }
  }, [isOpen]);

  const handleSelectProposal = (p: AICampProposal) => {
    setSelectedProposal(p);
    setEditName(p.proposedName);
    setEditCapacity(p.recommendedCapacity);
    setReviewNotes('');
  };

  const handleApprove = async () => {
    if (!selectedProposal) return;
    try {
      setIsApproving(true);
      const res = await apiClient.post('/ai-planner/approve', {
        proposalId: selectedProposal.id,
        customName: editName || selectedProposal.proposedName,
        customCapacity: editCapacity || selectedProposal.recommendedCapacity,
        reviewNotes: reviewNotes || 'Approved by Administrator after logistics verification.',
      });

      toast.success('AI Proposal approved! Health camp has been scheduled.');
      if (onProposalApproved && res.data?.data?.camp) {
        onProposalApproved(res.data.data.camp);
      }
      fetchProposals();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to approve proposal.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProposal) return;
    try {
      setIsRejecting(true);
      await apiClient.post('/ai-planner/reject', {
        proposalId: selectedProposal.id,
        rejectionReason: reviewNotes || 'Rejected by Administrator due to municipal or staffing constraints.',
      });

      toast('Proposal rejected and archived.', { icon: '📁' });
      fetchProposals();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reject proposal.');
    } finally {
      setIsRejecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              AI Camp Planning & Decision Support
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              Coverage Gap & Logistics Planning Assistant
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split list + Detail view */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Column: Proposals List */}
          <div className="w-full md:w-80 border-r border-slate-200 dark:border-slate-800 p-4 overflow-y-auto space-y-2.5 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Proposals ({proposals.length})
              </span>
              <button
                type="button"
                onClick={fetchProposals}
                className="text-[11px] text-cyan-600 flex items-center gap-1 font-semibold"
              >
                <RotateCcw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-10 text-xs text-slate-400">
                Analyzing historical attendance & coverage gaps...
              </div>
            ) : proposals.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No active camp proposals found.
              </div>
            ) : (
              proposals.map((p) => {
                const isSelected = selectedProposal?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProposal(p)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer text-xs space-y-1.5 ${
                      isSelected
                        ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 shadow-sm ring-1 ring-cyan-500/50'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-cyan-400/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase">
                        {p.district}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                          p.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : p.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {p.proposedName}
                    </h4>

                    <p className="text-[11px] text-slate-500 truncate">{p.proposedLocation}</p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Est: {p.estimatedAttendance} patients</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {Math.round(p.confidenceScore * 100)}% match
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Detailed Proposal Review & Approval Form */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {selectedProposal ? (
              <>
                {/* Title & Status Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                      Target District: {selectedProposal.district}
                    </span>
                    <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
                      {selectedProposal.proposedName}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl text-slate-700 dark:text-slate-300 font-semibold">
                      Confidence Score: <strong>{Math.round(selectedProposal.confidenceScore * 100)}%</strong>
                    </span>
                  </div>
                </div>

                {/* Evidence & Historical Assumptions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 uppercase text-[11px]">
                      <FileCheck2 className="w-4 h-4 text-cyan-500" /> Historical Evidence
                    </span>
                    <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 list-disc list-inside text-[11px]">
                      {selectedProposal.evidence.map((ev, i) => (
                        <li key={i} className="leading-relaxed">
                          {ev}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 uppercase text-[11px]">
                      <AlertCircle className="w-4 h-4 text-amber-500" /> Planning Assumptions
                    </span>
                    <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 list-disc list-inside text-[11px]">
                      {selectedProposal.assumptions.map((asmp, i) => (
                        <li key={i} className="leading-relaxed">
                          {asmp}
                        </li>
                      ))}
                    </ul>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium pt-1">
                      Uncertainty: {selectedProposal.uncertaintyMargin}
                    </p>
                  </div>
                </div>

                {/* Staffing & Supply Recommendations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Recommended Staffing */}
                  <div className="p-4 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-900/40 text-xs space-y-2">
                    <span className="font-bold text-cyan-900 dark:text-cyan-200 uppercase text-[11px] flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-cyan-600" /> Staffing Requirement
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                        <span className="text-[10px] text-slate-400 uppercase">Doctors</span>
                        <p className="font-black text-base text-cyan-600">{selectedProposal.recommendedStaffing.doctors}</p>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                        <span className="text-[10px] text-slate-400 uppercase">Nurses</span>
                        <p className="font-black text-base text-cyan-600">{selectedProposal.recommendedStaffing.nurses}</p>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                        <span className="text-[10px] text-slate-400 uppercase">Volunteers</span>
                        <p className="font-black text-base text-cyan-600">{selectedProposal.recommendedStaffing.volunteers}</p>
                      </div>
                    </div>
                  </div>

                  {/* Recommended Supplies */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                    <span className="font-bold text-slate-700 dark:text-slate-200 uppercase text-[11px] flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-purple-500" /> Recommended Pharmacy Batches
                    </span>
                    <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                      {selectedProposal.recommendedSupplies.map((supp, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-[11px] bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60"
                        >
                          <span className="font-medium text-slate-800 dark:text-slate-200">{supp.name}</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            {supp.quantity} {supp.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Guardrails Disclaimer */}
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300">
                  <p className="font-bold flex items-center gap-1.5 mb-0.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> Non-Epidemiological Policy:
                  </p>
                  <p className="leading-relaxed">{selectedProposal.guardrailNotice}</p>
                </div>

                {/* Administrator Review & Approval Form */}
                {selectedProposal.status === 'PROPOSED' ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Administrator Decision & Adjustments
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Camp Title</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:ring-1 focus:ring-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Target Capacity</label>
                        <input
                          type="number"
                          value={editCapacity}
                          onChange={(e) => setEditCapacity(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:ring-1 focus:ring-cyan-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">
                        Review Notes / Logistics Justification
                      </label>
                      <input
                        type="text"
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="e.g. Venue confirmed with Sedam municipal corporation; volunteers assigned."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleReject}
                        disabled={isRejecting || isApproving}
                        className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition disabled:opacity-50"
                      >
                        {isRejecting ? 'Rejecting...' : 'Reject Proposal'}
                      </button>

                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={isApproving || isRejecting}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {isApproving ? 'Scheduling Camp...' : 'Approve & Schedule Camp'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Proposal is{' '}
                      <span className="uppercase">{selectedProposal.status}</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Notes: {selectedProposal.reviewNotes || 'Action processed and recorded in audit trail.'}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 text-slate-400 text-xs">
                Select a proposal on the left to view evidence, staffing, and review controls.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICampPlannerModal;

