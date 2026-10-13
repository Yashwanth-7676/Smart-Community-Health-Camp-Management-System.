// src/pages/patient/AppointmentBooking.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCamps } from '@/hooks/useCamps';
import { useCreateAppointment } from '@/hooks/useAppointments';
import { QueueToken } from '@/components/common/QueueToken';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Users,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

const TIME_SLOTS = [
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 01:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM',
];

export const AppointmentBooking: React.FC = () => {
  const navigate = useNavigate();
  const { data: campsData, isLoading: campsLoading } = useCamps();
  const createAppointment = useCreateAppointment();

  const camps = (campsData as any)?.camps || campsData || [];

  const [selectedCampId, setSelectedCampId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState<string>(TIME_SLOTS[0]);
  const [selectedService, setSelectedService] = useState<string>('General Medicine');
  const [notes, setNotes] = useState<string>('');
  const [confirmedToken, setConfirmedToken] = useState<any>(null);

  const activeCamp = camps.find((c: any) => c.id === selectedCampId) || camps[0];

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCamp) {
      toast.error('Please select an active health camp');
      return;
    }

    try {
      const res = await createAppointment.mutateAsync({
        campId: activeCamp.id,
        service: selectedService,
        appointmentDate: selectedDate,
        timeSlot: selectedSlot,
        notes,
      });

      const tokenObj = res?.data || {
        queueToken: `TK-${Math.floor(100 + Math.random() * 900)}`,
        camp: activeCamp,
        timeSlot: selectedSlot,
        date: selectedDate,
      };

      setConfirmedToken(tokenObj);
      toast.success('Your camp appointment has been confirmed!');
    } catch (err: any) {
      // Handled in mutation hook
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
          Booking Portal
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          Reserve Health Camp Slot
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Select your local camp, preferred doctor service, and time slot to receive a digital queue pass.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Booking Form (2 Cols) */}
        <div className="md:col-span-2">
          <Card className="p-6">
            <form onSubmit={handleBooking} className="space-y-5">
              {/* Select Camp */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  1. Choose Health Camp *
                </label>
                <Select
                  value={selectedCampId || activeCamp?.id || ''}
                  onChange={(e) => setSelectedCampId(e.target.value)}
                  options={camps.map((c: any) => ({
                    value: c.id,
                    label: `${c.name} (${c.location})`,
                  }))}
                />
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  2. Consultation Specialization *
                </label>
                <Select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  options={[
                    { value: 'General Medicine', label: 'General Medicine Checkup' },
                    { value: 'Eye Screening', label: 'Eye Care & Vision Testing' },
                    { value: 'Dental Checkup', label: 'Dental Examination' },
                    { value: 'Pediatrics', label: 'Child Health & Pediatrics' },
                    { value: 'Gynecology', label: 'Maternal & Women Health' },
                    { value: 'Diabetes & BP', label: 'Diabetes & Hypertension Screening' },
                  ]}
                />
              </div>

              {/* Date & Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    3. Appointment Date *
                  </label>
                  <Input
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    4. Preferred Time Slot *
                  </label>
                  <Select
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    options={TIME_SLOTS.map((s) => ({ value: s, label: s }))}
                  />
                </div>
              </div>

              {/* Reason / Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Primary Symptoms / Health Concerns
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Occasional dizziness, vision blurriness for 2 weeks..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3"
                isLoading={createAppointment.isPending}
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                Confirm Booking & Generate Queue Token
              </Button>
            </form>
          </Card>
        </div>

        {/* Camp Info Card (1 Col) */}
        <div>
          {activeCamp ? (
            <Card className="p-5 space-y-4 bg-slate-50/70 dark:bg-slate-900/60 border-cyan-500/20">
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                <MapPin className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {activeCamp.name}
                </h3>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <p>
                  <strong>Address:</strong> {activeCamp.address || activeCamp.location}
                </p>
                <p>
                  <strong>Dates:</strong> {formatDate(activeCamp.startDate)} - {formatDate(activeCamp.endDate)}
                </p>
                <p>
                  <strong>Capacity:</strong> {activeCamp.maxCapacity || (activeCamp as any).capacity || 100} patients
                </p>
              </div>

              <div className="p-3 rounded-xl bg-cyan-100/60 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200 text-xs">
                <ShieldCheck className="w-4 h-4 text-cyan-600 inline mr-1.5" />
                No appointment fee. Free essential medicines and consultations are provided at this camp.
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center text-xs text-slate-400">
              Select a camp to see details
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmedToken && (
        <Modal
          isOpen={Boolean(confirmedToken)}
          onClose={() => {
            setConfirmedToken(null);
            navigate('/patient');
          }}
          title="Booking Confirmed!"
          description="Your queue pass is ready. Take a screenshot or print it out."
        >
          <QueueToken
            tokenNumber={confirmedToken.queueToken || confirmedToken.tokenNumber || 'KRM-014'}
            campName={activeCamp?.name || 'Community Health Camp'}
            campLocation={activeCamp?.location || 'Bengaluru'}
            patientName="Registered Patient"
            date={formatDate(selectedDate)}
            timeSlot={selectedSlot}
            service={selectedService}
          />
        </Modal>
      )}
    </div>
  );
};

export default AppointmentBooking;

