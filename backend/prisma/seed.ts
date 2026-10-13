import { PrismaClient, Role, CampStatus, AppointmentStatus, Gender, BloodGroup } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.queueToken.deleteMany();
  await prisma.offlineRegistration.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.medicalReport.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.volunteerProfile.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.camp.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing data');

  const SALT_ROUNDS = 10;

  // ========================
  // CREATE USERS
  // ========================

  // Admin
  const adminPassword = await bcrypt.hash('Admin@123', SALT_ROUNDS);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@healthcamp.com',
      password: adminPassword,
      role: Role.ADMIN,
      firstName: 'Rajesh',
      lastName: 'Kumar',
      phone: '+91-9876543210',
      isActive: true,
    },
  });

  // Doctors
  const doctor1Password = await bcrypt.hash('Doctor@123', SALT_ROUNDS);
  const doctor1 = await prisma.user.create({
    data: {
      email: 'doctor1@healthcamp.com',
      password: doctor1Password,
      role: Role.DOCTOR,
      firstName: 'Priya',
      lastName: 'Sharma',
      phone: '+91-9876543211',
      isActive: true,
    },
  });

  const doctor2Password = await bcrypt.hash('Doctor@123', SALT_ROUNDS);
  const doctor2 = await prisma.user.create({
    data: {
      email: 'doctor2@healthcamp.com',
      password: doctor2Password,
      role: Role.DOCTOR,
      firstName: 'Arun',
      lastName: 'Nair',
      phone: '+91-9876543212',
      isActive: true,
    },
  });

  const doctor3Password = await bcrypt.hash('Doctor@123', SALT_ROUNDS);
  const doctor3 = await prisma.user.create({
    data: {
      email: 'doctor3@healthcamp.com',
      password: doctor3Password,
      role: Role.DOCTOR,
      firstName: 'Meera',
      lastName: 'Reddy',
      phone: '+91-9876543213',
      isActive: true,
    },
  });

  // Volunteers
  const vol1Password = await bcrypt.hash('Volunteer@123', SALT_ROUNDS);
  const volunteer1 = await prisma.user.create({
    data: {
      email: 'volunteer1@healthcamp.com',
      password: vol1Password,
      role: Role.VOLUNTEER,
      firstName: 'Suresh',
      lastName: 'Patel',
      phone: '+91-9876543214',
      isActive: true,
    },
  });

  const vol2Password = await bcrypt.hash('Volunteer@123', SALT_ROUNDS);
  const volunteer2 = await prisma.user.create({
    data: {
      email: 'volunteer2@healthcamp.com',
      password: vol2Password,
      role: Role.VOLUNTEER,
      firstName: 'Anitha',
      lastName: 'Krishnan',
      phone: '+91-9876543215',
      isActive: true,
    },
  });

  const vol3Password = await bcrypt.hash('Volunteer@123', SALT_ROUNDS);
  const volunteer3 = await prisma.user.create({
    data: {
      email: 'volunteer3@healthcamp.com',
      password: vol3Password,
      role: Role.VOLUNTEER,
      firstName: 'Vikram',
      lastName: 'Singh',
      phone: '+91-9876543216',
      isActive: true,
    },
  });

  // Patients
  const pat1Password = await bcrypt.hash('Patient@123', SALT_ROUNDS);
  const patient1 = await prisma.user.create({
    data: {
      email: 'patient1@healthcamp.com',
      password: pat1Password,
      role: Role.PATIENT,
      firstName: 'Kavitha',
      lastName: 'Reddy',
      phone: '+91-9876543217',
      isActive: true,
    },
  });

  const pat2Password = await bcrypt.hash('Patient@123', SALT_ROUNDS);
  const patient2 = await prisma.user.create({
    data: {
      email: 'patient2@healthcamp.com',
      password: pat2Password,
      role: Role.PATIENT,
      firstName: 'Ramesh',
      lastName: 'Gowda',
      phone: '+91-9876543218',
      isActive: true,
    },
  });

  const pat3Password = await bcrypt.hash('Patient@123', SALT_ROUNDS);
  const patient3 = await prisma.user.create({
    data: {
      email: 'patient3@healthcamp.com',
      password: pat3Password,
      role: Role.PATIENT,
      firstName: 'Lakshmi',
      lastName: 'Devi',
      phone: '+91-9876543219',
      isActive: true,
    },
  });

  const pat4Password = await bcrypt.hash('Patient@123', SALT_ROUNDS);
  const patient4 = await prisma.user.create({
    data: {
      email: 'patient4@healthcamp.com',
      password: pat4Password,
      role: Role.PATIENT,
      firstName: 'Mohammed',
      lastName: 'Hussain',
      phone: '+91-9876543220',
      isActive: true,
    },
  });

  const pat5Password = await bcrypt.hash('Patient@123', SALT_ROUNDS);
  const patient5 = await prisma.user.create({
    data: {
      email: 'patient5@healthcamp.com',
      password: pat5Password,
      role: Role.PATIENT,
      firstName: 'Sunita',
      lastName: 'Joshi',
      phone: '+91-9876543221',
      isActive: true,
    },
  });

  console.log('✅ Users created');

  // ========================
  // CREATE CAMPS
  // ========================

  const camp1 = await prisma.camp.create({
    data: {
      name: 'Koramangala Community Health Camp',
      location: 'Koramangala',
      address: '80 Feet Road, Koramangala 4th Block, Bangalore - 560034',
      latitude: 12.9352,
      longitude: 77.6245,
      startDate: new Date('2024-02-01T08:00:00Z'),
      endDate: new Date('2024-02-03T18:00:00Z'),
      capacity: 200,
      registered: 45,
      status: CampStatus.UPCOMING,
      services: ['General Medicine', 'Dental', 'Eye Care', 'Blood Tests', 'BP Check', 'Diabetes Screening'],
      description: 'A comprehensive health camp offering free medical services to residents of Koramangala and surrounding areas. Includes specialist doctors and diagnostic facilities.',
      createdById: admin.id,
    },
  });

  const camp2 = await prisma.camp.create({
    data: {
      name: 'Indiranagar Health Awareness Camp',
      location: 'Indiranagar',
      address: '100 Feet Road, Indiranagar, Bangalore - 560038',
      latitude: 12.9784,
      longitude: 77.6408,
      startDate: new Date('2024-01-15T08:00:00Z'),
      endDate: new Date('2024-01-17T18:00:00Z'),
      capacity: 150,
      registered: 150,
      status: CampStatus.ONGOING,
      services: ['General Medicine', 'Gynecology', 'Pediatrics', 'Nutrition Counseling', 'Mental Health'],
      description: 'Health awareness camp focused on women and child health. Features specialist gynecologists and pediatricians along with nutrition experts.',
      createdById: admin.id,
    },
  });

  const camp3 = await prisma.camp.create({
    data: {
      name: 'Jayanagar Free Medical Camp',
      location: 'Jayanagar',
      address: '4th Block, Jayanagar, Bangalore - 560011',
      latitude: 12.9308,
      longitude: 77.5838,
      startDate: new Date('2024-01-01T08:00:00Z'),
      endDate: new Date('2024-01-03T18:00:00Z'),
      capacity: 100,
      registered: 98,
      status: CampStatus.COMPLETED,
      services: ['Cardiology', 'Orthopedics', 'General Medicine', 'ECG', 'X-Ray'],
      description: 'Specialized health camp focusing on cardiovascular and orthopedic health for senior citizens and adults.',
      createdById: admin.id,
    },
  });

  const camp4 = await prisma.camp.create({
    data: {
      name: 'Whitefield Digital Health Camp',
      location: 'Whitefield',
      address: 'Hope Farm Junction, Whitefield, Bangalore - 560066',
      latitude: 12.9698,
      longitude: 77.7499,
      startDate: new Date('2024-03-01T08:00:00Z'),
      endDate: new Date('2024-03-05T18:00:00Z'),
      capacity: 300,
      registered: 10,
      status: CampStatus.UPCOMING,
      services: ['Telemedicine', 'Diabetes Care', 'Hypertension', 'Dermatology', 'ENT', 'Ophthalmology'],
      description: 'Technology-enabled health camp with digital health records and telemedicine consultations. Serves IT professionals and nearby residential communities.',
      createdById: admin.id,
    },
  });

  console.log('✅ Camps created');

  // ========================
  // CREATE DOCTOR PROFILES
  // ========================

  await prisma.doctorProfile.create({
    data: {
      userId: doctor1.id,
      specialization: 'General Medicine',
      licenseNumber: 'KMC/2015/12345',
      experience: 8,
      assignedCamps: {
        connect: [{ id: camp1.id }, { id: camp2.id }],
      },
    },
  });

  await prisma.doctorProfile.create({
    data: {
      userId: doctor2.id,
      specialization: 'Cardiology',
      licenseNumber: 'KMC/2012/67890',
      experience: 12,
      assignedCamps: {
        connect: [{ id: camp3.id }, { id: camp4.id }],
      },
    },
  });

  await prisma.doctorProfile.create({
    data: {
      userId: doctor3.id,
      specialization: 'Gynecology',
      licenseNumber: 'KMC/2018/11223',
      experience: 6,
      assignedCamps: {
        connect: [{ id: camp2.id }, { id: camp4.id }],
      },
    },
  });

  console.log('✅ Doctor profiles created');

  // ========================
  // CREATE VOLUNTEER PROFILES
  // ========================

  await prisma.volunteerProfile.create({
    data: {
      userId: volunteer1.id,
      skills: ['First Aid', 'Patient Registration', 'Blood Pressure Measurement'],
      assignedCampId: camp1.id,
      attendance: [
        { date: '2024-02-01', checkIn: '07:30', checkOut: '18:00', status: 'present' },
      ],
    },
  });

  await prisma.volunteerProfile.create({
    data: {
      userId: volunteer2.id,
      skills: ['Medical Record Keeping', 'Patient Counseling', 'Data Entry'],
      assignedCampId: camp2.id,
      attendance: [
        { date: '2024-01-15', checkIn: '08:00', checkOut: '17:30', status: 'present' },
        { date: '2024-01-16', checkIn: '08:15', checkOut: '18:00', status: 'present' },
      ],
    },
  });

  await prisma.volunteerProfile.create({
    data: {
      userId: volunteer3.id,
      skills: ['Pharmacy Assistance', 'Inventory Management', 'Logistics'],
      assignedCampId: camp3.id,
      attendance: [
        { date: '2024-01-01', checkIn: '07:45', checkOut: '18:30', status: 'present' },
        { date: '2024-01-02', checkIn: '08:00', checkOut: '18:00', status: 'present' },
        { date: '2024-01-03', checkIn: '08:00', checkOut: '17:00', status: 'present' },
      ],
    },
  });

  console.log('✅ Volunteer profiles created');

  // ========================
  // CREATE PATIENT PROFILES
  // ========================

  await prisma.patientProfile.create({
    data: {
      userId: patient1.id,
      dateOfBirth: new Date('1985-06-15'),
      gender: Gender.FEMALE,
      bloodGroup: BloodGroup.B_POSITIVE,
      address: 'No. 12, 3rd Cross, Koramangala, Bangalore - 560034',
      medicalHistory: 'Type 2 Diabetes diagnosed in 2020. Regular medication ongoing.',
      allergies: ['Penicillin', 'Sulfa drugs'],
      emergencyContact: {
        name: 'Suresh Reddy',
        relationship: 'Husband',
        phone: '+91-9876543300',
      },
    },
  });

  await prisma.patientProfile.create({
    data: {
      userId: patient2.id,
      dateOfBirth: new Date('1972-03-22'),
      gender: Gender.MALE,
      bloodGroup: BloodGroup.O_POSITIVE,
      address: 'No. 45, 8th Main, Indiranagar, Bangalore - 560038',
      medicalHistory: 'Hypertension. On Amlodipine 5mg daily.',
      allergies: ['Aspirin'],
      emergencyContact: {
        name: 'Savitha Gowda',
        relationship: 'Wife',
        phone: '+91-9876543301',
      },
    },
  });

  await prisma.patientProfile.create({
    data: {
      userId: patient3.id,
      dateOfBirth: new Date('1990-11-08'),
      gender: Gender.FEMALE,
      bloodGroup: BloodGroup.A_POSITIVE,
      address: 'No. 78, 5th Cross, Jayanagar, Bangalore - 560011',
      medicalHistory: 'Hypothyroidism. Levothyroxine 50mcg daily.',
      allergies: [],
      emergencyContact: {
        name: 'Ravi Devi',
        relationship: 'Brother',
        phone: '+91-9876543302',
      },
    },
  });

  await prisma.patientProfile.create({
    data: {
      userId: patient4.id,
      dateOfBirth: new Date('1965-09-30'),
      gender: Gender.MALE,
      bloodGroup: BloodGroup.AB_POSITIVE,
      address: 'No. 22, Commercial Street, Shivajinagar, Bangalore - 560001',
      medicalHistory: 'COPD. History of smoking. Inhalers prescribed.',
      allergies: ['NSAIDs', 'Ibuprofen'],
      emergencyContact: {
        name: 'Fatima Hussain',
        relationship: 'Wife',
        phone: '+91-9876543303',
      },
    },
  });

  await prisma.patientProfile.create({
    data: {
      userId: patient5.id,
      dateOfBirth: new Date('1998-01-25'),
      gender: Gender.FEMALE,
      bloodGroup: BloodGroup.O_NEGATIVE,
      address: 'No. 56, MG Road, Shivajinagar, Bangalore - 560001',
      medicalHistory: 'No significant past medical history.',
      allergies: ['Latex'],
      emergencyContact: {
        name: 'Amit Joshi',
        relationship: 'Spouse',
        phone: '+91-9876543304',
      },
    },
  });

  console.log('✅ Patient profiles created');

  // ========================
  // CREATE APPOINTMENTS
  // ========================

  const appointment1 = await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      campId: camp1.id,
      doctorId: doctor1.id,
      date: new Date('2024-02-01'),
      timeSlot: '09:00-09:30',
      status: AppointmentStatus.CONFIRMED,
      queueToken: 'KRM-001',
      notes: 'Diabetes follow-up and routine check',
    },
  });

  const appointment2 = await prisma.appointment.create({
    data: {
      patientId: patient2.id,
      campId: camp2.id,
      doctorId: doctor1.id,
      date: new Date('2024-01-15'),
      timeSlot: '10:00-10:30',
      status: AppointmentStatus.COMPLETED,
      queueToken: 'IND-001',
      notes: 'BP monitoring and medication review',
    },
  });

  const appointment3 = await prisma.appointment.create({
    data: {
      patientId: patient3.id,
      campId: camp2.id,
      doctorId: doctor3.id,
      date: new Date('2024-01-15'),
      timeSlot: '11:00-11:30',
      status: AppointmentStatus.COMPLETED,
      queueToken: 'IND-002',
      notes: 'Gynecological consultation',
    },
  });

  const appointment4 = await prisma.appointment.create({
    data: {
      patientId: patient4.id,
      campId: camp3.id,
      doctorId: doctor2.id,
      date: new Date('2024-01-01'),
      timeSlot: '09:30-10:00',
      status: AppointmentStatus.COMPLETED,
      queueToken: 'JAY-001',
      notes: 'Cardiac evaluation - ECG needed',
    },
  });

  const appointment5 = await prisma.appointment.create({
    data: {
      patientId: patient5.id,
      campId: camp3.id,
      doctorId: doctor2.id,
      date: new Date('2024-01-02'),
      timeSlot: '14:00-14:30',
      status: AppointmentStatus.COMPLETED,
      queueToken: 'JAY-002',
      notes: 'General health check',
    },
  });

  const appointment6 = await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      campId: camp2.id,
      doctorId: doctor1.id,
      date: new Date('2024-01-16'),
      timeSlot: '15:00-15:30',
      status: AppointmentStatus.CONFIRMED,
      queueToken: 'IND-010',
      notes: 'Diabetes management follow-up',
    },
  });

  const appointment7 = await prisma.appointment.create({
    data: {
      patientId: patient2.id,
      campId: camp4.id,
      doctorId: doctor2.id,
      date: new Date('2024-03-01'),
      timeSlot: '09:00-09:30',
      status: AppointmentStatus.PENDING,
      queueToken: 'WHF-001',
      notes: 'Hypertension consultation via telemedicine',
    },
  });

  const appointment8 = await prisma.appointment.create({
    data: {
      patientId: patient3.id,
      campId: camp1.id,
      doctorId: doctor1.id,
      date: new Date('2024-02-02'),
      timeSlot: '11:30-12:00',
      status: AppointmentStatus.PENDING,
      queueToken: 'KRM-015',
      notes: 'Thyroid function follow-up',
    },
  });

  const appointment9 = await prisma.appointment.create({
    data: {
      patientId: patient4.id,
      campId: camp4.id,
      doctorId: doctor2.id,
      date: new Date('2024-03-02'),
      timeSlot: '10:30-11:00',
      status: AppointmentStatus.PENDING,
      queueToken: 'WHF-015',
      notes: 'COPD management consultation',
    },
  });

  const appointment10 = await prisma.appointment.create({
    data: {
      patientId: patient5.id,
      campId: camp1.id,
      doctorId: doctor1.id,
      date: new Date('2024-02-03'),
      timeSlot: '13:00-13:30',
      status: AppointmentStatus.CONFIRMED,
      queueToken: 'KRM-025',
      notes: 'General wellness consultation',
    },
  });

  console.log('✅ Appointments created');

  // ========================
  // CREATE QUEUE TOKENS
  // ========================

  await prisma.queueToken.createMany({
    data: [
      { appointmentId: appointment1.id, tokenNumber: 1, status: 'WAITING' },
      { appointmentId: appointment2.id, tokenNumber: 1, status: 'COMPLETED' },
      { appointmentId: appointment3.id, tokenNumber: 2, status: 'COMPLETED' },
      { appointmentId: appointment4.id, tokenNumber: 1, status: 'COMPLETED' },
      { appointmentId: appointment5.id, tokenNumber: 2, status: 'COMPLETED' },
      { appointmentId: appointment6.id, tokenNumber: 10, status: 'WAITING' },
      { appointmentId: appointment7.id, tokenNumber: 1, status: 'WAITING' },
      { appointmentId: appointment8.id, tokenNumber: 15, status: 'WAITING' },
      { appointmentId: appointment9.id, tokenNumber: 15, status: 'WAITING' },
      { appointmentId: appointment10.id, tokenNumber: 25, status: 'WAITING' },
    ],
  });

  console.log('✅ Queue tokens created');

  // ========================
  // CREATE MEDICAL REPORTS
  // ========================

  await prisma.medicalReport.create({
    data: {
      patientId: patient2.id,
      doctorId: doctor1.id,
      campId: camp2.id,
      diagnosis: 'Essential Hypertension - Stage 1',
      prescription: 'Amlodipine 5mg once daily. Tablet Telma 40mg once daily. Low sodium diet advised.',
      observations: 'BP: 145/92 mmHg. Heart rate: 78 bpm. No edema. Fundus normal. ECG: Normal sinus rhythm.',
      referral: null,
      isConfidential: false,
    },
  });

  await prisma.medicalReport.create({
    data: {
      patientId: patient3.id,
      doctorId: doctor3.id,
      campId: camp2.id,
      diagnosis: 'Polycystic Ovarian Syndrome (PCOS)',
      prescription: 'Metformin 500mg twice daily. OCP prescribed. Lifestyle modification counseled.',
      observations: 'BMI: 26. Ultrasound shows multiple follicles. Hormonal panel ordered.',
      referral: 'Referred to endocrinologist at Victoria Hospital',
      isConfidential: true,
    },
  });

  await prisma.medicalReport.create({
    data: {
      patientId: patient4.id,
      doctorId: doctor2.id,
      campId: camp3.id,
      diagnosis: 'Moderate COPD with acute exacerbation',
      prescription: 'Salbutamol inhaler 100mcg PRN. Budesonide/Formoterol 160/4.5mcg BD. Prednisolone 30mg for 5 days.',
      observations: 'SpO2: 94% on room air. Chest: bilateral rhonchi. ECG: Right axis deviation. Spirometry: FEV1/FVC 0.62.',
      referral: 'Pulmonology follow-up at St. Johns Medical College',
      isConfidential: false,
    },
  });

  await prisma.medicalReport.create({
    data: {
      patientId: patient5.id,
      doctorId: doctor2.id,
      campId: camp3.id,
      diagnosis: 'Iron Deficiency Anemia - Mild',
      prescription: 'Ferrous sulfate 325mg twice daily with Vitamin C. High iron diet advised.',
      observations: 'Pallor present. Hb: 9.8 g/dL. Peripheral smear: microcytic hypochromic. Iron studies confirm deficiency.',
      referral: null,
      isConfidential: false,
    },
  });

  console.log('✅ Medical reports created');

  // ========================
  // CREATE INVENTORY
  // ========================

  await prisma.inventory.createMany({
    data: [
      {
        campId: camp1.id,
        medicineName: 'Paracetamol 500mg',
        genericName: 'Acetaminophen',
        quantity: 500,
        unit: 'tablets',
        expiryDate: new Date('2025-12-31'),
        lowStockThreshold: 50,
        supplier: 'Sun Pharma',
      },
      {
        campId: camp1.id,
        medicineName: 'Metformin 500mg',
        genericName: 'Metformin Hydrochloride',
        quantity: 200,
        unit: 'tablets',
        expiryDate: new Date('2025-06-30'),
        lowStockThreshold: 30,
        supplier: 'Cipla',
      },
      {
        campId: camp1.id,
        medicineName: 'Amlodipine 5mg',
        genericName: 'Amlodipine Besylate',
        quantity: 150,
        unit: 'tablets',
        expiryDate: new Date('2025-09-30'),
        lowStockThreshold: 20,
        supplier: 'Dr. Reddys',
      },
      {
        campId: camp1.id,
        medicineName: 'ORS Sachet',
        genericName: 'Oral Rehydration Salts',
        quantity: 12,
        unit: 'sachets',
        expiryDate: new Date('2024-12-31'),
        lowStockThreshold: 20,
        supplier: 'Electroral',
      },
      {
        campId: camp2.id,
        medicineName: 'Folic Acid 5mg',
        genericName: 'Folic Acid',
        quantity: 300,
        unit: 'tablets',
        expiryDate: new Date('2025-08-31'),
        lowStockThreshold: 50,
        supplier: 'Abbott',
      },
      {
        campId: camp2.id,
        medicineName: 'Iron Sucrose Injection',
        genericName: 'Ferric Hydroxide Sucrose',
        quantity: 50,
        unit: 'vials',
        expiryDate: new Date('2024-10-31'),
        lowStockThreshold: 10,
        supplier: 'Emcure Pharma',
      },
      {
        campId: camp2.id,
        medicineName: 'Vitamin D3 60000 IU',
        genericName: 'Cholecalciferol',
        quantity: 8,
        unit: 'sachets',
        expiryDate: new Date('2025-03-31'),
        lowStockThreshold: 15,
        supplier: 'USV Limited',
      },
      {
        campId: camp3.id,
        medicineName: 'Atorvastatin 10mg',
        genericName: 'Atorvastatin Calcium',
        quantity: 400,
        unit: 'tablets',
        expiryDate: new Date('2025-11-30'),
        lowStockThreshold: 40,
        supplier: 'Pfizer',
      },
      {
        campId: camp3.id,
        medicineName: 'Aspirin 75mg',
        genericName: 'Acetylsalicylic Acid',
        quantity: 600,
        unit: 'tablets',
        expiryDate: new Date('2026-01-31'),
        lowStockThreshold: 60,
        supplier: 'Bayer',
      },
      {
        campId: camp4.id,
        medicineName: 'Glucometer Test Strips',
        genericName: 'Blood Glucose Test Strips',
        quantity: 200,
        unit: 'strips',
        expiryDate: new Date('2024-11-30'),
        lowStockThreshold: 30,
        supplier: 'Accu-Chek',
      },
      {
        campId: camp4.id,
        medicineName: 'Salbutamol Inhaler',
        genericName: 'Albuterol',
        quantity: 25,
        unit: 'inhalers',
        expiryDate: new Date('2025-07-31'),
        lowStockThreshold: 5,
        supplier: 'Cipla',
      },
    ],
  });

  console.log('✅ Inventory created');

  // ========================
  // CREATE NOTIFICATIONS
  // ========================

  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        title: 'System Ready',
        message: 'Health Camp Management System is now operational. Welcome!',
        type: 'SUCCESS',
        isRead: true,
      },
      {
        userId: admin.id,
        title: 'Low Stock Alert',
        message: 'ORS Sachets at Koramangala camp are below minimum threshold (12 units remaining, threshold: 20)',
        type: 'WARNING',
        isRead: false,
      },
      {
        userId: admin.id,
        title: 'Camp Registration Full',
        message: 'Indiranagar Health Awareness Camp has reached full capacity (150/150 registered)',
        type: 'INFO',
        isRead: false,
      },
      {
        userId: doctor1.id,
        title: 'New Appointment',
        message: 'New appointment confirmed with Kavitha Reddy on Feb 1, 2024 at 09:00 AM',
        type: 'INFO',
        isRead: false,
      },
      {
        userId: doctor1.id,
        title: 'Camp Assignment',
        message: 'You have been assigned to Koramangala Community Health Camp starting Feb 1, 2024',
        type: 'SUCCESS',
        isRead: true,
      },
      {
        userId: doctor2.id,
        title: 'Critical Patient Alert',
        message: 'Patient Mohammed Hussain requires immediate follow-up for COPD management',
        type: 'WARNING',
        isRead: false,
      },
      {
        userId: volunteer1.id,
        title: 'Camp Assignment',
        message: 'You have been assigned to Koramangala Community Health Camp. Please report by 7:30 AM on Feb 1',
        type: 'INFO',
        isRead: false,
      },
      {
        userId: patient1.id,
        title: 'Appointment Confirmed',
        message: 'Your appointment at Koramangala Community Health Camp on Feb 1, 2024 at 09:00 AM is confirmed. Token: KRM-001',
        type: 'SUCCESS',
        isRead: false,
      },
      {
        userId: patient2.id,
        title: 'Appointment Reminder',
        message: 'Reminder: Your appointment at Whitefield Digital Health Camp is on Mar 1, 2024 at 09:00 AM',
        type: 'INFO',
        isRead: false,
      },
      {
        userId: patient4.id,
        title: 'Follow-up Required',
        message: 'Your doctor has recommended a follow-up appointment for COPD management. Please schedule at your earliest.',
        type: 'WARNING',
        isRead: false,
      },
    ],
  });

  console.log('✅ Notifications created');

  // ========================
  // CREATE FOLLOW-UPS
  // ========================

  await prisma.followUp.createMany({
    data: [
      {
        patientId: patient4.id,
        doctorId: doctor2.id,
        campId: camp4.id,
        scheduledDate: new Date('2024-03-02'),
        status: 'PENDING',
        notes: 'Follow-up for COPD management after acute exacerbation. Check spirometry and oxygen saturation.',
      },
      {
        patientId: patient2.id,
        doctorId: doctor1.id,
        campId: camp4.id,
        scheduledDate: new Date('2024-03-01'),
        status: 'PENDING',
        notes: 'BP check and medication adjustment if needed.',
      },
      {
        patientId: patient3.id,
        doctorId: doctor3.id,
        campId: camp2.id,
        scheduledDate: new Date('2024-01-30'),
        status: 'COMPLETED',
        notes: 'PCOS follow-up. Hormonal panel review and medication adjustment.',
      },
      {
        patientId: patient5.id,
        doctorId: doctor2.id,
        campId: camp3.id,
        scheduledDate: new Date('2024-01-20'),
        status: 'MISSED',
        notes: 'Anemia follow-up - check hemoglobin levels after iron supplementation.',
      },
    ],
  });

  console.log('✅ Follow-ups created');

  // ========================
  // CREATE OFFLINE REGISTRATIONS
  // ========================

  await prisma.offlineRegistration.createMany({
    data: [
      {
        data: {
          type: 'appointment',
          patient: {
            firstName: 'Girish',
            lastName: 'Naik',
            phone: '+91-9876500001',
            email: 'girish.naik@example.com',
            dateOfBirth: '1988-04-15',
            gender: 'MALE',
          },
          campId: camp1.id,
          date: '2024-02-01',
          timeSlot: '10:30-11:00',
          service: 'General Medicine',
        },
        synced: false,
        createdAt: new Date('2024-01-28T10:00:00Z'),
      },
      {
        data: {
          type: 'appointment',
          patient: {
            firstName: 'Pushpa',
            lastName: 'Rao',
            phone: '+91-9876500002',
            email: 'pushpa.rao@example.com',
            dateOfBirth: '1975-09-20',
            gender: 'FEMALE',
          },
          campId: camp1.id,
          date: '2024-02-02',
          timeSlot: '14:00-14:30',
          service: 'Dental',
        },
        synced: true,
        createdAt: new Date('2024-01-29T11:00:00Z'),
        syncedAt: new Date('2024-01-29T12:00:00Z'),
      },
    ],
  });

  console.log('✅ Offline registrations created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Default Login Credentials:');
  console.log('  Admin:     admin@healthcamp.com / Admin@123');
  console.log('  Doctor 1:  doctor1@healthcamp.com / Doctor@123');
  console.log('  Doctor 2:  doctor2@healthcamp.com / Doctor@123');
  console.log('  Doctor 3:  doctor3@healthcamp.com / Doctor@123');
  console.log('  Volunteer: volunteer1@healthcamp.com / Volunteer@123');
  console.log('  Patient 1: patient1@healthcamp.com / Patient@123');
  console.log('\n📊 Seeded Data Summary:');
  console.log('  Users: 12 (1 admin, 3 doctors, 3 volunteers, 5 patients)');
  console.log('  Camps: 4 (Bangalore locations)');
  console.log('  Appointments: 10');
  console.log('  Medical Reports: 4');
  console.log('  Inventory Items: 11');
  console.log('  Notifications: 10');
  console.log('  Follow-ups: 4');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
