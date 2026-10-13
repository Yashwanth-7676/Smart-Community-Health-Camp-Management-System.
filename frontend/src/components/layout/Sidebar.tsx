// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Calendar,
  User,
  Users,
  FileText,
  Package,
  BarChart3,
  Stethoscope,
  ClipboardList,
  Compass,
  Bell,
  Settings,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || 'patient';

  const patientItems = [
    { label: 'Overview', path: '/patient', icon: LayoutDashboard },
    { label: 'Book Appointment', path: '/patient/book', icon: Calendar },
    { label: 'My Profile', path: '/patient/profile', icon: User },
    { label: 'Medical Reports', path: '/reports', icon: FileText },
    { label: 'Camp Discovery', path: '/camps', icon: Compass },
    { label: 'Notifications', path: '/notifications', icon: Bell },
  ];

  const doctorItems = [
    { label: 'Doctor Dashboard', path: '/doctor', icon: LayoutDashboard },
    { label: 'Patient Queue', path: '/doctor/patients', icon: Users },
    { label: 'Medical Reports', path: '/doctor/reports', icon: FileText },
    { label: 'Medicine Inventory', path: '/inventory', icon: Package },
    { label: 'Camp Schedule', path: '/camps', icon: Calendar },
    { label: 'Notifications', path: '/notifications', icon: Bell },
  ];

  const volunteerItems = [
    { label: 'Volunteer Portal', path: '/volunteer', icon: LayoutDashboard },
    { label: 'Camp Discovery', path: '/camps', icon: Compass },
    { label: 'Notifications', path: '/notifications', icon: Bell },
  ];

  const adminItems = [
    { label: 'Admin Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Camp Management', path: '/admin/camps', icon: Calendar },
    { label: 'User Management', path: '/admin/users', icon: Users },
    { label: 'Analytics & Trends', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Inventory Stock', path: '/inventory', icon: Package },
    { label: 'All Reports', path: '/reports', icon: FileText },
    { label: 'Broadcast Alerts', path: '/notifications', icon: Bell },
  ];

  const getItems = () => {
    switch (role) {
      case 'admin':
        return adminItems;
      case 'doctor':
        return doctorItems;
      case 'volunteer':
        return volunteerItems;
      default:
        return patientItems;
    }
  };

  const navItems = getItems();

  return (
    <aside className="w-64 shrink-0 hidden md:block bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 min-h-[calc(100vh-4rem)] p-4">
      {/* Role Tag */}
      <div className="mb-6 px-3 py-2 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/40 border border-cyan-100 dark:border-cyan-900/40">
        <p className="text-[10px] uppercase font-bold tracking-wider text-cyan-600 dark:text-cyan-400">
          Current Portal
        </p>
        <p className="text-xs font-semibold capitalize text-slate-800 dark:text-slate-200">
          {role} Workspace
        </p>
      </div>

      {/* Nav List */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/patient' || item.path === '/doctor' || item.path === '/volunteer' || item.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;

