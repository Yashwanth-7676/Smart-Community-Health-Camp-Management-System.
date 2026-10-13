// src/components/maps/CampMap.tsx
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Camp } from '@/types';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users } from 'lucide-react';
import { formatDate } from '@/utils/helpers';

// Fix Leaflet default icon issues with Webpack/Vite
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface CampMapProps {
  camps: Camp[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  selectedCampId?: string;
}

const FitBounds: React.FC<{ camps: Camp[] }> = ({ camps }) => {
  const map = useMap();
  useEffect(() => {
    if (camps.length > 0) {
      const validPoints = camps
        .filter((c) => c.coordinates?.lat && c.coordinates?.lng)
        .map((c) => [c.coordinates.lat, c.coordinates.lng] as [number, number]);

      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    }
  }, [camps, map]);

  return null;
};

export const CampMap: React.FC<CampMapProps> = ({
  camps,
  center = [12.9716, 77.5946], // Default Bengaluru
  zoom = 11,
  className = 'h-[450px] w-full rounded-2xl overflow-hidden',
  selectedCampId,
}) => {
  return (
    <div className={`relative z-0 ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds camps={camps} />

        {camps.map((camp) => {
          const lat = camp.coordinates?.lat || (camp as any).latitude;
          const lng = camp.coordinates?.lng || (camp as any).longitude;
          if (!lat || !lng) return null;

          return (
            <Marker key={camp.id} position={[lat, lng]} icon={defaultIcon}>
              <Popup className="custom-camp-popup">
                <div className="p-1 min-w-[200px]">
                  <h4 className="font-bold text-sm text-slate-900 mb-1">{camp.name}</h4>
                  <div className="text-xs text-slate-600 space-y-1 mb-3">
                    <p className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                      {camp.location}
                    </p>
                    <p className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                      {formatDate(camp.startDate)}
                    </p>
                    <p className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-cyan-600" />
                      {camp.registeredCount || (camp as any).registered || 0} / {camp.maxCapacity || (camp as any).capacity || 100} Registered
                    </p>
                  </div>
                  <Link
                    to={`/camps/${camp.id}`}
                    className="block w-full text-center py-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    View Camp Details
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default CampMap;

