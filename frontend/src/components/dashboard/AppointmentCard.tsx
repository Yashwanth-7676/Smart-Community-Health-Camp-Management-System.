import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, User, Stethoscope, ChevronDown, ChevronUp, X, Eye } from 'lucide-react';

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

interface AppointmentCardProps {
  id: string;
  patientName: string;
  doctorName: string;
  campName: string;
  date: string;
  timeSlot: string;
  queueToken: number;
  status: AppointmentStatus;
  service?: string;
  onCancel?: (id: string) => void;
  onViewDetails?: (id: string) => void;
  darkMode?: boolean;
}

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  CONFIRMED: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  COMPLETED: 'bg-green-500/15 text-green-400 border-green-500/30',
  CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  id,
  patientName,
  doctorName,
  campName,
  date,
  timeSlot,
  queueToken,
  status,
  service = 'General Medicine',
  onCancel,
  onViewDetails,
  darkMode = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  const bg = darkMode
    ? 'bg-[#0f172a]/90 border-[#1e3a6e]/50 backdrop-blur-sm'
    : 'bg-white border-slate-200';

  const canCancel = status === 'PENDING' || status === 'CONFIRMED';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className={`rounded-xl border ${bg} shadow-sm overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          {/* Token Badge */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
            <span className="text-cyan-400 text-sm font-bold">#{queueToken}</span>
          </div>
          <div>
            <p className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              {patientName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Stethoscope size={11} className="text-cyan-400" />
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Dr. {doctorName}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[status]}`}>
            {status}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className={`p-1 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Summary row */}
      <div className={`flex items-center gap-4 px-4 pb-3 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        <span className="flex items-center gap-1">
          <Calendar size={11} /> {date}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={11} /> {timeSlot}
        </span>
        <span className="flex items-center gap-1 truncate">
          <MapPin size={11} /> {campName}
        </span>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className={`px-4 py-3 border-t ${darkMode ? 'border-[#1e3a6e]/40 bg-white/2' : 'border-slate-100 bg-slate-50'}`}>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { label: 'Service', value: service, icon: Stethoscope },
                  { label: 'Queue Token', value: `#${queueToken}`, icon: User },
                  { label: 'Doctor', value: `Dr. ${doctorName}`, icon: Stethoscope },
                  { label: 'Camp', value: campName, icon: MapPin },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label}>
                    <p className={`text-[10px] uppercase tracking-wide mb-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
                    <div className="flex items-center gap-1">
                      <Icon size={11} className="text-cyan-400" />
                      <p className={`text-xs font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'} truncate`}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onViewDetails?.(id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 text-xs font-medium transition-colors"
                >
                  <Eye size={13} /> View Details
                </button>
                {canCancel && (
                  <button
                    onClick={() => onCancel?.(id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 text-xs font-medium transition-colors"
                  >
                    <X size={13} /> Cancel
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export { AppointmentCard };
export default AppointmentCard;
