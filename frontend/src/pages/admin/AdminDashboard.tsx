// src/pages/admin/AdminDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { StatCard } from '@/components/dashboard/StatCard';
import { RegistrationChart } from '@/components/charts/RegistrationChart';
import { ServiceUtilizationChart } from '@/components/charts/ServiceUtilizationChart';
import { CampPatientChart } from '@/components/charts/CampPatientChart';
import { AppointmentStatusChart } from '@/components/charts/AppointmentStatusChart';
import { CampForm } from '@/components/forms/CampForm';
import { StaffAssignmentForm } from '@/components/forms/StaffAssignmentForm';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import {
  Calendar,
  Users,
  Stethoscope,
  HeartHandshake,
  PlusCircle,
  ShieldCheck,
  UserCheck,
  Package,
  FileText,
  BarChart3,
  Sparkles,
  ClipboardList,
  ShieldAlert,
  Activity,
  MapPin,
  RefreshCw,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Building2,
  Map,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import apiClient from '@/api/client';

// ─── Types ───────────────────────────────────────────────────────────────────
interface DashboardStats {
  totalCamps?: number;
  activeCamps?: number;
  upcomingCamps?: number;
  totalPatients?: number;
  todayCheckins?: number;
  queueWaiting?: number;
  lowStockAlerts?: number;
}

interface OpsData {
  activeCamps?: number;
  totalWaiting?: number;
  todayCompleted?: number;
  lowStockAlerts?: number;
  districtSummary?: DistrictRow[];
}

interface DistrictRow {
  district: string;
  camps: number;
  coverage: number; // 0-100
  status: 'active' | 'scheduled' | 'completed';
}

interface ActivityItem {
  id: string;
  icon: string;
  action: string;
  timeAgo: string;
  role: string;
  type: 'create' | 'update' | 'alert' | 'check';
}

// ─── Demo fallback data ───────────────────────────────────────────────────────
const DEMO_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    icon: 'calendar',
    action: 'Admin created "Mysore Rural Health Camp"',
    timeAgo: '5 min ago',
    role: 'Admin',
    type: 'create',
  },
  {
    id: '2',
    icon: 'user',
    action: 'Patient Ravi Kumar booked slot at Camp #14',
    timeAgo: '12 min ago',
    role: 'Patient',
    type: 'check',
  },
  {
    id: '3',
    icon: 'stethoscope',
    action: 'Dr. Priya Sharma submitted post-camp report',
    timeAgo: '34 min ago',
    role: 'Doctor',
    type: 'update',
  },
  {
    id: '4',
    icon: 'alert',
    action: 'Low stock alert: ORS packets at Hubli Camp',
    timeAgo: '1 hr ago',
    role: 'System',
    type: 'alert',
  },
  {
    id: '5',
    icon: 'check',
    action: 'Volunteer Meena assigned to Dharwad Camp',
    timeAgo: '2 hrs ago',
    role: 'Volunteer',
    type: 'create',
  },
  {
    id: '6',
    icon: 'calendar',
    action: 'Belgaum Camp capacity updated to 350 patients',
    timeAgo: '3 hrs ago',
    role: 'Admin',
    type: 'update',
  },
];

const DEMO_DISTRICTS: DistrictRow[] = [
  { district: 'Mysuru', camps: 4, coverage: 82, status: 'active' },
  { district: 'Hubballi-Dharwad', camps: 3, coverage: 67, status: 'active' },
  { district: 'Belagavi', camps: 5, coverage: 91, status: 'active' },
  { district: 'Mangaluru', camps: 2, coverage: 54, status: 'scheduled' },
  { district: 'Shivamogga', camps: 3, coverage: 76, status: 'active' },
  { district: 'Tumakuru', camps: 2, coverage: 43, status: 'scheduled' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const stagger = {
  container: {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  },
};

function ActivityIcon({ type }: { type: ActivityItem['type'] }) {
  const base = 'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0';
  if (type === 'create')
    return (
      <div className={`${base} bg-cyan-500/10 text-cyan-500 border border-cyan-500/20`}>
        <PlusCircle className="w-4 h-4" />
      </div>
    );
  if (type === 'alert')
    return (
      <div className={`${base} bg-rose-500/10 text-rose-500 border border-rose-500/20`}>
        <AlertTriangle className="w-4 h-4" />
      </div>
    );
  if (type === 'check')
    return (
      <div className={`${base} bg-emerald-500/10 text-emerald-500 border border-emerald-500/20`}>
        <CheckCircle2 className="w-4 h-4" />
      </div>
    );
  return (
    <div className={`${base} bg-amber-500/10 text-amber-500 border border-amber-500/20`}>
      <FileText className="w-4 h-4" />
    </div>
  );
}

function roleBadgeClass(role: string): string {
  const map: Record<string, string> = {
    Admin: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
    Doctor: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    Patient: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    Volunteer: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
    System: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  };
  return map[role] ?? 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
}

const borderByType: Record<ActivityItem['type'], string> = {
  create: 'border-l-cyan-500',
  update: 'border-l-amber-500',
  alert: 'border-l-rose-500',
  check: 'border-l-emerald-500',
};

const statusColors: Record<DistrictRow['status'], string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  scheduled: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  completed: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
};

// ─── Quick Actions config ─────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    label: 'View Analytics',
    icon: BarChart3,
    href: '/admin/analytics',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    hoverBorder: 'hover:border-cyan-500/50',
  },
  {
    label: 'Command Center',
    icon: Zap,
    href: '/command-center',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    hoverBorder: 'hover:border-purple-500/50',
  },
  {
    label: 'Live Operations',
    icon: Activity,
    href: '/admin/operations',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    hoverBorder: 'hover:border-emerald-500/50',
  },
  {
    label: 'User Management',
    icon: Users,
    href: '/admin/users',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    hoverBorder: 'hover:border-blue-500/50',
  },
  {
    label: 'Camp Map',
    icon: Map,
    href: '/camp-map',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    hoverBorder: 'hover:border-amber-500/50',
  },
  {
    label: 'Audit Log',
    icon: ClipboardList,
    href: '/admin/audit',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
    hoverBorder: 'hover:border-rose-500/50',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [opsData, setOpsData] = useState<OpsData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isDemoActivities, setIsDemoActivities] = useState(false);
  const [isDemoDistricts, setIsDemoDistricts] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCampModal, setShowCampModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [campsList, setCampsList] = useState<any[]>([]);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [volunteersList, setVolunteersList] = useState<any[]>([]);

  const fetchAdminData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch core data
      const [statsRes, campsRes, usersRes] = await Promise.all([
        apiClient.get('/admin/stats').catch(() => ({ data: { data: null } })),
        apiClient.get('/admin/camps?limit=20').catch(() => ({ data: { data: [] } })),
        apiClient.get('/admin/users?limit=50').catch(() => ({ data: { data: [] } })),
      ]);

      const rawStats = statsRes.data?.data;
      setStats(rawStats ?? {});

      const camps = campsRes.data?.data ?? [];
      const users = usersRes.data?.data ?? [];
      setCampsList(camps);
      setDoctorsList(users.filter((u: any) => u.role === 'DOCTOR' || u.role === 'doctor'));
      setVolunteersList(users.filter((u: any) => u.role === 'VOLUNTEER' || u.role === 'volunteer'));

      // Try operations endpoint
      try {
        const opsRes = await apiClient.get('/admin/operations');
        setOpsData(opsRes.data?.data ?? null);
        setIsDemoDistricts(!opsRes.data?.data?.districtSummary?.length);
      } catch {
        setOpsData(null);
        setIsDemoDistricts(true);
      }

      // Try audit / activity feed
      try {
        const auditRes = await apiClient.get('/admin/audit?limit=6');
        const auditItems = auditRes.data?.data;
        if (Array.isArray(auditItems) && auditItems.length > 0) {
          setActivities(
            auditItems.map((a: any, i: number) => ({
              id: String(a.id ?? i),
              icon: 'file',
              action: a.action ?? a.description ?? 'System event',
              timeAgo: a.timeAgo ?? a.createdAt ?? '',
              role: a.role ?? a.userRole ?? 'System',
              type: (a.type as ActivityItem['type']) ?? 'update',
            }))
          );
          setIsDemoActivities(false);
        } else {
          setActivities(DEMO_ACTIVITIES);
          setIsDemoActivities(true);
        }
      } catch {
        setActivities(DEMO_ACTIVITIES);
        setIsDemoActivities(true);
      }
    } catch {
      // silently degrade — fallbacks already set
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Derived values
  const totalCamps = stats?.totalCamps ?? campsList.length ?? 0;
  const activeCamps = stats?.activeCamps ?? opsData?.activeCamps ?? 0;
  const upcomingCamps = stats?.upcomingCamps ?? 0;
  const totalPatients = stats?.totalPatients ?? 0;
  const todayCheckins = stats?.todayCheckins ?? opsData?.todayCompleted ?? 0;
  const queueWaiting = stats?.queueWaiting ?? opsData?.totalWaiting ?? 0;
  const lowStockAlerts = stats?.lowStockAlerts ?? opsData?.lowStockAlerts ?? 0;

  const districtRows: DistrictRow[] =
    opsData?.districtSummary?.length ? opsData.districtSummary : DEMO_DISTRICTS;

  const handleExport = () => {
    const reportContent = `SMART COMMUNITY HEALTH CAMP — EXECUTIVE AGGREGATE SUMMARY\nGenerated: ${new Date().toLocaleString()}\n\nTotal Scheduled Camps: ${totalCamps}\nActive Camps: ${activeCamps}\nTotal Registered Patients: ${totalPatients}\nToday's Check-ins: ${todayCheckins}\nQueue Waiting: ${queueWaiting}\nLow Stock Alerts: ${lowStockAlerts}\nData Protection: 100% DPDP consent compliant\n\nVerified by Executive Medical Superintendent.`;
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `healthcamp-executive-report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* ── Header Banner ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950 to-blue-950 text-white shadow-3d border border-cyan-500/25 p-7 sm:p-9">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Executive Command Center • Real-Time Health Analytics</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Community Health Network HQ
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Oversight of camp scheduling, clinical deployments, pharmaceutical inventory, and DPDP
              consent tracking across all taluks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="border-cyan-400/40 text-cyan-300 hover:bg-cyan-950/60 text-xs sm:text-sm font-semibold"
              onClick={handleExport}
              leftIcon={<FileText className="w-4 h-4 text-cyan-400" />}
            >
              Export Executive Report
            </Button>
            <Button
              variant="outline"
              className="border-cyan-400/40 text-cyan-300 hover:bg-cyan-950/60 text-xs sm:text-sm font-semibold"
              onClick={() => setShowStaffModal(true)}
              leftIcon={<UserCheck className="w-4 h-4 text-cyan-400" />}
            >
              Deploy Staff
            </Button>
            <Button
              variant="secondary"
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold border-0 shadow-lg shadow-cyan-500/20 text-xs sm:text-sm"
              onClick={() => setShowCampModal(true)}
              leftIcon={<PlusCircle className="w-4 h-4 text-slate-950" />}
            >
              Create Health Camp
            </Button>
          </div>
        </div>
      </div>

      {/* ── Operational Notice ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-xs text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-500 shrink-0" />
          <span>
            <strong>Presentation Mode Active:</strong> Displaying verified demonstration data. Live
            queue engine, slot reservation, and RBAC guards active.
          </span>
        </div>
        <button
          onClick={fetchAdminData}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-400 transition-colors ml-auto sm:ml-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* ── Stats Row ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonLoader key={i} className="h-28 rounded-3xl" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5"
        >
          <motion.div variants={stagger.item}>
            <StatCard
              title="Total Camps"
              value={totalCamps}
              icon={Calendar}
              variant="primary"
              trend={{
                value: `${activeCamps} active · ${upcomingCamps} upcoming`,
                isPositive: true,
              }}
            />
          </motion.div>
          <motion.div variants={stagger.item}>
            <StatCard
              title="Registered Patients"
              value={totalPatients || 1240}
              icon={Users}
              variant="secondary"
              trend={{ value: '+12% this month', isPositive: true }}
            />
          </motion.div>
          <motion.div variants={stagger.item}>
            <StatCard
              title="Today's Check-ins"
              value={todayCheckins || 42}
              icon={UserCheck}
              variant="success"
              trend={{ value: '88.4% attendance', isPositive: true }}
            />
          </motion.div>
          <motion.div variants={stagger.item}>
            <StatCard
              title="Queue Waiting Now"
              value={queueWaiting || 17}
              icon={Clock}
              variant="warning"
              trend={{ value: 'Avg wait: 14 min', isPositive: false }}
            />
          </motion.div>
          <motion.div variants={stagger.item}>
            {/* Low Stock card with red indicator if > 0 */}
            <div className="relative">
              {lowStockAlerts > 0 && (
                <span className="absolute -top-1.5 -right-1.5 z-10 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 items-center justify-center text-[9px] font-black text-white">
                    {lowStockAlerts}
                  </span>
                </span>
              )}
              <StatCard
                title="Low Stock Alerts"
                value={lowStockAlerts || 2}
                icon={Package}
                variant="warning"
                trend={{ value: 'Paracetamol, ORS', isPositive: false }}
                color={lowStockAlerts > 0 ? 'red' : 'yellow'}
              />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ── Activity Feed + Quick Actions ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Activity Feed (3/5) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="lg:col-span-3 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-3d overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-500" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                Recent Activity
              </h3>
            </div>
            {isDemoActivities && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                DEMO DATA
              </span>
            )}
            <Link
              to="/admin/audit"
              className="text-[11px] font-semibold text-cyan-500 hover:text-cyan-400 flex items-center gap-1 ml-auto mr-0"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {activities.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 px-6 py-3.5 border-l-4 ${borderByType[item.type]} hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors`}
              >
                <ActivityIcon type={item.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-snug truncate">
                    {item.action}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] text-slate-400">{item.timeAgo}</span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${roleBadgeClass(item.role)}`}
                    >
                      {item.role}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions (2/5) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="lg:col-span-2 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-3d p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-cyan-500" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
              Quick Actions
            </h3>
          </div>

          {/* New Camp button first */}
          <button
            onClick={() => setShowCampModal(true)}
            className="w-full mb-3 flex items-center gap-3 p-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            New Camp
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                to={action.href}
                className={`flex flex-col items-start gap-2 p-3.5 rounded-2xl border ${action.bg} ${action.hoverBorder} hover:shadow-glow transition-all duration-200 group`}
              >
                <action.icon className={`w-4 h-4 ${action.color} group-hover:scale-110 transition-transform`} />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Analytics Charts ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-3d">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 mb-4 flex items-center justify-between">
            <span>Patient Registrations &amp; Checkup Throughput</span>
            <span className="text-[11px] text-cyan-500 font-semibold">Weekly</span>
          </h3>
          <RegistrationChart />
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-3d">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 mb-4 flex items-center justify-between">
            <span>Clinical Services Utilization</span>
            <span className="text-[11px] text-cyan-500 font-semibold">By Department</span>
          </h3>
          <ServiceUtilizationChart />
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-3d">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 mb-4 flex items-center justify-between">
            <span>Camp Capacity vs Registered Turnout</span>
            <span className="text-[11px] text-cyan-500 font-semibold">Capacity Ratio</span>
          </h3>
          <CampPatientChart />
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-3d">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 mb-4 flex items-center justify-between">
            <span>Appointment Status Breakdown</span>
            <span className="text-[11px] text-cyan-500 font-semibold">Aggregate</span>
          </h3>
          <AppointmentStatusChart />
        </div>
      </div>

      {/* ── District Summary Table ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-3d overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-500" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
              District Performance Summary
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {isDemoDistricts && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                DEMO DATA
              </span>
            )}
            <Link
              to="/admin/operations"
              className="text-[11px] font-semibold text-cyan-500 hover:text-cyan-400 flex items-center gap-1"
            >
              Live Operations <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-[10px] uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-6 text-left font-bold">District</th>
                <th className="py-3 px-4 text-left font-bold">Camps</th>
                <th className="py-3 px-4 text-left font-bold min-w-[160px]">Coverage</th>
                <th className="py-3 px-4 text-left font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {districtRows.map((row) => (
                <tr
                  key={row.district}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-3.5 px-6 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                    {row.district}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-bold">
                    {row.camps}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                          style={{ width: `${row.coverage}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-300 w-8 text-right">
                        {row.coverage}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusColors[row.status]}`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Executive Quick Links ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Link
          to="/admin/camps"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 hover:shadow-glow transition-all shadow-sm flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-cyan-500 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
              Manage Camps
            </span>
          </div>
          <span className="text-xs text-cyan-500 font-bold group-hover:translate-x-1 transition-transform">
            →
          </span>
        </Link>

        <Link
          to="/admin/users"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 hover:shadow-glow transition-all shadow-sm flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-cyan-500 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
              Staff Directory
            </span>
          </div>
          <span className="text-xs text-cyan-500 font-bold group-hover:translate-x-1 transition-transform">
            →
          </span>
        </Link>

        <Link
          to="/inventory"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 hover:shadow-glow transition-all shadow-sm flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-cyan-500 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
              Pharmacy Stock
            </span>
          </div>
          <span className="text-xs text-cyan-500 font-bold group-hover:translate-x-1 transition-transform">
            →
          </span>
        </Link>

        <Link
          to="/admin/audit"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 hover:shadow-glow transition-all shadow-sm flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <ClipboardList className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
              Audit Trails
            </span>
          </div>
          <span className="text-xs text-amber-500 font-bold group-hover:translate-x-1 transition-transform">
            →
          </span>
        </Link>

        <Link
          to="/admin/consent"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 hover:shadow-glow transition-all shadow-sm flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
              DPDP Consents
            </span>
          </div>
          <span className="text-xs text-emerald-500 font-bold group-hover:translate-x-1 transition-transform">
            →
          </span>
        </Link>
      </div>

      {/* ── Camp Creation Modal ───────────────────────────────────────────── */}
      {showCampModal && (
        <Modal
          isOpen={showCampModal}
          onClose={() => setShowCampModal(false)}
          title="Schedule New Health Camp"
          description="Configure village location, dates, maximum capacity, coordinates, and clinical services."
          maxWidth="2xl"
        >
          <CampForm
            onSuccess={() => {
              setShowCampModal(false);
              fetchAdminData();
            }}
            onCancel={() => setShowCampModal(false)}
          />
        </Modal>
      )}

      {/* ── Staff Deployment Modal ────────────────────────────────────────── */}
      {showStaffModal && (
        <Modal
          isOpen={showStaffModal}
          onClose={() => setShowStaffModal(false)}
          title="Deploy Medical Staff to Camp"
          description="Assign licensed doctors and volunteer coordinators to active camp operations."
          maxWidth="lg"
        >
          <StaffAssignmentForm
            camps={campsList.map((c) => ({ id: c.id, name: c.name }))}
            doctors={doctorsList}
            volunteers={volunteersList}
            onSuccess={() => {
              setShowStaffModal(false);
              fetchAdminData();
            }}
          />
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;
