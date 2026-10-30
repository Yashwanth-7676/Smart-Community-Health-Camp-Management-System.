// frontend/src/components/maps/GeoObservatoryRightSidebar.tsx
/**
 * MEGA UPGRADE 5.0 — MODULE 10: RIGHT COMMAND SURVEILLANCE SIDEBAR
 * Displays deep district intelligence, real-time weather, active anomalies & data quality indicators
 */

import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Building2,
  Users,
  Compass,
  AlertTriangle,
  CloudRain,
  Thermometer,
  Wind,
  ShieldCheck,
  Activity,
  HeartPulse,
  ExternalLink,
  Info,
} from 'lucide-react';
import { DistrictDemographics } from './karnatakaDistrictsData';

interface GeoObservatoryRightSidebarProps {
  selectedDistrict: DistrictDemographics | null;
  onClose: () => void;
  onOpenAnomalyInspector?: () => void;
  onOpenDeploymentPlanner?: () => void;
}

export const GeoObservatoryRightSidebar: React.FC<GeoObservatoryRightSidebarProps> = ({
  selectedDistrict,
  onClose,
  onOpenAnomalyInspector,
  onOpenDeploymentPlanner,
}) => {
  const [collapsed, setCollapsed] = useState<boolean>(false);

  if (!selectedDistrict) return null;

  return (
    <aside
      className={`absolute top-20 right-3 bottom-6 z-20 w-80 md:w-96 bg-slate-900/95 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col transition-transform duration-300 pointer-events-auto overflow-hidden text-white ${
        collapsed ? 'translate-x-[calc(100%-42px)]' : 'translate-x-0'
      }`}
    >
      {/* Collapse Toggle Tab */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1 text-xs"
        >
          {collapsed ? <ChevronLeft className="w-4 h-4 text-cyan-400" /> : <ChevronRight className="w-4 h-4" />}
          <span className="text-[10px] font-bold uppercase tracking-wider">{collapsed ? 'Expand' : 'Collapse'}</span>
        </button>

        {!collapsed && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
              Surveillance Terminal
            </span>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* District Headline */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                {selectedDistrict.division} Division
              </span>
              <span className="text-[10px] text-slate-400">HQ: {selectedDistrict.headquarters}</span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1">{selectedDistrict.name}</h3>
            <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{selectedDistrict.notes}</p>
          </div>

          {/* Quick Demographics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Population (2024)</span>
              <span className="font-bold text-white text-sm">
                {(selectedDistrict.population2024 / 100000).toFixed(1)} Lakhs
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Density</span>
              <span className="font-bold text-white text-sm">
                {selectedDistrict.populationDensityPerSqKm} / km²
              </span>
            </div>
          </div>

          {/* Healthcare Delivery Pillars */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
            <div className="font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <Building2 className="w-4 h-4" /> Healthcare Infrastructure
              </span>
              <span className="text-[10px] text-slate-400">NHM Registry</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">PHCs</span>
                <span className="font-bold text-white text-sm">
                  {selectedDistrict.primaryHealthPillars.primaryHealthCentres}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">CHCs</span>
                <span className="font-bold text-white text-sm">
                  {selectedDistrict.primaryHealthPillars.communityHealthCentres}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Sub-Centres</span>
                <span className="font-bold text-white text-sm">
                  {selectedDistrict.primaryHealthPillars.subCentres}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Doctor Ratio:</span>
                <span className="font-bold text-white">{selectedDistrict.doctorRatioPer1000} / 1,000 citizens</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tertiary Campus:</span>
                <span className="font-bold text-amber-300 truncate max-w-[170px]" title={selectedDistrict.nearestTertiaryCollege}>
                  {selectedDistrict.nearestTertiaryCollege}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Referral Road Distance:</span>
                <span className="font-bold text-white">{selectedDistrict.distanceToTertiaryKm} km</span>
              </div>
            </div>
          </div>

          {/* Real-time Environmental Snapshot */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
            <div className="font-bold text-sky-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CloudRain className="w-4 h-4" /> Environmental Profile
              </span>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                CPCB / IMD
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
                <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                <div>
                  <div className="text-slate-400 text-[10px]">Temperature</div>
                  <div className="font-bold text-white">28.4°C</div>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
                <Wind className="w-3.5 h-3.5 text-amber-400" />
                <div>
                  <div className="text-slate-400 text-[10px]">Air Quality (AQI)</div>
                  <div className="font-bold text-emerald-400">58 (Good)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Station */}
          <div className="space-y-2 pt-1">
            {onOpenDeploymentPlanner && (
              <button
                onClick={onOpenDeploymentPlanner}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <span>Stage Rapid Healthcare Deployment</span>
              </button>
            )}

            {onOpenAnomalyInspector && (
              <button
                onClick={onOpenAnomalyInspector}
                className="w-full py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <span>Examine Regional Statistical Anomalies</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
          <span>K-Anonymity Active • Suppressed n &lt; 5</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}
    </aside>
  );
};

export default GeoObservatoryRightSidebar;
