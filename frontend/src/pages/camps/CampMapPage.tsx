// src/pages/camps/CampMapPage.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
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
  distance?: number | null;
}

// -------------------------------------------------------------
// Haversine Distance Helper
// -------------------------------------------------------------
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
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
// Marker Icon Factory
// -------------------------------------------------------------
function createCampMarkerIcon(status: string, isFullyBooked: boolean, isSelected: boolean) {
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

  const pulseAnimation = status === 'ONGOING' || isSelected
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

const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
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
// Leaflet Map Controller Helper
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

// -------------------------------------------------------------
// Main Component
// -------------------------------------------------------------
export const CampMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Map Data State
  const [camps, setCamps] = useState<MapCamp[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState<string>(searchQuery);
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get('status') || 'all');
  const [selectedService, setSelectedService] = useState<string>(searchParams.get('service') || 'all');
  const [freeOnly, setFreeOnly] = useState<boolean>(searchParams.get('free') === 'true');
  const [slotsOnly, setSlotsOnly] = useState<boolean>(searchParams.get('slots') === 'true');
  const [dateFrom, setDateFrom] = useState<string>(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState<string>(searchParams.get('dateTo') || '');
  const [sortBy, setSortBy] = useState<'nearest' | 'earliest' | 'slots'>('earliest');

  // Interactive View State
  const [selectedCamp, setSelectedCamp] = useState<MapCamp | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationDenied, setLocationDenied] = useState<boolean>(false);
  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [showFiltersModal, setShowFiltersModal] = useState<boolean>(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync state to URL search parameters without page refresh
  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedSearch) params.q = debouncedSearch;
    if (selectedStatus !== 'all') params.status = selectedStatus;
    if (selectedService !== 'all') params.service = selectedService;
    if (freeOnly) params.free = 'true';
    if (slotsOnly) params.slots = 'true';
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, selectedStatus, selectedService, freeOnly, slotsOnly, dateFrom, dateTo, setSearchParams]);

  // Fetch Camps from Backend API
  const fetchCamps = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const queryParts: string[] = [];
      if (debouncedSearch) queryParts.push(`search=${encodeURIComponent(debouncedSearch)}`);
      if (selectedStatus !== 'all') queryParts.push(`status=${encodeURIComponent(selectedStatus.toUpperCase())}`);
      if (selectedService !== 'all') queryParts.push(`service=${encodeURIComponent(selectedService)}`);
      if (freeOnly) queryParts.push(`isFree=true`);
      if (slotsOnly) queryParts.push(`hasSlots=true`);
      if (dateFrom) queryParts.push(`dateFrom=${encodeURIComponent(dateFrom)}`);
      if (dateTo) queryParts.push(`dateTo=${encodeURIComponent(dateTo)}`);

      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      const response = await apiClient.get(`/camps/map${queryString}`);
      const returnedCamps: MapCamp[] = response.data?.data?.camps || [];
      setCamps(returnedCamps);

      // If a camp is selected, keep it synced
      if (selectedCamp) {
        const refreshed = returnedCamps.find((c) => c.id === selectedCamp.id);
        if (refreshed) setSelectedCamp(refreshed);
      }
    } catch (err: any) {
      console.error('Failed to load camp map data:', err);
      setError(err?.response?.data?.message || 'Unable to connect to live health camp database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCamps();
  }, [debouncedSearch, selectedStatus, selectedService, freeOnly, slotsOnly, dateFrom, dateTo]);

  // User Geolocation Handler
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationDenied(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setFlyToCoords(coords);
        setSortBy('nearest');
        setIsLocating(false);
        toast.success('Location detected! Distances updated.');
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationDenied(true);
          toast('Location permission not granted. You can still browse all camps freely.', {
            icon: '📍',
          });
        } else {
          toast.error('Unable to retrieve current location.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
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
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Compute Services List from returned camps
  const availableServicesList = useMemo(() => {
    const set = new Set<string>();
    camps.forEach((c) => {
      if (Array.isArray(c.services)) {
        c.services.forEach((s) => set.add(s));
      }
    });
    return Array.from(set).sort();
  }, [camps]);

  // Sorted and Processed Camps
  const processedCamps = useMemo(() => {
    const list = camps.map((camp) => {
      const distance =
        userLocation && camp.latitude && camp.longitude
          ? calculateDistance(userLocation[0], userLocation[1], camp.latitude, camp.longitude)
          : null;
      return { ...camp, distance };
    });

    return list.sort((a, b) => {
      if (sortBy === 'nearest') {
        if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
        if (a.distance !== null) return -1;
        if (b.distance !== null) return 1;
      }
      if (sortBy === 'slots') {
        return b.availableSlots - a.availableSlots;
      }
      // earliest date
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }, [camps, userLocation, sortBy]);

  // Handle Book Camp Click
  const handleBookCamp = (camp: MapCamp) => {
    if (!isAuthenticated) {
      toast('Please log in or register to reserve your camp slot.', { icon: '🔐' });
      navigate(`/login?redirect=/patient/appointments/new?campId=${camp.id}`);
      return;
    }
    navigate(`/patient/appointments/new?campId=${camp.id}`);
  };

  // Handle Directions Click
  const handleGetDirections = (camp: MapCamp) => {
    const dest = `${camp.latitude},${camp.longitude}`;
    let dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
    if (userLocation) {
      dirUrl += `&origin=${userLocation[0]},${userLocation[1]}`;
    }
    window.open(dirUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      ref={mapContainerRef}
      className={`relative flex flex-col w-full ${
        isFullscreen ? 'h-screen w-screen bg-slate-950 z-[9999]' : 'h-[calc(100vh-64px)] min-h-[600px] bg-slate-50 dark:bg-slate-950'
      }`}
    >
      {/* ------------------------------------------------------------- */}
      {/* Floating Header / Search & Filter Controls                     */}
      {/* ------------------------------------------------------------- */}
      <div className="z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input Bar */}
          <div className="relative w-full md:w-96 flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city, locality, camp name or PIN..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-inner"
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

          {/* Quick Filter Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none py-1">
            {[
              { id: 'all', label: 'All Camps' },
              { id: 'UPCOMING', label: 'Upcoming' },
              { id: 'ONGOING', label: 'Ongoing Now' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  selectedStatus === tab.id
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setFreeOnly(!freeOnly)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1 ${
                freeOnly
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" /> Free Only
            </button>

            <button
              type="button"
              onClick={() => setSlotsOnly(!slotsOnly)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                slotsOnly
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Slots Available
            </button>
          </div>

          {/* Action Tools (Location, View Mode, Fullscreen) */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {/* Geolocation Button */}
            <button
              type="button"
              onClick={handleRequestLocation}
              disabled={isLocating}
              title="Locate my position and calculate nearest camps"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                userLocation
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-cyan-500'
              }`}
            >
              <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-cyan-500' : ''}`} />
              <span className="hidden sm:inline">
                {isLocating ? 'Locating...' : userLocation ? 'Near Me' : 'Find Near Me'}
              </span>
            </button>

            {/* Specialty Dropdown */}
            {availableServicesList.length > 0 && (
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="all">All Specialties</option>
                {availableServicesList.map((svc) => (
                  <option key={svc} value={svc}>
                    {svc}
                  </option>
                ))}
              </select>
            )}

            {/* Sort Toggle */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="earliest">Earliest Date</option>
              <option value="slots">Most Slots</option>
              {userLocation && <option value="nearest">Nearest to Me</option>}
            </select>

            {/* List / Map Switcher for Accessibility */}
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
              title={viewMode === 'map' ? 'Switch to accessible list view' : 'Switch to interactive map view'}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            >
              {viewMode === 'map' ? <List className="w-4 h-4" /> : <MapIcon className="w-4 h-4" />}
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit full screen' : 'Expand full screen'}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Content Area: Map / Side Drawer / Accessible List View         */}
      {/* ------------------------------------------------------------- */}
      <div className="relative flex-1 w-full overflow-hidden flex">
        {/* VIEW 1: Full-Screen Interactive Leaflet Map */}
        {viewMode === 'map' ? (
          <div className="relative w-full h-full">
            <MapContainer
              center={userLocation || [12.9716, 77.5946]} // Default Bengaluru center
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
              <MapUpdater targetPos={flyToCoords} targetZoom={14} />

              {/* User Geolocation Marker */}
              {userLocation && (
                <Marker position={userLocation} icon={userLocationIcon}>
                  <Popup>
                    <div className="p-1 text-xs">
                      <p className="font-bold text-blue-600">Your Current Location</p>
                      <p className="text-slate-500">Camps distances calculated from here.</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Verified Camp Markers */}
              {processedCamps.map((camp) => {
                if (!camp.latitude || !camp.longitude || isNaN(camp.latitude) || isNaN(camp.longitude)) {
                  return null;
                }
                const isSelected = selectedCamp?.id === camp.id;
                const markerIcon = createCampMarkerIcon(camp.status, camp.isFullyBooked, isSelected);

                return (
                  <Marker
                    key={camp.id}
                    position={[camp.latitude, camp.longitude]}
                    icon={markerIcon}
                    eventHandlers={{
                      click: () => {
                        setSelectedCamp(camp);
                        setFlyToCoords([camp.latitude, camp.longitude]);
                      },
                    }}
                  >
                    <Popup className="custom-camp-popup" minWidth={260} maxWidth={320}>
                      <div className="p-1 space-y-2 text-slate-800 dark:text-slate-100">
                        {/* Header & Status */}
                        <div>
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
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-cyan-600 flex-shrink-0" />
                            {camp.location}
                          </p>
                        </div>

                        {/* Timing and Distance */}
                        <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2 rounded-lg">
                          <p className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                            {formatDate(camp.startDate)}
                          </p>
                          <p className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-cyan-600" />
                            {camp.operationalHours || '09:00 AM - 05:00 PM'}
                          </p>
                          {camp.distance !== null && camp.distance !== undefined && (
                            <p className="flex items-center gap-1 font-semibold text-blue-600">
                              <Compass className="w-3.5 h-3.5 text-blue-600" />
                              {camp.distance} km from you
                            </p>
                          )}
                        </div>

                        {/* Slots meter */}
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-500 font-medium">Slots Availability:</span>
                            <span
                              className={`font-bold ${
                                camp.availableSlots > 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {camp.availableSlots > 0
                                ? `${camp.availableSlots} Available`
                                : 'Fully Booked'}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                camp.availableSlots > 0 ? 'bg-cyan-500' : 'bg-rose-500'
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round((camp.registered / (camp.capacity || 100)) * 100)
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Specialties pills */}
                        {camp.services && camp.services.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {camp.services.slice(0, 3).map((s) => (
                              <span
                                key={s}
                                className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                              >
                                {s}
                              </span>
                            ))}
                            {camp.services.length > 3 && (
                              <span className="text-[10px] text-slate-400">
                                +{camp.services.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleGetDirections(camp)}
                            className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition"
                          >
                            <Navigation className="w-3 h-3 text-cyan-600" />
                            Directions
                          </button>

                          <button
                            type="button"
                            onClick={() => handleBookCamp(camp)}
                            disabled={camp.isFullyBooked}
                            className={`py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition ${
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
            </MapContainer>

            {/* Map Legend Overlay */}
            <div className="absolute top-4 left-4 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-800/80 text-xs max-w-xs hidden sm:block">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-500" /> Map Legend
                </span>
                <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
                  {processedCamps.length} Camps
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-500 shadow-sm" />
                  <span className="text-slate-600 dark:text-slate-300">Upcoming Camp</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm animate-pulse" />
                  <span className="text-slate-600 dark:text-slate-300">Ongoing Camp (Active)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
                  <span className="text-slate-600 dark:text-slate-300">Fully Booked</span>
                </div>
                {userLocation && (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600 shadow-sm border border-white" />
                    <span className="text-slate-600 dark:text-slate-300">Your Detected Location</span>
                  </div>
                )}
              </div>
            </div>

            {/* Floating Camp Detail Drawer / Side Card (Desktop right / Mobile bottom) */}
            {selectedCamp && (
              <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-4 sm:w-96 z-[400] bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 transition-all">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        selectedCamp.status === 'ONGOING'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : selectedCamp.isFullyBooked
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400'
                      }`}
                    >
                      {selectedCamp.status === 'ONGOING' ? '● Ongoing Now' : selectedCamp.status}
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 mt-1">
                      {selectedCamp.name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCamp(null)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <span>{selectedCamp.address || selectedCamp.location}</span>
                </p>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl mb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Camp Date</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                      {formatDate(selectedCamp.startDate)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Care Tier</span>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {selectedCamp.feeLabel}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Timings</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-500" />
                      {selectedCamp.operationalHours || '08:30 AM - 05:30 PM'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Distance</span>
                    <p className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
                      <Compass className="w-3.5 h-3.5" />
                      {selectedCamp.distance !== null && selectedCamp.distance !== undefined
                        ? `${selectedCamp.distance} km away`
                        : 'Tap "Find Near Me"'}
                    </p>
                  </div>
                </div>

                {/* Slots Meter */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Slots Available:</span>
                    <span
                      className={`font-bold ${
                        selectedCamp.availableSlots > 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {selectedCamp.availableSlots > 0
                        ? `${selectedCamp.availableSlots} of ${selectedCamp.capacity} remaining`
                        : 'Fully Booked'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        selectedCamp.availableSlots > 0 ? 'bg-cyan-500' : 'bg-rose-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((selectedCamp.registered / (selectedCamp.capacity || 100)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Services Tags */}
                {selectedCamp.services && selectedCamp.services.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {selectedCamp.services.map((svc) => (
                      <span
                        key={svc}
                        className="text-[11px] font-medium bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200/50 dark:border-cyan-800/50 px-2 py-0.5 rounded-lg"
                      >
                        {svc}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleGetDirections(selectedCamp)}
                    className="w-full py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
                  >
                    <Navigation className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    Get Directions
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBookCamp(selectedCamp)}
                    disabled={selectedCamp.isFullyBooked}
                    className={`w-full py-2.5 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm ${
                      selectedCamp.isFullyBooked
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
                    }`}
                  >
                    {selectedCamp.isFullyBooked ? 'Fully Booked' : 'Book Camp Slot'}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* VIEW 2: Accessible Card & List View Alternative */
          <div className="w-full h-full overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Accessible Camps Directory
                  </h2>
                  <p className="text-xs text-slate-500">
                    Showing {processedCamps.length} verified camps matching your criteria.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition shadow-sm"
                >
                  <MapIcon className="w-3.5 h-3.5" /> Switch to Map
                </button>
              </div>

              {processedCamps.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
                  <AlertCircle className="w-10 h-10 text-cyan-500 mx-auto opacity-70" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    No Health Camps Found
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    No active health camps match your search or filter settings. Try clearing the search or widening your filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedStatus('all');
                      setSelectedService('all');
                      setFreeOnly(false);
                      setSlotsOnly(false);
                      setDateFrom('');
                      setDateTo('');
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
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
                          {camp.operationalHours || '09:00 AM - 05:00 PM'}
                        </p>
                        {camp.distance !== null && camp.distance !== undefined && (
                          <p className="flex items-center gap-1 font-semibold text-blue-600 col-span-2">
                            <Compass className="w-3.5 h-3.5" />
                            {camp.distance} km from your location
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
                          className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition"
                        >
                          <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                          Locate on Map
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGetDirections(camp)}
                          className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition"
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
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
                          }`}
                        >
                          {camp.isFullyBooked ? 'Full' : 'Book Camp'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampMapPage;
