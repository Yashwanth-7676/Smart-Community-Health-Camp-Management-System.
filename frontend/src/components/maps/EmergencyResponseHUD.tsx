// frontend/src/components/maps/EmergencyResponseHUD.tsx
import React, { useState } from 'react';
import {
  AlertTriangle,
  Phone,
  Building2,
  Navigation,
  ShieldAlert,
  Clock,
  Heart,
  Route,
  X,
  Search,
  ExternalLink,
} from 'lucide-react';
import { HealthcareFacility, VERIFIED_HEALTHCARE_FACILITIES } from './healthcareFacilities';
import { MapCamp } from '@/pages/camps/CampMapPage';
import toast from 'react-hot-toast';

interface EmergencyResponseHUDProps {
  isOpen: boolean;
  onClose: () => void;
  camps: MapCamp[];
  onPlanEmergencyRoute: (originCoords: [number, number], facility: HealthcareFacility) => void;
  onFocusFacility: (facility: HealthcareFacility) => void;
}

export const EmergencyResponseHUD: React.FC<EmergencyResponseHUDProps> = ({
  isOpen,
  onClose,
  camps,
  onPlanEmergencyRoute,
  onFocusFacility,
}) => {
  const [selectedOriginCampId, setSelectedOriginCampId] = useState<string>(camps[0]?.id || '');
  const [searchFacilityQuery, setSearchFacilityQuery] = useState<string>('');
  const [selectedFacility, setSelectedFacility] = useState<HealthcareFacility | null>(null);

  if (!isOpen) return null;

  const emergencyHospitals = VERIFIED_HEALTHCARE_FACILITIES.filter(
    (f) => f.type === 'HOSPITAL' && f.emergencyServices
  );

  const filteredHospitals = emergencyHospitals.filter((h) => {
    if (!searchFacilityQuery) return true;
    const q = searchFacilityQuery.toLowerCase();
    return h.name.toLowerCase().includes(q) || h.district.toLowerCase().includes(q) || h.specialties.some(s => s.toLowerCase().includes(q));
  });

  const selectedOriginCamp = camps.find((c) => c.id === selectedOriginCampId) || camps[0];

  const handleExecuteEmergencyRoute = (hosp: HealthcareFacility) => {
    if (!selectedOriginCamp) {
      toast.error('Please select an origin camp');
      return;
    }
    setSelectedFacility(hosp);
    onPlanEmergencyRoute([selectedOriginCamp.latitude, selectedOriginCamp.longitude], hosp);
    toast.success(`Calculating emergency trauma route to ${hosp.name}...`);
  };

  return (
    <div className="absolute top-20 right-4 sm:right-6 z-40 w-96 max-w-[calc(100vw-2rem)] bg-slate-900/95 border border-red-500/50 backdrop-blur-2xl rounded-3xl p-5 shadow-2xl text-white font-sans animate-in slide-in-from-right-4 duration-200 flex flex-col max-h-[85vh] overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-950 border border-red-600 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-950/80 border border-red-700/60 text-[9px] font-black uppercase tracking-wider text-red-300 mb-0.5">
              <span>Emergency Trauma & ICU Corridors</span>
            </div>
            <h3 className="text-sm font-black text-white">Emergency Response Geographic Mode</h3>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3.5 pt-3 text-xs text-slate-300">
        {/* Origin Camp Selector */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
          <label className="font-bold text-slate-200 text-[11px] block">
            Select Patient Triage Origin (Camp):
          </label>
          <select
            value={selectedOriginCampId}
            onChange={(e) => setSelectedOriginCampId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
          >
            {camps.map((camp) => (
              <option key={camp.id} value={camp.id}>
                {camp.name} ({camp.location})
              </option>
            ))}
          </select>
        </div>

        {/* Facility Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tertiary hospital, trauma center..."
            value={searchFacilityQuery}
            onChange={(e) => setSearchFacilityQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
          />
        </div>

        {/* List of Verified Emergency Hospitals */}
        <div className="space-y-2">
          <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block px-1">
            Verified 24/7 Tertiary Referral Centers ({filteredHospitals.length})
          </span>

          {filteredHospitals.map((hosp) => (
            <div
              key={hosp.id}
              className={`p-3 rounded-2xl border transition space-y-2 ${
                selectedFacility?.id === hosp.id
                  ? 'bg-red-950/40 border-red-500/70 shadow-lg'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">{hosp.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{hosp.district}</p>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-700 font-bold">
                  {hosp.beds} ICU/Beds
                </span>
              </div>

              {/* Specialties */}
              <div className="flex flex-wrap gap-1">
                {hosp.specialties.slice(0, 3).map((s) => (
                  <span
                    key={s}
                    className="text-[8px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* Phone & Routing Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <a
                  href={`tel:${hosp.phone}`}
                  className="flex items-center gap-1.5 text-[10px] text-cyan-400 hover:underline font-mono"
                >
                  <Phone className="w-3 h-3 text-cyan-400" />
                  <span>{hosp.phone}</span>
                </a>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onFocusFacility(hosp)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold"
                  >
                    Focus 3D
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExecuteEmergencyRoute(hosp)}
                    className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-md transition"
                  >
                    <Route className="w-3 h-3" /> Plan Route
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Safety & Legal Warning */}
        <div className="p-2.5 rounded-2xl bg-red-950/20 border border-red-900/40 text-[10px] text-red-300 space-y-1">
          <div className="font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span>Operational Logistics Advisory</span>
          </div>
          <p className="text-[9px] text-slate-400 leading-relaxed">
            This module is an informational route-planning aid for field clinicians. For acute emergency transport, call official State Emergency Services (108) or Health Helpline (104).
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmergencyResponseHUD;

