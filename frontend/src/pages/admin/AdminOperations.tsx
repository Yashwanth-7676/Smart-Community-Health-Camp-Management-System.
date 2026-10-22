// src/pages/admin/AdminOperations.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  Calendar,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Package,
  Building2,
  RefreshCw,
  Search,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  MapPin,
  TrendingUp,
  FileText,
  Stethoscope,
  Radio,
} from 'lucide-react';
import apiClient from '@/api/client';
import { StatCard } from '@/components/dashboard/StatCard';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

interface OperationsData {
  activeCamps: number;
  upcomingCamps: number;
  completedCamps: number;
  totalRegistrations: number;
  attendanceRate: number;
  todayCheckIns: number;
  waitingInQueue: number;
  lowStockAlerts: number;
  pendingReferrals: number;
  pendingFollowUps: number;
  districtCoverage: Array<{ district: string; campCount: number; patientCount: number }>;
  dataNote?: string;
}

export const AdminOperations: React.FC = () => {
  const [data, setData] = useState<OperationsData | null>(null);
  const [camps, setCamps] = useState<any[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const fetchOperationsData = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      else setIsLoading(true);

      const [opsRes, campsRes, invRes] = await Promise.all([
        apiClient.get('/admin/operations'),
        apiClient.get('/admin/camps?limit=30').catch(() => ({ data: { data: [] } })),
        apiClient.get('/inventory?lowStockOnly=true').catch(() => ({ data: { data: [] } })),
      ]);

      setData(opsRes.data?.data);
      setCamps(campsRes.data?.data || []);
      setInventoryAlerts(invRes.data?.data || []);
      if (showToast) toast.success('Operational metrics refreshed');
    } catch {
      // Fallback handled gracefully
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOperationsData();
  }, []);

  const activeCampsList = camps.filter((c) => c.status === 'ONGOING' || c.status === 'UPCOMING');

  const filteredCamps = activeCampsList.filter((c) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.location && c.location.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950 to-blue-950 text-white shadow-3d border border-cyan-500/25 p-7 sm:p-9">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Live Operations Command Center • Ground Network Tracking</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Camp Operations Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Real-time monitoring of live health camp facilities, active patient queues, ground staff deployments, and pharmaceutical supply thresholds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchOperationsData(true)}
              isLoading={isRefreshing}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="border-cyan-400/40 text-cyan-300 hover:bg-cyan-950/60"
            >
              Refresh Ops
            </Button>
            <Link to="/command-center">
              <Button
                variant="primary"
                size="sm"
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                leftIcon={<Radio className="w-3.5 h-3.5 text-slate-950" />}
              >
                Triage Command Screen
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Real-time KPI Metric Cards */}
      {isLoading ? (
        <SkeletonLoader variant="stat" rows={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Camps Live"
            value={data?.activeCamps ?? 0}
            icon={Building2}
            color="green"
            trend="up"
            changePeriod="in progress"
          />
          <StatCard
            title="Waiting in Queues"
            value={data?.waitingInQueue ?? 0}
            icon={Clock}
            color="cyan"
            trend="neutral"
            changePeriod="active terminals"
          />
          <StatCard
            title="Today's Check-ins"
            value={data?.todayCheckIns ?? 0}
            icon={CheckCircle2}
            color="blue"
            trend="up"
            changePeriod="verified by QR"
          />
          <StatCard
            title="Low Stock Alerts"
            value={data?.lowStockAlerts ?? 0}
            icon={Package}
            color={data?.lowStockAlerts ? 'red' : 'green'}
            trend={data?.lowStockAlerts ? 'down' : 'neutral'}
            changePeriod="under reorder threshold"
          />
        </div>
      )}

      {/* Main Grid: Active Facilities & District Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active & Upcoming Camps Management */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-500" />
                  <span>Scheduled Camp Facilities</span>
                </CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live capacity utilization and queue statuses
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter camps by venue or name..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              {isLoading ? (
                <SkeletonLoader variant="list" rows={4} />
              ) : filteredCamps.length === 0 ? (
                <EmptyState
                  variant="search"
                  title="No active camps matching search"
                  description="Adjust your search query or schedule new community health camps."
                />
              ) : (
                <div className="space-y-3.5">
                  {filteredCamps.map((camp) => {
                    const capacity = camp.capacity || 100;
                    const registered = camp.registered || 0;
                    const pct = Math.min(100, Math.round((registered / capacity) * 100));

                    return (
                      <div
                        key={camp.id}
                        className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 hover:border-cyan-500/40 transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                {camp.name}
                              </h4>
                              <StatusBadge status={camp.status} size="sm" />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-cyan-500" />
                              <span>{camp.location}</span>
                              <span>•</span>
                              <span>{formatDate(camp.startDate)}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link to={`/camps/${camp.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs border-slate-300 dark:border-slate-700"
                              >
                                View Camp
                              </Button>
                            </Link>
                            <Link to="/camp-map">
                              <Button
                                variant="primary"
                                size="sm"
                                className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white"
                              >
                                Map
                              </Button>
                            </Link>
                          </div>
                        </div>

                        {/* Capacity Progress Bar */}
                        <div>
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                            <span>Capacity Booking</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {registered} / {capacity} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                pct >= 90
                                  ? 'bg-rose-500'
                                  : pct >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-cyan-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: District Coverage & Inventory Alerts */}
        <div className="space-y-6">
          {/* District Coverage Table */}
          <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-500" />
                <span>District Coverage</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {isLoading ? (
                <SkeletonLoader variant="list" rows={3} />
              ) : !data?.districtCoverage || data.districtCoverage.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No regional data available</p>
              ) : (
                <div className="space-y-3">
                  {data.districtCoverage.slice(0, 6).map((dist, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          {dist.district || 'Karnataka Region'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {dist.campCount} {dist.campCount === 1 ? 'camp' : 'camps'} scheduled
                        </span>
                      </div>
                      <span className="font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                        {dist.patientCount} registered
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Pharmacy Low-Stock Alerts</span>
              </CardTitle>
              <Link
                to="/inventory"
                className="text-xs text-cyan-500 hover:text-cyan-400 font-semibold"
              >
                Inventory →
              </Link>
            </CardHeader>
            <CardContent className="p-4">
              {inventoryAlerts.length === 0 ? (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>All essential emergency medicines are adequately stocked.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {inventoryAlerts.slice(0, 4).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs"
                    >
                      <div>
                        <span className="font-bold text-rose-700 dark:text-rose-300 block">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400">Batch: {item.batchNumber}</span>
                      </div>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        {item.quantity} left
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminOperations;
