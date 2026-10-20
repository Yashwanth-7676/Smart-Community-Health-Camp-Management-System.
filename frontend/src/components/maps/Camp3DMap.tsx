// src/components/maps/Camp3DMap.tsx
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import { MapCamp } from '@/pages/camps/CampMapPage';
import { RotateCcw, AlertTriangle, Info, MapPin, Users, Calendar } from 'lucide-react';
import { formatDate } from '@/utils/helpers';

interface Camp3DMapProps {
  camps: MapCamp[];
  selectedCamp: MapCamp | null;
  onSelectCamp: (camp: MapCamp) => void;
  userCoords?: [number, number] | null;
}

// Coordinate projection from (lat, lng) to 3D world space (x, z)
// Centered around Karnataka geographic midpoint (~14.5° N, ~76.5° E)
function projectCoordsTo3D(lat: number, lng: number): [number, number, number] {
  const centerLat = 14.5;
  const centerLng = 76.5;
  const scale = 3.6;
  const x = (lng - centerLng) * scale;
  const z = -(lat - centerLat) * scale;
  return [x, 0, z];
}

// Individual 3D Pillar for a health camp
function CampPillar({
  camp,
  isSelected,
  onSelect,
}: {
  camp: MapCamp;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const [x, , z] = useMemo(
    () => projectCoordsTo3D(camp.latitude, camp.longitude),
    [camp.latitude, camp.longitude]
  );

  // Pillar height proportional to capacity / attendance
  const height = useMemo(() => {
    const base = Math.max(1.2, Math.min(6.5, (camp.capacity || 100) / 32));
    return base;
  }, [camp.capacity]);

  // Color scheme matching camp status
  const color = useMemo(() => {
    if (camp.status === 'ONGOING') return '#10b981'; // Emerald
    if (camp.status === 'CANCELLED') return '#ef4444'; // Red
    if (camp.isFullyBooked) return '#f59e0b'; // Amber
    return '#06b6d4'; // Cyan
  }, [camp.status, camp.isFullyBooked]);

  // Subtle pulsing animation on frame
  useFrame((state, delta) => {
    if (ringRef.current && (camp.status === 'ONGOING' || isSelected)) {
      ringRef.current.rotation.y += delta * 1.5;
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Base Foundation Disc */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.5, 0.65, 0.1, 16]} />
        <meshStandardMaterial
          color={isSelected ? '#ffffff' : color}
          roughness={0.4}
          metalness={0.6}
          emissive={color}
          emissiveIntensity={isSelected ? 0.6 : 0.2}
        />
      </mesh>

      {/* Main Vertical Capacity Pillar */}
      <mesh
        ref={meshRef}
        position={[0, height / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.22, 0.28, height, 16]} />
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.7}
          transparent={true}
          opacity={hovered || isSelected ? 0.95 : 0.8}
          emissive={color}
          emissiveIntensity={hovered || isSelected ? 0.8 : 0.3}
        />
      </mesh>

      {/* Beacon Crown Sphere */}
      <mesh position={[0, height + 0.3, 0]}>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={color}
          emissiveIntensity={isSelected ? 1.5 : 0.9}
        />
      </mesh>

      {/* Pulsing Aura Ring */}
      {(camp.status === 'ONGOING' || isSelected || hovered) && (
        <mesh ref={ringRef} position={[0, height + 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.45, 0.65, 32]} />
          <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.7} />
        </mesh>
      )}

      {/* HTML Hover Card Overlay */}
      {(hovered || isSelected) && (
        <Html position={[0, height + 1.2, 0]} center distanceFactor={12}>
          <div className="bg-slate-900/95 text-white p-3 rounded-2xl shadow-2xl border border-cyan-500/50 backdrop-blur-md pointer-events-none min-w-[200px] text-xs space-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                {camp.status}
              </span>
              <span className="text-[9px] text-emerald-400 font-bold">{camp.feeLabel}</span>
            </div>
            <p className="font-extrabold text-white text-xs leading-tight">{camp.name}</p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400" />
              {camp.location}
            </p>
            <p className="text-[10px] text-cyan-300 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {camp.registered} / {camp.capacity} Registered
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}

// 3D Terrain Grid & Regional Boundaries
function GeographicGridTerrain() {
  return (
    <group position={[0, -0.05, 0]}>
      {/* Stylized dark futuristic grid plane */}
      <gridHelper args={[40, 40, '#0e7490', '#1e293b']} position={[0, 0, 0]} />

      {/* Base circular map platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
        <cylinderGeometry args={[22, 22, 0.15, 64]} />
        <meshStandardMaterial color="#050c18" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Concentric geographic range rings */}
      {[6, 12, 18].map((radius, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[radius - 0.03, radius + 0.03, 64]} />
          <meshBasicMaterial color="#0891b2" transparent opacity={0.25} />
        </mesh>
      ))}
    </group>
  );
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

export const Camp3DMap: React.FC<Camp3DMapProps> = ({
  camps,
  selectedCamp,
  onSelectCamp,
  userCoords,
}) => {
  const controlsRef = useRef<any>(null);

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="relative w-full h-full bg-[#030712] overflow-hidden">
      {/* 3D Map Notice Badge */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-cyan-500/30 text-xs max-w-sm space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-bold flex items-center gap-1.5 text-cyan-400">
            <Info className="w-3.5 h-3.5" /> 3D Geographic Visualization
          </span>
          <span className="text-[10px] text-slate-400 font-mono">{camps.length} Pillars</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-snug">
          Pillar heights represent capacity and screening volume. Drag to rotate 360°, scroll to zoom, right-click to pan.
        </p>
      </div>

      {/* Reset Camera Button */}
      <button
        type="button"
        onClick={resetCamera}
        className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-white text-xs font-semibold border border-slate-700 shadow-md flex items-center gap-1.5 transition"
      >
        <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
        Reset View
      </button>

      {/* 3D Canvas with WebGL boundary */}
      <WebGLBoundary
        fallback={
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-white space-y-3">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
            <h3 className="text-base font-bold">3D WebGL Acceleration Unavailable</h3>
            <p className="text-xs text-slate-400 max-w-md">
              Your graphics hardware or browser does not currently support hardware-accelerated 3D WebGL rendering. You can continue using the high-performance 2D interactive map.
            </p>
          </div>
        }
      >
        <Canvas
          camera={{ position: [0, 16, 22], fov: 42 }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          {/* Lighting */}
          <ambientLight intensity={0.7} />
          <directionalLight position={[10, 20, 10]} intensity={1.2} />
          <pointLight position={[-10, 15, -10]} intensity={0.8} color="#22d3ee" />

          {/* Interactive Controls */}
          <OrbitControls
            ref={controlsRef}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={8}
            maxDistance={40}
            enableDamping
            dampingFactor={0.05}
          />

          {/* Terrain Grid */}
          <GeographicGridTerrain />

          {/* Real Camp 3D Pillars */}
          {camps.map((camp) => (
            <CampPillar
              key={camp.id}
              camp={camp}
              isSelected={selectedCamp?.id === camp.id}
              onSelect={() => onSelectCamp(camp)}
            />
          ))}
        </Canvas>
      </WebGLBoundary>

      {/* 3D Legend (Bottom-Left) */}
      <div className="absolute bottom-6 left-4 z-10 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-800 text-xs text-white hidden sm:block">
        <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400 block mb-1.5">
          3D Beacon Status
        </span>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300">Upcoming Camp</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">Ongoing Active Camp</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-300">Fully Booked Camp</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Camp3DMap;

