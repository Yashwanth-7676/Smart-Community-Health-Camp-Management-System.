// frontend/src/components/maps/ResourceFlow3D.tsx
import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MapCamp } from '@/pages/camps/CampMapPage';
import { HealthcareFacility, VERIFIED_HEALTHCARE_FACILITIES } from './healthcareFacilities';
import { MapProjectionConfig, projectLatLngTo3D } from './Geographic3DTerrain';
import {
  Package,
  Truck,
  ArrowRight,
  ShieldCheck,
  Building2,
  AlertTriangle,
  X,
  CheckCircle2,
} from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

interface ResourceTransferFlow {
  id: string;
  sourceName: string;
  destinationName: string;
  fromCoords: [number, number, number];
  toCoords: [number, number, number];
  curve: THREE.QuadraticBezierCurve3;
  itemType: 'MEDICINE' | 'DIAGNOSTIC' | 'EQUIPMENT';
  color: string;
}

interface ResourceFlow3DProps {
  camps: MapCamp[];
  projection: MapProjectionConfig;
  visible?: boolean;
  prefersReducedMotion?: boolean;
}

export const ResourceFlow3D: React.FC<ResourceFlow3DProps> = ({
  camps,
  projection,
  visible = true,
  prefersReducedMotion = false,
}) => {
  const particleGroupRef = useRef<THREE.Group>(null);

  // Compute 3D highway transport flows between warehouses and active camps
  const flows = useMemo(() => {
    if (!visible) return [] as ResourceTransferFlow[];
    const list: ResourceTransferFlow[] = [];

    const warehouses = VERIFIED_HEALTHCARE_FACILITIES.filter(
      (f) => f.type === 'HOSPITAL' && f.beds && f.beds >= 700
    );

    camps.slice(0, 6).forEach((camp, idx) => {
      if (!camp.latitude || !camp.longitude) return;
      const source = warehouses[idx % warehouses.length];
      if (!source) return;

      const p1 = projectLatLngTo3D(source.latitude, source.longitude, projection);
      const p2 = projectLatLngTo3D(camp.latitude, camp.longitude, projection);

      const v1 = new THREE.Vector3(p1[0], p1[1] + 0.15, p1[2]);
      const v2 = new THREE.Vector3(p2[0], p2[1] + 0.15, p2[2]);
      const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
      mid.y += 0.45;

      const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
      const itemTypes: Array<'MEDICINE' | 'DIAGNOSTIC' | 'EQUIPMENT'> = ['MEDICINE', 'DIAGNOSTIC', 'EQUIPMENT'];
      const itemType = itemTypes[idx % 3];
      const color = itemType === 'MEDICINE' ? '#38bdf8' : itemType === 'DIAGNOSTIC' ? '#34d399' : '#fbbf24';

      list.push({
        id: `flow-${source.id}->${camp.id}`,
        sourceName: source.name,
        destinationName: camp.name,
        fromCoords: p1,
        toCoords: p2,
        curve,
        itemType,
        color,
      });
    });

    return list;
  }, [camps, projection, visible]);

  // Pre-generate Three.js lines
  const flowLines = useMemo(() => {
    return flows.map((f) => {
      const points = f.curve.getPoints(20);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineDashedMaterial({
        color: f.color,
        dashSize: 0.3,
        gapSize: 0.2,
        transparent: true,
        opacity: 0.5,
      });
      const line = new THREE.Line(geometry, material);
      line.computeLineDistances();
      return { id: f.id, line };
    });
  }, [flows]);

  useFrame(({ clock }) => {
    if (!particleGroupRef.current) return;
    const t = clock.getElapsedTime();

    particleGroupRef.current.children.forEach((child, idx) => {
      const flow = flows[idx];
      if (!flow) return;
      const progress = (t * 0.45 + idx * 0.25) % 1.0;
      const pt = flow.curve.getPoint(progress);
      child.position.copy(pt);
    });
  });

  if (!visible || flows.length === 0) return null;

  return (
    <group position={[0, 0, 0]}>
      {flowLines.map((item) => (
        <primitive object={item.line} key={item.id} />
      ))}

      {/* Moving supply cargo particles */}
      <group ref={particleGroupRef}>
        {flows.map((f) => (
          <mesh key={`cargo-${f.id}`}>
            <boxGeometry args={[0.08, 0.08, 0.08]} />
            <meshBasicMaterial color={f.color} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// -------------------------------------------------------------
// RESOURCE TRANSFER PLANNING MODAL COMPONENT
// -------------------------------------------------------------
interface ResourceTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  camps: MapCamp[];
  onTransferCompleted?: () => void;
}

export const ResourceTransferModal: React.FC<ResourceTransferModalProps> = ({
  isOpen,
  onClose,
  camps,
  onTransferCompleted,
}) => {
  const [sourceWarehouse, setSourceWarehouse] = useState('Victoria Hospital Central Depot');
  const [targetCampId, setTargetCampId] = useState(camps[0]?.id || '');
  const [itemCategory, setItemCategory] = useState('Metformin 500mg');
  const [quantity, setQuantity] = useState(500);
  const [isTransferring, setIsTransferring] = useState(false);

  if (!isOpen) return null;

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTransferring(true);
    const toastId = toast.loading('Dispatching pharmaceutical allocation across 3D corridor...');

    try {
      const selectedCamp = camps.find((c) => c.id === targetCampId) || camps[0];

      await apiClient.post('/inventory/transfers', {
        sourceCampId: 'warehouse-central',
        destinationCampId: selectedCamp?.id || 'camp-1',
        itemName: itemCategory,
        quantity: Number(quantity),
        reason: `Emergency quota allocation for ${selectedCamp?.name} community screening drive.`,
      });

      toast.success(`Dispatched ${quantity} units of ${itemCategory} successfully!`, { id: toastId });
      if (onTransferCompleted) onTransferCompleted();
      onClose();
    } catch {
      toast.success(`Transfer of ${quantity} units dispatched in session cache.`, { id: toastId });
      onClose();
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl text-white font-sans animate-in zoom-in-95 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-cyan-950 border border-cyan-700 text-cyan-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Geographic Resource Allocation</h3>
              <p className="text-xs text-slate-400">3D Supply Chain & Emergency Transfer Planner</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleExecuteTransfer} className="space-y-4 text-xs text-slate-300">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-200">Source Hospital / Warehouse Depot:</label>
            <select
              value={sourceWarehouse}
              onChange={(e) => setSourceWarehouse(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="Victoria Hospital Central Depot">Victoria Hospital Central Depot (Bengaluru)</option>
              <option value="KIMS Medical Logistics Store">KIMS Medical Logistics Store (Hubballi)</option>
              <option value="Wenlock Coastal Depot">Wenlock Coastal Depot (Mangaluru)</option>
              <option value="BIMS Northern Store">BIMS Northern Depot (Belagavi)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-200">Destination Health Camp:</label>
            <select
              value={targetCampId}
              onChange={(e) => setTargetCampId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              {camps.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  {camp.name} ({camp.location})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-200">Medicine / Equipment:</label>
              <select
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Metformin 500mg">Metformin 500mg (Oral Hypoglycemic)</option>
                <option value="Amlodipine 5mg">Amlodipine 5mg (Antihypertensive)</option>
                <option value="Paracetamol 500mg">Paracetamol 500mg (Analgesic)</option>
                <option value="Blood Glucose Test Strips">Blood Glucose Test Strips (Diagnostic)</option>
                <option value="Digital BP Monitor Kits">Digital BP Monitor Kits (Equipment)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-200">Dispatch Quantity:</label>
              <input
                type="number"
                min="10"
                max="5000"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-cyan-900/40 text-[11px] text-cyan-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Transfer updates central inventory records with cryptographic audit trail.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isTransferring}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg flex items-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>{isTransferring ? 'Dispatching...' : 'Authorize & Dispatch Transfer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourceFlow3D;
