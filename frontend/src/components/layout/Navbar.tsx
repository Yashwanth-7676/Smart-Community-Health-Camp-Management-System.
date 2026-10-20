// src/components/layout/Navbar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { NotificationCenter } from '@/components/common/NotificationCenter';
import {
  Activity,
  Menu,
  X,
  User,
  LogOut,
  Compass,
  FileText,
  HeartHandshake,
  ChevronDown,
  Sparkles,
  Stethoscope,
  MapPin,
  Cpu,
  Layers,
  Info,
  Phone,
  Radio,
} from 'lucide-react';
import { DemoCredentialsModal } from '@/components/common/DemoCredentialsModal';
import { OfflineSyncManager } from '@/components/common/OfflineSyncManager';
import { useTranslation } from 'react-i18next';

export const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [techDropdownOpen, setTechDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const techDropdownRef = useRef<HTMLDivElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (techDropdownRef.current && !techDropdownRef.current.contains(target)) {
        setTechDropdownOpen(false);
      }
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(target)) {
        setMoreDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setTechDropdownOpen(false);
    setMoreDropdownOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardRoute = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'admin':
        return '/admin';
      case 'doctor':
        return '/doctor';
      case 'volunteer':
        return '/volunteer';
      default:
        return '/patient';
    }
  };

  const navCoreLinks = [
    { label: t('nav.home', 'Home'), path: '/' },
    { label: t('nav.camps', 'Health Camps'), path: '/camps' },
    { label: 'Camp Map', path: '/camp-map', badge: 'Live' },
  ];

  const techLinks = [
    {
      label: '3D Anatomy Education',
      path: '/education',
      description: 'Interactive human 3D anatomy & organ systems',
      icon: Stethoscope,
      badge: '3D',
    },
    {
      label: '3D Digital Twin',
      path: '/digital-twin',
      description: 'Real-time biometric virtual patient simulation',
      icon: Cpu,
      badge: 'Interactive',
    },
    {
      label: 'Camp Command Center',
      path: '/command-center',
      description: 'Live operations, queues, & medical supply status',
      icon: Activity,
      badge: 'Live',
    },
    {
      label: 'AI Medical Report Reader',
      path: '/reports/reader',
      description: 'Automated diagnostic report OCR & lab summaries',
      icon: FileText,
      badge: 'AI',
    },
  ];

  const moreLinks = [
    {
      label: t('nav.healthAwareness', 'Health Awareness'),
      path: '/awareness',
      description: 'Preventive health education & hygiene articles',
      icon: HeartHandshake,
    },
    {
      label: t('nav.services', 'Services'),
      path: '/services',
      description: 'Camp medical specialties and screenings',
      icon: Layers,
    },
    {
      label: t('nav.about', 'About Us'),
      path: '/about',
      description: 'Our rural community health mission & partners',
      icon: Info,
    },
    {
      label: t('nav.contact', 'Contact'),
      path: '/contact',
      description: 'Inquiries, emergencies, & camp hosting',
      icon: Phone,
    },
  ];

  const isTechActive = techLinks.some((link) => location.pathname === link.path);
  const isMoreActive = moreLinks.some((link) => location.pathname === link.path);

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-white/90 dark:bg-[#050c18]/90 border-b border-slate-200/80 dark:border-cyan-500/20 shadow-glass transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-transparent dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center group-hover:scale-105 group-hover:shadow-glow transition-all">
              <Activity className="w-5 h-5 text-cyan-500 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-[#050c18]" />
            </div>
            <div>
              <span className="text-sm sm:text-base lg:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                Health<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-sky-300">Camp</span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 ml-0.5">
                  3D
                </span>
              </span>
              <span className="hidden sm:block text-[9px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase">
                Community Care HQ
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {/* Core Links */}
            {navCoreLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-3 py-1.5 xl:px-3.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                    isActive
                      ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 shadow-sm border border-cyan-200/60 dark:border-cyan-800/60'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      {link.badge}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavPill"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-cyan-500 rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}

            {/* 3D & AI Tech Dropdown */}
            <div className="relative" ref={techDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setTechDropdownOpen(!techDropdownOpen);
                  setMoreDropdownOpen(false);
                }}
                className={`px-3 py-1.5 xl:px-3.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                  isTechActive || techDropdownOpen
                    ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 shadow-sm border border-cyan-200/60 dark:border-cyan-800/60'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                <span>3D & AI Tools</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    techDropdownOpen ? 'rotate-180 text-cyan-500' : 'text-slate-400'
                  }`}
                />
              </button>

              <AnimatePresence>
                {techDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#091322] border border-slate-200/90 dark:border-cyan-500/25 shadow-2xl p-2 z-50 backdrop-blur-2xl"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                        Next-Gen Clinical Features
                      </p>
                    </div>

                    <div className="space-y-1">
                      {techLinks.map((item) => {
                        const Icon = item.icon;
                        const isCurrent = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setTechDropdownOpen(false)}
                            className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                              isCurrent
                                ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-300'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold leading-none">{item.label}</span>
                                {item.badge && (
                                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                                {item.description}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Information & Community Dropdown */}
            <div className="relative" ref={moreDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setMoreDropdownOpen(!moreDropdownOpen);
                  setTechDropdownOpen(false);
                }}
                className={`px-3 py-1.5 xl:px-3.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                  isMoreActive || moreDropdownOpen
                    ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 shadow-sm border border-cyan-200/60 dark:border-cyan-800/60'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                }`}
              >
                <span>Information</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    moreDropdownOpen ? 'rotate-180 text-cyan-500' : 'text-slate-400'
                  }`}
                />
              </button>

              <AnimatePresence>
                {moreDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#091322] border border-slate-200/90 dark:border-cyan-500/25 shadow-2xl p-2 z-50 backdrop-blur-2xl"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                        Community & Support
                      </p>
                    </div>

                    <div className="space-y-1">
                      {moreLinks.map((item) => {
                        const Icon = item.icon;
                        const isCurrent = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setMoreDropdownOpen(false)}
                            className={`flex items-start gap-2.5 p-2 rounded-xl transition-all ${
                              isCurrent
                                ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-300'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold leading-tight block">{item.label}</span>
                              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                                {item.description}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Action Icons & Auth */}
          <div className="hidden sm:flex items-center gap-1.5 xl:gap-2 shrink-0">
            <button
              onClick={() => setDemoModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 xl:px-3 xl:py-1.5 rounded-xl text-xs font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 hover:border-cyan-500/60 shadow-sm transition-all"
              title="View presentation accounts & quick switch"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
              <span className="hidden xl:inline">Demo Mode</span>
              <span className="xl:hidden">Demo</span>
            </button>
            <OfflineSyncManager />
            <LanguageToggle />
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                <NotificationCenter />

                {/* User Dropdown */}
                <div className="relative ml-1" ref={profileDropdownRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all border border-slate-200/80 dark:border-slate-800 shadow-sm"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                      {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                    <div className="text-left hidden md:block">
                      <span className="block text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[85px] xl:max-w-[110px] truncate leading-tight">
                        {user?.name || user?.email}
                      </span>
                      <span className="block text-[10px] text-cyan-600 dark:text-cyan-400 capitalize font-medium leading-none">
                        {user?.role}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <AnimatePresence>
                    {profileDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#091322] border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 backdrop-blur-xl"
                      >
                        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {user?.name || 'Authorized Member'}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                          <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 capitalize">
                            Role: {user?.role}
                          </span>
                        </div>

                        <Link
                          to={getDashboardRoute()}
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <Compass className="w-4 h-4 text-cyan-500" />
                          Dashboard Portal
                        </Link>

                        <Link
                          to="/patient/profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <User className="w-4 h-4 text-cyan-500" />
                          My Health Profile
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left border-t border-slate-100 dark:border-slate-800 mt-1"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 ml-1">
                <Link
                  to="/login"
                  className="px-3 py-1.5 xl:px-4 xl:py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 xl:px-4 xl:py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Actions & Menu Toggle */}
          <div className="flex lg:hidden items-center gap-1.5">
            <OfflineSyncManager />
            <LanguageToggle />
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#050c18]/95 backdrop-blur-2xl px-5 pt-4 pb-7 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto"
          >
            {/* Core Pages */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                Main
              </p>
              <div className="space-y-1">
                {navCoreLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        isActive
                          ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200/50 dark:border-cyan-800/50'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{link.label}</span>
                      {link.badge && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 3D & AI Tech */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-2">
                3D & AI Innovation
              </p>
              <div className="space-y-1">
                {techLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        isActive
                          ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-cyan-500" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Community & Info */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                Community & Information
              </p>
              <div className="space-y-1">
                {moreLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        isActive
                          ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Auth Actions in Mobile Menu */}
            {isAuthenticated ? (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <Link
                  to={getDashboardRoute()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/20"
                >
                  Go to {user?.role ? `${user.role} Dashboard` : 'Dashboard'}
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setDemoModalOpen(true);
                  }}
                  className="w-full text-center py-2.5 text-xs font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 rounded-xl flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Demo Mode Quick Switch</span>
                </button>
                <div className="flex gap-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2.5 text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2.5 text-xs font-bold bg-cyan-600 text-white rounded-xl shadow-md"
                  >
                    Register
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <DemoCredentialsModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
