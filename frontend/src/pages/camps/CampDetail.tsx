import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  MapPin, Calendar, Clock, Users, Share2, Bookmark, ChevronLeft,
  Activity, User, Stethoscope, Package, CheckCircle, AlertCircle
} from 'lucide-react';
import apiClient from '@/api/client';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png' });

const bookingSchema = z.object({
  date: z.string().min(1, 'Please select a date'),
  timeSlot: z.string().min(1, 'Please select a time slot'),
  notes: z.string().optional(),
});
type BookingForm = z.infer<typeof bookingSchema>;

const STATUS_COLORS: Record<string, string> = {
  upcoming: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  ongoing: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  completed: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
};

export default function CampDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);

  const { data: campData, isLoading } = useQuery({
    queryKey: ['camp', id],
    queryFn: () => apiClient.get(`/camps/${id}`).then(r => r.data.data),
    enabled: !!id,
  });

  const { data: slotsData } = useQuery({
    queryKey: ['camp-slots', id],
    queryFn: () => apiClient.get(`/camps/${id}/slots`).then(r => r.data.data),
    enabled: !!id,
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BookingForm>({ resolver: zodResolver(bookingSchema) });

  const bookMutation = useMutation({
    mutationFn: (data: BookingForm) => apiClient.post(`/appointments`, { campId: id, ...data }).then(r => r.data.data),
    onSuccess: (data) => {
      setBookingSuccess(data);
      qc.invalidateQueries({ queryKey: ['camp', id] });
      toast.success('Appointment booked successfully!');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Booking failed. Please try again.');
    },
  });

  const camp = campData?.camp;
  const slots: string[] = slotsData?.slots ?? [];
  const selectedDate = watch('date');

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1628] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Loading camp details...</p>
      </div>
    </div>
  );

  if (!camp) return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1628] flex items-center justify-center text-center">
      <div>
        <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Camp Not Found</h2>
        <Link to="/camps" className="text-cyan-500 hover:underline">Back to Camps</Link>
      </div>
    </div>
  );

  const pct = Math.min(100, Math.round(((camp.registeredCount ?? 0) / camp.capacity) * 100));
  const coords: [number, number] = camp.location?.coordinates ? [camp.location.coordinates[1], camp.location.coordinates[0]] : [15.3173, 75.7139];

  if (bookingSuccess) return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1628] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-[#0d1f3c] rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-gray-100 dark:border-white/10">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Booking Confirmed!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Your appointment has been successfully booked.</p>
        <div className="bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 rounded-2xl p-6 mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Queue Token</p>
          <p className="text-5xl font-extrabold text-cyan-500">{bookingSuccess.queueToken}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{bookingSuccess.timeSlot}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="flex-1 py-3 border border-cyan-500/40 text-cyan-500 rounded-xl font-semibold hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-colors">Print Token</button>
          <Link to="/patient/dashboard" className="flex-1 py-3 bg-cyan-500 text-white rounded-xl font-semibold hover:bg-cyan-400 transition-colors">Go to Dashboard</Link>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1628]">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#0a1628] to-[#0d2a4a] py-10">
        <div className="container mx-auto px-4">
          <Link to="/camps" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
            <ChevronLeft size={16} /> Back to Camps
          </Link>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl lg:text-4xl font-extrabold text-white">{camp.name}</h1>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${STATUS_COLORS[camp.status] ?? ''}`}>{camp.status}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-gray-300 text-sm">
                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-cyan-400" />{camp.address}</span>
                <span className="flex items-center gap-1.5"><Calendar size={14} className="text-cyan-400" />{new Date(camp.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span className="flex items-center gap-1.5"><Clock size={14} className="text-cyan-400" />{new Date(camp.startDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} – {new Date(camp.endDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { navigator.share?.({ title: camp.name, url: window.location.href }); toast.success('Link copied!'); }} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-sm font-medium transition-colors">
                <Share2 size={15} /> Share
              </button>
              <button onClick={() => setSaved(!saved)} className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${saved ? 'bg-cyan-500 border-cyan-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white border-white/20'}`}>
                <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Services */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white"><Activity size={20} className="text-cyan-400" /> Services Offered</h2>
            <div className="flex flex-wrap gap-2">
              {(camp.services ?? []).map((s: string) => (
                <span key={s} className="px-3 py-1.5 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 rounded-lg text-sm font-medium">{s}</span>
              ))}
            </div>
          </div>

          {/* Capacity */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white"><Users size={20} className="text-cyan-400" /> Capacity</h2>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>{camp.registeredCount ?? 0} registered</span>
              <span>{camp.capacity} total</span>
            </div>
            <div className="w-full h-3 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div className={`h-3 rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-cyan-500'}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{100 - pct}% seats available</p>
          </div>

          {/* Map */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white"><MapPin size={20} className="text-cyan-400" /> Location</h2>
            <div className="h-64 rounded-xl overflow-hidden">
              <MapContainer center={coords} zoom={14} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={coords}><Popup>{camp.name}</Popup></Marker>
              </MapContainer>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">{camp.address}</p>
          </div>

          {/* Doctors */}
          {(camp.assignedDoctors?.length ?? 0) > 0 && (
            <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white"><Stethoscope size={20} className="text-cyan-400" /> Enrolled Doctors</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {camp.assignedDoctors.map((doc: any) => (
                  <div key={doc._id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                      <User size={18} className="text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">Dr. {doc.firstName} {doc.lastName}</p>
                      <p className="text-xs text-gray-500">{doc.specialization}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inventory Overview */}
          {(camp.inventory?.length ?? 0) > 0 && (
            <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white"><Package size={20} className="text-cyan-400" /> Inventory Overview</h2>
              <div className="space-y-2">
                {camp.inventory.slice(0, 5).map((item: any) => (
                  <div key={item._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-sm">
                    <span className="font-medium text-gray-900 dark:text-white">{item.medicineName}</span>
                    <span className={`font-semibold ${item.quantity < 20 ? 'text-red-500' : item.quantity < 50 ? 'text-yellow-500' : 'text-green-500'}`}>{item.quantity} {item.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Booking Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 bg-white dark:bg-[#0d1f3c] rounded-2xl border border-gray-100 dark:border-white/10 p-6 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Book Appointment</h2>
            <form onSubmit={handleSubmit(data => bookMutation.mutate(data))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Select Date</label>
                <input
                  type="date"
                  min={camp.startDate?.split('T')[0]}
                  max={camp.endDate?.split('T')[0]}
                  {...register('date')}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl text-sm dark:text-white focus:outline-none focus:border-cyan-400"
                />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
              </div>

              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Time Slot</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {(slots.length ? slots : ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM']).map(slot => {
                      const isFull = false; // Would come from API
                      const selected = watch('timeSlot') === slot;
                      return (
                        <button key={slot} type="button" disabled={isFull} onClick={() => setValue('timeSlot', slot, { shouldValidate: true })}
                          className={`py-2 text-xs font-medium rounded-lg border transition-colors ${isFull ? 'bg-red-50 dark:bg-red-500/10 text-red-400 border-red-200 dark:border-red-500/20 cursor-not-allowed' : selected ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/20 hover:border-cyan-400'}`}>
                          {isFull ? 'FULL' : slot}
                        </button>
                      );
                    })}
                  </div>
                  {errors.timeSlot && <p className="text-red-500 text-xs mt-1">{errors.timeSlot.message}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes (Optional)</label>
                <textarea {...register('notes')} rows={2} placeholder="Any specific concerns..." className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl text-sm dark:text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 resize-none" />
              </div>

              <button type="submit" disabled={bookMutation.isPending || pct >= 100} className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                {bookMutation.isPending ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Booking...</>
                ) : pct >= 100 ? 'Camp Full' : 'Book Appointment'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
