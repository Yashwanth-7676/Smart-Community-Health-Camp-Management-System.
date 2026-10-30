// frontend/src/components/maps/AdminGISCreatorModal.tsx
import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  Stethoscope,
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
  Building2,
  Navigation,
} from 'lucide-react';
import { KARNATAKA_DISTRICTS_DATA } from './karnatakaDistrictsData';
import { VERIFIED_HEALTHCARE_FACILITIES } from './healthcareFacilities';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

interface AdminGISCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  clickedCoords: [number, number] | null; // [latitude, longitude]
  onCampCreated: (newCamp: any) => void;
}

const COMMON_SERVICES = [
  'General Medicine',
  'Hypertension & Cardiac Consult',
  'Diabetes Screening (HbA1c & RBS)',
  'Ophthalmology & Vision Testing',
  'Pediatrics & Child Immunization',
  'Dental Screening',
  'Maternal & Women Health',
  'Orthopedic Screening',
  'Dermatology Consult',
];

export const AdminGISCreatorModal: React.FC<AdminGISCreatorModalProps> = ({
  isOpen,
  onClose,
  clickedCoords,
  onCampCreated,
}) => {
  const [name, setName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number>(12.9716);
  const [longitude, setLongitude] = useState<number>(77.5946);
  const [closestDistrict, setClosestDistrict] = useState('Bengaluru Urban');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [capacity, setCapacity] = useState(150);
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'General Medicine',
    'Diabetes Screening (HbA1c & RBS)',
    'Hypertension & Cardiac Consult',
  ]);
  const [coverageRadiusKm, setCoverageRadiusKm] = useState<number>(15);
  const [referralHospital, setReferralHospital] = useState('Victoria Hospital & BMCRI');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill coordinates and closest district when clickedCoords changes
  useEffect(() => {
    if (clickedCoords) {
      const [lat, lng] = clickedCoords;
      setLatitude(parseFloat(lat.toFixed(4)));
      setLongitude(parseFloat(lng.toFixed(4)));

      // Find closest district in Karnataka
      let closest = KARNATAKA_DISTRICTS_DATA[0];
      let minDistance = Infinity;

      KARNATAKA_DISTRICTS_DATA.forEach((d) => {
        const dLat = d.latitude - lat;
        const dLng = d.longitude - lng;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        if (dist < minDistance) {
          minDistance = dist;
          closest = d;
        }
      });

      setClosestDistrict(closest.name);
      setLocationName(`${closest.name} Community Sector`);
      setAddress(`Near Taluk Administrative Complex, ${closest.name}, Karnataka`);
      setReferralHospital(closest.nearestTertiaryCollege || 'Victoria Hospital & BMCRI');

      // Default future dates: Next Saturday
      const nextSat = new Date();
      nextSat.setDate(nextSat.getDate() + ((6 - nextSat.getDay() + 7) % 7 || 7));
      nextSat.setHours(9, 0, 0, 0);
      setStartDate(nextSat.toISOString().slice(0, 16));

      const nextSatEnd = new Date(nextSat);
      nextSatEnd.setHours(17, 0, 0, 0);
      setEndDate(nextSatEnd.toISOString().slice(0, 16));
    }
  }, [clickedCoords]);

  if (!isOpen) return null;

  const handleToggleService = (srv: string) => {
    setSelectedServices((prev) =>
      prev.includes(srv) ? prev.filter((s) => s !== srv) : [...prev, srv]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Camp name is required');
      return;
    }
    if (selectedServices.length === 0) {
      toast.error('Please select at least one healthcare service');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Registering camp with geospatial validation...');

    try {
      const payload = {
        name,
        location: locationName,
        address,
        latitude,
        longitude,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        capacity: Number(capacity),
        services: selectedServices,
        description:
          description ||
          `Specialized community health camp organized under Karnataka Smart Digital Twin initiative in ${closestDistrict}. Connected to ${referralHospital} emergency corridor.`,
        isFree: true,
      };

      const res = await apiClient.post('/camps', payload);
      const createdCamp = res.data?.data || res.data;

      toast.success('Geospatial health camp established and placed in 3D Digital Twin!', { id: toastId });
      onCampCreated(createdCamp);
      onClose();
    } catch (err: any) {
      // If API requires admin auth or returns error, provide clear guidance
      const msg = err.response?.data?.message || err.message || 'Failed to create camp';
      toast.error(`Camp creation failed: ${msg}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-700/60 text-cyan-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">Administrator GIS Camp Deployer</h3>
              <p className="text-xs text-slate-400">
                Deploying at GPS [{latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E] in {closestDistrict}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-200">
          {/* Coordinates and District Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-cyan-900/40">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Detected District</span>
              <div className="text-sm font-bold text-cyan-400 mt-0.5">{closestDistrict}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Latitude</span>
              <div className="text-sm font-mono text-slate-200 mt-0.5">{latitude}° N</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Longitude</span>
              <div className="text-sm font-mono text-slate-200 mt-0.5">{longitude}° E</div>
            </div>
          </div>

          {/* Camp Name */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Camp Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sedam Rural Multispecialty Health Drive"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Location and Venue Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Venue / Location Name *</label>
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Taluk Community Hall"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Full Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Main Bazar Road, Near Bus Stand"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Dates & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Start Date & Time</span>
              </label>
              <input
                type="datetime-local"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>End Date & Time</span>
              </label>
              <input
                type="datetime-local"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Patient Capacity</span>
              </label>
              <input
                type="number"
                min="10"
                max="2000"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Emergency Referral Hospital */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-red-400" />
              <span>Designated Tertiary Referral Hospital</span>
            </label>
            <select
              value={referralHospital}
              onChange={(e) => setReferralHospital(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            >
              {VERIFIED_HEALTHCARE_FACILITIES.filter((f) => f.type === 'HOSPITAL').map((h) => (
                <option key={h.id} value={h.name}>
                  {h.name} ({h.district})
                </option>
              ))}
            </select>
          </div>

          {/* Services Checklist */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
              <span>Healthcare Services Provided ({selectedServices.length} selected)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              {COMMON_SERVICES.map((srv) => {
                const isChecked = selectedServices.includes(srv);
                return (
                  <button
                    type="button"
                    key={srv}
                    onClick={() => handleToggleService(srv)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${
                      isChecked
                        ? 'bg-cyan-950/80 border border-cyan-600 text-cyan-200 font-semibold'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                        isChecked ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-600'
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{srv}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Coverage Radius & Visual Indicator */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300">Target Coverage Radius</label>
              <span className="text-cyan-400 font-bold">{coverageRadiusKm} km</span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              step="5"
              value={coverageRadiusKm}
              onChange={(e) => setCoverageRadiusKm(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>5 km (Local Taluk)</span>
              <span>15 km (Multi-Gram Panchayat)</span>
              <span>40 km (District Corridor)</span>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Deploying...' : 'Deploy Camp into Digital Twin'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminGISCreatorModal;
