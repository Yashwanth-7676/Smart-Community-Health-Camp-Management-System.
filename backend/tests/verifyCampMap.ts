// backend/tests/verifyCampMap.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import app from '../src/app';
import { signAccessToken } from '../src/utils/jwt';

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
    async patch(path: string, data: any = {}, headers: Record<string, string> = {}) {
      return new Promise<any>((resolve, reject) => {
        server.listen(0, () => {
          const address = server.address() as any;
          const payload = JSON.stringify(data);
          const req = http.request(
            {
              hostname: '127.0.0.1',
              port: address.port,
              path,
              method: 'PATCH',
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

describe('Health Camp Discovery Map Verification Suite', () => {
  const req = request(app);

  const adminToken = signAccessToken({
    userId: 'admin-1',
    email: 'admin@healthcamp.gov.in',
    role: 'admin',
    firstName: 'System',
    lastName: 'Admin',
  });

  const patientToken = signAccessToken({
    userId: 'patient-1',
    email: 'patient@example.com',
    role: 'patient',
    firstName: 'Ramesh',
    lastName: 'Kumar',
  });

  it('1. GET /api/v1/camps/map returns 200 with verified coordinates and summary', async () => {
    const res = await req.get('/api/v1/camps/map');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(Array.isArray(res.body.data.camps));
    assert(res.body.data.camps.length >= 10, 'Should return at least 10 real-world camps');
    assert(res.body.data.summary, 'Should return summary breakdown');
    assert(typeof res.body.data.summary.upcoming === 'number');
    assert(typeof res.body.data.summary.ongoing === 'number');
  });

  it('2. Every returned camp has strict, valid geographical coordinates within valid ranges', async () => {
    const res = await req.get('/api/v1/camps/map');
    for (const camp of res.body.data.camps) {
      assert(typeof camp.latitude === 'number', `Camp ${camp.name} lat must be number`);
      assert(typeof camp.longitude === 'number', `Camp ${camp.name} lng must be number`);
      assert(!isNaN(camp.latitude), `Camp ${camp.name} lat must not be NaN`);
      assert(!isNaN(camp.longitude), `Camp ${camp.name} lng must not be NaN`);
      assert(camp.latitude >= -90 && camp.latitude <= 90, `Camp ${camp.name} lat out of bounds`);
      assert(camp.longitude >= -180 && camp.longitude <= 180, `Camp ${camp.name} lng out of bounds`);
      assert(!(camp.latitude === 0 && camp.longitude === 0), `Camp ${camp.name} cannot be (0,0)`);
      assert.strictEqual(camp.coordinatesValid, true);
    }
  });

  it('3. Map includes camps distributed across Karnataka and India', async () => {
    const res = await req.get('/api/v1/camps/map');
    const locations = res.body.data.camps.map((c: any) => `${c.location} ${c.address}`.toLowerCase());
    const hasKarnataka = locations.some((loc: string) =>
      loc.includes('bengaluru') ||
      loc.includes('koramangala') ||
      loc.includes('mysuru') ||
      loc.includes('mangaluru') ||
      loc.includes('hubballi')
    );
    const hasIndia = locations.some((loc: string) =>
      loc.includes('mumbai') ||
      loc.includes('hyderabad') ||
      loc.includes('delhi') ||
      loc.includes('chennai')
    );
    assert(hasKarnataka, 'Must support camps across Karnataka');
    assert(hasIndia, 'Must support multi-city national scope');
  });

  it('4. Filters by search query (city, locality, or camp name)', async () => {
    const res = await req.get('/api/v1/camps/map?search=Koramangala');
    assert.strictEqual(res.status, 200);
    assert(res.body.data.camps.length > 0);
    for (const camp of res.body.data.camps) {
      const match =
        camp.name.toLowerCase().includes('koramangala') ||
        camp.location.toLowerCase().includes('koramangala') ||
        camp.address.toLowerCase().includes('koramangala');
      assert(match, `Camp ${camp.name} should match Koramangala`);
    }
  });

  it('5. Filters by medical specialty/service', async () => {
    const res = await req.get('/api/v1/camps/map?service=Cardiology');
    assert.strictEqual(res.status, 200);
    for (const camp of res.body.data.camps) {
      const hasService = camp.services.some((s: string) => s.toLowerCase().includes('cardiology'));
      assert(hasService, `Camp ${camp.name} should include Cardiology service`);
    }
  });

  it('6. Filters by status (UPCOMING vs ONGOING)', async () => {
    const resOngoing = await req.get('/api/v1/camps/map?status=ONGOING');
    assert.strictEqual(resOngoing.status, 200);
    for (const camp of resOngoing.body.data.camps) {
      assert.strictEqual(camp.status, 'ONGOING');
    }

    const resUpcoming = await req.get('/api/v1/camps/map?status=UPCOMING');
    assert.strictEqual(resUpcoming.status, 200);
    for (const camp of resUpcoming.body.data.camps) {
      assert.strictEqual(camp.status, 'UPCOMING');
    }
  });

  it('7. Live booking availability calculates slots and sets isFullyBooked without overbooking', async () => {
    const res = await req.get('/api/v1/camps/map');
    assert.strictEqual(res.status, 200);
    for (const camp of res.body.data.camps) {
      assert(typeof camp.capacity === 'number');
      assert(typeof camp.registered === 'number');
      assert(typeof camp.availableSlots === 'number');
      assert.strictEqual(camp.availableSlots, Math.max(0, camp.capacity - camp.registered));
      if (camp.registered >= camp.capacity) {
        assert.strictEqual(camp.isFullyBooked, true);
        assert.strictEqual(camp.availableSlots, 0);
      }
    }
  });

  it('8. PATCH /api/v1/camps/:id/location enforces admin authorization and coordinate validation', async () => {
    // 8a. Reject unauthenticated or patient user
    const unauthRes = await req.patch('/api/v1/camps/camp-1/location', {
      latitude: 12.9352,
      longitude: 77.6245,
    });
    assert.strictEqual(unauthRes.status, 401);

    const patientRes = await req.patch(
      '/api/v1/camps/camp-1/location',
      { latitude: 12.9352, longitude: 77.6245 },
      { Authorization: `Bearer ${patientToken}` }
    );
    assert.strictEqual(patientRes.status, 403);

    // 8b. Reject out-of-bounds coordinates (latitude > 90)
    const invalidRes = await req.patch(
      '/api/v1/camps/camp-1/location',
      { latitude: 95.0, longitude: 77.6245 },
      { Authorization: `Bearer ${adminToken}` }
    );
    assert.strictEqual(invalidRes.status, 400);

    // 8c. Successfully update with valid coordinates for admin
    const validRes = await req.patch(
      '/api/v1/camps/camp-1/location',
      { latitude: 12.9348, longitude: 77.6251, address: 'Verified Location, Bengaluru' },
      { Authorization: `Bearer ${adminToken}` }
    );
    assert.strictEqual(validRes.status, 200);
    assert.strictEqual(validRes.body.success, true);
    assert.strictEqual(validRes.body.data.latitude, 12.9348);
    assert.strictEqual(validRes.body.data.longitude, 77.6251);
  });
});

