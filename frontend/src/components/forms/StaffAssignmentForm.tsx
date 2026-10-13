// src/components/forms/StaffAssignmentForm.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ShieldCheck, UserCheck, Stethoscope } from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

interface StaffUser {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
}

interface StaffAssignmentFormProps {
  camps: Array<{ id: string; name: string }>;
  doctors: StaffUser[];
  volunteers: StaffUser[];
  defaultCampId?: string;
  onSuccess?: () => void;
}

export const StaffAssignmentForm: React.FC<StaffAssignmentFormProps> = ({
  camps,
  doctors,
  volunteers,
  defaultCampId,
  onSuccess,
}) => {
  const [selectedCampId, setSelectedCampId] = useState(defaultCampId || camps[0]?.id || '');
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]);
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleDoctor = (id: string) => {
    setSelectedDoctorIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const toggleVolunteer = (id: string) => {
    setSelectedVolunteerIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampId) {
      toast.error('Please select a health camp');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.post('/admin/staff-assign', {
        campId: selectedCampId,
        doctorIds: selectedDoctorIds,
        volunteerIds: selectedVolunteerIds,
      });

      toast.success('Medical staff successfully assigned to camp!');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Select Target Health Camp *
        </label>
        <Select
          value={selectedCampId}
          onChange={(e) => setSelectedCampId(e.target.value)}
          options={camps.map((c) => ({ value: c.id, label: c.name }))}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
          <Stethoscope className="w-3.5 h-3.5 text-cyan-600" />
          Assign Available Doctors ({selectedDoctorIds.length} selected)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          {doctors.length === 0 ? (
            <p className="text-xs text-slate-400 p-2 col-span-2">No doctors registered</p>
          ) : (
            doctors.map((doc) => {
              const name = doc.name || `${doc.firstName || ''} ${doc.lastName || ''}`.trim() || doc.email;
              const isChecked = selectedDoctorIds.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleDoctor(doc.id)}
                  className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer border transition-colors ${
                    isChecked
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{name}</span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="rounded text-cyan-600"
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
          Assign Community Volunteers ({selectedVolunteerIds.length} selected)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          {volunteers.length === 0 ? (
            <p className="text-xs text-slate-400 p-2 col-span-2">No volunteers registered</p>
          ) : (
            volunteers.map((vol) => {
              const name = vol.name || `${vol.firstName || ''} ${vol.lastName || ''}`.trim() || vol.email;
              const isChecked = selectedVolunteerIds.includes(vol.id);
              return (
                <div
                  key={vol.id}
                  onClick={() => toggleVolunteer(vol.id)}
                  className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer border transition-colors ${
                    isChecked
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{name}</span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="rounded text-cyan-600"
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        isLoading={isSubmitting}
        leftIcon={<ShieldCheck className="w-4 h-4" />}
      >
        Confirm Staff Camp Deployment
      </Button>
    </form>
  );
};

export default StaffAssignmentForm;

