// src/components/common/QueueToken.tsx
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Printer, Calendar, Clock, MapPin, User, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface QueueTokenProps {
  tokenNumber: string | number;
  campName: string;
  campLocation: string;
  patientName: string;
  date: string;
  timeSlot: string;
  service?: string;
  className?: string;
}

export const QueueToken: React.FC<QueueTokenProps> = ({
  tokenNumber,
  campName,
  campLocation,
  patientName,
  date,
  timeSlot,
  service,
  className = '',
}) => {
  const tokenRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`max-w-md mx-auto ${className}`}
    >
      <div
        ref={tokenRef}
        className="print-token bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border-2 border-dashed border-cyan-500/40 rounded-3xl p-6 shadow-xl relative overflow-hidden text-center"
      >
        {/* Header Ribbon */}
        <div className="text-xs uppercase tracking-widest font-bold text-cyan-600 dark:text-cyan-400 mb-1">
          Smart Community Health Camp
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Official Queue Pass
        </h3>

        {/* Large Token Number Badge */}
        <div className="my-5 py-4 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl shadow-lg shadow-cyan-500/20">
          <div className="text-xs font-medium uppercase tracking-wider text-cyan-100 mb-0.5">
            Token Number
          </div>
          <div className="text-4xl sm:text-5xl font-black tracking-tight">
            #{tokenNumber}
          </div>
          {service && (
            <div className="mt-1 text-xs text-cyan-100 font-medium">
              {service}
            </div>
          )}
        </div>

        {/* Details Grid */}
        <div className="space-y-2.5 text-left text-xs bg-slate-100/70 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/80 mb-5">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <User className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">Patient:</span>
            <span className="truncate">{patientName}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">Camp:</span>
            <span className="truncate">{campName} ({campLocation})</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">Date:</span>
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">Slot:</span>
            <span>{timeSlot}</span>
          </div>
        </div>

        {/* QR Code / Barcode Simulation */}
        <div className="flex items-center justify-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <QrCode className="w-8 h-8 text-slate-700 dark:text-slate-300" />
          <div className="text-[11px] text-slate-500 dark:text-slate-400 text-left">
            Present this token at registration counter for priority check-in.
          </div>
        </div>
      </div>

      {/* Print Button (Hidden during print) */}
      <div className="mt-4 flex justify-center print:hidden">
        <Button
          onClick={handlePrint}
          variant="outline"
          size="sm"
          leftIcon={<Printer className="w-4 h-4" />}
        >
          Print Token
        </Button>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-token, .print-token * {
            visibility: visible;
          }
          .print-token {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: 2px solid black;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default QueueToken;

