import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Heart,
  Activity,
  Eye,
  Stethoscope,
  Baby,
  Brain,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sparkles,
  HelpCircle,
  FileCheck,
} from 'lucide-react';

interface ServiceItem {
  id: string;
  title: string;
  kannadaTitle: string;
  category: string;
  icon: any;
  summary: string;
  procedures: string[];
  preparation: string;
  targetGroup: string;
}

const SERVICES_DATA: ServiceItem[] = [
  {
    id: 'general-medicine',
    title: 'General Clinical Medicine',
    kannadaTitle: 'ಸಾಮಾನ್ಯ ವೈದ್ಯಕೀಯ ತಪಾಸಣೆ',
    category: 'Primary Care',
    icon: Heart,
    summary: 'Comprehensive primary evaluation, seasonal ailment diagnostics, and physician consultations.',
    procedures: [
      'Comprehensive physical checkup & auscultation',
      'Body Mass Index (BMI) & temperature measurement',
      'Infection screening (fever, respiratory, gastrointestinal)',
      'Physician consultation & digital prescription',
    ],
    preparation: 'Carry previous medical prescriptions, lab reports, and government identification.',
    targetGroup: 'All age groups, adults and elderly',
  },
  {
    id: 'bp-diabetes',
    title: 'Hypertension & Diabetes Screening',
    kannadaTitle: 'ರಕ್ತದೊತ್ತಡ ಮತ್ತು ಮಧುಮೇಹ ಪರೀಕ್ಷೆ',
    category: 'Screening',
    icon: Activity,
    summary: 'Rapid diagnostic screening to detect silent cardiovascular and metabolic conditions.',
    procedures: [
      'Digital sphygmomanometer blood pressure evaluation',
      'Instant capillary blood glucose test (Random / Fasting)',
      'Cardiovascular risk categorization',
      'Nutritional & lifestyle modification roadmap',
    ],
    preparation: 'For fasting blood sugar, avoid food intake for 8-10 hours prior to morning camp intake.',
    targetGroup: 'Individuals aged 30+ or with family history of diabetes/hypertension',
  },
  {
    id: 'eye-care',
    title: 'Comprehensive Ophthalmology & Vision Care',
    kannadaTitle: 'ಕಣ್ಣಿನ ಸಮಗ್ರ ಆರೈಕೆ ಮತ್ತು ದೃಷ್ಟಿ ಪರೀಕ್ಷೆ',
    category: 'Specialized',
    icon: Eye,
    summary: 'Visual acuity testing, refractive error diagnosis, cataract triage, and free spectacle distribution.',
    procedures: [
      'Snellen chart computerized refractive vision test',
      'Slit lamp anterior chamber cataract inspection',
      'Intraocular pressure evaluation for glaucoma screening',
      'Free corrective spectacles dispensing for eligible seniors',
    ],
    preparation: 'Bring current spectacles and contact lenses (if worn). Avoid eye drops before exam.',
    targetGroup: 'School children, seniors, and individuals experiencing blurry vision',
  },
  {
    id: 'dental-care',
    title: 'Dental Health & Oral Hygiene',
    kannadaTitle: 'ದಂತ ಚಿಕಿತ್ಸೆ ಮತ್ತು ಬಾಯಿಯ ನೈರ್ಮಲ್ಯ',
    category: 'Dental',
    icon: Stethoscope,
    summary: 'Professional oral examination, plaque assessment, cavity treatment, and oral hygiene education.',
    procedures: [
      'Oral cavity & gum tissue inspection',
      'Dental caries and tartar mapping',
      'Basic atraumatic restorative treatment',
      'Free dental care kit (fluoride paste & soft toothbrush)',
    ],
    preparation: 'Brush thoroughly before arrival. Inform dentist of any bleeding gums or loose teeth.',
    targetGroup: 'Children and adults',
  },
  {
    id: 'pediatrics',
    title: 'Pediatric Care & Immunization Audit',
    kannadaTitle: 'ಮಕ್ಕಳ ಆರೋಗ್ಯ ತಪಾಸಣೆ ಮತ್ತು ಲಸಿಕೆ ಪರಿಶೀಲನೆ',
    category: 'Maternal & Child',
    icon: Baby,
    summary: 'Monitoring developmental milestones, nutritional adequacy, and pediatric wellness.',
    procedures: [
      'Growth percentiles (height, weight, head circumference)',
      'Childhood immunization card audit and catch-up reminders',
      'Micronutrient & deworming tablets dispensing',
      'Maternal nutrition guidance sessions',
    ],
    preparation: 'Parents must bring child’s vaccination card (Taayi card or hospital immunization log).',
    targetGroup: 'Infants, toddlers, and children under 14 years',
  },
  {
    id: 'mental-wellness',
    title: 'Mental Health & Community Wellness',
    kannadaTitle: 'ಮಾನಸಿಕ ಆರೋಗ್ಯ ಮತ್ತು ಕೌನ್ಸಿಲಿಂಗ್',
    category: 'Wellness',
    icon: Brain,
    summary: 'Empathetic, confidential counselling for stress, anxiety, sleep disorders, and depression.',
    procedures: [
      'Confidential psychological well-being assessment',
      'Stress and sleep hygiene coping strategies',
      'De-addiction support & guidance',
      'Referral to district hospital psychiatric specialists',
    ],
    preparation: 'No prior preparation required. 100% confidential private consultation rooms provided.',
    targetGroup: 'Adolescents, working individuals, and caregivers',
  },
];

export const Services: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const categories = ['All', 'Primary Care', 'Screening', 'Specialized', 'Dental', 'Maternal & Child', 'Wellness'];

  const filteredServices =
    selectedCategory === 'All'
      ? SERVICES_DATA
      : SERVICES_DATA.filter((s) => s.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050c18] text-slate-900 dark:text-slate-100 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider mb-4 border border-cyan-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            Configurable Clinical Offerings
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Specialized Healthcare at Every{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400">
              Community Camp
            </span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            All services offered during our camps are completely free of charge. Conducted by certified physicians, supported by verified medical equipment, and backed by government-approved referral pathways.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-600 dark:bg-cyan-500 text-white shadow-md shadow-cyan-500/20 scale-105'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((svc) => (
            <div
              key={svc.id}
              className="rounded-3xl bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-7 flex flex-col justify-between shadow-lg hover:shadow-glow hover:border-cyan-500/40 transition-all duration-300 group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <svc.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-cyan-300 border border-slate-200 dark:border-slate-700">
                    {svc.category}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  {svc.title}
                </h3>
                <p className="text-xs font-medium text-cyan-600 dark:text-cyan-400 mb-3">
                  {svc.kannadaTitle}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                  {svc.summary}
                </p>

                {/* Key Procedures */}
                <div className="space-y-2 mb-5">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                    What is Included:
                  </span>
                  {svc.procedures.map((proc, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{proc}</span>
                    </div>
                  ))}
                </div>

                {/* Preparation Tip Box */}
                <div className="p-3.5 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-900/40 text-xs text-slate-700 dark:text-cyan-200 mb-4">
                  <strong className="block text-cyan-700 dark:text-cyan-300 mb-0.5 flex items-center gap-1.5 font-bold">
                    <FileCheck className="w-3.5 h-3.5" />
                    Preparation Note:
                  </strong>
                  {svc.preparation}
                </div>
              </div>

              {/* Action Link */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Target: {svc.targetGroup}</span>
                <Link
                  to="/camps"
                  className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500"
                >
                  <span>Find Camps</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-slate-900 to-[#0a1628] border border-cyan-500/20 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1">
            <h3 className="text-xl font-bold">Ready to book an appointment for your family?</h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Select any upcoming camp across Bengaluru and rural districts to reserve guaranteed queue tokens.
            </p>
          </div>
          <Link
            to="/patient/book"
            className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md whitespace-nowrap"
          >
            Book Free Appointment Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Services;

