// src/components/maps/LocationPicker.tsx
import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  onLocationSelect: (lat: number, lng: number) => void;
  className?: string;
}

const LocationMarker: React.FC<{
  position: [number, number];
  onSelect: (lat: number, lng: number) => void;
}> = ({ position, onSelect }) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return <Marker position={position} icon={markerIcon} />;
};

export const LocationPicker: React.FC<LocationPickerProps> = ({
  initialLat = 12.9716,
  initialLng = 77.5946,
  onLocationSelect,
  className = 'h-72 w-full rounded-xl overflow-hidden',
}) => {
  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng]);

  const handleSelect = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationSelect(lat, lng);
  };

  return (
    <div className={`relative z-0 border border-slate-200 dark:border-slate-800 ${className}`}>
      <MapContainer
        center={position}
        zoom={12}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} onSelect={handleSelect} />
      </MapContainer>
      <div className="absolute bottom-2 left-2 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm border border-slate-200/60 dark:border-slate-800/60">
        Lat: {position[0].toFixed(4)}, Lng: {position[1].toFixed(4)} (Click map to pin)
      </div>
    </div>
  );
};

export default LocationPicker;

