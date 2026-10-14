import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Eye, FileText, ChevronDown, CheckCircle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PolicySection {
  id: string;
  title: string;
  icon: any;
  content: string[];
}

const PrivacyPolicy: React.FC = () => {
  const [openSection, setOpenSection] = useState<string | null>('collection');

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const sections: PolicySection[] = [
    {
      id: 'collection',
      title: '1. What Information We Collect',
      icon: Eye,
      content: [
        'Basic Demographics: Full name, contact number, age/date of birth, gender, and district/village location.',
        'Clinical Screening Records: Basic vital signs (blood pressure, pulse rate, blood glucose), physician diagnoses, prescriptions, and specialist referral notes recorded by authorized medical officers.',
        'Technical Logs: Minimal session cookies and audit timestamps to maintain account security and prevent unauthorized access.',
      ],
    },
    {
      id: 'usage',
      title: '2. How Your Healthcare Information is Used',
      icon: FileText,
      content: [
        'Direct Patient Care: Enabling attending physicians and specialist doctors to review test outcomes and issue authorized medical prescriptions.',
        'Queue Coordination: Generating unique digital queue tokens for camp reception, reducing physical waiting time.',
        'Longitudinal Follow-up: Alerting patients when return visits, ongoing medication reviews, or specialist hospital visits are recommended.',
        'Privacy-Preserving Analytics: Producing aggregated statistical counts (e.g., total screened for diabetes in a district) without ever disclosing names or individual records.',
      ],
    },
    {
      id: 'consent',
      title: '3. Patient Consent & DPDP Principles',
      icon: CheckCircle,
      content: [
        'Voluntary Participation: Healthcare screening at our camps is 100% voluntary.',
        'Explicit Purpose Limitation: Your health information is collected exclusively for medical camp services and patient health tracking.',
        'Consent Control: You may grant or revoke specific consents (e.g. data sharing with referral hospitals) through your patient dashboard.',
        'Compliant Standards: Designed in alignment with the Digital Personal Data Protection (DPDP) Act of India and ethical healthcare record standards.',
      ],
    },
    {
      id: 'security',
      title: '4. Security & Data Protection Measures',
      icon: Lock,
      content: [
        'Encryption in Transit: All data transfers between your browser and our server utilize industry-standard TLS encryption.',
        'Role-Based Authorization: Volunteers can only see check-in queue numbers. Medical observations and diagnostic reports are restricted exclusively to treating physicians and the patient.',
        'Strict Access Logging: All administrative and report actions are immutably logged in the audit trail.',
        'No Commercial Resale: We never sell, rent, or trade community health data with third-party advertisers.',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-4">
            <Shield className="w-4 h-4" /> Data Protection & Privacy Notice
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Privacy Policy & Health Information Rights
          </h1>
          <p className="mt-4 text-slate-300 max-w-2xl mx-auto text-sm sm:text-base">
            Your trust and medical privacy are paramount. Learn how we safeguard your health camp records and personal
            data.
          </p>
          <div className="mt-2 text-xs text-slate-400">Last updated: October 2026 • Version 2.0 (DPDP Aligned)</div>
        </div>

        {/* Notice Card */}
        <div className="p-4 sm:p-6 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-4 mb-8">
          <Info className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-sm text-cyan-100 leading-relaxed">
            <strong>Important Medical Privacy Notice:</strong> Smart Community Health Camp Management System strictly
            enforces role-based permissions. Only licensed medical professionals assigned to your camp can access or
            edit medical diagnostic records.
          </div>
        </div>

        {/* Accordion Sections */}
        <div className="space-y-4">
          {sections.map((section) => {
            const isOpen = openSection === section.id;
            const Icon = section.icon;

            return (
              <div
                key={section.id}
                className="rounded-2xl bg-slate-800/60 border border-slate-700/60 overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-white text-base sm:text-lg">{section.title}</span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-cyan-400' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-6 pt-2 text-sm text-slate-300 border-t border-slate-700/40 space-y-3">
                        {section.content.map((paragraph, pIdx) => (
                          <div key={pIdx} className="flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                            <span>{paragraph}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Footer Contact */}
        <div className="mt-12 text-center text-sm text-slate-400">
          Have privacy questions or wish to exercise your data rights?{' '}
          <Link to="/contact" className="text-cyan-400 hover:underline">
            Contact our Health Camp Privacy Officer
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
