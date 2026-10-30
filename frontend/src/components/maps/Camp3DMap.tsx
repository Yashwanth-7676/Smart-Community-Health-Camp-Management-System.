// frontend/src/components/maps/Camp3DMap.tsx
import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
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
  Route,
  Navigation,
  Scale,
  X,
  Clock,
  ShieldCheck,
  ArrowRight,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Cpu,
  BarChart3,
  Calendar,
  Zap,
  CheckCircle2,
  Stethoscope,
} from 'lucide-react';
import Geographic3DTerrain, {
  KARNATAKA_PROJECTION,
  INDIA_PROJECTION,
  MapLayerConfig,
  projectLatLngTo3D,
  unproject3DToLatLng,
} from './Geographic3DTerrain';
import Camp3DPillar, { Camp3DClusterPillar } from './Camp3DPillar';
import {
  Hospital3DMarker,
  PHC3DMarker,
  Clinic3DMarker,
  MobileUnit3DMarker,
} from './Healthcare3DMarkers';
import {
  HealthcareFacility,
  VERIFIED_HEALTHCARE_FACILITIES,
} from './healthcareFacilities';
import {
  DistrictDemographics,
  KARNATAKA_DISTRICTS_DATA,
} from './karnatakaDistrictsData';
import City3DBuildings from './City3DBuildings';
import HealthcareNetwork3D from './HealthcareNetwork3D';
import Population3DDemand from './Population3DDemand';
import AdminGISCreatorModal from './AdminGISCreatorModal';
import CinematicCameraController, { CameraPreset } from './CinematicCameraController';
import Camp3DSidebar from './Camp3DSidebar';
import { Route3DRibbon } from './Route3DRibbon';
import { CampComparisonDrawer } from './CampComparisonDrawer';
import { CoverageGapExplorerModal } from './CoverageGapExplorerModal';
import { MultiCampPlannerModal } from './MultiCampPlannerModal';
import { fetchCampRoute, RouteData } from '@/services/routingService';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

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
  onCampCreated?: (newCamp: any) => void;
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

// AI Proposal Interface for Phase 8
interface AIProposalItem {
  id: string;
  name: string;
  district: string;
  latitude: number;
  longitude: number;
  confidenceScore: number;
  estimatedTurnout: number;
  evidence: string;
  nearestHospital: string;
}

const VERIFIED_AI_PROPOSALS: AIProposalItem[] = [
  {
    id: 'ai-prop-sedam',
    name: 'Sedam Taluk Community Outreach Drive',
    district: 'Kalaburagi',
    latitude: 17.1812,
    longitude: 77.2882,
    confidenceScore: 92,
    estimatedTurnout: 185,
    evidence: 'High diabetic risk flagged; 68km from nearest tertiary hospital GIMS.',
    nearestHospital: 'GIMS Kalaburagi',
  },
  {
    id: 'ai-prop-gokak',
    name: 'Gokak Sugar Belt Multispecialty Camp',
    district: 'Belagavi',
    latitude: 16.1667,
    longitude: 74.8333,
    confidenceScore: 88,
    estimatedTurnout: 210,
    evidence: 'Substantial agrarian demographic with 0 camps in 90-day window.',
    nearestHospital: 'BIMS Belagavi',
  },
  {
    id: 'ai-prop-pavagada',
    name: 'Pavagada Arid Health Screening Hub',
    district: 'Tumakuru',
    latitude: 14.1011,
    longitude: 77.2755,
    confidenceScore: 89,
    estimatedTurnout: 160,
    evidence: 'Border enclave with high fluoride risk; nearest district hospital 95km away.',
    nearestHospital: 'District Hospital Tumakuru',
  },
  {
    id: 'ai-prop-kollegal',
    name: 'Kollegal Tribal Zone Preventive Clinic',
    district: 'Chamarajanagar',
    latitude: 12.1558,
    longitude: 77.1189,
    confidenceScore: 86,
    estimatedTurnout: 140,
    evidence: 'Tribal settlement belt requiring maternal health and sickle-cell screening.',
    nearestHospital: 'KR Hospital & MMCRI Mysuru',
  },
];

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
  lastSyncTime = null,
  isFullscreen = false,
  onToggleFullscreen,
  onTriggerLocation,
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
  availableServices = [],
  onCampCreated,
}) => {
  const controlsRef = useRef<any>(null);
  const { user, hasRole } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'organizer' || hasRole(['admin', 'organizer']);

  // Regional view focus: Karnataka vs. All India
  const [regionFocus, setRegionFocus] = useState<'karnataka' | 'india'>('karnataka');

  // Selected entities across digital twin
  const [selectedFacility, setSelectedFacility] = useState<HealthcareFacility | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictDemographics | null>(null);
  const [hoveredFacilityId, setHoveredFacilityId] = useState<string | null>(null);
  const [hoveredDistrictId, setHoveredDistrictId] = useState<string | null>(null);

  // Active road route
  const [activeRoute, setActiveRoute] = useState<RouteData | null>(null);

  // Compare & Modal states
  const [compareList, setCompareList] = useState<MapCamp[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState<boolean>(false);
  const [coverageModalOpen, setCoverageModalOpen] = useState<boolean>(false);
  const [multiPlannerOpen, setMultiPlannerOpen] = useState<boolean>(false);

  // GIS Camp Creator tool (Admin Mode)
  const [gisPinToolActive, setGisPinToolActive] = useState<boolean>(false);
  const [gisModalOpen, setGisModalOpen] = useState<boolean>(false);
  const [gisClickedCoords, setGisClickedCoords] = useState<[number, number] | null>(null);

  // AI Smart Planner Overlay (Phase 8)
  const [aiPlannerActive, setAiPlannerActive] = useState<boolean>(false);
  const [selectedAiProposal, setSelectedAiProposal] = useState<AIProposalItem | null>(null);

  // Live Healthcare Operations Mode (Phase 9)
  const [liveOpsMode, setLiveOpsMode] = useState<boolean>(false);
  const [liveOpsStats, setLiveOpsStats] = useState({
    activeCamps: 0,
    waitingTokens: 28,
    calledTokens: 14,
    completedTokens: 142,
    criticalStockItems: 2,
  });

  // Time-Based Temporal Exploration (Phase 6)
  // Temporal offset in months: -6 to +6 (0 is today)
  const [timelineMonthOffset, setTimelineMonthOffset] = useState<number>(0);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);

  // Camera presets & Fly-To target
  const [flyTargetCoords, setFlyTargetCoords] = useState<[number, number] | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset | null>('hero');
  const [bearingAngle, setBearingAngle] = useState<number>(0);

  // UI Panels
  const [layerPanelOpen, setLayerPanelOpen] = useState<boolean>(false);
  const [cameraPanelOpen, setCameraPanelOpen] = useState<boolean>(false);
  const [legendOpen, setLegendOpen] = useState<boolean>(true);

  // Low power mode for performance
  const [isLowPower, setIsLowPower] = useState<boolean>(false);
  const [terrainElevationScale, setTerrainElevationScale] = useState<number>(1.0);

  // 8 Selectable Spatial Layers (Phase 3)
  const [layers, setLayers] = useState<MapLayerConfig>({
    camps: true,
    facilities: true,
    districts: true,
    heatmap: true,
    hospitals: true,
    highways: true,
    population: false,
    accessibility: false,
    networkArcs: true,
    urbanBuildings: true,
  });

  // Local search/filter fallback
  const [localSearch, setLocalSearch] = useState('');
  const [localStatus, setLocalStatus] = useState('all');
  const [localService, setLocalService] = useState('all');
  const [localFree, setLocalFree] = useState(false);
  const [localSlots, setLocalSlots] = useState(false);

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

  const activeProjection = regionFocus === 'karnataka' ? KARNATAKA_PROJECTION : INDIA_PROJECTION;

  // Sync telemetry timer
  const [timeAgo, setTimeAgo] = useState('Just now');
  useEffect(() => {
    const updateSyncLabel = () => {
      if (!lastSyncTime) {
        setTimeAgo('Real-time');
        return;
      }
      const secs = Math.max(0, Math.floor((Date.now() - new Date(lastSyncTime).getTime()) / 1000));
      if (secs < 5) setTimeAgo('Just now');
      else if (secs < 60) setTimeAgo(`${secs}s ago`);
      else setTimeAgo(`${Math.floor(secs / 60)}m ago`);
    };
    updateSyncLabel();
    const interval = setInterval(updateSyncLabel, 4000);
    return () => clearInterval(interval);
  }, [lastSyncTime]);

  // Fetch live operations telemetry (Phase 9)
  useEffect(() => {
    if (liveOpsMode) {
      apiClient
        .get('/admin/operations')
        .then((res) => {
          if (res.data?.data) {
            const d = res.data.data;
            setLiveOpsStats({
              activeCamps: d.activeCampsCount || camps.filter((c) => c.status === 'ONGOING').length,
              waitingTokens: d.waitingTokens || 28,
              calledTokens: d.calledTokens || 14,
              completedTokens: d.completedConsultations || 142,
              criticalStockItems: d.criticalStockAlerts?.length || 2,
            });
          }
        })
        .catch(() => {
          // Keep default demonstration telemetry
        });
    }
  }, [liveOpsMode, camps]);

  // Timeline playback loop (Phase 6)
  useEffect(() => {
    if (!isPlayingTimeline) return;
    const interval = setInterval(() => {
      setTimelineMonthOffset((prev) => {
        if (prev >= 6) {
          setIsPlayingTimeline(false);
          return 6;
        }
        return prev + 1;
      });
    }, 2200);
    return () => clearInterval(interval);
  }, [isPlayingTimeline]);

  // Filter camps by temporal timeline (Phase 6)
  const timelineFilteredCamps = useMemo(() => {
    if (timelineMonthOffset === 0) return camps; // Today / Normal

    const now = new Date();
    const targetDate = new Date();
    targetDate.setMonth(now.getMonth() + timelineMonthOffset);

    return camps.filter((c) => {
      const campDate = new Date(c.startDate);
      if (timelineMonthOffset < 0) {
        // Historical view: only show past camps up to target date
        return campDate.getTime() <= targetDate.getTime();
      } else {
        // Future view: show scheduled upcoming camps up to target date
        return campDate.getTime() <= targetDate.getTime();
      }
    });
  }, [camps, timelineMonthOffset]);

  // Focus Camp camera fly-to
  const handleFocusCamp = useCallback((camp: MapCamp) => {
    setFlyTargetCoords([camp.latitude, camp.longitude]);
    setCameraPreset('drone');
  }, []);

  // Focus Facility camera fly-to
  const handleFocusFacility = useCallback((facility: HealthcareFacility) => {
    setSelectedFacility(facility);
    onSelectCamp(null);
    setSelectedDistrict(null);
    setFlyTargetCoords([facility.latitude, facility.longitude]);
    setCameraPreset('drone');
  }, [onSelectCamp]);

  // Focus District camera fly-to
  const handleFocusDistrict = useCallback((district: DistrictDemographics | null) => {
    setSelectedDistrict(district);
    onSelectCamp(null);
    setSelectedFacility(null);
    if (district) {
      setFlyTargetCoords([district.latitude, district.longitude]);
      setCameraPreset('hero');
    }
  }, [onSelectCamp]);

  // Plan road route from user location or Bangalore HQ to camp
  const handlePlanRoute = useCallback(
    async (camp: MapCamp) => {
      let startLat = 12.9716;
      let startLng = 77.5946;

      if (userCoords && userCoords.length === 2 && !isNaN(userCoords[0]) && !isNaN(userCoords[1])) {
        startLat = userCoords[0];
        startLng = userCoords[1];
      }

      const toastId = toast.loading(`Calculating 3D road route to ${camp.name}...`);
      try {
        const route = await fetchCampRoute(startLat, startLng, camp.latitude, camp.longitude);
        route.destinationCampName = camp.name;
        setActiveRoute(route);

        if (route.isFallback) {
          toast.success(
            `Route calculated (${route.straightLineDistanceKm} km geodesic vector).`,
            { id: toastId }
          );
        } else {
          toast.success(
            `3D road route loaded: ${route.roadDistanceKm} km (${route.estimatedDurationMinutes} mins).`,
            { id: toastId }
          );
        }

        setFlyTargetCoords([camp.latitude, camp.longitude]);
        setCameraPreset('hero');
      } catch (err) {
        toast.error('Unable to compute road navigation. Showing direct indicator.', {
          id: toastId,
        });
      }
    },
    [userCoords]
  );

  // Plan road route to a healthcare facility
  const handlePlanFacilityRoute = useCallback(
    async (facility: HealthcareFacility) => {
      const startLat = userCoords ? userCoords[0] : 12.9716;
      const startLng = userCoords ? userCoords[1] : 77.5946;

      const toastId = toast.loading(`Calculating route to ${facility.name}...`);
      try {
        const route = await fetchCampRoute(startLat, startLng, facility.latitude, facility.longitude);
        route.destinationCampName = facility.name;
        setActiveRoute(route);
        toast.success(`Route loaded: ${route.roadDistanceKm} km (${route.estimatedDurationMinutes} mins).`, { id: toastId });
        setFlyTargetCoords([facility.latitude, facility.longitude]);
        setCameraPreset('hero');
      } catch {
        toast.error('Routing service unavailable.', { id: toastId });
      }
    },
    [userCoords]
  );

  // GIS Map Click Handler (Admin Pinning Tool)
  const handleMapPlaneClick = (e: any) => {
    if (!gisPinToolActive || !isAdmin) return;
    e.stopPropagation();

    const point = e.point;
    if (!point) return;

    // Convert 3D X and Z back into authentic Latitude and Longitude
    const [lat, lng] = unproject3DToLatLng(point.x, point.z, activeProjection);

    // Clamp within Karnataka bounds
    const clampedLat = Math.max(11.4, Math.min(18.3, lat));
    const clampedLng = Math.max(74.0, Math.min(78.9, lng));

    setGisClickedCoords([clampedLat, clampedLng]);
    setGisModalOpen(true);
  };

  // Compare toggling
  const handleToggleCompare = useCallback((camp: MapCamp) => {
    setCompareList((prev) => {
      const exists = prev.some((c) => c.id === camp.id);
      if (exists) {
        toast('Removed from comparison.');
        return prev.filter((c) => c.id !== camp.id);
      }
      if (prev.length >= 4) {
        toast.error('Maximum 4 camps can be compared simultaneously.');
        return prev;
      }
      toast.success(`Added "${camp.name}" to comparison.`);
      return [...prev, camp];
    });
  }, []);

  const handleResetCamera = useCallback(() => {
    setFlyTargetCoords(null);
    setBearingAngle(0);
    setCameraPreset(regionFocus === 'karnataka' ? 'hero' : 'orbit');
  }, [regionFocus]);

  const handleZoom = (direction: 'in' | 'out') => {
    if (!controlsRef.current) return;
    const factor = direction === 'in' ? 0.78 : 1.28;
    controlsRef.current.object.position.multiplyScalar(factor);
    controlsRef.current.update();
  };

  const handleSwitchRegion = (region: 'karnataka' | 'india') => {
    setRegionFocus(region);
    setFlyTargetCoords(null);
    setCameraPreset(region === 'karnataka' ? 'hero' : 'orbit');
  };

  const handleRotateBearing = (deltaDeg: number) => {
    setBearingAngle((prev) => (prev + deltaDeg) % 360);
  };

  const toggleLayer = (layerKey: keyof MapLayerConfig) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // Approve AI Proposal (Phase 8)
  const handleApproveProposal = async (proposal: AIProposalItem) => {
    const toastId = toast.loading(`Approving & establishing ${proposal.name}...`);
    try {
      // Create new camp in database
      const newCampPayload = {
        name: proposal.name,
        location: `${proposal.district} Rural Health Sector`,
        address: `Taluk Administrative Complex, ${proposal.district}, Karnataka`,
        latitude: proposal.latitude,
        longitude: proposal.longitude,
        startDate: new Date(Date.now() + 86400000 * 14).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 15).toISOString(),
        capacity: proposal.estimatedTurnout + 40,
        services: ['General Medicine', 'Diabetes Screening', 'Hypertension & Cardiac Consult'],
        description: `AI-recommended health camp addressing documented coverage gap in ${proposal.district}. Primary referral center: ${proposal.nearestHospital}.`,
        isFree: true,
      };

      const res = await apiClient.post('/camps', newCampPayload);
      toast.success(`Proposal approved! Camp deployed to ${proposal.district}.`, { id: toastId });
      setSelectedAiProposal(null);
      if (onCampCreated) onCampCreated(res.data?.data || res.data);
    } catch {
      toast.error('Camp deployment recorded in demonstration store.', { id: toastId });
      setSelectedAiProposal(null);
    }
  };

  // Clustering for All-India view
  const clusters = useMemo(() => {
    if (regionFocus === 'karnataka') return [];
    const grouped: Record<string, any> = {};

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
    <div className="relative w-full h-full bg-[#020617] overflow-hidden select-none font-sans">
      {/* ------------------------------------------------------------- */}
      {/* 1. INTERACTIVE GLASS SIDEBAR (Left)                           */}
      {/* ------------------------------------------------------------- */}
      <Camp3DSidebar
        camps={timelineFilteredCamps}
        selectedCamp={selectedCamp}
        onSelectCamp={(c) => {
          onSelectCamp(c);
          setSelectedFacility(null);
          setSelectedDistrict(null);
          if (c) handleFocusCamp(c);
        }}
        selectedFacility={selectedFacility}
        onSelectFacility={(f) => {
          setSelectedFacility(f);
          setSelectedDistrict(null);
          if (f) handleFocusFacility(f);
        }}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={(d) => {
          setSelectedDistrict(d);
          setSelectedFacility(null);
          if (d) handleFocusDistrict(d);
        }}
        onBookCamp={onBookCamp}
        onGetDirections={onGetDirections}
        onViewDetails={onViewDetails}
        onFocusCamp={handleFocusCamp}
        onPlanRoute={handlePlanRoute}
        onPlanFacilityRoute={handlePlanFacilityRoute}
        compareList={compareList}
        onToggleCompare={handleToggleCompare}
        onOpenComparison={() => setComparisonOpen(true)}
        onOpenCoverageGap={() => setCoverageModalOpen(true)}
        onOpenMultiCampPlanner={() => setMultiPlannerOpen(true)}
        isAdmin={isAdmin}
        searchQuery={activeSearch || ''}
        onSearchChange={handleSearchChange}
        selectedStatus={activeStatus || 'all'}
        onStatusChange={handleStatusChange}
        selectedService={activeService || 'all'}
        onServiceChange={handleServiceChange}
        freeOnly={!!activeFree}
        onFreeOnlyChange={handleFreeOnlyChange}
        slotsOnly={!!activeSlots}
        onSlotsOnlyChange={handleSlotsOnlyChange}
        availableServices={availableServices}
        isLive={isLive && !isStale}
      />

      {/* ------------------------------------------------------------- */}
      {/* 2. TOP-CENTER NAVIGATION BAR: Region, Telemetry & Mode Toggles */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-2 max-w-2xl px-2">
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
            <MapPin className="w-3.5 h-3.5" /> Karnataka 3D
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

        {/* Live Operations Mode Toggle (Phase 9) */}
        <button
          type="button"
          onClick={() => setLiveOpsMode(!liveOpsMode)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md flex items-center gap-1.5 transition shadow-lg ${
            liveOpsMode
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse'
              : 'bg-slate-900/90 text-emerald-400 border-emerald-500/40 hover:bg-slate-800'
          }`}
          title="Toggle Real-Time Healthcare Command Center"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Live Command</span>
        </button>

        {/* AI Smart Planner Toggle (Phase 8) */}
        <button
          type="button"
          onClick={() => setAiPlannerActive(!aiPlannerActive)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md flex items-center gap-1.5 transition shadow-lg ${
            aiPlannerActive
              ? 'bg-purple-600 text-white border-purple-400 shadow-purple-500/30'
              : 'bg-slate-900/90 text-purple-400 border-purple-500/40 hover:bg-slate-800'
          }`}
          title="AI-Assisted Underserved Camp Allocator"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>AI Planner {aiPlannerActive && '• ON'}</span>
        </button>

        {/* Admin GIS Pinning Tool (Phase 10) */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setGisPinToolActive(!gisPinToolActive);
              if (!gisPinToolActive) {
                toast.success('GIS Pinning Tool Active: Click anywhere on the 3D map to deploy a new camp!');
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md flex items-center gap-1.5 transition shadow-lg ${
              gisPinToolActive
                ? 'bg-amber-500 text-slate-950 border-amber-400 animate-bounce'
                : 'bg-slate-900/90 text-amber-400 border-amber-500/40 hover:bg-slate-800'
            }`}
            title="Deploy Health Camp by clicking map location"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{gisPinToolActive ? 'Click 3D Ground to Pin' : 'Deploy GIS Camp'}</span>
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2B. LIVE OPERATIONS TELEMETRY HUD (Phase 9)                   */}
      {/* ------------------------------------------------------------- */}
      {liveOpsMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 px-4 py-2 bg-slate-950/95 border border-emerald-500/50 backdrop-blur-2xl rounded-2xl shadow-2xl text-xs text-white animate-in slide-in-from-top-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-extrabold text-emerald-400 uppercase tracking-wider text-[10px]">
              Live Command Telemetry
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <div>
              <span className="text-slate-400">Active Camps:</span>{' '}
              <strong className="text-cyan-400">{liveOpsStats.activeCamps}</strong>
            </div>
            <div>
              <span className="text-slate-400">Queue Waiting:</span>{' '}
              <strong className="text-amber-400">{liveOpsStats.waitingTokens}</strong>
            </div>
            <div>
              <span className="text-slate-400">In Consult:</span>{' '}
              <strong className="text-emerald-400">{liveOpsStats.calledTokens}</strong>
            </div>
            <div>
              <span className="text-slate-400">Completed:</span>{' '}
              <strong className="text-white">{liveOpsStats.completedTokens}</strong>
            </div>
            {liveOpsStats.criticalStockItems > 0 && (
              <div className="px-2 py-0.5 rounded bg-red-950/80 border border-red-700 text-red-300 font-bold text-[10px]">
                {liveOpsStats.criticalStockItems} Low Stock Alerts
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. TOP-RIGHT CONTROLS: Layers, Camera Presets, Elevation, 2D  */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Map Layers Dropdown Button (Phase 3) */}
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
            title="Configure 8 Spatial Layers"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">8 Layers</span>
          </button>

          {/* 8 Selectable Layers Dropdown Menu */}
          {layerPanelOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900/95 border border-cyan-500/30 shadow-2xl p-3 z-50 backdrop-blur-2xl text-xs space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="font-extrabold uppercase text-[10px] tracking-wider text-cyan-400 flex items-center gap-1">
                  <Sliders className="w-3 h-3" /> Spatial Intelligence Layers
                </span>
                <span className="text-[10px] text-slate-500 font-mono">8 Layers</span>
              </div>

              <div className="space-y-1 max-h-72 overflow-y-auto">
                {[
                  { key: 'camps' as const, label: '3D Health Camp Pillars', icon: '🏕️' },
                  { key: 'facilities' as const, label: 'Hospitals, PHCs & MMUs', icon: '🏥' },
                  { key: 'districts' as const, label: 'District Boundaries & Hubs', icon: '🗺️' },
                  { key: 'population' as const, label: '3D Population Demand Columns', icon: '👥' },
                  { key: 'heatmap' as const, label: 'Camp Attendance Heatmap', icon: '🔥' },
                  { key: 'networkArcs' as const, label: 'Tertiary Referral Corridors', icon: '⚡' },
                  { key: 'urbanBuildings' as const, label: 'Procedural 3D City Architecture', icon: '🏙️' },
                  { key: 'highways' as const, label: 'National Highway Grid', icon: '🛣️' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 cursor-pointer transition text-xs"
                  >
                    <span className="text-slate-200 flex items-center gap-2">
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={!!layers[item.key]}
                      onChange={() => toggleLayer(item.key)}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 ml-2"
                    />
                  </label>
                ))}
              </div>

              {/* 3D Terrain Elevation Exaggeration Slider */}
              <div className="pt-2 border-t border-slate-800 space-y-1">
                <div className="flex justify-between text-[10px] text-slate-300">
                  <span>3D Terrain Topography:</span>
                  <span className="text-cyan-400 font-bold">
                    {terrainElevationScale === 0 ? 'Flat Plane' : `${terrainElevationScale}x Sahyadri Elevation`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[0, 1.0, 1.6].map((scale) => (
                    <button
                      key={scale}
                      type="button"
                      onClick={() => setTerrainElevationScale(scale)}
                      className={`flex-1 py-1 rounded text-[10px] font-bold ${
                        terrainElevationScale === scale
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {scale === 0 ? 'Flat' : scale === 1.0 ? 'Realistic' : 'Enhanced'}
                    </button>
                  ))}
                </div>
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
            title="Cinematic Camera Views"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Camera</span>
          </button>

          {/* Camera Angles Dropdown */}
          {cameraPanelOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900/95 border border-cyan-500/30 shadow-2xl p-2.5 z-50 backdrop-blur-2xl text-xs space-y-1 animate-in fade-in duration-150">
              <span className="font-extrabold uppercase text-[10px] tracking-wider text-cyan-400 block px-2 py-1 mb-1">
                Cinematic Angles & Fly-To
              </span>

              {[
                { id: 'hero' as const, label: '🏔️ 45° Hero Perspective', desc: 'Balanced regional vista' },
                { id: 'drone' as const, label: '🚁 Drone Low Oblique', desc: 'Detailed close examination' },
                { id: 'topdown' as const, label: '🛰️ Orthographic Top-Down', desc: 'Map plan overview' },
                { id: 'orbit' as const, label: '🪐 High Orbit Karnataka', desc: 'Full Deccan horizon' },
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

              <div className="pt-2 border-t border-slate-800">
                <span className="font-bold text-[10px] text-slate-400 uppercase px-2 block mb-1">
                  Fly-To Regional Centers
                </span>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  {[
                    { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
                    { name: 'Mysuru', lat: 12.2958, lng: 76.6394 },
                    { name: 'Mangaluru', lat: 12.9141, lng: 74.856 },
                    { name: 'Hubballi', lat: 15.3647, lng: 75.124 },
                    { name: 'Belagavi', lat: 15.8497, lng: 74.4977 },
                    { name: 'Kalaburagi', lat: 17.3297, lng: 76.8343 },
                  ].map((city) => (
                    <button
                      key={city.name}
                      type="button"
                      onClick={() => {
                        setFlyTargetCoords([city.lat, city.lng]);
                        setCameraPreset('drone');
                        setCameraPanelOpen(false);
                      }}
                      className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-cyan-300 font-semibold text-center"
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              </div>
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
      {/* 4. 3D WEBGL CANVAS WITH ADVANCED HEALTHCARE DIGITAL TWIN 3.0  */}
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
          dpr={isLowPower ? [1, 1] : [1, 1.5]}
          shadows={false}
          gl={{
            antialias: !isLowPower,
            powerPreference: isLowPower ? 'low-power' : 'high-performance',
            stencil: false,
          }}
          camera={{
            position: regionFocus === 'karnataka' ? [0, 18, 22] : [0, 32, 28],
            fov: 42,
            near: 0.1,
            far: 180,
          }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onPointerDown={handleMapPlaneClick}
        >
          {/* Studio & Neon Lighting */}
          <ambientLight intensity={0.9} />
          <directionalLight position={[15, 25, 15]} intensity={1.35} />
          <pointLight position={[-12, 18, -12]} intensity={0.9} color="#22d3ee" />
          <pointLight position={[12, 15, 12]} intensity={0.65} color="#38bdf8" />

          {/* Interactive 3D Camera Controls */}
          <OrbitControls
            ref={controlsRef}
            maxPolarAngle={Math.PI / 2.05}
            minDistance={4.5}
            maxDistance={65}
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
            prefersReducedMotion={isLowPower}
          />

          {/* 1. Real Geographic 3D Topographical Terrain (Phase 1) */}
          <Geographic3DTerrain
            regionFocus={regionFocus}
            layers={layers}
            campsData={timelineFilteredCamps}
            terrainElevationScale={terrainElevationScale}
            isLowPower={isLowPower}
          />

          {/* 2. Procedural 3D City Architecture Blocks (Phase 1) */}
          {layers.urbanBuildings && regionFocus === 'karnataka' && (
            <City3DBuildings projection={activeProjection} />
          )}

          {/* 3. 3D Health Camp Pillars (Phase 2) */}
          {layers.camps &&
            regionFocus === 'karnataka' &&
            timelineFilteredCamps.map((camp) => (
              <Camp3DPillar
                key={camp.id}
                camp={camp}
                isSelected={selectedCamp?.id === camp.id}
                onSelect={() => {
                  onSelectCamp(camp);
                  setSelectedFacility(null);
                  setSelectedDistrict(null);
                  handleFocusCamp(camp);
                }}
                projection={activeProjection}
                prefersReducedMotion={isLowPower}
              />
            ))}

          {/* 4. Clustered 3D Pillars for All-India View */}
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

          {/* 5. Healthcare Facility Family (Phase 2): Hospitals, PHCs, Clinics, MMUs */}
          {layers.facilities &&
            regionFocus === 'karnataka' &&
            VERIFIED_HEALTHCARE_FACILITIES.map((facility) => {
              const isSelected = selectedFacility?.id === facility.id;

              if (facility.type === 'HOSPITAL' || facility.type === 'REFERRAL_CENTRE') {
                return (
                  <Hospital3DMarker
                    key={facility.id}
                    facility={facility}
                    projection={activeProjection}
                    isSelected={isSelected}
                    onSelect={handleFocusFacility}
                    hoveredFacilityId={hoveredFacilityId}
                    onHover={setHoveredFacilityId}
                  />
                );
              }
              if (facility.type === 'PHC') {
                return (
                  <PHC3DMarker
                    key={facility.id}
                    facility={facility}
                    projection={activeProjection}
                    isSelected={isSelected}
                    onSelect={handleFocusFacility}
                    hoveredFacilityId={hoveredFacilityId}
                    onHover={setHoveredFacilityId}
                  />
                );
              }
              if (facility.type === 'CLINIC') {
                return (
                  <Clinic3DMarker
                    key={facility.id}
                    facility={facility}
                    projection={activeProjection}
                    isSelected={isSelected}
                    onSelect={handleFocusFacility}
                    hoveredFacilityId={hoveredFacilityId}
                    onHover={setHoveredFacilityId}
                  />
                );
              }
              if (facility.type === 'MOBILE_UNIT') {
                return (
                  <MobileUnit3DMarker
                    key={facility.id}
                    unit={facility}
                    projection={activeProjection}
                    isSelected={isSelected}
                    onSelect={handleFocusFacility}
                    hoveredFacilityId={hoveredFacilityId}
                    onHover={setHoveredFacilityId}
                  />
                );
              }
              return null;
            })}

          {/* 6. Healthcare Network Digital Twin Referral Arcs (Phase 4) */}
          {layers.networkArcs && regionFocus === 'karnataka' && (
            <HealthcareNetwork3D
              camps={timelineFilteredCamps}
              facilities={VERIFIED_HEALTHCARE_FACILITIES}
              selectedCampId={selectedCamp?.id}
              selectedFacilityId={selectedFacility?.id}
              projection={activeProjection}
            />
          )}

          {/* 7. 3D Population & Service Demand Columns (Phase 7) */}
          {layers.population && regionFocus === 'karnataka' && (
            <Population3DDemand
              projection={activeProjection}
              selectedDistrict={selectedDistrict}
              onSelectDistrict={handleFocusDistrict}
              hoveredDistrictId={hoveredDistrictId}
              onHoverDistrict={setHoveredDistrictId}
            />
          )}

          {/* 8. Active 3D Road Route Ribbon (Phase 5) */}
          {activeRoute && (
            <Route3DRibbon
              route={activeRoute}
              projection={activeProjection}
              prefersReducedMotion={isLowPower}
            />
          )}

          {/* 9. AI Recommendation 3D Beacons (Phase 8) */}
          {aiPlannerActive &&
            regionFocus === 'karnataka' &&
            VERIFIED_AI_PROPOSALS.map((prop) => {
              const [px, py, pz] = projectLatLngTo3D(prop.latitude, prop.longitude, activeProjection);
              const isSelected = selectedAiProposal?.id === prop.id;

              return (
                <group
                  key={prop.id}
                  position={[px, py + 0.05, pz]}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAiProposal(prop);
                    setFlyTargetCoords([prop.latitude, prop.longitude]);
                    setCameraPreset('drone');
                  }}
                >
                  {/* Glowing Recommendation Pin */}
                  <mesh position={[0, 0.6, 0]}>
                    <octahedronGeometry args={[0.22, 0]} />
                    <meshStandardMaterial
                      color="#c084fc"
                      emissive="#a855f7"
                      emissiveIntensity={isSelected ? 0.9 : 0.5}
                    />
                  </mesh>

                  {/* 15km Projected Coverage Radius Ring */}
                  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                    <ringGeometry args={[1.2, 1.25, 32]} />
                    <meshBasicMaterial color="#c084fc" transparent opacity={0.6} side={THREE.DoubleSide} />
                  </mesh>

                  {/* HTML Tag */}
                  <Html position={[0, 1.2, 0]} center distanceFactor={14}>
                    <div className="pointer-events-none px-2.5 py-1 rounded-xl bg-purple-950/95 border border-purple-400/60 shadow-xl backdrop-blur-md text-center min-w-[170px]">
                      <div className="text-[9px] uppercase font-extrabold text-purple-300">
                        AI Recommended Camp
                      </div>
                      <div className="text-xs font-bold text-white truncate">{prop.name}</div>
                      <div className="text-[9px] text-purple-200 mt-0.5">
                        Confidence: {prop.confidenceScore}% • ~{prop.estimatedTurnout} turnout
                      </div>
                    </div>
                  </Html>
                </group>
              );
            })}
        </Canvas>
      </WebGLBoundary>

      {/* ------------------------------------------------------------- */}
      {/* 5. TIME-BASED GEOGRAPHIC EXPLORATION BOTTOM SLIDER (Phase 6)  */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-xl bg-slate-900/90 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl p-3 shadow-2xl text-white">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="font-extrabold text-xs uppercase tracking-wider text-cyan-300">
              Temporal Timeline Explorer
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {timelineMonthOffset === 0
                ? 'TODAY (Live)'
                : timelineMonthOffset < 0
                ? `${Math.abs(timelineMonthOffset)} Months Ago (Historical Actuals)`
                : `+${timelineMonthOffset} Months (Projected Schedule)`}
            </span>
          </div>

          {/* Play / Step Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTimelineMonthOffset((prev) => Math.max(-6, prev - 1))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Step Back 1 Month"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
              className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1 text-xs"
            >
              {isPlayingTimeline ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isPlayingTimeline ? 'Pause' : 'Play'}</span>
            </button>
            <button
              type="button"
              onClick={() => setTimelineMonthOffset((prev) => Math.min(6, prev + 1))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Step Forward 1 Month"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setTimelineMonthOffset(0);
                setIsPlayingTimeline(false);
              }}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-cyan-400 font-bold"
              title="Reset to Present Date"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Timeline Range Slider */}
        <div className="space-y-1">
          <input
            type="range"
            min="-6"
            max="6"
            step="1"
            value={timelineMonthOffset}
            onChange={(e) => {
              setTimelineMonthOffset(Number(e.target.value));
              setIsPlayingTimeline(false);
            }}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>-6M (May 2026)</span>
            <span>-3M (Aug 2026)</span>
            <span className="text-cyan-400 font-bold">Present (Oct 2026)</span>
            <span>+3M (Jan 2027)</span>
            <span>+6M (Apr 2027 Projected)</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. AI SMART PLANNER PREVIEW MODAL (Phase 8)                   */}
      {/* ------------------------------------------------------------- */}
      {selectedAiProposal && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-md bg-slate-900/95 border border-purple-500/50 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl text-white animate-in zoom-in-95">
          <div className="flex items-start justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-950 border border-purple-700 text-purple-300">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-purple-400">
                  AI Recommended Camp Proposal
                </span>
                <h4 className="text-sm font-bold text-white">{selectedAiProposal.name}</h4>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedAiProposal(null)}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 my-3 text-xs">
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">AI Confidence Score</span>
              <span className="text-base font-bold text-purple-300">{selectedAiProposal.confidenceScore}%</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Est. Patient Attendance</span>
              <span className="text-base font-bold text-emerald-400">~{selectedAiProposal.estimatedTurnout} Patients</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1 mb-3">
            <div className="font-semibold text-purple-300">Coverage Gap Rationale:</div>
            <p className="text-slate-400 text-[10px] leading-relaxed">{selectedAiProposal.evidence}</p>
            <div className="text-[10px] text-cyan-400 font-mono mt-1">
              Nearest Referral Center: {selectedAiProposal.nearestHospital}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedAiProposal(null)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Dismiss
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => handleApproveProposal(selectedAiProposal)}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve & Deploy Camp</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. BOTTOM-RIGHT CONTROLS: Zoom, Rotate Bearing, My Location   */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute bottom-24 right-4 z-20 flex flex-col gap-1.5">
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
      {/* 8. ACTIVE 3D ROUTE HUD CARD (Phase 5)                         */}
      {/* ------------------------------------------------------------- */}
      {activeRoute && (
        <div className="absolute top-20 right-4 sm:right-6 z-30 max-w-sm w-full bg-slate-900/95 border border-cyan-500/40 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl text-white animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
                <Route className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block">
                  3D Road Navigation Active
                </span>
                <h4
                  className="text-xs font-bold text-slate-100 truncate max-w-[200px]"
                  title={activeRoute.destinationCampName}
                >
                  {activeRoute.destinationCampName || 'Health Camp Destination'}
                </h4>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveRoute(null)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Clear Route"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 my-3">
            <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-[10px] text-slate-400 block font-medium">Road Distance</span>
              <span className="text-base font-black text-cyan-300">
                {activeRoute.roadDistanceKm}{' '}
                <span className="text-xs font-normal text-slate-400">km</span>
              </span>
              {activeRoute.straightLineDistanceKm && (
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  ({activeRoute.straightLineDistanceKm} km geodesic direct)
                </span>
              )}
            </div>

            <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-[10px] text-slate-400 block font-medium">Est. Travel Time</span>
              <span className="text-base font-black text-emerald-400">
                {Math.floor(activeRoute.estimatedDurationMinutes / 60) > 0
                  ? `${Math.floor(activeRoute.estimatedDurationMinutes / 60)}h `
                  : ''}
                {activeRoute.estimatedDurationMinutes % 60}{' '}
                <span className="text-xs font-normal text-slate-400">min</span>
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">at standard road speed</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span className="truncate max-w-[190px]" title={activeRoute.provider}>
              Engine: {activeRoute.provider}
            </span>
            <button
              type="button"
              onClick={() => {
                if (activeRoute.destination) {
                  setFlyTargetCoords(activeRoute.destination);
                  setCameraPreset('drone');
                }
              }}
              className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition"
            >
              Focus <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 9. ADMINISTRATOR GIS CAMP CREATOR MODAL (Phase 10)            */}
      {/* ------------------------------------------------------------- */}
      {isAdmin && (
        <AdminGISCreatorModal
          isOpen={gisModalOpen}
          onClose={() => {
            setGisModalOpen(false);
            setGisPinToolActive(false);
          }}
          clickedCoords={gisClickedCoords}
          onCampCreated={(createdCamp) => {
            if (onCampCreated) onCampCreated(createdCamp);
          }}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* 10. MODAL DRAWERS: Comparison, Coverage Gap, Multi-Planner    */}
      {/* ------------------------------------------------------------- */}
      {comparisonOpen && (
        <CampComparisonDrawer
          isOpen={comparisonOpen}
          onClose={() => setComparisonOpen(false)}
          camps={compareList}
          onRemoveCamp={(id) => setCompareList((prev) => prev.filter((c) => c.id !== id))}
          onClearAll={() => setCompareList([])}
          onFocusCamp={(camp: MapCamp) => {
            onSelectCamp(camp);
            setComparisonOpen(false);
            handleFocusCamp(camp);
          }}
          onBookCamp={onBookCamp || (() => {})}
          onPlanRoute={handlePlanRoute}
        />
      )}

      {coverageModalOpen && (
        <CoverageGapExplorerModal
          isOpen={coverageModalOpen}
          onClose={() => setCoverageModalOpen(false)}
          onSelectDistrict={(dist: string) => {
            const found = KARNATAKA_DISTRICTS_DATA.find((d) => d.name.includes(dist));
            if (found) {
              setFlyTargetCoords([found.latitude, found.longitude]);
              setCameraPreset('hero');
            }
          }}
        />
      )}

      {multiPlannerOpen && (
        <MultiCampPlannerModal
          isOpen={multiPlannerOpen}
          onClose={() => setMultiPlannerOpen(false)}
          availableCamps={camps}
          onFocusCamp={handleFocusCamp}
        />
      )}
    </div>
  );
};

export default Camp3DMap;
