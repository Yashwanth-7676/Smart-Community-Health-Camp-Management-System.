// frontend/src/components/maps/Geographic3DTerrain.tsx
import React, { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface MapProjectionConfig {
  centerLat: number;
  centerLng: number;
  scaleX: number;
  scaleZ: number;
  planeWidth: number;
  planeHeight: number;
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
}

export const KARNATAKA_PROJECTION: MapProjectionConfig = {
  centerLat: 14.8,
  centerLng: 76.2,
  scaleX: 4.8,
  scaleZ: 4.95,
  planeWidth: 26,
  planeHeight: 34,
  minLng: 73.49,
  maxLng: 78.91,
  minLat: 11.36,
  maxLat: 18.24,
};

export const INDIA_PROJECTION: MapProjectionConfig = {
  centerLat: 22.5,
  centerLng: 79.5,
  scaleX: 1.15,
  scaleZ: 1.2,
  planeWidth: 40,
  planeHeight: 40,
  minLng: 62.1,
  maxLng: 96.9,
  minLat: 5.8,
  maxLat: 39.2,
};

export function projectLatLngTo3D(
  lat: number,
  lng: number,
  config: MapProjectionConfig
): [number, number, number] {
  const x = (lng - config.centerLng) * config.scaleX;
  const z = -(lat - config.centerLat) * config.scaleZ;
  return [x, 0, z];
}

export function unproject3DToLatLng(
  x: number,
  z: number,
  config: MapProjectionConfig
): [number, number] {
  const lng = config.centerLng + x / config.scaleX;
  const lat = config.centerLat - z / config.scaleZ;
  return [lat, lng];
}

export interface MapLayerConfig {
  camps: boolean;
  facilities: boolean;
  districts: boolean;
  heatmap: boolean;
  hospitals: boolean;
  highways: boolean;
  population: boolean;
  accessibility: boolean;
  networkArcs: boolean;
  urbanBuildings: boolean;
}

interface Geographic3DTerrainProps {
  regionFocus: 'karnataka' | 'india';
  layers?: Partial<MapLayerConfig>;
  campsData?: Array<{ latitude: number; longitude: number; registered?: number; capacity?: number }>;
  terrainElevationScale?: number; // 0 for flat, 1.0 for normal, 1.5 for exaggerated
  isLowPower?: boolean;
}

interface GeoHub {
  name: string;
  lat: number;
  lng: number;
  isCapital?: boolean;
}

// Key verified Karnataka district hubs
export const KARNATAKA_DISTRICT_HUBS: GeoHub[] = [
  { name: 'Bengaluru Urban', lat: 12.9716, lng: 77.5946, isCapital: true },
  { name: 'Mysuru', lat: 12.2958, lng: 76.6394 },
  { name: 'Mangaluru', lat: 12.9141, lng: 74.856 },
  { name: 'Hubballi-Dharwad', lat: 15.3647, lng: 75.124 },
  { name: 'Belagavi', lat: 15.8497, lng: 74.4977 },
  { name: 'Kalaburagi', lat: 17.3297, lng: 76.8343 },
  { name: 'Ballari', lat: 15.1394, lng: 76.9214 },
  { name: 'Davanagere', lat: 14.4644, lng: 75.9218 },
  { name: 'Shivamogga', lat: 13.9299, lng: 75.5681 },
  { name: 'Tumakuru', lat: 13.3409, lng: 77.1006 },
  { name: 'Vijayapura', lat: 16.8302, lng: 75.71 },
  { name: 'Udupi', lat: 13.3409, lng: 74.7421 },
  { name: 'Bidar', lat: 17.9104, lng: 77.5199 },
  { name: 'Raichur', lat: 16.2076, lng: 77.3463 },
  { name: 'Hassan', lat: 13.0068, lng: 76.103 },
  { name: 'Chamarajanagar', lat: 11.9261, lng: 76.9437 },
];

export const INDIA_METRO_HUBS: GeoHub[] = [
  { name: 'Bengaluru (HQ)', lat: 12.9716, lng: 77.5946 },
  { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { name: 'New Delhi', lat: 28.6139, lng: 77.209 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
];

// Key Highway corridors connecting health camps
const HIGHWAY_CORRIDORS: Array<Array<[number, number]>> = [
  // NH 48: Pune -> Belagavi -> Hubballi -> Davanagere -> Tumakuru -> Bengaluru
  [
    [15.8497, 74.4977],
    [15.3647, 75.124],
    [14.79, 75.4],
    [14.4644, 75.9218],
    [14.23, 76.4],
    [13.3409, 77.1006],
    [12.9716, 77.5946],
  ],
  // NH 75: Mangaluru -> Hassan -> Kunigal -> Bengaluru
  [
    [12.9141, 74.856],
    [13.0068, 76.103],
    [12.9716, 77.5946],
  ],
  // NH 50 / North Corridor: Bidar -> Kalaburagi -> Vijayapura -> Hosapete
  [
    [17.9104, 77.5199],
    [17.3297, 76.8343],
    [16.8302, 75.71],
    [15.27, 76.39],
  ],
  // NH 66 Coastal Highway: Karwar -> Bhatkal -> Udupi -> Mangaluru
  [
    [14.81, 74.13],
    [13.98, 74.55],
    [13.3409, 74.7421],
    [12.9141, 74.856],
  ],
  // Bengaluru -> Mysuru Expressway
  [
    [12.9716, 77.5946],
    [12.52, 76.9],
    [12.2958, 76.6394],
  ],
];

// Karnataka Boundary Key Polygon
export const KARNATAKA_BOUNDARY: Array<[number, number]> = [
  [14.81, 74.13], // Karwar
  [14.3, 74.4],
  [13.98, 74.55], // Bhatkal
  [13.34, 74.74], // Udupi
  [12.87, 74.88], // Mangaluru
  [12.5, 75.1],
  [12.2, 75.5], // Kodagu border
  [11.75, 76.1],
  [11.6, 76.6], // Gundlupet
  [11.9, 77.0],
  [12.15, 77.1], // Kollegal
  [12.55, 77.4], // Kanakapura
  [12.7, 77.7], // Anekal
  [13.15, 78.58], // Mulbagal
  [13.4, 78.2],
  [13.78, 77.8], // Bagepalli
  [14.1, 77.27], // Pavagada
  [15.15, 76.92], // Ballari
  [15.63, 76.9], // Siruguppa
  [16.2, 77.35], // Raichur
  [16.76, 77.13], // Yadgir
  [17.18, 77.2], // Sedam
  [18.25, 77.43], // Aurad / Bidar
  [17.8, 76.9], // Humnabad
  [17.56, 76.56], // Aland
  [17.18, 75.96], // Indi
  [16.73, 75.06], // Athani
  [16.43, 74.59], // Chikodi
  [15.85, 74.5], // Belagavi
  [15.24, 74.62], // Dandeli
  [14.81, 74.13], // Karwar
];

export const Geographic3DTerrain: React.FC<Geographic3DTerrainProps> = ({
  regionFocus,
  layers = {
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
  },
  campsData = [],
  terrainElevationScale = 1.0,
  isLowPower = false,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  const projection = regionFocus === 'karnataka' ? KARNATAKA_PROJECTION : INDIA_PROJECTION;

  // Build authentic 3D terrain elevation geometry
  const terrainGeometry = useMemo(() => {
    // Segments: 72x72 for desktop, 36x36 for low power mode
    const segX = isLowPower ? 36 : 72;
    const segY = isLowPower ? 36 : 72;

    const geom = new THREE.PlaneGeometry(projection.planeWidth, projection.planeHeight, segX, segY);
    const pos = geom.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const localX = pos.getX(i);
      const localY = pos.getY(i);

      // Convert local coordinates to lat/lng
      const lng = projection.centerLng + localX / projection.scaleX;
      const lat = projection.centerLat + localY / projection.scaleZ;

      let elevation = 0.02;

      if (regionFocus === 'karnataka') {
        // 1. Arabian Sea Shelf (West of 74.6°E)
        if (lng < 74.55) {
          elevation = 0.0;
        } else {
          // 2. Western Ghats / Sahyadri Elevation Spine (lng between 74.8 and 75.8, lat between 11.5 and 16.0)
          const inGhatsLng = lng >= 74.75 && lng <= 75.85;
          const inGhatsLat = lat >= 11.6 && lat <= 16.2;

          if (inGhatsLng && inGhatsLat) {
            const distFromRidge = Math.abs(lng - 75.25);
            const ridgeHeight = Math.max(0, 1.0 - distFromRidge * 2.2);
            elevation = 0.35 + ridgeHeight * 0.75; // Peak up to 1.1 units
          } else if (lat < 13.8 && lng > 75.8 && lng < 78.2) {
            // 3. Southern Mysore / Bangalore Plateau (elevated 600m - 920m)
            elevation = 0.38 + Math.sin(lat * 3.5 + lng * 2.2) * 0.08;
          } else if (lat >= 15.5 && lng > 75.2) {
            // 4. Northern Plains (Kalaburagi / Vijayapura 350m - 500m)
            elevation = 0.2 + Math.cos(lat * 4.0) * 0.05;
          } else {
            // General hinterland
            elevation = 0.25;
          }
        }
      }

      // Local Z becomes 3D Y when plane is rotated [-Math.PI/2, 0, 0]
      pos.setZ(i, elevation * terrainElevationScale);
    }

    geom.computeVertexNormals();
    return geom;
  }, [projection, regionFocus, terrainElevationScale, isLowPower]);

  // Create High-Definition Geographic Map Texture
  const mapTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    const { minLng, maxLng, minLat, maxLat } = projection;

    const toCanvasX = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * canvas.width;
    const toCanvasY = (lat: number) => ((maxLat - lat) / (maxLat - minLat)) * canvas.height;

    // 1. Deep Space Midnight Background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Arabian Sea & Water Shelf
    if (regionFocus === 'karnataka') {
      const seaGrad = ctx.createLinearGradient(0, 0, toCanvasX(74.6), 0);
      seaGrad.addColorStop(0, '#01030d');
      seaGrad.addColorStop(0.7, '#020b1e');
      seaGrad.addColorStop(1, '#041630');

      ctx.fillStyle = seaGrad;
      ctx.fillRect(0, 0, toCanvasX(74.7), canvas.height);

      // Coastal Neon Wave
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(toCanvasX(74.13), toCanvasY(14.81));
      ctx.lineTo(toCanvasX(74.55), toCanvasY(13.98));
      ctx.lineTo(toCanvasX(74.74), toCanvasY(13.34));
      ctx.lineTo(toCanvasX(74.88), toCanvasY(12.87));
      ctx.stroke();
    }

    // 3. Coordinate Graticule Grid
    ctx.strokeStyle = 'rgba(14, 116, 144, 0.16)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);

    for (let lng = Math.ceil(minLng); lng <= Math.floor(maxLng); lng++) {
      const cx = toCanvasX(lng);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, canvas.height);
      ctx.stroke();

      ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
      ctx.font = '18px monospace';
      ctx.fillText(`${lng}°E`, cx + 6, canvas.height - 24);
    }

    for (let lat = Math.ceil(minLat); lat <= Math.floor(maxLat); lat++) {
      const cy = toCanvasY(lat);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(canvas.width, cy);
      ctx.stroke();

      ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
      ctx.font = '18px monospace';
      ctx.fillText(`${lat}°N`, 24, cy - 6);
    }
    ctx.setLineDash([]);

    // 4. Territory Boundary Lines
    if (layers.districts && regionFocus === 'karnataka') {
      ctx.beginPath();
      KARNATAKA_BOUNDARY.forEach(([lat, lng], idx) => {
        const x = toCanvasX(lng);
        const y = toCanvasY(lat);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();

      // Territory Subtle Cyberpunk Glow
      ctx.fillStyle = 'rgba(6, 182, 212, 0.06)';
      ctx.fill();

      // Glowing Boundary
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 5. Road Transportation Corridors
    if (layers.highways) {
      HIGHWAY_CORRIDORS.forEach((corridor) => {
        ctx.beginPath();
        corridor.forEach(([lat, lng], i) => {
          const x = toCanvasX(lng);
          const y = toCanvasY(lat);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.45)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      });
    }

    // 6. Camp Coverage Heatmap Layer
    if (layers.heatmap && campsData && campsData.length > 0) {
      campsData.forEach((camp) => {
        if (!camp.latitude || !camp.longitude) return;
        const cx = toCanvasX(camp.longitude);
        const cy = toCanvasY(camp.latitude);
        const reg = camp.registered || 60;
        const radius = Math.max(50, Math.min(140, 50 + (reg / 150) * 80));

        const heatGrad = ctx.createRadialGradient(cx, cy, 6, cx, cy, radius);
        heatGrad.addColorStop(0, 'rgba(245, 158, 11, 0.42)');
        heatGrad.addColorStop(0.35, 'rgba(16, 185, 129, 0.25)');
        heatGrad.addColorStop(0.7, 'rgba(6, 182, 212, 0.12)');
        heatGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

        ctx.fillStyle = heatGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 7. Verified District Hub Beacons & Typography
    if (layers.districts) {
      const hubs = regionFocus === 'karnataka' ? KARNATAKA_DISTRICT_HUBS : INDIA_METRO_HUBS;
      hubs.forEach((hub) => {
        const hx = toCanvasX(hub.lng);
        const hy = toCanvasY(hub.lat);

        ctx.beginPath();
        ctx.arc(hx, hy, hub.isCapital ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = hub.isCapital ? '#38bdf8' : '#06b6d4';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(hx, hy, hub.isCapital ? 14 : 10, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = hub.isCapital ? '#ffffff' : '#94a3b8';
        ctx.font = hub.isCapital ? 'bold 22px system-ui, sans-serif' : '500 18px system-ui, sans-serif';
        ctx.fillText(hub.name, hx + 14, hy + 6);
      });
    }

    // 8. Attributions & Metadata Notice
    ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.font = '16px monospace';
    ctx.fillText('SMART HEALTHCARE 3D DIGITAL TWIN 3.0', 40, 50);
    ctx.fillText('GEOSPATIAL DATA © OPENSTREETMAP, CARTO, KARNATAKA DHFW', 40, 75);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    textureRef.current = tex;

    return tex;
  }, [regionFocus, layers, campsData, projection]);

  useEffect(() => {
    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
  }, [mapTexture]);

  return (
    <group position={[0, -0.05, 0]}>
      {/* 1. Real 3D Topographical Surface Plane */}
      <mesh
        ref={meshRef}
        geometry={terrainGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        position={[0, 0, 0]}
      >
        <meshStandardMaterial
          map={mapTexture || undefined}
          color="#ffffff"
          roughness={0.7}
          metalness={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Sleek Dark Metallic Chassis Base underneath */}
      <mesh position={[0, -0.32, 0]}>
        <boxGeometry args={[projection.planeWidth + 0.6, 0.55, projection.planeHeight + 0.6]} />
        <meshStandardMaterial color="#020617" roughness={0.6} metalness={0.8} />
      </mesh>

      {/* 3. Outer Glowing Cyan Chassis Trim */}
      <lineSegments position={[0, -0.04, 0]}>
        <edgesGeometry
          args={[new THREE.BoxGeometry(projection.planeWidth + 0.62, 0.56, projection.planeHeight + 0.62)]}
        />
        <lineBasicMaterial color="#06b6d4" transparent opacity={0.35} />
      </lineSegments>

      {/* 4. Concentric Spatial Radar Rings */}
      {[5, 10, 16].map((r, i) => (
        <mesh key={`ring-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[r - 0.02, r + 0.02, 64]} />
          <meshBasicMaterial color="#0891b2" transparent opacity={0.12} />
        </mesh>
      ))}
    </group>
  );
};

export default Geographic3DTerrain;
