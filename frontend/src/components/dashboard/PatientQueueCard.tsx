// src/components/dashboard/PatientQueueCard.tsx
import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Clock, Phone, Stethoscope, CheckCircle, SkipForward } from 'lucide-react';

export interface QueueItem {
  id: string;
  tokenNumber: number | string;
  patientName: string;
  phone?: string;
  service?: string;
  timeSlot: string;
  status: 'WAITING' | 'CALLED' | 'COMPLETED' | 'SKIPPED';
}

interface PatientQueueCardProps {
  item: QueueItem;
  onCall?: (id: string) => void;
  onComplete?: (id: string) => void;
  onSkip?: (id: string) => void;
  isDoctorView?: boolean;
}

export const PatientQueueCard: React.FC<PatientQueueCardProps> = ({
  item,
  onCall,
  onComplete,
  onSkip,
  isDoctorView = false,
}) => {
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'CALLED':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      case 'SKIPPED':
        return 'danger';
      default:
        return 'warning';
    }
  };

  return (
    <Card hover className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        {/* Token number circle */}
        <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-300 flex flex-col items-center justify-center font-bold shadow-sm shrink-0">
          <span className="text-[10px] uppercase font-semibold text-cyan-500">Token</span>
          <span className="text-base leading-none">#{item.tokenNumber}</span>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {item.patientName}
            </h4>
            <Badge variant={getBadgeVariant(item.status)} size="sm">
              {item.status}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {item.timeSlot}
            </span>
            {item.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {item.phone}
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
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
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
            {isDoctorView ? 'Start Checkup' : 'Done'}
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
      </div>
    </Card>
  );
};

export default PatientQueueCard;

