import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Shield, Users, Activity, Award, Compass, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import AnimatedCounter from '@/components/common/AnimatedCounter';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto text-center relative">
        <div className="absolute inset-0 -top-20 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 blur-3xl -z-10 rounded-full" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-6">
            <Sparkles className="w-4 h-4" /> Transforming Community Health
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
            Bridging Healthcare Gaps with{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
              Smart Community Camps
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Millions of rural and underserved citizens lack regular access to preventive healthcare. We empower medical
            camps with interactive 3D scheduling, offline queue sync, and secure diagnostic portals.
          </p>
        </motion.div>
      </div>

      {/* Impact Stats */}
      <div className="max-w-7xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Camps Organized', value: 120, suffix: '+', icon: Compass },
          { label: 'Patients Screened', value: 45000, suffix: '+', icon: Users },
          { label: 'Volunteer Doctors', value: 350, suffix: '+', icon: Heart },
          { label: 'Free Tests Conducted', value: 98000, suffix: '+', icon: Activity },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-center"
          >
            <stat.icon className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
            <div className="text-3xl sm:text-4xl font-bold text-white mb-1">
              <AnimatedCounter end={stat.value} suffix={stat.suffix} />
            </div>
            <div className="text-sm text-slate-400">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Problem & Solution Grid */}
      <div className="max-w-7xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-2 gap-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="p-8 rounded-3xl bg-slate-800/60 border border-slate-700/60 relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mb-6">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">The Community Challenge</h2>
          <p className="text-slate-300 leading-relaxed mb-6">
            In rural and semi-urban communities, access to specialist physicians is constrained by distance, expense,
            and fragmented health awareness. Traditional camps rely on manual paper registration, resulting in chaotic
            queues, double bookings, misplaced records, and zero longitudinal follow-up for chronic conditions like
            diabetes and hypertension.
          </p>
          <ul className="space-y-3 text-slate-300 text-sm">
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Average travel distance to hospital: 25+ km
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> High wait times exceeding 4-6 hours
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Over 70% loss of follow-up for high-risk patients
            </li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="p-8 rounded-3xl bg-gradient-to-br from-cyan-900/30 to-slate-800/60 border border-cyan-500/30 relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-6">
            <Award className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Our Smart Solution</h2>
          <p className="text-slate-300 leading-relaxed mb-6">
            The Smart Community Health Camp Management System introduces digital precision to community healthcare.
            With genuine 3D visualization, automated capacity limits, rural-first offline queue tokenization, and
            bilingual Kannada/English support, every patient receives dignified, orderly care with downloadable
            authorized reports.
          </p>
          <ul className="space-y-3 text-slate-300 text-sm">
            {[
              'Digital Queue Tokens with live estimated waiting times',
              'Offline-first registration sync when internet drops',
              'Paperless doctor checkup forms & downloadable PDF reports',
              'Safe AI assistant providing approved healthcare guidance',
            ].map((feat, i) => (
              <li key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> {feat}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Call to action */}
      <div className="max-w-4xl mx-auto mt-20 text-center p-10 rounded-3xl bg-gradient-to-r from-blue-900/40 via-cyan-900/30 to-indigo-900/40 border border-cyan-500/20">
        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">Ready to Explore Healthcare Camps?</h3>
        <p className="text-slate-300 max-w-xl mx-auto mb-8">
          Find upcoming camps in your area, review specialist schedules, or register as a volunteer today.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/camps"
            className="px-6 py-3 rounded-xl font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-900 transition-all shadow-lg shadow-cyan-500/25"
          >
            Find Health Camps
          </Link>
          <Link
            to="/health-awareness"
            className="px-6 py-3 rounded-xl font-semibold bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20"
          >
            Health Awareness
          </Link>
        </div>
      </div>
    </div>
  );
};

export default About;

