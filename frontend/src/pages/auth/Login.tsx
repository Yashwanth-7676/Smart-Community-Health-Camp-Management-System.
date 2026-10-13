import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, Heart, LogIn, AlertCircle } from 'lucide-react';
import apiClient from '@/api/client';
import { LOCAL_STORAGE_KEYS } from '@/utils/constants';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});
type LoginForm = z.infer<typeof loginSchema>;

const DEMO_CREDENTIALS = [
  { role: 'Admin', email: 'admin@healthcamp.com', password: 'Admin@123' },
  { role: 'Doctor', email: 'doctor@healthcamp.com', password: 'Doctor@123' },
  { role: 'Patient', email: 'patient@healthcamp.com', password: 'Patient@123' },
  { role: 'Volunteer', email: 'volunteer@healthcamp.com', password: 'Volunteer@123' },
];

const ROLE_ROUTES: Record<string, string> = {
  admin: '/admin/dashboard',
  doctor: '/doctor/dashboard',
  patient: '/patient/dashboard',
  volunteer: '/volunteer/dashboard',
};

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const loginMutation = useMutation({
    mutationFn: (data: LoginForm) => apiClient.post('/auth/login', { email: data.email, password: data.password }).then(r => r.data.data),
    onSuccess: (data) => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN, data.accessToken);
      if (data.refreshToken) localStorage.setItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(data.user));
      toast.success(`Welcome back, ${data.user.firstName}!`);
      navigate(ROLE_ROUTES[data.user.role] ?? '/');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Login failed. Check your credentials.');
    },
  });

  const fillDemo = (cred: typeof DEMO_CREDENTIALS[0]) => {
    setValue('email', cred.email);
    setValue('password', cred.password);
  };

  const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
  const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0a1628] via-[#0d2a4a] to-[#0a1628] flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        
        {/* Floating circles */}
        {[...Array(5)].map((_, i) => (
          <motion.div key={i} animate={{ y: [0, -20, 0], x: [0, 10, 0] }} transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
            className="absolute rounded-full bg-cyan-500/10 border border-cyan-500/20"
            style={{ width: 60 + i * 40, height: 60 + i * 40, top: `${10 + i * 15}%`, left: `${5 + i * 10}%` }}
          />
        ))}

        <div className="relative z-10 text-center">
          <div className="w-24 h-24 bg-cyan-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-cyan-500/30">
            <Heart size={40} className="text-cyan-400" fill="currentColor" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4">Smart Health Camp</h1>
          <p className="text-gray-300 text-lg mb-8 max-w-sm">Empowering communities with accessible healthcare management</p>
          <div className="grid grid-cols-2 gap-3 text-left max-w-sm mx-auto">
            {['500+ Health Camps', '50K+ Patients', '200+ Doctors', '100+ Volunteers'].map(item => (
              <div key={item} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0" />
                <span className="text-sm text-gray-300 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-[#0a1628]">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="w-full max-w-md">
          <motion.div variants={fadeUp} className="text-center mb-8">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/20 lg:hidden">
              <Heart size={24} className="text-cyan-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Welcome back</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Sign in to your account</p>
          </motion.div>

          <motion.form variants={fadeUp} onSubmit={handleSubmit(data => loginMutation.mutate(data))} className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-8 shadow-lg space-y-5">
            {loginMutation.isError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
                <AlertCircle size={16} /> {(loginMutation.error as any)?.response?.data?.message ?? 'Login failed'}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" {...register('email')} placeholder="you@example.com" className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl text-sm dark:text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors" />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} {...register('password')} placeholder="••••••••" className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl text-sm dark:text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('rememberMe')} className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
              </label>
              <Link to="/auth/forgot-password" className="text-sm text-cyan-500 hover:text-cyan-400 font-medium">Forgot password?</Link>
            </div>

            <button type="submit" disabled={loginMutation.isPending} className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
              {loginMutation.isPending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><LogIn size={18} /> Sign In</>}
            </button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/auth/register" className="text-cyan-500 hover:text-cyan-400 font-semibold">Create one</Link>
            </p>
          </motion.form>

          {/* Demo Credentials */}
          <motion.div variants={fadeUp} className="mt-6 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Demo Credentials</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_CREDENTIALS.map(cred => (
                <button key={cred.role} type="button" onClick={() => fillDemo(cred)} className="text-left p-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl hover:border-cyan-400/50 hover:bg-cyan-50 dark:hover:bg-cyan-500/5 transition-all">
                  <p className="font-semibold text-xs text-cyan-500 mb-0.5">{cred.role}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{cred.email}</p>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
