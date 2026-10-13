// src/types/index.ts
export type UserRole = 'patient' | 'doctor' | 'volunteer' | 'admin' | 'organizer';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Camp {
  id: string;
  name: string;
  description: string;
  location: string;
  address: string;
  coordinates: { lat: number; lng: number };
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  services: CampService[];
  doctors: Doctor[];
  volunteers: Volunteer[];
  maxCapacity: number;
  registeredCount: number;
  status: CampStatus;
  image?: string;
  organizer: string;
  contactPhone: string;
  contactEmail: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type CampStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export type CampService =
  | 'general_checkup'
  | 'eye_screening'
  | 'dental_checkup'
  | 'blood_test'
  | 'bp_monitoring'
  | 'diabetes_screening'
  | 'cancer_screening'
  | 'child_vaccination'
  | 'nutrition_counseling'
  | 'mental_health'
  | 'physiotherapy'
  | 'gynecology';

export interface Appointment {
  id: string;
  patientId: string;
  campId: string;
  doctorId?: string;
  service: CampService;
  appointmentDate: string;
  timeSlot: string;
  status: AppointmentStatus;
  notes?: string;
  prescription?: string;
  followUpDate?: string;
  qrCode?: string;
  camp?: Camp;
  doctor?: Doctor;
  patient?: PatientProfile;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface PatientProfile {
  id: string;
  userId: string;
  user?: User;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup: BloodGroup;
  height?: number;
  weight?: number;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  emergencyContact: EmergencyContact;
  address: Address;
  medicalHistory: MedicalRecord[];
  appointments: Appointment[];
  createdAt: string;
  updatedAt: string;
}

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface Address {
  street: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
}

export interface Doctor {
  id: string;
  userId: string;
  user?: User;
  specialization: Specialization;
  qualification: string;
  experience: number;
  licenseNumber: string;
  availability: boolean;
  rating: number;
  patientsServed: number;
  camps: string[];
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export type Specialization =
  | 'General Physician'
  | 'Cardiologist'
  | 'Dermatologist'
  | 'Dentist'
  | 'Ophthalmologist'
  | 'Orthopedic'
  | 'Gynecologist'
  | 'Pediatrician'
  | 'Psychiatrist'
  | 'Nutritionist'
  | 'Physiotherapist'
  | 'Diabetologist'
  | 'Oncologist';

export interface Volunteer {
  id: string;
  userId: string;
  user?: User;
  skills: string[];
  availability: boolean;
  campsAttended: number;
  currentCamp?: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalRecord {
  id: string;
  date: string;
  diagnosis: string;
  treatment: string;
  prescription: string;
  doctorName: string;
  campName?: string;
  attachments: string[];
}

export interface MedicalReport {
  id: string;
  patientId: string;
  campId: string;
  doctorId: string;
  appointmentId: string;
  chiefComplaint: string;
  diagnosis: string;
  treatment: string;
  prescription: Prescription[];
  vitals: Vitals;
  notes: string;
  followUpRequired: boolean;
  followUpDate?: string;
  patient?: PatientProfile;
  doctor?: Doctor;
  camp?: Camp;
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Vitals {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  bloodSugar?: number;
  spo2?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  minThreshold: number;
  maxThreshold: number;
  expiryDate?: string;
  supplier?: string;
  cost: number;
  location: string;
  campId?: string;
  status: 'available' | 'low' | 'critical' | 'expired' | 'out_of_stock';
  createdAt: string;
  updatedAt: string;
}

export type InventoryCategory =
  | 'medicine'
  | 'equipment'
  | 'consumables'
  | 'diagnostic'
  | 'personal_protective'
  | 'vaccine'
  | 'first_aid';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type NotificationType =
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'appointment_reminder'
  | 'camp_announced'
  | 'camp_updated'
  | 'medical_report_ready'
  | 'prescription_ready'
  | 'inventory_low'
  | 'general';

export interface AnalyticsData {
  totalCamps: number;
  totalPatients: number;
  totalDoctors: number;
  totalVolunteers: number;
  appointmentsToday: number;
  completedCamps: number;
  upcomingCamps: number;
  patientsByDisease: DiseaseData[];
  campsByMonth: MonthlyData[];
  appointmentsByService: ServiceData[];
  geographicData: GeographicData[];
  satisfactionScore: number;
}

export interface DiseaseData {
  disease: string;
  count: number;
  percentage: number;
}

export interface MonthlyData {
  month: string;
  camps: number;
  patients: number;
  appointments: number;
}

export interface ServiceData {
  service: string;
  count: number;
  percentage: number;
}

export interface GeographicData {
  district: string;
  camps: number;
  patients: number;
  lat: number;
  lng: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface SearchFilters {
  query?: string;
  location?: string;
  service?: CampService;
  startDate?: string;
  endDate?: string;
  status?: CampStatus;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface HealthAwarenessArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  category: string;
  author: string;
  image?: string;
  tags: string[];
  publishedAt: string;
  readTime: number;
}

export interface ContactMessage {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  doctorId?: string;
}

