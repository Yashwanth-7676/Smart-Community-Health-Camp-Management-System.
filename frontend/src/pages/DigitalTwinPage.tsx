// frontend/src/pages/DigitalTwinPage.tsx
import React from 'react';
import CommunityDigitalTwin from '@/components/3d/CommunityDigitalTwin';
import { Shield, Sparkles, Database, Layers } from 'lucide-react';

export const DigitalTwinPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800 text-cyan-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Community Health Intelligence</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Regional Health Digital Twin
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-2xl leading-relaxed">
              Explore 3D spatial health representations aggregated across rural and urban community outreach clinics.
              Leverage predictive scenario modeling to optimize medical staff allocation and stock readiness.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong className="text-slate-200">Zero Patient PII:</strong> Aggregated clusters only (N &ge; 10)
              </span>
            </div>
          </div>
        </div>

        {/* 3D Community Digital Twin Canvas & Inspector */}
        <CommunityDigitalTwin />

        {/* Methodology & Safety Explanations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Layers className="w-4 h-4" />
              <span>Multi-Source Cluster Aggregation</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Screening outcomes, blood pressure trends, glucose indicators, and demographic turnout are combined from verified camp records.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <Database className="w-4 h-4" />
              <span>Historical vs Predictive Distinction</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Past completed camps are categorized as historical actuals. Forward projections use Poisson rural regression labeled with explicit confidence intervals.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Shield className="w-4 h-4" />
              <span>DPDP Privacy Guarantee</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              No individual names, phone numbers, or individual patient records are queryable or rendered on public spatial twins.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalTwinPage;
