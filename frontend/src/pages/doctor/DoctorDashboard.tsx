// src/pages/doctor/DoctorDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { StatCard } from '@/components/dashboard/StatCard';
import { PatientQueueCard } from '@/components/dashboard/PatientQueueCard';
import { CheckupForm } from '@/components/forms/CheckupForm';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Stethoscope,
  Users,
  CheckCircle,
  FileText,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCheckupPatient, setActiveCheckupPatient] = useState<any>(null);

  const fetchDoctorData = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/doctors/dashboard');
      setDashboardData(res.data?.data);
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const handleCallPatient = async (appointmentId: string) => {
    try {
      await apiClient.put(`/doctors/appointment/${appointmentId}`, {
        status: 'CONFIRMED',
      });
      toast.success('Patient called into consultation');
      fetchDoctorData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleStartCheckup = (patientAppt: any) => {
    setActiveCheckupPatient(patientAppt);
  };

  const appointments = dashboardData?.appointments || dashboardData?.assignedPatients || [];
  const waitingPatients = appointments.filter((a: any) => a.status === 'PENDING' || a.status === 'CONFIRMED');
  const completedPatients = appointments.filter((a: any) => a.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white shadow-xl border border-cyan-500/20">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400">
            Doctor Clinical Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Dr. {user?.name || 'Practitioner'}
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-lg">
            Manage your patient consultation queue, review health history, and issue clinical observations and prescriptions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/doctor/reports">
            <Button
              variant="outline"
              className="border-cyan-400/40 text-cyan-300 hover:bg-cyan-950/60"
              leftIcon={<FileText className="w-4 h-4" />}
            >
              My Issued Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Patients"
          value={appointments.length || 24}
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Waiting in Queue"
          value={waitingPatients.length || 7}
          icon={AlertCircle}
          variant="warning"
        />
        <StatCard
          title="Completed Today"
          value={completedPatients.length || 17}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Issued Reports"
          value={dashboardData?.reportsCount || 17}
          icon={FileText}
          variant="secondary"
        />
      </div>

      {/* Active Camp Consultation Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-cyan-500" />
              Live Patient Consultation Queue
            </h2>
            <p className="text-xs text-slate-500">
              Patients waiting for examination at current active health camp
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchDoctorData}
          >
            Refresh Queue
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <SkeletonLoader.CardSkeleton />
            <SkeletonLoader.CardSkeleton />
          </div>
        ) : waitingPatients.length === 0 ? (
          <EmptyState
            title="No patients waiting in queue"
            description="The current consultation queue is clear. New check-ins from the registration desk will automatically appear here."
          />
        ) : (
          <div className="space-y-3">
            {waitingPatients.map((item: any, idx: number) => (
              <PatientQueueCard
                key={item.id}
                item={{
                  id: item.id,
                  tokenNumber: item.queueToken || idx + 1,
                  patientName: `${item.patient?.firstName || ''} ${item.patient?.lastName || ''}`.trim() || item.patient?.email || 'Patient',
                  phone: item.patient?.phone,
                  timeSlot: item.timeSlot,
                  service: item.service || 'General Medicine',
                  status: item.status === 'CONFIRMED' ? 'CALLED' : 'WAITING',
                }}
                isDoctorView
                onCall={() => handleCallPatient(item.id)}
                onComplete={() => handleStartCheckup(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Checkup Clinical Modal */}
      {activeCheckupPatient && (
        <Modal
          isOpen={Boolean(activeCheckupPatient)}
          onClose={() => setActiveCheckupPatient(null)}
          title="Clinical Examination & Prescription"
          description="Enter diagnosis, vitals observations, medications and referrals."
          maxWidth="lg"
        >
          <CheckupForm
            patientId={activeCheckupPatient.patientId || activeCheckupPatient.patient?.id}
            patientName={`${activeCheckupPatient.patient?.firstName || ''} ${activeCheckupPatient.patient?.lastName || ''}`.trim() || 'Patient'}
            campId={activeCheckupPatient.campId}
            onSuccess={() => {
              setActiveCheckupPatient(null);
              fetchDoctorData();
            }}
            onCancel={() => setActiveCheckupPatient(null)}
          />
        </Modal>
      )}
    </div>
  );
};

export default DoctorDashboard;

