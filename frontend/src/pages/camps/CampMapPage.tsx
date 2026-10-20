// src/pages/camps/CampMapPage.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, ZoomControl, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  Users,
  Navigation,
  Compass,
  Filter,
  Maximize2,
  Minimize2,
  List,
  Map as MapIcon,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  X,
  Sparkles,
  ArrowUpDown,
  Stethoscope,
  Info,
  Layers,
  LocateFixed,
  Flame,
  Radio,
  BarChart3,
  RotateCcw,
  Check,
  Building2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import apiClient from '@/api/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

// -------------------------------------------------------------
// Interfaces
// -------------------------------------------------------------
export interface MapCamp {
  id: string;
  name: string;
  location: string;
  address: string;
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  configuredStatus?: string;
  capacity: number;
  registered: number;
  availableSlots: number;
  isFullyBooked: boolean;
  isFree: boolean;
  feeLabel: string;
  services: string[];
  description: string;
  operationalHours?: string;
  coordinatesValid?: boolean;
  straightLineDistance?: number | null;
  distanceLabel?: string | null;
  distance?: number | null;
}

export interface RegionalAnalyticsData {
  regions: Array<{
    region: string;
    campsCount: number;
    totalCapacity: number;
    totalRegistered: number;
    estimatedAttendance: number;
    occupancyRate: number;
    coverageStatus: 'Well-Covered' | 'Moderate' | 'Underserved';
    serviceCounts: Record<string, number>;
    statusCounts: { upcoming: number; ongoing: number; completed: number; cancelled: number };
    camps: Array<{ id: string; name: string; location: string; status: string; registered: number; capacity: number }>;
  }>;
  summary: {
    totalCamps: number;
    totalCapacity: number;
    totalRegistered: number;
    averageOccupancy: number;
    regionsCovered: number;
    underservedCount: number;
  };
  disclaimer: string;
  calculationMethod: string;
}

// -------------------------------------------------------------
// Haversine Distance Helper (Straight-Line Distance in KM)
// -------------------------------------------------------------
function calculateStraightLineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// -------------------------------------------------------------
// Custom Leaflet Icons
// -------------------------------------------------------------
function createCampMarkerIcon(status: string, isFullyBooked: boolean, isSelected: boolean, prefersReducedMotion: boolean) {
  let color = '#06b6d4'; // Cyan - UPCOMING
  let ringColor = 'rgba(6, 182, 212, 0.4)';
  let iconEmoji = '🏥';

  if (status === 'ONGOING') {
    color = '#10b981'; // Emerald
    ringColor = 'rgba(16, 185, 129, 0.4)';
  } else if (status === 'CANCELLED') {
    color = '#ef4444'; // Red
    ringColor = 'rgba(239, 68, 68, 0.3)';
    iconEmoji = '🚫';
  } else if (isFullyBooked) {
    color = '#f59e0b'; // Amber
    ringColor = 'rgba(245, 158, 11, 0.4)';
  }

  const pulseAnimation =
    (status === 'ONGOING' || isSelected) && !prefersReducedMotion
      ? `<div style="position:absolute; width:100%; height:100%; border-radius:50%; background:${color}; opacity:0.6; animation:pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>`
      : '';

  const scale = isSelected ? 'scale(1.25)' : 'scale(1.0)';
  const border = isSelected ? '3px solid #ffffff' : '2px solid #ffffff';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position:relative; display:flex; align-items:center; justify-content:center; width:38px; height:38px; transform:${scale}; transition:transform 0.2s ease;">
        ${pulseAnimation}
        <div style="position:relative; width:30px; height:30px; border-radius:50%; background:${color}; border:${border}; box-shadow:0 6px 14px ${ringColor}; display:flex; align-items:center; justify-content:center; font-size:14px;">
          ${iconEmoji}
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -22],
  });
}

function createClusterMarkerIcon(count: number, totalAttendance: number) {
  let bgColor = 'bg-cyan-600';
  let size = 'w-10 h-10';
  if (count >= 5) {
    bgColor = 'bg-emerald-600';
    size = 'w-12 h-12';
  }
  if (count >= 8) {
    bgColor = 'bg-blue-600';
    size = 'w-14 h-14';
  }

  return L.divIcon({
    className: 'custom-cluster-marker',
    html: `
      <div style="position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; width:44px; height:44px;">
        <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:#0891b2; opacity:0.3; animation:ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position:relative; width:38px; height:38px; border-radius:50%; background:#0e7490; border:2.5px solid #ffffff; box-shadow:0 4px 12px rgba(8,145,178,0.5); display:flex; flex-direction:column; align-items:center; justify-content:center; color:#ffffff; font-weight:bold; font-size:12px; line-height:1;">
          <span>${count}</span>
          <span style="font-size:8px; opacity:0.9;">camps</span>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

const originLocationIcon = L.divIcon({
  className: 'origin-location-marker',
  html: `
    <div style="position:relative; display:flex; align-items:center; justify-content:center; width:32px; height:32px;">
      <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:#3b82f6; opacity:0.4; animation:ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position:relative; width:18px; height:18px; border-radius:50%; background:#2563eb; border:3px solid #ffffff; box-shadow:0 3px 10px rgba(37,99,235,0.5);"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
});

// -------------------------------------------------------------
// Leaflet Helpers (Map FlyTo & Click listener)
// -------------------------------------------------------------
function MapUpdater({
  targetPos,
  targetZoom,
}: {
  targetPos: [number, number] | null;
  targetZoom?: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (targetPos) {
      map.flyTo(targetPos, targetZoom || 14, { duration: 1.2 });
    }
  }, [targetPos, targetZoom, map]);
  return null;
}

function MapClickHandler({
  onMapClick,
  enabled,
}: {
  onMapClick: (lat: number, lng: number) => void;
  enabled: boolean;
}) {
  useMapEvents({
    click(e) {
      if (enabled) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// -------------------------------------------------------------
// Main Component: CampMapPage
// -------------------------------------------------------------
export const CampMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Motion preference
  const prefersReducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // Map Data State
  const [camps, setCamps] = useState<MapCamp[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [liveSyncEnabled, setLiveSyncEnabled] = useState<boolean>(true);

  // Visualization Mode: 'markers' | 'clusters' | 'heatmap'
  const [visualizationMode, setVisualizationMode] = useState<'markers' | 'clusters' | 'heatmap'>('markers');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState<string>(searchQuery);
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get('status') || 'all');
  const [selectedService, setSelectedService] = useState<string>(searchParams.get('service') || 'all');
  const [freeOnly, setFreeOnly] = useState<boolean>(searchParams.get('free') === 'true');
  const [slotsOnly, setSlotsOnly] = useState<boolean>(searchParams.get('slots') === 'true');
  const [dateFrom, setDateFrom] = useState<string>(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState<string>(searchParams.get('dateTo') || '');
  const [radiusKm, setRadiusKm] = useState<string>(searchParams.get('radius') || 'all');
  const [sortBy, setSortBy] = useState<'nearest' | 'earliest' | 'slots'>('earliest');

  // Origin Point & Geolocation State
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
  const [originType, setOriginType] = useState<'gps' | 'manual' | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [manualPinActive, setManualPinActive] = useState<boolean>(false);

  // View & Navigation State
  const [selectedCamp, setSelectedCamp] = useState<MapCamp | null>(null);
  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null);
  const [flyToZoom, setFlyToZoom] = useState<number>(14);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showRegionalModal, setShowRegionalModal] = useState<boolean>(false);
  const [regionalData, setRegionalData] = useState<RegionalAnalyticsData | null>(null);
  const [loadingRegional, setLoadingRegional] = useState<boolean>(false);
  const [regionalDateFilter, setRegionalDateFilter] = useState<'all' | 'past30' | 'upcoming'>('all');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync state to URL search parameters
  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedSearch) params.q = debouncedSearch;
    if (selectedStatus !== 'all') params.status = selectedStatus;
    if (selectedService !== 'all') params.service = selectedService;
    if (freeOnly) params.free = 'true';
    if (slotsOnly) params.slots = 'true';
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    if (radiusKm !== 'all') params.radius = radiusKm;
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, selectedStatus, selectedService, freeOnly, slotsOnly, dateFrom, dateTo, radiusKm, setSearchParams]);

  // Fetch Camps Data from Backend
  const fetchCamps = useCallback(
    async (isBackground: boolean = false) => {
      try {
        if (!isBackground) setIsLoading(true);
        else setIsRefreshing(true);

        const queryParts: string[] = [];
        if (debouncedSearch) queryParts.push(`search=${encodeURIComponent(debouncedSearch)}`);
        if (selectedStatus !== 'all') queryParts.push(`status=${encodeURIComponent(selectedStatus.toUpperCase())}`);
        if (selectedService !== 'all') queryParts.push(`service=${encodeURIComponent(selectedService)}`);
        if (freeOnly) queryParts.push(`isFree=true`);
        if (slotsOnly) queryParts.push(`hasSlots=true`);
        if (dateFrom) queryParts.push(`dateFrom=${encodeURIComponent(dateFrom)}`);
        if (dateTo) queryParts.push(`dateTo=${encodeURIComponent(dateTo)}`);

        if (originCoords) {
          queryParts.push(`userLat=${originCoords[0]}`);
          queryParts.push(`userLng=${originCoords[1]}`);
          if (radiusKm !== 'all') {
            queryParts.push(`radius=${encodeURIComponent(radiusKm)}`);
          }
        }

        const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
        const response = await apiClient.get(`/camps/map${queryString}`);
        const returnedCamps: MapCamp[] = response.data?.data?.camps || [];

        setCamps(returnedCamps);
        setIsStale(false);
        setLastUpdated(new Date());

        // Keep selected camp refreshed if open
        if (selectedCamp) {
          const matched = returnedCamps.find((c) => c.id === selectedCamp.id);
          if (matched) setSelectedCamp(matched);
        }
      } catch (err: any) {
        console.error('Failed to load camp map data:', err);
        setIsStale(true);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [debouncedSearch, selectedStatus, selectedService, freeOnly, slotsOnly, dateFrom, dateTo, originCoords, radiusKm, selectedCamp]
  );

  useEffect(() => {
    fetchCamps(false);
  }, [debouncedSearch, selectedStatus, selectedService, freeOnly, slotsOnly, dateFrom, dateTo, radiusKm, originCoords]);

  // Sensible Auto-Polling Engine (every 25 seconds if active)
  useEffect(() => {
    if (!liveSyncEnabled) return;
    const interval = setInterval(() => {
      fetchCamps(true);
    }, 25000);
    return () => clearInterval(interval);
  }, [liveSyncEnabled, fetchCamps]);

  // Request Browser Geolocation (only on explicit user click)
  const handleRequestGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setManualPinActive(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setOriginCoords(coords);
        setOriginType('gps');
        setFlyToCoords(coords);
        setFlyToZoom(13);
        setSortBy('nearest');
        setIsLocating(false);
        toast.success('Current location detected! Straight-line distances computed.');
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast('Location permission denied. You can manually pin any location on the map.', {
            icon: '📍',
          });
        } else {
          toast.error('Unable to retrieve GPS coordinates.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Handle Manual Pin Placement on Map
  const handleMapPinSelect = (lat: number, lng: number) => {
    setOriginCoords([lat, lng]);
    setOriginType('manual');
    setManualPinActive(false);
    setSortBy('nearest');
    toast.success(`Custom search origin pinned at [${lat.toFixed(3)}, ${lng.toFixed(3)}]`);
  };

  // Clear Origin
  const handleClearOrigin = () => {
    setOriginCoords(null);
    setOriginType(null);
    setRadiusKm('all');
    setSortBy('earliest');
    toast('Custom origin cleared.', { icon: '🔄' });
  };

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (mapContainerRef.current?.requestFullscreen) {
        mapContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Fetch Regional Analytics (Admin only)
  const handleOpenRegionalAnalytics = async () => {
    try {
      setLoadingRegional(true);
      setShowRegionalModal(true);

      let q = '';
      if (regionalDateFilter === 'past30') {
        const d = new Date(Date.now() - 30 * 86400000).toISOString();
        q = `?dateFrom=${d}`;
      } else if (regionalDateFilter === 'upcoming') {
        const d = new Date().toISOString();
        q = `?dateFrom=${d}`;
      }

      const res = await apiClient.get(`/camps/regional-analytics${q}`);
      setRegionalData(res.data?.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to fetch regional analytics.');
    } finally {
      setLoadingRegional(false);
    }
  };

  // List of unique clinical services
  const availableServicesList = useMemo(() => {
    const set = new Set<string>();
    camps.forEach((c) => {
      if (Array.isArray(c.services)) {
        c.services.forEach((s) => set.add(s));
      }
    });
    return Array.from(set).sort();
  }, [camps]);

  // Process and sort camps with straight-line distance
  const processedCamps = useMemo(() => {
    const list = camps.map((camp) => {
      const distance =
        originCoords && camp.latitude && camp.longitude
          ? calculateStraightLineDistance(originCoords[0], originCoords[1], camp.latitude, camp.longitude)
          : null;
      return {
        ...camp,
        distance,
        straightLineDistance: distance,
        distanceLabel: distance !== null ? `${distance} km (straight-line)` : null,
      };
    });

    return list.sort((a, b) => {
      if (sortBy === 'nearest') {
        if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
        if (a.distance !== null) return -1;
        if (b.distance !== null) return 1;
      }
      if (sortBy === 'slots') return b.availableSlots - a.availableSlots;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }, [camps, originCoords, sortBy]);

  // Dynamic Clusters for Clustering View
  const clusters = useMemo(() => {
    if (visualizationMode !== 'clusters') return [];

    const clusterGrid: Array<{
      center: [number, number];
      camps: MapCamp[];
      totalAttendance: number;
    }> = [];

    const threshold = 0.45; // ~40-50km proximity grouping threshold

    processedCamps.forEach((camp) => {
      if (!camp.latitude || !camp.longitude) return;
      let added = false;
      for (const cl of clusterGrid) {
        const dist = calculateStraightLineDistance(cl.center[0], cl.center[1], camp.latitude, camp.longitude);
        if (dist <= 45) {
          cl.camps.push(camp);
          cl.totalAttendance += camp.registered;
          added = true;
          break;
        }
      }
      if (!added) {
        clusterGrid.push({
          center: [camp.latitude, camp.longitude],
          camps: [camp],
          totalAttendance: camp.registered,
        });
      }
    });

    return clusterGrid;
  }, [processedCamps, visualizationMode]);

  // Map and List Synchronization
  const handleSelectCamp = (camp: MapCamp) => {
    setSelectedCamp(camp);
    setFlyToCoords([camp.latitude, camp.longitude]);
    setFlyToZoom(15);

    // Scroll to matching card in list view if visible
    if (cardRefs.current[camp.id]) {
      cardRefs.current[camp.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Road directions routing provider
  const handleGetDirections = (camp: MapCamp) => {
    const dest = `${camp.latitude},${camp.longitude}`;
    let dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
    if (originCoords) {
      dirUrl += `&origin=${originCoords[0]},${originCoords[1]}`;
    }
    window.open(dirUrl, '_blank', 'noopener,noreferrer');
  };

  // Booking Flow
  const handleBookCamp = (camp: MapCamp) => {
    if (!isAuthenticated) {
      toast('Please log in or register to reserve your camp slot.', { icon: '🔐' });
      navigate(`/login?redirect=/patient/appointments/new?campId=${camp.id}`);
      return;
    }
    navigate(`/patient/appointments/new?campId=${camp.id}`);
  };

  return (
    <div
      ref={mapContainerRef}
      className={`relative flex flex-col w-full ${
        isFullscreen ? 'h-screen w-screen bg-slate-950 z-[9999]' : 'h-[calc(100vh-64px)] min-h-[640px] bg-slate-50 dark:bg-slate-950'
      }`}
    >
      {/* ------------------------------------------------------------- */}
      {/* Top Controls Bar: Search, Advanced Nearby, Mode Toggles       */}
      {/* ------------------------------------------------------------- */}
      <div className="z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-2.5">
          {/* Search Box & Origin Status */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative w-full lg:w-80 flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city, locality, camp or PIN..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700/60 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Manual Pin Origin Toggle */}
            <button
              type="button"
              onClick={() => {
                setManualPinActive(!manualPinActive);
                if (!manualPinActive) {
                  toast('Click anywhere on the map to set your custom origin pin.', { icon: '📍' });
                }
              }}
              title="Click on map to drop a custom location pin"
              className={`px-2.5 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition ${
                manualPinActive
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md animate-pulse'
                  : originType === 'manual'
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {manualPinActive ? 'Click Map Pin' : originType === 'manual' ? 'Custom Pin' : 'Set Pin'}
              </span>
            </button>
          </div>

          {/* Visualization Modes: Markers vs Clustered vs Heatmap */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setVisualizationMode('markers')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                visualizationMode === 'markers'
                  ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" /> Markers
            </button>
            <button
              type="button"
              onClick={() => setVisualizationMode('clusters')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                visualizationMode === 'clusters'
                  ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" /> Clusters
            </button>
            <button
              type="button"
              onClick={() => setVisualizationMode('heatmap')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                visualizationMode === 'heatmap'
                  ? 'bg-white dark:bg-slate-900 text-amber-500 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Heatmap
            </button>
          </div>

          {/* Distance Radius Filter (when origin active) */}
          <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto scrollbar-none py-1">
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">All Distances</option>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
              <option value="100">Within 100 km</option>
            </select>

            {/* Geolocation Button */}
            <button
              type="button"
              onClick={handleRequestGPS}
              disabled={isLocating}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                originType === 'gps'
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-cyan-500'
              }`}
            >
              <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-cyan-500' : ''}`} />
              <span className="hidden sm:inline">
                {isLocating ? 'Locating...' : originType === 'gps' ? 'GPS Active' : 'My GPS'}
              </span>
            </button>

            {/* Clear Origin if set */}
            {originCoords && (
              <button
                type="button"
                onClick={handleClearOrigin}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Clear current origin coordinates"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Admin Regional Analytics Button */}
            {user?.role === 'admin' && (
              <button
                type="button"
                onClick={handleOpenRegionalAnalytics}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition whitespace-nowrap"
              >
                <BarChart3 className="w-3.5 h-3.5" /> Regional Analytics
              </button>
            )}

            {/* List / Map Switcher */}
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
              title={viewMode === 'map' ? 'Accessible list view' : 'Map view'}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            >
              {viewMode === 'map' ? <List className="w-4 h-4" /> : <MapIcon className="w-4 h-4" />}
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Live Sync Status & Stale Data Bar                             */}
      {/* ------------------------------------------------------------- */}
      <div className="z-10 bg-slate-50 dark:bg-[#070e1c] border-b border-slate-200/60 dark:border-slate-800/60 px-4 py-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isStale ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <span className="font-medium">
              {isStale
                ? 'Stale data (reconnecting...)'
                : liveSyncEnabled
                ? 'Live Camp Sync Active'
                : 'Live Sync Paused'}
            </span>
          </div>

          <span className="hidden sm:inline opacity-70">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>

          {originCoords && (
            <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-medium">
              Distances calculated via straight-line / aerial metric
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchCamps(false)}
            disabled={isRefreshing}
            className="flex items-center gap-1 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
          >
            <RotateCcw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <button
            type="button"
            onClick={() => setLiveSyncEnabled(!liveSyncEnabled)}
            className="hover:underline"
          >
            {liveSyncEnabled ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Content Area: Map / Split Synchronized List / Heatmap Overlay */}
      {/* ------------------------------------------------------------- */}
      <div className="relative flex-1 w-full overflow-hidden flex">
        {/* VIEW 1: Full-Screen Interactive Leaflet Map */}
        {viewMode === 'map' ? (
          <div className="relative w-full h-full flex">
            {/* The Leaflet Canvas */}
            <div className="relative flex-1 h-full">
              <MapContainer
                center={originCoords || [12.9716, 77.5946]}
                zoom={11}
                zoomControl={false}
                scrollWheelZoom={true}
                className="w-full h-full z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                />
                <ZoomControl position="bottomright" />
                <MapUpdater targetPos={flyToCoords} targetZoom={flyToZoom} />
                <MapClickHandler
                  onMapClick={(lat, lng) => handleMapPinSelect(lat, lng)}
                  enabled={manualPinActive}
                />

                {/* Origin Marker */}
                {originCoords && (
                  <Marker position={originCoords} icon={originLocationIcon}>
                    <Popup>
                      <div className="p-1 text-xs">
                        <p className="font-bold text-blue-600">
                          {originType === 'gps' ? 'Your Current Location' : 'Custom Search Origin'}
                        </p>
                        <p className="text-slate-500">All camp straight-line distances measured from here.</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* MODE A: Standard Markers */}
                {visualizationMode === 'markers' &&
                  processedCamps.map((camp) => {
                    if (!camp.latitude || !camp.longitude || isNaN(camp.latitude) || isNaN(camp.longitude)) {
                      return null;
                    }
                    const isSelected = selectedCamp?.id === camp.id;
                    const markerIcon = createCampMarkerIcon(
                      camp.status,
                      camp.isFullyBooked,
                      isSelected,
                      prefersReducedMotion
                    );

                    return (
                      <Marker
                        key={camp.id}
                        position={[camp.latitude, camp.longitude]}
                        icon={markerIcon}
                        eventHandlers={{
                          click: () => handleSelectCamp(camp),
                        }}
                      >
                        <Popup className="custom-camp-popup" minWidth={260} maxWidth={320}>
                          <div className="p-1 space-y-2 text-slate-800 dark:text-slate-100">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  camp.status === 'ONGOING'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : camp.isFullyBooked
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-cyan-100 text-cyan-700'
                                }`}
                              >
                                {camp.status === 'ONGOING' ? '● Ongoing Now' : camp.status}
                              </span>
                              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                {camp.feeLabel}
                              </span>
                            </div>

                            <h4 className="font-bold text-sm text-slate-900 leading-tight">{camp.name}</h4>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-cyan-600 flex-shrink-0" />
                              {camp.location}
                            </p>

                            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2 rounded-lg">
                              <p className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                                {formatDate(camp.startDate)}
                              </p>
                              {camp.distance !== null && camp.distance !== undefined && (
                                <p className="flex items-center gap-1 font-semibold text-blue-600">
                                  <Compass className="w-3.5 h-3.5" />
                                  {camp.distance} km straight-line distance
                                </p>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleGetDirections(camp)}
                                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
                              >
                                <Navigation className="w-3 h-3 text-cyan-600" />
                                Directions
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBookCamp(camp)}
                                disabled={camp.isFullyBooked}
                                className={`py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 ${
                                  camp.isFullyBooked
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
                                }`}
                              >
                                {camp.isFullyBooked ? 'Full' : 'Book Camp'}
                              </button>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}

                {/* MODE B: Dynamic Clustered Markers */}
                {visualizationMode === 'clusters' &&
                  clusters.map((cl, idx) => (
                    <Marker
                      key={`cluster-${idx}`}
                      position={cl.center}
                      icon={createClusterMarkerIcon(cl.camps.length, cl.totalAttendance)}
                      eventHandlers={{
                        click: () => {
                          setFlyToCoords(cl.center);
                          setFlyToZoom(13);
                          if (cl.camps.length === 1) {
                            handleSelectCamp(cl.camps[0]);
                          } else {
                            toast(`Cluster has ${cl.camps.length} camps with ${cl.totalAttendance} attendees registered.`, {
                              icon: '🏥',
                            });
                          }
                        },
                      }}
                    >
                      <Popup>
                        <div className="p-1 text-xs space-y-1">
                          <p className="font-bold text-slate-800">Cluster of {cl.camps.length} Health Camps</p>
                          <p className="text-slate-500">Total Registered: {cl.totalAttendance} patients</p>
                          <div className="space-y-1 max-h-36 overflow-y-auto pt-1">
                            {cl.camps.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => handleSelectCamp(c)}
                                className="w-full text-left py-1 px-1.5 hover:bg-cyan-50 rounded text-cyan-700 font-medium truncate block"
                              >
                                • {c.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                {/* MODE C: Attendance Density Heatmap Circles */}
                {visualizationMode === 'heatmap' &&
                  processedCamps.map((camp) => {
                    if (!camp.latitude || !camp.longitude) return null;
                    const attendance = camp.registered || 0;
                    // Radius scales smoothly with attendance
                    const radius = Math.max(3000, Math.min(18000, attendance * 90));
                    let color = '#06b6d4'; // Cyan
                    if (attendance > 100) color = '#10b981'; // Emerald
                    if (attendance > 250) color = '#f59e0b'; // Amber
                    if (attendance > 400) color = '#ef4444'; // Ruby

                    return (
                      <Circle
                        key={`heat-${camp.id}`}
                        center={[camp.latitude, camp.longitude]}
                        radius={radius}
                        pathOptions={{
                          color: color,
                          fillColor: color,
                          fillOpacity: 0.28,
                          weight: 1.5,
                        }}
                        eventHandlers={{
                          click: () => handleSelectCamp(camp),
                        }}
                      >
                        <Popup>
                          <div className="p-1 text-xs">
                            <p className="font-bold text-slate-800">{camp.name}</p>
                            <p className="text-slate-600">Screening Attendance Volume: {attendance} patients</p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Density reflects recorded camp turnout only; not disease prevalence.
                            </p>
                          </div>
                        </Popup>
                      </Circle>
                    );
                  })}
              </MapContainer>

              {/* Heatmap Scientific Disclaimer Badge */}
              {visualizationMode === 'heatmap' && (
                <div className="absolute top-4 left-4 right-4 sm:right-auto sm:max-w-md z-[400] bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-cyan-500/30 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    <span>Geographic Distribution & Attendance Heatmap</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Density displays aggregated camp registrations and screening attendance volume. It does{' '}
                    <strong>NOT</strong> represent disease prevalence or local health risk.
                  </p>
                  <p className="text-[10px] text-cyan-300 font-mono">
                    Areas with no circles indicate zero recorded camps, not absence of healthcare need.
                  </p>
                </div>
              )}

              {/* Map Legend (Bottom-Left) */}
              <div className="absolute bottom-6 left-4 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-800/80 text-xs hidden sm:block">
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-cyan-500" /> Map Legend
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{processedCamps.length} camps</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                    <span className="text-slate-600 dark:text-slate-300">Upcoming Camp</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-slate-600 dark:text-slate-300">Ongoing Camp (Active)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-slate-600 dark:text-slate-300">Fully Booked</span>
                  </div>
                  {originCoords && (
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 border border-white" />
                      <span className="text-slate-600 dark:text-slate-300">Origin / Pin Point</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Synchronized Side Results Drawer (Desktop Right) */}
            <div className="hidden lg:flex flex-col w-96 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl z-10 overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Synchronized Camp List</h3>
                  <p className="text-[11px] text-slate-500">
                    Showing {processedCamps.length} active camps
                  </p>
                </div>
                <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold bg-cyan-50 dark:bg-cyan-950/50 px-2 py-0.5 rounded-lg">
                  {sortBy === 'nearest' ? 'Sorted by Distance' : 'Sorted by Date'}
                </div>
              </div>

              {/* Scrollable Synchronized Cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
                {processedCamps.length === 0 ? (
                  <div className="text-center py-12 px-4 text-slate-500 space-y-2">
                    <AlertCircle className="w-8 h-8 text-cyan-500 mx-auto opacity-60" />
                    <p className="text-xs font-semibold">No camps match current filters</p>
                    <p className="text-[11px]">Try expanding your radius or resetting search.</p>
                  </div>
                ) : (
                  processedCamps.map((camp) => {
                    const isSelected = selectedCamp?.id === camp.id;
                    return (
                      <div
                        key={camp.id}
                        ref={(el) => (cardRefs.current[camp.id] = el)}
                        onClick={() => handleSelectCamp(camp)}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer text-xs space-y-2 ${
                          isSelected
                            ? 'bg-cyan-50/80 dark:bg-cyan-950/40 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800/80 hover:border-cyan-400/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              camp.status === 'ONGOING'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                : camp.isFullyBooked
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400'
                            }`}
                          >
                            {camp.status}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                            {camp.feeLabel}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-900 dark:text-slate-100 leading-snug">
                          {camp.name}
                        </h4>

                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-600 flex-shrink-0" />
                          <span className="truncate">{camp.location}</span>
                        </p>

                        {camp.distance !== null && camp.distance !== undefined && (
                          <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <Compass className="w-3 h-3" />
                            {camp.distance} km (straight-line)
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                          <span className="text-slate-500">
                            Slots: <strong>{camp.availableSlots}</strong> left
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGetDirections(camp);
                            }}
                            className="text-cyan-600 hover:text-cyan-700 font-semibold flex items-center gap-0.5"
                          >
                            Route <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          /* VIEW 2: Accessible Card & List View Alternative */
          <div className="w-full h-full overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Accessible Health Camps Directory
                  </h2>
                  <p className="text-xs text-slate-500">
                    Showing {processedCamps.length} camps with straight-line distance metrics and real booking availability.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition shadow-sm"
                >
                  <MapIcon className="w-3.5 h-3.5" /> Back to Map
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {processedCamps.map((camp) => (
                  <div
                    key={camp.id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 shadow-sm transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            camp.status === 'ONGOING'
                              ? 'bg-emerald-100 text-emerald-700'
                              : camp.isFullyBooked
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-cyan-100 text-cyan-700'
                          }`}
                        >
                          {camp.status}
                        </span>
                        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mt-1">
                          {camp.name}
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-lg">
                        {camp.feeLabel}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0 mt-0.5" />
                      <span>{camp.address || camp.location}</span>
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                      <p className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                        {formatDate(camp.startDate)}
                      </p>
                      <p className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-500" />
                        {camp.operationalHours || '08:30 AM - 05:30 PM'}
                      </p>
                      {camp.distance !== null && camp.distance !== undefined && (
                        <p className="flex items-center gap-1 font-semibold text-blue-600 col-span-2">
                          <Compass className="w-3.5 h-3.5" />
                          {camp.distance} km straight-line distance
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Available Slots:</span>
                      <span
                        className={`font-bold ${
                          camp.availableSlots > 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {camp.availableSlots > 0 ? `${camp.availableSlots} remaining` : 'Full'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCamp(camp);
                          setFlyToCoords([camp.latitude, camp.longitude]);
                          setViewMode('map');
                        }}
                        className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition"
                      >
                        <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                        Locate on Map
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGetDirections(camp)}
                        className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition"
                      >
                        <Navigation className="w-3.5 h-3.5 text-cyan-600" />
                        Directions
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBookCamp(camp)}
                        disabled={camp.isFullyBooked}
                        className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition ${
                          camp.isFullyBooked
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
                        }`}
                      >
                        {camp.isFullyBooked ? 'Full' : 'Book Camp'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Administrator Regional Analytics Modal                        */}
      {/* ------------------------------------------------------------- */}
      {showRegionalModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Administrator Geographic Intelligence
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-500" />
                  District & Regional Camp Analytics
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRegionalModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Summary KPIs */}
              {regionalData && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Camps</span>
                    <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                      {regionalData.summary.totalCamps}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Regions Covered</span>
                    <p className="text-xl font-extrabold text-cyan-600 dark:text-cyan-400 mt-0.5">
                      {regionalData.summary.regionsCovered}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Registered</span>
                    <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {regionalData.summary.totalRegistered}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Underserved Areas</span>
                    <p className="text-xl font-extrabold text-amber-500 mt-0.5">
                      {regionalData.summary.underservedCount}
                    </p>
                  </div>
                </div>
              )}

              {/* Regional Breakdown Table */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Regional Performance & Coverage Assessment
                </h4>

                {loadingRegional ? (
                  <div className="text-center py-10 text-xs text-slate-500">
                    Loading verified regional data...
                  </div>
                ) : regionalData?.regions && regionalData.regions.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {regionalData.regions.map((reg) => (
                      <div
                        key={reg.region}
                        className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {reg.region}
                          </h5>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              reg.coverageStatus === 'Well-Covered'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                : reg.coverageStatus === 'Moderate'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                            }`}
                          >
                            {reg.coverageStatus}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase">Camps</span>
                            <span className="font-bold">{reg.campsCount}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase">Capacity</span>
                            <span className="font-bold">{reg.totalCapacity}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase">Occupancy</span>
                            <span className="font-bold">{reg.occupancyRate}%</span>
                          </div>
                        </div>

                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-purple-600 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, reg.occupancyRate)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No regional camp data available.</p>
                )}
              </div>

              {/* Scientific & Operational Disclaimer */}
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-3.5 rounded-2xl text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  Epidemiological & Operational Guardrails:
                </p>
                <p className="leading-relaxed">
                  {regionalData?.disclaimer ||
                    'Camp distribution and attendance density reflect registered healthcare camps and screening attendance only. They do NOT represent epidemiological disease prevalence or local health risk. Areas without recorded camps indicate absence of recorded camps, not absence of healthcare need.'}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRegionalModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl"
              >
                Close Analytics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampMapPage;
