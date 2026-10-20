// src/components/maps/Camp3DMap.tsx
import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { MapCamp } from '@/pages/camps/CampMapPage';
import {
  RotateCcw,
  AlertTriangle,
  Info,
  MapPin,
  Users,
  Calendar,
  Clock,
  Navigation,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  Crosshair,
  Layers,
  Sparkles,
  X,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  Radio,
} from 'lucide-react';
import { formatDate } from '@/utils/helpers';
import Geographic3DTerrain, {
  KARNATAKA_PROJECTION,
  INDIA_PROJECTION,
  projectLatLngTo3D,
} from './Geographic3DTerrain';
import Camp3DPillar, { Camp3DClusterPillar } from './Camp3DPillar';

export interface Camp3DMapProps {
  camps: MapCamp[];
  selectedCamp: MapCamp | null;
  onSelectCamp: (camp: MapCamp) => void;
  userCoords?: [number, number] | null;
  onBookCamp?: (camp: MapCamp) => void;
  onViewDetails?: (camp: MapCamp) => void;
  onGetDirections?: (camp: MapCamp) => void;
  onToggleDimension?: () => void;
  mapDimension?: '2D' | '3D';
  isLive?: boolean;
  isStale?: boolean;
  lastSyncTime?: Date | null;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onTriggerLocation?: () => void;
}

// WebGL Fallback Error Boundary
class WebGLBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const Camp3DMap: React.FC<Camp3DMapProps> = ({
  camps,
  selectedCamp,
  onSelectCamp,
  userCoords,
  onBookCamp,
  onViewDetails,
  onGetDirections,
  onToggleDimension,
  mapDimension = '3D',
  isLive = true,
  isStale = false,
  lastSyncTime = new Date(),
  isFullscreen = false,
  onToggleFullscreen,
  onTriggerLocation,
}) => {
  const controlsRef = useRef<any>(null);
  const [regionFocus, setRegionFocus] = useState<'karnataka' | 'india'>('karnataka');
  const [legendOpen, setLegendOpen] = useState<boolean>(true);
  const [quickListOpen, setQuickListOpen] = useState<boolean>(false);
  const [timeAgo, setTimeAgo] = useState<string>('just now');

  const prefersReducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const activeProjection = regionFocus === 'karnataka' ? KARNATAKA_PROJECTION : INDIA_PROJECTION;

  // Real-time synchronization counter
  useEffect(() => {
    const updateSyncLabel = () => {
      if (!lastSyncTime) {
        setTimeAgo('synced');
        return;
      }
      const secs = Math.max(0, Math.floor((Date.now() - new Date(lastSyncTime).getTime()) / 1000));
      if (secs < 5) setTimeAgo('just now');
      else if (secs < 60) setTimeAgo(`${secs}s ago`);
      else setTimeAgo(`${Math.floor(secs / 60)}m ago`);
    };

    updateSyncLabel();
    const interval = setInterval(updateSyncLabel, 4000);
    return () => clearInterval(interval);
  }, [lastSyncTime]);

  // Reset Camera View
  const handleResetCamera = useCallback(() => {
    if (!controlsRef.current) return;
    if (regionFocus === 'karnataka') {
      controlsRef.current.object.position.set(0, 18, 22);
      controlsRef.current.target.set(0, 0, 0);
    } else {
      controlsRef.current.object.position.set(0, 32, 28);
      controlsRef.current.target.set(0, 0, 0);
    }
    controlsRef.current.update();
  }, [regionFocus]);

  // Handle Zoom In / Zoom Out
  const handleZoom = (direction: 'in' | 'out') => {
    if (!controlsRef.current) return;
    const factor = direction === 'in' ? 0.8 : 1.25;
    controlsRef.current.object.position.multiplyScalar(factor);
    controlsRef.current.update();
  };

  // Center Camera on Selected Camp
  useEffect(() => {
    if (selectedCamp && controlsRef.current && selectedCamp.latitude && selectedCamp.longitude) {
      const [x, , z] = projectLatLngTo3D(selectedCamp.latitude, selectedCamp.longitude, activeProjection);
      controlsRef.current.target.set(x, 0, z);
      controlsRef.current.update();
    }
  }, [selectedCamp, activeProjection]);

  // Switch region focus and adjust camera
  const handleSwitchRegion = (region: 'karnataka' | 'india') => {
    setRegionFocus(region);
    setTimeout(() => {
      if (controlsRef.current) {
        if (region === 'karnataka') {
          controlsRef.current.object.position.set(0, 18, 22);
        } else {
          controlsRef.current.object.position.set(0, 32, 28);
        }
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    }, 50);
  };

  // Clustering for National (All-India) Overview Mode
  const clusters = useMemo(() => {
    if (regionFocus === 'karnataka') return [];

    const grouped: Record<
      string,
      {
        center: [number, number];
        camps: MapCamp[];
        totalCapacity: number;
        totalRegistered: number;
      }
    > = {};

    camps.forEach((c) => {
      if (!c.latitude || !c.longitude) return;
      // Group by ~1.2 degree cell (~120km)
      const cellLat = Math.round(c.latitude / 1.2) * 1.2;
      const cellLng = Math.round(c.longitude / 1.2) * 1.2;
      const key = `${cellLat.toFixed(1)}_${cellLng.toFixed(1)}`;

      if (!grouped[key]) {
        grouped[key] = {
          center: [c.latitude, c.longitude],
          camps: [],
          totalCapacity: 0,
          totalRegistered: 0,
        };
      }
      grouped[key].camps.push(c);
      grouped[key].totalCapacity += c.capacity || 100;
      grouped[key].totalRegistered += c.registered || 0;
    });

    return Object.values(grouped);
  }, [camps, regionFocus]);

  return (
    <div className="relative w-full h-full bg-[#030712] overflow-hidden select-none font-sans">
      {/* ------------------------------------------------------------- */}
      {/* TOP-LEFT HUD: Region Selector & Telemetry                     */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 max-w-sm">
        {/* Region Scope Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-cyan-500/30 shadow-2xl">
          <button
            type="button"
            onClick={() => handleSwitchRegion('karnataka')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              regionFocus === 'karnataka'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" /> Focus Karnataka
          </button>
          <button
            type="button"
            onClick={() => handleSwitchRegion('india')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              regionFocus === 'india'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> All India
          </button>
        </div>

        {/* Live Telemetry Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/85 backdrop-blur-md rounded-xl border border-slate-800 text-[11px] text-slate-300 shadow-lg">
          <span className="flex items-center gap-1.5 font-bold">
            <span
              className={`w-2 h-2 rounded-full ${
                isLive && !isStale
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-amber-400'
              }`}
            />
            {isLive && !isStale ? 'LIVE TELEMETRY' : 'OFFLINE MODE'}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 font-mono">{timeAgo}</span>
          <span className="text-slate-500">•</span>
          <span className="text-cyan-400 font-bold">{camps.length} Pillars</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TOP-RIGHT CONTROLS: 2D/3D Mode, Reset, Fullscreen            */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Dimension Switcher: 2D <-> 3D */}
        {onToggleDimension && (
          <button
            type="button"
            onClick={onToggleDimension}
            className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 text-xs font-bold border border-cyan-500/40 shadow-xl backdrop-blur-md flex items-center gap-1.5 transition"
            title="Switch to 2D Leaflet Map"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Switch to 2D</span>
          </button>
        )}

        {/* Reset Camera */}
        <button
          type="button"
          onClick={handleResetCamera}
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700/80 shadow-xl backdrop-blur-md transition"
          title="Reset Camera Orientation"
        >
          <RotateCcw className="w-4 h-4 text-cyan-400" />
        </button>

        {/* Fullscreen Toggle */}
        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700/80 shadow-xl backdrop-blur-md transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FLOATING SELECTED CAMP INFORMATION CARD                       */}
      {/* ------------------------------------------------------------- */}
      {selectedCamp && (
        <div className="absolute top-16 right-4 z-30 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-cyan-500/40 shadow-2xl p-4 text-white space-y-3 animate-in fade-in slide-in-from-right-4 duration-200">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                    selectedCamp.status === 'ONGOING'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : selectedCamp.isFullyBooked
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                  }`}
                >
                  {selectedCamp.status}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {selectedCamp.feeLabel}
                </span>
              </div>
              <h3 className="text-sm font-black text-white leading-tight">
                {selectedCamp.name}
              </h3>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="truncate">{selectedCamp.location}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectCamp(null as any)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close Camp Card"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Operational Hours & Dates */}
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>{formatDate(selectedCamp.startDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{(selectedCamp as any).operationalHours || '09:00 AM - 04:30 PM'}</span>
            </div>
          </div>

          {/* Capacity & Slot Metrics */}
          {(() => {
            const cap = selectedCamp.capacity || 100;
            const reg = selectedCamp.registered || 0;
            const pct = Math.min(100, Math.round((reg / cap) * 100));
            return (
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Registration Volume
                  </span>
                  <span className="font-mono text-cyan-300 font-bold">
                    {reg} / {cap} ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      selectedCamp.isFullyBooked
                        ? 'bg-amber-400'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>
                    Remaining slots: <strong className="text-white">{selectedCamp.availableSlots}</strong>
                  </span>
                  {selectedCamp.distanceLabel && (
                    <span className="text-cyan-400">{selectedCamp.distanceLabel}</span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Clinical Specialties */}
          {selectedCamp.services && selectedCamp.services.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Available Clinical Services:
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedCamp.services.map((svc) => (
                  <span
                    key={svc}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800"
                  >
                    {svc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => onBookCamp && onBookCamp(selectedCamp)}
              disabled={selectedCamp.isFullyBooked}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md ${
                selectedCamp.isFullyBooked
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{selectedCamp.isFullyBooked ? 'Fully Booked' : 'Book Camp'}</span>
            </button>

            <button
              type="button"
              onClick={() => onGetDirections && onGetDirections(selectedCamp)}
              className="py-2 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Directions</span>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3D WEBGL CANVAS WITH GENUINE GEOGRAPHIC MAP TERRAIN           */}
      {/* ------------------------------------------------------------- */}
      <WebGLBoundary
        fallback={
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-white space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
            <h3 className="text-base font-bold">3D WebGL Acceleration Unavailable</h3>
            <p className="text-xs text-slate-400 max-w-md">
              Your browser or hardware cannot render hardware-accelerated 3D WebGL scenes. Please switch to the high-performance 2D map.
            </p>
            {onToggleDimension && (
              <button
                type="button"
                onClick={onToggleDimension}
                className="px-4 py-2 bg-cyan-600 text-white text-xs font-bold rounded-xl shadow-lg"
              >
                Switch to 2D Map
              </button>
            )}
          </div>
        }
      >
        <Canvas
          camera={{
            position: regionFocus === 'karnataka' ? [0, 18, 22] : [0, 32, 28],
            fov: 42,
            near: 0.1,
            far: 150,
          }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          {/* Studio & Neon Lighting */}
          <ambientLight intensity={0.8} />
          <directionalLight position={[15, 25, 15]} intensity={1.3} />
          <pointLight position={[-12, 18, -12]} intensity={0.9} color="#22d3ee" />
          <pointLight position={[12, 15, 12]} intensity={0.6} color="#38bdf8" />

          {/* Interactive 3D Camera Controls */}
          <OrbitControls
            ref={controlsRef}
            maxPolarAngle={Math.PI / 2.05} // Prevent camera from dipping underneath ground
            minDistance={6}
            maxDistance={55}
            enableDamping
            dampingFactor={0.06}
          />

          {/* Real Geographic Map Ground Plane with Cartographic Geography */}
          <Geographic3DTerrain regionFocus={regionFocus} />

          {/* Individual 3D Camp Pillars (Karnataka View) */}
          {regionFocus === 'karnataka' &&
            camps.map((camp) => (
              <Camp3DPillar
                key={camp.id}
                camp={camp}
                isSelected={selectedCamp?.id === camp.id}
                onSelect={() => onSelectCamp(camp)}
                projection={activeProjection}
                prefersReducedMotion={prefersReducedMotion}
              />
            ))}

          {/* Clustered 3D Pillars (All India View) */}
          {regionFocus === 'india' &&
            clusters.map((cluster, i) => (
              <Camp3DClusterPillar
                key={`cluster-${i}`}
                cluster={cluster}
                projection={activeProjection}
                onExpandCluster={() => {
                  setRegionFocus('karnataka');
                  setTimeout(handleResetCamera, 50);
                }}
              />
            ))}
        </Canvas>
      </WebGLBoundary>

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM-RIGHT: Zoom & Location Controls                        */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => handleZoom('in')}
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 shadow-xl backdrop-blur-md transition"
          title="Zoom In"
        >
          <Plus className="w-4 h-4 text-cyan-400" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom('out')}
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 shadow-xl backdrop-blur-md transition"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4 text-cyan-400" />
        </button>
        {onTriggerLocation && (
          <button
            type="button"
            onClick={onTriggerLocation}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 shadow-xl backdrop-blur-md transition"
            title="My Current Location"
          >
            <Crosshair className="w-4 h-4 text-cyan-400" />
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM-LEFT: Collapsible Legend & Metric Definition           */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute bottom-6 left-4 z-20 max-w-xs">
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl p-3 text-xs text-white">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="font-extrabold text-[11px] uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> 3D Geographic Legend
            </span>
            <button
              type="button"
              onClick={() => setLegendOpen(!legendOpen)}
              className="text-slate-400 hover:text-white"
            >
              {legendOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>

          {legendOpen && (
            <div className="space-y-2 text-[11px] pt-1 border-t border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span className="text-slate-300">Upcoming Camp</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-300">Ongoing Active Camp</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-slate-300">Fully Booked Camp</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="text-slate-300">Cancelled Camp</span>
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 space-y-0.5">
                <p>
                  <strong className="text-slate-200">Pillar Height:</strong> Scaled to camp capacity (1 unit ≈ 30 patients).
                </p>
                <p className="text-[9px] text-slate-500">
                  Basemap data © OpenStreetMap contributors, CartoDB.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Camp3DMap;
