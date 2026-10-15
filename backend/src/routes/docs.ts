// backend/src/routes/docs.ts
import { Router, Request, Response } from 'express';

const router = Router();

const API_ENDPOINTS = [
  {
    category: 'Authentication',
    endpoints: [
      { method: 'POST', path: '/api/v1/auth/register', auth: 'Public', desc: 'Register a new patient account with password complexity validation.' },
      { method: 'POST', path: '/api/v1/auth/login', auth: 'Public', desc: 'Authenticate user credentials and receive access + refresh token cookies.' },
      { method: 'GET', path: '/api/v1/auth/me', auth: 'Authenticated', desc: 'Retrieve current authenticated profile, role, and permissions.' },
      { method: 'POST', path: '/api/v1/auth/refresh', auth: 'Refresh Token', desc: 'Issue new 15-minute access token from valid refresh token.' },
      { method: 'POST', path: '/api/v1/auth/logout', auth: 'Authenticated', desc: 'Clear session cookies and revoke active token pair.' },
      { method: 'POST', path: '/api/v1/password-reset/request', auth: 'Public', desc: 'Request password reset with expiring verification token.' },
      { method: 'POST', path: '/api/v1/password-reset/confirm', auth: 'Public', desc: 'Reset password using verified security token.' },
    ],
  },
  {
    category: 'Health Camps',
    endpoints: [
      { method: 'GET', path: '/api/v1/camps', auth: 'Public', desc: 'Query camps with multi-filter search (location, date, service, status, pagination).' },
      { method: 'GET', path: '/api/v1/camps/:id', auth: 'Public', desc: 'Fetch detailed camp specifications, assigned clinical departments, and capacity.' },
      { method: 'POST', path: '/api/v1/camps', auth: 'ADMIN, ORGANIZER', desc: 'Schedule a new community health camp with geo-coordinates and capacity.' },
      { method: 'PUT', path: '/api/v1/camps/:id', auth: 'ADMIN, ORGANIZER', desc: 'Modify existing camp details, operational dates, and services.' },
      { method: 'DELETE', path: '/api/v1/camps/:id', auth: 'ADMIN', desc: 'Cancel or archive a scheduled health camp.' },
    ],
  },
  {
    category: 'Appointments & Smart Queue',
    endpoints: [
      { method: 'GET', path: '/api/v1/appointments', auth: 'Authenticated', desc: 'List appointment bookings (scoped by role: Patient sees own, Doctor/Admin sees camp).' },
      { method: 'POST', path: '/api/v1/appointments', auth: 'PATIENT', desc: 'Book camp appointment slot with transaction-safe capacity validation & duplicate prevention.' },
      { method: 'PUT', path: '/api/v1/appointments/:id', auth: 'Authenticated', desc: 'Reschedule or cancel an existing appointment slot.' },
      { method: 'GET', path: '/api/v1/appointments/camp/:campId/slots', auth: 'Public', desc: 'Retrieve available time slots and capacity utilization.' },
      { method: 'POST', path: '/api/v1/qr/verify-checkin', auth: 'VOLUNTEER, DOCTOR, ADMIN', desc: 'Verify patient contactless QR pass and mark arrival.' },
    ],
  },
  {
    category: 'Clinical Records & Reports',
    endpoints: [
      { method: 'GET', path: '/api/v1/reports', auth: 'Authenticated', desc: 'Access authorized medical reports (strictly isolated by patient ID / treating doctor).' },
      { method: 'POST', path: '/api/v1/reports', auth: 'DOCTOR', desc: 'Publish verified clinical observations, vital signs, and prescriptions.' },
      { method: 'GET', path: '/api/v1/reports/:id/pdf', auth: 'Authenticated', desc: 'Generate official signed PDF checkup report via PDFKit engine.' },
    ],
  },
  {
    category: 'Medicine Inventory',
    endpoints: [
      { method: 'GET', path: '/api/v1/inventory', auth: 'DOCTOR, ADMIN', desc: 'Fetch pharmacy batches, available quantities, and low-stock alerts.' },
      { method: 'POST', path: '/api/v1/inventory', auth: 'ADMIN', desc: 'Log medicine stock intake, batch lot numbers, and expiry dates.' },
      { method: 'GET', path: '/api/v1/inventory/pdf', auth: 'ADMIN, DOCTOR', desc: 'Download printable pharmacy stock audit sheet in PDF format.' },
    ],
  },
  {
    category: 'AI Assistant & Safety',
    endpoints: [
      { method: 'POST', path: '/api/v1/ai/chat', auth: 'Public', desc: 'Bilingual health guidance bot with strict drug-prescription safety guards.' },
    ],
  },
  {
    category: 'Governance, DPDP & Audit',
    endpoints: [
      { method: 'GET', path: '/api/v1/consent', auth: 'ADMIN', desc: 'List DPDP Act consent records across clinical treatments and data sharing.' },
      { method: 'POST', path: '/api/v1/consent', auth: 'PATIENT, ADMIN', desc: 'Grant or revoke patient consent with timestamped audit trail.' },
      { method: 'GET', path: '/api/v1/audit', auth: 'ADMIN', desc: 'Retrieve immutable administrative audit logs with IP and user-agent metadata.' },
    ],
  },
];

// JSON Schema output
router.get('/json', (_req: Request, res: Response) => {
  res.json({
    title: 'Smart Community Health Camp Management API',
    version: '2.0.0-ultimate-3d',
    baseUrl: '/api/v1',
    timestamp: new Date().toISOString(),
    endpoints: API_ENDPOINTS,
  });
});

// Interactive HTML output
router.get('/', (_req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Smart Community Health Camp - API Documentation</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root { --bg: #050c18; --card: #0a1628; --text: #f8fafc; --cyan: #06b6d4; --border: #1e3a6e; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 24px; }
    .container { max-width: 1000px; margin: 0 auto; }
    header { border-bottom: 1px solid var(--border); padding-bottom: 20px; margin-bottom: 28px; }
    h1 { color: #fff; margin: 0 0 8px 0; font-size: 26px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: bold; background: rgba(6, 182, 212, 0.15); color: var(--cyan); border: 1px solid rgba(6, 182, 212, 0.3); }
    .category { margin-bottom: 32px; }
    .category-title { font-size: 18px; font-weight: bold; color: var(--cyan); margin-bottom: 12px; border-left: 3px solid var(--cyan); padding-left: 10px; }
    .endpoint { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 14px 18px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 6px; }
    .row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .method { font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 6px; min-width: 55px; text-align: center; }
    .get { background: #0284c7; color: #fff; }
    .post { background: #10b981; color: #fff; }
    .put { background: #f59e0b; color: #000; }
    .delete { background: #ef4444; color: #fff; }
    .path { font-family: monospace; font-size: 13px; font-weight: 600; color: #38bdf8; }
    .auth { font-size: 11px; padding: 2px 7px; border-radius: 6px; background: rgba(255,255,255,0.08); color: #94a3b8; margin-left: auto; }
    .desc { font-size: 12px; color: #94a3b8; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🏥 Smart Community Health Camp API Directory</h1>
      <p style="color: #94a3b8; font-size: 13px; margin: 0 0 10px 0;">Production-grade REST endpoints with role permissions, Zod validation, and DPDP compliance.</p>
      <span class="badge">v2.0.0-ultimate-3d</span>
      <span class="badge" style="margin-left: 6px;">JSON Spec: <a href="/api/docs/json" style="color: inherit;">/api/docs/json</a></span>
    </header>

    ${API_ENDPOINTS.map(
      (cat) => `
      <div class="category">
        <div class="category-title">${cat.category}</div>
        ${cat.endpoints
          .map(
            (ep) => `
          <div class="endpoint">
            <div class="row">
              <span class="method ${ep.method.toLowerCase()}">${ep.method}</span>
              <span class="path">${ep.path}</span>
              <span class="auth">${ep.auth}</span>
            </div>
            <p class="desc">${ep.desc}</p>
          </div>
        `
          )
          .join('')}
      </div>
    `
    ).join('')}
  </div>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;

