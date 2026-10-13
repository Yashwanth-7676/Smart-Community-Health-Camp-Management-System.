// backend/src/utils/mockStore.ts
import bcrypt from 'bcryptjs';

export function isDbConnectionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { name?: string; message?: string };
  if (err.name === 'PrismaClientInitializationError') return true;
  if (typeof err.message === 'string') {
    return (
      err.message.includes("Can't reach database server") ||
      err.message.includes('Connection refused') ||
      err.message.includes('database server is running at') ||
      err.message.includes('P1001')
    );
  }
  return false;
}

export interface DemoUser {
  id: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'DOCTOR' | 'VOLUNTEER' | 'PATIENT';
  firstName: string;
  lastName: string;
  phone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  patientProfile?: Record<string, unknown>;
  doctorProfile?: Record<string, unknown>;
  volunteerProfile?: Record<string, unknown>;
}

// Pre-hashed passwords using bcrypt (all passwords are Role@123 or Patient@123)
const DEFAULT_HASH = bcrypt.hashSync('Patient@123', 10);
const ADMIN_HASH = bcrypt.hashSync('Admin@123', 10);
const DOCTOR_HASH = bcrypt.hashSync('Doctor@123', 10);
const VOLUNTEER_HASH = bcrypt.hashSync('Volunteer@123', 10);

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'user-admin-1',
    email: 'admin@healthcamp.com',
    passwordHash: ADMIN_HASH,
    role: 'ADMIN',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    phone: '+91-9876543210',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'user-doctor-1',
    email: 'doctor1@healthcamp.com',
    passwordHash: DOCTOR_HASH,
    role: 'DOCTOR',
    firstName: 'Priya',
    lastName: 'Sharma',
    phone: '+91-9876543211',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    doctorProfile: {
      id: 'doc-prof-1',
      specialization: 'General Medicine',
      licenseNumber: 'KMC/2015/12345',
      experience: 8,
      assignedCamps: [
        { id: 'camp-1', name: 'Koramangala Community Health Camp', location: 'Koramangala', status: 'UPCOMING' },
        { id: 'camp-2', name: 'Indiranagar Health Awareness Camp', location: 'Indiranagar', status: 'ONGOING' },
      ],
    },
  },
  {
    id: 'user-volunteer-1',
    email: 'volunteer1@healthcamp.com',
    passwordHash: VOLUNTEER_HASH,
    role: 'VOLUNTEER',
    firstName: 'Suresh',
    lastName: 'Patel',
    phone: '+91-9876543214',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    volunteerProfile: {
      id: 'vol-prof-1',
      skills: ['First Aid', 'Patient Registration', 'BP Check'],
      assignedCamp: {
        id: 'camp-1',
        name: 'Koramangala Community Health Camp',
        location: 'Koramangala',
        status: 'UPCOMING',
      },
    },
  },
  {
    id: 'user-patient-1',
    email: 'patient1@healthcamp.com',
    passwordHash: DEFAULT_HASH,
    role: 'PATIENT',
    firstName: 'Kavitha',
    lastName: 'Reddy',
    phone: '+91-9876543217',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    patientProfile: {
      id: 'pat-prof-1',
      dateOfBirth: '1985-06-15',
      gender: 'FEMALE',
      bloodGroup: 'B_POSITIVE',
      address: 'No. 12, 3rd Cross, Koramangala, Bangalore - 560034',
      medicalHistory: 'Type 2 Diabetes diagnosed in 2020. Regular medication ongoing.',
      allergies: ['Penicillin', 'Sulfa drugs'],
      emergencyContact: {
        name: 'Suresh Reddy',
        relationship: 'Husband',
        phone: '+91-9876543300',
      },
    },
  },
];

export const DEMO_CAMPS = [
  {
    id: 'camp-1',
    name: 'Koramangala Community Health Camp',
    location: 'Koramangala, Bangalore',
    address: '80 Feet Road, Koramangala 4th Block, Bangalore - 560034',
    latitude: 12.9352,
    longitude: 77.6245,
    startDate: new Date('2026-11-01T08:00:00Z'),
    endDate: new Date('2026-11-03T18:00:00Z'),
    capacity: 200,
    registered: 45,
    status: 'UPCOMING',
    services: ['General Medicine', 'Dental', 'Eye Care', 'Blood Tests', 'BP Check', 'Diabetes Screening'],
    description: 'A comprehensive health camp offering free medical checkups, eye screenings, and tests to residents.',
    createdBy: { id: 'user-admin-1', firstName: 'Rajesh', lastName: 'Kumar', email: 'admin@healthcamp.com' },
    _count: { appointments: 45, inventory: 12 },
  },
  {
    id: 'camp-2',
    name: 'Indiranagar Health Awareness Camp',
    location: 'Indiranagar, Bangalore',
    address: '100 Feet Road, Indiranagar, Bangalore - 560038',
    latitude: 12.9784,
    longitude: 77.6408,
    startDate: new Date('2026-10-15T08:00:00Z'),
    endDate: new Date('2026-10-20T18:00:00Z'),
    capacity: 150,
    registered: 112,
    status: 'ONGOING',
    services: ['General Medicine', 'Gynecology', 'Pediatrics', 'Nutrition Counseling', 'Mental Health'],
    description: 'Health awareness camp focused on maternal and child health with specialist consultations.',
    createdBy: { id: 'user-admin-1', firstName: 'Rajesh', lastName: 'Kumar', email: 'admin@healthcamp.com' },
    _count: { appointments: 112, inventory: 18 },
  },
  {
    id: 'camp-3',
    name: 'Jayanagar Free Medical Camp',
    location: 'Jayanagar, Bangalore',
    address: '4th Block, Jayanagar, Bangalore - 560011',
    latitude: 12.9308,
    longitude: 77.5838,
    startDate: new Date('2026-09-01T08:00:00Z'),
    endDate: new Date('2026-09-03T18:00:00Z'),
    capacity: 100,
    registered: 98,
    status: 'COMPLETED',
    services: ['Cardiology', 'Orthopedics', 'General Medicine', 'ECG', 'X-Ray'],
    description: 'Specialized cardiac and orthopedic camp for senior citizens and local residents.',
    createdBy: { id: 'user-admin-1', firstName: 'Rajesh', lastName: 'Kumar', email: 'admin@healthcamp.com' },
    _count: { appointments: 98, inventory: 8 },
  },
  {
    id: 'camp-4',
    name: 'Whitefield Digital Health Camp',
    location: 'Whitefield, Bangalore',
    address: 'Hope Farm Junction, Whitefield, Bangalore - 560066',
    latitude: 12.9698,
    longitude: 77.7499,
    startDate: new Date('2026-12-01T08:00:00Z'),
    endDate: new Date('2026-12-05T18:00:00Z'),
    capacity: 300,
    registered: 35,
    status: 'UPCOMING',
    services: ['Telemedicine', 'Diabetes Care', 'Hypertension', 'Dermatology', 'ENT', 'Ophthalmology'],
    description: 'Smart tech-driven health camp featuring digital check-in and queue token notifications.',
    createdBy: { id: 'user-admin-1', firstName: 'Rajesh', lastName: 'Kumar', email: 'admin@healthcamp.com' },
    _count: { appointments: 35, inventory: 15 },
  },
];

export const DEMO_APPOINTMENTS = [
  {
    id: 'appt-1',
    patientId: 'user-patient-1',
    campId: 'camp-1',
    doctorId: 'user-doctor-1',
    date: new Date('2026-11-01'),
    timeSlot: '09:00 AM',
    status: 'CONFIRMED',
    queueToken: 'KRM-001',
    notes: 'Diabetes routine follow-up',
    patient: { id: 'user-patient-1', firstName: 'Kavitha', lastName: 'Reddy', email: 'patient1@healthcamp.com', phone: '+91-9876543217' },
    camp: { id: 'camp-1', name: 'Koramangala Community Health Camp', location: 'Koramangala' },
    doctor: { id: 'user-doctor-1', firstName: 'Priya', lastName: 'Sharma' },
    queueTokenRef: { id: 'token-1', tokenNumber: 1, status: 'WAITING' },
  },
];

export const DEMO_INVENTORY = [
  {
    id: 'inv-1',
    campId: 'camp-1',
    medicineName: 'Paracetamol 500mg',
    genericName: 'Acetaminophen',
    quantity: 500,
    unit: 'tablets',
    expiryDate: new Date('2027-12-31'),
    lowStockThreshold: 50,
    supplier: 'Sun Pharma',
    camp: { id: 'camp-1', name: 'Koramangala Community Health Camp' },
  },
  {
    id: 'inv-2',
    campId: 'camp-1',
    medicineName: 'Metformin 500mg',
    genericName: 'Metformin HCl',
    quantity: 200,
    unit: 'tablets',
    expiryDate: new Date('2027-06-30'),
    lowStockThreshold: 30,
    supplier: 'Cipla',
    camp: { id: 'camp-1', name: 'Koramangala Community Health Camp' },
  },
  {
    id: 'inv-3',
    campId: 'camp-1',
    medicineName: 'ORS Sachet',
    genericName: 'Oral Rehydration Salts',
    quantity: 12,
    unit: 'sachets',
    expiryDate: new Date('2026-12-31'),
    lowStockThreshold: 20,
    supplier: 'Electroral',
    camp: { id: 'camp-1', name: 'Koramangala Community Health Camp' },
  },
];

export const DEMO_REPORTS = [
  {
    id: 'rep-1',
    patientId: 'user-patient-1',
    doctorId: 'user-doctor-1',
    campId: 'camp-2',
    diagnosis: 'Type 2 Diabetes Mellitus - Controlled',
    prescription: 'Metformin 500mg BD after meals. Continue lifestyle modification.',
    observations: 'Fasting Blood Sugar: 118 mg/dL. BP: 120/80 mmHg. Good glycemic control.',
    referral: null,
    isConfidential: false,
    createdAt: new Date('2026-10-16'),
    patient: { id: 'user-patient-1', firstName: 'Kavitha', lastName: 'Reddy', email: 'patient1@healthcamp.com' },
    doctor: { id: 'user-doctor-1', firstName: 'Priya', lastName: 'Sharma' },
    camp: { id: 'camp-2', name: 'Indiranagar Health Awareness Camp' },
  },
];

