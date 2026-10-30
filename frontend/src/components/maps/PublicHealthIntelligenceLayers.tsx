// frontend/src/components/maps/PublicHealthIntelligenceLayers.tsx
/**
 * MEGA UPGRADE 5.0 — MODULE 1 & 11: 3D PUBLIC HEALTH INTELLIGENCE LAYERS
 * 3D glowing epidemiological pillars & K-anonymity compliance visualization
 */

import React from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { KARNATAKA_DISTRICTS_DATA, DistrictDemographics } from './karnatakaDistrictsData';
import { projectLatLngTo3D, MapProjectionConfig } from './Geographic3DTerrain';

interface PublicHealthIntelligenceLayersProps {
  projection: MapProjectionConfig;
  visible?: boolean;
  onSelectDistrict?: (district: DistrictDemographics) => void;
  selectedDistrictId?: string | null;
}

export const PublicHealthIntelligenceLayers: React.FC<PublicHealthIntelligenceLayersProps> = ({
  projection,
  visible = true,
  onSelectDistrict,
  selectedDistrictId,
}) => {
  if (!visible) return null;

  return (
    <group name="PublicHealthIntelligenceLayers">
      {KARNATAKA_DISTRICTS_DATA.map((district) => {
        const [px, py, pz] = projectLatLngTo3D(district.latitude, district.longitude, projection);
        const isSelected = selectedDistrictId === district.districtId;

        // Pillar height scaled by historical attendance turnout
        const height = Math.max(0.4, Math.min(2.8, (district.historicalAttendance / 5500) * 0.9));

        // Color based on accessibility & underserved classification
        const color = district.underservedStatus
          ? '#f43f5e' // Rose for underserved
          : district.healthcareAccessibilityIndex >= 85
          ? '#14b8a6' // Teal for well served
          : '#38bdf8'; // Sky cyan for moderate

        return (
          <group
            key={district.districtId}
            position={[px, py + height / 2, pz]}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectDistrict) onSelectDistrict(district);
            }}
          >
            {/* 3D Epidemiological Beacon Pillar */}
            <mesh>
              <cylinderGeometry args={[0.07, 0.09, height, 16]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isSelected ? 0.95 : 0.55}
                transparent
                opacity={0.85}
              />
            </mesh>

            {/* Base concentric pulse ring */}
            <mesh position={[0, -height / 2 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.22, 0.28, 24]} />
              <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>

            {/* Floating Top Beacon */}
            <mesh position={[0, height / 2 + 0.08, 0]}>
              <octahedronGeometry args={[0.1, 0]} />
              <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={1.2} />
            </mesh>

            {/* HTML Annotation on Selection */}
            {isSelected && (
              <Html position={[0, height / 2 + 0.5, 0]} center distanceFactor={14}>
                <div className="pointer-events-none px-3 py-2 rounded-xl bg-slate-950/95 border border-cyan-400/60 shadow-2xl backdrop-blur-md text-center min-w-[190px]">
                  <div className="text-[9px] uppercase font-bold text-cyan-400 tracking-wider">
                    Public Health Intelligence
                  </div>
                  <div className="text-xs font-bold text-white truncate">{district.name}</div>
                  <div className="text-[10px] text-slate-300 mt-0.5">
                    Attendance: <strong className="text-cyan-300">{district.historicalAttendance.toLocaleString()}</strong>
                  </div>
                  <div className="text-[9px] text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
                    Access: {district.healthcareAccessibilityIndex}/100 • Doc: {district.doctorRatioPer1000}/1k
                  </div>
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
};

export default PublicHealthIntelligenceLayers;
