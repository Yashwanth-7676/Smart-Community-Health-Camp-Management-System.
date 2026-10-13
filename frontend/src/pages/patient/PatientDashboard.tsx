// src/pages/patient/PatientDashboard.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMyAppointments } from '@/hooks/useAppointments';
import { StatCard } from '@/components/dashboard/StatCard';
import { AppointmentCard } from '@/components/dashboard/AppointmentCard';
import { QueueToken } from '@/components/common/QueueToken';
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
} from 'lucide-react';
import { formatDate } from '@/utils/helpers';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: appointmentsData, isLoading } = useMyAppointments();
  const [selectedTokenAppointment, setSelectedTokenAppointment] = useState<any>(null);

  const appointments = (appointmentsData as any)?.appointments || appointmentsData || [];
  const upcomingAppointments = appointments.filter(
    (a: any) => a.status === 'CONFIRMED' || a.status === 'PENDING'
  );
  const completedAppointments = appointments.filter(
    (a: any) => a.status === 'COMPLETED'
  );

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-lg">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-cyan-200">
            Patient Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Welcome back, {user?.name || 'Patient'}!
          </h1>
          <p className="text-sm text-cyan-100 mt-1 max-w-lg">
            Track your community health camp visits, view queue passes, and access verified clinical reports.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/patient/book">
            <Button
              variant="secondary"
              className="bg-white text-slate-900 hover:bg-cyan-50 border-0 font-bold shadow-md"
              leftIcon={<PlusCircle className="w-4 h-4 text-cyan-600" />}
            >
              Book New Camp Visit
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Appointments"
          value={upcomingAppointments.length}
          icon={Calendar}
          variant="primary"
          trend={{ value: '1 upcoming', isPositive: true }}
        />
        <StatCard
          title="Completed Checkups"
          value={completedAppointments.length}
          icon={HeartPulse}
          variant="success"
        />
        <StatCard
          title="Medical Reports"
          value={completedAppointments.length}
          icon={FileText}
          variant="secondary"
        />
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Queue & Upcoming visits */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-500" />
              Upcoming Health Camp Visits
            </h2>
            <Link
              to="/patient/book"
              className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              + Book Another
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
                  key={appt.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-base">
                        {appt.camp?.name || 'Community Health Camp'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300">
                        {appt.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Date: {formatDate(appt.date || appt.appointmentDate)} • Slot: {appt.timeSlot}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Location: {appt.camp?.location || 'Bengaluru Community Center'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {appt.queueToken && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTokenAppointment(appt)}
                        leftIcon={<QrCode className="w-4 h-4 text-cyan-500" />}
                      >
                        Queue Pass #{appt.queueToken}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Quick Shortcuts & Health Insights */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-cyan-500" />
            Patient Actions
          </h2>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <Link
              to="/patient/profile"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <span>Update Medical History & Allergies</span>
              <span className="text-cyan-500 font-bold">Edit →</span>
            </Link>

            <Link
              to="/reports"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <span>Download Doctor Prescriptions (PDF)</span>
              <span className="text-cyan-500 font-bold">View →</span>
            </Link>

            <Link
              to="/awareness"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <span>Bilingual Health Awareness Tips</span>
              <span className="text-cyan-500 font-bold">Read →</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Modal for Queue Pass */}
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
    </div>
  );
};

export default PatientDashboard;

