// frontend/src/components/maps/Healthcare3DMarkers.tsx
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { HealthcareFacility } from './healthcareFacilities';
import { MapProjectionConfig, projectLatLngTo3D } from './Geographic3DTerrain';
import { MapCamp } from '@/pages/camps/CampMapPage';
import { Stethoscope, Building2, Crosshair, Navigation, Activity, Sparkles, CheckCircle, Clock } from 'lucide-react';

// Shared status color mappings
export const HEALTHCARE_TYPE_COLORS: Record<string, { base: string; glow: string; text: string }> = {
  HOSPITAL: { base: '#ef4444', glow: '#f87171', text: 'text-red-400' },
  REFERRAL_CENTRE: { base: '#8b5cf6', glow: '#a78bfa', text: 'text-purple-400' },
  PHC: { base: '#10b981', glow: '#34d399', text: 'text-emerald-400' },
  CLINIC: { base: '#06b6d4', glow: '#22d3ee', text: 'text-cyan-400' },
  MOBILE_UNIT: { base: '#f59e0b', glow: '#fbbf24', text: 'text-amber-400' },
};

// -------------------------------------------------------------
// 1. HOSPITAL 3D TOWER MARKER
// -------------------------------------------------------------
interface Hospital3DMarkerProps {
  facility: HealthcareFacility;
  projection: MapProjectionConfig;
  isSelected: boolean;
  onSelect: (facility: HealthcareFacility) => void;
  hoveredFacilityId: string | null;
  onHover: (id: string | null) => void;
}

export const Hospital3DMarker: React.FC<Hospital3DMarkerProps> = ({
  facility,
  projection,
  isSelected,
  onSelect,
  hoveredFacilityId,
  onHover,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const beaconRef = useRef<THREE.Mesh>(null);

  const [x, y, z] = useMemo(
    () => projectLatLngTo3D(facility.latitude, facility.longitude, projection),
    [facility.latitude, facility.longitude, projection]
  );

  const isHovered = hoveredFacilityId === facility.id;
  const isReferral = facility.type === 'REFERRAL_CENTRE';
  const colorScheme = isReferral ? HEALTHCARE_TYPE_COLORS.REFERRAL_CENTRE : HEALTHCARE_TYPE_COLORS.HOSPITAL;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.8;
      const s = 1 + Math.sin(t * 2) * 0.08;
      ringRef.current.scale.set(s, s, s);
    }
    if (beaconRef.current) {
      (beaconRef.current.material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.sin(t * 3) * 0.3;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[x, y + 0.02, z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(facility);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        onHover(facility.id);
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
        onHover(null);
      }}
    >
      {/* Base Foundation Plinth */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.38, 0.42, 0.1, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
      </mesh>

      {/* Main Multi-Tier Medical Tower */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.35, 0.7, 0.35]} />
        <meshStandardMaterial
          color={isSelected ? '#38bdf8' : colorScheme.base}
          emissive={colorScheme.base}
          emissiveIntensity={isSelected ? 0.7 : 0.25}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Upper Skyscraper Tier / Heliport Floor */}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[0.26, 0.22, 0.26]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* Rooftop Helipad Ring */}
      <mesh ref={ringRef} position={[0, 1.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.22, 24]} />
        <meshBasicMaterial color={colorScheme.glow} side={THREE.DoubleSide} transparent opacity={0.85} />
      </mesh>

      {/* Skyward Medical Laser Beacon */}
      <mesh ref={beaconRef} position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.025, 0.04, 1.2, 8]} />
        <meshBasicMaterial color={colorScheme.glow} transparent opacity={0.5} />
      </mesh>

      {/* Floating 3D Cross Hologram */}
      <group position={[0, 1.15, 0]}>
        <mesh>
          <boxGeometry args={[0.18, 0.05, 0.04]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh>
          <boxGeometry args={[0.05, 0.18, 0.04]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* Hover / Selection HTML Billboard */}
      {(isHovered || isSelected) && (
        <Html position={[0, 2.2, 0]} center distanceFactor={14}>
          <div className="pointer-events-none px-3 py-2 rounded-xl bg-slate-950/95 border border-cyan-500/50 shadow-2xl backdrop-blur-md min-w-[200px] text-center transform -translate-y-2 transition-all">
            <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-red-400">
              <Building2 className="w-3 h-3 text-red-400" />
              <span>{facility.typeLabel}</span>
            </div>
            <div className="text-xs font-extrabold text-white truncate mt-0.5">{facility.name}</div>
            <div className="text-[10px] text-slate-300 mt-0.5 flex items-center justify-center gap-2">
              <span>{facility.district}</span>
              {facility.beds && <span className="text-cyan-400 font-bold">• {facility.beds} Beds</span>}
            </div>
            <div className="text-[9px] text-emerald-400 font-semibold mt-1 flex items-center justify-center gap-1">
              <Activity className="w-2.5 h-2.5" />
              <span>{facility.operatingHours}</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// -------------------------------------------------------------
// 2. PRIMARY HEALTHCARE CENTRE (PHC) 3D MARKER
// -------------------------------------------------------------
interface PHC3DMarkerProps {
  facility: HealthcareFacility;
  projection: MapProjectionConfig;
  isSelected: boolean;
  onSelect: (facility: HealthcareFacility) => void;
  hoveredFacilityId: string | null;
  onHover: (id: string | null) => void;
}

export const PHC3DMarker: React.FC<PHC3DMarkerProps> = ({
  facility,
  projection,
  isSelected,
  onSelect,
  hoveredFacilityId,
  onHover,
}) => {
  const ringRef = useRef<THREE.Mesh>(null);
  const isHovered = hoveredFacilityId === facility.id;

  const [x, y, z] = useMemo(
    () => projectLatLngTo3D(facility.latitude, facility.longitude, projection),
    [facility.latitude, facility.longitude, projection]
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.z = -t * 1.2;
      const pulse = 1 + Math.sin(t * 3) * 0.12;
      ringRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group
      position={[x, y + 0.02, z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(facility);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        onHover(facility.id);
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
        onHover(null);
      }}
    >
      {/* Hexagonal Pavilion Base */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.26, 0.3, 0.08, 6]} />
        <meshStandardMaterial color="#064e3b" roughness={0.5} />
      </mesh>

      {/* Clinic Pavilion Body */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.35, 6]} />
        <meshStandardMaterial
          color={isSelected ? '#38bdf8' : '#10b981'}
          emissive="#10b981"
          emissiveIntensity={isSelected ? 0.8 : 0.35}
          roughness={0.4}
        />
      </mesh>

      {/* Emerald Energy Ring */}
      <mesh ref={ringRef} position={[0, 0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.16, 0.24, 18]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>

      {/* Mini Cross */}
      <group position={[0, 0.55, 0]}>
        <mesh>
          <boxGeometry args={[0.12, 0.035, 0.03]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh>
          <boxGeometry args={[0.035, 0.12, 0.03]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* Hover / Selection HTML Billboard */}
      {(isHovered || isSelected) && (
        <Html position={[0, 1.2, 0]} center distanceFactor={14}>
          <div className="pointer-events-none px-3 py-1.5 rounded-xl bg-slate-950/95 border border-emerald-500/50 shadow-2xl backdrop-blur-md min-w-[180px] text-center transform -translate-y-2 transition-all">
            <div className="flex items-center justify-center gap-1 text-[9px] uppercase font-bold tracking-wider text-emerald-400">
              <Stethoscope className="w-2.5 h-2.5 text-emerald-400" />
              <span>Primary Health Centre</span>
            </div>
            <div className="text-xs font-bold text-white truncate mt-0.5">{facility.name}</div>
            <div className="text-[10px] text-slate-300 mt-0.5">{facility.district}</div>
            <div className="text-[9px] text-cyan-400 mt-0.5">{facility.operatingHours}</div>
          </div>
        </Html>
      )}
    </group>
  );
};

// -------------------------------------------------------------
// 3. COMMUNITY HEALTH CLINIC 3D MARKER
// -------------------------------------------------------------
export const Clinic3DMarker: React.FC<PHC3DMarkerProps> = ({
  facility,
  projection,
  isSelected,
  onSelect,
  hoveredFacilityId,
  onHover,
}) => {
  const isHovered = hoveredFacilityId === facility.id;
  const [x, y, z] = useMemo(
    () => projectLatLngTo3D(facility.latitude, facility.longitude, projection),
    [facility.latitude, facility.longitude, projection]
  );

  return (
    <group
      position={[x, y + 0.02, z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(facility);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        onHover(facility.id);
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
        onHover(null);
      }}
    >
      <mesh position={[0, 0.14, 0]} castShadow>
        <boxGeometry args={[0.2, 0.28, 0.2]} />
        <meshStandardMaterial
          color={isSelected ? '#38bdf8' : '#06b6d4'}
          emissive="#06b6d4"
          emissiveIntensity={isSelected ? 0.8 : 0.4}
        />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {(isHovered || isSelected) && (
        <Html position={[0, 0.9, 0]} center distanceFactor={14}>
          <div className="pointer-events-none px-2.5 py-1.5 rounded-lg bg-slate-950/95 border border-cyan-500/50 shadow-xl backdrop-blur-md min-w-[160px] text-center">
            <div className="text-[9px] uppercase font-bold text-cyan-400">Community Clinic</div>
            <div className="text-xs font-bold text-white truncate">{facility.name}</div>
            <div className="text-[10px] text-slate-300">{facility.district}</div>
          </div>
        </Html>
      )}
    </group>
  );
};

// -------------------------------------------------------------
// 4. MOBILE MEDICAL UNIT (MMU) 3D VEHICLE MARKER
// -------------------------------------------------------------
interface MobileUnit3DMarkerProps {
  unit: HealthcareFacility;
  projection: MapProjectionConfig;
  isSelected: boolean;
  onSelect: (unit: HealthcareFacility) => void;
  hoveredFacilityId: string | null;
  onHover: (id: string | null) => void;
}

export const MobileUnit3DMarker: React.FC<MobileUnit3DMarkerProps> = ({
  unit,
  projection,
  isSelected,
  onSelect,
  hoveredFacilityId,
  onHover,
}) => {
  const vanGroup = useRef<THREE.Group>(null);
  const flasherRef = useRef<THREE.Mesh>(null);
  const isHovered = hoveredFacilityId === unit.id;

  const [x, y, z] = useMemo(
    () => projectLatLngTo3D(unit.latitude, unit.longitude, projection),
    [unit.latitude, unit.longitude, projection]
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (flasherRef.current) {
      (flasherRef.current.material as THREE.MeshBasicMaterial).opacity = Math.sin(t * 8) > 0 ? 0.95 : 0.2;
    }
  });

  return (
    <group
      ref={vanGroup}
      position={[x, y + 0.03, z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(unit);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        onHover(unit.id);
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
        onHover(null);
      }}
    >
      {/* 3D Medical Van Chassis */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[0.34, 0.14, 0.18]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Van Cab & Windshield */}
      <mesh position={[0.1, 0.16, 0]}>
        <boxGeometry args={[0.12, 0.1, 0.16]} />
        <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Ambulance Emergency Flasher */}
      <mesh ref={flasherRef} position={[0, 0.23, 0]}>
        <boxGeometry args={[0.08, 0.04, 0.06]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.9} />
      </mesh>

      {/* Wheels */}
      {[-0.1, 0.1].map((wx, i) => (
        <group key={`wheels-${i}`} position={[wx, 0.03, 0]}>
          <mesh position={[0, 0, 0.09]}>
            <cylinderGeometry args={[0.04, 0.04, 0.03, 12]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0, 0, -0.09]}>
            <cylinderGeometry args={[0.04, 0.04, 0.03, 12]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        </group>
      ))}

      {/* Transit Pulse Ring */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.28, 16]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {(isHovered || isSelected) && (
        <Html position={[0, 0.8, 0]} center distanceFactor={14}>
          <div className="pointer-events-none px-3 py-1.5 rounded-xl bg-slate-950/95 border border-amber-500/50 shadow-2xl backdrop-blur-md min-w-[200px] text-center">
            <div className="flex items-center justify-center gap-1 text-[9px] uppercase font-bold tracking-wider text-amber-400">
              <Navigation className="w-2.5 h-2.5 text-amber-400" />
              <span>{unit.typeLabel}</span>
            </div>
            <div className="text-xs font-bold text-white truncate">{unit.name}</div>
            <div className="text-[10px] text-amber-300 font-semibold mt-0.5">
              Status: {unit.operationalStatus} {unit.speedKmH ? `• ${unit.speedKmH} km/h` : ''}
            </div>
            <div className="text-[9px] text-slate-300">{unit.operatingHours}</div>
          </div>
        </Html>
      )}
    </group>
  );
};
