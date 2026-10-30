// frontend/src/components/maps/GeoObservatoryHUD.tsx
/**
 * MEGA UPGRADE 5.0 — GEOAI PUBLIC HEALTH OBSERVATORY
 * Centralized Command Header & Surveillance HUD (Module 10 & 1)
 */

import React from 'react';
import {
  Activity,
  Layers,
  CloudRain,
  History,
  Scale,
  BellRing,
  Send,
  MessageSquare,
  Database,
  RotateCcw,
  Maximize2,
  Minimize2,
  Calendar,
  Sparkles,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export type GeoObservatoryMode =
  | 'LIVE_OPERATIONS'
  | 'PUBLIC_HEALTH_INTEL'
  | 'GEOAI_ANOMALIES'
  | 'ENVIRONMENTAL_INTEL'
  | 'HEALTH_TIME_MACHINE'
  | 'DISTRICT_SCORES'
  | 'INTELLIGENT_ALERTS'
  | 'RAPID_DEPLOYMENT'
  | 'ASK_MAP_AI'
  | 'DATA_QUALITY_REGISTRY';

interface GeoObservatoryHUDProps {
  currentMode: GeoObservatoryMode;
  onSelectMode: (mode: GeoObservatoryMode) => void;
  onResetCamera: () => void;
  isFullscreen: boolean;
  onToggleFullscreen?: () => void;
  mapDimension: '2D' | '3D';
  onToggleDimension?: () => void;
  activeAnomaliesCount: number;
  criticalAlertsCount: number;
  averageStateScore: number;
  selectedDateRange?: string;
  onDateRangeChange?: (range: string) => void;
}

export const GeoObservatoryHUD: React.FC<GeoObservatoryHUDProps> = ({
  currentMode,
  onSelectMode,
  onResetCamera,
  isFullscreen,
  onToggleFullscreen,
  mapDimension,
  onToggleDimension,
  activeAnomaliesCount,
  criticalAlertsCount,
  averageStateScore,
  selectedDateRange = '30d',
  onDateRangeChange,
}) => {
  const modes: Array<{
    id: GeoObservatoryMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    badge?: string;
    badgeColor?: string;
  }> = [
    {
      id: 'LIVE_OPERATIONS',
      label: 'Live Operations',
      icon: Activity,
      accentColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
    },
    {
      id: 'PUBLIC_HEALTH_INTEL',
      label: 'Health Intel',
      icon: Layers,
      accentColor: 'text-teal-400 border-teal-500/40 bg-teal-500/10',
    },
    {
      id: 'GEOAI_ANOMALIES',
      label: 'GeoAI Anomalies',
      icon: TrendingUp,
      accentColor: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
      badge: `${activeAnomaliesCount}`,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    },
    {
      id: 'ENVIRONMENTAL_INTEL',
      label: 'Environmental',
      icon: CloudRain,
      accentColor: 'text-sky-400 border-sky-500/40 bg-sky-500/10',
    },
    {
      id: 'HEALTH_TIME_MACHINE',
      label: 'Time Machine',
      icon: History,
      accentColor: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
    },
    {
      id: 'DISTRICT_SCORES',
      label: 'District Scores',
      icon: Scale,
      accentColor: 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10',
    },
    {
      id: 'INTELLIGENT_ALERTS',
      label: 'Alert Centre',
      icon: BellRing,
      accentColor: 'text-red-400 border-red-500/40 bg-red-500/10',
      badge: `${criticalAlertsCount}`,
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    },
    {
      id: 'RAPID_DEPLOYMENT',
      label: 'Deployment Planner',
      icon: Send,
      accentColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
    },
    {
      id: 'ASK_MAP_AI',
      label: 'Ask Map AI',
      icon: MessageSquare,
      accentColor: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
      badge: 'GeoAI',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    },
    {
      id: 'DATA_QUALITY_REGISTRY',
      label: 'Data Sources',
      icon: Database,
      accentColor: 'text-slate-300 border-slate-600 bg-slate-800/40',
    },
  ];

  return (
    <div className="absolute top-3 left-3 right-3 z-30 pointer-events-none flex flex-col gap-2">
      {/* Top Observatory Title & Telemetry Header */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-2.5 px-4 shadow-2xl shadow-cyan-950/40 pointer-events-auto flex items-center justify-between gap-3 flex-wrap">
        {/* Brand & State Telemetry */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white flex-shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm tracking-wide">
                GEOAI PUBLIC HEALTH OBSERVATORY 5.0
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hidden sm:inline-block">
                Karnataka State Health GIS
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Surveillance
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
              <span>
                Avg State Health Index:{' '}
                <strong className="text-teal-300 font-bold">{averageStateScore.toFixed(1)}/100</strong>
              </span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">
                Active Anomalies: <strong className="text-rose-400 font-bold">{activeAnomaliesCount}</strong>
              </span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">
                Critical Alerts: <strong className="text-red-400 font-bold">{criticalAlertsCount}</strong>
              </span>
              <span className="hidden lg:inline text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-cyan-400" /> K-Anonymity Protected
              </span>
            </div>
          </div>
        </div>

        {/* Global Controls & Filters */}
        <div className="flex items-center gap-2">
          {/* Date Range Selector */}
          {onDateRangeChange && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-950/80 border border-slate-700 rounded-xl px-2 py-1 text-xs text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={selectedDateRange}
                onChange={(e) => onDateRangeChange(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="7d" className="bg-slate-900 text-white">Last 7 Days</option>
                <option value="30d" className="bg-slate-900 text-white">Last 30 Days</option>
                <option value="90d" className="bg-slate-900 text-white">Last Quarter</option>
                <option value="1y" className="bg-slate-900 text-white">Past 1 Year</option>
              </select>
            </div>
          )}

          {/* 2D/3D Toggle */}
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

          {/* Camera Reset */}
          <button
            onClick={onResetCamera}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
            title="Reset Camera to State Overview"
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

      {/* Mode Switcher Navigation Ribbon */}
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
                  ? `${mode.accentColor} font-bold shadow-sm scale-102`
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{mode.label}</span>
              {mode.badge && (
                <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded-full border ${mode.badgeColor}`}>
                  {mode.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GeoObservatoryHUD;

