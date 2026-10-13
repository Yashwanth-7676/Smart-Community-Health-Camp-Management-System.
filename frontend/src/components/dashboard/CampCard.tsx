import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, ChevronRight, Plus } from 'lucide-react';

type CampStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

interface Camp {
  id: string;
  name: string;
  location: string;
  address?: string;
  startDate: string;
  endDate: string;
  services: string[];
  currentPatients: number;
  capacity: number;
  status: CampStatus;
  imageUrl?: string;
}

interface CampCardProps {
  camp: Camp;
  onRegister?: (id: string) => void;
  onViewDetails?: (id: string) => void;
  darkMode?: boolean;
}

const STATUS_STYLES: Record<CampStatus, string> = {
  UPCOMING: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  ACTIVE: 'bg-green-500/15 text-green-400 border-green-500/30',
  COMPLETED: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const SERVICE_COLORS = [
  'bg-cyan-500/15 text-cyan-400',
  'bg-blue-500/15 text-blue-400',
  'bg-purple-500/15 text-purple-400',
];

const CampCard: React.FC<CampCardProps> = ({ camp, onRegister, onViewDetails, darkMode = false }) => {
  const utilization = Math.round((camp.currentPatients / camp.capacity) * 100);
  const visibleServices = camp.services.slice(0, 3);
  const hiddenCount = camp.services.length - 3;
  const canRegister = camp.status === 'UPCOMING' || camp.status === 'ACTIVE';

  const bg = darkMode
    ? 'bg-[#0f172a]/90 border-[#1e3a6e]/50'
    : 'bg-white border-slate-200';

  const progressColor =
    utilization > 85 ? 'bg-red-500' : utilization > 65 ? 'bg-yellow-400' : 'bg-cyan-400';

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(6,182,212,0.12)' }}
      transition={{ duration: 0.22 }}
      className={`rounded-2xl border ${bg} shadow-md overflow-hidden flex flex-col`}
    >
      {/* Image / Header gradient */}
      <div
        className="h-24 relative overflow-hidden"
        style={{
          background: camp.imageUrl
            ? `url(${camp.imageUrl}) center/cover no-repeat`
            : 'linear-gradient(135deg, #1e3a6e 0%, #0e7490 100%)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-3 right-3">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border backdrop-blur-sm ${STATUS_STYLES[camp.status]}`}>
            {camp.status}
          </span>
        </div>
      </div>

      <div className="flex-1 p-4">
        {/* Name */}
        <h3 className={`font-bold text-base leading-tight mb-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          {camp.name}
        </h3>

        {/* Location */}
        <div className={`flex items-start gap-1.5 mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          <MapPin size={13} className="text-cyan-400 mt-0.5 flex-shrink-0" />
          <span className="text-xs leading-tight">{camp.location}</span>
        </div>

        {/* Date */}
        <div className={`flex items-center gap-1.5 mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          <Calendar size={13} className="text-cyan-400" />
          <span className="text-xs">{camp.startDate} → {camp.endDate}</span>
        </div>

        {/* Services */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {visibleServices.map((svc, i) => (
            <span key={svc} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${SERVICE_COLORS[i % SERVICE_COLORS.length]}`}>
              {svc}
            </span>
          ))}
          {hiddenCount > 0 && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${darkMode ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
              +{hiddenCount} more
            </span>
          )}
        </div>

        {/* Capacity */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className={`flex items-center gap-1 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <Users size={11} />
              <span>{camp.currentPatients}/{camp.capacity} patients</span>
            </div>
            <span className={`text-xs font-semibold ${utilization > 85 ? 'text-red-400' : utilization > 65 ? 'text-yellow-400' : 'text-green-400'}`}>
              {utilization}%
            </span>
          </div>
          <div className={`h-1.5 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-100'} overflow-hidden`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(utilization, 100)}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className={`h-full rounded-full ${progressColor}`}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {canRegister && (
            <button
              onClick={() => onRegister?.(camp.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold transition-colors"
            >
              <Plus size={13} /> Register
            </button>
          )}
          <button
            onClick={() => onViewDetails?.(camp.id)}
            className={`flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-medium transition-colors border
              ${darkMode
                ? 'border-[#1e3a6e] text-slate-300 hover:bg-white/5'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'}
              ${!canRegister ? 'flex-1' : ''}`}
          >
            Details <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CampCard;
