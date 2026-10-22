// src/components/dashboard/PatientQueueCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Clock,
  Phone,
  Stethoscope,
  CheckCircle,
  SkipForward,
  PhoneCall,
  Droplets,
  User,
} from 'lucide-react';

export interface QueueItem {
  id: string;
  tokenNumber: number | string;
  patientName: string;
  phone?: string;
  service?: string;
  timeSlot: string;
  status: 'WAITING' | 'CALLED' | 'COMPLETED' | 'SKIPPED';
  age?: number | string;
  bloodGroup?: string;
}

interface PatientQueueCardProps {
  item: QueueItem;
  onCall?: (id: string) => void;
  onComplete?: (id: string) => void;
  onSkip?: (id: string) => void;
  isDoctorView?: boolean;
}

const STATUS_BADGE_VARIANT: Record<string, 'primary' | 'success' | 'danger' | 'warning'> = {
  CALLED: 'primary',
  COMPLETED: 'success',
  SKIPPED: 'danger',
  WAITING: 'warning',
};

const STATUS_LABEL: Record<string, string> = {
  WAITING: '⏳ Waiting',
  CALLED: '📣 Called',
  COMPLETED: '✅ Done',
  SKIPPED: '⏭ Skipped',
};

const isPulsingStatus = (status: string) => status === 'WAITING' || status === 'CALLED';

export const PatientQueueCard: React.FC<PatientQueueCardProps> = ({
  item,
  onCall,
  onComplete,
  onSkip,
  isDoctorView = false,
}) => {
  const badgeVariant = STATUS_BADGE_VARIANT[item.status] ?? 'warning';
  const pulsing = isPulsingStatus(item.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card hover className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: token + info */}
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Token circle */}
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-300 flex flex-col items-center justify-center font-bold shadow-sm">
              <span className="text-[10px] uppercase font-semibold text-cyan-500">Token</span>
              <span className="text-base leading-none">#{item.tokenNumber}</span>
            </div>
            {pulsing && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {item.patientName}
              </h4>
              <Badge variant={badgeVariant} size="sm">
                {STATUS_LABEL[item.status] ?? item.status}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
              {item.timeSlot && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {item.timeSlot}
                </span>
              )}
              {item.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {item.phone}
                </span>
              )}
              {item.age !== undefined && item.age !== null && String(item.age).trim() !== '' && (
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {item.age} yrs
                </span>
              )}
              {item.bloodGroup && (
                <span className="flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-500 dark:text-rose-400 font-semibold">{item.bloodGroup}</span>
                </span>
              )}
              {item.service && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px]">
                  {item.service}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
          {isDoctorView ? (
            // Doctor view: Call Patient | Start Checkup | Skip — shown based on status
            <>
              {item.status === 'WAITING' && onCall && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCall(item.id)}
                  className="border-cyan-500/50 text-cyan-600 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-xs"
                  leftIcon={<PhoneCall className="w-3.5 h-3.5" />}
                >
                  Call
                </Button>
              )}
              {(item.status === 'WAITING' || item.status === 'CALLED') && onComplete && (
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-emerald-600 hover:bg-emerald-500 text-xs"
                  onClick={() => onComplete(item.id)}
                  leftIcon={<Stethoscope className="w-3.5 h-3.5" />}
                >
                  Start Checkup
                </Button>
              )}
              {item.status === 'WAITING' && onSkip && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSkip(item.id)}
                  className="text-xs text-slate-500"
                  leftIcon={<SkipForward className="w-3.5 h-3.5" />}
                >
                  Skip
                </Button>
              )}
            </>
          ) : (
            // Volunteer view
            <>
              {item.status === 'WAITING' && onCall && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onCall(item.id)}
                  leftIcon={<Stethoscope className="w-3.5 h-3.5" />}
                >
                  Call Next
                </Button>
              )}
              {item.status === 'CALLED' && onComplete && (
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-emerald-600 hover:bg-emerald-500"
                  onClick={() => onComplete(item.id)}
                  leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                >
                  Done
                </Button>
              )}
              {item.status === 'WAITING' && onSkip && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSkip(item.id)}
                  leftIcon={<SkipForward className="w-3.5 h-3.5" />}
                >
                  Skip
                </Button>
              )}
            </>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default PatientQueueCard;
