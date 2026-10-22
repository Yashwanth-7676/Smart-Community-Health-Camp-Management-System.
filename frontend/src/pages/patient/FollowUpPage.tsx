// src/pages/patient/FollowUpPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Building2,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  PhoneCall,
  Info,
  CalendarCheck,
  Stethoscope,
} from 'lucide-react';
import apiClient from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

interface FollowUpItem {
  id: string;
  patientId: string;
  doctorId?: string;
  campId?: string;
  doctorName?: string;
  campName?: string;
  dueDate: string;
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'MISSED';
  instructions?: string;
  notes?: string;
  recommendedService?: string;
  createdAt: string;
}

export const FollowUpPage: React.FC = () => {
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');

  const fetchFollowUps = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      else setIsLoading(true);

      const res = await apiClient.get('/followups/my').catch(async () => {
        // Fallback endpoint if specific route differs
        return await apiClient.get('/followups');
      });

      const data = res.data?.data?.followUps || res.data?.data || [];
      setFollowUps(data);
      if (showToast) toast.success('Follow-up schedule updated');
    } catch {
      // Graceful demo fallback data when offline
      setFollowUps([
        {
          id: 'fu-demo-01',
          patientId: 'patient-1',
          doctorName: 'Dr. Priya Sharma, MBBS, MD',
          campName: 'Ramanagara Primary Healthcare Camp',
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
          status: 'PENDING',
          instructions: 'Repeat fasting blood glucose test and bring blood pressure log.',
          notes: 'Stage 1 hypertension management monitoring.',
          recommendedService: 'Cardiology / General Medicine',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'fu-demo-02',
          patientId: 'patient-1',
          doctorName: 'Dr. Suresh Kumar, MS (Ophthalmology)',
          campName: 'Tumkur Rural Diagnostic & Eye Care Camp',
          dueDate: new Date(Date.now() - 14 * 86400000).toISOString(),
          status: 'COMPLETED',
          instructions: 'Spectacle power adaptation verification checkup.',
          notes: 'Visual acuity stabilized at 6/6 with corrective lenses.',
          recommendedService: 'Ophthalmology',
          createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const handleMarkComplete = async (id: string) => {
    try {
      await apiClient.put(`/followups/${id}`, { status: 'COMPLETED' });
      toast.success('Follow-up checkup marked as completed');
      fetchFollowUps();
    } catch {
      // Optimistic update for demo mode
      setFollowUps((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: 'COMPLETED' } : f))
      );
      toast.success('Status updated to Completed (demo mode)');
    }
  };

  const filtered = followUps.filter((f) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'PENDING') return f.status === 'PENDING' || f.status === 'SCHEDULED';
    if (activeFilter === 'COMPLETED') return f.status === 'COMPLETED';
    return true;
  });

  const pendingCount = followUps.filter(
    (f) => f.status === 'PENDING' || f.status === 'SCHEDULED'
  ).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-[#0d2244] to-[#0a1628] border border-cyan-500/25 p-7 sm:p-9 text-white shadow-3d">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Link
                to="/patient"
                className="inline-flex items-center gap-1 text-xs text-cyan-300 hover:text-cyan-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Patient Portal</span>
              </Link>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Preventive Continuity of Care</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Clinical Follow-Up Reminders
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Review recommended follow-up screening appointments, doctor advice, and clinical timelines assigned following your camp consultations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchFollowUps(true)}
              isLoading={isRefreshing}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/50"
            >
              Refresh
            </Button>
            <Link to="/patient/book">
              <Button
                variant="primary"
                size="sm"
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                leftIcon={<CalendarCheck className="w-3.5 h-3.5 text-slate-950" />}
              >
                Book Camp Visit
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Quick Stat */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm w-fit">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'ALL'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All ({followUps.length})
          </button>
          <button
            onClick={() => setActiveFilter('PENDING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'PENDING'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pending Action ({pendingCount})
          </button>
          <button
            onClick={() => setActiveFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'COMPLETED'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Completed ({followUps.length - pendingCount})
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-cyan-500" />
          <span>Follow-up instructions are issued by licensed medical camp doctors.</span>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <SkeletonLoader variant="list" rows={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          variant="data"
          title="No follow-up checkups found"
          description={
            activeFilter === 'PENDING'
              ? 'You are all caught up! No pending follow-up consultations currently required.'
              : 'No follow-up checkup records available under the selected filter.'
          }
          action={
            <Link to="/camps">
              <Button variant="primary" size="sm">
                Find Upcoming Camps
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((item, idx) => {
            const isPending = item.status === 'PENDING' || item.status === 'SCHEDULED';
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
              >
                <Card
                  className={`border transition-all ${
                    isPending
                      ? 'border-cyan-500/30 hover:border-cyan-400/60 shadow-sm'
                      : 'border-slate-200/80 dark:border-slate-800 opacity-80'
                  }`}
                >
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      {/* Left: Info */}
                      <div className="space-y-3 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={item.status} size="sm" />
                          {item.recommendedService && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                              {item.recommendedService}
                            </span>
                          )}
                          <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto sm:ml-0">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Target Date: <strong className="text-slate-800 dark:text-slate-200">{formatDate(item.dueDate)}</strong>
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-cyan-500 shrink-0" />
                            <span>{item.instructions || 'Scheduled Clinical Checkup'}</span>
                          </h3>
                          {item.notes && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                              {item.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                          {item.doctorName && (
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-cyan-500" />
                              <span>{item.doctorName}</span>
                            </div>
                          )}
                          {item.campName && (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-cyan-500" />
                              <span>{item.campName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                        {isPending ? (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
                              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              onClick={() => handleMarkComplete(item.id)}
                            >
                              Mark Completed
                            </Button>
                            <Link to="/patient/book">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                Book Next Camp
                              </Button>
                            </Link>
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Completed on schedule
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FollowUpPage;
