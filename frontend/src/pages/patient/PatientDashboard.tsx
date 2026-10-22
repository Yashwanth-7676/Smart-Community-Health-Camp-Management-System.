// src/pages/patient/PatientDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useMyAppointments } from '@/hooks/useAppointments';
import { StatCard } from '@/components/dashboard/StatCard';
import { QueueToken } from '@/components/common/QueueToken';
import { QRCodeDisplay } from '@/components/common/QRCodeDisplay';
import { LiveQueueDisplay } from '@/components/common/LiveQueueDisplay';
import { DigitalHealthPassport } from '@/components/common/DigitalHealthPassport';
import { DigitalHealthCard } from '@/components/passport/DigitalHealthCard';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Calendar,
  FileText,
  Clock,
  HeartPulse,
  PlusCircle,
  QrCode,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileDown,
  Sparkles,
  MapPin,
  Bell,
  Map,
  User,
  Navigation,
  CheckCheck,
  XCircle,
  AlertCircle,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/utils/helpers';
import apiClient from '@/api/client';

// ─── Animation Variants ──────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUpVariant = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getGreeting(): { label: string; Icon: React.ElementType } {
  const hour = new Date().getHours();
  if (hour < 12) return { label: 'Good morning', Icon: Sun };
  if (hour < 17) return { label: 'Good afternoon', Icon: Sunset };
  return { label: 'Good evening', Icon: Moon };
}

function getDaysUntil(dateStr: string): string {
  try {
    const target = new Date(dateStr);
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - now.getTime()) / 86_400_000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 0) return `${Math.abs(diff)}d ago`;
    return `In ${diff} days`;
  } catch {
    return '';
  }
}

// ─── Status Badge (inline) ────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { dot: string; text: string; label: string }> = {
  PENDING: {
    dot: 'bg-amber-400',
    text: 'text-amber-400',
    label: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30',
  },
  CONFIRMED: {
    dot: 'bg-cyan-400',
    text: 'text-cyan-400',
    label: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30',
  },
  COMPLETED: {
    dot: 'bg-emerald-400',
    text: 'text-emerald-400',
    label: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
  },
  CANCELLED: {
    dot: 'bg-red-400',
    text: 'text-red-400',
    label: 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30',
  },
};

function StatusIcon({ status }: { status: string }) {
  if (status === 'COMPLETED') return <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />;
  if (status === 'CANCELLED') return <XCircle className="w-3.5 h-3.5 text-red-400" />;
  if (status === 'CONFIRMED') return <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />;
  return <AlertCircle className="w-3.5 h-3.5 text-amber-400" />;
}

// ─── Quick Actions Data ───────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    label: 'Book Appointment',
    to: '/patient/book',
    icon: PlusCircle,
    color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 hover:border-cyan-400/60',
    iconColor: 'text-cyan-400',
  },
  {
    label: 'Find Health Camps',
    to: '/camps',
    icon: Compass,
    color: 'from-violet-500/20 to-purple-500/10 border-violet-500/30 hover:border-violet-400/60',
    iconColor: 'text-violet-400',
  },
  {
    label: 'View My Reports',
    to: '/reports',
    icon: FileText,
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 hover:border-emerald-400/60',
    iconColor: 'text-emerald-400',
  },
  {
    label: 'Notifications',
    to: '/notifications',
    icon: Bell,
    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 hover:border-amber-400/60',
    iconColor: 'text-amber-400',
  },
  {
    label: 'Camp Map',
    to: '/camp-map',
    icon: Map,
    color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 hover:border-blue-400/60',
    iconColor: 'text-blue-400',
  },
  {
    label: 'My Health Profile',
    to: '/patient/profile',
    icon: User,
    color: 'from-rose-500/20 to-pink-500/10 border-rose-500/30 hover:border-rose-400/60',
    iconColor: 'text-rose-400',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: appointmentsData, isLoading } = useMyAppointments();
  const [selectedTokenAppointment, setSelectedTokenAppointment] = useState<any>(null);
  const [qrModalAppointment, setQrModalAppointment] = useState<any>(null);
  const [journeyStats, setJourneyStats] = useState<{
    totalAppointments?: number;
    totalReports?: number;
    followUps?: number;
  } | null>(null);

  // Graceful fetch of journey stats (404-safe)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient.get('/patients/journey-stats');
        setJourneyStats(res.data?.data || res.data || {});
      } catch {
        // endpoint not available — use appointment counts as fallback
      }
    };
    fetchStats();
  }, []);

  const appointments = (appointmentsData as any)?.appointments || appointmentsData || [];
  const upcomingAppointments = appointments.filter(
    (a: any) => a.status === 'CONFIRMED' || a.status === 'PENDING'
  );
  const completedAppointments = appointments.filter((a: any) => a.status === 'COMPLETED');

  const activeCampAppointment = upcomingAppointments[0];
  const { label: greetingLabel, Icon: GreetingIcon } = getGreeting();

  // SHID from user context (if present in any expected field)
  const shid: string | undefined =
    (user as any)?.shid || (user as any)?.healthId || (user as any)?.patientProfile?.shid;

  const statsReports = journeyStats?.totalReports ?? completedAppointments.length;
  const statsAppts = journeyStats?.totalAppointments ?? appointments.length;

  return (
    <motion.div
      className="space-y-8 pb-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── A. Enhanced Welcome Banner ─────────────────────────────────────── */}
      <motion.div variants={fadeUpVariant}>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-[#0d2244] to-[#0a1628] border border-cyan-500/25 p-7 sm:p-9 text-white shadow-3d">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3">
              {/* Greeting + time of day */}
              <div className="flex items-center gap-2 text-cyan-300/80 text-sm font-semibold">
                <GreetingIcon className="w-4 h-4" aria-hidden="true" />
                <span>{greetingLabel}</span>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Smart Health Pass Active</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                {user?.name || 'Community Member'}!
              </h1>

              {/* SHID */}
              {shid && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/70 border border-slate-700 text-slate-300 text-xs font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>SHID: {shid}</span>
                </div>
              )}

              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Access your real-time camp queue tokens, view contactless QR passes for volunteer
                check-in, and download verified clinical observation records.
              </p>

              {/* Health status summary row */}
              <div className="flex flex-wrap gap-3 pt-1">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-slate-300">
                    <strong className="text-white">{statsAppts}</strong> appointments
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700 text-xs">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300">
                    <strong className="text-white">{statsReports}</strong> reports
                  </span>
                </div>
                {journeyStats?.followUps !== undefined && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700 text-xs">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-slate-300">
                      <strong className="text-white">{journeyStats.followUps}</strong> follow-ups
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 md:pt-2">
              <Link to="/patient/book">
                <Button
                  variant="primary"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 text-xs sm:text-sm"
                  leftIcon={<PlusCircle className="w-4 h-4 text-slate-950" />}
                >
                  Book Camp Visit
                </Button>
              </Link>
              <Link to="/camps">
                <Button
                  variant="outline"
                  className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs sm:text-sm"
                  leftIcon={<Compass className="w-4 h-4 text-cyan-400" />}
                >
                  Browse Map
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Metrics Grid ──────────────────────────────────────────────────── */}
      <motion.div variants={fadeUpVariant} className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Active Appointments"
          value={upcomingAppointments.length}
          icon={Calendar}
          variant="primary"
          trend={{ value: `${upcomingAppointments.length} scheduled`, isPositive: true }}
        />
        <StatCard
          title="Completed Screenings"
          value={completedAppointments.length}
          icon={HeartPulse}
          variant="success"
        />
        <StatCard
          title="Clinical Reports Issued"
          value={statsReports}
          icon={FileText}
          variant="secondary"
        />
      </motion.div>

      {/* ── D. Quick Actions Grid (2 × 3) ─────────────────────────────────── */}
      <motion.div variants={fadeUpVariant}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {QUICK_ACTIONS.map(({ label, to, icon: Icon, color, iconColor }) => (
            <Link key={to} to={to}>
              <div
                className={`group flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-br border transition-all duration-300 hover:scale-[1.03] hover:shadow-lg cursor-pointer min-h-[90px] ${color} bg-slate-900/60`}
              >
                <Icon className={`w-6 h-6 ${iconColor}`} aria-hidden="true" />
                <span className="text-xs font-semibold text-slate-200 text-center leading-tight group-hover:text-white transition-colors">
                  {label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── B. Journey Timeline ───────────────────────────────────────────── */}
      {appointments.length > 0 && (
        <motion.div variants={fadeUpVariant}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-500" />
              Appointment Journey
            </h2>
            <Link
              to="/patient/book"
              className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
            >
              + Book New
            </Link>
          </div>

          {/* Horizontal scrollable timeline */}
          <div className="overflow-x-auto pb-2 -mx-1 px-1">
            <div className="flex gap-3 min-w-max">
              {[...appointments].reverse().map((appt: any, idx: number) => {
                const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.PENDING;
                const apptDate = appt.date || appt.appointmentDate;
                return (
                  <div
                    key={appt.id || appt._id || idx}
                    className="relative flex flex-col gap-2 w-56 flex-shrink-0 p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-600 transition-all duration-300"
                  >
                    {/* Timeline connector */}
                    {idx > 0 && (
                      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-px bg-slate-700" />
                    )}

                    {/* Status dot + badge */}
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.label}`}
                      >
                        {appt.status}
                      </span>
                      {appt.queueToken && (
                        <span className="ml-auto text-[10px] font-mono font-bold text-cyan-400">
                          #{appt.queueToken}
                        </span>
                      )}
                    </div>

                    {/* Camp name */}
                    <p className="font-bold text-slate-100 text-xs leading-snug line-clamp-2">
                      {appt.camp?.name || 'Community Health Camp'}
                    </p>

                    {/* Date */}
                    <p className="text-[11px] text-slate-400">
                      {apptDate ? formatDate(apptDate) : '—'}
                    </p>

                    {/* View Report button for completed */}
                    {appt.status === 'COMPLETED' && (
                      <Link to="/reports">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-1 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-[10px] font-bold"
                          leftIcon={<FileDown className="w-3 h-3" />}
                        >
                          View Report
                        </Button>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── C. Enhanced Active Appointment Card ───────────────────────────── */}
      {activeCampAppointment && (
        <motion.div variants={fadeUpVariant}>
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-[#0a1e3a] to-slate-900 border border-cyan-500/30 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                Upcoming Visit
              </h2>
              {/* Countdown badge */}
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
                {getDaysUntil(
                  activeCampAppointment.date || activeCampAppointment.appointmentDate || ''
                )}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Camp info */}
              <div className="space-y-1.5">
                <p className="font-extrabold text-white text-lg leading-tight">
                  {activeCampAppointment.camp?.name || 'Community Health Camp'}
                </p>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                  {activeCampAppointment.camp?.location ||
                    activeCampAppointment.camp?.address ||
                    'Community Center, Bengaluru'}
                </p>
                <p className="text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Date:</span>{' '}
                  {formatDate(
                    activeCampAppointment.date || activeCampAppointment.appointmentDate
                  )}{' '}
                  • <span className="font-semibold text-slate-300">Slot:</span>{' '}
                  {activeCampAppointment.timeSlot}
                </p>

                {/* Queue token if checked in */}
                {activeCampAppointment.queueToken && (
                  <p className="text-xs text-cyan-400 font-bold">
                    Queue Token: #{activeCampAppointment.queueToken}
                  </p>
                )}

                {/* Services */}
                {activeCampAppointment.camp?.services?.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {activeCampAppointment.camp.services
                      .slice(0, 4)
                      .map((s: string, i: number) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300"
                        >
                          {s}
                        </span>
                      ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 sm:items-end justify-center">
                {/* QR Check-In Pass */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setQrModalAppointment(activeCampAppointment)}
                  aria-label="Open QR Check-In Pass"
                  className="border-slate-700 text-xs font-semibold"
                  leftIcon={<QrCode className="w-3.5 h-3.5 text-slate-400" />}
                >
                  QR Check-In Pass
                </Button>

                {/* Queue Token */}
                {activeCampAppointment.queueToken && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSelectedTokenAppointment(activeCampAppointment)}
                    aria-label="View Queue Token"
                    className="bg-cyan-950/40 text-cyan-300 border border-cyan-800 text-xs font-bold"
                    leftIcon={<QrCode className="w-3.5 h-3.5 text-cyan-400" />}
                  >
                    Token #{activeCampAppointment.queueToken}
                  </Button>
                )}

                {/* Directions to camp */}
                {(activeCampAppointment.camp?.location ||
                  activeCampAppointment.camp?.address) && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      activeCampAppointment.camp?.location ||
                        activeCampAppointment.camp?.address ||
                        ''
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Get directions to camp on Google Maps"
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10 text-xs font-semibold"
                      leftIcon={<Navigation className="w-3.5 h-3.5" />}
                    >
                      Get Directions
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Digital Health Passport ───────────────────────────────────────── */}
      <motion.div variants={fadeUpVariant}>
        <DigitalHealthPassport
          patient={user || {}}
          latestReportId={completedAppointments[0]?.id || 'rep-1'}
        />
      </motion.div>

      {/* ── Real-time Queue Monitor ───────────────────────────────────────── */}
      {activeCampAppointment && (
        <motion.div variants={fadeUpVariant} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-500 animate-pulse" />
              Live Clinic Queue Status
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Camp: {activeCampAppointment.camp?.name || 'Nearest Camp'}
            </span>
          </div>

          <LiveQueueDisplay
            campId={activeCampAppointment.campId || activeCampAppointment.camp?.id || 'camp-1'}
            campName={activeCampAppointment.camp?.name || 'Community Health Camp'}
            myToken={String(activeCampAppointment.queueToken || '')}
          />
        </motion.div>
      )}

      {/* ── Digital Health ID & Ephemeral Passes ─────────────────────────── */}
      <motion.div variants={fadeUpVariant}>
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span>Digital Health ID & Ephemeral Passes</span>
              </h2>
              <p className="text-xs text-slate-400">
                Flip to view your non-PII verification QR code or issue temporary, revocable
                clinical access passes.
              </p>
            </div>
          </div>
          <DigitalHealthCard />
        </div>
      </motion.div>

      {/* ── Content Layout: Appointments + Quick Actions ──────────────────── */}
      <motion.div variants={fadeUpVariant} className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        {/* Left 2 Cols: Upcoming Appointments */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-500" />
              Scheduled Camp Consultations
            </h2>
            <Link
              to="/patient/book"
              className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>+ Book Another Visit</span>
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <SkeletonLoader.CardSkeleton />
              <SkeletonLoader.CardSkeleton />
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <EmptyState
              title="No upcoming health camp bookings"
              description="Discover nearby free health camps in your area and reserve a guaranteed time slot."
              action={
                <Link to="/camps">
                  <Button variant="primary" size="sm" leftIcon={<Compass className="w-4 h-4" />}>
                    Explore Active Camps
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appt: any) => {
                const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.PENDING;
                return (
                  <div
                    key={appt.id || appt._id}
                    className="p-6 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-3d flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 hover:border-cyan-500/40 transition-all duration-300"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <StatusIcon status={appt.status} />
                        <span className="font-extrabold text-slate-900 dark:text-white text-base">
                          {appt.camp?.name || 'Community Health Camp'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${cfg.label}`}>
                          {appt.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Date:{' '}
                        <strong>{formatDate(appt.date || appt.appointmentDate)}</strong> • Slot:{' '}
                        <strong>{appt.timeSlot}</strong>
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Location:{' '}
                        {appt.camp?.location || appt.camp?.address || 'Community Center, Bengaluru'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {appt.queueToken && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedTokenAppointment(appt)}
                          className="bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-xs font-bold"
                          leftIcon={<QrCode className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />}
                        >
                          Token #{appt.queueToken}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setQrModalAppointment(appt)}
                        className="border-slate-300 dark:border-slate-700 text-xs font-semibold"
                        leftIcon={<QrCode className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
                      >
                        QR Check-In Pass
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Quick Actions & Portal Shortcuts */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-cyan-500" />
            Quick Health Actions
          </h2>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-3d space-y-3">
            <Link
              to="/patient/profile"
              className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 group"
            >
              <span>Update Medical Allergies & Emergency Contact</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-bold group-hover:translate-x-1 transition-transform">
                Edit →
              </span>
            </Link>

            <Link
              to="/reports"
              className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 group"
            >
              <span>Download Doctor Consultations (PDF)</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-bold group-hover:translate-x-1 transition-transform">
                Download →
              </span>
            </Link>

            <Link
              to="/awareness"
              className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 group"
            >
              <span>Bilingual Health Awareness Guides</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-bold group-hover:translate-x-1 transition-transform">
                Explore →
              </span>
            </Link>

            <Link
              to="/services"
              className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 group"
            >
              <span>View Camp Clinical Services Guide</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-bold group-hover:translate-x-1 transition-transform">
                View →
              </span>
            </Link>

            <Link
              to="/patient/followups"
              className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 group"
            >
              <span>My Follow-Up Schedule</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-bold group-hover:translate-x-1 transition-transform">
                View →
              </span>
            </Link>
          </div>

          {/* Follow-up Reminders */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent border border-cyan-500/25 shadow-3d space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Active Clinical Follow-Up
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold">
                Due in 14 days
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
              Dr. Priya Sharma (General Medicine) recommends fasting blood glucose & BP recheck at
              next outreach camp.
            </p>
            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Camp: Koramangala Outreach</span>
              <Link to="/patient/book" className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline">
                Schedule Checkup →
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Modal: Printable Queue Token ─────────────────────────────────── */}
      {selectedTokenAppointment && (
        <Modal
          isOpen={Boolean(selectedTokenAppointment)}
          onClose={() => setSelectedTokenAppointment(null)}
          title="Printable Queue Token"
          description="Bring this token or present on your mobile at the camp entrance."
        >
          <QueueToken
            tokenNumber={selectedTokenAppointment.queueToken}
            campName={selectedTokenAppointment.camp?.name || 'Community Health Camp'}
            campLocation={selectedTokenAppointment.camp?.location || 'Bengaluru'}
            patientName={user?.name || 'Registered Patient'}
            date={formatDate(selectedTokenAppointment.date || selectedTokenAppointment.appointmentDate)}
            timeSlot={selectedTokenAppointment.timeSlot}
            service={selectedTokenAppointment.service || 'General Checkup'}
          />
        </Modal>
      )}

      {/* ── Modal: Contactless QR Code Pass ─────────────────────────────── */}
      {qrModalAppointment && (
        <Modal
          isOpen={Boolean(qrModalAppointment)}
          onClose={() => setQrModalAppointment(null)}
          title="Contactless Camp Pass"
          description="Scan this QR code at the registration desk for instant contactless intake."
        >
          <QRCodeDisplay
            appointmentId={qrModalAppointment.id || qrModalAppointment._id}
            campName={qrModalAppointment.camp?.name || 'Community Health Camp'}
            token={String(qrModalAppointment.queueToken || 'Q-01')}
          />
        </Modal>
      )}
    </motion.div>
  );
};

export default PatientDashboard;
