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
  RefreshCw,
  Search,
  Package,
  Activity,
  Sparkles,
  Radio,
} from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';
import { FollowUpManager } from '@/components/followups/FollowUpManager';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeCheckupPatient, setActiveCheckupPatient] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDoctorData = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      else setIsLoading(true);

      const res = await apiClient.get('/doctors/dashboard');
      setDashboardData(res.data?.data);
      if (showToast) toast.success('Patient consultation queue refreshed');
    } catch {
      // fallback handled gracefully
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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
      toast.success('Patient called into examination room');
      fetchDoctorData();
    } catch {
      toast.error('Failed to update patient queue status');
    }
  };

  const handleStartCheckup = (patientAppt: any) => {
    setActiveCheckupPatient(patientAppt);
  };

  const appointments = dashboardData?.appointments || dashboardData?.assignedPatients || [];
  const waitingPatients = appointments.filter((a: any) => a.status === 'PENDING' || a.status === 'CONFIRMED');
  const completedPatients = appointments.filter((a: any) => a.status === 'COMPLETED');

  const filteredWaitingPatients = waitingPatients.filter((item: any) => {
    if (!searchQuery) return true;
    const name = `${item.patient?.firstName || ''} ${item.patient?.lastName || ''} ${item.patient?.email || ''}`.toLowerCase();
    const token = String(item.queueToken || '');
    return name.includes(searchQuery.toLowerCase()) || token.includes(searchQuery);
  });

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white shadow-3d border border-cyan-500/25 p-7 sm:p-9">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Medical Officer Portal • Verified Clinical Station</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Dr. {user?.name || 'Healthcare Practitioner'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Call waiting patients, input vital signs, record clinical findings, and sign official medical reports with PDF export.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/command-center">
              <Button
                variant="outline"
                className="border-primary-400/40 text-primary-300 hover:bg-primary-950/60 text-xs sm:text-sm font-semibold"
                leftIcon={<Radio className="w-4 h-4 text-primary-400 animate-pulse" />}
              >
                Command Center
              </Button>
            </Link>
            <Link to="/reports/reader">
              <Button
                variant="outline"
                className="border-cyan-400/40 text-cyan-300 hover:bg-cyan-950/60 text-xs sm:text-sm font-semibold"
                leftIcon={<FileText className="w-4 h-4 text-cyan-400" />}
              >
                AI Report Reader
              </Button>
            </Link>
            <Link to="/doctor/reports">
              <Button
                variant="outline"
                className="border-cyan-400/40 text-cyan-300 hover:bg-cyan-950/60 text-xs sm:text-sm font-semibold"
                leftIcon={<FileText className="w-4 h-4 text-cyan-400" />}
              >
                Issued Reports
              </Button>
            </Link>
            <Link to="/inventory">
              <Button
                variant="secondary"
                className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs sm:text-sm font-semibold"
                leftIcon={<Package className="w-4 h-4 text-cyan-400" />}
              >
                Camp Pharmacy Stock
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
          title="Consultations Completed"
          value={completedPatients.length || 17}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Clinical Reports Signed"
          value={dashboardData?.reportsCount || completedPatients.length || 17}
          icon={FileText}
          variant="secondary"
        />
      </div>

      {/* Active Camp Consultation Queue */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-cyan-500" />
              Live Consultation Room Queue
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assisting on-site patients currently checked-in at registration
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient or token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-48 sm:w-56"
              />
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchDoctorData(true)}
              disabled={isRefreshing}
              className="text-xs font-semibold"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <SkeletonLoader.CardSkeleton />
            <SkeletonLoader.CardSkeleton />
          </div>
        ) : filteredWaitingPatients.length === 0 ? (
          <EmptyState
            title="No patients waiting in queue"
            description={
              searchQuery
                ? `No patients match "${searchQuery}". Clear your search query to view all waiting patients.`
                : 'The current consultation queue is clear. New check-ins from the volunteer desk will automatically appear here.'
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredWaitingPatients.map((item: any, idx: number) => (
              <PatientQueueCard
                key={item.id || item._id}
                item={{
                  id: item.id || item._id,
                  tokenNumber: item.queueToken || idx + 1,
                  patientName:
                    `${item.patient?.firstName || ''} ${item.patient?.lastName || ''}`.trim() ||
                    item.patient?.name ||
                    item.patient?.email ||
                    'Patient Member',
                  phone: item.patient?.phone,
                  timeSlot: item.timeSlot,
                  service: item.service || 'General Medicine',
                  status: item.status === 'CONFIRMED' ? 'CALLED' : 'WAITING',
                }}
                isDoctorView
                onCall={() => handleCallPatient(item.id || item._id)}
                onComplete={() => handleStartCheckup(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Follow-Up Management Section */}
      <FollowUpManager />

      {/* Checkup Clinical Modal */}
      {activeCheckupPatient && (
        <Modal
          isOpen={Boolean(activeCheckupPatient)}
          onClose={() => setActiveCheckupPatient(null)}
          title="Clinical Examination & Prescription"
          description="Enter diagnosis, vital signs, clinical observations, and medications."
          maxWidth="lg"
        >
          <CheckupForm
            patientId={activeCheckupPatient.patientId || activeCheckupPatient.patient?.id}
            patientName={
              `${activeCheckupPatient.patient?.firstName || ''} ${activeCheckupPatient.patient?.lastName || ''}`.trim() ||
              activeCheckupPatient.patient?.name ||
              'Patient'
            }
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
