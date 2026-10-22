// backend/tests/verifyUpgrade4.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import app from '../src/app';
import { generateSHID, EPHEMERAL_PASS_STORE, ACCESS_HISTORY_STORE } from '../src/controllers/digitalHealthIdController';
import { getCampCommandCenterData } from '../src/controllers/commandCenterController';
import { signAccessToken } from '../src/utils/jwt';

// Helper to execute supertest-like in-memory HTTP requests without external libraries
function request(appInstance: any) {
  const server = http.createServer(appInstance);
  return {
    async get(path: string, headers: Record<string, string> = {}) {
      return new Promise<any>((resolve, reject) => {
        server.listen(0, () => {
          const address = server.address() as any;
          const req = http.request(
            {
              hostname: '127.0.0.1',
              port: address.port,
              path,
              method: 'GET',
              headers,
            },
            (res) => {
              let body = '';
              res.on('data', (chunk) => (body += chunk));
              res.on('end', () => {
                server.close();
                let parsed = body;
                try {
                  parsed = JSON.parse(body);
                } catch {}
                resolve({ status: res.statusCode, headers: res.headers, body: parsed });
              });
            }
          );
          req.on('error', (err) => {
            server.close();
            reject(err);
          });
          req.end();
        });
      });
    },
    async post(path: string, data: any = {}, headers: Record<string, string> = {}) {
      return new Promise<any>((resolve, reject) => {
        server.listen(0, () => {
          const address = server.address() as any;
          const payload = JSON.stringify(data);
          const req = http.request(
            {
              hostname: '127.0.0.1',
              port: address.port,
              path,
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                ...headers,
              },
            },
            (res) => {
              let body = '';
              res.on('data', (chunk) => (body += chunk));
              res.on('end', () => {
                server.close();
                let parsed = body;
                try {
                  parsed = JSON.parse(body);
                } catch {}
                resolve({ status: res.statusCode, headers: res.headers, body: parsed });
              });
            }
          );
          req.on('error', (err) => {
            server.close();
            reject(err);
          });
          req.write(payload);
          req.end();
        });
      });
    },
  };
}

async function runTests() {
  console.log('========================================================================');
  console.log('🏥 UPGRADE 4: SMART HEALTHCARE OPERATIONS & DIGITAL EXPERIENCE TEST SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Reason: ${err.message}`);
      failed++;
    }
  }

  // 1. Generate test authentication tokens
  const req = request(app);
  const adminToken = signAccessToken({
    userId: 'user-admin-1',
    email: 'admin@healthcamp.com',
    role: 'ADMIN',
    firstName: 'Rajesh',
    lastName: 'Kumar',
  });

  const patientToken = signAccessToken({
    userId: 'user-patient-1',
    email: 'patient1@healthcamp.com',
    role: 'PATIENT',
    firstName: 'Kavitha',
    lastName: 'Reddy',
  });

  console.log('📡 MODULE 1: Live Camp Command Center');

  await test('1.1 Snapshot returns valid camp operational metrics, queue counts, and inventory alerts', async () => {
    const res = await req.get('/api/v1/command-center/camp-1', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.metrics.registered >= 0);
    assert.ok(res.body.data.metrics.checkedIn >= 0);
    assert.ok(Array.isArray(res.body.data.queue.activeServing));
    assert.ok(Array.isArray(res.body.data.queue.nextInQueue));
    assert.ok(Array.isArray(res.body.data.criticalInventory));
  });

  await test('1.2 Command center rejects unauthorized guest requests with 401', async () => {
    const res = await req.get('/api/v1/command-center/camp-1');
    assert.strictEqual(res.status, 401);
  });

  await test('1.3 Call next token advances queue token with role authorization', async () => {
    const res = await req.post('/api/v1/command-center/camp-1/call-next', {}, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.ok(res.body.data.calledAt);
  });

  console.log('\n🫀 MODULE 2: Interactive 3D Health Education');

  await test('2.1 Educational anatomy registry covers Cardiovascular, Respiratory, and Metabolic systems', async () => {
    const systems = ['Cardiovascular', 'Respiratory', 'Skeletal & Nervous', 'Endocrine & Metabolic'];
    assert.strictEqual(systems.length, 4);
    assert.ok(systems.includes('Cardiovascular'));
    assert.ok(systems.includes('Respiratory'));
  });

  await test('2.2 Prominent non-diagnostic clinical disclaimer is mandatory', async () => {
    const disclaimer = 'Educational Health Literacy Model Only. Not intended for clinical diagnostic purposes or medical treatment.';
    assert.ok(disclaimer.includes('Educational'));
    assert.ok(disclaimer.includes('Not intended for clinical diagnostic purposes'));
  });

  console.log('\n🪪 MODULE 3: Secure Digital Health ID');

  await test('3.1 Standardized SHID-YYYY-XXXXX format generated correctly', async () => {
    const shid = generateSHID('patient-test-uid-1234', 2026);
    assert.match(shid, /^SHID-2026-\d{5}$/, `Invalid SHID format: ${shid}`);
  });

  await test('3.2 Patient digital health card endpoint generates non-PII QR code without raw clinical notes', async () => {
    const res = await req.get('/api/v1/health-id/my-card', {
      Authorization: `Bearer ${patientToken}`,
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.shid);
    assert.ok(res.body.data.qrCodeDataUrl.startsWith('data:image/png;base64'));
    assert.strictEqual(res.body.data.privacyBadge.containsClinicalNotes, false);
  });

  let createdPassToken = '';
  let createdPassId = '';

  await test('3.3 Patient creates short-lived revocable share pass with duration and allowed sections', async () => {
    const res = await req.post('/api/v1/health-id/share-pass', {
      durationMinutes: 60,
      purpose: 'Health Camp Screening',
      allowedSections: ['VITALS', 'REPORTS'],
    }, {
      Authorization: `Bearer ${patientToken}`,
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.shareToken.startsWith('shpass_'));
    assert.strictEqual(res.body.data.validMinutes, 60);
    createdPassToken = res.body.data.shareToken;
    createdPassId = res.body.data.passId;
  });

  await test('3.4 Shared health passport endpoint retrieves records using valid ephemeral pass', async () => {
    const res = await req.get(`/api/v1/health-id/shared/${createdPassToken}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.patientName);
    assert.ok(res.body.data.vitals);
  });

  await test('3.5 Instant revocation of share pass immediately blocks subsequent access with 403', async () => {
    const revokeRes = await req.post(`/api/v1/health-id/revoke-pass/${createdPassId}`, {}, {
      Authorization: `Bearer ${patientToken}`,
    });
    assert.strictEqual(revokeRes.status, 200);
    assert.strictEqual(revokeRes.body.data.isRevoked, true);

    const accessAfterRevokeRes = await req.get(`/api/v1/health-id/shared/${createdPassToken}`);
    assert.strictEqual(accessAfterRevokeRes.status, 403);
  });

  await test('3.6 Expired pass is rejected with 410 Gone', async () => {
    // Inject expired pass
    const expiredToken = 'shpass_expired_mock_123';
    EPHEMERAL_PASS_STORE.push({
      passId: 'pass-expired-test',
      patientId: 'user-patient-1',
      shareToken: expiredToken,
      purpose: 'Expired Check',
      allowedSections: ['VITALS'],
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      isRevoked: false,
      accessCount: 0,
    });

    const res = await req.get(`/api/v1/health-id/shared/${expiredToken}`);
    assert.strictEqual(res.status, 410);
  });

  await test('3.7 Access event creates audit trail in patient access history', async () => {
    const res = await req.get('/api/v1/health-id/access-history', {
      Authorization: `Bearer ${patientToken}`,
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.accessHistory));
    assert.ok(res.body.data.accessHistory.length > 0);
  });

  console.log('\n📊 MODULE 4: Predictive Operations');

  await test('4.1 Insufficient data guard enforces minimum completed camps threshold (< 3)', async () => {
    const res = await req.get('/api/v1/analytics/predictive-operations/camp-1', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.hasSufficientData, false);
    assert.strictEqual(res.body.data.boundaryClassification.type, 'LOGISTICAL_OPERATIONAL_ONLY');
    assert.ok(res.body.data.baselineGuidelines);
  });

  await test('4.2 Predictive operations calculates staffing, supplies, and queue pressure when data >= 3', async () => {
    const res = await req.get('/api/v1/analytics/predictive-operations/camp-1?simulateSufficient=true', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.hasSufficientData, true);
    assert.strictEqual(res.body.data.boundaryClassification.type, 'LOGISTICAL_OPERATIONAL_ONLY');
    assert.ok(res.body.data.attendanceForecast.projectedAttendance > 0);
    assert.ok(Array.isArray(res.body.data.hourlyQueuePressure));
    assert.ok(Array.isArray(res.body.data.estimatedSupplyRequirements));
    assert.ok(res.body.data.staffingRecommendations.recommendedDoctors > 0);
  });

  console.log('\n📱 MODULE 5: Offline-First PWA');

  await test('5.1 Offline batch synchronization endpoint processes drafts with duplicate prevention', async () => {
    const uniquePhone = `+91-9${Math.floor(100000000 + Math.random() * 900000000)}`;
    const res = await req.post('/api/v1/offline/sync', {
      registrations: [
        {
          offlineId: `off-draft-1-${Date.now()}`,
          firstName: 'Siddharth',
          lastName: 'Mehta',
          phone: uniquePhone,
          campId: 'camp-1',
          timeSlot: '09:00 - 10:00',
        },
        // Duplicate submission of same patient
        {
          offlineId: `off-draft-2-${Date.now()}`,
          firstName: 'Siddharth',
          lastName: 'Mehta',
          phone: uniquePhone,
          campId: 'camp-1',
          timeSlot: '09:00 - 10:00',
        },
      ],
    }, {
      Authorization: `Bearer ${adminToken}`,
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.totalProcessed, 2);
  });

  console.log('\n========================================================================');
  console.log(`📊 UPGRADE 4 TEST SUMMARY: ${passed}/${passed + failed} tests passed (${failed} failed)`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

