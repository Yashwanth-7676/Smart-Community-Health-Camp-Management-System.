// src/components/layout/Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Heart, Phone, AlertTriangle } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-700/50 bg-slate-950/80 backdrop-blur-sm text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">

          {/* Column 1 — Logo & Description */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-inner shadow-cyan-500/5 group-hover:border-cyan-400/50 transition-colors">
                <Activity className="w-4.5 h-4.5 text-cyan-400" />
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-100">
                Health<span className="text-cyan-400">Camp</span>
              </span>
            </Link>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Empowering grassroots communities across Karnataka with high-standard, accessible preventive health camps and digital care records.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              Made with <Heart className="w-3 h-3 text-rose-500 fill-rose-500 shrink-0" /> for community health
            </div>
          </div>

          {/* Column 2 — Quick Links */}
          <div>
            <h4 className="font-semibold text-slate-300 mb-4 text-[10px] uppercase tracking-widest">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Home', to: '/' },
                { label: 'Health Camps', to: '/camps' },
                { label: 'Camp Map', to: '/map' },
                { label: 'About', to: '/about' },
                { label: 'Contact', to: '/contact' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="hover:text-cyan-400 transition-colors duration-150 hover:translate-x-0.5 inline-block"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Portals */}
          <div>
            <h4 className="font-semibold text-slate-300 mb-4 text-[10px] uppercase tracking-widest">
              Portals
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Patient Portal', to: '/patient' },
                { label: 'Doctor Portal', to: '/doctor' },
                { label: 'Admin Center', to: '/admin' },
                { label: 'Volunteer Portal', to: '/volunteer' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="hover:text-cyan-400 transition-colors duration-150 hover:translate-x-0.5 inline-block"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Emergency */}
          <div>
            <h4 className="font-semibold text-slate-300 mb-4 text-[10px] uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              Emergency
            </h4>
            <div className="space-y-3">
              <a
                href="tel:108"
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/40 hover:border-rose-600/60 hover:bg-rose-950/60 transition-all group"
              >
                <Phone className="w-3.5 h-3.5 text-rose-400 shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-semibold text-rose-300 text-[11px]">Medical Emergency</p>
                  <p className="text-rose-400 font-bold text-sm tracking-wider">108</p>
                </div>
              </a>
              <a
                href="tel:104"
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 hover:border-amber-600/60 hover:bg-amber-950/50 transition-all group"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-semibold text-amber-300 text-[11px]">Arogya Helpline</p>
                  <p className="text-amber-400 font-bold text-sm tracking-wider">104</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© {currentYear} Smart Community Health Camp Management System · MIT License</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
            <Link to="/awareness" className="hover:text-cyan-400 transition-colors">Health Guidelines</Link>
            <Link to="/services" className="hover:text-cyan-400 transition-colors">Services</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
