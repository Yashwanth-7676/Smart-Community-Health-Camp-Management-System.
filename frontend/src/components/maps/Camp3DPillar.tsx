// src/components/maps/Camp3DPillar.tsx
import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { MapCamp } from '@/pages/camps/CampMapPage';
import {
  MapProjectionConfig,
  projectLatLngTo3D,
} from './Geographic3DTerrain';
import { MapPin, Users, Activity, Sparkles } from 'lucide-react';

interface Camp3DPillarProps {
  camp: MapCamp;
  isSelected: boolean;
  onSelect: () => void;
  projection: MapProjectionConfig;
  prefersReducedMotion?: boolean;
}

export const Camp3DPillar: React.FC<Camp3DPillarProps> = ({
  camp,
  isSelected,
  onSelect,
  projection,
  prefersReducedMotion = false,
}) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const auraRingRef = useRef<THREE.Mesh>(null);
  const rippleRingRef = useRef<THREE.Mesh>(null);

  // Exact 3D Coordinate Calculation locked to ground plane
  const [x, , z] = useMemo(
    () => projectLatLngTo3D(camp.latitude, camp.longitude, projection),
    [camp.latitude, camp.longitude, projection]
  );

  // Height proportional to camp capacity / attendance scale:
  // Base 1.2 units + 0.035 units per patient capacity
  // 100 capacity = 4.7 units; 50 capacity = 2.95 units; 200 capacity = 8.2 units
  const height = useMemo(() => {
    const cap = camp.capacity || 100;
    return Math.max(1.5, Math.min(8.5, 1.2 + cap * 0.035));
  }, [camp.capacity]);

  // Color identity strictly matched to clinical live status
  const { color, emissiveColor } = useMemo(() => {
    if (camp.status === 'ONGOING') {
      return { color: '#10b981', emissiveColor: '#059669' }; // Emerald Active
    }
    if (camp.status === 'CANCELLED') {
      return { color: '#ef4444', emissiveColor: '#b91c1c' }; // Red Cancelled
    }
    if (camp.isFullyBooked) {
      return { color: '#f59e0b', emissiveColor: '#d97706' }; // Amber Booked
    }
    return { color: '#06b6d4', emissiveColor: '#0891b2' }; // Cyan Upcoming
  }, [camp.status, camp.isFullyBooked]);

  // Frame animations (rotation & subtle pulsing)
  useFrame((_, delta) => {
    if (prefersReducedMotion) return;

    if (auraRingRef.current && (camp.status === 'ONGOING' || isSelected || hovered)) {
      auraRingRef.current.rotation.z += delta * 1.8;
    }

    if (rippleRingRef.current) {
      const s = ((Date.now() % 2400) / 2400) * 1.8 + 0.6;
      rippleRingRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* 1. Base Foundation Disc */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.55, 0.72, 0.12, 24]} />
        <meshStandardMaterial
          color={isSelected ? '#ffffff' : '#0f172a'}
          roughness={0.25}
          metalness={0.8}
          emissive={isSelected ? '#ffffff' : emissiveColor}
          emissiveIntensity={isSelected ? 0.7 : 0.25}
        />
      </mesh>

      {/* 2. Concentric Ground Radar Ripple */}
      {(camp.status === 'ONGOING' || isSelected) && (
        <mesh
          ref={rippleRingRef}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.02, 0]}
        >
          <ringGeometry args={[0.7, 0.82, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={isSelected ? 0.6 : 0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 3. Glowing Main Vertical Capacity Pillar */}
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
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <cylinderGeometry args={[0.22, 0.3, height, 20]} />
        <meshStandardMaterial
          color={color}
          roughness={0.15}
          metalness={0.6}
          transparent={true}
          opacity={hovered || isSelected ? 0.98 : 0.85}
          emissive={emissiveColor}
          emissiveIntensity={hovered || isSelected ? 0.95 : 0.45}
        />
      </mesh>

      {/* 4. Top Crown Beacon Sphere */}
      <mesh position={[0, height + 0.35, 0]}>
        <sphereGeometry args={[0.34, 20, 20]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={color}
          emissiveIntensity={isSelected ? 1.8 : 1.1}
          roughness={0.1}
        />
      </mesh>

      {/* 5. Pulsing Aura Ring at Crown */}
      {(camp.status === 'ONGOING' || isSelected || hovered) && (
        <mesh
          ref={auraRingRef}
          position={[0, height + 0.35, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.5, 0.72, 32]} />
          <meshBasicMaterial
            color={color}
            side={THREE.DoubleSide}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* 6. Vertical Sky Light Column when Selected */}
      {isSelected && (
        <mesh position={[0, height + 9, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 18, 8]} />
          <meshBasicMaterial
            color="#22d3ee"
            transparent
            opacity={0.45}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* 7. Floating Quick Tooltip on Hover */}
      {(hovered || isSelected) && (
        <Html position={[0, height + 1.2, 0]} center distanceFactor={14}>
          <div className="bg-slate-900/95 text-white p-3 rounded-2xl shadow-2xl border border-cyan-500/50 backdrop-blur-md pointer-events-none min-w-[210px] text-xs space-y-1 transform -translate-y-2 transition-all">
            <div className="flex items-center justify-between gap-1">
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                  camp.status === 'ONGOING'
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    : camp.isFullyBooked
                    ? 'bg-amber-950 text-amber-400 border-amber-800'
                    : 'bg-cyan-950 text-cyan-400 border-cyan-800'
                }`}
              >
                {camp.status}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">{camp.feeLabel}</span>
            </div>

            <p className="font-extrabold text-white text-xs leading-tight line-clamp-1">
              {camp.name}
            </p>

            <p className="text-[10px] text-slate-300 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">{camp.location}</span>
            </p>

            <div className="flex items-center justify-between text-[10px] pt-0.5 border-t border-slate-800 text-cyan-300">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {camp.registered} / {camp.capacity} Booked
              </span>
              <span className="text-slate-400 font-mono">
                {camp.availableSlots} free
              </span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// -------------------------------------------------------------
// Cluster Pillar for National Overview View
// -------------------------------------------------------------
interface Camp3DClusterPillarProps {
  cluster: {
    center: [number, number];
    camps: MapCamp[];
    totalCapacity: number;
    totalRegistered: number;
  };
  projection: MapProjectionConfig;
  onExpandCluster: () => void;
}

export const Camp3DClusterPillar: React.FC<Camp3DClusterPillarProps> = ({
  cluster,
  projection,
  onExpandCluster,
}) => {
  const [hovered, setHovered] = useState(false);
  const [x, , z] = useMemo(
    () => projectLatLngTo3D(cluster.center[0], cluster.center[1], projection),
    [cluster.center, projection]
  );

  const clusterHeight = Math.min(8.0, 2.0 + cluster.camps.length * 0.9);

  return (
    <group position={[x, 0, z]}>
      {/* Cluster Hexagonal Base */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.9, 1.1, 0.16, 6]} />
        <meshStandardMaterial
          color="#0e7490"
          roughness={0.3}
          metalness={0.7}
          emissive="#0891b2"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Cluster Central Pillar */}
      <mesh
        position={[0, clusterHeight / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onExpandCluster();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <cylinderGeometry args={[0.45, 0.55, clusterHeight, 16]} />
        <meshStandardMaterial
          color="#06b6d4"
          roughness={0.2}
          metalness={0.6}
          transparent
          opacity={0.88}
          emissive="#0891b2"
          emissiveIntensity={hovered ? 0.9 : 0.5}
        />
      </mesh>

      {/* Floating Cluster Badge */}
      <Html position={[0, clusterHeight + 1.2, 0]} center distanceFactor={14}>
        <div
          onClick={onExpandCluster}
          className="bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-400 text-white px-3 py-1.5 rounded-full shadow-2xl backdrop-blur-md cursor-pointer flex items-center gap-1.5 whitespace-nowrap text-xs font-bold transition-all hover:scale-105"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span>
            {cluster.camps.length} Camps ({cluster.totalCapacity} Cap)
          </span>
        </div>
      </Html>
    </group>
  );
};

export default Camp3DPillar;

