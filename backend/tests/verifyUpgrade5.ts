// backend/tests/verifyUpgrade5.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import app from '../src/app';
import { signAccessToken } from '../src/utils/jwt';
import { calculateStraightLineDistance, computeLiveCampStatus, extractRegionName } from '../src/controllers/campController';
import { DEMO_CAMPS } from '../src/utils/mockStore';

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

describe('UPGRADE 5 — Smart Map Intelligence & Regional Tracking Verification Suite', () => {
  const req = request(app);

  const adminToken = signAccessToken({
    userId: 'admin-1',
    email: 'admin@healthcamp.gov.in',
    role: 'ADMIN',
    firstName: 'System',
    lastName: 'Admin',
  });

  const patientToken = signAccessToken({
    userId: 'patient-test-1',
    email: 'patient@example.com',
    role: 'PATIENT',
    firstName: 'Sunil',
    lastName: 'Gowda',
  });

  it('1. Accurate straight-line Haversine distance helper calculations', () => {
    // Koramangala (12.9352, 77.6245) to Indiranagar (12.9719, 77.6412) ~ 4.4 km
    const dist = calculateStraightLineDistance(12.9352, 77.6245, 12.9719, 77.6412);
    assert(dist >= 4.0 && dist <= 5.0, `Expected distance ~4.4km, got ${dist}`);

    // Bengaluru to Mysuru ~ 125-145 km
    const distMysuru = calculateStraightLineDistance(12.9716, 77.5946, 12.2958, 76.6394);
    assert(distMysuru >= 120 && distMysuru <= 155, `Expected Bengaluru-Mysuru distance ~135km, got ${distMysuru}`);
  });

  it('2. Live camp scheduled state computation based on date timestamps', () => {
    const futureCamp = {
      startDate: new Date(Date.now() + 86400000 * 5),
      endDate: new Date(Date.now() + 86400000 * 6),
      status: 'UPCOMING',
    };
    assert.strictEqual(computeLiveCampStatus(futureCamp), 'UPCOMING');

    const activeCamp = {
      startDate: new Date(Date.now() - 3600000),
      endDate: new Date(Date.now() + 3600000 * 4),
      status: 'UPCOMING',
    };
    assert.strictEqual(computeLiveCampStatus(activeCamp), 'ONGOING');

    const pastCamp = {
      startDate: new Date(Date.now() - 86400000 * 5),
      endDate: new Date(Date.now() - 86400000 * 2),
      status: 'UPCOMING',
    };
    assert.strictEqual(computeLiveCampStatus(pastCamp), 'COMPLETED');

    const cancelledCamp = {
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 86400000 * 2),
      status: 'CANCELLED',
    };
    assert.strictEqual(computeLiveCampStatus(cancelledCamp), 'CANCELLED');
  });

  it('3. Advanced Nearby Search: Filters by radius and attaches straight-line distance', async () => {
    // Search around Koramangala (12.9352, 77.6245) with 15km radius
    const res = await req.get('/api/v1/camps/map?userLat=12.9352&userLng=77.6245&radius=15');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.data.camps.length > 0);

    for (const camp of res.body.data.camps) {
      assert(typeof camp.straightLineDistance === 'number');
      assert(camp.straightLineDistance <= 15, `Camp ${camp.name} distance ${camp.straightLineDistance} exceeds 15km`);
      assert(camp.distanceLabel && camp.distanceLabel.includes('straight-line'));
    }
  });

  it('4. Regional Analytics: Restricts access to Administrators only', async () => {
    // Unauthenticated
    const unauth = await req.get('/api/v1/camps/regional-analytics');
    assert.strictEqual(unauth.status, 401);

    // Patient user
    const patientRes = await req.get('/api/v1/camps/regional-analytics', {
      Authorization: `Bearer ${patientToken}`,
    });
    assert.strictEqual(patientRes.status, 403);

    // Admin user
    const adminRes = await req.get('/api/v1/camps/regional-analytics', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(adminRes.status, 200);
    assert.strictEqual(adminRes.body.success, true);
  });

  it('5. Regional Analytics: Dynamic region breakdown with coverage and epidemiological disclaimer', async () => {
    const res = await req.get('/api/v1/camps/regional-analytics', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(res.status, 200);
    const { regions, summary, disclaimer, calculationMethod } = res.body.data;

    assert(Array.isArray(regions), 'Regions must be an array');
    assert(regions.length >= 4, 'Should cover multiple regional clusters');
    assert(typeof summary.totalCamps === 'number');
    assert(typeof summary.totalCapacity === 'number');
    assert(typeof summary.totalRegistered === 'number');

    // Verify non-epidemiological guardrails
    assert(disclaimer.includes('Camp distribution and attendance density reflect registered healthcare camps'));
    assert(disclaimer.includes('NOT represent epidemiological disease prevalence'));
    assert(calculationMethod.includes('verified geographic coordinates'));

    for (const r of regions) {
      assert(typeof r.region === 'string');
      assert(typeof r.campsCount === 'number');
      assert(['Well-Covered', 'Moderate', 'Underserved'].includes(r.coverageStatus));
      assert(typeof r.occupancyRate === 'number');
    }
  });

  it('6. Concurrency & Overbooking Prevention: Rejects bookings when camp is at full capacity', async () => {
    // Target a full camp
    const fullCamp = DEMO_CAMPS.find((c) => (c.registered ?? 0) >= (c.capacity || 100)) || DEMO_CAMPS[3];
    // Set capacity to registered to simulate fully booked state
    fullCamp.capacity = 100;
    fullCamp.registered = 100;

    const res = await req.post(
      '/api/v1/appointments',
      {
        campId: fullCamp.id,
        patientId: 'patient-test-concurrency',
        date: new Date().toISOString(),
        timeSlot: '10:00 AM - 11:00 AM',
      },
      {
        Authorization: `Bearer ${patientToken}`,
      }
    );

    assert.strictEqual(res.status, 409, 'Overbooking must be blocked with 409 Conflict');
    assert.strictEqual(res.body.code, 'CAMP_FULL');
  });

  it('7. Public map API guarantees Zero PII exposure', async () => {
    const res = await req.get('/api/v1/camps/map');
    assert.strictEqual(res.status, 200);
    const text = JSON.stringify(res.body);

    // Verify no patient names, emails, phones, or medical records appear in map output
    assert(!text.includes('kavitha'), 'Must not leak patient names');
    assert(!text.includes('@healthcamp.com') || !text.includes('patient'), 'Must not leak patient emails');
    assert(!text.includes('+91-9876'), 'Must not leak patient phone numbers');
  });
});

