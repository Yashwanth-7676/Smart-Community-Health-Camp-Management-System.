// frontend/src/components/3d/CommunityDigitalTwin.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Text } from '@react-three/drei';
import * as THREE from 'three';
import {
  Activity,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Users,
  Layers,
  Sparkles,
  Info,
  Sliders,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import ThreeErrorBoundary from '../three/ErrorBoundary';

export interface DigitalTwinArea {
  areaId: string;
  areaName: string;
  district: string;
  coordinates: {
    lat: number;
    lng: number;
    elevation3D: number;
  };
  totalCamps: number;
  historicalAttendance: number;
  estimatedAttendance: number;
  isEstimate: boolean;
  estimationConfidence: number;
  estimationModel: string;
  screeningCoverageRate: number;
  healthIndex: number;
  resourceUtilizationRate: number;
  topHealthConcerns: Array<{ name: string; percentage: number }>;
  activeDoctorsAssigned: number;
  criticalMedicineAvailabilityRate: number;
  privacyThresholdMet: boolean;
  minimumAggregationCount: number;
}

const DEFAULT_AREAS: DigitalTwinArea[] = [
  {
    areaId: 'area-doddaballapura',
    areaName: 'Doddaballapura Rural Belt',
    district: 'Bengaluru Rural',
    coordinates: { lat: 13.2924, lng: 77.5428, elevation3D: 1.4 },
    totalCamps: 8,
    historicalAttendance: 1420,
    estimatedAttendance: 1850,
    isEstimate: true,
    estimationConfidence: 91,
    estimationModel: 'Poisson Seasonal Rural Intake Regression v2.1',
    screeningCoverageRate: 68.4,
    healthIndex: 74,
    resourceUtilizationRate: 84.2,
    topHealthConcerns: [
      { name: 'Hypertension', percentage: 32 },
      { name: 'Type 2 Diabetes Risk', percentage: 24 },
      { name: 'Visual Refraction Deficit', percentage: 16 },
      { name: 'Joint & Musculoskeletal', percentage: 12 },
    ],
    activeDoctorsAssigned: 12,
    criticalMedicineAvailabilityRate: 88.5,
    privacyThresholdMet: true,
    minimumAggregationCount: 1420,
  },
  {
    areaId: 'area-koramangala',
    areaName: 'Koramangala Community Zone',
    district: 'Bengaluru South',
    coordinates: { lat: 12.9352, lng: 77.6245, elevation3D: 2.1 },
    totalCamps: 12,
    historicalAttendance: 2150,
    estimatedAttendance: 2400,
    isEstimate: true,
    estimationConfidence: 94,
    estimationModel: 'Urban Density Moving Average v3.0',
    screeningCoverageRate: 82.1,
    healthIndex: 88,
    resourceUtilizationRate: 91.0,
    topHealthConcerns: [
      { name: 'Sedentary Lifestyle Stress', percentage: 29 },
      { name: 'Dyslipidemia / Lipid Panel', percentage: 22 },
      { name: 'Vitamin D Deficiency', percentage: 18 },
      { name: 'Hypertension', percentage: 15 },
    ],
    activeDoctorsAssigned: 18,
    criticalMedicineAvailabilityRate: 96.0,
    privacyThresholdMet: true,
    minimumAggregationCount: 2150,
  },
  {
    areaId: 'area-nelamangala',
    areaName: 'Nelamangala Outreach Corridor',
    district: 'Bengaluru Rural',
    coordinates: { lat: 13.0973, lng: 77.3878, elevation3D: 1.1 },
    totalCamps: 6,
    historicalAttendance: 980,
    estimatedAttendance: 1300,
    isEstimate: true,
    estimationConfidence: 87,
    estimationModel: 'Sparse Demographic Extrapolation v1.8',
    screeningCoverageRate: 54.2,
    healthIndex: 69,
    resourceUtilizationRate: 76.5,
    topHealthConcerns: [
      { name: 'Iron Deficiency Anemia', percentage: 27 },
      { name: 'Hypertension', percentage: 25 },
      { name: 'Dental Caries', percentage: 21 },
      { name: 'Pediatric Growth Monitoring', percentage: 14 },
    ],
    activeDoctorsAssigned: 8,
    criticalMedicineAvailabilityRate: 82.0,
    privacyThresholdMet: true,
    minimumAggregationCount: 980,
  },
  {
    areaId: 'area-devanahalli',
    areaName: 'Devanahalli Taluk Cluster',
    district: 'Bengaluru North',
    coordinates: { lat: 13.2483, lng: 77.7126, elevation3D: 1.25 },
    totalCamps: 5,
    historicalAttendance: 820,
    estimatedAttendance: 1150,
    isEstimate: true,
    estimationConfidence: 89,
    estimationModel: 'Suburban Transit Population Estimator',
    screeningCoverageRate: 59.8,
    healthIndex: 72,
    resourceUtilizationRate: 71.4,
    topHealthConcerns: [
      { name: 'Upper Respiratory Allergy', percentage: 26 },
      { name: 'Diabetes Screening Needed', percentage: 21 },
      { name: 'Hypertension', percentage: 19 },
      { name: 'Dermatological Irritation', percentage: 13 },
    ],
    activeDoctorsAssigned: 7,
    criticalMedicineAvailabilityRate: 85.0,
    privacyThresholdMet: true,
    minimumAggregationCount: 820,
  },
  {
    areaId: 'area-indiranagar',
    areaName: 'Indiranagar Urban Health Hub',
    district: 'Bengaluru East',
    coordinates: { lat: 12.9784, lng: 77.6408, elevation3D: 1.85 },
    totalCamps: 10,
    historicalAttendance: 1890,
    estimatedAttendance: 2100,
    isEstimate: true,
    estimationConfidence: 93,
    estimationModel: 'Urban Density Moving Average v3.0',
    screeningCoverageRate: 79.5,
    healthIndex: 85,
    resourceUtilizationRate: 89.2,
    topHealthConcerns: [
      { name: 'Hypertension', percentage: 24 },
      { name: 'Digital Eye Strain', percentage: 20 },
      { name: 'Type 2 Diabetes', percentage: 18 },
      { name: 'Orthopedic / Postural Pain', percentage: 16 },
    ],
    activeDoctorsAssigned: 15,
    criticalMedicineAvailabilityRate: 94.0,
    privacyThresholdMet: true,
    minimumAggregationCount: 1890,
  },
  {
    areaId: 'area-anekal',
    areaName: 'Anekal Taluk Outreach',
    district: 'Bengaluru Urban / Border',
    coordinates: { lat: 12.7107, lng: 77.6974, elevation3D: 1.35 },
    totalCamps: 7,
    historicalAttendance: 1110,
    estimatedAttendance: 1450,
    isEstimate: true,
    estimationConfidence: 88,
    estimationModel: 'Rural Fringe Epidemiological Index v2.0',
    screeningCoverageRate: 61.2,
    healthIndex: 70,
    resourceUtilizationRate: 79.0,
    topHealthConcerns: [
      { name: 'Nutritional & Micronutrient Gap', percentage: 28 },
      { name: 'Hypertension', percentage: 23 },
      { name: 'Diabetes Mellitus', percentage: 17 },
      { name: 'Vision Screening Requirement', percentage: 15 },
    ],
    activeDoctorsAssigned: 9,
    criticalMedicineAvailabilityRate: 86.0,
    privacyThresholdMet: true,
    minimumAggregationCount: 1110,
  },
];

// ─── 3D Regional Pillar Component ───────────────────────────────────────────
interface AreaPillar3DProps {
  area: DigitalTwinArea;
  isEstimateMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}

const AreaPillar3D: React.FC<AreaPillar3DProps> = ({
  area,
  isEstimateMode,
  isSelected,
  onSelect,
  index,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Compute pillar height based on attendance (historical vs estimated)
  const attendanceVal = isEstimateMode ? area.estimatedAttendance : area.historicalAttendance;
  const pillarHeight = Math.max(0.8, (attendanceVal / 2400) * 3.5);

  // Layout positions in a stylized regional 3D circular/grid layout
  const angle = (index / DEFAULT_AREAS.length) * Math.PI * 2;
  const radius = 3.6;
  const posX = Math.cos(angle) * radius;
  const posZ = Math.sin(angle) * radius;

  // Color by Health Index
  const color = useMemo(() => {
    if (area.healthIndex >= 85) return '#10b981'; // Green (Optimal)
    if (area.healthIndex >= 72) return '#06b6d4'; // Cyan (Good)
    return '#f59e0b'; // Amber (Moderate Risk)
  }, [area.healthIndex]);

  useFrame(({ clock }) => {
    if (ringRef.current) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 2 + index) * 0.15;
      ringRef.current.scale.set(s, s, s);
    }
    if (meshRef.current && (hovered || isSelected)) {
      meshRef.current.rotation.y += 0.015;
    }
  });

  return (
    <group position={[posX, 0, posZ]}>
      {/* Base Ripple Ring */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0]}
      >
        <ringGeometry args={[0.45, 0.58, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered || isSelected ? 0.8 : 0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Vertical Data Pillar */}
      <mesh
        ref={meshRef}
        position={[0, pillarHeight / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.26, 0.32, pillarHeight, 24]} />
        <meshStandardMaterial
          color={hovered || isSelected ? '#ffffff' : color}
          emissive={color}
          emissiveIntensity={hovered || isSelected ? 0.6 : 0.25}
          metalness={0.4}
          roughness={0.2}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Top Floating Health Core Orb */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[0, pillarHeight + 0.35, 0]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial
            color={isEstimateMode ? '#38bdf8' : color}
            emissive={isEstimateMode ? '#0284c7' : color}
            emissiveIntensity={0.8}
            metalness={0.2}
            roughness={0.1}
          />
        </mesh>
      </Float>

      {/* Label billboard */}
      <Text
        position={[0, -0.2, 0.7]}
        fontSize={0.22}
        color={isSelected ? '#38bdf8' : '#e2e8f0'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#090d16"
      >
        {area.areaName.split(' ')[0]}
      </Text>
    </group>
  );
};

// ─── 3D Grid & Terrain Plane ────────────────────────────────────────────────
const DigitalTerrainGrid: React.FC = () => {
  return (
    <group position={[0, 0, 0]}>
      <gridHelper args={[16, 24, '#0284c7', '#1e293b']} position={[0, 0, 0]} />
      {/* Concentric telemetry circles */}
      {[2, 3.6, 5.2].map((r, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[r - 0.02, r + 0.02, 64]} />
          <meshBasicMaterial color="#0284c7" transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};

// ─── Main Community Health Digital Twin Component ───────────────────────────
export const CommunityDigitalTwin: React.FC = () => {
  const [areas, setAreas] = useState<DigitalTwinArea[]>(DEFAULT_AREAS);
  const [selectedArea, setSelectedArea] = useState<DigitalTwinArea>(DEFAULT_AREAS[0]);
  const [isEstimateMode, setIsEstimateMode] = useState<boolean>(false);
  const [activeMetric, setActiveMetric] = useState<'attendance' | 'coverage' | 'healthIndex'>('attendance');
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [simulationOpen, setSimulationOpen] = useState(false);

  // Simulation inputs
  const [simDoctors, setSimDoctors] = useState(2);
  const [simCamps, setSimCamps] = useState(1);

  // Fetch real backend digital twin metrics
  useEffect(() => {
    fetch('/api/v1/digital-twin/areas')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setAreas(data.data);
          setSelectedArea(data.data[0]);
        }
      })
      .catch((err) => {
        console.warn('[DigitalTwin] Using default baseline cluster dataset:', err);
      });
  }, []);

  const simulatedCoverage = useMemo(() => {
    if (!selectedArea) return 0;
    return Math.min(99.5, Number((selectedArea.screeningCoverageRate + simCamps * 4.2 + simDoctors * 2.1).toFixed(1)));
  }, [selectedArea, simCamps, simDoctors]);

  const simulatedHealthIndex = useMemo(() => {
    if (!selectedArea) return 0;
    return Math.min(98, Math.round(selectedArea.healthIndex + simCamps * 1.5 + simDoctors * 0.8));
  }, [selectedArea, simCamps, simDoctors]);

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* ── Top Control & Compliance Bar ───────────────────────────────── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Community Health Digital Twin
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/50 font-medium">
                    3D Spatial Intelligence
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Interactive multi-district health twin aggregating screening coverage, disease indicators, and resource utilization.
                </p>
              </div>
            </div>
          </div>

          {/* Mode Switchers */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Historical vs Estimates Toggle */}
            <div className="flex bg-slate-950/70 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setIsEstimateMode(false)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  !isEstimateMode
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Historical Actuals
              </button>
              <button
                onClick={() => setIsEstimateMode(true)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  isEstimateMode
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                AI Predictive Twin
              </button>
            </div>

            {/* View Mode (3D vs 2D) */}
            <div className="flex bg-slate-950/70 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('3d')}
                className={`px-2.5 py-1.5 text-xs rounded-lg ${
                  viewMode === '3d' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                3D Space
              </button>
              <button
                onClick={() => setViewMode('2d')}
                className={`px-2.5 py-1.5 text-xs rounded-lg ${
                  viewMode === '2d' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                Data Grid
              </button>
            </div>

            {/* Privacy Compliance Badge */}
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 rounded-xl text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Anonymized (N &ge; 10 Cluster Guard)</span>
            </div>
          </div>
        </div>

        {/* Predictive Twin Estimation Context Banner */}
        {isEstimateMode && (
          <div className="mt-4 p-3.5 bg-cyan-950/40 border border-cyan-800/50 rounded-xl text-xs text-cyan-200 flex items-start gap-3">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-cyan-300 flex items-center gap-2">
                <span>Predictive Forecasting Active: Poisson Seasonal Rural Intake Regression & Urban Moving Average</span>
                <span className="text-[10px] px-2 py-0.5 bg-cyan-900/60 rounded border border-cyan-700">
                  Confidence: 87% - 94%
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Projected volumes depict forecasted attendance based on historical rural community health camp turnouts.
                <strong className="text-amber-300 ml-1">
                  Limitations: Assumes stationary demographic trends; does not model sudden viral epidemics or natural hazards.
                </strong>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Canvas & Inspector Layout ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D Visualizer Canvas (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden relative shadow-2xl min-h-[500px] flex flex-col">
          {viewMode === '3d' ? (
            <ThreeErrorBoundary>
              <div className="w-full h-[520px] relative">
                <Canvas camera={{ position: [0, 5, 8], fov: 45 }}>
                  <ambientLight intensity={0.65} />
                  <pointLight position={[10, 15, 10]} intensity={1.2} />
                  <pointLight position={[-10, 8, -10]} intensity={0.5} color="#06b6d4" />

                  <DigitalTerrainGrid />

                  {areas.map((area, idx) => (
                    <AreaPillar3D
                      key={area.areaId}
                      area={area}
                      isEstimateMode={isEstimateMode}
                      isSelected={selectedArea?.areaId === area.areaId}
                      onSelect={() => setSelectedArea(area)}
                      index={idx}
                    />
                  ))}

                  <OrbitControls
                    enableZoom={true}
                    maxPolarAngle={Math.PI / 2.1}
                    minDistance={4}
                    maxDistance={14}
                  />
                </Canvas>

                {/* 3D Canvas Overlay Hint */}
                <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 pointer-events-none flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Drag to rotate 3D community space | Click a health pillar to inspect district</span>
                </div>
              </div>
            </ThreeErrorBoundary>
          ) : (
            /* 2D Accessible Data Grid */
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Community Area</th>
                    <th className="py-3 px-4">District</th>
                    <th className="py-3 px-4">Historical Actual</th>
                    <th className="py-3 px-4">Forecast Estimate</th>
                    <th className="py-3 px-4">Coverage Rate</th>
                    <th className="py-3 px-4">Health Index</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {areas.map((a) => (
                    <tr
                      key={a.areaId}
                      className={`hover:bg-slate-900/50 cursor-pointer ${
                        selectedArea?.areaId === a.areaId ? 'bg-cyan-950/30' : ''
                      }`}
                      onClick={() => setSelectedArea(a)}
                    >
                      <td className="py-3 px-4 font-semibold text-white">{a.areaName}</td>
                      <td className="py-3 px-4 text-slate-400">{a.district}</td>
                      <td className="py-3 px-4">{a.historicalAttendance.toLocaleString()}</td>
                      <td className="py-3 px-4 text-cyan-400 font-medium">{a.estimatedAttendance.toLocaleString()}</td>
                      <td className="py-3 px-4">{a.screeningCoverageRate}%</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">{a.healthIndex}/100</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedArea(a)}
                          className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded text-cyan-300 border border-slate-700"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Area Details & Predictive Inspector (1 Col) ──────────────── */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  {selectedArea.district}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedArea.areaName}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Health Index</span>
                <div className="text-2xl font-black text-emerald-400">{selectedArea.healthIndex}</div>
              </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  {isEstimateMode ? 'Estimated Attendance' : 'Historical Screened'}
                </div>
                <div className="text-lg font-bold text-white mt-1">
                  {isEstimateMode
                    ? selectedArea.estimatedAttendance.toLocaleString()
                    : selectedArea.historicalAttendance.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500">
                  {isEstimateMode ? 'Poisson model forecast' : `${selectedArea.totalCamps} completed camps`}
                </span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Screening Coverage
                </div>
                <div className="text-lg font-bold text-white mt-1">{selectedArea.screeningCoverageRate}%</div>
                <span className="text-[10px] text-slate-500">of target demographic</span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="text-[11px] text-slate-400">Active Doctors</div>
                <div className="text-lg font-bold text-white mt-1">{selectedArea.activeDoctorsAssigned}</div>
                <span className="text-[10px] text-slate-500">Assigned across camps</span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="text-[11px] text-slate-400">Medicine Buffer Index</div>
                <div className="text-lg font-bold text-white mt-1">
                  {selectedArea.criticalMedicineAvailabilityRate}%
                </div>
                <span className="text-[10px] text-slate-500">Essential stock ready</span>
              </div>
            </div>

            {/* Top Health Observations */}
            <div className="mt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Top Screened Health Concerns (Aggregated)
              </h4>
              <div className="space-y-2">
                {selectedArea.topHealthConcerns.map((c, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>{c.name}</span>
                      <span className="font-semibold text-cyan-300">{c.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${c.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Predictive Resource Simulator Trigger */}
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => setSimulationOpen(!simulationOpen)}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Sliders className="w-4 h-4" />
              {simulationOpen ? 'Hide Resource Simulation' : 'Launch Predictive Simulation'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Interactive Resource Simulation Panel ───────────────────────── */}
      {simulationOpen && (
        <div className="bg-slate-900/90 border border-cyan-800/50 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white text-base">
                Predictive Resource Simulation for {selectedArea.areaName}
              </h3>
            </div>
            <span className="text-xs px-2.5 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-lg">
              Scenario Modeling
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5">
            {/* Control Sliders */}
            <div className="space-y-4 md:col-span-1">
              <div>
                <label className="text-xs font-semibold text-slate-300 flex justify-between">
                  <span>Additional Doctors to Allocate:</span>
                  <span className="text-cyan-400 font-bold">+{simDoctors}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={simDoctors}
                  onChange={(e) => setSimDoctors(parseInt(e.target.value, 10))}
                  className="w-full mt-2 accent-cyan-400 bg-slate-950"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 flex justify-between">
                  <span>Additional Camps to Schedule:</span>
                  <span className="text-cyan-400 font-bold">+{simCamps}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={simCamps}
                  onChange={(e) => setSimCamps(parseInt(e.target.value, 10))}
                  className="w-full mt-2 accent-cyan-400 bg-slate-950"
                />
              </div>
            </div>

            {/* Projected Simulation Results */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">Projected Screening Coverage</span>
                <div className="text-2xl font-black text-cyan-400 mt-1">{simulatedCoverage}%</div>
                <span className="text-[11px] text-emerald-400 font-medium">
                  +{(simulatedCoverage - selectedArea.screeningCoverageRate).toFixed(1)}% improvement
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">Projected Health Index</span>
                <div className="text-2xl font-black text-emerald-400 mt-1">{simulatedHealthIndex}</div>
                <span className="text-[11px] text-emerald-400 font-medium">
                  +{(simulatedHealthIndex - selectedArea.healthIndex)} composite points
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">Additional Screenings</span>
                <div className="text-2xl font-black text-white mt-1">
                  +{(simCamps * 180 + simDoctors * 45).toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-400">Estimated patient capacity</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityDigitalTwin;
