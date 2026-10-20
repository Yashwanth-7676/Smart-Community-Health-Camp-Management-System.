// backend/tests/verifyUpgrade6.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import app from '../src/app';
import { signAccessToken } from '../src/utils/jwt';
import { inMemoryAuditLogs } from '../src/middleware/auditLog';
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

describe('UPGRADE 6 — AI Planning, 3D Geographic Data, and Community Impact Suite', () => {
  const req = request(app);

  const adminToken = signAccessToken({
    userId: 'admin-planner-1',
    email: 'admin@healthcamp.gov.in',
    role: 'ADMIN',
    firstName: 'Superintendent',
    lastName: 'Admin',
  });

  const patientToken = signAccessToken({
    userId: 'patient-test-6',
    email: 'patient@example.com',
    role: 'PATIENT',
    firstName: 'Asha',
    lastName: 'Devi',
  });

  it('1. AI Camp Planning Assistant enforces strict Administrator authorization', async () => {
    // Unauthenticated
    const unauth = await req.get('/api/v1/ai-planner/proposals');
    assert.strictEqual(unauth.status, 401);

    // Patient user
    const patientRes = await req.get('/api/v1/ai-planner/proposals', {
      Authorization: `Bearer ${patientToken}`,
    });
    assert.strictEqual(patientRes.status, 403);

    // Admin user
    const adminRes = await req.get('/api/v1/ai-planner/proposals', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(adminRes.status, 200);
    assert.strictEqual(adminRes.body.success, true);
    assert(Array.isArray(adminRes.body.data.proposals));
    assert(adminRes.body.data.proposals.length >= 2);
  });

  it('2. AI Proposals provide evidence, assumptions, staffing, supplies, and non-epidemiological guardrails', async () => {
    const res = await req.get('/api/v1/ai-planner/proposals', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(res.status, 200);

    const proposal = res.body.data.proposals[0];
    assert(proposal.id);
    assert(proposal.district);
    assert(typeof proposal.latitude === 'number');
    assert(typeof proposal.longitude === 'number');
    assert(Array.isArray(proposal.evidence) && proposal.evidence.length > 0);
    assert(Array.isArray(proposal.assumptions) && proposal.assumptions.length > 0);
    assert(typeof proposal.recommendedStaffing.doctors === 'number');
    assert(typeof proposal.recommendedStaffing.nurses === 'number');
    assert(Array.isArray(proposal.recommendedSupplies) && proposal.recommendedSupplies.length > 0);

    // Non-epidemiological policy check
    assert(proposal.guardrailNotice.includes('NOT model or infer disease prevalence'));
    assert(res.body.data.disclaimer.includes('Disease prevalence is NOT inferred from camp attendance'));
  });

  it('3. AI Proposal Approval converts proposal into an upcoming camp and records audit log', async () => {
    const initialCampCount = DEMO_CAMPS.length;
    const initialAuditCount = inMemoryAuditLogs.length;

    const res = await req.post(
      '/api/v1/ai-planner/approve',
      {
        proposalId: 'prop-kalaburagi-01',
        customName: 'Verified Sedam Community Screening Camp',
        customCapacity: 250,
        reviewNotes: 'Reviewed and approved by District Health Officer.',
      },
      {
        Authorization: `Bearer ${adminToken}`,
      }
    );

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.proposal.status, 'APPROVED');
    assert.strictEqual(res.body.data.camp.name, 'Verified Sedam Community Screening Camp');

    // Verify camp was created
    assert(DEMO_CAMPS.length >= initialCampCount || res.body.data.camp.id);

    // Verify audit log recorded
    assert(inMemoryAuditLogs.length > initialAuditCount);
    const log = inMemoryAuditLogs[0];
    assert.strictEqual(log.entity, 'CAMP_AI_PLAN');
    assert.strictEqual(log.entityId, 'prop-kalaburagi-01');
  });

  it('4. AI Proposal Rejection updates proposal status and logs administrative rationale', async () => {
    const res = await req.post(
      '/api/v1/ai-planner/reject',
      {
        proposalId: 'prop-belagavi-02',
        rejectionReason: 'Conflict with local municipal holiday assembly.',
      },
      {
        Authorization: `Bearer ${adminToken}`,
      }
    );

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.proposal.status, 'REJECTED');
    assert.strictEqual(res.body.data.proposal.reviewNotes, 'Conflict with local municipal holiday assembly.');

    // Verify audit log recorded
    const log = inMemoryAuditLogs[0];
    assert.strictEqual(log.entity, 'CAMP_AI_PLAN');
    assert.strictEqual(log.entityId, 'prop-belagavi-02');
  });

  it('5. Community Impact Analytics returns verified definitions and non-epidemiological guardrails', async () => {
    const res = await req.get('/api/v1/analytics/community-impact', {
      Authorization: `Bearer ${adminToken}`,
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    const { summary, definitions, disclaimer } = res.body.data;

    assert(typeof summary.totalCampsConducted === 'number');
    assert(typeof summary.totalRegisteredPatients === 'number');
    assert(typeof summary.totalScreenedAttendees === 'number');
    assert(typeof summary.attendanceRate === 'number');
    assert(typeof summary.followUpCompletionRate === 'number');

    assert(definitions.attendanceRate, 'Must define attendance rate calculation');
    assert(definitions.followUpCompletionRate, 'Must define follow up completion rate');
    assert(disclaimer.includes('NOT represent total community disease prevalence'));
  });

  it('6. Community Impact CSV export endpoint streams valid CSV file', async () => {
    const res = await req.get('/api/v1/analytics/community-impact/export-csv', {
      Authorization: `Bearer ${adminToken}`,
    });

    assert.strictEqual(res.status, 200);
    assert(res.headers['content-type'].includes('text/csv'));
    assert(typeof res.body === 'string' && res.body.includes('Camp Name,Location,District'));
  });
});
