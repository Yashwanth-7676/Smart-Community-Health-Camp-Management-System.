// src/App.tsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from '@/components/layout/PublicLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Pages
import Home from '@/pages/Home';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import CampDiscovery from '@/pages/camps/CampDiscovery';
import CampDetail from '@/pages/camps/CampDetail';
import HealthAwareness from '@/pages/HealthAwareness';
import Contact from '@/pages/Contact';
import AccessDenied from '@/components/common/AccessDenied';

// Lazy Loaded Portal Pages
const PatientDashboard = lazy(() => import('@/pages/patient/PatientDashboard'));
const AppointmentBooking = lazy(() => import('@/pages/patient/AppointmentBooking'));
const PatientProfile = lazy(() => import('@/pages/patient/PatientProfile'));
const DoctorDashboard = lazy(() => import('@/pages/doctor/DoctorDashboard'));
const DoctorPatients = lazy(() => import('@/pages/doctor/DoctorPatients'));
const DoctorReports = lazy(() => import('@/pages/doctor/DoctorReports'));
const VolunteerDashboard = lazy(() => import('@/pages/volunteer/VolunteerDashboard'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminCamps = lazy(() => import('@/pages/admin/AdminCamps'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics'));
const Inventory = lazy(() => import('@/pages/Inventory'));
const Reports = lazy(() => import('@/pages/Reports'));
const Notifications = lazy(() => import('@/pages/Notifications'));

export const App: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen text="Loading application..." />}>
      <Routes>
        {/* Public Routes with Public Layout */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/camps" element={<CampDiscovery />} />
          <Route path="/camps/:id" element={<CampDetail />} />
          <Route path="/awareness" element={<HealthAwareness />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/access-denied" element={<AccessDenied />} />
        </Route>

        {/* Protected Dashboard Routes with Dashboard Layout */}
        <Route element={<DashboardLayout />}>
          {/* Patient Portal */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/book"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <AppointmentBooking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/profile"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientProfile />
              </ProtectedRoute>
            }
          />

          {/* Doctor Portal */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients"
            element={
              <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                <DoctorPatients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/reports"
            element={
              <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                <DoctorReports />
              </ProtectedRoute>
            }
          />

          {/* Volunteer Portal */}
          <Route
            path="/volunteer"
            element={
              <ProtectedRoute allowedRoles={['volunteer', 'admin']}>
                <VolunteerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Portal */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/camps"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminCamps />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAnalytics />
              </ProtectedRoute>
            }
          />

          {/* Shared Portals */}
          <Route
            path="/inventory"
            element={
              <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                <Inventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;

