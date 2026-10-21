// src/components/maps/Route3DRibbon.tsx
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RouteData } from '@/services/routingService';
import { MapProjectionConfig, projectLatLngTo3D } from './Geographic3DTerrain';

interface Route3DRibbonProps {
  route: RouteData;
  projection: MapProjectionConfig;
  prefersReducedMotion?: boolean;
}

export const Route3DRibbon: React.FC<Route3DRibbonProps> = ({
  route,
  projection,
  prefersReducedMotion = false,
}) => {
  const pulseRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  // Convert array of [lat, lng] to Three.js world points
  const points = useMemo(() => {
    return route.coordinates.map(([lat, lng]) => {
      const [x, , z] = projectLatLngTo3D(lat, lng, projection);
      return new THREE.Vector3(x, 0.08, z);
    });
  }, [route.coordinates, projection]);

  // Primary Path Geometry
  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  // Wide Glow Under-Ribbon Geometry
  const glowPoints = useMemo(() => {
    return route.coordinates.map(([lat, lng]) => {
      const [x, , z] = projectLatLngTo3D(lat, lng, projection);
      return new THREE.Vector3(x, 0.06, z);
    });
  }, [route.coordinates, projection]);

  const glowGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(glowPoints);
  }, [glowPoints]);

  const primaryLine = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({ color: '#22d3ee', transparent: true, opacity: 0.95 });
    return new THREE.Line(lineGeometry, mat);
  }, [lineGeometry]);

  const glowLine = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({ color: '#0891b2', transparent: true, opacity: 0.4 });
    return new THREE.Line(glowGeometry, mat);
  }, [glowGeometry]);

  const startPoint = points[0] || new THREE.Vector3(0, 0, 0);

  // Animated pulse dot traveling along the road points
  useFrame((state) => {
    if (prefersReducedMotion || points.length < 2) return;

    if (pulseRef.current) {
      const t = (state.clock.elapsedTime * 0.4) % 1;
      const indexFloat = t * (points.length - 1);
      const idx = Math.floor(indexFloat);
      const nextIdx = Math.min(idx + 1, points.length - 1);
      const frac = indexFloat - idx;

      const p1 = points[idx];
      const p2 = points[nextIdx];

      pulseRef.current.position.set(
        p1.x + (p2.x - p1.x) * frac,
        0.12,
        p1.z + (p2.z - p1.z) * frac
      );
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += 0.02;
    }
  });

  if (points.length < 2) return null;

  return (
    <group>
      {/* 1. Underlying Glowing Ambient Ribbon */}
      <primitive object={glowLine} />

      {/* 2. Sharp Illuminated Centerline Ribbon */}
      <primitive object={primaryLine} />

      {/* 3. Route Start Origin Beacon Disc */}
      <group position={[startPoint.x, 0, startPoint.z]}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.35, 0.45, 0.1, 16]} />
          <meshStandardMaterial
            color="#10b981"
            roughness={0.2}
            metalness={0.8}
            emissive="#059669"
            emissiveIntensity={0.8}
          />
        </mesh>

        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
          <ringGeometry args={[0.5, 0.65, 24]} />
          <meshBasicMaterial color="#34d399" side={THREE.DoubleSide} transparent opacity={0.6} />
        </mesh>
      </group>

      {/* 4. Animated Traveling Energy Pulse */}
      {!prefersReducedMotion && (
        <mesh ref={pulseRef} position={[startPoint.x, 0.12, startPoint.z]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#22d3ee"
            emissiveIntensity={2.0}
            roughness={0.1}
          />
        </mesh>
      )}
    </group>
  );
};

export default Route3DRibbon;
