import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search, Filter, MapPin, Calendar, Users, Grid3X3, Map,
  ChevronLeft, ChevronRight, X, CheckSquare, Square, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '@/api/client';

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png' });

const customIcon = new L.Icon({ iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] });

const SERVICE_OPTIONS = ['General Medicine', 'Dental', 'Eye Care', 'Pediatrics', 'Gynecology', 'Mental Health'];
const STATUS_OPTIONS = ['all', 'upcoming', 'ongoing', 'completed'];

interface Camp {
  _id: string;
  name: string;
  address: string;
  location: { coordinates: [number, number] };
  startDate: string;
  endDate: string;
  status: string;
  services: string[];
  capacity: number;
  registeredCount: number;
}

function CampCardSkeleton() {
  return (
    <div className="p-5 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl animate-pulse">
      <div className="h-5 bg-gray-200 dark:bg-white/10 rounded w-3/4 mb-3" />
      <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-1/2 mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-2/3 mb-4" />
      <div className="flex gap-2 mb-4">{[1,2,3].map(i => <div key={i} className="h-6 w-20 bg-gray-200 dark:bg-white/10 rounded-full" />)}</div>
      <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full mb-4" />
      <div className="h-9 bg-gray-200 dark:bg-white/10 rounded-lg" />
    </div>
  );
}

export default function CampDiscovery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
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
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
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
      selectedServices.forEach(s => p.append('service', s));
      p.set('page', String(page));
      p.set('limit', '9');
      return apiClient.get(`/camps?${p.toString()}`).then(r => r.data.data);
    },
    placeholderData: (prev) => prev,
  });

  const camps: Camp[] = data?.camps ?? [];
  const totalPages = data?.totalPages ?? 1;

  const toggleService = useCallback((s: string) => {
    setSelectedServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
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

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Status</h3>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="w-full px-3 py-2 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-lg text-sm dark:text-white">
          {STATUS_OPTIONS.map(s => <option key={s} value={s} className="dark:bg-[#0a1628]">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>
      <div>
        <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Services</h3>
        <div className="space-y-2">
          {SERVICE_OPTIONS.map(svc => (
            <button key={svc} onClick={() => toggleService(svc)} className="w-full flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
              {selectedServices.includes(svc) ? <CheckSquare size={16} className="text-cyan-500 flex-shrink-0" /> : <Square size={16} className="flex-shrink-0" />}
              {svc}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Date Range</h3>
        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="w-full px-3 py-2 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-lg text-sm dark:text-white mb-2" placeholder="From" />
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="w-full px-3 py-2 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-lg text-sm dark:text-white" placeholder="To" />
      </div>
      <button onClick={clearFilters} className="w-full py-2 text-sm text-red-500 hover:text-red-400 border border-red-500/30 rounded-lg transition-colors">Clear All Filters</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1628] text-gray-900 dark:text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a1628] to-[#0d2a4a] py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-extrabold text-white mb-4">Discover Health Camps</motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-gray-300 mb-8">Find and register for free health camps near you</motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search camps by name, location, service..."
              className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 text-sm"
            />
            {search && <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"><X size={16} /></button>}
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/20 transition-colors">
              <Filter size={16} /> Filters {selectedServices.length + (status !== 'all' ? 1 : 0) > 0 && <span className="bg-cyan-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{selectedServices.length + (status !== 'all' ? 1 : 0)}</span>}
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">{data?.total ?? 0} camps found</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-cyan-500 text-white' : 'bg-white dark:bg-white/10 text-gray-600 dark:text-gray-400'}`}><Grid3X3 size={18} /></button>
            <button onClick={() => setViewMode('map')} className={`p-2 rounded-lg transition-colors ${viewMode === 'map' ? 'bg-cyan-500 text-white' : 'bg-white dark:bg-white/10 text-gray-600 dark:text-gray-400'}`}><Map size={18} /></button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Desktop filter sidebar */}
          <AnimatePresence>
            {showFilters && (
              <motion.aside initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="hidden lg:block w-64 flex-shrink-0 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-5 self-start sticky top-20">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold">Filters</h2>
                  <button onClick={() => setShowFilters(false)}><X size={16} /></button>
                </div>
                <FilterPanel />
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Mobile filter drawer */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowFilters(false)}>
                <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween' }} onClick={e => e.stopPropagation()} className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-[#0d1f3c] p-6 overflow-y-auto">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-bold text-gray-900 dark:text-white">Filters</h2>
                    <button onClick={() => setShowFilters(false)}><X size={16} className="dark:text-white" /></button>
                  </div>
                  <FilterPanel />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 min-w-0">
            {viewMode === 'map' ? (
              <div className="h-[600px] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10">
                <MapContainer center={[15.3173, 75.7139]} zoom={7} className="h-full w-full">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                  {camps.map(camp => camp.location?.coordinates && (
                    <Marker key={camp._id} position={[camp.location.coordinates[1], camp.location.coordinates[0]]} icon={customIcon}>
                      <Popup>
                        <div className="min-w-[200px]">
                          <h3 className="font-bold text-sm mb-1">{camp.name}</h3>
                          <p className="text-xs text-gray-500 mb-1">{camp.address}</p>
                          <p className="text-xs mb-2">{new Date(camp.startDate).toLocaleDateString()}</p>
                          <Link to={`/camps/${camp._id}`} className="text-xs text-cyan-600 font-semibold hover:underline flex items-center gap-1">View Details <ArrowRight size={12} /></Link>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            ) : (
              <>
                {isLoading ? (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {Array.from({ length: 9 }).map((_, i) => <CampCardSkeleton key={i} />)}
                  </div>
                ) : camps.length === 0 ? (
                  <div className="py-20 text-center">
                    <MapPin size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">No camps found</h3>
                    <p className="text-gray-500">Try adjusting your search or filters</p>
                    <button onClick={clearFilters} className="mt-4 px-6 py-2.5 bg-cyan-500 text-white rounded-xl font-medium">Clear Filters</button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {camps.map(camp => {
                      const pct = Math.min(100, Math.round(((camp.registeredCount ?? 0) / camp.capacity) * 100));
                      return (
                        <motion.div key={camp._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl hover:border-cyan-500/40 hover:shadow-lg transition-all duration-200 flex flex-col">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-bold text-gray-900 dark:text-white pr-2">{camp.name}</h3>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${camp.status === 'upcoming' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : camp.status === 'ongoing' ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'}`}>{camp.status}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                            <MapPin size={12} className="text-cyan-500 flex-shrink-0" />
                            <span className="truncate">{camp.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                            <Calendar size={12} className="text-cyan-500 flex-shrink-0" />
                            <span>{new Date(camp.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {(camp.services ?? []).slice(0, 3).map(s => (
                              <span key={s} className="px-2 py-0.5 text-xs bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-full border border-cyan-200 dark:border-cyan-500/20">{s}</span>
                            ))}
                            {(camp.services ?? []).length > 3 && <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-white/10 text-gray-500 rounded-full">+{camp.services.length - 3}</span>}
                          </div>
                          <div className="mt-auto">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span className="flex items-center gap-1"><Users size={11} /> Capacity</span>
                              <span>{camp.registeredCount ?? 0}/{camp.capacity}</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                              <div className={`h-1.5 rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-cyan-500'}`} style={{ width: `${pct}%` }} />
                            </div>
                            <Link to={`/camps/${camp._id}`} className="mt-3 w-full block text-center py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold rounded-xl transition-colors text-sm">
                              {pct >= 100 ? 'Join Waitlist' : 'Register Now'}
                            </Link>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-10">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 disabled:opacity-40">
                      <ChevronLeft size={18} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-lg text-sm font-medium ${p === page ? 'bg-cyan-500 text-white' : 'bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-white/20'}`}>{p}</button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 disabled:opacity-40">
                      <ChevronRight size={18} />
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
