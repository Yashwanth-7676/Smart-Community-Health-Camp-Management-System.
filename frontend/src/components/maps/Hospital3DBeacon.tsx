// src/components/maps/Hospital3DBeacon.tsx
import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ReferralHospital } from './referralFacilities';
import { MapProjectionConfig, projectLatLngTo3D } from './Geographic3DTerrain';
import { Building2, Phone, ShieldCheck, HeartPulse, ExternalLink } from 'lucide-react';

interface Hospital3DBeaconProps {
  hospital: ReferralHospital;
  projection: MapProjectionConfig;
  prefersReducedMotion?: boolean;
}

export const Hospital3DBeacon: React.FC<Hospital3DBeaconProps> = ({
  hospital,
  projection,
  prefersReducedMotion = false,
}) => {
  const [hovered, setHovered] = useState(false);
  const haloRef = useRef<THREE.Mesh>(null);

  const [x, , z] = useMemo(
    () => projectLatLngTo3D(hospital.latitude, hospital.longitude, projection),
    [hospital.latitude, hospital.longitude, projection]
  );

  useFrame((_, delta) => {
    if (prefersReducedMotion) return;
    if (haloRef.current) {
      haloRef.current.rotation.z += delta * 1.2;
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* 1. Base Bevel Disc */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.42, 0.55, 0.08, 16]} />
        <meshStandardMaterial
          color="#0369a1"
          roughness={0.2}
          metalness={0.8}
          emissive="#0284c7"
          emissiveIntensity={hovered ? 0.8 : 0.3}
        />
      </mesh>

      {/* 2. Pulsing Blue Halo Ring */}
      <mesh
        ref={haloRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.08, 0]}
      >
        <ringGeometry args={[0.55, 0.72, 24]} />
        <meshBasicMaterial
          color="#38bdf8"
          side={THREE.DoubleSide}
          transparent
          opacity={hovered ? 0.85 : 0.45}
        />
      </mesh>

      {/* 3. Central Vertical Cross Pillar (Cross Icon Shape) */}
      <group
        position={[0, 0.8, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
        onClick={(e) => {
          e.stopPropagation();
          setHovered(!hovered);
        }}
      >
        {/* Vertical Bar */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.22, 1.2, 0.15]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={hovered ? 1.4 : 0.8}
            roughness={0.1}
          />
        </mesh>

        {/* Horizontal Bar */}
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.7, 0.24, 0.15]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={hovered ? 1.4 : 0.8}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* 4. Interactive Floating Tooltip */}
      {hovered && (
        <Html position={[0, 2.2, 0]} center distanceFactor={14}>
          <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-sky-400/50 backdrop-blur-xl pointer-events-auto min-w-[240px] text-xs space-y-1.5 -translate-y-2 transition-all">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800 flex items-center gap-1">
                <Building2 className="w-2.5 h-2.5" />
                Referral Facility
              </span>
              {hospital.emergencyServices && (
                <span className="text-[9px] font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-800">
                  24/7 Trauma
                </span>
              )}
            </div>

            <div>
              <p className="font-extrabold text-white text-xs leading-tight">
                {hospital.name}
              </p>
              <p className="text-[10px] text-slate-400">{hospital.district} • {hospital.type}</p>
            </div>

            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800 text-slate-300">
              <span className="flex items-center gap-1">
                <HeartPulse className="w-3 h-3 text-sky-400" />
                {hospital.beds} Inpatient Beds
              </span>
              <a
                href={`tel:${hospital.phone}`}
                className="text-sky-400 hover:underline flex items-center gap-0.5"
              >
                <Phone className="w-2.5 h-2.5" /> Call
              </a>
            </div>

            {hospital.specialties && hospital.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {hospital.specialties.slice(0, 3).map((sp) => (
                  <span
                    key={sp}
                    className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-sky-300"
                  >
                    {sp}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

export default Hospital3DBeacon;
