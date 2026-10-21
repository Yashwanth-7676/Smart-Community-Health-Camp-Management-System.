// src/components/maps/Camp3DSidebar.tsx
import React, { useState, useMemo } from 'react';
import { MapCamp } from '@/pages/camps/CampMapPage';
import {
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Navigation,
  Eye,
  Crosshair,
  Sparkles,
  ArrowLeft,
  Radio,
} from 'lucide-react';
import { formatDate } from '@/utils/helpers';

interface Camp3DSidebarProps {
  camps: MapCamp[];
  selectedCamp: MapCamp | null;
  onSelectCamp: (camp: MapCamp | null) => void;
  onBookCamp?: (camp: MapCamp) => void;
  onGetDirections?: (camp: MapCamp) => void;
  onViewDetails?: (camp: MapCamp) => void;
  onFocusCamp?: (camp: MapCamp) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedService: string;
  onServiceChange: (service: string) => void;
  freeOnly: boolean;
  onFreeOnlyChange: (free: boolean) => void;
  slotsOnly: boolean;
  onSlotsOnlyChange: (slots: boolean) => void;
  availableServices: string[];
  isLive?: boolean;
}

export const Camp3DSidebar: React.FC<Camp3DSidebarProps> = ({
  camps,
  selectedCamp,
  onSelectCamp,
  onBookCamp,
  onGetDirections,
  onViewDetails,
  onFocusCamp,
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedService,
  onServiceChange,
  freeOnly,
  onFreeOnlyChange,
  slotsOnly,
  onSlotsOnlyChange,
  availableServices,
  isLive = true,
}) => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Client-side filtering of camps for the sidebar list
  const filteredCamps = useMemo(() => {
    return camps.filter((c) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchLoc = (c.location || '').toLowerCase().includes(q);
        const matchAddr = (c.address || '').toLowerCase().includes(q);
        if (!matchName && !matchLoc && !matchAddr) return false;
      }
      if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;
      if (selectedService !== 'all' && (!c.services || !c.services.includes(selectedService))) return false;
      if (freeOnly && !c.isFree) return false;
      if (slotsOnly && (c.availableSlots <= 0 || c.isFullyBooked)) return false;
      return true;
    });
  }, [camps, searchQuery, selectedStatus, selectedService, freeOnly, slotsOnly]);

  return (
    <div
      className={`absolute top-4 bottom-4 left-4 z-20 flex transition-all duration-300 ease-in-out ${
        collapsed ? 'w-10' : 'w-80 sm:w-96'
      }`}
    >
      {/* Main Glassmorphic Sidebar Card */}
      {!collapsed && (
        <div className="flex-1 flex flex-col h-full bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-cyan-500/30 shadow-2xl overflow-hidden text-white animate-in fade-in slide-in-from-left-4 duration-200">
          {/* Header & Search */}
          <div className="p-4 border-b border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>3D Camp Navigator</span>
                </h2>
                <p className="text-[10px] text-slate-400">
                  {filteredCamps.length} active healthcare hubs
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition ${
                  showFilters || selectedStatus !== 'all' || selectedService !== 'all' || freeOnly || slotsOnly
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
                title="Toggle Search Filters"
              >
                <Filter className="w-3.5 h-3.5" />
                <span className="text-[10px]">Filter</span>
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search camp, city, or district..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Collapsible Filter Panel */}
            {showFilters && (
              <div className="pt-2 border-t border-slate-800/80 space-y-2 animate-in fade-in duration-150 text-[11px]">
                {/* Status Selector */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Camp Status:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {['all', 'UPCOMING', 'ONGOING', 'COMPLETED'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => onStatusChange(st)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                          selectedStatus === st
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {st === 'all' ? 'All' : st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specialty Dropdown */}
                {availableServices.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Medical Specialty:
                    </span>
                    <select
                      value={selectedService}
                      onChange={(e) => onServiceChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                    >
                      <option value="all">All Specialties</option>
                      {availableServices.map((svc) => (
                        <option key={svc} value={svc}>
                          {svc}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Checkbox Toggles */}
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-300">
                    <input
                      type="checkbox"
                      checked={freeOnly}
                      onChange={(e) => onFreeOnlyChange(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    Free Only
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-300">
                    <input
                      type="checkbox"
                      checked={slotsOnly}
                      onChange={(e) => onSlotsOnlyChange(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    Available Slots
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Body: Camp List OR Selected Camp Detail View */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {selectedCamp ? (
              /* Selected Camp Deep Information View */
              <div className="space-y-3 animate-in fade-in duration-200">
                <button
                  type="button"
                  onClick={() => onSelectCamp(null)}
                  className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-bold mb-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Camp List
                </button>

                <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-cyan-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                        selectedCamp.status === 'ONGOING'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : selectedCamp.isFullyBooked
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                      }`}
                    >
                      {selectedCamp.status}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400">
                      {selectedCamp.feeLabel}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-white leading-tight">
                      {selectedCamp.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>{selectedCamp.address || selectedCamp.location}</span>
                    </p>
                    <p className="text-[9px] font-mono text-cyan-300 mt-0.5">
                      GPS: {selectedCamp.latitude.toFixed(4)}°N, {selectedCamp.longitude.toFixed(4)}°E
                    </p>
                  </div>

                  {/* Dates & Operating Hours */}
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-1 text-slate-300">
                      <Calendar className="w-3 h-3 text-cyan-400" />
                      <span>{formatDate(selectedCamp.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-300">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>{(selectedCamp as any).operationalHours || '09:00 AM - 04:30 PM'}</span>
                    </div>
                  </div>

                  {/* Capacity Progress Bar */}
                  {(() => {
                    const cap = selectedCamp.capacity || 100;
                    const reg = selectedCamp.registered || 0;
                    const pct = Math.min(100, Math.round((reg / cap) * 100));
                    return (
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
                              selectedCamp.isFullyBooked
                                ? 'bg-amber-400'
                                : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                          <span>
                            Available slots: <strong className="text-white">{selectedCamp.availableSlots}</strong>
                          </span>
                          {selectedCamp.distanceLabel && (
                            <span className="text-cyan-400">{selectedCamp.distanceLabel}</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Specialties */}
                  {selectedCamp.services && selectedCamp.services.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">
                        Services:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedCamp.services.map((svc) => (
                          <span
                            key={svc}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800"
                          >
                            {svc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => onBookCamp && onBookCamp(selectedCamp)}
                      disabled={selectedCamp.isFullyBooked}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md ${
                        selectedCamp.isFullyBooked
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{selectedCamp.isFullyBooked ? 'Fully Booked' : 'Book Camp Slot'}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => onGetDirections && onGetDirections(selectedCamp)}
                        className="py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 flex items-center justify-center gap-1"
                      >
                        <Navigation className="w-3 h-3" /> Directions
                      </button>

                      <button
                        type="button"
                        onClick={() => onFocusCamp && onFocusCamp(selectedCamp)}
                        className="py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1"
                        title="Cinematic Camera Fly-In"
                      >
                        <Crosshair className="w-3 h-3 text-cyan-400" /> Focus Drone
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Synchronized List of Camp Cards */
              <div className="space-y-2">
                {filteredCamps.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 space-y-1">
                    <p className="text-xs font-bold">No health camps match filters</p>
                    <p className="text-[10px] text-slate-500">
                      Try resetting your search query or specialty selection.
                    </p>
                  </div>
                ) : (
                  filteredCamps.map((camp) => {
                    const cap = camp.capacity || 100;
                    const reg = camp.registered || 0;
                    const pct = Math.min(100, Math.round((reg / cap) * 100));

                    return (
                      <div
                        key={camp.id}
                        onClick={() => {
                          onSelectCamp(camp);
                          if (onFocusCamp) onFocusCamp(camp);
                        }}
                        className="p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-cyan-500/40 transition cursor-pointer space-y-1.5 group"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${
                              camp.status === 'ONGOING'
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                : camp.isFullyBooked
                                ? 'bg-amber-950 text-amber-400 border-amber-800'
                                : 'bg-cyan-950 text-cyan-400 border-cyan-800'
                            }`}
                          >
                            {camp.status}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-bold">{camp.feeLabel}</span>
                        </div>

                        <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition line-clamp-1">
                          {camp.name}
                        </h4>

                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                          <span className="truncate">{camp.location}</span>
                        </p>

                        {/* Capacity mini bar */}
                        <div>
                          <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-cyan-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                            <span>{camp.availableSlots} slots free</span>
                            {camp.distanceLabel && (
                              <span className="text-cyan-400">{camp.distanceLabel}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapse / Expand Tab Button */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="self-center -ml-1 p-2 rounded-r-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border-y border-r border-cyan-500/30 shadow-2xl backdrop-blur-xl transition"
        title={collapsed ? 'Expand Camp Navigator' : 'Collapse Sidebar'}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  );
};

export default Camp3DSidebar;
