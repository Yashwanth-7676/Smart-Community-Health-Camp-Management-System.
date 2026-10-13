// src/components/forms/CampForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LocationPicker } from '@/components/maps/LocationPicker';
import { Plus, X, Calendar, MapPin, Users } from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

export interface CampFormData {
  name: string;
  location: string;
  address: string;
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  capacity: number;
  services: string[];
  description: string;
}

interface CampFormProps {
  initialData?: Partial<CampFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const AVAILABLE_SERVICES = [
  'General Checkup',
  'Eye Screening',
  'Dental Care',
  'Pediatrics',
  'Gynecology',
  'Diabetes Screening',
  'Blood Donation',
  'Cardiology Consult',
];

export const CampForm: React.FC<CampFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const [selectedServices, setSelectedServices] = useState<string[]>(
    initialData?.services || ['General Checkup']
  );
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialData?.latitude || 12.9716,
    lng: initialData?.longitude || 77.5946,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CampFormData>({
    defaultValues: {
      name: initialData?.name || '',
      location: initialData?.location || '',
      address: initialData?.address || '',
      startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
      endDate: initialData?.endDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      capacity: initialData?.capacity || 100,
      description: initialData?.description || '',
    },
  });

  const toggleService = (svc: string) => {
    if (selectedServices.includes(svc)) {
      setSelectedServices(selectedServices.filter((s) => s !== svc));
    } else {
      setSelectedServices([...selectedServices, svc]);
    }
  };

  const onSubmit = async (data: CampFormData) => {
    try {
      setIsSubmitting(true);
      const payload = {
        ...data,
        capacity: Number(data.capacity),
        latitude: coords.lat,
        longitude: coords.lng,
        services: selectedServices,
      };

      await apiClient.post('/admin/camps', payload);
      toast.success('Health camp created successfully!');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create camp');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Camp Title *
          </label>
          <Input
            {...register('name', { required: 'Camp name required' })}
            placeholder="e.g. Koramangala Mega Community Camp"
            error={errors.name?.message}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Area / Locality *
          </label>
          <Input
            {...register('location', { required: 'Locality is required' })}
            placeholder="e.g. Koramangala 4th Block"
            error={errors.location?.message}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Detailed Venue Address *
        </label>
        <Input
          {...register('address', { required: 'Address is required' })}
          placeholder="e.g. Community Hall, 17th Main Rd, Bengaluru"
          error={errors.address?.message}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Start Date *
          </label>
          <Input
            type="date"
            {...register('startDate', { required: 'Start date required' })}
            error={errors.startDate?.message}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            End Date *
          </label>
          <Input
            type="date"
            {...register('endDate', { required: 'End date required' })}
            error={errors.endDate?.message}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Patient Capacity *
          </label>
          <Input
            type="number"
            {...register('capacity', { required: 'Capacity required', min: 10 })}
            placeholder="150"
            error={errors.capacity?.message}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Offered Clinical Services
        </label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_SERVICES.map((svc) => {
            const isSelected = selectedServices.includes(svc);
            return (
              <button
                type="button"
                key={svc}
                onClick={() => toggleService(svc)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {isSelected ? '✓ ' : '+ '}
                {svc}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Pick Map Location Coordinates
        </label>
        <LocationPicker
          initialLat={coords.lat}
          initialLng={coords.lng}
          onLocationSelect={(lat, lng) => setCoords({ lat, lng })}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Camp Description & Guidelines
        </label>
        <textarea
          {...register('description')}
          rows={3}
          placeholder="Brief instructions for patients, free medication notices, etc."
          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
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
        >
          Publish Camp Schedule
        </Button>
      </div>
    </form>
  );
};

export default CampForm;

