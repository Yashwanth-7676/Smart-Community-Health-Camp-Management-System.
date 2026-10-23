// src/utils/constants.ts
import type { BloodGroup, CampService, CampStatus, InventoryCategory, Specialization, UserRole } from '@/types';

export const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

export const ROLES: Record<UserRole, string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  volunteer: 'Volunteer',
  admin: 'Administrator',
  organizer: 'Camp Organizer',
};

export const CAMP_STATUS_OPTIONS: { value: CampStatus; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const APPOINTMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
];

export const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const SPECIALIZATIONS: Specialization[] = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Dentist',
  'Ophthalmologist',
  'Orthopedic',
  'Gynecologist',
  'Pediatrician',
  'Psychiatrist',
  'Nutritionist',
  'Physiotherapist',
  'Diabetologist',
  'Oncologist',
];

export const CAMP_SERVICES: { value: CampService; label: string; icon: string }[] = [
  { value: 'general_checkup', label: 'General Checkup', icon: '🩺' },
  { value: 'eye_screening', label: 'Eye Screening', icon: '👁️' },
  { value: 'dental_checkup', label: 'Dental Checkup', icon: '🦷' },
  { value: 'blood_test', label: 'Blood Test', icon: '🩸' },
  { value: 'bp_monitoring', label: 'BP Monitoring', icon: '💓' },
  { value: 'diabetes_screening', label: 'Diabetes Screening', icon: '🍬' },
  { value: 'cancer_screening', label: 'Cancer Screening', icon: '🔬' },
  { value: 'child_vaccination', label: 'Child Vaccination', icon: '💉' },
  { value: 'nutrition_counseling', label: 'Nutrition Counseling', icon: '🥦' },
  { value: 'mental_health', label: 'Mental Health', icon: '🧠' },
  { value: 'physiotherapy', label: 'Physiotherapy', icon: '🦿' },
  { value: 'gynecology', label: 'Gynecology', icon: '🌸' },
];

export const INVENTORY_CATEGORIES: { value: InventoryCategory; label: string }[] = [
  { value: 'medicine', label: 'Medicine' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'consumables', label: 'Consumables' },
  { value: 'diagnostic', label: 'Diagnostic' },
  { value: 'personal_protective', label: 'Personal Protective' },
  { value: 'vaccine', label: 'Vaccine' },
  { value: 'first_aid', label: 'First Aid' },
];

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const RELATION_OPTIONS = [
  'Spouse',
  'Parent',
  'Child',
  'Sibling',
  'Friend',
  'Guardian',
  'Other',
];

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

export const KARNATAKA_DISTRICTS = [
  'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban',
  'Bidar', 'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga',
  'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 'Haveri',
  'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal', 'Mandya', 'Mysuru', 'Raichur',
  'Ramanagara', 'Shivamogga', 'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayapura', 'Yadgir',
];

export const TIME_SLOTS = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM',
];

export const PAGINATION_LIMITS = [10, 20, 50, 100];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const LOCAL_STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER: 'auth_user',
  THEME: 'app_theme',
  LANGUAGE: 'app_language',
  OFFLINE_QUEUE: 'healthcamp_offline_queue',
};

export const NAV_LINKS = {
  public: [
    { path: '/', label: 'Home' },
    { path: '/camps', label: 'Camps' },
    { path: '/health-awareness', label: 'Health Awareness' },
    { path: '/contact', label: 'Contact' },
  ],
  patient: [
    { path: '/patient/dashboard', label: 'Dashboard' },
    { path: '/patient/appointments', label: 'Appointments' },
    { path: '/patient/profile', label: 'Profile' },
    { path: '/camps', label: 'Find Camps' },
  ],
  doctor: [
    { path: '/doctor/dashboard', label: 'Dashboard' },
    { path: '/doctor/patients', label: 'Patients' },
    { path: '/doctor/reports', label: 'Reports' },
  ],
  volunteer: [
    { path: '/volunteer/dashboard', label: 'Dashboard' },
    { path: '/camps', label: 'Camps' },
  ],
  admin: [
    { path: '/admin/dashboard', label: 'Dashboard' },
    { path: '/admin/camps', label: 'Manage Camps' },
    { path: '/admin/users', label: 'Users' },
    { path: '/admin/analytics', label: 'Analytics' },
    { path: '/inventory', label: 'Inventory' },
    { path: '/reports', label: 'Reports' },
  ],
};

