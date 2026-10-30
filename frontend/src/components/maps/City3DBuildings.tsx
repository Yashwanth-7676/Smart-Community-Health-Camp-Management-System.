// frontend/src/components/maps/City3DBuildings.tsx
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { MapProjectionConfig, projectLatLngTo3D } from './Geographic3DTerrain';

interface CityHubConfig {
  name: string;
  lat: number;
  lng: number;
  buildingCount: number;
  spreadKm: number;
  maxHeight: number;
  accentColor: string;
}

const URBAN_HUBS: CityHubConfig[] = [
  {
    name: 'Bengaluru Metropolitan Area',
    lat: 12.9716,
    lng: 77.5946,
    buildingCount: 38,
    spreadKm: 0.16,
    maxHeight: 1.25,
    accentColor: '#06b6d4',
  },
  {
    name: 'Mysuru Urban Hub',
    lat: 12.2958,
    lng: 76.6394,
    buildingCount: 18,
    spreadKm: 0.12,
    maxHeight: 0.85,
    accentColor: '#38bdf8',
  },
  {
    name: 'Mangaluru Coastal Port Cluster',
    lat: 12.9141,
    lng: 74.856,
    buildingCount: 16,
    spreadKm: 0.11,
    maxHeight: 0.75,
    accentColor: '#0ea5e9',
  },
  {
    name: 'Hubballi-Dharwad Twin City',
    lat: 15.3647,
    lng: 75.124,
    buildingCount: 16,
    spreadKm: 0.12,
    maxHeight: 0.78,
    accentColor: '#14b8a6',
  },
  {
    name: 'Belagavi Northern Hub',
    lat: 15.8497,
    lng: 74.4977,
    buildingCount: 12,
    spreadKm: 0.1,
    maxHeight: 0.65,
    accentColor: '#06b6d4',
  },
  {
    name: 'Kalaburagi Regional Hub',
    lat: 17.3297,
    lng: 76.8343,
    buildingCount: 12,
    spreadKm: 0.1,
    maxHeight: 0.65,
    accentColor: '#f59e0b',
  },
];

interface City3DBuildingsProps {
  projection: MapProjectionConfig;
  visible?: boolean;
}

export const City3DBuildings: React.FC<City3DBuildingsProps> = ({ projection, visible = true }) => {
  if (!visible) return null;

  // Generate deterministic building data per urban hub
  const buildings = useMemo(() => {
    const list: Array<{
      key: string;
      position: [number, number, number];
      args: [number, number, number];
      color: string;
      emissive: string;
      isTower: boolean;
    }> = [];

    URBAN_HUBS.forEach((hub) => {
      const [hubX, hubY, hubZ] = projectLatLngTo3D(hub.lat, hub.lng, projection);

      for (let i = 0; i < hub.buildingCount; i++) {
        // Deterministic pseudo-random offset
        const seed1 = Math.sin(i * 12.9898 + hub.lat) * 43758.5453;
        const seed2 = Math.cos(i * 78.233 + hub.lng) * 43758.5453;
        const frac1 = seed1 - Math.floor(seed1);
        const frac2 = seed2 - Math.floor(seed2);

        const angle = frac1 * Math.PI * 2;
        const radius = Math.sqrt(frac2) * hub.spreadKm * 3.8;

        const bx = hubX + Math.cos(angle) * radius;
        const bz = hubZ + Math.sin(angle) * radius;

        const width = 0.08 + (frac1 % 0.08);
        const depth = 0.08 + (frac2 % 0.08);
        const isTower = i % 5 === 0;
        const height = isTower ? hub.maxHeight * (0.8 + (frac1 % 0.4)) : 0.25 + (frac2 % 0.45);

        list.push({
          key: `${hub.name}-${i}`,
          position: [bx, hubY + height / 2, bz],
          args: [width, height, depth],
          color: isTower ? '#09233f' : '#04101e',
          emissive: isTower ? hub.accentColor : '#0369a1',
          isTower,
        });
      }
    });

    return list;
  }, [projection]);

  return (
    <group position={[0, 0.01, 0]}>
      {buildings.map((b) => (
        <mesh key={b.key} position={b.position} castShadow>
          <boxGeometry args={b.args} />
          <meshStandardMaterial
            color={b.color}
            emissive={b.emissive}
            emissiveIntensity={b.isTower ? 0.35 : 0.08}
            roughness={0.4}
            metalness={0.8}
          />
        </mesh>
      ))}
    </group>
  );
};

export default City3DBuildings;
