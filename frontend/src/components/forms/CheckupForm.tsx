// src/components/forms/CheckupForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Stethoscope, CheckCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/api/client';

export interface CheckupFormData {
  patientId: string;
  campId: string;
  diagnosis: string;
  prescription: string;
  observations: string;
  referral?: string;
  isConfidential?: boolean;
}

interface CheckupFormProps {
  patientId: string;
  patientName: string;
  campId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CheckupForm: React.FC<CheckupFormProps> = ({
  patientId,
  patientName,
  campId,
  onSuccess,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<CheckupFormData>({
    defaultValues: {
      patientId,
      campId,
      isConfidential: false,
    },
  });

  const onSubmit = async (data: CheckupFormData) => {
    try {
      setIsSubmitting(true);
      await apiClient.post('/reports', data);
      toast.success(`Medical checkup recorded for ${patientName}`);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit medical report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="p-3 bg-cyan-50 dark:bg-cyan-950/40 rounded-xl text-xs text-cyan-800 dark:text-cyan-300 font-medium flex items-center justify-between">
        <span>Patient: <strong>{patientName}</strong></span>
        <span>Camp ID: {campId.slice(0, 8)}...</span>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Clinical Diagnosis *
        </label>
        <Input
          {...register('diagnosis', { required: 'Diagnosis is required' })}
          placeholder="e.g. Mild Hypertension, Type 2 Diabetes suspect, Cataract stage 1"
          error={errors.diagnosis?.message}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Clinical Observations & Vitals
        </label>
        <textarea
          {...register('observations')}
          rows={3}
          placeholder="BP: 130/85 mmHg, Pulse: 72 bpm, SpO2: 98%, BMI: 24.2..."
          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Prescription & Dosage
        </label>
        <textarea
          {...register('prescription')}
          rows={3}
          placeholder="1. Tab Paracetamol 500mg SOS&#10;2. Tab Metformin 500mg 1-0-1 after food"
          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Specialist Referral / Advice (Optional)
        </label>
        <Input
          {...register('referral')}
          placeholder="e.g. Refer to District Hospital Cardiology Dept for ECHO"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isConfidential"
          {...register('isConfidential')}
          className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
        />
        <label htmlFor="isConfidential" className="text-xs text-slate-600 dark:text-slate-400">
          Mark as confidential clinical record
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isSubmitting}
          leftIcon={<CheckCircle className="w-4 h-4" />}
        >
          Save Clinical Observation
        </Button>
      </div>
    </form>
  );
};

export default CheckupForm;

