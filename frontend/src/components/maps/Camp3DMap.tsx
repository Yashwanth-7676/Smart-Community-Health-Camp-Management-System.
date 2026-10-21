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
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  Crosshair,
  Layers,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Building2,
  Activity,
  Compass,
  Eye,
  Sliders,
  Plane,
} from 'lucide-react';
import Geographic3DTerrain, {
  KARNATAKA_PROJECTION,
  INDIA_PROJECTION,
  MapLayerConfig,
} from './Geographic3DTerrain';
import Camp3DPillar, { Camp3DClusterPillar } from './Camp3DPillar';
import Hospital3DBeacon from './Hospital3DBeacon';
import { VERIFIED_REFERRAL_HOSPITALS } from './referralFacilities';
import CinematicCameraController, { CameraPreset } from './CinematicCameraController';
import Camp3DSidebar from './Camp3DSidebar';

export interface Camp3DMapProps {
  camps: MapCamp[];
  selectedCamp: MapCamp | null;
  onSelectCamp: (camp: MapCamp | null) => void;
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
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  selectedService?: string;
  onServiceChange?: (service: string) => void;
  freeOnly?: boolean;
  onFreeOnlyChange?: (free: boolean) => void;
  slotsOnly?: boolean;
  onSlotsOnlyChange?: (slots: boolean) => void;
  availableServices?: string[];
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
  searchQuery = '',
  onSearchChange,
  selectedStatus = 'all',
  onStatusChange,
  selectedService = 'all',
  onServiceChange,
  freeOnly = false,
  onFreeOnlyChange,
  slotsOnly = false,
  onSlotsOnlyChange,
  availableServices = [],
}) => {
  const controlsRef = useRef<any>(null);

  // Region & Camera State
  const [regionFocus, setRegionFocus] = useState<'karnataka' | 'india'>('karnataka');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset | null>(null);
  const [flyTargetCoords, setFlyTargetCoords] = useState<[number, number] | null>(null);
  const [bearingAngle, setBearingAngle] = useState<number>(0);

  // Independent Layer Toggles
  const [layers, setLayers] = useState<MapLayerConfig>({
    camps: true,
    districts: true,
    heatmap: true,
    hospitals: true,
    highways: true,
  });

  // UI Overlays State
  const [layerPanelOpen, setLayerPanelOpen] = useState<boolean>(false);
  const [cameraPanelOpen, setCameraPanelOpen] = useState<boolean>(false);
  const [legendOpen, setLegendOpen] = useState<boolean>(true);
  const [timeAgo, setTimeAgo] = useState<string>('just now');

  // Internal search/filter state fallbacks if not controlled by parent
  const [localSearch, setLocalSearch] = useState<string>('');
  const [localStatus, setLocalStatus] = useState<string>('all');
  const [localService, setLocalService] = useState<string>('all');
  const [localFree, setLocalFree] = useState<boolean>(false);
  const [localSlots, setLocalSlots] = useState<boolean>(false);

  const activeSearch = onSearchChange ? searchQuery : localSearch;
  const activeStatus = onStatusChange ? selectedStatus : localStatus;
  const activeService = onServiceChange ? selectedService : localService;
  const activeFree = onFreeOnlyChange ? freeOnly : localFree;
  const activeSlots = onSlotsOnlyChange ? slotsOnly : localSlots;

  const handleSearchChange = onSearchChange || setLocalSearch;
  const handleStatusChange = onStatusChange || setLocalStatus;
  const handleServiceChange = onServiceChange || setLocalService;
  const handleFreeOnlyChange = onFreeOnlyChange || setLocalFree;
  const handleSlotsOnlyChange = onSlotsOnlyChange || setLocalSlots;

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

  // Synchronize target coords for cinematic camera when a camp is selected
  useEffect(() => {
    if (selectedCamp && selectedCamp.latitude && selectedCamp.longitude) {
      setFlyTargetCoords([selectedCamp.latitude, selectedCamp.longitude]);
      setCameraPreset(null);
    }
  }, [selectedCamp]);

  // Handle fly-in to a selected camp from sidebar
  const handleFocusCamp = useCallback((camp: MapCamp) => {
    if (camp.latitude && camp.longitude) {
      setFlyTargetCoords([camp.latitude, camp.longitude]);
      setCameraPreset(null);
    }
  }, []);

  // Handle Reset View
  const handleResetCamera = useCallback(() => {
    setFlyTargetCoords(null);
    setBearingAngle(0);
    setCameraPreset(regionFocus === 'karnataka' ? 'hero' : 'orbit');
  }, [regionFocus]);

  // Handle Zoom In / Zoom Out
  const handleZoom = (direction: 'in' | 'out') => {
    if (!controlsRef.current) return;
    const factor = direction === 'in' ? 0.78 : 1.28;
    controlsRef.current.object.position.multiplyScalar(factor);
    controlsRef.current.update();
  };

  // Switch region focus
  const handleSwitchRegion = (region: 'karnataka' | 'india') => {
    setRegionFocus(region);
    setFlyTargetCoords(null);
    setCameraPreset(region === 'karnataka' ? 'hero' : 'orbit');
  };

  // Rotate Bearing
  const handleRotateBearing = (deltaDeg: number) => {
    setBearingAngle((prev) => (prev + deltaDeg) % 360);
  };

  // Layer toggle helper
  const toggleLayer = (layerKey: keyof MapLayerConfig) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
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
      {/* 1. INTERACTIVE GLASS SIDEBAR (Left)                           */}
      {/* ------------------------------------------------------------- */}
      <Camp3DSidebar
        camps={camps}
        selectedCamp={selectedCamp}
        onSelectCamp={onSelectCamp}
        onBookCamp={onBookCamp}
        onGetDirections={onGetDirections}
        onViewDetails={onViewDetails}
        onFocusCamp={handleFocusCamp}
        searchQuery={activeSearch}
        onSearchChange={handleSearchChange}
        selectedStatus={activeStatus}
        onStatusChange={handleStatusChange}
        selectedService={activeService}
        onServiceChange={handleServiceChange}
        freeOnly={activeFree}
        onFreeOnlyChange={handleFreeOnlyChange}
        slotsOnly={activeSlots}
        onSlotsOnlyChange={handleSlotsOnlyChange}
        availableServices={availableServices}
        isLive={isLive && !isStale}
      />

      {/* ------------------------------------------------------------- */}
      {/* 2. TOP-CENTER NAVIGATION BAR: Region & Live Telemetry         */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {/* Region Focus Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-2xl rounded-2xl border border-cyan-500/30 shadow-2xl">
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

        {/* Telemetry Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900/85 backdrop-blur-md rounded-xl border border-slate-800 text-[11px] text-slate-300 shadow-lg">
          <span className="flex items-center gap-1.5 font-bold">
            <span
              className={`w-2 h-2 rounded-full ${
                isLive && !isStale ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            {isLive && !isStale ? 'LIVE TELEMETRY' : 'OFFLINE MODE'}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 font-mono">{timeAgo}</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. TOP-RIGHT CONTROLS: Layers, Camera Presets, 2D Switch, Reset */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Map Layers Toggle Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setLayerPanelOpen(!layerPanelOpen);
              setCameraPanelOpen(false);
            }}
            className={`p-2 rounded-xl text-xs font-bold border shadow-xl backdrop-blur-md flex items-center gap-1.5 transition ${
              layerPanelOpen
                ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                : 'bg-slate-900/90 text-cyan-400 hover:text-cyan-300 border-slate-700'
            }`}
            title="Configure Map Layers"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Layers</span>
          </button>

          {/* Layer Controls Dropdown */}
          {layerPanelOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900/95 border border-cyan-500/30 shadow-2xl p-3 z-50 backdrop-blur-2xl text-xs space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="font-extrabold uppercase text-[10px] tracking-wider text-cyan-400 flex items-center gap-1">
                  <Sliders className="w-3 h-3" /> Map Layer Toggles
                </span>
                <span className="text-[10px] text-slate-500 font-mono">5 Layers</span>
              </div>

              <div className="space-y-1.5">
                {[
                  { key: 'camps' as const, label: '3D Health Camp Pillars', count: camps.length },
                  { key: 'districts' as const, label: 'Verified District Outlines', count: '15 Hubs' },
                  { key: 'heatmap' as const, label: 'Coverage Attendance Heatmap', count: 'Live' },
                  { key: 'hospitals' as const, label: 'Verified Referral Facilities', count: VERIFIED_REFERRAL_HOSPITALS.length },
                  { key: 'highways' as const, label: 'Transit & Highway Corridors', count: '5 NH' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 cursor-pointer transition"
                  >
                    <span className="text-slate-200 text-xs font-semibold">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={layers[item.key]}
                      onChange={() => toggleLayer(item.key)}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 ml-2"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Camera Angles Preset Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setCameraPanelOpen(!cameraPanelOpen);
              setLayerPanelOpen(false);
            }}
            className={`p-2 rounded-xl text-xs font-bold border shadow-xl backdrop-blur-md flex items-center gap-1.5 transition ${
              cameraPanelOpen
                ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                : 'bg-slate-900/90 text-slate-200 hover:text-white border-slate-700'
            }`}
            title="Cinematic Camera Angles"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Camera</span>
          </button>

          {/* Camera Angles Dropdown */}
          {cameraPanelOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900/95 border border-cyan-500/30 shadow-2xl p-2.5 z-50 backdrop-blur-2xl text-xs space-y-1 animate-in fade-in duration-150">
              <span className="font-extrabold uppercase text-[10px] tracking-wider text-cyan-400 block px-2 py-1 mb-1">
                Cinematic Angles
              </span>

              {[
                { id: 'drone' as const, label: '🚁 Drone Fly-In (Low 45°)', desc: 'Close oblique exploration' },
                { id: 'hero' as const, label: '🏔️ 45° Hero Perspective', desc: 'Balanced regional vista' },
                { id: 'topdown' as const, label: '🛰️ Bird\'s-Eye Top-Down', desc: 'Orthographic cartographic view' },
                { id: 'orbit' as const, label: '🪐 High Orbit Overview', desc: 'Subcontinental horizon' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setCameraPreset(p.id);
                    setCameraPanelOpen(false);
                  }}
                  className="w-full text-left p-2 rounded-xl hover:bg-slate-800/80 transition"
                >
                  <span className="block font-bold text-slate-200">{p.label}</span>
                  <span className="block text-[10px] text-slate-400">{p.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dimension Switcher: 2D <-> 3D */}
        {onToggleDimension && (
          <button
            type="button"
            onClick={onToggleDimension}
            className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 text-xs font-bold border border-cyan-500/40 shadow-xl backdrop-blur-md flex items-center gap-1.5 transition"
            title="Switch to 2D Leaflet Map"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden md:inline">2D Map</span>
          </button>
        )}

        {/* Reset Camera */}
        <button
          type="button"
          onClick={handleResetCamera}
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 shadow-xl backdrop-blur-md transition"
          title="Reset Camera Orientation"
        >
          <RotateCcw className="w-4 h-4 text-cyan-400" />
        </button>

        {/* Fullscreen Toggle */}
        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 shadow-xl backdrop-blur-md transition"
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
      {/* 4. 3D WEBGL CANVAS WITH CINEMATIC ENGINE                      */}
      {/* ------------------------------------------------------------- */}
      <WebGLBoundary
        fallback={
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-white space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
            <h3 className="text-base font-bold">3D WebGL Acceleration Unavailable</h3>
            <p className="text-xs text-slate-400 max-w-md">
              Your browser or graphics hardware does not currently support hardware-accelerated 3D WebGL rendering. Switch to the high-performance 2D map.
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
            far: 160,
          }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          {/* Studio & Neon Lighting */}
          <ambientLight intensity={0.85} />
          <directionalLight position={[15, 25, 15]} intensity={1.3} />
          <pointLight position={[-12, 18, -12]} intensity={0.9} color="#22d3ee" />
          <pointLight position={[12, 15, 12]} intensity={0.6} color="#38bdf8" />

          {/* Interactive 3D Camera Controls */}
          <OrbitControls
            ref={controlsRef}
            maxPolarAngle={Math.PI / 2.05} // Ground clamp
            minDistance={5.5}
            maxDistance={58}
            enableDamping
            dampingFactor={0.06}
          />

          {/* Cinematic Fly-To Camera Controller */}
          <CinematicCameraController
            targetCoords={flyTargetCoords}
            projection={activeProjection}
            cameraPreset={cameraPreset}
            bearingAngle={bearingAngle}
            controlsRef={controlsRef}
            prefersReducedMotion={prefersReducedMotion}
          />

          {/* Real Geographic Map Ground Plane with Cartographic Geography */}
          <Geographic3DTerrain
            regionFocus={regionFocus}
            layers={layers}
            campsData={camps}
          />

          {/* Layer: 3D Camp Pillars (Karnataka View) */}
          {layers.camps &&
            regionFocus === 'karnataka' &&
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

          {/* Layer: Clustered 3D Pillars (All India View) */}
          {layers.camps &&
            regionFocus === 'india' &&
            clusters.map((cluster, i) => (
              <Camp3DClusterPillar
                key={`cluster-${i}`}
                cluster={cluster}
                projection={activeProjection}
                onExpandCluster={() => {
                  setRegionFocus('karnataka');
                  setFlyTargetCoords(cluster.center);
                  setCameraPreset('drone');
                }}
              />
            ))}

          {/* Layer: Verified Referral Hospital Beacons */}
          {layers.hospitals &&
            regionFocus === 'karnataka' &&
            VERIFIED_REFERRAL_HOSPITALS.map((hospital) => (
              <Hospital3DBeacon
                key={hospital.id}
                hospital={hospital}
                projection={activeProjection}
                prefersReducedMotion={prefersReducedMotion}
              />
            ))}
        </Canvas>
      </WebGLBoundary>

      {/* ------------------------------------------------------------- */}
      {/* 5. BOTTOM-RIGHT CONTROLS: Zoom, Rotate Bearing, My Location   */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-1.5">
        {/* Rotate Bearing Left / Right */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-700 shadow-xl">
          <button
            type="button"
            onClick={() => handleRotateBearing(-45)}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-cyan-400 text-xs font-mono"
            title="Rotate Bearing Counter-Clockwise (-45°)"
          >
            ⟲
          </button>
          <span className="text-[10px] font-mono text-slate-400 px-1">{bearingAngle}°</span>
          <button
            type="button"
            onClick={() => handleRotateBearing(45)}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-cyan-400 text-xs font-mono"
            title="Rotate Bearing Clockwise (+45°)"
          >
            ⟳
          </button>
        </div>

        {/* Zoom In & Out */}
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

        {/* My Current Location */}
        {onTriggerLocation && (
          <button
            type="button"
            onClick={onTriggerLocation}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 shadow-xl backdrop-blur-md transition"
            title="Center on My GPS Location"
          >
            <Crosshair className="w-4 h-4 text-cyan-400" />
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. BOTTOM-LEFT: Dynamic Multi-Layer Legend                    */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute bottom-6 left-16 sm:left-auto sm:right-28 z-20 max-w-xs">
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl p-3 text-xs text-white">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="font-extrabold text-[11px] uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> 3D Cartographic Legend
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
              {/* Camp Status Markers */}
              {layers.camps && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Camp Status</span>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
                      <span className="text-slate-300">Upcoming</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span className="text-slate-300">Ongoing</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                      <span className="text-slate-300">Fully Booked</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
                      <span className="text-slate-300">Cancelled</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Referral Facilities */}
              {layers.hospitals && (
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                  <div className="w-3 h-3 bg-sky-400 flex items-center justify-center rounded text-[9px] font-black text-slate-950">
                    +
                  </div>
                  <span className="text-slate-300 text-[10px]">Verified Referral Hospital</span>
                </div>
              )}

              {/* Heatmap & Scale note */}
              <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 space-y-0.5">
                <p>
                  <strong className="text-slate-200">Pillar Height:</strong> Capacity volume (1 unit ≈ 30 patients).
                </p>
                <p className="text-[9px] text-slate-500 leading-tight">
                  Coverage density reflects scheduled camp attendance only; it does not indicate absence of healthcare need.
                </p>
                <p className="text-[9px] text-slate-500">
                  Basemap © OpenStreetMap contributors, CartoDB.
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
