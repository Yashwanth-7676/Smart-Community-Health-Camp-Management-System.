// frontend/src/components/maps/HealthcareNetwork3D.tsx
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MapCamp } from '@/pages/camps/CampMapPage';
import { HealthcareFacility, VERIFIED_HEALTHCARE_FACILITIES } from './healthcareFacilities';
import { MapProjectionConfig, projectLatLngTo3D } from './Geographic3DTerrain';

interface ReferralConnection {
  id: string;
  fromName: string;
  toName: string;
  fromCoords: [number, number, number];
  toCoords: [number, number, number];
  curve: THREE.QuadraticBezierCurve3;
  type: 'EMERGENCY_CORRIDOR' | 'SUPER_SPECIALTY' | 'ROUTINE_REFERRAL' | 'MOBILE_TRANSIT';
  color: string;
}

interface HealthcareNetwork3DProps {
  camps: MapCamp[];
  facilities?: HealthcareFacility[];
  selectedCampId?: string | null;
  selectedFacilityId?: string | null;
  projection: MapProjectionConfig;
  visible?: boolean;
}

export const HealthcareNetwork3D: React.FC<HealthcareNetwork3DProps> = ({
  camps,
  facilities = VERIFIED_HEALTHCARE_FACILITIES,
  selectedCampId,
  selectedFacilityId,
  projection,
  visible = true,
}) => {
  const particleGroupRef = useRef<THREE.Group>(null);

  // Compute 3D referral arcs between camps and their nearest tertiary medical center
  const connections = useMemo(() => {
    if (!visible) return [] as ReferralConnection[];
    const list: ReferralConnection[] = [];

    const hospitals: HealthcareFacility[] = facilities.filter(
      (f): f is HealthcareFacility => f.type === 'HOSPITAL' || f.type === 'REFERRAL_CENTRE'
    );

    camps.forEach((camp) => {
      if (!camp.latitude || !camp.longitude) return;

      let nearestHosp: HealthcareFacility | null = null;
      let minDist = Infinity;

      for (const hosp of hospitals) {
        const dLat = hosp.latitude - camp.latitude;
        const dLng = hosp.longitude - camp.longitude;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        if (dist < minDist) {
          minDist = dist;
          nearestHosp = hosp;
        }
      }

      if (nearestHosp) {
        const target: HealthcareFacility = nearestHosp;
        const p1 = projectLatLngTo3D(camp.latitude, camp.longitude, projection);
        const p2 = projectLatLngTo3D(target.latitude, target.longitude, projection);

        const v1 = new THREE.Vector3(p1[0], p1[1] + 0.1, p1[2]);
        const v2 = new THREE.Vector3(p2[0], p2[1] + 0.35, p2[2]);

        const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
        const distance3D = v1.distanceTo(v2);
        mid.y += Math.max(0.6, distance3D * 0.22);

        const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
        const isSuper = target.type === 'REFERRAL_CENTRE';

        list.push({
          id: `${camp.id}->${target.id}`,
          fromName: camp.name,
          toName: target.name,
          fromCoords: p1,
          toCoords: p2,
          curve,
          type: isSuper ? 'SUPER_SPECIALTY' : 'EMERGENCY_CORRIDOR',
          color: isSuper ? '#a855f7' : '#06b6d4',
        });
      }
    });

    // Mobile Medical Unit routes
    const mmus: HealthcareFacility[] = facilities.filter(
      (f) => f.type === 'MOBILE_UNIT' && f.transitRoute && f.transitRoute.length > 1
    );
    mmus.forEach((mmu) => {
      if (!mmu.transitRoute) return;
      for (let i = 0; i < mmu.transitRoute.length - 1; i++) {
        const r1 = mmu.transitRoute[i];
        const r2 = mmu.transitRoute[i + 1];
        const p1 = projectLatLngTo3D(r1[0], r1[1], projection);
        const p2 = projectLatLngTo3D(r2[0], r2[1], projection);

        const v1 = new THREE.Vector3(p1[0], p1[1] + 0.04, p1[2]);
        const v2 = new THREE.Vector3(p2[0], p2[1] + 0.04, p2[2]);
        const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
        mid.y += 0.15;

        list.push({
          id: `mmu-${mmu.id}-${i}`,
          fromName: mmu.name,
          toName: `Waypoint ${i + 1}`,
          fromCoords: p1,
          toCoords: p2,
          curve: new THREE.QuadraticBezierCurve3(v1, mid, v2),
          type: 'MOBILE_TRANSIT',
          color: '#f59e0b',
        });
      }
    });

    return list;
  }, [camps, facilities, projection, visible]);

  // Pre-generate Three.js Line objects for all curved connections
  const lineObjects = useMemo(() => {
    return connections.map((conn) => {
      const points = conn.curve.getPoints(24);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const isHighlighted =
        (selectedCampId && conn.id.includes(selectedCampId)) ||
        (selectedFacilityId && conn.id.includes(selectedFacilityId));

      const material = new THREE.LineBasicMaterial({
        color: conn.color,
        transparent: true,
        opacity: isHighlighted ? 0.95 : 0.32,
      });

      return {
        id: conn.id,
        line: new THREE.Line(geometry, material),
      };
    });
  }, [connections, selectedCampId, selectedFacilityId]);

  // Particle meshes
  const particleMeshes = useMemo(() => {
    return connections.map((conn) => ({
      key: `particle-${conn.id}`,
      conn,
    }));
  }, [connections]);

  useFrame(({ clock }) => {
    if (!particleGroupRef.current) return;
    const t = clock.getElapsedTime();

    particleGroupRef.current.children.forEach((child, idx) => {
      const conn = connections[idx];
      if (!conn) return;

      const speed = conn.type === 'MOBILE_TRANSIT' ? 0.35 : 0.65;
      const progress = (t * speed + idx * 0.18) % 1.0;
      const pt = conn.curve.getPoint(progress);

      child.position.copy(pt);
    });
  });

  if (!visible || connections.length === 0) return null;

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Curved Glowing Bezier Arcs rendered via Three.js primitives */}
      {lineObjects.map((item) => (
        <primitive object={item.line} key={item.id} />
      ))}

      {/* 2. Dynamic Energy Packets Moving along Arcs */}
      <group ref={particleGroupRef}>
        {particleMeshes.map((p) => (
          <mesh key={p.key}>
            <sphereGeometry args={[p.conn.type === 'MOBILE_TRANSIT' ? 0.05 : 0.065, 8, 8]} />
            <meshBasicMaterial color={p.conn.color} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

export default HealthcareNetwork3D;
