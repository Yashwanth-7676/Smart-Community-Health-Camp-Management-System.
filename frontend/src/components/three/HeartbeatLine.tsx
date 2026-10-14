import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ECGLineMesh: React.FC = () => {
  const lineRef = useRef<THREE.Line>(null);
  const timeRef = useRef(0);

  // Generate ECG pattern points
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const count = 120;
    for (let i = 0; i < count; i++) {
      const x = (i / count) * 10 - 5;
      pts.push(new THREE.Vector3(x, 0, 0));
    }
    return pts;
  }, []);

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    return geom;
  }, [points]);

  useFrame((_, delta) => {
    if (!lineRef.current) return;
    timeRef.current += delta * 2.5;

    const pos = lineRef.current.geometry.attributes.position;
    const count = pos.count;

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      // Wave moving along x
      const phase = (x + timeRef.current) % 4;

      let y = 0;
      // Pulse shape spike (P-Q-R-S-T wave)
      if (phase > 1.8 && phase < 2.0) {
        y = Math.sin((phase - 1.8) * Math.PI * 5) * 0.2; // P wave
      } else if (phase >= 2.0 && phase < 2.1) {
        y = -0.3; // Q dip
      } else if (phase >= 2.1 && phase < 2.3) {
        y = Math.sin((phase - 2.1) * Math.PI * 5) * 1.5; // R spike
      } else if (phase >= 2.3 && phase < 2.45) {
        y = -0.5; // S dip
      } else if (phase >= 2.45 && phase < 2.8) {
        y = Math.sin((phase - 2.45) * Math.PI * 2.8) * 0.35; // T wave
      }

      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });

  return (
    <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x06b6d4, linewidth: 2 }))} ref={lineRef} />
  );
};

export const HeartbeatLine: React.FC<{ height?: number; className?: string }> = ({
  height = 140,
  className = '',
}) => {
  return (
    <div className={`w-full overflow-hidden rounded-2xl relative ${className}`} style={{ height }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ pointerEvents: 'none' }}
      >
        <ambientLight intensity={0.5} />
        <ECGLineMesh />
      </Canvas>
    </div>
  );
};

export default HeartbeatLine;

