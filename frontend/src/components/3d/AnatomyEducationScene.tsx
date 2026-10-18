// frontend/src/components/3d/AnatomyEducationScene.tsx
import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Heart, Wind, Activity, ShieldCheck, Info, RotateCcw } from 'lucide-react';

export type BodySystem = 'CARDIOVASCULAR' | 'RESPIRATORY' | 'NERVOUS' | 'METABOLIC';

export interface HotspotDetail {
  id: string;
  name: string;
  functionDesc: string;
  normalRange: string;
  communityRisk: string;
  preventionTip: string;
}

const HOTSPOTS: Record<BodySystem, HotspotDetail[]> = {
  CARDIOVASCULAR: [
    {
      id: 'aorta',
      name: 'Aorta & Main Arterial Trunk',
      functionDesc: 'Main pipeline distributing oxygenated blood from the left ventricle throughout the entire body.',
      normalRange: 'Systolic: < 120 mmHg, Diastolic: < 80 mmHg',
      communityRisk: 'Hypertension causes excessive arterial wall tension, increasing risk of aneurysms and stroke.',
      preventionTip: 'Limit dietary sodium to < 2g/day, engage in 30 minutes of aerobic exercise, and screen BP at camps.',
    },
    {
      id: 'ventricle',
      name: 'Left Ventricle (Primary Pump)',
      functionDesc: 'Thick muscular chamber generating high pressure to propel blood into systemic circulation.',
      normalRange: 'Resting Heart Rate: 60 - 100 bpm, Ejection Fraction: 55% - 70%',
      communityRisk: 'Chronic uncontrolled high blood pressure causes left ventricular hypertrophy and heart failure.',
      preventionTip: 'Regular cardiovascular checkups, balanced diet rich in leafy greens, and stress mitigation.',
    },
  ],
  RESPIRATORY: [
    {
      id: 'bronchi',
      name: 'Tracheobronchial Tree',
      functionDesc: 'Conducting airways directing inhaled air into smaller bronchioles and alveolar capillary beds.',
      normalRange: 'Respiratory Rate: 12 - 20 breaths/min, SpO2: 95% - 100%',
      communityRisk: 'Biomass cooking smoke, dust, and particulate matter (PM2.5) trigger chronic bronchitis and asthma.',
      preventionTip: 'Ensure ventilated cooking spaces, avoid open burning, and undergo spirometry screenings at health camps.',
    },
    {
      id: 'alveoli',
      name: 'Alveolar Gas Exchange Membrane',
      functionDesc: 'Microscopic air sacs where oxygen diffuses into blood and carbon dioxide is expelled.',
      normalRange: 'Arterial Blood Oxygen (PaO2): 75 - 100 mmHg',
      communityRisk: 'Pneumonia and particulate deposition impair oxygen diffusion, causing dyspnea.',
      preventionTip: 'Annual flu and pneumococcal immunizations for elderly residents and pediatric patients.',
    },
  ],
  NERVOUS: [
    {
      id: 'cortex',
      name: 'Cerebral Cortex & Neural Pathways',
      functionDesc: 'Controls voluntary movement, sensory integration, speech, and cognitive processing.',
      normalRange: 'Normal motor response, symmetrical cranial nerve functions',
      communityRisk: 'Hypertensive microvascular ischemia leads to transient ischemic attacks (TIA) or stroke.',
      preventionTip: 'Recognize FAST warning signs (Face drooping, Arm weakness, Speech difficulty, Time to call).',
    },
  ],
  METABOLIC: [
    {
      id: 'pancreas',
      name: 'Pancreatic Islets (Beta Cells)',
      functionDesc: 'Produces insulin hormone to facilitate cellular absorption of blood glucose for energy.',
      normalRange: 'Fasting Blood Sugar: 70 - 99 mg/dL, HbA1c: < 5.7%',
      communityRisk: 'Insulin resistance leads to Type 2 Diabetes Mellitus, damaging renal and cardiovascular systems.',
      preventionTip: 'Maintain optimal BMI, reduce refined sugars, and participate in annual camp blood glucose screenings.',
    },
  ],
};

// 3D Cardiovascular Model
const CardiovascularMesh: React.FC<{
  pulseRate: number;
  onSelectHotspot: (h: HotspotDetail) => void;
}> = ({ pulseRate, onSelectHotspot }) => {
  const heartRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (heartRef.current) {
      const frequency = (pulseRate / 60) * Math.PI * 2;
      const scale = 1 + 0.08 * Math.sin(clock.getElapsedTime() * frequency);
      heartRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group ref={heartRef} position={[0, 0, 0]}>
      {/* Heart Myocardium (Left and Right Ventricles) */}
      <mesh position={[-0.2, -0.2, 0]}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.2} emissive="#7f1d1d" emissiveIntensity={0.2} />
      </mesh>

      <mesh position={[0.2, -0.2, 0]}>
        <sphereGeometry args={[0.65, 32, 32]} />
        <meshStandardMaterial color="#ef4444" roughness={0.3} metalness={0.2} emissive="#991b1b" emissiveIntensity={0.2} />
      </mesh>

      {/* Aortic Arch */}
      <mesh position={[0, 0.6, 0]} rotation={[0, 0, Math.PI / 6]}>
        <torusGeometry args={[0.5, 0.16, 16, 32, Math.PI * 1.1]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Superior Vena Cava (Deoxygenated Blue Vessel) */}
      <mesh position={[0.55, 0.4, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.8, 24]} />
        <meshStandardMaterial color="#2563eb" roughness={0.4} />
      </mesh>

      {/* Pulmonary Trunk */}
      <mesh position={[-0.3, 0.4, 0.2]} rotation={[0.4, 0, -0.3]}>
        <cylinderGeometry args={[0.13, 0.13, 0.7, 24]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.4} />
      </mesh>

      {/* Clickable Hotspot 1: Aorta */}
      <Html position={[0, 1.1, 0]}>
        <button
          onClick={() => onSelectHotspot(HOTSPOTS.CARDIOVASCULAR[0])}
          className="group relative flex items-center justify-center cursor-pointer"
          aria-label="View Aorta Details"
        >
          <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center text-[10px] font-bold shadow-lg animate-pulse ring-4 ring-primary-500/30">
            1
          </span>
          <span className="absolute left-7 bg-navy-950/90 text-primary-200 border border-primary-500/40 text-[11px] font-semibold px-2 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Aortic Arch
          </span>
        </button>
      </Html>

      {/* Clickable Hotspot 2: Left Ventricle */}
      <Html position={[-0.5, -0.4, 0.5]}>
        <button
          onClick={() => onSelectHotspot(HOTSPOTS.CARDIOVASCULAR[1])}
          className="group relative flex items-center justify-center cursor-pointer"
          aria-label="View Left Ventricle Details"
        >
          <span className="w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center text-[10px] font-bold shadow-lg animate-pulse ring-4 ring-teal-500/30">
            2
          </span>
          <span className="absolute left-7 bg-navy-950/90 text-teal-200 border border-teal-500/40 text-[11px] font-semibold px-2 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Left Ventricle
          </span>
        </button>
      </Html>
    </group>
  );
};

// 3D Respiratory Model
const RespiratoryMesh: React.FC<{
  breathRate: number;
  onSelectHotspot: (h: HotspotDetail) => void;
}> = ({ breathRate, onSelectHotspot }) => {
  const lungsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (lungsRef.current) {
      const freq = (breathRate / 60) * Math.PI * 2;
      const breath = 1 + 0.07 * Math.sin(clock.getElapsedTime() * freq);
      lungsRef.current.scale.set(breath, breath, breath);
    }
  });

  return (
    <group ref={lungsRef} position={[0, 0, 0]}>
      {/* Trachea */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.9, 24]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
      </mesh>

      {/* Left Lung */}
      <mesh position={[-0.65, 0.1, 0]} rotation={[0, 0, -0.15]}>
        <capsuleGeometry args={[0.45, 0.8, 16, 24]} />
        <meshStandardMaterial color="#f472b6" roughness={0.4} metalness={0.1} emissive="#831843" emissiveIntensity={0.15} />
      </mesh>

      {/* Right Lung (3 lobes) */}
      <mesh position={[0.65, 0.1, 0]} rotation={[0, 0, 0.15]}>
        <capsuleGeometry args={[0.5, 0.85, 16, 24]} />
        <meshStandardMaterial color="#f472b6" roughness={0.4} metalness={0.1} emissive="#831843" emissiveIntensity={0.15} />
      </mesh>

      {/* Hotspot: Bronchial Tree */}
      <Html position={[0, 0.5, 0.3]}>
        <button
          onClick={() => onSelectHotspot(HOTSPOTS.RESPIRATORY[0])}
          className="group relative flex items-center justify-center cursor-pointer"
        >
          <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center text-[10px] font-bold shadow-lg animate-pulse ring-4 ring-primary-500/30">
            1
          </span>
          <span className="absolute left-7 bg-navy-950/90 text-primary-200 border border-primary-500/40 text-[11px] font-semibold px-2 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Bronchial Airways
          </span>
        </button>
      </Html>

      {/* Hotspot: Alveoli */}
      <Html position={[0.8, -0.2, 0.4]}>
        <button
          onClick={() => onSelectHotspot(HOTSPOTS.RESPIRATORY[1])}
          className="group relative flex items-center justify-center cursor-pointer"
        >
          <span className="w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center text-[10px] font-bold shadow-lg animate-pulse ring-4 ring-teal-500/30">
            2
          </span>
          <span className="absolute left-7 bg-navy-950/90 text-teal-200 border border-teal-500/40 text-[11px] font-semibold px-2 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Alveolar Units
          </span>
        </button>
      </Html>
    </group>
  );
};

// 3D Skeletal & Nervous Model
const NervousMesh: React.FC<{ onSelectHotspot: (h: HotspotDetail) => void }> = ({ onSelectHotspot }) => {
  return (
    <group position={[0, -0.3, 0]}>
      {/* Cranium */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
      </mesh>

      {/* Spine / Vertebrae */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 1.4, 16]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
      </mesh>

      {/* Neural Synapse Glow Halo */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[0, 1.2, 0]}>
          <ringGeometry args={[0.65, 0.72, 32]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
        </mesh>
      </Float>

      {/* Hotspot */}
      <Html position={[0, 1.35, 0.5]}>
        <button
          onClick={() => onSelectHotspot(HOTSPOTS.NERVOUS[0])}
          className="group relative flex items-center justify-center cursor-pointer"
        >
          <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center text-[10px] font-bold shadow-lg animate-pulse ring-4 ring-primary-500/30">
            1
          </span>
          <span className="absolute left-7 bg-navy-950/90 text-primary-200 border border-primary-500/40 text-[11px] font-semibold px-2 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Cerebral Cortex
          </span>
        </button>
      </Html>
    </group>
  );
};

// 3D Metabolic & Pancreatic Model
const MetabolicMesh: React.FC<{ onSelectHotspot: (h: HotspotDetail) => void }> = ({ onSelectHotspot }) => {
  return (
    <group position={[0, 0, 0]}>
      {/* Liver */}
      <mesh position={[-0.4, 0.3, 0]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[1.2, 0.7, 0.6]} />
        <meshStandardMaterial color="#881337" roughness={0.4} />
      </mesh>

      {/* Pancreas */}
      <mesh position={[0.2, -0.2, 0.2]} rotation={[0, 0, 0.3]}>
        <capsuleGeometry args={[0.2, 0.9, 16, 24]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.3} emissive="#78350f" emissiveIntensity={0.2} />
      </mesh>

      {/* Hotspot */}
      <Html position={[0.4, -0.2, 0.4]}>
        <button
          onClick={() => onSelectHotspot(HOTSPOTS.METABOLIC[0])}
          className="group relative flex items-center justify-center cursor-pointer"
        >
          <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shadow-lg animate-pulse ring-4 ring-amber-500/30">
            1
          </span>
          <span className="absolute left-7 bg-navy-950/90 text-amber-200 border border-amber-500/40 text-[11px] font-semibold px-2 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Pancreatic Beta Cells
          </span>
        </button>
      </Html>
    </group>
  );
};

export const AnatomyEducationScene: React.FC = () => {
  const [selectedSystem, setSelectedSystem] = useState<BodySystem>('CARDIOVASCULAR');
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotDetail>(HOTSPOTS.CARDIOVASCULAR[0]);
  const [pulseRate, setPulseRate] = useState<number>(72);
  const [breathRate, setBreathRate] = useState<number>(16);
  const [is3DMode, setIs3DMode] = useState<boolean>(true);

  return (
    <div className="bg-navy-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-white">
      {/* Mandatory Non-Diagnostic Clinical Disclaimer Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 flex items-start space-x-3 text-xs text-amber-200">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300 uppercase tracking-wider block">
            Health Education & Literacy Notice:
          </span>
          This interactive 3D model is designed strictly for community physiological education and awareness.
          It does <strong>NOT</strong> diagnose medical conditions, formulate prescriptions, or replace formal clinical consultations with licensed medical professionals.
        </div>
      </div>

      {/* System Selector Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { key: 'CARDIOVASCULAR', label: 'Cardiovascular', icon: Heart },
              { key: 'RESPIRATORY', label: 'Respiratory', icon: Wind },
              { key: 'NERVOUS', label: 'Skeletal & Nervous', icon: Activity },
              { key: 'METABOLIC', label: 'Endocrine & Metabolic', icon: ShieldCheck },
            ] as const
          ).map((sys) => {
            const Icon = sys.icon;
            const active = selectedSystem === sys.key;
            return (
              <button
                key={sys.key}
                onClick={() => {
                  setSelectedSystem(sys.key);
                  setSelectedHotspot(HOTSPOTS[sys.key][0]);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
                  active
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-950/50 border border-primary-400/40'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{sys.label}</span>
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle (3D vs 2D Fallback) */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setIs3DMode(!is3DMode)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono transition-colors"
          >
            {is3DMode ? 'Switch to 2D Accessible View' : 'Switch to 3D Visualizer'}
          </button>
        </div>
      </div>

      {/* Interactive Display Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Visualizer Canvas (Left 2 Cols) */}
        <div className="lg:col-span-2 h-[420px] rounded-2xl bg-gradient-to-b from-navy-950 to-slate-900 border border-slate-800 relative overflow-hidden flex items-center justify-center">
          {is3DMode ? (
            <>
              <Canvas
                camera={{ position: [0, 0, 3.8], fov: 45 }}
                className="w-full h-full cursor-grab active:cursor-grabbing"
              >
                <ambientLight intensity={0.7} />
                <pointLight position={[10, 10, 10]} intensity={1.2} />
                <pointLight position={[-10, -10, -5]} color="#0284c7" intensity={0.8} />

                {selectedSystem === 'CARDIOVASCULAR' && (
                  <CardiovascularMesh pulseRate={pulseRate} onSelectHotspot={setSelectedHotspot} />
                )}
                {selectedSystem === 'RESPIRATORY' && (
                  <RespiratoryMesh breathRate={breathRate} onSelectHotspot={setSelectedHotspot} />
                )}
                {selectedSystem === 'NERVOUS' && (
                  <NervousMesh onSelectHotspot={setSelectedHotspot} />
                )}
                {selectedSystem === 'METABOLIC' && (
                  <MetabolicMesh onSelectHotspot={setSelectedHotspot} />
                )}

                <OrbitControls enablePan={false} minDistance={2.2} maxDistance={6} />
              </Canvas>

              {/* Canvas Overlay Controls */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs pointer-events-auto bg-navy-950/70 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px]">
                  🖱️ Drag to rotate • Scroll to zoom • Click numbered pins for organ details
                </span>

                {selectedSystem === 'CARDIOVASCULAR' && (
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-300">Pulse:</span>
                    <input
                      type="range"
                      min="50"
                      max="110"
                      value={pulseRate}
                      onChange={(e) => setPulseRate(Number(e.target.value))}
                      className="w-20 accent-primary-500 cursor-pointer"
                    />
                    <span className="font-mono text-primary-400 text-[11px]">{pulseRate} bpm</span>
                  </div>
                )}

                {selectedSystem === 'RESPIRATORY' && (
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-300">Respiration:</span>
                    <input
                      type="range"
                      min="10"
                      max="28"
                      value={breathRate}
                      onChange={(e) => setBreathRate(Number(e.target.value))}
                      className="w-20 accent-teal-500 cursor-pointer"
                    />
                    <span className="font-mono text-teal-400 text-[11px]">{breathRate} /min</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Accessible 2D Fallback Mode
            <div className="p-8 w-full max-w-lg text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-center text-primary-400 mx-auto mb-4">
                <Activity className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                2D Accessible View: {selectedSystem}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                High-contrast descriptive anatomy presentation suitable for screen readers and reduced-motion environments.
              </p>
              <div className="space-y-2 text-left">
                {HOTSPOTS[selectedSystem].map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setSelectedHotspot(h)}
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold flex items-center justify-between text-slate-200 hover:border-primary-500 transition-colors"
                  >
                    <span>{h.name}</span>
                    <span className="text-primary-400">Inspect Details →</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hotspot & Clinical Literacy Card (Right Col) */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-mono text-primary-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>ANATOMICAL STRUCTURE</span>
              <span className="px-2 py-0.5 rounded bg-primary-500/10 border border-primary-500/20 text-[10px]">
                HOTSPOT INSPECTION
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-3">
              {selectedHotspot.name}
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Physiological Role:</span>
                <p className="text-slate-200 leading-relaxed">{selectedHotspot.functionDesc}</p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Healthy Population Range:</span>
                <p className="font-mono text-emerald-300 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                  {selectedHotspot.normalRange}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Community Health Relevance:</span>
                <p className="text-amber-200/90 leading-relaxed bg-amber-500/5 p-2.5 rounded-lg border border-amber-500/10">
                  {selectedHotspot.communityRisk}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Recommended Preventive Action:</span>
                <p className="text-teal-200 leading-relaxed bg-teal-500/5 p-2.5 rounded-lg border border-teal-500/10">
                  {selectedHotspot.preventionTip}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700/60 text-[11px] text-slate-400 text-center">
            Free screening for related markers is available at all upcoming community health camps.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnatomyEducationScene;

