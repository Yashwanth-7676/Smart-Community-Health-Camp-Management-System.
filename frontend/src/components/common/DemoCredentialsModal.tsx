// src/components/common/DemoCredentialsModal.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  Stethoscope,
  HeartHandshake,
  User,
  LogIn,
  CheckCircle2,
  Copy,
  Sparkles,
  Info,
} from 'lucide-react';

interface DemoAccount {
  role: 'admin' | 'doctor' | 'volunteer' | 'patient';
  title: string;
  email: string;
  pass: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  dashboardPath: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'admin',
    title: 'Administrator',
    email: 'admin@healthcamp.com',
    pass: 'Admin@123',
    badge: 'Full Governance',
    icon: ShieldCheck,
    description: 'Camp creation, staff deployment, pharmacy inventory, DPDP consent & audit trails.',
    dashboardPath: '/admin/dashboard',
  },
  {
    role: 'doctor',
    title: 'Chief Physician',
    email: 'doctor1@healthcamp.com',
    pass: 'Doctor@123',
    badge: 'Clinical Care',
    icon: Stethoscope,
    description: 'Real-time patient call queue, vitals entry, observations & official PDF reports.',
    dashboardPath: '/doctor/dashboard',
  },
  {
    role: 'volunteer',
    title: 'Camp Volunteer',
    email: 'volunteer1@healthcamp.com',
    pass: 'Volunteer@123',
    badge: 'Venue Operations',
    icon: HeartHandshake,
    description: 'Contactless QR token scanning, queue status check-in & offline draft sync.',
    dashboardPath: '/volunteer/dashboard',
  },
  {
    role: 'patient',
    title: 'Community Patient',
    email: 'patient1@healthcamp.com',
    pass: 'Patient@123',
    badge: 'Smart Pass',
    icon: User,
    description: 'Slot booking, digital queue token with QR pass, and authorized report download.',
    dashboardPath: '/patient/dashboard',
  },
];

interface DemoCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoCredentialsModal: React.FC<DemoCredentialsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const handleQuickLogin = async (account: DemoAccount) => {
    try {
      setLoadingRole(account.role);
      await login(account.email, account.pass);
      onClose();
      navigate(account.dashboardPath);
    } catch {
      toast.error(`Unable to auto-authenticate as ${account.title}`);
    } finally {
      setLoadingRole(null);
    }
  };

  const copyCreds = (email: string, pass: string) => {
    navigator.clipboard.writeText(`Email: ${email}\nPassword: ${pass}`);
    toast.success('Credentials copied to clipboard');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Evaluation & Presentation Demo Mode
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              Pre-configured fictional roles for live college examination & demonstration
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200/80 dark:border-cyan-800/60 text-xs text-slate-700 dark:text-slate-300">
          <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
          <span>
            <strong>Safe Demo Environment:</strong> All patients, medical reports, and camps shown in demo mode use fictional demonstration records. Click <strong>Switch Role</strong> to sign in immediately without typing.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {DEMO_ACCOUNTS.map((account) => {
            const Icon = account.icon;
            const isLoadingThis = loadingRole === account.role;

            return (
              <div
                key={account.role}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {account.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                      {account.badge}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                    {account.description}
                  </p>

                  <div className="bg-white dark:bg-slate-950/70 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-[11px] space-y-1 mb-3">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span className="font-mono truncate">{account.email}</span>
                      <button
                        onClick={() => copyCreds(account.email, account.pass)}
                        title="Copy credentials"
                        className="text-slate-400 hover:text-cyan-500 transition-colors p-0.5"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-slate-400 font-mono text-[10px]">
                      Pass: <span className="text-slate-700 dark:text-slate-300 font-bold">{account.pass}</span>
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  className="w-full text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white"
                  isLoading={isLoadingThis}
                  onClick={() => handleQuickLogin(account)}
                  leftIcon={<LogIn className="w-3.5 h-3.5" />}
                >
                  {isLoadingThis ? 'Signing in...' : `Switch to ${account.title}`}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

export default DemoCredentialsModal;
