import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search, Filter, MapPin, Calendar, Users, Grid3X3, Map,
  ChevronLeft, ChevronRight, X, CheckSquare, Square, ArrowRight,
  Navigation, List, Sparkles, AlertCircle
} from 'lucide-react';
import apiClient from '@/api/client';

// Fix Leaflet default icon asset paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom animated pulsing marker for health camps
const animatedCampIcon = L.divIcon({
  className: 'custom-camp-marker',
  html: `<div style="position:relative; display:flex; align-items:center; justify-content:center; width:36px; height:36px;">
    <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:#22d3ee; opacity:0.6; animation:ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
    <div style="position:relative; width:28px; height:28px; border-radius:50%; background:#0891b2; border:2px solid #ffffff; box-shadow:0 4px 10px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:#ffffff; font-size:13px; font-weight:bold;">🏥</div>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

const SERVICE_OPTIONS = [
  'General Medicine',
  'Dental',
  'Eye Care',
  'Pediatrics',
  'Gynecology',
  'Mental Health',
];

const STATUS_OPTIONS = ['all', 'upcoming', 'ongoing', 'completed'];

interface Camp {
  id?: string;
  _id?: string;
  name: string;
  address?: string;
  location?: any;
  startDate: string;
  endDate?: string;
  status: string;
  services?: string[];
  capacity: number;
  registeredCount: number;
}

function CampCardSkeleton() {
  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 animate-pulse space-y-4">
      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
        ))}
      </div>
      <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full" />
      <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
    </div>
  );
}

export default function CampDiscovery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [selectedServices, setSelectedServices] = useState<string[]>(searchParams.getAll('service'));
  const [status, setStatus] = useState(searchParams.get('status') ?? 'all');
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') ?? '');
  const [dateTo, setDateTo] = useState(searchParams.get('to') ?? '');
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 1));

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Sync URL params
  useEffect(() => {
    const params: Record<string, string | string[]> = {};
    if (debouncedSearch) params.q = debouncedSearch;
    if (status !== 'all') params.status = status;
    if (dateFrom) params.from = dateFrom;
    if (dateTo) params.to = dateTo;
    if (selectedServices.length) params.service = selectedServices;
    params.page = String(page);
    setSearchParams(params as any, { replace: true });
  }, [debouncedSearch, status, dateFrom, dateTo, selectedServices, page]);

  const { data, isLoading } = useQuery({
    queryKey: ['camps', debouncedSearch, status, dateFrom, dateTo, selectedServices, page],
    queryFn: () => {
      const p = new URLSearchParams();
      if (debouncedSearch) p.set('q', debouncedSearch);
      if (status !== 'all') p.set('status', status);
      if (dateFrom) p.set('from', dateFrom);
      if (dateTo) p.set('to', dateTo);
      selectedServices.forEach((s) => p.append('service', s));
      p.set('page', String(page));
      p.set('limit', '9');
      return apiClient.get(`/camps?${p.toString()}`).then((r) => r.data.data);
    },
    placeholderData: (prev) => prev,
  });

  const camps: Camp[] = data?.camps ?? [];
  const totalPages = data?.totalPages ?? 1;

  const toggleService = useCallback((s: string) => {
    setSelectedServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
    setPage(1);
  }, []);

  const clearFilters = () => {
    setSelectedServices([]);
    setStatus('all');
    setDateFrom('');
    setDateTo('');
    setSearch('');
    setPage(1);
  };

  const getCoordinates = (camp: Camp): [number, number] | null => {
    if (camp.location?.coordinates && Array.isArray(camp.location.coordinates)) {
      return [camp.location.coordinates[1], camp.location.coordinates[0]];
    }
    return [12.9716, 77.5946]; // Bengaluru default
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Camp Status
        </h3>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} className="dark:bg-slate-900">
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Clinical Departments
        </h3>
        <div className="space-y-2">
          {SERVICE_OPTIONS.map((svc) => (
            <button
              key={svc}
              onClick={() => toggleService(svc)}
              className="w-full flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors py-1"
            >
              {selectedServices.includes(svc) ? (
                <CheckSquare size={16} className="text-cyan-500 flex-shrink-0" />
              ) : (
                <Square size={16} className="text-slate-400 flex-shrink-0" />
              )}
              <span>{svc}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Camp Date Filter
        </h3>
        <div className="space-y-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white focus:outline-none"
            placeholder="From Date"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white focus:outline-none"
            placeholder="To Date"
          />
        </div>
      </div>

      <button
        onClick={clearFilters}
        className="w-full py-2.5 text-xs font-bold text-rose-500 hover:text-rose-600 border border-rose-500/30 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050c18] text-slate-900 dark:text-white pb-16 transition-colors">
      {/* Header Search Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-[#0a1b33] to-[#050c18] py-16 px-4 border-b border-cyan-500/20">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto text-center relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4 border border-cyan-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            Live Healthcare Camp Discovery
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-3">
            Find Health Camps Near You
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mb-8 max-w-xl mx-auto">
            Free clinical screenings, doctor consultations, and medicine dispensaries across Karnataka.
          </p>

          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" size={18} />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by taluk, village, address, or camp name..."
              className="w-full pl-11 pr-10 py-3.5 bg-slate-900/90 border border-cyan-500/30 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs sm:text-sm shadow-xl backdrop-blur-md"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm transition-all"
            >
              <Filter size={15} className="text-cyan-500" />
              <span>Filters</span>
              {selectedServices.length + (status !== 'all' ? 1 : 0) > 0 && (
                <span className="bg-cyan-500 text-slate-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                  {selectedServices.length + (status !== 'all' ? 1 : 0)}
                </span>
              )}
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing <strong>{data?.total ?? camps.length}</strong> active health camps
            </span>
          </div>

          {/* View Toggles (Grid, Accessible List, Map) */}
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Grid3X3 size={15} />
              <span className="hidden sm:inline">Cards</span>
            </button>

            <button
              onClick={() => setViewMode('list')}
              title="Accessible List View"
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List size={15} />
              <span className="hidden sm:inline">List View</span>
            </button>

            <button
              onClick={() => setViewMode('map')}
              title="Interactive Map"
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'map'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Map size={15} />
              <span className="hidden sm:inline">Live Map</span>
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filter Sidebar */}
          <AnimatePresence>
            {showFilters && (
              <motion.aside
                initial={{ opacity: 0, x: -20, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 260 }}
                exit={{ opacity: 0, x: -20, width: 0 }}
                transition={{ duration: 0.2 }}
                className="hidden lg:block flex-shrink-0 bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 self-start sticky top-24 shadow-3d overflow-hidden"
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-extrabold text-sm">Filter Criteria</h2>
                  <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-200">
                    <X size={16} />
                  </button>
                </div>
                <FilterPanel />
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main View Area */}
          <div className="flex-1 min-w-0">
            {viewMode === 'map' ? (
              <div className="h-[620px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-3d relative">
                <MapContainer center={[12.9716, 77.5946]} zoom={9} className="h-full w-full z-10">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  {camps.map((camp) => {
                    const coords = getCoordinates(camp);
                    if (!coords) return null;
                    const campId = camp.id || camp._id;
                    const pct = Math.min(100, Math.round(((camp.registeredCount ?? 0) / (camp.capacity || 100)) * 100));

                    return (
                      <Marker key={campId} position={coords} icon={animatedCampIcon}>
                        <Popup>
                          <div className="min-w-[220px] p-1 font-sans">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 uppercase inline-block mb-1">
                              {camp.status}
                            </span>
                            <h3 className="font-bold text-sm text-slate-900 mb-1">{camp.name}</h3>
                            <p className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                              <MapPin size={12} className="text-cyan-600" />
                              <span>{camp.address || camp.location}</span>
                            </p>
                            <p className="text-xs text-slate-600 mb-2 flex items-center gap-1">
                              <Calendar size={12} className="text-cyan-600" />
                              <span>{new Date(camp.startDate).toLocaleDateString()}</span>
                            </p>
                            <div className="text-[11px] font-semibold text-slate-500 mb-2">
                              Capacity: {camp.registeredCount || 0} / {camp.capacity} ({pct}% booked)
                            </div>
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                              <Link
                                to={`/camps/${campId}`}
                                className="text-xs text-cyan-600 font-bold hover:underline flex items-center gap-1"
                              >
                                View Details <ArrowRight size={12} />
                              </Link>
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(camp.address || camp.name)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-slate-600 font-semibold hover:underline ml-auto flex items-center gap-1"
                              >
                                <Navigation size={11} /> Directions
                              </a>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
            ) : viewMode === 'list' ? (
              /* Accessible List View */
              <div className="space-y-3">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <CampCardSkeleton key={i} />)
                ) : camps.length === 0 ? (
                  <div className="py-20 text-center rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <MapPin size={48} className="mx-auto text-cyan-500 mb-4" />
                    <h3 className="text-lg font-bold mb-1">No camps found</h3>
                    <p className="text-xs text-slate-500 mb-4">Try clearing your search query or department filters</p>
                    <button onClick={clearFilters} className="px-5 py-2 bg-cyan-500 text-slate-950 rounded-xl font-bold text-xs">
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  camps.map((camp) => {
                    const campId = camp.id || camp._id;
                    const pct = Math.min(100, Math.round(((camp.registeredCount ?? 0) / (camp.capacity || 100)) * 100));

                    return (
                      <div
                        key={campId}
                        className="p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-base text-slate-900 dark:text-white">
                              {camp.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 uppercase">
                              {camp.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <MapPin size={12} className="text-cyan-500" />
                              {camp.address || camp.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={12} className="text-cyan-500" />
                              {new Date(camp.startDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                              <Users size={12} />
                              {camp.registeredCount ?? 0} / {camp.capacity} Booked
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(camp.address || camp.name)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Navigation size={13} className="text-cyan-500" />
                            <span>Directions</span>
                          </a>
                          <Link
                            to={`/camps/${campId}`}
                            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5"
                          >
                            <span>Book Consultation</span>
                            <ArrowRight size={13} />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* Grid View (Cards with 3D Depth) */
              <>
                {isLoading ? (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <CampCardSkeleton key={i} />
                    ))}
                  </div>
                ) : camps.length === 0 ? (
                  <div className="py-20 text-center rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <MapPin size={48} className="mx-auto text-cyan-500 mb-4" />
                    <h3 className="text-lg font-bold mb-1">No camps found</h3>
                    <p className="text-xs text-slate-500 mb-4">Try clearing your search query or department filters</p>
                    <button onClick={clearFilters} className="px-5 py-2 bg-cyan-500 text-slate-950 rounded-xl font-bold text-xs">
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {camps.map((camp) => {
                      const campId = camp.id || camp._id;
                      const pct = Math.min(100, Math.round(((camp.registeredCount ?? 0) / (camp.capacity || 100)) * 100));

                      return (
                        <div
                          key={campId}
                          className="p-6 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 shadow-3d hover:shadow-glow transition-all duration-300 flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-cyan-500 transition-colors">
                                {camp.name}
                              </h3>
                              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 uppercase flex-shrink-0">
                                {camp.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                              <MapPin size={13} className="text-cyan-500 flex-shrink-0" />
                              <span className="truncate">{camp.address || camp.location}</span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
                              <Calendar size={13} className="text-cyan-500 flex-shrink-0" />
                              <span>
                                {new Date(camp.startDate).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>

                            {/* Service Badges */}
                            <div className="flex flex-wrap gap-1.5 mb-5">
                              {(camp.services ?? ['General Medicine', 'Dental']).slice(0, 3).map((s) => (
                                <span
                                  key={s}
                                  className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-cyan-300 rounded-md border border-slate-200 dark:border-slate-700"
                                >
                                  {s}
                                </span>
                              ))}
                              {(camp.services ?? []).length > 3 && (
                                <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md">
                                  +{(camp.services?.length || 0) - 3}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1 font-medium">
                                <Users size={12} /> Capacity Utilization
                              </span>
                              <span className="font-bold text-slate-700 dark:text-slate-200">
                                {camp.registeredCount ?? 0} / {camp.capacity}
                              </span>
                            </div>

                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  pct >= 90 ? 'bg-rose-500' : pct >= 65 ? 'bg-amber-400' : 'bg-cyan-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(camp.address || camp.name)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-center font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                              >
                                <Navigation size={12} className="text-cyan-500" />
                                <span>Directions</span>
                              </a>
                              <Link
                                to={`/camps/${campId}`}
                                className="py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-center font-bold text-xs shadow-md flex items-center justify-center gap-1 transition-all"
                              >
                                <span>{pct >= 100 ? 'Waitlist' : 'Book Visit'}</span>
                                <ArrowRight size={12} />
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                          p === page
                            ? 'bg-cyan-500 text-slate-950 shadow-md scale-105'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
