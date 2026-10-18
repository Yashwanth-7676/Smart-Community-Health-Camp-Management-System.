// src/pages/patient/PatientDashboard.tsx
import React, { useState } from 'react';
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
} from 'lucide-react';
import { formatDate } from '@/utils/helpers';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: appointmentsData, isLoading } = useMyAppointments();
  const [selectedTokenAppointment, setSelectedTokenAppointment] = useState<any>(null);
  const [qrModalAppointment, setQrModalAppointment] = useState<any>(null);

  const appointments = (appointmentsData as any)?.appointments || appointmentsData || [];
  const upcomingAppointments = appointments.filter(
    (a: any) => a.status === 'CONFIRMED' || a.status === 'PENDING'
  );
  const completedAppointments = appointments.filter((a: any) => a.status === 'COMPLETED');

  const activeCampAppointment = upcomingAppointments[0];

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-[#0d2244] to-[#0a1628] border border-cyan-500/25 p-7 sm:p-9 text-white shadow-3d">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Smart Health Pass Active</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Namaskara, {user?.name || 'Community Member'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Access your real-time camp queue tokens, view contactless QR passes for volunteer check-in, and download verified clinical observation records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
          value={completedAppointments.length}
          icon={FileText}
          variant="secondary"
        />
      </div>

      {/* Digital Health Passport with Verifiable Pass & PDF Export */}
      <DigitalHealthPassport
        patient={user || {}}
        latestReportId={completedAppointments[0]?.id || 'rep-1'}
      />

      {/* Real-time Queue Monitor for Active Visit */}
      {activeCampAppointment && (
        <div className="space-y-3">
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
        </div>
      )}

      {/* Upgraded Digital Health ID & Ephemeral Sharing Pass */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>Digital Health ID & Ephemeral Passes</span>
            </h2>
            <p className="text-xs text-slate-400">
              Flip to view your non-PII verification QR code or issue temporary, revocable clinical access passes.
            </p>
          </div>
        </div>
        <DigitalHealthCard />
      </div>

      {/* Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
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
              {upcomingAppointments.map((appt: any) => (
                <div
                  key={appt.id || appt._id}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-3d flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 hover:border-cyan-500/40 transition-all duration-300"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-extrabold text-slate-900 dark:text-white text-base">
                        {appt.camp?.name || 'Community Health Camp'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                        {appt.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Date: <strong>{formatDate(appt.date || appt.appointmentDate)}</strong> • Slot: <strong>{appt.timeSlot}</strong>
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Location: {appt.camp?.location || appt.camp?.address || 'Community Center, Bengaluru'}
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
              ))}
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
              Dr. Priya Sharma (General Medicine) recommends fasting blood glucose & BP recheck at next outreach camp.
            </p>
            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Camp: Koramangala Outreach</span>
              <Link to="/patient/book" className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline">
                Schedule Checkup →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Printable Queue Token */}
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

      {/* Modal for Contactless QR Code Pass */}
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
    </div>
  );
};

export default PatientDashboard;
