// frontend/src/pages/HealthEducationPage.tsx
import React from 'react';
import { AnatomyEducationScene } from '@/components/3d/AnatomyEducationScene';
import { BookOpen, ShieldCheck, HeartPulse, Sparkles, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HealthEducationPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fade-in text-white">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs font-mono font-medium">
          <Sparkles className="w-3.5 h-3.5 text-primary-400" />
          <span>INTERACTIVE 3D COMMUNITY HEALTH LITERACY</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Explore Human Physiology & Preventive Health
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Interactive educational models designed to empower patients, students, and community members with physiological understanding of vital organ systems and early warning symptoms.
        </p>
      </div>

      {/* Main 3D Anatomy Visualizer Scene */}
      <AnatomyEducationScene />

      {/* Educational Quick Reference Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="bg-navy-900/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mb-3">
            <HeartPulse className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-1.5">Cardiovascular Health</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            High blood pressure is often symptomless until advanced stages. Regular BP checks at camps detect early hypertensive stress.
          </p>
          <Link
            to="/camps"
            className="text-xs font-semibold text-primary-400 hover:text-primary-300 inline-flex items-center gap-1"
          >
            Find a screening camp <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-navy-900/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-1.5">Respiratory Wellness</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Protecting lung capacity starts with reducing indoor biomass smoke, stopping tobacco use, and monitoring persistent dry coughs.
          </p>
          <Link
            to="/awareness"
            className="text-xs font-semibold text-teal-400 hover:text-teal-300 inline-flex items-center gap-1"
          >
            Read awareness articles <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-navy-900/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-1.5">Metabolic Balance</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Fasting blood sugar and HbA1c tests identify pre-diabetes before permanent organ damage occurs. Early diet changes can reverse insulin resistance.
          </p>
          <Link
            to="/patient/book"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
          >
            Book free camp checkup <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HealthEducationPage;

