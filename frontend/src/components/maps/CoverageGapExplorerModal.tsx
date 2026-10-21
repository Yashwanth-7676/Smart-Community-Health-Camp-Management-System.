// src/components/maps/CoverageGapExplorerModal.tsx
import React, { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Users,
  Calendar,
  Layers,
  ArrowUpRight,
  Sparkles,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface RegionalDistrictData {
  region: string;
  campsCount: number;
  totalCapacity: number;
  totalRegistered: number;
  estimatedAttendance: number;
  occupancyRate: number;
  coverageStatus: 'Well-Covered' | 'Moderate' | 'Underserved';
  serviceCounts: Record<string, number>;
  statusCounts: { upcoming: number; ongoing: number; completed: number; cancelled: number };
}

interface CoverageGapExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDistrict?: (districtName: string) => void;
}

export const CoverageGapExplorerModal: React.FC<CoverageGapExplorerModalProps> = ({
  isOpen,
  onClose,
  onSelectDistrict,
}) => {
  const [data, setData] = useState<{
    regions: RegionalDistrictData[];
    summary: {
      totalCamps: number;
      totalCapacity: number;
      totalRegistered: number;
      averageOccupancy: number;
      regionsCovered: number;
      underservedCount: number;
    };
    disclaimer: string;
    calculationMethod: string;
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [filterRange, setFilterRange] = useState<'all' | 'past30' | 'upcoming'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Underserved' | 'Moderate' | 'Well-Covered'>('all');

  const fetchCoverageData = async () => {
    try {
      setLoading(true);
      let q = '';
      if (filterRange === 'past30') {
        const d = new Date(Date.now() - 30 * 86400000).toISOString();
        q = `?dateFrom=${d}`;
      } else if (filterRange === 'upcoming') {
        const d = new Date().toISOString();
        q = `?dateFrom=${d}`;
      }

      const res = await apiClient.get(`/camps/regional-analytics${q}`);
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to fetch regional coverage analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCoverageData();
    }
  }, [isOpen, filterRange]);

  if (!isOpen) return null;

  const filteredRegions = data?.regions.filter((r) => {
    if (statusFilter !== 'all' && r.coverageStatus !== statusFilter) return false;
    return true;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl p-6 text-white flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Administrator Geographic Intelligence
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Karnataka State Survey</span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>Coverage Gap Explorer & District Audit</span>
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

        {/* Filters & Range Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold text-[11px]">Time Window:</span>
            <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(['all', 'past30', 'upcoming'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFilterRange(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    filterRange === r ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r === 'all' ? 'All History' : r === 'past30' ? 'Past 30 Days' : 'Upcoming'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold text-[11px]">Coverage Filter:</span>
            <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(['all', 'Underserved', 'Moderate', 'Well-Covered'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    statusFilter === st ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary KPI Strip */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3">
            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Camps</span>
              <span className="text-lg font-black text-white">{data.summary.totalCamps}</span>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Capacity Volume</span>
              <span className="text-lg font-black text-cyan-400 font-mono">
                {data.summary.totalCapacity.toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Occupancy Rate</span>
              <span className="text-lg font-black text-emerald-400 font-mono">
                {data.summary.averageOccupancy}%
              </span>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-2xl border border-amber-500/30">
              <span className="text-[10px] text-amber-400 font-bold uppercase block">Underserved Areas</span>
              <span className="text-lg font-black text-amber-300 font-mono">
                {data.summary.underservedCount} Districts
              </span>
            </div>
          </div>
        )}

        {/* Scrollable District Grid */}
        <div className="flex-1 overflow-y-auto py-2 space-y-2">
          {loading ? (
            <div className="py-20 text-center text-cyan-400 space-y-2">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold">Aggregating district coverage telemetry...</p>
            </div>
          ) : filteredRegions.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              No districts match the selected filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredRegions.map((dist) => (
                <div
                  key={dist.region}
                  className="bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 p-4 rounded-2xl space-y-2 transition"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-white">{dist.region}</h4>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                        dist.coverageStatus === 'Well-Covered'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : dist.coverageStatus === 'Moderate'
                          ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {dist.coverageStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-300 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Camps</span>
                      <strong className="text-white font-mono">{dist.campsCount}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Capacity</span>
                      <strong className="text-cyan-300 font-mono">{dist.totalCapacity}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Occupancy</span>
                      <strong className="text-emerald-300 font-mono">{dist.occupancyRate}%</strong>
                    </div>
                  </div>

                  {dist.campsCount === 0 && (
                    <div className="text-[10px] text-amber-400 bg-amber-950/40 p-2 rounded-xl border border-amber-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Zero recorded camp activity in this query window.</span>
                    </div>
                  )}

                  {onSelectDistrict && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectDistrict(dist.region);
                        onClose();
                      }}
                      className="w-full mt-1 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 text-xs font-bold flex items-center justify-center gap-1 transition"
                    >
                      <span>Highlight in 3D Explorer</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer: Epidemiological Guardrail Disclaimer */}
        <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-400 space-y-1">
          <div className="flex items-start gap-1.5 text-amber-400">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span className="font-bold">Epidemiological & Operational Guardrail:</span>
          </div>
          <p className="leading-snug">
            {data?.disclaimer ||
              'Coverage density reflects scheduled public health camp operational records stored in system database. It does NOT represent epidemiological disease prevalence, local health risk, or absence of healthcare services. Areas without recorded camps indicate absence of recorded camps, not absence of healthcare need.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoverageGapExplorerModal;

