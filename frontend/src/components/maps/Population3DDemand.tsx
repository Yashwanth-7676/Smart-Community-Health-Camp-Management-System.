// frontend/src/components/maps/Population3DDemand.tsx
import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { KARNATAKA_DISTRICTS_DATA, DistrictDemographics } from './karnatakaDistrictsData';
import { MapProjectionConfig, projectLatLngTo3D } from './Geographic3DTerrain';
import { Users, AlertTriangle, Building2, Stethoscope, Activity } from 'lucide-react';

interface Population3DDemandProps {
  projection: MapProjectionConfig;
  selectedDistrict: DistrictDemographics | null;
  onSelectDistrict: (district: DistrictDemographics | null) => void;
  hoveredDistrictId: string | null;
  onHoverDistrict: (id: string | null) => void;
  visible?: boolean;
  metricMode?: 'POPULATION' | 'UNDERSERVED_GAP' | 'DOCTOR_RATIO';
}

export const Population3DDemand: React.FC<Population3DDemandProps> = ({
  projection,
  selectedDistrict,
  onSelectDistrict,
  hoveredDistrictId,
  onHoverDistrict,
  visible = true,
  metricMode = 'POPULATION',
}) => {
  if (!visible) return null;

  const districtPillars = useMemo(() => {
    const maxPop = Math.max(...KARNATAKA_DISTRICTS_DATA.map((d) => d.population2024));

    return KARNATAKA_DISTRICTS_DATA.map((dist) => {
      const [x, y, z] = projectLatLngTo3D(dist.latitude, dist.longitude, projection);

      let height = 0.4;
      let color = '#06b6d4';
      let emissive = '#0891b2';

      if (metricMode === 'POPULATION') {
        const normalized = dist.population2024 / maxPop;
        height = 0.3 + normalized * 1.8;
        color = dist.underservedStatus ? '#f59e0b' : '#0284c7';
        emissive = dist.underservedStatus ? '#d97706' : '#0369a1';
      } else if (metricMode === 'UNDERSERVED_GAP') {
        height = dist.underservedStatus ? 1.6 : 0.35;
        color = dist.underservedStatus ? '#ef4444' : '#10b981';
        emissive = dist.underservedStatus ? '#dc2626' : '#059669';
      } else {
        // DOCTOR_RATIO
        const ratio = Math.min(2.5, dist.doctorRatioPer1000);
        height = 0.3 + (ratio / 2.5) * 1.4;
        color = ratio < 1.0 ? '#ef4444' : '#10b981';
        emissive = ratio < 1.0 ? '#b91c1c' : '#047857';
      }

      return {
        dist,
        position: [x, y + height / 2, z] as [number, number, number],
        height,
        color,
        emissive,
      };
    });
  }, [projection, metricMode]);

  return (
    <group position={[0, 0, 0]}>
      {districtPillars.map((p) => {
        const isHovered = hoveredDistrictId === p.dist.districtId;
        const isSelected = selectedDistrict?.districtId === p.dist.districtId;

        return (
          <group
            key={p.dist.districtId}
            position={p.position}
            onClick={(e) => {
              e.stopPropagation();
              onSelectDistrict(isSelected ? null : p.dist);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
              onHoverDistrict(p.dist.districtId);
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto';
              onHoverDistrict(null);
            }}
          >
            {/* 3D Extruded Hexagonal Column */}
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.22, 0.22, p.height, 6]} />
              <meshStandardMaterial
                color={isSelected ? '#38bdf8' : p.color}
                emissive={isSelected ? '#38bdf8' : p.emissive}
                emissiveIntensity={isSelected ? 0.8 : isHovered ? 0.6 : 0.25}
                transparent
                opacity={0.82}
                roughness={0.3}
                metalness={0.4}
              />
            </mesh>

            {/* Glowing Cap Indicator */}
            <mesh position={[0, p.height / 2 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.08, 0.2, 6]} />
              <meshBasicMaterial
                color={p.dist.underservedStatus ? '#f87171' : '#38bdf8'}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Tooltip on Hover / Select */}
            {(isHovered || isSelected) && (
              <Html position={[0, p.height / 2 + 0.5, 0]} center distanceFactor={14}>
                <div className="pointer-events-none px-3 py-2 rounded-xl bg-slate-950/95 border border-cyan-500/50 shadow-2xl backdrop-blur-md min-w-[210px] text-center transform -translate-y-2 transition-all">
                  <div className="flex items-center justify-center gap-1.5 text-[9px] uppercase font-bold tracking-wider text-cyan-400">
                    <Users className="w-3 h-3 text-cyan-400" />
                    <span>{p.dist.name} District</span>
                  </div>
                  <div className="text-xs font-bold text-white mt-0.5">
                    {(p.dist.population2024 / 100000).toFixed(1)} Lakh Population
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5 flex items-center justify-center gap-2">
                    <span>{p.dist.totalRecordedCamps} Camps</span>
                    <span>• {p.dist.doctorRatioPer1000} Docs/1k</span>
                  </div>
                  {p.dist.underservedStatus && (
                    <div className="text-[9px] text-amber-400 font-semibold mt-1 flex items-center justify-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                      <span>Priority Rural Underserved Belt</span>
                    </div>
                  )}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
};

export default Population3DDemand;
