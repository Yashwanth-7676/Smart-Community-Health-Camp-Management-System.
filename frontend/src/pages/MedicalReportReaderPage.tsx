// frontend/src/pages/MedicalReportReaderPage.tsx
import React from 'react';
import MedicalReportReader from '@/components/reports/MedicalReportReader';
import { FileText, Shield, Sparkles } from 'lucide-react';

export const MedicalReportReaderPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800 text-cyan-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Intelligent Document Intake</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl flex items-center gap-3">
              Medical Report Reader
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-2xl leading-relaxed">
              Upload PDF laboratory reports, discharge summaries, or photo scans.
              Extract health observations, review flagged uncertain readings, and explain clinical terms in plain language.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong className="text-slate-200">DPDP Compliant:</strong> Clinician review & consent required
              </span>
            </div>
          </div>
        </div>

        {/* Report Reader Core Component */}
        <MedicalReportReader />
      </div>
    </div>
  );
};

export default MedicalReportReaderPage;
