// src/components/forms/PatientRegistrationForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LOCAL_STORAGE_KEYS } from '@/utils/constants';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';
import { UserPlus, WifiOff, CheckCircle } from 'lucide-react';

export interface PatientRegFormData {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  gender: string;
  campId: string;
  timeSlot: string;
  medicalHistory?: string;
}

interface PatientRegistrationFormProps {
  camps: Array<{ id: string; name: string }>;
  defaultCampId?: string;
  onSuccess?: (tokenData?: any) => void;
}

const TIME_SLOTS = [
  { value: '09:00 - 10:00', label: '09:00 AM - 10:00 AM' },
  { value: '10:00 - 11:00', label: '10:00 AM - 11:00 AM' },
  { value: '11:00 - 12:00', label: '11:00 AM - 12:00 PM' },
  { value: '12:00 - 01:00', label: '12:00 PM - 01:00 PM' },
  { value: '02:00 - 03:00', label: '02:00 PM - 03:00 PM' },
  { value: '03:00 - 04:00', label: '03:00 PM - 04:00 PM' },
];

export const PatientRegistrationForm: React.FC<PatientRegistrationFormProps> = ({
  camps,
  defaultCampId,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PatientRegFormData>({
    defaultValues: {
      campId: defaultCampId || (camps[0]?.id ?? ''),
      gender: 'MALE',
      timeSlot: '09:00 - 10:00',
    },
  });

  const onSubmit = async (data: PatientRegFormData) => {
    setIsSubmitting(true);
    const isOnline = navigator.onLine;

    if (!isOnline) {
      // Store in offline queue
      const offlineRecord = {
        ...data,
        offlineId: `offline-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        registeredAt: new Date().toISOString(),
      };

      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.OFFLINE_QUEUE);
        const queue = stored ? JSON.parse(stored) : [];
        queue.push(offlineRecord);
        localStorage.setItem(LOCAL_STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));

        toast('Offline mode: Registration saved to local device! Will sync when reconnected.', {
          icon: '💾',
          duration: 5000,
        });

        reset();
        if (onSuccess) onSuccess({ offline: true, ...offlineRecord });
      } catch {
        toast.error('Failed to save offline registration');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      const res = await apiClient.post('/volunteers/register-patient', data);
      toast.success('Patient registered and token generated successfully!');
      reset();
      if (onSuccess) onSuccess(res.data?.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            First Name *
          </label>
          <Input
            {...register('firstName', { required: 'First name is required' })}
            placeholder="e.g. Ramesh"
            error={errors.firstName?.message}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Last Name *
          </label>
          <Input
            {...register('lastName', { required: 'Last name is required' })}
            placeholder="e.g. Gowda"
            error={errors.lastName?.message}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Mobile Number *
          </label>
          <Input
            type="tel"
            {...register('phone', {
              required: 'Mobile number is required',
              pattern: { value: /^[0-9]{10}$/, message: 'Enter a valid 10-digit number' },
            })}
            placeholder="9876543210"
            error={errors.phone?.message}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Email (Optional)
          </label>
          <Input
            type="email"
            {...register('email')}
            placeholder="patient@example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Gender *
          </label>
          <Select
            {...register('gender')}
            options={[
              { value: 'MALE', label: 'Male' },
              { value: 'FEMALE', label: 'Female' },
              { value: 'OTHER', label: 'Other' },
            ]}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Date of Birth
          </label>
          <Input type="date" {...register('dateOfBirth')} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Assigned Camp *
          </label>
          <Select
            {...register('campId', { required: 'Camp required' })}
            options={camps.map((c) => ({ value: c.id, label: c.name }))}
            error={errors.campId?.message}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Preferred Time Slot *
        </label>
        <Select
          {...register('timeSlot', { required: 'Slot required' })}
          options={TIME_SLOTS}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Known Medical History / Allergies
        </label>
        <textarea
          {...register('medicalHistory')}
          rows={2}
          placeholder="e.g. Asthma, Penicillin allergy, Hypertension..."
          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        isLoading={isSubmitting}
        leftIcon={<UserPlus className="w-4 h-4" />}
      >
        Register Patient & Issue Queue Pass
      </Button>
    </form>
  );
};

export default PatientRegistrationForm;

