// src/pages/Inventory.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import {
  Package,
  PlusCircle,
  AlertTriangle,
  Calendar,
  Search,
  ArrowRightLeft,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Layers,
  Info,
} from 'lucide-react';
import apiClient from '@/api/client';
import { formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

export const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stock' | 'alerts' | 'transfers' | 'forecast'>('stock');

  // Camps & Active Stock
  const [camps, setCamps] = useState<any[]>([]);
  const [selectedCampId, setSelectedCampId] = useState<string>('');
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Alerts
  const [alertsData, setAlertsData] = useState<{
    summary?: any;
    lowStock: any[];
    criticalExpiry: any[];
    warningExpiry: any[];
    expired: any[];
  }>({ lowStock: [], criticalExpiry: [], warningExpiry: [], expired: [] });

  // Transfers & Movements
  const [transfers, setTransfers] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({
    toCampId: '',
    medicineName: '',
    batchNumber: '',
    quantity: 50,
    reason: '',
    type: 'TRANSFER',
  });

  // Demand Forecast
  const [forecastData, setForecastData] = useState<any>(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  // Add Item Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    medicineName: '',
    genericName: '',
    quantity: 100,
    unit: 'Tablets',
    expiryDate: '',
    lowStockThreshold: 15,
    supplier: 'State Health Depot',
    batchNumber: '',
  });

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const [campsRes, alertsRes, trfRes, movRes] = await Promise.all([
        apiClient.get('/camps'),
        apiClient.get('/inventory/alerts'),
        apiClient.get('/inventory/transfers'),
        apiClient.get('/inventory/movements'),
      ]);

      const cList = campsRes.data?.data?.camps || campsRes.data?.data || [];
      setCamps(cList);
      if (alertsRes.data?.data) {
        setAlertsData(alertsRes.data.data);
      }
      setTransfers(trfRes.data?.data || []);
      setMovements(movRes.data?.data || []);

      const activeId = selectedCampId || cList[0]?.id;
      if (activeId) {
        setSelectedCampId(activeId);
        const invRes = await apiClient.get(`/inventory/${activeId}`);
        setItems(invRes.data?.data || []);
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  const fetchForecast = async (campId: string) => {
    if (!campId) return;
    try {
      setForecastLoading(true);
      const res = await apiClient.get(`/inventory/forecast/${campId}`);
      if (res.data?.data) {
        setForecastData(res.data.data);
      }
    } catch {
      // fallback
    } finally {
      setForecastLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [selectedCampId]);

  useEffect(() => {
    if (activeTab === 'forecast' && selectedCampId) {
      fetchForecast(selectedCampId);
    }
  }, [activeTab, selectedCampId]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampId) {
      toast.error('Select a camp first');
      return;
    }
    try {
      await apiClient.post(`/inventory/${selectedCampId}`, newItem);
      toast.success('Medicine and batch added to inventory!');
      setShowAddModal(false);
      fetchInventory();
    } catch {
      toast.error('Failed to add inventory item');
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampId || !transferForm.toCampId) {
      toast.error('Please specify origin and destination camps');
      return;
    }
    try {
      await apiClient.post('/inventory/transfers', {
        fromCampId: selectedCampId,
        ...transferForm,
      });
      toast.success('Transfer requisition created. Awaiting approval.');
      setShowTransferModal(false);
      fetchInventory();
    } catch {
      toast.error('Failed to initiate transfer');
    }
  };

  const handleApproveTransfer = async (transferId: string) => {
    try {
      await apiClient.patch(`/inventory/transfers/${transferId}/approve`, {});
      toast.success('Transfer approved and stock ledger adjusted!');
      fetchInventory();
    } catch {
      toast.error('Failed to approve transfer');
    }
  };

  const handleRejectTransfer = async (transferId: string) => {
    try {
      await apiClient.patch(`/inventory/transfers/${transferId}/reject`, {
        rejectionReason: 'Rejected by pharmacy director',
      });
      toast.success('Transfer request rejected');
      fetchInventory();
    } catch {
      toast.error('Failed to reject transfer');
    }
  };

  const handleExportPDF = () => {
    if (!selectedCampId) {
      toast.error('Select a camp first');
      return;
    }
    const baseURL = apiClient.defaults.baseURL || 'http://localhost:5000/api/v1';
    window.open(`${baseURL}/pdf/inventory/${selectedCampId}`, '_blank');
    toast.success('Opening official camp inventory dispatch PDF...');
  };

  const filteredItems = items.filter(
    (i) =>
      (i.medicineName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.genericName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.batchNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ── Top Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            Pharmacy & Logistics
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Smart Medicine & Supply Inventory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time batch tracking, expiration alerts, demand forecasting, and authorized transfer controls.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            onClick={handleExportPDF}
            className="border-slate-300 dark:border-slate-700 text-xs font-bold"
          >
            Export Stock PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowTransferModal(true)}
            leftIcon={<ArrowRightLeft className="w-4 h-4" />}
            className="text-xs font-bold"
          >
            Request Transfer
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Add Batch Stock
          </Button>
        </div>
      </div>

      {/* ── Navigation Tabs ────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('stock')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'stock'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Stock & Batches</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'alerts'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Expiry & Low Stock Alerts</span>
          {(alertsData.lowStock.length > 0 || alertsData.criticalExpiry.length > 0) && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'transfers'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Transfers & Approvals</span>
          {transfers.filter((t) => t.status === 'PENDING_APPROVAL').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-blue-500 text-white text-[10px]">
              {transfers.filter((t) => t.status === 'PENDING_APPROVAL').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('forecast')}
          className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'forecast'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>AI Demand Forecasting</span>
        </button>
      </div>

      {/* ── TAB 1: Stock & Batches ─────────────────────────────────────── */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          {/* Camp Selector Tabs & Search */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full md:w-auto">
              {camps.map((camp: any) => (
                <button
                  key={camp.id}
                  onClick={() => setSelectedCampId(camp.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCampId === camp.id
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {camp.name}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search medicine or batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {isLoading ? (
            <Card className="p-6">
              <SkeletonLoader.CardSkeleton />
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine Name</TableHead>
                  <TableHead>Generic Composition</TableHead>
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                      No medicine records found for this camp inventory.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item: any) => {
                    const isLow = item.quantity <= item.lowStockThreshold;
                    const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                          {item.medicineName}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {item.genericName || '—'}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                          {item.batchNumber || `BAT-${item.id.slice(-4).toUpperCase()}`}
                        </TableCell>
                        <TableCell className="font-bold">
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell className="text-xs">
                          {item.expiryDate ? formatDate(item.expiryDate) : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-400">
                          {item.lowStockThreshold} {item.unit}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={isExpired ? 'danger' : isLow ? 'warning' : 'success'}
                            size="sm"
                          >
                            {isExpired ? 'Expired' : isLow ? 'Low Stock' : 'Optimal'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* ── TAB 2: Expiry & Low Stock Alerts ───────────────────────────── */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-2xl">
              <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                Low Stock Threshold
              </span>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {alertsData.lowStock.length} Items
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Quantity at or below safety reorder level</p>
            </div>

            <div className="p-4 bg-red-950/20 border border-red-800/40 rounded-2xl">
              <span className="text-xs text-red-400 font-bold uppercase tracking-wider">
                Critical Expiry (&lt; 30 Days)
              </span>
              <div className="text-2xl font-black text-red-400 mt-1">
                {alertsData.criticalExpiry.length} Batches
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Expiring in under 30 days — prioritize dispensing</p>
            </div>

            <div className="p-4 bg-cyan-950/20 border border-cyan-800/40 rounded-2xl">
              <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider">
                Warning Window (30 - 60 Days)
              </span>
              <div className="text-2xl font-black text-cyan-400 mt-1">
                {alertsData.warningExpiry.length} Batches
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Approaching end-of-life; plan redistribution</p>
            </div>
          </div>

          {/* Low Stock Items List */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Depleted Medicine Alerts</span>
            </h3>
            {alertsData.lowStock.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">All monitored camp stocks are above safety thresholds.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {alertsData.lowStock.map((it: any) => (
                  <div key={it.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-white">{it.medicineName}</div>
                      <div className="text-[11px] text-slate-400">Batch: {it.batchNumber || 'BAT-DEF'} &bull; Camp: {it.camp?.name || 'Assigned Camp'}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-400">{it.quantity} {it.unit} left</span>
                      <div className="text-[10px] text-slate-500">Threshold: {it.lowStockThreshold}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: Transfers & Approvals ───────────────────────────────── */}
      {activeTab === 'transfers' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-sm">Inter-Camp Stock Transfer Approvals</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Authorized clinicians and administrators must approve stock movements before physical dispatch.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowTransferModal(true)}
                leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
              >
                Initiate Transfer
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Transfer ID</th>
                    <th className="py-2.5 px-3">Medicine & Batch</th>
                    <th className="py-2.5 px-3">Route (From &rarr; To)</th>
                    <th className="py-2.5 px-3">Quantity</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3 text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {transfers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-slate-500">
                        No transfer requisitions currently recorded.
                      </td>
                    </tr>
                  ) : (
                    transfers.map((trf) => (
                      <tr key={trf.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-3 font-mono font-semibold text-cyan-400">{trf.id}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-white">{trf.medicineName}</div>
                          <div className="text-[10px] text-slate-500">{trf.batchNumber}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {trf.fromCamp?.name} &rarr; {trf.toCamp?.name}
                        </td>
                        <td className="py-3 px-3 font-bold text-white">{trf.quantity} units</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              trf.status === 'APPROVED'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : trf.status === 'REJECTED'
                                ? 'bg-red-950 text-red-400 border border-red-800'
                                : 'bg-blue-950 text-blue-400 border border-blue-800'
                            }`}
                          >
                            {trf.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 max-w-xs truncate text-slate-400">{trf.reason}</td>
                        <td className="py-3 px-3 text-right">
                          {trf.status === 'PENDING_APPROVAL' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleApproveTransfer(trf.id)}
                                className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded text-[11px] font-semibold"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectTransfer(trf.id)}
                                className="px-2 py-1 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 rounded text-[11px] font-semibold"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stock Movement Ledger */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Immutable Stock Movement Ledger</span>
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {movements.map((mov) => (
                <div key={mov.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-white">
                      {mov.medicineName} &bull; {mov.quantity} units ({mov.type})
                    </div>
                    <div className="text-[11px] text-slate-400">{mov.reason} &bull; Actor: {mov.performedBy}</div>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(mov.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: AI Demand Forecasting ───────────────────────────────── */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-semibold mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Data Sufficiency Guard Active</span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  Intelligent Demand Forecasting & Supply Quotas
                </h3>
              </div>

              {/* Camp selection for forecast */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Target Camp:</span>
                <select
                  value={selectedCampId}
                  onChange={(e) => setSelectedCampId(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  {camps.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {forecastLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs">Computing demand forecast...</div>
            ) : forecastData ? (
              <div className="space-y-5">
                {/* Sufficiency Notice */}
                {!forecastData.hasSufficientData ? (
                  <div className="p-4 bg-amber-950/30 border border-amber-800/60 rounded-xl text-xs text-amber-200 flex items-start gap-3">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-300">
                        Insufficient Historical Dataset ({forecastData.dataSufficiencyStatus?.availablePastCamps} of {forecastData.dataSufficiencyStatus?.requiredPastCamps} Completed Camps Recorded)
                      </span>
                      <p className="text-slate-300 mt-1 leading-relaxed">
                        {forecastData.dataSufficiencyStatus?.message}
                      </p>
                      <p className="text-amber-300/90 font-medium mt-1">
                        {forecastData.limitationStatement}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-cyan-950/30 border border-cyan-800/60 rounded-xl text-xs text-cyan-200 flex items-start gap-3">
                    <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-cyan-300">
                        Sufficient Historical Baseline Confirmed ({forecastData.methodology})
                      </span>
                      <p className="text-slate-300 mt-1 leading-relaxed">
                        {forecastData.limitationStatement}
                      </p>
                    </div>
                  </div>
                )}

                {/* Table of Forecasted Projections */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Medicine Category</th>
                        <th className="py-3 px-4">Projected Requirement</th>
                        <th className="py-3 px-4">Safety Buffer (+15%)</th>
                        <th className="py-3 px-4">Confidence / Sample Size</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {(forecastData.forecast || forecastData.baselineEstimates || []).map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-bold text-white">
                            {row.category || row.medicine}
                          </td>
                          <td className="py-3 px-4 text-cyan-400 font-extrabold text-sm">
                            {row.projectedRequirement || row.estimatedRequirement} units
                          </td>
                          <td className="py-3 px-4 text-emerald-400 font-bold">
                            +{row.recommendedSafetyStock || row.safetyBuffer} units
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {row.confidenceInterval || row.confidence}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Add Medicine Stock Modal ───────────────────────────────────── */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Medicine to Camp Stock"
        >
          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Medicine Name *
              </label>
              <Input
                required
                value={newItem.medicineName}
                onChange={(e) => setNewItem({ ...newItem, medicineName: e.target.value })}
                placeholder="e.g. Paracetamol 500mg"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Generic Composition
                </label>
                <Input
                  value={newItem.genericName}
                  onChange={(e) => setNewItem({ ...newItem, genericName: e.target.value })}
                  placeholder="e.g. Acetaminophen"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Batch Number
                </label>
                <Input
                  value={newItem.batchNumber}
                  onChange={(e) => setNewItem({ ...newItem, batchNumber: e.target.value })}
                  placeholder="e.g. BAT-2026-08"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quantity *
                </label>
                <Input
                  type="number"
                  required
                  min={1}
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value, 10) })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Unit
                </label>
                <Input
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  placeholder="Tablets / Vials"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Low Threshold
                </label>
                <Input
                  type="number"
                  value={newItem.lowStockThreshold}
                  onChange={(e) => setNewItem({ ...newItem, lowStockThreshold: parseInt(e.target.value, 10) })}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expiry Date
              </label>
              <Input
                type="date"
                value={newItem.expiryDate}
                onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Add to Inventory
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Request Transfer Modal ────────────────────────────────────── */}
      {showTransferModal && (
        <Modal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          title="Initiate Inter-Camp Transfer Requisition"
        >
          <form onSubmit={handleCreateTransfer} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Destination Camp *
              </label>
              <select
                required
                value={transferForm.toCampId}
                onChange={(e) => setTransferForm({ ...transferForm, toCampId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
              >
                <option value="">Select Destination Camp</option>
                {camps
                  .filter((c) => c.id !== selectedCampId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Medicine Name *
              </label>
              <Input
                required
                value={transferForm.medicineName}
                onChange={(e) => setTransferForm({ ...transferForm, medicineName: e.target.value })}
                placeholder="e.g. Paracetamol 500mg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Batch Number *
                </label>
                <Input
                  required
                  value={transferForm.batchNumber}
                  onChange={(e) => setTransferForm({ ...transferForm, batchNumber: e.target.value })}
                  placeholder="e.g. BAT-2026-08"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quantity Units *
                </label>
                <Input
                  type="number"
                  min={1}
                  required
                  value={transferForm.quantity}
                  onChange={(e) => setTransferForm({ ...transferForm, quantity: parseInt(e.target.value, 10) })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clinical / Operational Reason *
              </label>
              <textarea
                rows={2}
                required
                value={transferForm.reason}
                onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                placeholder="e.g. Urgent viral surge at destination camp dispensary"
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => setShowTransferModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Submit Requisition
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Inventory;
