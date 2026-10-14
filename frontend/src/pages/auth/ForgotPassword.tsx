import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/api/client';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{ token: string; email: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema) });

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/password-reset/request', { email: data.email });
      const devToken = response?.data?.data?.devToken;
      if (devToken) {
        setTokenInfo({ token: devToken, email: data.email });
        toast.success('Reset token generated! (Dev mode preview available below)');
      } else {
        toast.success(response?.data?.message || 'Password reset link sent to your email.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to process password reset request.');
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
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">Reset Your Password</h1>
          <p className="text-slate-400 text-sm mt-2">
            Enter your registered email address and we will provide an expiring reset token.
          </p>
        </div>

        {tokenInfo ? (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-100 text-sm space-y-3">
              <div className="flex items-center gap-2 font-semibold text-cyan-300">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" /> Reset Token Generated
              </div>
              <p>For development testing, you can proceed directly to reset password with your token:</p>
              <div className="p-2.5 rounded-lg bg-black/40 font-mono text-xs break-all text-cyan-200 select-all border border-cyan-500/20">
                {tokenInfo.token}
              </div>
            </div>

            <Link
              to={`/reset-password?token=${tokenInfo.token}`}
              className="w-full py-3 px-4 rounded-xl font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-900 flex items-center justify-center transition-all shadow-lg shadow-cyan-500/25"
            >
              Continue to Set New Password
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Registered Email</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-900 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Send Reset Instructions'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center border-t border-slate-700/60 pt-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

