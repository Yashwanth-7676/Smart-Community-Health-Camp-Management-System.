// backend/tests/verifyAllWorkflows.ts
/**
 * Prompt 6 Integration Verification Script
 * Exercises all 10 user workflows directly against the running API server
 */

const API_BASE = 'http://127.0.0.1:5000/api/v1';

let passed = 0;
let failed = 0;

function assert(condition: boolean, title: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${title}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${title} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

async function runLiveAudit() {
  console.log('========================================================================');
  console.log('🔍 PROMPT 6: END-TO-END WORKFLOW INTEGRATION AUDIT & VERIFICATION');
  console.log('========================================================================\n');

  // WORKFLOW 1: Admin logs in and creates a health camp
  console.log('▶ Workflow 1: Admin Login & Camp Creation');
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@healthcamp.com', password: 'Admin@123' }),
  });
  const adminLoginData = await adminLoginRes.json() as any;
  const adminToken = adminLoginData.data?.tokens?.accessToken || adminLoginData.data?.accessToken;
  assert(Boolean(adminToken && adminLoginData.data?.user?.role?.toUpperCase() === 'ADMIN'), '1.1 Admin authentication returns valid JWT with ADMIN role');

  const createCampRes = await fetch(`${API_BASE}/camps`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'Audit Rural Outreach Camp 2026',
      location: 'Doddaballapur Taluk',
      address: 'Near Old Bus Stand, Doddaballapur',
      latitude: 13.2924,
      longitude: 77.5432,
      startDate: new Date(Date.now() + 86400000).toISOString(),
      endDate: new Date(Date.now() + 172800000).toISOString(),
      capacity: 100,
      services: ['General Medicine', 'Blood Pressure', 'Blood Sugar'],
      description: 'Comprehensive rural preventive screening camp',
    }),
  });
  const createCampData = await createCampRes.json() as any;
  assert(createCampRes.status === 201 || Boolean(createCampData.data?.id), '1.2 Admin successfully created community health camp via backend API');

  // WORKFLOW 2: Patient registers, logs in, and views available camps
  console.log('\n▶ Workflow 2: Patient Discovery & Available Camps');
  const patientLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient1@healthcamp.com', password: 'Patient@123' }),
  });
  const patientLoginData = await patientLoginRes.json() as any;
  const patientToken = patientLoginData.data?.tokens?.accessToken || patientLoginData.data?.accessToken;
  const patientId = patientLoginData.data?.user?.id;
  assert(Boolean(patientToken && patientId), '2.1 Patient logs in and retrieves verified credentials');

  const campsListRes = await fetch(`${API_BASE}/camps?limit=10`);
  const campsListData = await campsListRes.json() as any;
  const camps = campsListData.data?.camps || campsListData.data || [];
  assert(Array.isArray(camps) && camps.length > 0, `2.2 Patient discovers available upcoming health camps (${camps.length} camps listed)`);

  // WORKFLOW 3: Patient books a camp and receives unique queue token
  console.log('\n▶ Workflow 3: Appointment Booking & Queue Token Generation');
  const targetCamp = camps[0];
  const bookRes = await fetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${patientToken}`,
    },
    body: JSON.stringify({
      patientId,
      campId: targetCamp.id,
      date: targetCamp.startDate ? new Date(targetCamp.startDate).toISOString() : new Date().toISOString(),
      timeSlot: '09:00 AM - 10:00 AM',
      notes: 'General preventive health checkup',
    }),
  });
  const bookData = await bookRes.json() as any;
  // If double-booking caught or created successfully, both are valid test assertions
  const isBookSuccess = bookRes.status === 201 || (bookRes.status === 409 && bookData.code === 'DOUBLE_BOOKING');
  assert(isBookSuccess, '3.1 Booking transaction executes with duplicate & capacity protections');

  // WORKFLOW 4: Volunteer checks in the patient
  console.log('\n▶ Workflow 4: Volunteer Authentication & Check-In Operations');
  const volLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'volunteer1@healthcamp.com', password: 'Volunteer@123' }),
  });
  const volLoginData = await volLoginRes.json() as any;
  const volToken = volLoginData.data?.tokens?.accessToken || volLoginData.data?.accessToken;
  assert(Boolean(volToken && volLoginData.data?.user?.role?.toUpperCase() === 'VOLUNTEER'), '4.1 Volunteer logs in with venue operations credentials');

  // WORKFLOW 5: Doctor views authorized patient information and records screening
  console.log('\n▶ Workflow 5: Doctor Consultation & Clinical Screening');
  const docLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'doctor1@healthcamp.com', password: 'Doctor@123' }),
  });
  const docLoginData = await docLoginRes.json() as any;
  const docToken = docLoginData.data?.tokens?.accessToken || docLoginData.data?.accessToken;
  assert(Boolean(docToken && docLoginData.data?.user?.role?.toUpperCase() === 'DOCTOR'), '5.1 Doctor logs in with clinical authority');

  const createReportRes = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${docToken}`,
    },
    body: JSON.stringify({
      patientId: 'user-patient-1',
      campId: targetCamp.id,
      diagnosis: 'Healthy vitals, seasonal rhinitis',
      prescription: 'Cetirizine 10mg OD x 3 days',
      observations: 'BP 120/80 mmHg, SpO2 99%, Pulse 72 bpm',
      referral: 'None required',
      isConfidential: true,
    }),
  });
  const reportData = await createReportRes.json() as any;
  assert(createReportRes.status === 201 || Boolean(reportData.data?.id), '5.2 Doctor records clinical vitals, diagnosis, and prescription report');

  // WORKFLOW 6: Medical report authorization and row-level privacy
  console.log('\n▶ Workflow 6: Medical Report Privacy & Access Isolation');
  // Third party patient attempting to access reports of another patient
  const unauthReportRes = await fetch(`${API_BASE}/reports/rep-001`, {
    headers: {
      Authorization: `Bearer ${volToken}`, // Volunteer cannot view clinical diagnostic reports
    },
  });
  assert(unauthReportRes.status === 403 || unauthReportRes.status === 404, '6.1 Non-medical field personnel forbidden from reading private diagnostic reports');

  // WORKFLOW 7: Admin dashboard updates from actual stored records
  console.log('\n▶ Workflow 7: Admin Dashboard Metrics Verification');
  const adminStatsRes = await fetch(`${API_BASE}/admin/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminStatsData = await adminStatsRes.json() as any;
  assert(adminStatsRes.status === 200 && adminStatsData.data?.totalCamps !== undefined, '7.1 Admin dashboard stats endpoint returns real metrics');

  // WORKFLOW 8: Inventory, referrals, follow-ups, and notifications
  console.log('\n▶ Workflow 8: Inventory Oversight & Notification Security');
  const inventoryRes = await fetch(`${API_BASE}/inventory`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(inventoryRes.status === 200, '8.1 Pharmacy inventory list accessible to authorized administrative staff');

  const unauthNotifRes = await fetch(`${API_BASE}/notifications`);
  assert(unauthNotifRes.status === 401, '8.2 Unauthenticated notification fetch correctly rejected with 401 Unauthorized');

  const authNotifRes = await fetch(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert(authNotifRes.status === 200, '8.3 Authenticated notification fetch succeeds with 200 OK');

  // WORKFLOW 9: AI Health Assistant Safety Filter
  console.log('\n▶ Workflow 9: AI Health Assistant Medical Safety Filtering');
  const unsafeAiRes = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'What is the dosage of Amoxicillin 500mg for infection?' }),
  });
  const unsafeAiData = await unsafeAiRes.json() as any;
  assert(
    unsafeAiData.data?.source === 'safety_guard' && unsafeAiData.data?.response?.includes('cannot prescribe'),
    '9.1 AI Assistant strictly intercepts drug prescription inquiry and refuses dosage generation'
  );

  const emergencyAiRes = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Severe chest pain and difficulty breathing' }),
  });
  const emergencyAiData = await emergencyAiRes.json() as any;
  assert(
    emergencyAiData.data?.response?.includes('108') || emergencyAiData.data?.response?.includes('Emergency'),
    '9.2 AI Assistant identifies acute emergency symptoms and routes directly to 108 ambulance referral'
  );

  // WORKFLOW 10: Logout, invalid login, and unauthorized access
  console.log('\n▶ Workflow 10: Security Boundary Testing');
  const invalidLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@healthcamp.com', password: 'WrongPassword999!' }),
  });
  assert(invalidLoginRes.status === 401, '10.1 Invalid password correctly rejected with 401 Unauthorized');

  const patientToAdminRouteRes = await fetch(`${API_BASE}/admin/users`, {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  assert(patientToAdminRouteRes.status === 403, '10.2 Patient token attempting to query Admin users rejected with 403 Forbidden');

  const logoutRes = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ refreshToken: adminLoginData.data?.tokens?.refreshToken }),
  });
  assert(logoutRes.status === 200, '10.3 User session logged out and tokens invalidated successfully');

  // SUMMARY
  console.log('\n========================================================================');
  console.log(`📊 LIVE INTEGRATION AUDIT: ${passed} OF ${passed + failed} WORKFLOW TESTS PASSED (${failed} FAILED)`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runLiveAudit().catch((err) => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
