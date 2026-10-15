import React, { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float } from '@react-three/drei';
import * as THREE from 'three';
import ThreeErrorBoundary from './ErrorBoundary';

// ─── Reduced Motion Hook ────────────────────────────────────────────────────
function useReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ─── 3D Animated Heartbeat (ECG) Wave ────────────────────────────────────────
const HeartbeatWave3D: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  const lineRef = useRef<THREE.Line>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  const { points, lineGeometry } = useMemo(() => {
    // Generate an ECG heartbeat waveform
    const basePoints: THREE.Vector3[] = [];
    const count = 120;
    const width = 8;
    for (let i = 0; i <= count; i++) {
      const x = (i / count) * width - width / 2;
      let y = 0;
      // Normal flat line with P-Q-R-S-T pulse in the center (-1 to +1)
      if (x > -1.2 && x < -0.8) {
        // P wave
        y = Math.sin(((x + 1.2) / 0.4) * Math.PI) * 0.2;
      } else if (x >= -0.8 && x < -0.6) {
        // Q dip
        y = -0.15;
      } else if (x >= -0.6 && x < -0.3) {
        // R spike
        y = Math.sin(((x + 0.6) / 0.3) * Math.PI) * 1.3;
      } else if (x >= -0.3 && x < -0.1) {
        // S dip
        y = -0.35;
      } else if (x >= 0.1 && x < 0.6) {
        // T wave
        y = Math.sin(((x - 0.1) / 0.5) * Math.PI) * 0.35;
      }
      basePoints.push(new THREE.Vector3(x, y - 1.4, -0.6));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(basePoints);
    return { points: basePoints, lineGeometry: geom };
  }, []);

  useFrame(({ clock }) => {
    if (pulseRef.current && !reducedMotion) {
      const t = (clock.getElapsedTime() * 0.8) % 1;
      const index = Math.floor(t * (points.length - 1));
      const pt = points[index];
      if (pt) {
        pulseRef.current.position.set(pt.x, pt.y, pt.z);
      }
    }
  });

  return (
    <group>
      {/* ECG Line */}
      {/* @ts-ignore */}
      <line ref={lineRef} geometry={lineGeometry}>
        <lineBasicMaterial color="#06b6d4" linewidth={2} transparent opacity={0.7} />
      </line>

      {/* Travelling Glow Pulse Node */}
      <mesh ref={pulseRef} position={[-4, -1.4, -0.6]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#38bdf8"
          emissiveIntensity={2}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
};

// ─── Interactive 3D Medical Cross ───────────────────────────────────────────
const InteractiveMedicalCross: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  const crossRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (crossRef.current && !reducedMotion) {
      crossRef.current.rotation.y += delta * 0.5;
      crossRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.15;
    }
  });

  return (
    <group ref={crossRef} position={[0, 1.1, 0]}>
      {/* Vertical beam */}
      <mesh castShadow>
        <boxGeometry args={[0.38, 1.3, 0.38]} />
        <meshStandardMaterial
          color="#06b6d4"
          metalness={0.7}
          roughness={0.2}
          emissive="#0891b2"
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Horizontal beam */}
      <mesh castShadow>
        <boxGeometry args={[1.3, 0.38, 0.38]} />
        <meshStandardMaterial
          color="#06b6d4"
          metalness={0.7}
          roughness={0.2}
          emissive="#0891b2"
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Orbiting Halo Ring */}
      <mesh rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[1.1, 0.05, 16, 64]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#06b6d4"
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
};

// ─── Miniature Community Health Clinic ──────────────────────────────────────
const MiniatureClinic: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  const clinicRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (clinicRef.current && !reducedMotion) {
      clinicRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.2) * 0.1;
    }
  });

  return (
    <group ref={clinicRef} position={[0, -0.6, 0.3]}>
      {/* Foundation Platform */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <cylinderGeometry args={[2.6, 2.8, 0.2, 32]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Main Clinic Structure */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.1, 1.5]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Solar/Angled Roof */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[2.4, 0.2, 1.7]} />
        <meshStandardMaterial color="#0284c7" metalness={0.3} roughness={0.3} />
      </mesh>

      {/* Glass Entrance Door */}
      <mesh position={[0, 0.18, 0.76]}>
        <boxGeometry args={[0.55, 0.55, 0.04]} />
        <meshStandardMaterial
          color="#38bdf8"
          metalness={0.6}
          roughness={0.1}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Medical Cross Sign on Front */}
      <group position={[0, 0.72, 0.77]}>
        <mesh>
          <boxGeometry args={[0.08, 0.3, 0.04]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.3, 0.08, 0.04]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* Left & Right Clinic Windows */}
      <mesh position={[-0.7, 0.5, 0.76]}>
        <boxGeometry args={[0.45, 0.35, 0.04]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.5} roughness={0.2} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0.7, 0.5, 0.76]}>
        <boxGeometry args={[0.45, 0.35, 0.04]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.5} roughness={0.2} transparent opacity={0.7} />
      </mesh>

      {/* Mobile Health Tent / Ambulance Staging */}
      <group position={[1.4, 0.1, 0.2]}>
        <mesh castShadow>
          <boxGeometry args={[0.65, 0.45, 0.55]} />
          <meshStandardMaterial color="#0891b2" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <coneGeometry args={[0.45, 0.25, 4]} />
          <meshStandardMaterial color="#22d3ee" roughness={0.5} />
        </mesh>
      </group>

      {/* Miniature Camp Trees */}
      {[-1.5, 1.5].map((x, i) => (
        <group key={i} position={[x, -0.1, (i % 2 === 0 ? 0.7 : -0.7)]}>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.05, 0.07, 0.5]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
          <mesh position={[0, 0.65, 0]} castShadow>
            <coneGeometry args={[0.35, 0.6, 8]} />
            <meshStandardMaterial color="#10b981" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// ─── Floating Medical Capsules & Icons ──────────────────────────────────────
const FloatingMedicalItems: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  const items = useMemo(() => [
    { pos: [-2.6, 1.2, 0.5], color: '#06b6d4', speed: 0.6, phase: 0 },
    { pos: [2.6, 0.8, -0.2], color: '#38bdf8', speed: 0.7, phase: 1.5 },
    { pos: [-2.2, -0.2, 1.2], color: '#22d3ee', speed: 0.5, phase: 3 },
    { pos: [2.2, -0.4, 0.8], color: '#0891b2', speed: 0.65, phase: 4.5 },
  ], []);

  return (
    <>
      {items.map((item, idx) => (
        <FloatingCapsule key={idx} {...item} reducedMotion={reducedMotion} />
      ))}
    </>
  );
};

const FloatingCapsule: React.FC<{
  pos: number[];
  color: string;
  speed: number;
  phase: number;
  reducedMotion: boolean;
}> = ({ pos, color, speed, phase, reducedMotion }) => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (meshRef.current && !reducedMotion) {
      const t = clock.getElapsedTime() * speed + phase;
      meshRef.current.position.y = pos[1] + Math.sin(t) * 0.25;
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.z += 0.015;
    }
  });

  return (
    <group ref={meshRef} position={[pos[0], pos[1], pos[2]]}>
      <mesh castShadow>
        <capsuleGeometry args={[0.12, 0.3, 12, 24]} />
        <meshStandardMaterial
          color={color}
          metalness={0.4}
          roughness={0.3}
          emissive={color}
          emissiveIntensity={0.25}
        />
      </mesh>
    </group>
  );
};

// ─── Scene Container with Camera Parallax ────────────────────────────────────
const SceneContent: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  useFrame((state) => {
    if (!reducedMotion) {
      // Smooth subtle mouse parallax
      state.camera.position.x = THREE.MathUtils.lerp(
        state.camera.position.x,
        state.pointer.x * 0.7,
        0.04
      );
      state.camera.position.y = THREE.MathUtils.lerp(
        state.camera.position.y,
        0.2 + state.pointer.y * 0.4,
        0.04
      );
      state.camera.lookAt(0, 0.1, 0);
    }
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[6, 8, 5]} intensity={1.5} color="#ffffff" castShadow />
      <pointLight position={[-6, 4, 3]} intensity={1.0} color="#06b6d4" />
      <pointLight position={[0, -3, 2]} intensity={0.6} color="#38bdf8" />
      <spotLight position={[0, 6, 2]} intensity={0.9} color="#ffffff" angle={0.5} penumbra={0.7} />

      <Stars radius={50} depth={30} count={600} factor={2.5} saturation={0.1} fade speed={reducedMotion ? 0 : 0.6} />

      <Float speed={reducedMotion ? 0 : 1.2} rotationIntensity={0.15} floatIntensity={0.25}>
        <InteractiveMedicalCross reducedMotion={reducedMotion} />
      </Float>

      <MiniatureClinic reducedMotion={reducedMotion} />
      <FloatingMedicalItems reducedMotion={reducedMotion} />
      <HeartbeatWave3D reducedMotion={reducedMotion} />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.35}
        maxPolarAngle={Math.PI / 2 + 0.05}
        minPolarAngle={Math.PI / 4}
      />
    </>
  );
};

// ─── Main Export ─────────────────────────────────────────────────────────────
export const HeroScene: React.FC<{ className?: string }> = ({ className = '' }) => {
  const reducedMotion = useReducedMotion();

  return (
    <div className={`w-full h-full relative ${className}`}>
      <ThreeErrorBoundary>
        <Canvas
          shadows={false}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true,
          }}
          camera={{ position: [0, 0.4, 5.2], fov: 46 }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <SceneContent reducedMotion={reducedMotion} />
          </Suspense>
        </Canvas>
      </ThreeErrorBoundary>
    </div>
  );
};

export default HeroScene;
