// backend/tests/fixtures.ts
export const testFixtures = {
  adminUser: {
    email: 'admin@healthcamp.com',
    password: 'Admin@123',
    role: 'ADMIN',
  },
  doctorUser: {
    email: 'doctor1@healthcamp.com',
    password: 'Doctor@123',
    role: 'DOCTOR',
  },
  volunteerUser: {
    email: 'volunteer1@healthcamp.com',
    password: 'Volunteer@123',
    role: 'VOLUNTEER',
  },
  patientUser: {
    email: 'patient1@healthcamp.com',
    password: 'Patient@123',
    role: 'PATIENT',
  },
  camp: {
    id: 'camp-test-1',
    name: 'Rural Health Outreach Camp - Test Zone',
    location: 'Doddaballapur Rural',
    capacity: 50,
    registered: 49,
    status: 'UPCOMING',
    services: ['General Checkup', 'BP Monitoring', 'Blood Sugar'],
  },
  appointment: {
    id: 'appt-test-1',
    patientId: 'user-patient-1',
    campId: 'camp-test-1',
    date: '2026-11-10',
    timeSlot: '09:00 AM',
    status: 'CONFIRMED',
    queueToken: 'DOD-001',
  },
  offlineDraft: {
    id: 'offline-draft-001',
    patientName: 'Shankar Gowda',
    age: 54,
    gender: 'MALE',
    village: 'Sasalu Village',
    service: 'General Checkup',
    timestamp: '2026-10-14T09:30:00Z',
  },
};
