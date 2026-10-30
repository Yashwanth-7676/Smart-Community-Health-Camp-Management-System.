// frontend/src/components/maps/MobileUnitFleetTracker.tsx
import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  X,
  Phone,
  User,
  Activity,
  Fuel,
  RefreshCw,
} from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

export interface MMUVehicle {
  unitId: string;
  name: string;
  vehiclePlate: string;
  driverName: string;
  leadPhysician: string;
  contactPhone: string;
  assignedSector: string;
  district: string;
  latitude: number;
  longitude: number;
  speedKmH: number;
  operationalStatus: 'IN_TRANSIT' | 'ACTIVE_CAMP' | 'STOPPED' | 'MAINTENANCE';
  lastGpsSync: string;
  fuelLevelPercent: number;
  plannedStops: Array<{
    name: string;
    lat: number;
    lng: number;
    estimatedArrival: string;
    status: 'COMPLETED' | 'EN_ROUTE' | 'PENDING';
  }>;
  onBoardEquipment: string[];
}

interface MobileUnitFleetTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  onFocusMMU: (coords: [number, number]) => void;
  isAdmin?: boolean;
}

export const MobileUnitFleetTracker: React.FC<MobileUnitFleetTrackerProps> = ({
  isOpen,
  onClose,
  onFocusMMU,
  isAdmin = false,
}) => {
  const [fleet, setFleet] = useState<MMUVehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedUnit, setSelectedUnit] = useState<MMUVehicle | null>(null);

  const fetchFleet = () => {
    setLoading(true);
    apiClient
      .get('/digital-twin/mmu/fleet')
      .then((res) => {
        if (res.data?.data) {
          setFleet(res.data.data);
          if (!selectedUnit && res.data.data.length > 0) {
            setSelectedUnit(res.data.data[0]);
          }
        }
      })
      .catch(() => {
        // Fallback demo fleet
        const demo: MMUVehicle[] = [
          {
            unitId: 'MMU-KA-01',
            name: 'Sanjeevini Mobile Health Unit 01',
            vehiclePlate: 'KA-04-G-8821',
            driverName: 'Manjunath Gowda',
            leadPhysician: 'Dr. Arvind Swamy (MBBS, DNB)',
            contactPhone: '+91 94808 01001',
            assignedSector: 'Bengaluru Rural - Doddaballapura Circuit',
            district: 'Bengaluru Rural',
            latitude: 13.22,
            longitude: 77.58,
            speedKmH: 42,
            operationalStatus: 'IN_TRANSIT',
            lastGpsSync: new Date().toISOString(),
            fuelLevelPercent: 78,
            plannedStops: [
              { name: 'PHC Doddaballapura', lat: 13.2924, lng: 77.5428, estimatedArrival: '08:30 AM', status: 'COMPLETED' },
              { name: 'Hadonahalli Village Gate', lat: 13.3142, lng: 77.5189, estimatedArrival: '11:15 AM', status: 'EN_ROUTE' },
              { name: 'Konaghatta School Ground', lat: 13.3421, lng: 77.5612, estimatedArrival: '02:30 PM', status: 'PENDING' },
            ],
            onBoardEquipment: ['Portable Ultrasound', 'Automated CBC Counter', 'Digital 12-Lead ECG'],
          },
          {
            unitId: 'MMU-KA-02',
            name: 'Aarogya Vahini Coastal Unit 02',
            vehiclePlate: 'KA-19-G-4412',
            driverName: 'Suresh Shetty',
            leadPhysician: 'Dr. Kavitha Shenoy (MBBS)',
            contactPhone: '+91 94808 01002',
            assignedSector: 'Belthangady & Western Ghats Foothills',
            district: 'Dakshina Kannada',
            latitude: 13.05,
            longitude: 74.98,
            speedKmH: 0,
            operationalStatus: 'ACTIVE_CAMP',
            lastGpsSync: new Date().toISOString(),
            fuelLevelPercent: 64,
            plannedStops: [
              { name: 'Bantwal Taluk Hospital', lat: 12.8942, lng: 75.0347, estimatedArrival: '08:00 AM', status: 'COMPLETED' },
              { name: 'Sajipamuda Outreach Center', lat: 12.8512, lng: 75.0124, estimatedArrival: '10:00 AM', status: 'COMPLETED' },
            ],
            onBoardEquipment: ['Ophthalmic Slit Lamp', 'Dental Chair Unit', 'Malaria Rapid Diagnostic Kits'],
          },
        ];
        setFleet(demo);
        if (!selectedUnit) setSelectedUnit(demo[0]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchFleet();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdateStatus = async (status: 'IN_TRANSIT' | 'ACTIVE_CAMP' | 'STOPPED') => {
    if (!selectedUnit) return;
    const toastId = toast.loading(`Updating ${selectedUnit.unitId} operational status...`);
    try {
      await apiClient.patch(`/digital-twin/mmu/fleet/${selectedUnit.unitId}/status`, {
        operationalStatus: status,
        speedKmH: status === 'IN_TRANSIT' ? 45 : 0,
      });
      toast.success(`Status updated to ${status}`, { id: toastId });
      fetchFleet();
    } catch {
      toast.success(`Status updated locally in demonstration session`, { id: toastId });
      setSelectedUnit((prev) => prev ? { ...prev, operationalStatus: status } : null);
    }
  };

  return (
    <div className="absolute top-20 right-4 sm:right-6 z-40 w-96 max-w-[calc(100vw-2rem)] bg-slate-900/95 border border-amber-500/50 backdrop-blur-2xl rounded-3xl p-5 shadow-2xl text-white font-sans animate-in slide-in-from-right-4 duration-200 flex flex-col max-h-[85vh] overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-950 border border-amber-600 flex items-center justify-center text-amber-400">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-700/60 text-[9px] font-black uppercase tracking-wider text-amber-300 mb-0.5">
              <span>Mobile Clinic Telemetry</span>
            </div>
            <h3 className="text-sm font-black text-white">MMU Digital Tracking</h3>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={fetchFleet}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            title="Refresh Fleet Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3.5 pt-3 text-xs text-slate-300">
        {/* Vehicle Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          {fleet.map((u) => (
            <button
              key={u.unitId}
              type="button"
              onClick={() => {
                setSelectedUnit(u);
                onFocusMMU([u.latitude, u.longitude]);
              }}
              className={`py-1.5 px-2 rounded-xl text-[10px] font-bold truncate transition ${
                selectedUnit?.unitId === u.unitId
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {u.unitId}
            </button>
          ))}
        </div>

        {selectedUnit && (
          <div className="space-y-3">
            {/* Active Vehicle Card */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-white">{selectedUnit.name}</h4>
                  <span className="text-[10px] text-amber-400 font-mono">{selectedUnit.vehiclePlate}</span>
                </div>
                <span
                  className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                    selectedUnit.operationalStatus === 'IN_TRANSIT'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse'
                      : selectedUnit.operationalStatus === 'ACTIVE_CAMP'
                      ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {selectedUnit.operationalStatus} {selectedUnit.speedKmH > 0 && `(${selectedUnit.speedKmH} km/h)`}
                </span>
              </div>

              {/* Sector & Telemetry Metrics */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block">Assigned Sector:</span>
                  <span className="font-bold text-white block mt-0.5">{selectedUnit.district}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block">Fuel Tank Level:</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Fuel className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold text-white font-mono">{selectedUnit.fuelLevelPercent}%</span>
                  </div>
                </div>
              </div>

              {/* Assigned Staff Team */}
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[10px] space-y-1">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <User className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>Lead Doctor: <strong className="text-white">{selectedUnit.leadPhysician}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Phone className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="font-mono text-slate-200">{selectedUnit.contactPhone}</span>
                </div>
              </div>

              {/* Focus Button */}
              <button
                type="button"
                onClick={() => onFocusMMU([selectedUnit.latitude, selectedUnit.longitude])}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-1.5 transition"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Track Vehicle on 3D Map</span>
              </button>
            </div>

            {/* Planned Outreach Stops */}
            <div className="space-y-1.5">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block px-1">
                Planned Daily Outreach Stops
              </span>
              <div className="space-y-1.5">
                {selectedUnit.plannedStops.map((stop, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          stop.status === 'COMPLETED'
                            ? 'bg-emerald-400'
                            : stop.status === 'EN_ROUTE'
                            ? 'bg-amber-400 animate-ping'
                            : 'bg-slate-600'
                        }`}
                      />
                      <div>
                        <div className="font-bold text-white">{stop.name}</div>
                        <div className="text-[9px] text-slate-400">ETA: {stop.estimatedArrival}</div>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        stop.status === 'COMPLETED'
                          ? 'bg-emerald-950 text-emerald-400'
                          : stop.status === 'EN_ROUTE'
                          ? 'bg-amber-950 text-amber-400'
                          : 'bg-slate-900 text-slate-500'
                      }`}
                    >
                      {stop.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Manual Check-In Override */}
            {isAdmin && (
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-bold text-[10px] uppercase text-cyan-400 block">
                  Manual Status Check-In Override
                </span>
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('IN_TRANSIT')}
                    className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold"
                  >
                    En Route
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('ACTIVE_CAMP')}
                    className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold"
                  >
                    At Camp
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('STOPPED')}
                    className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold"
                  >
                    Stopped
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileUnitFleetTracker;
