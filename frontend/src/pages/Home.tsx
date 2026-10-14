import React, { Suspense, useRef, useEffect, lazy } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import gsap from 'gsap';
import {
  Heart, Shield, Eye, Baby, Users, Brain,
  MapPin, Calendar, ArrowRight, ChevronRight, Activity,
  CheckCircle, Sparkles, Stethoscope, Clock, ShieldCheck
} from 'lucide-react';
import apiClient from '@/api/client';

// Lazy load the 3D Hero Scene for optimal performance & non-blocking initial paint
const HeroScene = lazy(() => import('@/components/three/HeroScene'));
const HeartbeatLine = lazy(() => import('@/components/three/HeartbeatLine'));

// ─── Animated Statistics Counter ────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null!);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 2.2,
      ease: 'power2.out',
      onUpdate: () => {
        if (ref.current) ref.current.textContent = Math.round(obj.val).toLocaleString() + suffix;
      },
    });
  }, [inView, target, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

// ─── Static Data ────────────────────────────────────────────────────────────
const STATS = [
  { label: 'Health Camps Organized', value: 540, suffix: '+', icon: Calendar },
  { label: 'Patients Treated Free', value: 68500, suffix: '+', icon: Users },
  { label: 'Licensed Doctors', value: 240, suffix: '+', icon: Stethoscope },
  { label: 'Volunteers on Ground', value: 1200, suffix: '+', icon: Heart },
];

const SERVICES = [
  {
    icon: Heart,
    title: 'General Clinical Medicine',
    desc: 'Comprehensive primary physical examination, symptom triage, vital signs checking, and preventive consultations.',
    badge: 'Primary Care',
  },
  {
    icon: Activity,
    title: 'Hypertension & Diabetes Screening',
    desc: 'Instant blood pressure mapping, random blood glucose evaluation, and personalized lifestyle counselling.',
    badge: 'Screening',
  },
  {
    icon: Eye,
    title: 'Comprehensive Eye Care',
    desc: 'Visual acuity assessment, cataract screening, glaucoma testing, and free corrective prescription spectacles.',
    badge: 'Specialized',
  },
  {
    icon: Stethoscope,
    title: 'Dental Hygiene & Checkup',
    desc: 'Oral cavity diagnostics, tooth scaling, cavity inspection, and free dental hygiene guidance kit.',
    badge: 'Dental',
  },
  {
    icon: Baby,
    title: 'Pediatric Care & Immunization',
    desc: 'Child physical growth analysis, immunization verification, nutritional advice, and pediatric screening.',
    badge: 'Maternal & Child',
  },
  {
    icon: Brain,
    title: 'Mental Health & Wellness',
    desc: 'Confidential psychological counselling, community stress management sessions, and rehabilitation referrals.',
    badge: 'Wellness',
  },
];

// ─── Main Component ─────────────────────────────────────────────────────────
export default function Home() {
  const { data: campsData } = useQuery({
    queryKey: ['upcoming-camps'],
    queryFn: () => apiClient.get('/camps?status=upcoming&limit=3').then((r) => r.data.data),
  });

  const camps = campsData?.camps ?? [];

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  const stagger = {
    visible: { transition: { staggerChildren: 0.12 } },
  };

  return (
    <div className="min-h-screen bg-[#050c18] text-white overflow-x-hidden selection:bg-cyan-500 selection:text-white">
      {/* ── 3D Hero Section ── */}
      <section className="relative min-h-[92vh] flex items-center pt-8 pb-16 lg:py-0 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Hero Left Content */}
          <motion.div
            className="lg:col-span-7 space-y-6 pt-4 lg:pt-0"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {/* Pill Badge */}
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold tracking-wide shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Smart Community Healthcare Platform • 2026 Edition</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12]">
              Futuristic Care for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
                Every Community
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p variants={fadeUp} className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed font-normal">
              Empowering rural and urban neighborhoods with intelligent health camps, live token queues, interactive 3D clinic mapping, and certified clinical reports.
            </motion.p>

            {/* Hero CTAs */}
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/patient/book"
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-bold text-sm sm:text-base flex items-center gap-2.5 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Book a Camp Visit</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/camps"
                className="px-7 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 font-semibold text-sm sm:text-base flex items-center gap-2 backdrop-blur-md hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Explore Camps</span>
                <MapPin className="w-4 h-4 text-cyan-400" />
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <motion.div variants={fadeUp} className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-400 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Free Consultations</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-cyan-400" />
                <span>DPDP Act 2023 Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>Live Digital Queue</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Right: Real 3D Scene Viewport */}
          <motion.div
            className="lg:col-span-5 h-[420px] sm:h-[480px] lg:h-[540px] relative w-full flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2 }}
          >
            {/* 3D Scene Wrapper with soft glow border */}
            <div className="w-full h-full rounded-3xl overflow-hidden relative border border-cyan-500/20 bg-slate-950/40 backdrop-blur-sm shadow-glass-lg">
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-cyan-500/30 text-[11px] font-medium text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                Interactive 3D Clinic
              </div>

              <Suspense
                fallback={
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-900/40">
                    <div className="w-10 h-10 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-cyan-300 font-medium">Initializing 3D Viewport...</span>
                  </div>
                }
              >
                <HeroScene />
              </Suspense>

              {/* 3D Hint caption */}
              <div className="absolute bottom-3 right-4 z-20 text-[10px] text-slate-400/80 bg-slate-900/60 px-2 py-0.5 rounded backdrop-blur">
                Drag to rotate 3D view
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="hidden lg:flex absolute bottom-4 left-1/2 -translate-x-1/2 flex-col items-center gap-1 text-slate-500 text-xs">
          <span>Scroll to explore</span>
          <ChevronRight className="w-4 h-4 rotate-90 animate-bounce text-cyan-500" />
        </div>
      </section>

      {/* ── Dynamic 3D ECG Heartbeat Ribbon ── */}
      <section className="border-y border-cyan-500/15 bg-slate-950/80 backdrop-blur py-2">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Community Vitals Monitor
            </span>
          </div>
          <div className="w-48 sm:w-80 h-10 hidden sm:block">
            <Suspense fallback={<div className="h-full bg-cyan-900/20 rounded animate-pulse" />}>
              <HeartbeatLine height={40} />
            </Suspense>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Active Camps in Bengaluru & Rural Karnataka
          </div>
        </div>
      </section>

      {/* ── Impact Statistics with Animated Counters ── */}
      <section className="py-16 bg-gradient-to-b from-slate-950 via-[#0a1628] to-slate-950 border-b border-slate-800/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
          >
            {STATS.map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 transition-all text-center relative group"
              >
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-200">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="mt-2 text-xs sm:text-sm text-slate-300 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Medical Services Showcase ── */}
      <section className="py-24 container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <motion.span variants={fadeUp} className="text-xs font-bold uppercase tracking-widest text-cyan-400">
            Clinical Spectrum
          </motion.span>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold mt-2 tracking-tight">
            Comprehensive Medical Services
          </motion.h2>
          <motion.p variants={fadeUp} className="text-slate-400 text-sm sm:text-base mt-3">
            Every health camp is equipped with state-of-the-art diagnostic apparatus, certified doctors, and free pharmacy dispensaries.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {SERVICES.map((svc, idx) => (
            <motion.div
              key={idx}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              className="p-7 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900/80 transition-all duration-300 flex flex-col justify-between group shadow-3d hover:shadow-glow"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <svc.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                    {svc.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                  {svc.title}
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  {svc.desc}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-cyan-400">
                <Link to="/services" className="inline-flex items-center gap-1.5 hover:underline">
                  <span>Learn more</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <span className="text-slate-500 text-[11px]">Free Assessment</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Upcoming Camps Section ── */}
      <section className="py-20 bg-slate-950/60 border-t border-slate-800/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                Upcoming Schedules
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold mt-2 tracking-tight">
                Nearby Community Camps
              </h2>
            </div>
            <Link
              to="/camps"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold text-sm transition-colors"
            >
              <span>View full directory & map</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {camps.length === 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 animate-pulse space-y-4">
                  <div className="h-5 bg-slate-800 rounded w-3/4" />
                  <div className="h-4 bg-slate-800 rounded w-1/2" />
                  <div className="h-4 bg-slate-800 rounded w-2/3" />
                  <div className="h-2 bg-slate-800 rounded-full" />
                  <div className="h-9 bg-slate-800 rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {camps.map((camp: any) => {
                const pct = Math.min(100, Math.round(((camp.registeredCount || 0) / (camp.capacity || 100)) * 100));
                return (
                  <div
                    key={camp.id || camp._id}
                    className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 transition-all flex flex-col justify-between shadow-3d hover:shadow-glow group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {camp.name}
                        </h3>
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {camp.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span className="truncate">{camp.address || camp.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span>
                          {new Date(camp.startDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800/80">
                      <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                        <span>Capacity Booked</span>
                        <span className="font-semibold text-slate-200">
                          {camp.registeredCount || 0} / {camp.capacity}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pct >= 90 ? 'bg-rose-500' : pct >= 65 ? 'bg-amber-400' : 'bg-cyan-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <Link
                        to={`/camps/${camp.id || camp._id}`}
                        className="mt-4 w-full block text-center py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 font-bold text-xs border border-cyan-500/30 transition-all"
                      >
                        Camp Details & Booking
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Community Call To Action ── */}
      <section className="py-24 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl p-10 sm:p-14 text-center bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 shadow-2xl">
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <h2 className="relative text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Join the Healthcare Revolution
          </h2>
          <p className="relative text-cyan-100 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Whether you are seeking preventative healthcare, a doctor looking to volunteer, or a community organizer — become part of Karnataka's smartest community health camp ecosystem.
          </p>
          <div className="relative flex flex-wrap justify-center items-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl bg-white text-slate-950 font-bold hover:bg-cyan-50 shadow-lg hover:scale-105 active:scale-95 transition-all text-sm"
            >
              Register as Patient or Volunteer
            </Link>
            <Link
              to="/contact"
              className="px-8 py-3.5 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 backdrop-blur text-sm transition-all"
            >
              Contact Support Helpline
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
