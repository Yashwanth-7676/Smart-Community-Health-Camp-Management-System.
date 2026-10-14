// src/components/layout/Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Heart, Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-sm text-slate-600 dark:text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo & Vision */}
          <div className="md:col-span-1 space-y-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-cyan-500" />
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Health<span className="text-cyan-600 dark:text-cyan-400">Camp</span>
              </span>
            </Link>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Empowering grassroots communities across Karnataka with high-standard, accessible preventive health camps and digital care records.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 text-xs uppercase tracking-wider">
              Quick Navigation
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/camps" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                  Find Nearest Camps
                </Link>
              </li>
              <li>
                <Link to="/patient/book" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                  Book Slot Online
                </Link>
              </li>
              <li>
                <Link to="/awareness" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                  Health Awareness Tips
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                  Help & Emergency Contacts
                </Link>
              </li>
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 text-xs uppercase tracking-wider">
              Staff & Services
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/doctor" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                  Doctor Consultation
                </Link>
              </li>
              <li>
                <Link to="/volunteer" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                  Volunteer Field Desk
                </Link>
              </li>
              <li>
                <Link to="/inventory" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                  Pharmacy & Inventory
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                  Camp Administration
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Helpline */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 text-xs uppercase tracking-wider">
              Toll-Free Helpline
            </h4>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Phone className="w-3.5 h-3.5 text-cyan-500" />
              <span>1800-425-CAMP (2267)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Mail className="w-3.5 h-3.5 text-cyan-500" />
              <span>support@healthcamp.community</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-cyan-500" />
              <span>Bengaluru, Karnataka, India</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400">
          <p>© 2026 Smart Community Health Camp Management System. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <Link to="/about" className="hover:text-cyan-400 transition-colors">About Us</Link>
            <Link to="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
            <Link to="/awareness" className="hover:text-cyan-400 transition-colors">Health Guidelines</Link>
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              Made with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for community health
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

