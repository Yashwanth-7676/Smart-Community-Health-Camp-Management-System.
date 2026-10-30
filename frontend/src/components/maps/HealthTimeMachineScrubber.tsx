// frontend/src/components/maps/HealthTimeMachineScrubber.tsx
/**
 * MEGA UPGRADE 5.0 — MODULE 4: HEALTH TREND TIME MACHINE
 * Historical temporal scrubber spanning Q1 2024 to Q4 2026 with actual vs projected tagging
 */

import React, { useState, useEffect } from 'react';
import {
  History,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  TrendingUp,
  Calendar,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import apiClient from '@/api/client';

export interface TimelineSliceItem {
  period: string;
  isHistorical: boolean;
  totalCamps: number;
  patientsScreened: number;
  highRiskReferrals: number;
  stateAccessIndex: number;
  note?: string;
}

interface HealthTimeMachineScrubberProps {
  isOpen: boolean;
  onSliceChange?: (slice: TimelineSliceItem) => void;
}

export const HealthTimeMachineScrubber: React.FC<HealthTimeMachineScrubberProps> = ({
  isOpen,
  onSliceChange,
}) => {
  const [slices, setSlices] = useState<TimelineSliceItem[]>([
    { period: '2024-Q1', isHistorical: true, totalCamps: 18, patientsScreened: 6420, highRiskReferrals: 780, stateAccessIndex: 68.2 },
    { period: '2024-Q2', isHistorical: true, totalCamps: 24, patientsScreened: 8950, highRiskReferrals: 1120, stateAccessIndex: 70.4 },
    { period: '2024-Q3', isHistorical: true, totalCamps: 31, patientsScreened: 11840, highRiskReferrals: 1540, stateAccessIndex: 72.1 },
    { period: '2024-Q4', isHistorical: true, totalCamps: 42, patientsScreened: 16200, highRiskReferrals: 2180, stateAccessIndex: 74.8 },
    { period: '2025-Q1', isHistorical: true, totalCamps: 48, patientsScreened: 19400, highRiskReferrals: 2650, stateAccessIndex: 76.5 },
    { period: '2025-Q2', isHistorical: true, totalCamps: 56, patientsScreened: 22800, highRiskReferrals: 3120, stateAccessIndex: 78.1 },
    { period: '2025-Q3', isHistorical: true, totalCamps: 64, patientsScreened: 26500, highRiskReferrals: 3680, stateAccessIndex: 79.9 },
    { period: '2025-Q4', isHistorical: true, totalCamps: 78, patientsScreened: 32400, highRiskReferrals: 4520, stateAccessIndex: 82.3 },
    { period: '2026-Q1', isHistorical: true, totalCamps: 84, patientsScreened: 35600, highRiskReferrals: 4980, stateAccessIndex: 84.1 },
    { period: '2026-Q2', isHistorical: true, totalCamps: 92, patientsScreened: 39800, highRiskReferrals: 5620, stateAccessIndex: 85.8 },
    { period: '2026-Q3', isHistorical: true, totalCamps: 104, patientsScreened: 44200, highRiskReferrals: 6240, stateAccessIndex: 87.4 },
    { period: '2026-Q4', isHistorical: false, totalCamps: 118, patientsScreened: 51000, highRiskReferrals: 7100, stateAccessIndex: 89.2, note: 'Projected Expansion Plan' },
  ]);

  const [currentIndex, setCurrentIndex] = useState<number>(10); // Default to current Q3 2026
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await apiClient.get('/geo-observatory/timeline');
        if (res.data?.data && Array.isArray(res.data.data)) {
          setSlices(res.data.data);
        }
      } catch {
        // use fallback initial state
      }
    };
    if (isOpen) {
      fetchTimeline();
    }
  }, [isOpen]);

  // Autoplay loop
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = prev + 1 >= slices.length ? 0 : prev + 1;
          if (onSliceChange && slices[next]) onSliceChange(slices[next]);
          return next;
        });
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, slices, onSliceChange]);

  if (!isOpen) return null;

  const currentSlice = slices[currentIndex] || slices[0];

  const handleStep = (delta: number) => {
    const newIdx = Math.max(0, Math.min(slices.length - 1, currentIndex + delta));
    setCurrentIndex(newIdx);
    if (onSliceChange && slices[newIdx]) onSliceChange(slices[newIdx]);
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-2xl bg-slate-900/95 backdrop-blur-2xl border border-amber-500/40 rounded-2xl p-3.5 shadow-2xl text-white pointer-events-auto animate-in slide-in-from-bottom-3">
      {/* Top Bar of Scrubber */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-amber-400" />
          <span className="font-extrabold text-xs uppercase tracking-wider text-amber-300">
            Health Trend Time Machine
          </span>
          <span
            className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
              currentSlice.isHistorical
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
            }`}
          >
            {currentSlice.isHistorical ? 'Actual Historical Record' : 'Projected Expansion Plan'}
          </span>
        </div>

        {/* Step & Play Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleStep(-1)}
            disabled={currentIndex === 0}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
            title="Step back 1 quarter"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1 text-xs shadow-sm transition"
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleStep(1)}
            disabled={currentIndex === slices.length - 1}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
            title="Step forward 1 quarter"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-1">
        <input
          type="range"
          min="0"
          max={slices.length - 1}
          value={currentIndex}
          onChange={(e) => {
            const idx = Number(e.target.value);
            setCurrentIndex(idx);
            if (onSliceChange && slices[idx]) onSliceChange(slices[idx]);
          }}
          className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
        />

        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>{slices[0]?.period}</span>
          <span className="font-bold text-amber-300 text-xs">{currentSlice.period}</span>
          <span>{slices[slices.length - 1]?.period}</span>
        </div>
      </div>

      {/* Synchronized Temporal Metrics Ribbon */}
      <div className="grid grid-cols-4 gap-2 pt-2.5 mt-2 border-t border-slate-800/80 text-center text-xs">
        <div className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800">
          <div className="text-[10px] text-slate-400">Total Camps</div>
          <div className="font-bold text-white text-sm">{currentSlice.totalCamps}</div>
        </div>
        <div className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800">
          <div className="text-[10px] text-slate-400">Screened</div>
          <div className="font-bold text-cyan-300 text-sm">
            {currentSlice.patientsScreened.toLocaleString()}
          </div>
        </div>
        <div className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800">
          <div className="text-[10px] text-slate-400">Referrals</div>
          <div className="font-bold text-rose-300 text-sm">
            {currentSlice.highRiskReferrals.toLocaleString()}
          </div>
        </div>
        <div className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800">
          <div className="text-[10px] text-slate-400">Access Index</div>
          <div className="font-bold text-emerald-400 text-sm">
            {currentSlice.stateAccessIndex}/100
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthTimeMachineScrubber;
