// src/components/maps/CampComparisonDrawer.tsx
import React from 'react';
import { MapCamp } from '@/pages/camps/CampMapPage';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Navigation,
  Crosshair,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { formatDate } from '@/utils/helpers';

interface CampComparisonDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  camps: MapCamp[];
  onRemoveCamp: (campId: string) => void;
  onClearAll: () => void;
  onFocusCamp: (camp: MapCamp) => void;
  onBookCamp: (camp: MapCamp) => void;
  onPlanRoute?: (camp: MapCamp) => void;
}

export const CampComparisonDrawer: React.FC<CampComparisonDrawerProps> = ({
  isOpen,
  onClose,
  camps,
  onRemoveCamp,
  onClearAll,
  onFocusCamp,
  onBookCamp,
  onPlanRoute,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-slate-900/95 border border-cyan-500/40 rounded-3xl shadow-2xl p-5 text-white flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-black tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>Multi-Camp Clinical Comparison</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                {camps.length} Selected (Max 4)
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Compare operational dates, medical specialties, capacity occupancy, and accessibility.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {camps.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-x-auto overflow-y-auto py-4">
          {camps.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <Layers className="w-10 h-10 text-cyan-500 mx-auto opacity-40" />
              <p className="text-sm font-bold text-white">No camps selected for comparison</p>
              <p className="text-xs max-w-md mx-auto text-slate-400">
                Click &ldquo;Compare&rdquo; on any camp card or pillar to compare services, dates, available booking slots, and distances side-by-side.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 min-w-[640px]">
              {camps.map((camp) => {
                const cap = camp.capacity || 100;
                const reg = camp.registered || 0;
                const pct = Math.min(100, Math.round((reg / cap) * 100));

                return (
                  <div
                    key={camp.id}
                    className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative group"
                  >
                    {/* Top Row */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            camp.status === 'ONGOING'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : camp.isFullyBooked
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                          }`}
                        >
                          {camp.status}
                        </span>

                        <button
                          type="button"
                          onClick={() => onRemoveCamp(camp.id)}
                          className="text-slate-500 hover:text-rose-400 transition"
                          title="Remove from comparison"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <h4 className="text-xs font-black text-white leading-snug line-clamp-2">
                        {camp.name}
                      </h4>

                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{camp.address || camp.location}</span>
                      </p>
                    </div>

                    {/* Operational Details */}
                    <div className="space-y-1.5 text-[11px] bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{formatDate(camp.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{(camp as any).operationalHours || '09:00 AM - 04:30 PM'}</span>
                      </div>
                      {camp.distanceLabel && (
                        <div className="text-cyan-400 font-mono text-[10px]">
                          📍 {camp.distanceLabel}
                        </div>
                      )}
                    </div>

                    {/* Capacity Occupancy Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Users className="w-3 h-3" /> Registration
                        </span>
                        <span className="font-mono text-cyan-300 font-bold">
                          {reg} / {cap} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full ${
                            camp.isFullyBooked
                              ? 'bg-amber-400'
                              : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                        <span>Slots left: <strong className="text-white">{camp.availableSlots}</strong></span>
                        <span className="text-emerald-400 font-bold">{camp.feeLabel}</span>
                      </div>
                    </div>

                    {/* Clinical Services */}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Services:
                      </span>
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                        {camp.services && camp.services.length > 0 ? (
                          camp.services.map((s) => (
                            <span
                              key={s}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/80"
                            >
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-500">General Medicine</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          onFocusCamp(camp);
                          onClose();
                        }}
                        className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold flex items-center justify-center gap-1 transition"
                      >
                        <Crosshair className="w-3.5 h-3.5" /> Focus on 3D Map
                      </button>

                      {onPlanRoute && (
                        <button
                          type="button"
                          onClick={() => {
                            onPlanRoute(camp);
                            onClose();
                          }}
                          className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1 transition"
                        >
                          <Navigation className="w-3.5 h-3.5" /> Plan Road Route
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          onBookCamp(camp);
                          onClose();
                        }}
                        disabled={camp.isFullyBooked}
                        className={`w-full py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition shadow-md ${
                          camp.isFullyBooked
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{camp.isFullyBooked ? 'Fully Booked' : 'Book Camp Slot'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampComparisonDrawer;

