import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Eye, EyeOff, User, Mail, Phone, Lock, Upload, CheckCircle,
  ChevronRight, ChevronLeft, Heart, AlertCircle, WifiOff
} from 'lucide-react';
import apiClient from '@/api/client';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  firstName: z.string().min(2, 'At least 2 characters'),
  lastName: z.string().min(2, 'At least 2 characters'),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^\+?[0-9]{10,13}$/, 'Invalid phone number'),
  role: z.enum(['patient', 'doctor', 'volunteer']),
});

const step2Schema = z.object({
  password: z.string().min(8, 'At least 8 characters').regex(/[A-Z]/, 'Need one uppercase').regex(/[0-9]/, 'Need one number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

const step3Schema = z.object({
  // Patient
  dateOfBirth: z.string().optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', '']).optional(),
  // Doctor
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  // Volunteer
  skills: z.string().optional(),
});

type Step1 = z.infer<typeof step1Schema>;
type Step2 = z.infer<typeof step2Schema>;
type Step3 = z.infer<typeof step3Schema>;

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const SPECIALIZATIONS = ['General Physician', 'Dentist', 'Ophthalmologist', 'Pediatrician', 'Gynecologist', 'Psychiatrist', 'Cardiologist', 'Dermatologist'];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1 | null>(null);
  const [step2Data, setStep2Data] = useState<Step2 | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [offlineQueued, setOfflineQueued] = useState(false);

  const form1 = useForm<Step1>({ resolver: zodResolver(step1Schema), defaultValues: { role: 'patient' } });
  const form2 = useForm<Step2>({ resolver: zodResolver(step2Schema) });
  const form3 = useForm<Step3>({ resolver: zodResolver(step3Schema) });

  const registerMutation = useMutation({
    mutationFn: (formData: FormData) => apiClient.post('/auth/register', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
    onSuccess: () => {
      setRegistrationSuccess(true);
    },
    onError: (err: any) => {
      if (!navigator.onLine) {
        // Store in localStorage for offline sync
        const pending = JSON.parse(localStorage.getItem('pendingRegistrations') ?? '[]');
        pending.push({ ...step1Data, ...step2Data, ...form3.getValues(), timestamp: new Date().toISOString() });
        localStorage.setItem('pendingRegistrations', JSON.stringify(pending));
        setOfflineQueued(true);
      } else {
        toast.error(err?.response?.data?.message ?? 'Registration failed.');
      }
    },
  });

  const handleStep1 = (data: Step1) => { setStep1Data(data); setStep(2); };
  const handleStep2 = (data: Step2) => { setStep2Data(data); setStep(3); };
  const handleStep3 = (data: Step3) => {
    if (!step1Data || !step2Data) return;
    const fd = new FormData();
    Object.entries(step1Data).forEach(([k, v]) => fd.append(k, v));
    fd.append('password', step2Data.password);
    Object.entries(data).forEach(([k, v]) => { if (v) fd.append(k, v as string); });
    if (photoFile) fd.append('profilePhoto', photoFile);
    registerMutation.mutate(fd);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const inputCls = "w-full px-3.5 py-3 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl text-sm dark:text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors";
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  if (registrationSuccess || offlineQueued) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-[#0a1628]">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full text-center bg-white dark:bg-[#0d1f3c] rounded-3xl p-10 shadow-xl border border-gray-100 dark:border-white/10">
        {offlineQueued ? (
          <>
            <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <WifiOff size={36} className="text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Saved Offline</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">You're offline. Your registration has been saved locally and will sync when you reconnect.</p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={36} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Registration Successful!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Your account has been created. Please login to continue.</p>
          </>
        )}
        <Link to="/auth/login" className="inline-block px-8 py-3 bg-cyan-500 text-white font-bold rounded-xl hover:bg-cyan-400 transition-colors">Go to Login</Link>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1628] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
            <Heart size={24} className="text-cyan-500" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Create Account</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Join our health community</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <div className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold border-2 transition-all ${s < step ? 'bg-cyan-500 border-cyan-500 text-white' : s === step ? 'border-cyan-500 text-cyan-500' : 'border-gray-200 dark:border-white/20 text-gray-400'}`}>
                {s < step ? <CheckCircle size={18} /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 transition-all ${s < step ? 'bg-cyan-500' : 'bg-gray-200 dark:bg-white/20'}`} />}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-6 -mt-4">
          <span>Personal Info</span>
          <span>Password</span>
          <span>Role Details</span>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <form onSubmit={form1.handleSubmit(handleStep1)} className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-8 shadow-lg space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>First Name</label>
                    <div className="relative"><User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input {...form1.register('firstName')} placeholder="John" className={inputCls + ' pl-9'} /></div>
                    {form1.formState.errors.firstName && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Last Name</label>
                    <input {...form1.register('lastName')} placeholder="Doe" className={inputCls} />
                    {form1.formState.errors.lastName && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.lastName.message}</p>}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Email Address</label>
                  <div className="relative"><Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input type="email" {...form1.register('email')} placeholder="you@example.com" className={inputCls + ' pl-9'} /></div>
                  {form1.formState.errors.email && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.email.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Phone Number</label>
                  <div className="relative"><Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input {...form1.register('phone')} placeholder="+91 9876543210" className={inputCls + ' pl-9'} /></div>
                  {form1.formState.errors.phone && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.phone.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>I am a</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['patient', 'doctor', 'volunteer'] as const).map(role => (
                      <label key={role} className={`cursor-pointer p-3 rounded-xl border-2 text-center text-sm font-medium transition-all ${form1.watch('role') === role ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' : 'border-gray-200 dark:border-white/20 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}>
                        <input type="radio" value={role} {...form1.register('role')} className="sr-only" />
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
                <button type="submit" className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                  Next <ChevronRight size={18} />
                </button>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <form onSubmit={form2.handleSubmit(handleStep2)} className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-8 shadow-lg space-y-4">
                <div>
                  <label className={labelCls}>Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type={showPassword ? 'text' : 'password'} {...form2.register('password')} placeholder="Min 8 chars, 1 upper, 1 number" className={inputCls + ' pl-9 pr-10'} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                  {form2.formState.errors.password && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.password.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Confirm Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type={showConfirm ? 'text' : 'password'} {...form2.register('confirmPassword')} placeholder="Re-enter password" className={inputCls + ' pl-9 pr-10'} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                  {form2.formState.errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.confirmPassword.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Profile Photo (Optional)</label>
                  <label className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 dark:border-white/20 rounded-xl cursor-pointer hover:border-cyan-400 transition-colors">
                    {photoPreview ? <img src={photoPreview} alt="Preview" className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center"><Upload size={20} className="text-gray-400" /></div>}
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{photoFile ? photoFile.name : 'Click to upload photo'}</p>
                      <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="sr-only" />
                  </label>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-200 dark:border-white/20 text-gray-600 dark:text-gray-400 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button type="submit" className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <form onSubmit={form3.handleSubmit(handleStep3)} className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-8 shadow-lg space-y-4">
                {/* Summary */}
                <div className="flex items-center gap-3 p-4 bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 rounded-xl mb-2">
                  {photoPreview ? <img src={photoPreview} className="w-10 h-10 rounded-full object-cover" alt="Profile" /> : <div className="w-10 h-10 bg-cyan-200 dark:bg-cyan-700 rounded-full flex items-center justify-center text-cyan-700 dark:text-cyan-200 font-bold text-sm">{step1Data?.firstName[0]}{step1Data?.lastName[0]}</div>}
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{step1Data?.firstName} {step1Data?.lastName}</p>
                    <p className="text-xs text-cyan-600 dark:text-cyan-400 capitalize">{step1Data?.role} · {step1Data?.email}</p>
                  </div>
                </div>

                {step1Data?.role === 'patient' && (
                  <>
                    <div>
                      <label className={labelCls}>Date of Birth</label>
                      <input type="date" {...form3.register('dateOfBirth')} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Blood Group</label>
                      <select {...form3.register('bloodGroup')} className={inputCls}>
                        <option value="">Select blood group</option>
                        {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {step1Data?.role === 'doctor' && (
                  <>
                    <div>
                      <label className={labelCls}>Specialization</label>
                      <select {...form3.register('specialization')} className={inputCls}>
                        <option value="">Select specialization</option>
                        {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Medical License Number</label>
                      <input {...form3.register('licenseNumber')} placeholder="e.g. MCI/12345" className={inputCls} />
                    </div>
                  </>
                )}

                {step1Data?.role === 'volunteer' && (
                  <div>
                    <label className={labelCls}>Skills / Expertise</label>
                    <textarea {...form3.register('skills')} rows={3} placeholder="e.g. First Aid, Patient Registration, Health Awareness..." className={inputCls + ' resize-none'} />
                  </div>
                )}

                {registerMutation.isError && !offlineQueued && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle size={16} /> {(registerMutation.error as any)?.response?.data?.message ?? 'Registration failed.'}
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="flex-1 py-3 border border-gray-200 dark:border-white/20 text-gray-600 dark:text-gray-400 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button type="submit" disabled={registerMutation.isPending} className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                    {registerMutation.isPending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-cyan-500 hover:text-cyan-400 font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
