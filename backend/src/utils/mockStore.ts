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
  {
    id: 'camp-5',
    name: 'Mysuru Heritage Free Health Screening',
    location: 'Mysuru, Karnataka',
    address: 'Sayyaji Rao Road, Nazarbad, Mysuru - 570010',
    latitude: 12.3051,
    longitude: 76.6552,
    startDate: new Date('2026-11-10T08:30:00Z'),
    endDate: new Date('2026-11-12T17:30:00Z'),
    capacity: 250,
    registered: 80,
    status: 'UPCOMING',
    services: ['General Medicine', 'Cardiology', 'Ayush Consultations', 'Blood Tests', 'Geriatric Care'],
    description: 'Community outreach screening camp in historic Mysuru focused on senior care and cardiovascular vitals.',
    createdBy: { id: 'user-admin-1', firstName: 'Rajesh', lastName: 'Kumar', email: 'admin@healthcamp.com' },
    _count: { appointments: 80, inventory: 14 },
  },
  {
    id: 'camp-6',
    name: 'Mangaluru Coastal Preventive Health Camp',
    location: 'Mangaluru, Karnataka',
    address: 'KS Rao Road, Hampankatta, Mangaluru - 575001',
    latitude: 12.8703,
    longitude: 74.8436,
    startDate: new Date('2026-10-18T08:00:00Z'),
    endDate: new Date('2026-10-24T18:00:00Z'),
    capacity: 200,
    registered: 142,
    status: 'ONGOING',
    services: ['General Medicine', 'Dermatology', 'Pediatrics', 'Dental', 'Tropical Disease Screening'],
    description: 'Coastal Karnataka medical screening camp for seasonal fevers, dermatology, and pediatric health.',
    createdBy: { id: 'user-admin-1', firstName: 'Rajesh', lastName: 'Kumar', email: 'admin@healthcamp.com' },
    _count: { appointments: 142, inventory: 22 },
  },
  {
    id: 'camp-7',
    name: 'Hubballi-Dharwad Industrial Belt Camp',
    location: 'Hubballi, Karnataka',
    address: 'Vidyanagar Main Road, Hubballi - 580021',
    latitude: 15.3647,
    longitude: 75.1240,
    startDate: new Date('2026-11-15T09:00:00Z'),
    endDate: new Date('2026-11-17T17:00:00Z'),
    capacity: 180,
    registered: 65,
    status: 'UPCOMING',
    services: ['Occupational Health', 'Pulmonology', 'Eye Care', 'Audiometry', 'General Medicine'],
    description: 'North Karnataka industrial zone health camp checking respiratory and vision health for workers and families.',
    createdBy: { id: 'user-admin-1', firstName: 'Rajesh', lastName: 'Kumar', email: 'admin@healthcamp.com' },
    _count: { appointments: 65, inventory: 10 },
  },
  {
    id: 'camp-8',
    name: 'Belagavi Rural Outreach Health Mission',
    location: 'Belagavi, Karnataka',
    address: 'Congress Road, Tilakwadi, Belagavi - 590006',
    latitude: 15.8497,
    longitude: 74.4977,
    startDate: new Date('2026-11-20T08:30:00Z'),
    endDate: new Date('2026-11-22T17:30:00Z'),
    capacity: 150,
    registered: 40,
    status: 'UPCOMING',
    services: ['General Medicine', 'Orthopedics', 'Women & Child Health', 'Dental Care'],
    description: 'Border district health mission providing specialized care to rural villages surrounding Belagavi.',
    createdBy: { id: 'user-admin-1', firstName: 'Rajesh', lastName: 'Kumar', email: 'admin@healthcamp.com' },
    _count: { appointments: 40, inventory: 9 },
  },
  {
    id: 'camp-9',
    name: 'Ballari Community Health Camp',
    location: 'Ballari, Karnataka',
    address: 'Infantry Road, Cantonment, Ballari - 583101',
    latitude: 15.1394,
    longitude: 76.9214,
    startDate: new Date('2026-11-05T08:00:00Z'),
    endDate: new Date('2026-11-07T18:00:00Z'),
    capacity: 120,
    registered: 120,
    status: 'UPCOMING',
    services: ['General Medicine', 'Hematology', 'Eye Screening', 'Dental', 'Anemia Screening'],
    description: 'Nutritional and hematological screening camp with special focus on micronutrient and anemia prevention.',
    createdBy: { id: 'user-admin-1', firstName: 'Rajesh', lastName: 'Kumar', email: 'admin@healthcamp.com' },
    _count: { appointments: 120, inventory: 16 },
  },
  {
    id: 'camp-10',
    name: 'Kalaburagi Kalyan Karnataka Medical Camp',
    location: 'Kalaburagi, Karnataka',
    address: 'Super Market Road, Kalaburagi - 585101',
    latitude: 17.3297,
    longitude: 76.8343,
    startDate: new Date('2026-11-25T08:30:00Z'),
    endDate: new Date('2026-11-27T17:30:00Z'),
    capacity: 220,
    registered: 30,
    status: 'UPCOMING',
    services: ['General Medicine', 'Cardiology', 'Diabetes Care', 'Pediatrics'],
    description: 'Free healthcare camp providing primary care and cardiovascular consultation in Hyderabad-Karnataka region.',
    createdBy: { id: 'user-admin-1', firstName: 'Rajesh', lastName: 'Kumar', email: 'admin@healthcamp.com' },
    _count: { appointments: 30, inventory: 11 },
  },
  {
    id: 'camp-11',
    name: 'Shivamogga Malnad Health Initiative',
    location: 'Shivamogga, Karnataka',
    address: 'Nehru Stadium Grounds, Shivamogga - 577201',
    latitude: 13.9299,
    longitude: 75.5681,
    startDate: new Date('2026-12-05T08:00:00Z'),
    endDate: new Date('2026-12-07T17:00:00Z'),
    capacity: 160,
    registered: 20,
    status: 'UPCOMING',
    services: ['General Medicine', 'Ophthalmology', 'Dental', 'Physiotherapy'],
    description: 'Malnad regional community health camp offering comprehensive primary checkups and eye tests.',
    createdBy: { id: 'user-admin-1', firstName: 'Rajesh', lastName: 'Kumar', email: 'admin@healthcamp.com' },
    _count: { appointments: 20, inventory: 8 },
  },
  {
    id: 'camp-12',
    name: 'Hyderabad Urban Health Camp',
    location: 'Hyderabad, Telangana',
    address: 'Abids Road, Near GPO, Hyderabad - 500001',
    latitude: 17.3850,
    longitude: 78.4867,
    startDate: new Date('2026-11-18T08:30:00Z'),
    endDate: new Date('2026-11-20T17:30:00Z'),
    capacity: 250,
    registered: 95,
    status: 'UPCOMING',
    services: ['Cardiology', 'Diabetes Screening', 'General Medicine', 'Nephrology Consult'],
    description: 'Inter-state community health screening camp offering diabetes and hypertension testing.',
    createdBy: { id: 'user-admin-1', firstName: 'Rajesh', lastName: 'Kumar', email: 'admin@healthcamp.com' },
    _count: { appointments: 95, inventory: 18 },
  },
  {
    id: 'camp-13',
    name: 'Mumbai Chembur Health & Wellness Camp',
    location: 'Mumbai, Maharashtra',
    address: 'Station Road, Chembur East, Mumbai - 400071',
    latitude: 19.0620,
    longitude: 72.8997,
    startDate: new Date('2026-10-16T08:00:00Z'),
    endDate: new Date('2026-10-22T18:00:00Z'),
    capacity: 300,
    registered: 210,
    status: 'ONGOING',
    services: ['General Medicine', 'Pulmonology', 'Pediatrics', 'Dental', 'ECG'],
    description: 'Multi-specialty urban outreach clinic serving suburban community members in Mumbai.',
    createdBy: { id: 'user-admin-1', firstName: 'Rajesh', lastName: 'Kumar', email: 'admin@healthcamp.com' },
    _count: { appointments: 210, inventory: 25 },
  },
  {
    id: 'camp-14',
    name: 'Delhi NCR Preventive Health Mission',
    location: 'New Delhi, Delhi',
    address: 'Pusa Road, Karol Bagh, New Delhi - 110005',
    latitude: 28.6517,
    longitude: 77.1906,
    startDate: new Date('2026-11-28T09:00:00Z'),
    endDate: new Date('2026-11-30T17:00:00Z'),
    capacity: 250,
    registered: 50,
    status: 'UPCOMING',
    services: ['Respiratory Care', 'Cardiology', 'General Medicine', 'Allergy Panel'],
    description: 'Northern outreach preventive health screening camp focusing on winter respiratory wellness.',
    createdBy: { id: 'user-admin-1', firstName: 'Rajesh', lastName: 'Kumar', email: 'admin@healthcamp.com' },
    _count: { appointments: 50, inventory: 15 },
  },
  {
    id: 'camp-15',
    name: 'Chennai Central Health Camp',
    location: 'Chennai, Tamil Nadu',
    address: 'Usman Road, T. Nagar, Chennai - 600017',
    latitude: 13.0418,
    longitude: 80.2341,
    startDate: new Date('2026-10-10T08:00:00Z'),
    endDate: new Date('2026-10-12T18:00:00Z'),
    capacity: 100,
    registered: 20,
    status: 'CANCELLED',
    services: ['General Medicine', 'Ophthalmology', 'Dental'],
    description: 'Rescheduled health screening camp due to facility maintenance.',
    createdBy: { id: 'user-admin-1', firstName: 'Rajesh', lastName: 'Kumar', email: 'admin@healthcamp.com' },
    _count: { appointments: 20, inventory: 0 },
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

export interface DemoFollowUp {
  id: string;
  patientId: string;
  doctorId: string;
  campId: string;
  scheduledDate: Date;
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'MISSED';
  notes?: string;
  priority: 'ROUTINE' | 'URGENT' | 'HIGH';
  consentGranted: boolean;
  notificationDeliveryStatus: 'PENDING_CONFIRMATION' | 'DELIVERED' | 'FAILED' | 'NOT_SENT';
  retryCount: number;
  lastAttemptAt?: Date;
  patient?: { id: string; firstName: string; lastName: string; phone?: string; email: string };
  doctor?: { id: string; firstName: string; lastName: string };
  camp?: { id: string; name: string; location: string };
  createdAt: Date;
  updatedAt: Date;
}

export const DEMO_FOLLOW_UPS: DemoFollowUp[] = [
  {
    id: 'fu-1',
    patientId: 'user-patient-1',
    doctorId: 'user-doctor-1',
    campId: 'camp-1',
    scheduledDate: new Date(Date.now() + 5 * 86400000), // +5 days
    status: 'SCHEDULED',
    notes: 'Review HbA1c lab report and titrate Metformin dosage if needed.',
    priority: 'HIGH',
    consentGranted: true,
    notificationDeliveryStatus: 'DELIVERED',
    retryCount: 0,
    lastAttemptAt: new Date(Date.now() - 3600000),
    patient: { id: 'user-patient-1', firstName: 'Kavitha', lastName: 'Reddy', email: 'patient1@healthcamp.com', phone: '+91-9876543217' },
    doctor: { id: 'user-doctor-1', firstName: 'Priya', lastName: 'Sharma' },
    camp: { id: 'camp-1', name: 'Koramangala Community Health Camp', location: 'Koramangala' },
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 3600000),
  },
  {
    id: 'fu-2',
    patientId: 'user-patient-1',
    doctorId: 'user-doctor-1',
    campId: 'camp-2',
    scheduledDate: new Date(Date.now() - 2 * 86400000), // -2 days
    status: 'MISSED',
    notes: 'Hypertension follow-up visit. Patient did not attend scheduled check-in.',
    priority: 'URGENT',
    consentGranted: true,
    notificationDeliveryStatus: 'FAILED',
    retryCount: 2,
    lastAttemptAt: new Date(Date.now() - 7200000),
    patient: { id: 'user-patient-1', firstName: 'Kavitha', lastName: 'Reddy', email: 'patient1@healthcamp.com', phone: '+91-9876543217' },
    doctor: { id: 'user-doctor-1', firstName: 'Priya', lastName: 'Sharma' },
    camp: { id: 'camp-2', name: 'Indiranagar Health Awareness Camp', location: 'Indiranagar' },
    createdAt: new Date(Date.now() - 3 * 86400000),
    updatedAt: new Date(Date.now() - 7200000),
  },
  {
    id: 'fu-3',
    patientId: 'user-patient-1',
    doctorId: 'user-doctor-1',
    campId: 'camp-3',
    scheduledDate: new Date(Date.now() - 10 * 86400000),
    status: 'COMPLETED',
    notes: 'Post-ophthalmology eye drop titration completed. Vision acuity stable at 6/9.',
    priority: 'ROUTINE',
    consentGranted: true,
    notificationDeliveryStatus: 'DELIVERED',
    retryCount: 0,
    lastAttemptAt: new Date(Date.now() - 10 * 86400000),
    patient: { id: 'user-patient-1', firstName: 'Kavitha', lastName: 'Reddy', email: 'patient1@healthcamp.com', phone: '+91-9876543217' },
    doctor: { id: 'user-doctor-1', firstName: 'Priya', lastName: 'Sharma' },
    camp: { id: 'camp-3', name: 'Jayanagar Free Medical Camp', location: 'Jayanagar' },
    createdAt: new Date(Date.now() - 12 * 86400000),
    updatedAt: new Date(Date.now() - 10 * 86400000),
  },
];

export interface DemoNotificationAttempt {
  id: string;
  followUpId: string;
  attemptNumber: number;
  channel: 'SMS' | 'EMAIL' | 'IN_APP';
  recipientMasked: string;
  status: 'DELIVERED' | 'FAILED' | 'PENDING_CONFIRMATION';
  providerMessageId: string;
  failureReason?: string;
  timestamp: Date;
}

export const DEMO_NOTIFICATION_HISTORY: DemoNotificationAttempt[] = [
  {
    id: 'notif-att-1',
    followUpId: 'fu-1',
    attemptNumber: 1,
    channel: 'SMS',
    recipientMasked: '+91-98****3217',
    status: 'DELIVERED',
    providerMessageId: 'SMS-GATEWAY-IN-98124',
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: 'notif-att-2',
    followUpId: 'fu-2',
    attemptNumber: 1,
    channel: 'SMS',
    recipientMasked: '+91-98****3217',
    status: 'FAILED',
    providerMessageId: 'SMS-GATEWAY-IN-98011',
    failureReason: 'Carrier network unreachable (Error 408: Subscriber temporary outage)',
    timestamp: new Date(Date.now() - 14400000),
  },
  {
    id: 'notif-att-3',
    followUpId: 'fu-2',
    attemptNumber: 2,
    channel: 'EMAIL',
    recipientMasked: 'p***1@healthcamp.com',
    status: 'FAILED',
    providerMessageId: 'SMTP-BOUNCE-319',
    failureReason: 'Recipient mailbox quota exceeded',
    timestamp: new Date(Date.now() - 7200000),
  },
];

export interface DemoInventoryTransfer {
  id: string;
  fromCampId: string;
  toCampId: string;
  medicineName: string;
  batchNumber: string;
  quantity: number;
  reason: string;
  type: 'TRANSFER' | 'ADJUSTMENT' | 'WRITE_OFF';
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  requestedById: string;
  approvedById?: string;
  rejectionReason?: string;
  requestedBy?: { id: string; firstName: string; lastName: string; role: string };
  approvedBy?: { id: string; firstName: string; lastName: string; role: string };
  fromCamp?: { id: string; name: string };
  toCamp?: { id: string; name: string };
  createdAt: Date;
  updatedAt: Date;
}

export const DEMO_INVENTORY_TRANSFERS: DemoInventoryTransfer[] = [
  {
    id: 'trf-1',
    fromCampId: 'camp-1',
    toCampId: 'camp-2',
    medicineName: 'Paracetamol 500mg',
    batchNumber: 'BAT-2026-08',
    quantity: 150,
    reason: 'Emergency surge in viral fever screenings at Indiranagar Camp.',
    type: 'TRANSFER',
    status: 'APPROVED',
    requestedById: 'user-doctor-1',
    approvedById: 'user-admin-1',
    requestedBy: { id: 'user-doctor-1', firstName: 'Priya', lastName: 'Sharma', role: 'DOCTOR' },
    approvedBy: { id: 'user-admin-1', firstName: 'Rajesh', lastName: 'Kumar', role: 'ADMIN' },
    fromCamp: { id: 'camp-1', name: 'Koramangala Community Health Camp' },
    toCamp: { id: 'camp-2', name: 'Indiranagar Health Awareness Camp' },
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 72000000),
  },
  {
    id: 'trf-2',
    fromCampId: 'camp-2',
    toCampId: 'camp-4',
    medicineName: 'ORS Sachet',
    batchNumber: 'BAT-2026-03',
    quantity: 50,
    reason: 'Inter-camp stock rebalance for upcoming heatwave hydration station.',
    type: 'TRANSFER',
    status: 'PENDING_APPROVAL',
    requestedById: 'user-doctor-1',
    requestedBy: { id: 'user-doctor-1', firstName: 'Priya', lastName: 'Sharma', role: 'DOCTOR' },
    fromCamp: { id: 'camp-2', name: 'Indiranagar Health Awareness Camp' },
    toCamp: { id: 'camp-4', name: 'Whitefield Digital Health Camp' },
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date(Date.now() - 3600000),
  },
];

export interface DemoSecurityAlert {
  id: string;
  type: 'BRUTE_FORCE_SUSPECTED' | 'UNUSUAL_ACCESS_PATTERN' | 'UNAUTHORIZED_RECORD_ACCESS' | 'BULK_EXPORT_DETECTED';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  targetEntity: string;
  sourceIp: string;
  actorUserId?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedById?: string;
  timestamp: Date;
}

export const DEMO_SECURITY_ALERTS: DemoSecurityAlert[] = [
  {
    id: 'sec-alert-1',
    type: 'BRUTE_FORCE_SUSPECTED',
    severity: 'HIGH',
    title: 'Repeated Failed Login Surge Detected',
    description: '5 consecutive authentication failures within 3 minutes targeting user account admin@healthcamp.com.',
    targetEntity: 'Auth::Login',
    sourceIp: '192.168.1.104',
    resolved: false,
    timestamp: new Date(Date.now() - 1800000),
  },
  {
    id: 'sec-alert-2',
    type: 'UNUSUAL_ACCESS_PATTERN',
    severity: 'MEDIUM',
    title: 'Off-Hours Administrative Privilege Verification',
    description: 'Administrative role permission review initiated outside scheduled operational clinic hours (02:15 AM).',
    targetEntity: 'Admin::Roles',
    sourceIp: '10.0.4.12',
    actorUserId: 'user-admin-1',
    resolved: true,
    resolvedAt: new Date(Date.now() - 3600000),
    resolvedById: 'user-admin-1',
    timestamp: new Date(Date.now() - 86400000),
  },
];

export interface DemoDigitalTwinArea {
  areaId: string;
  areaName: string;
  district: string;
  coordinates: {
    lat: number;
    lng: number;
    elevation3D: number;
  };
  totalCamps: number;
  historicalAttendance: number;
  estimatedAttendance: number;
  isEstimate: boolean;
  estimationConfidence: number;
  estimationModel: string;
  screeningCoverageRate: number; // percentage
  healthIndex: number; // 0-100 composite
  resourceUtilizationRate: number; // percentage
  topHealthConcerns: Array<{ name: string; percentage: number }>;
  activeDoctorsAssigned: number;
  criticalMedicineAvailabilityRate: number;
  privacyThresholdMet: boolean;
  minimumAggregationCount: number;
}

export const DEMO_DIGITAL_TWIN_AREAS: DemoDigitalTwinArea[] = [
  {
    areaId: 'area-doddaballapura',
    areaName: 'Doddaballapura Rural Belt',
    district: 'Bengaluru Rural',
    coordinates: { lat: 13.2924, lng: 77.5428, elevation3D: 1.4 },
    totalCamps: 8,
    historicalAttendance: 1420,
    estimatedAttendance: 1850,
    isEstimate: true,
    estimationConfidence: 91,
    estimationModel: 'Poisson Seasonal Rural Intake Regression v2.1',
    screeningCoverageRate: 68.4,
    healthIndex: 74,
    resourceUtilizationRate: 84.2,
    topHealthConcerns: [
      { name: 'Hypertension', percentage: 32 },
      { name: 'Type 2 Diabetes Risk', percentage: 24 },
      { name: 'Visual Refraction Deficit', percentage: 16 },
      { name: 'Joint & Musculoskeletal', percentage: 12 },
    ],
    activeDoctorsAssigned: 12,
    criticalMedicineAvailabilityRate: 88.5,
    privacyThresholdMet: true,
    minimumAggregationCount: 1420,
  },
  {
    areaId: 'area-koramangala',
    areaName: 'Koramangala Community Zone',
    district: 'Bengaluru South',
    coordinates: { lat: 12.9352, lng: 77.6245, elevation3D: 2.1 },
    totalCamps: 12,
    historicalAttendance: 2150,
    estimatedAttendance: 2400,
    isEstimate: true,
    estimationConfidence: 94,
    estimationModel: 'Urban Density Moving Average v3.0',
    screeningCoverageRate: 82.1,
    healthIndex: 88,
    resourceUtilizationRate: 91.0,
    topHealthConcerns: [
      { name: 'Sedentary Lifestyle Stress', percentage: 29 },
      { name: 'Dyslipidemia / Lipid Panel', percentage: 22 },
      { name: 'Vitamin D Deficiency', percentage: 18 },
      { name: 'Hypertension', percentage: 15 },
    ],
    activeDoctorsAssigned: 18,
    criticalMedicineAvailabilityRate: 96.0,
    privacyThresholdMet: true,
    minimumAggregationCount: 2150,
  },
  {
    areaId: 'area-nelamangala',
    areaName: 'Nelamangala Outreach Corridor',
    district: 'Bengaluru Rural',
    coordinates: { lat: 13.0973, lng: 77.3878, elevation3D: 1.1 },
    totalCamps: 6,
    historicalAttendance: 980,
    estimatedAttendance: 1300,
    isEstimate: true,
    estimationConfidence: 87,
    estimationModel: 'Sparse Demographic Extrapolation v1.8',
    screeningCoverageRate: 54.2,
    healthIndex: 69,
    resourceUtilizationRate: 76.5,
    topHealthConcerns: [
      { name: 'Iron Deficiency Anemia', percentage: 27 },
      { name: 'Hypertension', percentage: 25 },
      { name: 'Dental Caries', percentage: 21 },
      { name: 'Pediatric Growth Monitoring', percentage: 14 },
    ],
    activeDoctorsAssigned: 8,
    criticalMedicineAvailabilityRate: 82.0,
    privacyThresholdMet: true,
    minimumAggregationCount: 980,
  },
  {
    areaId: 'area-devanahalli',
    areaName: 'Devanahalli Taluk Cluster',
    district: 'Bengaluru North',
    coordinates: { lat: 13.2483, lng: 77.7126, elevation3D: 1.25 },
    totalCamps: 5,
    historicalAttendance: 820,
    estimatedAttendance: 1150,
    isEstimate: true,
    estimationConfidence: 89,
    estimationModel: 'Suburban Transit Population Estimator',
    screeningCoverageRate: 59.8,
    healthIndex: 72,
    resourceUtilizationRate: 71.4,
    topHealthConcerns: [
      { name: 'Upper Respiratory Allergy', percentage: 26 },
      { name: 'Diabetes Screening Needed', percentage: 21 },
      { name: 'Hypertension', percentage: 19 },
      { name: 'Dermatological Irritation', percentage: 13 },
    ],
    activeDoctorsAssigned: 7,
    criticalMedicineAvailabilityRate: 85.0,
    privacyThresholdMet: true,
    minimumAggregationCount: 820,
  },
  {
    areaId: 'area-indiranagar',
    areaName: 'Indiranagar Urban Health Hub',
    district: 'Bengaluru East',
    coordinates: { lat: 12.9784, lng: 77.6408, elevation3D: 1.85 },
    totalCamps: 10,
    historicalAttendance: 1890,
    estimatedAttendance: 2100,
    isEstimate: true,
    estimationConfidence: 93,
    estimationModel: 'Urban Density Moving Average v3.0',
    screeningCoverageRate: 79.5,
    healthIndex: 85,
    resourceUtilizationRate: 89.2,
    topHealthConcerns: [
      { name: 'Hypertension', percentage: 24 },
      { name: 'Digital Eye Strain', percentage: 20 },
      { name: 'Type 2 Diabetes', percentage: 18 },
      { name: 'Orthopedic / Postural Pain', percentage: 16 },
    ],
    activeDoctorsAssigned: 15,
    criticalMedicineAvailabilityRate: 94.0,
    privacyThresholdMet: true,
    minimumAggregationCount: 1890,
  },
  {
    areaId: 'area-anekal',
    areaName: 'Anekal Taluk Outreach',
    district: 'Bengaluru Urban / Border',
    coordinates: { lat: 12.7107, lng: 77.6974, elevation3D: 1.35 },
    totalCamps: 7,
    historicalAttendance: 1110,
    estimatedAttendance: 1450,
    isEstimate: true,
    estimationConfidence: 88,
    estimationModel: 'Rural Fringe Epidemiological Index v2.0',
    screeningCoverageRate: 61.2,
    healthIndex: 70,
    resourceUtilizationRate: 79.0,
    topHealthConcerns: [
      { name: 'Nutritional & Micronutrient Gap', percentage: 28 },
      { name: 'Hypertension', percentage: 23 },
      { name: 'Diabetes Mellitus', percentage: 17 },
      { name: 'Vision Screening Requirement', percentage: 15 },
    ],
    activeDoctorsAssigned: 9,
    criticalMedicineAvailabilityRate: 86.0,
    privacyThresholdMet: true,
    minimumAggregationCount: 1110,
  },
];


