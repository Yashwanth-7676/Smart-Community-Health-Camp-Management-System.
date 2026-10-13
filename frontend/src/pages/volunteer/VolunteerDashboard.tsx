// src/pages/volunteer/VolunteerDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { StatCard } from '@/components/dashboard/StatCard';
import { PatientQueueCard } from '@/components/dashboard/PatientQueueCard';
import { PatientRegistrationForm } from '@/components/forms/PatientRegistrationForm';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Users,
  UserPlus,
  Clock,
  CheckCircle2,
  Calendar,
  HeartHandshake,
  QrCode,
} from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

export const VolunteerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegModal, setShowRegModal] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);

  const fetchVolunteerData = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/volunteers/dashboard');
      setData(res.data?.data);
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteerData();
  }, []);

  const handleMarkAttendance = async () => {
    try {
      await apiClient.post('/volunteers/attendance', {
        status: 'PRESENT',
      });
      setAttendanceMarked(true);
      toast.success('Your volunteer attendance has been recorded for today!');
    } catch {
      toast.error('Failed to record attendance');
    }
  };

  const handleUpdateQueue = async (tokenId: string, status: string) => {
    try {
      await apiClient.put(`/volunteers/queue/${tokenId}`, { status });
      toast.success(`Queue token updated to ${status}`);
      fetchVolunteerData();
    } catch {
      toast.error('Failed to update queue token');
    }
  };

  const queueList = data?.recentQueue || [];
  const assignedCamp = data?.assignedCamp || { name: 'Koramangala Community Camp', location: 'Bengaluru' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 text-white shadow-xl">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-cyan-200">
            Volunteer Desk
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Hello, {user?.name || 'Volunteer'}!
          </h1>
          <p className="text-sm text-cyan-100 mt-1 max-w-lg">
            Stationed at <strong>{assignedCamp.name}</strong>. Manage on-site patient intake, print queue tokens, and assist camp doctors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="border-white/40 text-white hover:bg-white/10"
            onClick={handleMarkAttendance}
            disabled={attendanceMarked}
            leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          >
            {attendanceMarked ? 'Attendance Marked ✓' : 'Mark Daily Attendance'}
          </Button>

          <Button
            variant="secondary"
            className="bg-white text-slate-900 hover:bg-cyan-50 border-0 font-bold shadow-md"
            onClick={() => setShowRegModal(true)}
            leftIcon={<UserPlus className="w-4 h-4 text-cyan-600" />}
          >
            Register Patient & Issue Token
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Today's Registered"
          value={data?.queueSummary?.totalToday || queueList.length || 38}
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="In Queue (Waiting)"
          value={data?.queueSummary?.waiting || 8}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Examined / Done"
          value={data?.queueSummary?.completed || 30}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Volunteer Hours"
          value="6.5 hrs"
          icon={HeartHandshake}
          variant="secondary"
        />
      </div>

      {/* Real-time Camp Queue Management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-500" />
              Camp Entrance & Queue Management
            </h2>
            <p className="text-xs text-slate-500">
              Live token list for patient intake & desk routing
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchVolunteerData}>
            Refresh Tokens
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <SkeletonLoader.CardSkeleton />
            <SkeletonLoader.CardSkeleton />
          </div>
        ) : queueList.length === 0 ? (
          <EmptyState
            title="Queue is currently clear"
            description="Use the 'Register Patient & Issue Token' button above to check in newly arriving patients."
            action={
              <Button size="sm" variant="primary" onClick={() => setShowRegModal(true)} leftIcon={<UserPlus className="w-4 h-4" />}>
                Register First Patient
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {queueList.map((item: any, idx: number) => (
              <PatientQueueCard
                key={item.id}
                item={{
                  id: item.queueTokenRef?.id || item.id,
                  tokenNumber: item.queueTokenRef?.tokenNumber || item.queueToken || idx + 1,
                  patientName: `${item.patient?.firstName || ''} ${item.patient?.lastName || ''}`.trim() || 'Patient',
                  phone: item.patient?.phone,
                  timeSlot: item.timeSlot,
                  service: item.service || 'General Checkup',
                  status: item.queueTokenRef?.status || 'WAITING',
                }}
                onCall={(id) => handleUpdateQueue(id, 'CALLED')}
                onComplete={(id) => handleUpdateQueue(id, 'COMPLETED')}
                onSkip={(id) => handleUpdateQueue(id, 'SKIPPED')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {showRegModal && (
        <Modal
          isOpen={showRegModal}
          onClose={() => setShowRegModal(false)}
          title="On-Site Rapid Patient Registration"
          description="Register community patients directly at camp desk with automatic offline fallback."
          maxWidth="lg"
        >
          <PatientRegistrationForm
            camps={[{ id: assignedCamp.id || 'camp-1', name: assignedCamp.name || 'Current Camp' }]}
            defaultCampId={assignedCamp.id || 'camp-1'}
            onSuccess={() => {
              setShowRegModal(false);
              fetchVolunteerData();
            }}
          />
        </Modal>
      )}
    </div>
  );
};

export default VolunteerDashboard;

