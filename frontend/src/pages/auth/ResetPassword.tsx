import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/api/client';

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase, and a number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });

  const onSubmit = async (data: ResetForm) => {
    if (!token) {
      toast.error('Missing password reset token. Please request a new link.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/password-reset/reset', {
        token,
        newPassword: data.password,
      });
      setIsSuccess(true);
      toast.success('Password successfully reset!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid or expired reset token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 pt-20">
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/20 via-slate-900 to-blue-900/20 -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl border border-slate-700/80 p-8 rounded-3xl shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">Choose New Password</h1>
          <p className="text-slate-400 text-sm mt-2">Create a secure password to access your health camp account.</p>
        </div>

        {isSuccess ? (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Password Updated!</h2>
              <p className="text-slate-300 text-sm mt-1">Your new password is now active. Please sign in to continue.</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 px-4 rounded-xl font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-900 flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/25"
            >
              Sign In to Your Account <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  className="w-full pl-4 pr-11 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm New Password</label>
              <input
                {...register('confirmPassword')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              {errors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-900 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center border-t border-slate-700/60 pt-6">
          <Link to="/login" className="text-sm text-cyan-400 hover:underline">
            Remember your credentials? Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

