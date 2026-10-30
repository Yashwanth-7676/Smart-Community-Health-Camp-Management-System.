// frontend/src/components/maps/CommandCenterHUD.tsx
import React from 'react';
import {
  Activity,
  Radio,
  MapPin,
  Ambulance,
  Truck,
  Layers,
  Cpu,
  BarChart3,
  Scale,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';

export type WorkspaceMode =
  | 'LIVE_OPERATIONS'
  | 'COVERAGE_SIMULATION'
  | 'RURAL_ACCESSIBILITY'
  | 'EMERGENCY_DISPATCH'
  | 'MMU_FLEET'
  | 'RESOURCE_FLOW'
  | 'AI_SCENARIO_LAB'
  | 'IMPACT_ANALYTICS';

interface CommandCenterHUDProps {
  currentMode: WorkspaceMode;
  onSelectMode: (mode: WorkspaceMode) => void;
  onOpenMultiRegionComparison: () => void;
  onResetCamera: () => void;
  isFullscreen: boolean;
  onToggleFullscreen?: () => void;
  mapDimension: '2D' | '3D';
  onToggleDimension?: () => void;
  isLive?: boolean;
  totalCampsCount: number;
  activeFleetCount: number;
  activeVillagesCount: number;
}

export const CommandCenterHUD: React.FC<CommandCenterHUDProps> = ({
  currentMode,
  onSelectMode,
  onOpenMultiRegionComparison,
  onResetCamera,
  isFullscreen,
  onToggleFullscreen,
  mapDimension,
  onToggleDimension,
  isLive = true,
  totalCampsCount,
  activeFleetCount,
  activeVillagesCount,
}) => {
  const modes: Array<{
    id: WorkspaceMode;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    description: string;
    isSimulated?: boolean;
  }> = [
    {
      id: 'LIVE_OPERATIONS',
      label: 'Live Operations',
      shortLabel: 'Live',
      icon: Activity,
      accentColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
      description: 'Active health camps, verified tertiary hospitals, and real-time public healthcare infrastructure',
    },
    {
      id: 'COVERAGE_SIMULATION',
      label: 'Coverage Simulator',
      shortLabel: 'Simulator',
      icon: Radio,
      accentColor: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
      description: 'Place hypothetical camp locations, compute concentric radius reach (5/15/40km), and test gaps',
      isSimulated: true,
    },
    {
      id: 'RURAL_ACCESSIBILITY',
      label: 'Rural Accessibility',
      shortLabel: 'Villages',
      icon: MapPin,
      accentColor: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
      description: 'Rural settlements, critical transit gaps (>75 mins to emergency), and PHC distance indicators',
    },
    {
      id: 'EMERGENCY_DISPATCH',
      label: 'Trauma & Emergency',
      shortLabel: 'Emergency',
      icon: Ambulance,
      accentColor: 'text-red-400 border-red-500/40 bg-red-500/10',
      description: 'Verified 24/7 tertiary trauma & ICU facilities with emergency phone links and road dispatch',
    },
    {
      id: 'MMU_FLEET',
      label: 'MMU Mobile Fleet',
      shortLabel: 'Fleet',
      icon: Truck,
      accentColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
      description: 'Mobile Medical Units digital tracking, outreach routes, onboard diagnostic labs, and check-ins',
    },
    {
      id: 'RESOURCE_FLOW',
      label: '3D Resource Flow',
      shortLabel: 'Resources',
      icon: Layers,
      accentColor: 'text-teal-400 border-teal-500/40 bg-teal-500/10',
      description: 'Animated supply chain logistics, medicine & diagnostic kit movement, and inter-camp transfers',
    },
    {
      id: 'AI_SCENARIO_LAB',
      label: 'AI Scenario Lab',
      shortLabel: 'AI Lab',
      icon: Cpu,
      accentColor: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
      description: 'Predictive stress testing: Dengue monsoon surge, facility outage, and capacity expansions',
      isSimulated: true,
    },
    {
      id: 'IMPACT_ANALYTICS',
      label: 'Impact Explorer',
      shortLabel: 'Impact',
      icon: BarChart3,
      accentColor: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
      description: 'Historical attendance, district coverage rankings, and exportable healthcare intelligence reports',
    },
  ];

  const currentModeObj = modes.find((m) => m.id === currentMode) || modes[0];

  return (
    <div className="absolute top-3 left-3 right-3 z-30 pointer-events-none flex flex-col gap-2">
      {/* Top Main Command Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-2.5 px-4 shadow-2xl shadow-cyan-950/40 pointer-events-auto flex items-center justify-between gap-3 flex-wrap">
        {/* Brand & Active Mode Headline */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white flex-shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm tracking-wide">
                KARNATAKA HEALTHCARE DIGITAL TWIN 4.0
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                AI Geospatial Intelligence
              </span>
              {isLive && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-md">
              {currentModeObj.description}
            </p>
          </div>
        </div>

        {/* Global Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Multi-Region Comparison Trigger */}
          <button
            onClick={onOpenMultiRegionComparison}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-teal-500/30 text-teal-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition hover:scale-105 active:scale-95"
            title="Open Multi-Region Comparison Matrix"
          >
            <Scale className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Compare Districts</span>
          </button>

          {/* Dimension 2D/3D */}
          {onToggleDimension && (
            <button
              onClick={onToggleDimension}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition"
              title={`Switch to ${mapDimension === '3D' ? '2D Map' : '3D Digital Twin'}`}
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>{mapDimension}</span>
            </button>
          )}

          {/* Reset Camera */}
          <button
            onClick={onResetCamera}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
            title="Reset Camera to Karnataka State Overview"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Command Center Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-cyan-400" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mode Switcher Strip */}
      <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl p-1 shadow-lg pointer-events-auto flex items-center gap-1 overflow-x-auto scrollbar-thin">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${
                isActive
                  ? `${mode.accentColor} font-bold shadow-sm`
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{mode.shortLabel}</span>
              {mode.isSimulated && (
                <span className="text-[9px] uppercase tracking-wider font-extrabold px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Sim
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Advisory Banner when in Simulation / Planning mode */}
      {currentModeObj.isSimulated && (
        <div className="bg-amber-950/80 backdrop-blur-sm border border-amber-500/40 text-amber-200 text-xs px-3 py-1.5 rounded-xl flex items-center justify-between gap-2 shadow-lg pointer-events-auto">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-spin" />
            <span>
              <strong>Simulation & Advisory Mode Active:</strong> Calculations represent hypothetical projections and do not alter live hospital or active camp databases.
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Advisory
          </span>
        </div>
      )}
    </div>
  );
};

export default CommandCenterHUD;
