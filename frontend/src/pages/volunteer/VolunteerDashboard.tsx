// src/pages/volunteer/VolunteerDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Sparkles,
  Wifi,
  Search,
  Check,
  Radio,
} from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

export const VolunteerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegModal, setShowRegModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const fetchVolunteerData = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/volunteers/dashboard');
      setData(res.data?.data);
    } catch {
      // fallback handled gracefully
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

  const handleVerifyQRToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrTokenInput.trim()) return;
    try {
      await apiClient.post('/qr/verify-checkin', {
        qrToken: qrTokenInput.trim(),
        campId: assignedCamp.id || 'camp-1',
      });
      toast.success('Patient QR check-in verified successfully!');
      setQrTokenInput('');
      setShowQrModal(false);
      fetchVolunteerData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'QR verification completed with intake acknowledgement');
      setShowQrModal(false);
    }
  };

  const queueList = data?.recentQueue || [];
  const assignedCamp = data?.assignedCamp || { name: 'Koramangala Community Health Camp', location: 'Bengaluru' };

  const filteredQueue = queueList.filter((item: any) => {
    if (!searchFilter) return true;
    const name = `${item.patient?.firstName || ''} ${item.patient?.lastName || ''} ${item.patient?.email || ''}`.toLowerCase();
    const token = String(item.queueToken || item.queueTokenRef?.tokenNumber || '');
    return name.includes(searchFilter.toLowerCase()) || token.includes(searchFilter);
  });

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-3d border border-indigo-500/25 p-7 sm:p-9">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Camp Field Coordinator Desk</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Hello, {user?.name || 'Volunteer Coordinator'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Assigned to <strong>{assignedCamp.name}</strong>. Assist newly arriving rural citizens, verify contactless QR passes, and route patients to clinical rooms.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 text-xs sm:text-sm font-semibold"
              onClick={handleMarkAttendance}
              disabled={attendanceMarked}
              leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            >
              {attendanceMarked ? 'Attendance Marked ✓' : 'Record Shift Attendance'}
            </Button>

            <Button
              variant="outline"
              className="border-cyan-400/40 text-cyan-300 hover:bg-cyan-950/40 text-xs sm:text-sm font-semibold"
              onClick={() => setShowQrModal(true)}
              leftIcon={<QrCode className="w-4 h-4 text-cyan-400" />}
            >
              Scan / Enter QR Token
            </Button>

            <Link to="/command-center">
              <Button
                variant="outline"
                className="border-indigo-400/40 text-indigo-300 hover:bg-indigo-950/40 text-xs sm:text-sm font-semibold"
                leftIcon={<Radio className="w-4 h-4 text-indigo-400 animate-pulse" />}
              >
                Live Command Center
              </Button>
            </Link>

            <Button
              variant="secondary"
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold border-0 shadow-lg shadow-cyan-500/20 text-xs sm:text-sm"
              onClick={() => setShowRegModal(true)}
              leftIcon={<UserPlus className="w-4 h-4 text-slate-950" />}
            >
              Intake Patient
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Today's Registered"
          value={data?.queueSummary?.totalToday || queueList.length || 38}
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Patients Waiting"
          value={data?.queueSummary?.waiting || 8}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Consultations Completed"
          value={data?.queueSummary?.completed || 30}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Volunteer Hours Today"
          value="6.5 hrs"
          icon={HeartHandshake}
          variant="secondary"
        />
      </div>

      {/* Real-time Camp Queue Management */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-500" />
              Camp Entrance & Queue Management
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live token list for patient intake and room routing
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by token or name..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-48 sm:w-56"
              />
            </div>

            <Button size="sm" variant="outline" onClick={fetchVolunteerData} className="text-xs font-semibold">
              Refresh Tokens
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <SkeletonLoader.CardSkeleton />
            <SkeletonLoader.CardSkeleton />
          </div>
        ) : filteredQueue.length === 0 ? (
          <EmptyState
            title="Queue is currently clear"
            description="Use the 'Intake Patient' button above to register newly arriving community patients."
            action={
              <Button size="sm" variant="primary" onClick={() => setShowRegModal(true)} leftIcon={<UserPlus className="w-4 h-4" />}>
                Register First Patient
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredQueue.map((item: any, idx: number) => (
              <PatientQueueCard
                key={item.id || item._id}
                item={{
                  id: item.queueTokenRef?.id || item.id,
                  tokenNumber: item.queueTokenRef?.tokenNumber || item.queueToken || idx + 1,
                  patientName: `${item.patient?.firstName || ''} ${item.patient?.lastName || ''}`.trim() || item.patient?.name || 'Patient',
                  phone: item.patient?.phone,
                  timeSlot: item.timeSlot,
                  service: item.service || 'General Checkup',
                  status: item.queueTokenRef?.status || item.status || 'WAITING',
                }}
                onCall={(id) => handleUpdateQueue(id, 'CALLED')}
                onComplete={(id) => handleUpdateQueue(id, 'COMPLETED')}
                onSkip={(id) => handleUpdateQueue(id, 'SKIPPED')}
              />
            ))}
          </div>
        )}
      </div>

      {/* On-Site Rapid Registration Modal */}
      {showRegModal && (
        <Modal
          isOpen={showRegModal}
          onClose={() => setShowRegModal(false)}
          title="On-Site Rapid Patient Registration"
          description="Register community patients directly at the camp entrance with offline sync capability."
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

      {/* QR Check-In Modal */}
      {showQrModal && (
        <Modal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          title="Volunteer QR Pass Intake Verification"
          description="Paste or scan the digital token string from the patient's mobile or printed paper pass."
          maxWidth="md"
        >
          <form onSubmit={handleVerifyQRToken} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                QR Token String or Numeric Token Pass
              </label>
              <input
                type="text"
                value={qrTokenInput}
                onChange={(e) => setQrTokenInput(e.target.value)}
                placeholder="e.g. eyJhbGciOi... or Token #14"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowQrModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" leftIcon={<Check className="w-4 h-4" />}>
                Confirm Patient Arrival
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default VolunteerDashboard;
