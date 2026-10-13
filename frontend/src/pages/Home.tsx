import React, { Suspense, useRef, useEffect, lazy } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import {
  Heart, Shield, Eye, Baby, Users, Brain,
  MapPin, Calendar, ArrowRight, ChevronRight, Activity
} from 'lucide-react';
import apiClient from '@/api/client';

// ─── 3D Medical Scene ───────────────────────────────────────────────────────

function MedicalCross() {
  const groupRef = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    groupRef.current.rotation.y += delta * 0.4;
    groupRef.current.rotation.x += delta * 0.1;
  });
  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.4, 1.6, 0.4]} />
        <meshStandardMaterial color="#06b6d4" metalness={0.5} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.6, 0.4, 0.4]} />
        <meshStandardMaterial color="#06b6d4" metalness={0.5} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[1.1, 0.08, 16, 64]} />
        <meshStandardMaterial color="#0891b2" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

function FloatingPill({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Group>(null!);
  const speed = useRef(Math.random() * 0.5 + 0.3);
  const offset = useRef(Math.random() * Math.PI * 2);
  useFrame((state) => {
    const t = state.clock.elapsedTime * speed.current + offset.current;
    meshRef.current.position.y = position[1] + Math.sin(t) * 0.3;
    meshRef.current.rotation.z += 0.01;
  });
  return (
    <group ref={meshRef} position={position}>
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.15, 0.15, 0.6, 16]} />
        <meshStandardMaterial color="#ffffff" opacity={0.7} transparent />
      </mesh>
      <mesh position={[0, -0.3, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color={color} opacity={0.5} transparent />
      </mesh>
    </group>
  );
}

function OrbitingSphere({ radius, speed, color }: { radius: number; speed: number; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime * speed;
    meshRef.current.position.x = Math.cos(t) * radius;
    meshRef.current.position.z = Math.sin(t) * radius;
    meshRef.current.position.y = Math.sin(t * 0.5) * 0.5;
  });
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.12, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
    </mesh>
  );
}

function MedicalScene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#06b6d4" />
      <pointLight position={[-10, -10, -10]} intensity={0.8} color="#0a1628" />
      <pointLight position={[0, 5, 5]} intensity={1} color="#ffffff" />
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      <MedicalCross />
      <FloatingPill position={[-3, 1, -1]} color="#06b6d4" />
      <FloatingPill position={[3, -1, -1]} color="#0891b2" />
      <FloatingPill position={[-2, -2, 1]} color="#22d3ee" />
      <FloatingPill position={[2.5, 2, 0.5]} color="#0e7490" />
      <OrbitingSphere radius={2.5} speed={0.8} color="#06b6d4" />
      <OrbitingSphere radius={2.5} speed={0.8 * 1.5} color="#22d3ee" />
      <OrbitingSphere radius={2.5} speed={0.8 * 2} color="#0891b2" />
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
    </>
  );
}

// ─── Animated Counter ────────────────────────────────────────────────────────

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null!);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 2,
      ease: 'power2.out',
      onUpdate: () => {
        if (ref.current) ref.current.textContent = Math.round(obj.val) + suffix;
      },
    });
  }, [inView, target, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const STATS = [
  { label: 'Health Camps', value: 500, suffix: '+' },
  { label: 'Patients Served', value: 50000, suffix: '+' },
  { label: 'Doctors Enrolled', value: 200, suffix: '+' },
  { label: 'Volunteers', value: 100, suffix: '+' },
];

const SERVICES = [
  { icon: Heart, title: 'General Medicine', desc: 'Comprehensive primary healthcare and diagnostics for all age groups.' },
  { icon: Activity, title: 'Dental Care', desc: 'Oral health checkups, cleaning, and basic dental procedures.' },
  { icon: Eye, title: 'Eye Care', desc: 'Vision screening, eye exams, and free spectacle distribution.' },
  { icon: Baby, title: 'Pediatrics', desc: 'Child health checkups, immunisation, and nutritional counselling.' },
  { icon: Users, title: 'Gynecology', desc: 'Women\'s health services including antenatal and postnatal care.' },
  { icon: Brain, title: 'Mental Health', desc: 'Counselling sessions, awareness programmes, and mental wellness support.' },
];

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Home() {
  const { data: campsData } = useQuery({
    queryKey: ['upcoming-camps'],
    queryFn: () => apiClient.get('/camps?status=upcoming&limit=3').then(r => r.data.data),
  });

  const camps = campsData?.camps ?? [];

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  const stagger = {
    visible: { transition: { staggerChildren: 0.15 } },
  };

  return (
    <div className="min-h-screen bg-[#0a1628] text-white overflow-x-hidden">
      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d1f3c] to-[#0a1628]" />
        <div className="relative z-10 container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center py-20">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.span variants={fadeUp} className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-500/20">
              🏥 Smart Community Health Management
            </motion.span>
            <motion.h1 variants={fadeUp} className="text-5xl lg:text-7xl font-extrabold leading-tight mb-6">
              Bringing <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Healthcare</span> to Every Community
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg text-gray-300 mb-8 max-w-xl">
              Organise, manage, and attend health camps with ease. Connecting patients, doctors, and volunteers for a healthier tomorrow.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <Link to="/camps" className="px-8 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-[#0a1628] font-bold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-cyan-500/30">
                Find a Camp <ArrowRight size={18} />
              </Link>
              <Link to="/auth/register" className="px-8 py-3.5 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-cyan-200 font-semibold rounded-xl transition-all duration-200">
                Join as Volunteer
              </Link>
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} className="h-[500px] lg:h-[600px]">
            <Suspense fallback={<div className="h-full flex items-center justify-center text-cyan-400 text-lg animate-pulse">Loading 3D Scene...</div>}>
              <Canvas camera={{ position: [0, 0, 5] }} gl={{ antialias: true }}>
                <MedicalScene />
              </Canvas>
            </Suspense>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400 text-sm">
          <span>Scroll down</span>
          <ChevronRight className="rotate-90" size={20} />
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <section className="py-20 bg-gradient-to-r from-cyan-900/20 via-[#0d1f3c] to-cyan-900/20">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <motion.div key={stat.label} variants={fadeUp} className="text-center">
                <div className="text-4xl lg:text-5xl font-extrabold text-cyan-400">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="mt-2 text-gray-300 text-sm font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="py-24 container mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
          <motion.span variants={fadeUp} className="text-cyan-400 font-semibold text-sm uppercase tracking-widest">What We Offer</motion.span>
          <motion.h2 variants={fadeUp} className="mt-3 text-4xl font-bold">Our Medical Services</motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-gray-400 max-w-xl mx-auto">Comprehensive healthcare services delivered at your doorstep through our organised health camps.</motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((svc) => (
            <motion.div key={svc.title} variants={fadeUp} whileHover={{ y: -6, scale: 1.02 }} className="p-6 bg-white/5 backdrop-blur border border-white/10 rounded-2xl cursor-pointer group hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all duration-300">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                <svc.icon className="text-cyan-400" size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2">{svc.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{svc.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Upcoming Camps ── */}
      <section className="py-24 bg-[#0d1f3c]/50">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <motion.span variants={fadeUp} className="text-cyan-400 font-semibold text-sm uppercase tracking-widest">Upcoming Events</motion.span>
              <motion.h2 variants={fadeUp} className="mt-3 text-4xl font-bold">Nearby Health Camps</motion.h2>
            </div>
            <motion.div variants={fadeUp}>
              <Link to="/camps" className="mt-4 md:mt-0 inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                View all camps <ArrowRight size={16} />
              </Link>
            </motion.div>
          </motion.div>

          {camps.length === 0 ? (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <motion.div key={i} variants={fadeUp} className="p-6 bg-white/5 border border-white/10 rounded-2xl animate-pulse">
                  <div className="h-5 bg-white/10 rounded w-3/4 mb-4" />
                  <div className="h-4 bg-white/10 rounded w-1/2 mb-3" />
                  <div className="h-4 bg-white/10 rounded w-2/3 mb-6" />
                  <div className="h-2 bg-white/10 rounded-full mb-2" />
                  <div className="h-8 bg-cyan-500/20 rounded-lg mt-4" />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {camps.map((camp: any) => {
                const pct = Math.min(100, Math.round((camp.registeredCount / camp.capacity) * 100));
                return (
                  <motion.div key={camp._id} variants={fadeUp} whileHover={{ y: -4 }} className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-cyan-500/30 transition-all duration-300 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-bold text-white">{camp.name}</h3>
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-400 rounded-full border border-green-500/20">{camp.status}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                      <MapPin size={14} className="text-cyan-400 flex-shrink-0" />
                      <span className="truncate">{camp.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                      <Calendar size={14} className="text-cyan-400 flex-shrink-0" />
                      <span>{new Date(camp.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="mt-auto">
                      <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                        <span>Capacity</span>
                        <span>{camp.registeredCount ?? 0}/{camp.capacity}</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-2 rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-cyan-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <Link to={`/camps/${camp._id}`} className="mt-4 w-full block text-center py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-semibold rounded-lg transition-colors text-sm">
                        View Details
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 container mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="relative overflow-hidden bg-gradient-to-r from-cyan-600 to-blue-700 rounded-3xl p-12 text-center">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <motion.h2 variants={fadeUp} className="relative text-4xl font-extrabold mb-4">Ready to Make a Difference?</motion.h2>
          <motion.p variants={fadeUp} className="relative text-cyan-100 text-lg mb-8 max-w-xl mx-auto">Whether you are a patient, doctor, or volunteer — join our platform and help build a healthier community.</motion.p>
          <motion.div variants={fadeUp} className="relative flex flex-wrap justify-center gap-4">
            <Link to="/auth/register" className="px-8 py-3.5 bg-white text-cyan-700 font-bold rounded-xl hover:bg-cyan-50 transition-colors shadow-lg">
              Get Started Free
            </Link>
            <Link to="/contact" className="px-8 py-3.5 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors">
              Contact Us
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
