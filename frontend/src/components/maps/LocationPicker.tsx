// src/components/maps/LocationPicker.tsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Check, AlertCircle, Compass } from 'lucide-react';

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  className?: string;
}

const CITY_PRESETS = [
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Mysuru', lat: 12.2958, lng: 76.6394 },
  { name: 'Mangaluru', lat: 12.9141, lng: 74.8560 },
  { name: 'Hubballi', lat: 15.3647, lng: 75.1240 },
  { name: 'Belagavi', lat: 15.8497, lng: 74.4977 },
  { name: 'Kalaburagi', lat: 17.3297, lng: 76.8343 },
];

function MapController({
  position,
  onSelect,
}: {
  position: [number, number];
  onSelect: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, map.getZoom() < 12 ? 13 : map.getZoom(), { animate: true });
  }, [position, map]);

  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return (
    <Marker
      position={position}
      icon={markerIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const newPos = marker.getLatLng();
          onSelect(newPos.lat, newPos.lng);
        },
      }}
    />
  );
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  initialLat = 12.9716,
  initialLng = 77.5946,
  onLocationSelect,
  className = 'h-80 w-full rounded-2xl overflow-hidden',
}) => {
  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (initialLat && initialLng && !isNaN(initialLat) && !isNaN(initialLng)) {
      setPosition([initialLat, initialLng]);
    }
  }, [initialLat, initialLng]);

  const handleSelect = (lat: number, lng: number, address?: string) => {
    const clampedLat = Math.max(-90, Math.min(90, lat));
    const clampedLng = Math.max(-180, Math.min(180, lng));
    setPosition([clampedLat, clampedLng]);
    onLocationSelect(clampedLat, clampedLng, address);
  };

  const handleSearchAddress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      setSearchFeedback(null);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery + ', India'
      )}&limit=1`;
      const response = await fetch(url, {
        headers: { 'Accept-Language': 'en' },
      });
      const data = await response.json();

      if (data && data.length > 0) {
        const foundLat = parseFloat(data[0].lat);
        const foundLng = parseFloat(data[0].lon);
        const displayName = data[0].display_name;
        handleSelect(foundLat, foundLng, displayName);
        setSearchFeedback(`Found: ${displayName.slice(0, 45)}...`);
      } else {
        setSearchFeedback('No matching location found. Please refine or click the map directly.');
      }
    } catch {
      setSearchFeedback('Geocoding service unavailable. You can click or drag directly on the map.');
    } finally {
      setIsSearching(false);
    }
  };

  const isValid =
    !isNaN(position[0]) &&
    !isNaN(position[1]) &&
    position[0] >= -90 &&
    position[0] <= 90 &&
    position[1] >= -180 &&
    position[1] <= 180 &&
    !(position[0] === 0 && position[1] === 0);

  return (
    <div className="space-y-3">
      {/* Search and Quick Presets */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearchAddress();
              }
            }}
            placeholder="Search city, locality, address or PIN code..."
            className="w-full pl-9 pr-24 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <button
            type="button"
            onClick={() => handleSearchAddress()}
            disabled={isSearching || !searchQuery.trim()}
            className="absolute right-1.5 top-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition"
          >
            {isSearching ? 'Locating...' : 'Locate Pin'}
          </button>
        </div>

        {/* Quick City Presets */}
        <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 px-1 flex items-center gap-0.5">
            <Compass className="w-3 h-3" /> Presets:
          </span>
          {CITY_PRESETS.map((city) => (
            <button
              key={city.name}
              type="button"
              onClick={() => handleSelect(city.lat, city.lng)}
              className="text-[11px] px-2 py-1 rounded-lg bg-slate-200/60 dark:bg-slate-800/80 hover:bg-cyan-500/10 hover:text-cyan-500 text-slate-600 dark:text-slate-400 transition"
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>

      {searchFeedback && (
        <p className="text-[11px] text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {searchFeedback}
        </p>
      )}

      {/* Map Container */}
      <div className={`relative z-0 border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
        <MapContainer
          center={position}
          zoom={12}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController position={position} onSelect={(lat, lng) => handleSelect(lat, lng)} />
        </MapContainer>

        {/* Floating coordinates badge */}
        <div className="absolute bottom-2 left-2 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 shadow-md border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2">
          {isValid ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <Check className="w-3.5 h-3.5" /> Valid Coordinates:
            </span>
          ) : (
            <span className="flex items-center gap-1 text-rose-500 font-semibold">
              <AlertCircle className="w-3.5 h-3.5" /> Invalid Coordinates:
            </span>
          )}
          <span>Lat: {position[0].toFixed(5)}, Lng: {position[1].toFixed(5)}</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">(Click or drag pin to adjust)</span>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
