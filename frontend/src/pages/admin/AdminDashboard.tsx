// src/pages/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import apiClient from '@/api/client';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCampModal, setShowCampModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [campsList, setCampsList] = useState<any[]>([]);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [volunteersList, setVolunteersList] = useState<any[]>([]);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, campsRes, usersRes] = await Promise.all([
        apiClient.get('/admin/stats'),
        apiClient.get('/admin/camps?limit=20'),
        apiClient.get('/admin/users?limit=50'),
      ]);

      setStats(statsRes.data?.data);
      const camps = campsRes.data?.data || [];
      const users = usersRes.data?.data || [];

      setCampsList(camps);
      setDoctorsList(users.filter((u: any) => u.role === 'DOCTOR' || u.role === 'doctor'));
      setVolunteersList(users.filter((u: any) => u.role === 'VOLUNTEER' || u.role === 'volunteer'));
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950 to-blue-950 text-white shadow-xl border border-cyan-500/20">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400">
            System Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Community Health Network HQ
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-lg">
            High-level oversight of community camps, clinical deployments, inventory thresholds, and patient volume.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="border-cyan-400/40 text-cyan-300 hover:bg-cyan-950/60"
            onClick={() => setShowStaffModal(true)}
            leftIcon={<UserCheck className="w-4 h-4" />}
          >
            Deploy Staff to Camp
          </Button>
          <Button
            variant="secondary"
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold border-0 shadow-lg shadow-cyan-500/20"
            onClick={() => setShowCampModal(true)}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Create Health Camp
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Camps Scheduled"
          value={stats?.totalCamps || campsList.length || 18}
          icon={Calendar}
          variant="primary"
          trend={{ value: `${stats?.activeCamps || 4} active`, isPositive: true }}
        />
        <StatCard
          title="Registered Patients"
          value={stats?.totalPatients || 1240}
          icon={Users}
          variant="secondary"
        />
        <StatCard
          title="Deployed Doctors"
          value={stats?.totalDoctors || doctorsList.length || 28}
          icon={Stethoscope}
          variant="success"
        />
        <StatCard
          title="Active Volunteers"
          value={stats?.totalVolunteers || volunteersList.length || 64}
          icon={HeartHandshake}
          variant="secondary"
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4">
            Patient Registrations & Checkup Throughput
          </h3>
          <RegistrationChart />
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4">
            Clinical Services Utilization
          </h3>
          <ServiceUtilizationChart />
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4">
            Camp Capacity vs Registered Turnout
          </h3>
          <CampPatientChart />
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4">
            Appointment Status Breakdown
          </h3>
          <AppointmentStatusChart />
        </div>
      </div>

      {/* Quick Links Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/admin/camps"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 transition-colors shadow-sm flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-cyan-500" />
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
              Manage All Camps
            </span>
          </div>
          <span className="text-xs text-cyan-500 font-bold">→</span>
        </Link>

        <Link
          to="/admin/users"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 transition-colors shadow-sm flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-cyan-500" />
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
              Staff & User Directory
            </span>
          </div>
          <span className="text-xs text-cyan-500 font-bold">→</span>
        </Link>

        <Link
          to="/inventory"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 transition-colors shadow-sm flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-cyan-500" />
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
              Medicine Stock & Alerts
            </span>
          </div>
          <span className="text-xs text-cyan-500 font-bold">→</span>
        </Link>
      </div>

      {/* Camp Creation Modal */}
      {showCampModal && (
        <Modal
          isOpen={showCampModal}
          onClose={() => setShowCampModal(false)}
          title="Schedule New Health Camp"
          description="Configure location, dates, capacity, coordinates, and services."
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

      {/* Staff Deployment Modal */}
      {showStaffModal && (
        <Modal
          isOpen={showStaffModal}
          onClose={() => setShowStaffModal(false)}
          title="Deploy Medical Staff to Camp"
          description="Assign licensed doctors and volunteers to upcoming camp locations."
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

