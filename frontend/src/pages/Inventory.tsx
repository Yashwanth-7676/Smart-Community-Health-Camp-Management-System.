// src/pages/Inventory.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { InventoryAlertCard } from '@/components/dashboard/InventoryAlertCard';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { Package, PlusCircle, AlertTriangle, Calendar, Search } from 'lucide-react';
import apiClient from '@/api/client';
import { formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

export const Inventory: React.FC = () => {
  const [camps, setCamps] = useState<any[]>([]);
  const [selectedCampId, setSelectedCampId] = useState<string>('');
  const [items, setItems] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    medicineName: '',
    genericName: '',
    quantity: 100,
    unit: 'Tablets',
    expiryDate: '',
    lowStockThreshold: 15,
    supplier: 'State Health Depot',
  });

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const [campsRes, alertsRes] = await Promise.all([
        apiClient.get('/camps'),
        apiClient.get('/inventory/alerts/low-stock'),
      ]);

      const cList = campsRes.data?.data?.camps || campsRes.data?.data || [];
      setCamps(cList);
      setAlerts(alertsRes.data?.data?.lowStock || []);

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

  useEffect(() => {
    fetchInventory();
  }, [selectedCampId]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampId) {
      toast.error('Select a camp first');
      return;
    }
    try {
      await apiClient.post(`/inventory/${selectedCampId}`, newItem);
      toast.success('Medicine added to camp inventory!');
      setShowAddModal(false);
      fetchInventory();
    } catch {
      toast.error('Failed to add inventory item');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            Pharmacy & Logistics
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Medicine & Supply Inventory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time tracking of camp stocks, expiry warnings, and dispensary reordering.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowAddModal(true)}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Add Medicine Stock
        </Button>
      </div>

      {/* Low Stock Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Low Stock & Expiry Critical Alerts ({alerts.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.slice(0, 3).map((alert: any) => (
              <InventoryAlertCard
                key={alert.id}
                item={alert}
                onRestock={() => toast.success(`Restock requisition sent for ${alert.medicineName}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Camp Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {camps.map((camp: any) => (
          <button
            key={camp.id}
            onClick={() => setSelectedCampId(camp.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCampId === camp.id
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {camp.name}
          </button>
        ))}
      </div>

      {/* Table */}
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
              <TableHead>Stock Level</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Threshold</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                  No inventory records logged for this health camp.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item: any) => {
                const isLow = item.quantity <= item.lowStockThreshold;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                      {item.medicineName}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {item.genericName || '—'}
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
                      <Badge variant={isLow ? 'warning' : 'success'} size="sm">
                        {isLow ? 'Low Stock' : 'Optimal'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      )}

      {/* Add Modal */}
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
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Generic Name
              </label>
              <Input
                value={newItem.genericName}
                onChange={(e) => setNewItem({ ...newItem, genericName: e.target.value })}
                placeholder="e.g. Acetaminophen"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quantity *
                </label>
                <Input
                  type="number"
                  required
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Unit *
                </label>
                <Input
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  placeholder="Tablets / Bottles / Vials"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Low Stock Threshold
                </label>
                <Input
                  type="number"
                  value={newItem.lowStockThreshold}
                  onChange={(e) => setNewItem({ ...newItem, lowStockThreshold: Number(e.target.value) })}
                />
              </div>
            </div>
            <Button type="submit" variant="primary" className="w-full">
              Confirm Inventory Addition
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Inventory;

