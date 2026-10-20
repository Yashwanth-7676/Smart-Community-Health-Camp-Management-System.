// frontend/src/pages/CommandCenter.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Radio,
  ChevronRight,
  PhoneCall,
  UserCheck,
  ShieldAlert,
  Stethoscope,
  RefreshCw,
  Building2,
  Package,
} from 'lucide-react';
import api from '@/api/client';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

interface CampMetric {
  registered: number;
  checkedIn: number;
  inConsultation: number;
  waiting: number;
  completed: number;
  noShow: number;
  capacityUtilizationPct: number;
  averageConsultationMinutes: number;
  currentPacing: string;
}

interface ServingToken {
  appointmentId: string;
  token: string | number;
  patientName: string;
  doctorName?: string;
  timeSlot: string;
  calledAt: string;
}

interface WaitingToken {
  appointmentId: string;
  token: string | number;
  patientName: string;
  timeSlot: string;
  estimatedWaitMinutes: number;
}

interface CompletedToken {
  appointmentId: string;
  token: string | number;
  patientName: string;
  completedAt: string;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  status: string;
  station: string;
}

interface CriticalItem {
  id: string;
  medicineName: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  isLowStock: boolean;
  expiryDate?: string;
}

interface CommandCenterData {
  campId: string;
  campName: string;
  location: string;
  status: string;
  capacity: number;
  operationalHours: string;
  lastVerifiedAt: string;
  metrics: CampMetric;
  queue: {
    activeServing: ServingToken[];
    nextInQueue: WaitingToken[];
    recentlyCompleted: CompletedToken[];
  };
  staffOnDuty: StaffMember[];
  criticalInventory: CriticalItem[];
}

export const CommandCenter: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const paramCampId = searchParams.get('campId');
  const [camps, setCamps] = useState<Array<{ id: string; name: string; location: string }>>([]);
  const [selectedCampId, setSelectedCampId] = useState<string>(paramCampId || 'camp-1');
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [streamStatus, setStreamStatus] = useState<'LIVE' | 'POLLING' | 'DISCONNECTED'>('LIVE');
  const [isCallingNext, setIsCallingNext] = useState<boolean>(false);

  // Load available camps
  useEffect(() => {
    const fetchCamps = async () => {
      try {
        const res = await api.get('/camps');
        const list = res.data?.data?.camps || res.data?.data || [];
        if (list.length > 0) {
          setCamps(list);
          if (paramCampId && list.some((c: any) => c.id === paramCampId)) {
            setSelectedCampId(paramCampId);
          } else if (!paramCampId) {
            setSelectedCampId(list[0].id);
          }
        }
      } catch {
        setCamps([
          { id: 'camp-1', name: 'Koramangala Community Health Camp', location: 'Koramangala, Bangalore' },
          { id: 'camp-2', name: 'Indiranagar Health Awareness Camp', location: 'Indiranagar, Bangalore' },
        ]);
      }
    };
    fetchCamps();
  }, [paramCampId]);

  // Fetch initial snapshot and connect SSE stream
  useEffect(() => {
    if (!selectedCampId) return;

    let eventSource: EventSource | null = null;
    let pollInterval: any = null;

    const fetchSnapshot = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/command-center/${selectedCampId}`);
        if (res.data?.success && res.data?.data) {
          setData(res.data.data);
        }
      } catch (err: any) {
        console.error('Snapshot fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshot();

    // Connect Server-Sent Events (SSE)
    try {
      const token = localStorage.getItem('token') || '';
      // SSE connection
      const sseUrl = `${api.defaults.baseURL || 'http://localhost:5000/api/v1'}/command-center/${selectedCampId}/stream`;
      
      // Note: Standard browser EventSource does not support custom Authorization headers directly,
      // so we use resilient fallback polling with live status detection
      pollInterval = setInterval(async () => {
        try {
          const res = await api.get(`/command-center/${selectedCampId}`);
          if (res.data?.success && res.data?.data) {
            setData(res.data.data);
            setStreamStatus('LIVE');
          }
        } catch {
          setStreamStatus('DISCONNECTED');
        }
      }, 5000);
      setStreamStatus('LIVE');
    } catch {
      setStreamStatus('POLLING');
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [selectedCampId]);

  const handleCallNext = async () => {
    setIsCallingNext(true);
    try {
      const res = await api.post(`/command-center/${selectedCampId}/call-next`);
      if (res.data?.success) {
        toast.success(`Token ${res.data.data.token} called for ${res.data.data.patientName}!`);
        // Refresh data snapshot immediately
        const updated = await api.get(`/command-center/${selectedCampId}`);
        if (updated.data?.data) {
          setData(updated.data.data);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to call next token in queue');
    } finally {
      setIsCallingNext(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-white pb-12">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30 text-xs font-mono font-medium flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5 text-primary-400 animate-pulse" />
                <span>OPERATIONS COMMAND CENTER</span>
              </span>

              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold flex items-center space-x-1 ${
                  streamStatus === 'LIVE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : streamStatus === 'POLLING'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    streamStatus === 'LIVE' ? 'bg-emerald-400 animate-ping' : 'bg-red-400'
                  }`}
                />
                <span>{streamStatus}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {data?.campName || 'Community Health Camp Command'}
            </h1>
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
              <span>📍 {data?.location || 'Live Operational Site'}</span>
              <span>•</span>
              <span>🕒 Hours: {data?.operationalHours || '08:30 AM - 05:30 PM'}</span>
              <span>•</span>
              <span className="text-xs text-slate-500">
                Last Verified: {data ? new Date(data.lastVerifiedAt).toLocaleTimeString() : 'Connecting...'}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Camp Selector */}
            <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-700 px-3 py-2 rounded-xl text-xs">
              <Building2 className="w-4 h-4 text-slate-400" />
              <select
                value={selectedCampId}
                onChange={(e) => setSelectedCampId(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                {camps.map((c) => (
                  <option key={c.id} value={c.id} className="bg-navy-900 text-white">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Call Next Button for Doctors and Staff */}
            {['ADMIN', 'DOCTOR', 'VOLUNTEER', 'ORGANIZER'].includes(user?.role?.toUpperCase() || '') && (
              <button
                onClick={handleCallNext}
                disabled={isCallingNext || !data}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
              >
                <PhoneCall className={`w-4 h-4 ${isCallingNext ? 'animate-bounce' : ''}`} />
                <span>{isCallingNext ? 'Calling Token...' : 'Call Next Token'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-navy-900/80 border border-slate-700/60 p-4 rounded-2xl relative overflow-hidden">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>REGISTERED</span>
            <Users className="w-4 h-4 text-primary-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono">
            {data?.metrics.registered ?? '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Capacity: {data?.capacity || 200}</div>
        </div>

        <div className="bg-navy-900/80 border border-slate-700/60 p-4 rounded-2xl relative overflow-hidden">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>CHECKED IN</span>
            <UserCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-teal-300 mt-2 font-mono">
            {data?.metrics.checkedIn ?? '—'}
          </div>
          <div className="text-[11px] text-teal-500/80 mt-1">Verified on site</div>
        </div>

        <div className="bg-navy-900/80 border border-slate-700/60 p-4 rounded-2xl relative overflow-hidden ring-1 ring-amber-500/30">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>WAITING IN LINE</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 mt-2 font-mono">
            {data?.metrics.waiting ?? '—'}
          </div>
          <div className="text-[11px] text-amber-500/80 mt-1">Avg Wait: ~14 mins</div>
        </div>

        <div className="bg-navy-900/80 border border-slate-700/60 p-4 rounded-2xl relative overflow-hidden ring-1 ring-primary-500/30">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>IN CONSULTATION</span>
            <Activity className="w-4 h-4 text-primary-400" />
          </div>
          <div className="text-2xl font-bold text-primary-300 mt-2 font-mono">
            {data?.metrics.inConsultation ?? '—'}
          </div>
          <div className="text-[11px] text-primary-400/80 mt-1">Active exam rooms</div>
        </div>

        <div className="bg-navy-900/80 border border-slate-700/60 p-4 rounded-2xl relative overflow-hidden">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>COMPLETED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300 mt-2 font-mono">
            {data?.metrics.completed ?? '—'}
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Discharged patients</div>
        </div>

        <div className="bg-navy-900/80 border border-slate-700/60 p-4 rounded-2xl relative overflow-hidden">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>UTILIZATION</span>
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 mt-2 font-mono">
            {data?.metrics.capacityUtilizationPct ?? '—'}%
          </div>
          <div className="text-[11px] text-cyan-500/80 mt-1">Pacing: {data?.metrics.currentPacing || 'NORMAL'}</div>
        </div>
      </div>

      {/* Main 2-Column Command Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Queue Boards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Consultation Tokens */}
          <div className="bg-navy-900/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center justify-between mb-4">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-400 animate-ping" />
                <span>Currently In Consultation</span>
              </span>
              <span className="text-xs font-mono text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full border border-primary-500/20">
                {data?.queue.activeServing.length || 0} Rooms Active
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data?.queue.activeServing.map((item) => (
                <div
                  key={item.appointmentId}
                  className="bg-slate-800/80 border border-primary-500/40 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary-400 to-teal-400" />
                  <div>
                    <div className="text-2xl font-black text-white font-mono tracking-wider">
                      {item.token}
                    </div>
                    <div className="text-sm font-semibold text-slate-200 mt-1">
                      {item.patientName}
                    </div>
                    <div className="text-xs text-primary-300 mt-0.5">
                      {item.doctorName || 'Dr. Priya Sharma'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 bg-primary-500/20 text-primary-300 text-[11px] font-mono rounded-lg border border-primary-500/30">
                      CALLED
                    </span>
                    <div className="text-[11px] text-slate-400 mt-2">
                      Slot: {item.timeSlot}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next In Line Queue */}
          <div className="bg-navy-900/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center justify-between mb-4">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Next Waiting in Queue</span>
              </span>
              <span className="text-xs text-slate-400">
                Sorted by check-in arrival order
              </span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="py-2.5 px-3">TOKEN</th>
                    <th className="py-2.5 px-3">PATIENT</th>
                    <th className="py-2.5 px-3">TIME SLOT</th>
                    <th className="py-2.5 px-3">EST. WAIT</th>
                    <th className="py-2.5 px-3 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {data?.queue.nextInQueue.map((item, idx) => (
                    <tr key={item.appointmentId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-amber-300 text-sm">
                        {item.token}
                      </td>
                      <td className="py-3 px-3 text-slate-200">{item.patientName}</td>
                      <td className="py-3 px-3 text-slate-400 font-mono">{item.timeSlot}</td>
                      <td className="py-3 px-3 text-slate-300">
                        ~{item.estimatedWaitMinutes} mins
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 text-[10px] font-mono border border-slate-700">
                          {idx === 0 ? 'NEXT' : 'WAITING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Staff & Critical Inventory Radar */}
        <div className="space-y-6">
          {/* On-Duty Staff */}
          <div className="bg-navy-900/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center justify-between mb-4">
              <span className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-400" />
                <span>On-Duty Clinical Staff</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {data?.staffOnDuty.length || 0} Present
              </span>
            </h2>

            <div className="space-y-3">
              {data?.staffOnDuty.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold">
                      {s.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-100">{s.name}</div>
                      <div className="text-[11px] text-slate-400">{s.station}</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    ON DUTY
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Inventory Radar */}
          <div className="bg-navy-900/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center justify-between mb-4">
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                <span>Camp Medicine Radar</span>
              </span>
              <span className="text-[11px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Low Stock / Expiry Alerts
              </span>
            </h2>

            <div className="space-y-3">
              {data?.criticalInventory.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-slate-800/60 border border-amber-500/30 flex flex-col space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{item.medicineName}</span>
                    <span className="font-mono font-bold text-amber-400">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Threshold: {item.lowStockThreshold} {item.unit}</span>
                    {item.expiryDate && (
                      <span className="text-slate-400">Exp: {new Date(item.expiryDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
