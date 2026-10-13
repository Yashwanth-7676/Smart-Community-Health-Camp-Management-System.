// src/pages/admin/AdminCamps.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { CampForm } from '@/components/forms/CampForm';
import { SearchBar } from '@/components/common/SearchBar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { PlusCircle, Calendar, MapPin, Trash2, Edit, Users } from 'lucide-react';
import apiClient from '@/api/client';
import { formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

export const AdminCamps: React.FC = () => {
  const [camps, setCamps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchCamps = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/admin/camps?limit=50');
      setCamps(res.data?.data || []);
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCamps();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete camp "${name}"?`)) return;
    try {
      await apiClient.delete(`/camps/${id}`);
      toast.success('Camp removed');
      fetchCamps();
    } catch {
      toast.error('Failed to delete camp');
    }
  };

  const filtered = camps.filter((c: any) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            Camp Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Health Camp Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create, update, monitor capacity and configure schedules across Karnataka.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Add New Health Camp
        </Button>
      </div>

      <SearchBar
        value={search}
        onSearch={setSearch}
        placeholder="Filter camps by title, district or locality..."
      />

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonLoader.CardSkeleton />
          <SkeletonLoader.CardSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">
          No health camps found. Click "Add New Health Camp" above to schedule one.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((camp: any) => {
            const regCount = camp.registered ?? camp.registeredCount ?? 0;
            const maxCap = camp.capacity ?? camp.maxCapacity ?? 100;
            return (
              <Card key={camp.id} hover className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      {camp.name}
                    </h3>
                    <Badge variant={camp.status === 'UPCOMING' ? 'primary' : 'success'} size="sm">
                      {camp.status}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                      {camp.location} — {camp.address}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                      {formatDate(camp.startDate)} to {formatDate(camp.endDate)}
                    </p>
                  </div>

                  <div className="mb-4">
                    <ProgressBar
                      value={regCount}
                      max={maxCap}
                      label={`Registered: ${regCount} / ${maxCap} Patients`}
                      size="sm"
                    />
                  </div>

                  {camp.services?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {camp.services.slice(0, 4).map((s: string) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          {s}
                        </span>
                      ))}
                      {camp.services.length > 4 && (
                        <span className="text-[10px] text-slate-400">+{camp.services.length - 4} more</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    ID: {camp.id.slice(0, 8)}...
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(camp.id, camp.name)}
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Schedule New Health Camp"
          maxWidth="2xl"
        >
          <CampForm
            onSuccess={() => {
              setShowCreateModal(false);
              fetchCamps();
            }}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default AdminCamps;

