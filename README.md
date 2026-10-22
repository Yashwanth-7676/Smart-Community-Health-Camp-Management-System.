# 🏥 Smart Community Health Camp Management System — Ultimate 3D Edition

A complete, production-grade, full-stack healthcare web application designed for organizing, managing, and executing community health camps with real-time operations, interactive 3D visualizations, bilingual AI assistance, and rigorous data protection.

---

## 🌟 Key Features & Capabilities

- **Interactive 3D Visualizations**: Built with Three.js, React Three Fiber, and Drei:
  - Miniature 3D Health Clinic model with interactive OrbitControls.
  - 3D Floating Medical Cross with ambient depth and hover animations.
  - Real-time 3D ECG / Heartbeat trace rendering dynamic P-Q-R-S-T waves.
- **Smart Queue & Appointment System**:
  - Live token tracking with estimated waiting time based on active clinic conditions.
  - Capacity enforcement with transaction-safe double-booking prevention.
  - Contactless QR-code check-in generation and verification.
- **AI Health Assistant**:
  - Bilingual conversational healthcare bot (English & Kannada / ಕನ್ನಡ).
  - Built-in medical safety interceptor that strictly prevents unauthorized drug prescriptions and directs users to qualified professionals.
  - Privacy-first local fallback knowledge base.
- **Role-Based Access Control (RBAC)**:
  - 5 Dedicated roles: **Patient**, **Doctor**, **Volunteer**, **Camp Organizer**, and **Administrator**.
  - Strict server-side route guards, permission validation, and access isolation.
- **DPDP Act (Digital Personal Data Protection) & Audit Logging**:
  - Patient consent tracking (general checkup, data sharing, research, communications).
  - Immutable administrative audit logs with IP tracking, user-agent recording, and JSON change inspection.
- **Medical Documentation & Reports**:
  - Server-side PDF generation for clinical reports and inventory stock status via PDFKit.
  - Vital signs recording, doctor observations, diagnoses, and hospital referrals.
- **PWA (Progressive Web App) & Offline Sync**:
  - Service worker caching (`sw.js`) and web app manifest (`manifest.json`).
  - IndexedDB offline registration queue with automatic conflict resolution upon reconnection.
- **Comprehensive Automated Test Suite**:
  - 18 automated test suites covering auth, capacity limits, duplicate bookings, queue state machines, inventory alerts, confidential reports, offline sync, and AI safety.

---

## 🚀 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 18, TypeScript, Vite |
| **Styling & UI** | Tailwind CSS, Lucide Icons, Glassmorphism design system |
| **3D & Canvas** | Three.js, React Three Fiber (`@react-three/fiber`), Drei (`@react-three/drei`) |
| **Animations** | Framer Motion, GSAP |
| **Backend Runtime** | Node.js, Express, TypeScript |
| **Database & ORM** | PostgreSQL, Prisma ORM (20 models & 9 enums) |
| **Security & Auth** | JWT (Access + Refresh tokens), bcryptjs, express-rate-limit, Helmet |
| **Document & QR Generation** | PDFKit, QRCode |
| **Maps & Analytics** | Leaflet, OpenStreetMap, Recharts |
| **Internationalization** | i18next (English & Kannada / ಕನ್ನಡ) |
| **Testing** | Node.js TSX test runner |

---

## 📁 Project Architecture

```
Smart community health camp management system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # 20 relational models & 9 enums
│   │   └── seed.ts                # Realistic demo seeder
│   ├── src/
│   │   ├── controllers/           # Business logic & endpoints
│   │   │   ├── aiAssistantController.ts
│   │   │   ├── analyticsController.ts
│   │   │   ├── appointmentController.ts
│   │   │   ├── auditController.ts
│   │   │   ├── authController.ts
│   │   │   ├── campController.ts
│   │   │   ├── consentController.ts
│   │   │   ├── inventoryController.ts
│   │   │   ├── passwordResetController.ts
│   │   │   ├── pdfController.ts
│   │   │   ├── qrController.ts
│   │   │   └── reportController.ts
│   │   ├── middleware/            # Auth, RBAC, rate-limiting, audit logger
│   │   ├── routes/                # Express v1 route definitions
│   │   ├── utils/                 # JWT, encryption, helpers
│   │   ├── app.ts                 # Express middleware & route mounts
│   │   └── server.ts              # HTTP & WebSocket initialization
│   ├── tests/
│   │   ├── fixtures.ts            # Test utilities & assertions
│   │   └── runAllTests.ts         # Automated test runner (18 test suites)
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── public/
    │   ├── manifest.json          # Progressive Web App manifest
    │   └── sw.js                  # PWA service worker
    ├── src/
    │   ├── api/                   # Axios API clients
    │   ├── components/
    │   │   ├── ai/                # AI Assistant floating widget
    │   │   ├── charts/            # Recharts analytics
    │   │   ├── common/            # QR display, Live queue, modals
    │   │   ├── layout/            # Navbar, Sidebar, Footer
    │   │   ├── maps/              # Leaflet camp maps
    │   │   └── three/             # R3F 3D Scenes (Hero, Clinic, Heartbeat, Cross)
    │   ├── contexts/              # Auth, Language, Theme contexts
    │   ├── i18n/                  # English and Kannada locales
    │   ├── pages/                 # Role dashboards and public pages
    │   │   ├── admin/             # Audit logs, consent, camps, users
    │   │   ├── auth/              # Login, register, password reset
    │   │   ├── doctor/            # Queue, checkups, reports, referrals
    │   │   ├── patient/           # Bookings, QR pass, reports, profile
    │   │   └── volunteer/         # QR check-in scanner, queue assistance
    │   ├── App.tsx                # App routing & providers
    │   └── main.tsx               # Service worker registration & entry
    └── package.json
```

---

## ⚡ Quick Setup & Execution Guide

### Prerequisites
- **Node.js 18+** installed
- **PostgreSQL 15+** installed and running
- **Git**

---

### Step 1 — Database Setup
Connect to your local PostgreSQL instance:
```powershell
psql -U postgres
```

Execute SQL commands:
```sql
CREATE DATABASE healthcamp;
CREATE USER healthcamp_user WITH PASSWORD 'HealthCamp@2024';
GRANT ALL PRIVILEGES ON DATABASE healthcamp TO healthcamp_user;
\q
```

---

### Step 2 — Backend Configuration & Seeding
In the project root, navigate to `backend/`:
```powershell
cd "d:\yashwanth project\Smart community health camp management system\backend"
npm install
```

Configure your `.env` (or copy `.env.example`):
```env
DATABASE_URL="postgresql://healthcamp_user:HealthCamp@2024@localhost:5432/healthcamp?schema=public"
JWT_SECRET="smart-health-camp-jwt-secret-key-2024"
JWT_REFRESH_SECRET="smart-health-camp-refresh-secret-key-2024"
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

Run migrations and database seeder:
```powershell
# Generate Prisma Client with all 20 models
npx prisma generate

# Apply migrations
npx prisma migrate dev --name init

# Seed database with realistic demo data
npx prisma db seed
```

---

### Step 3 — Run the Backend
```powershell
# Development mode
npm run dev

# Or build & start production bundle
npm run build
npm start
```
The API server will listen on `http://localhost:5000`.

---

### Step 4 — Frontend Setup & Launch
Open a second terminal window:
```powershell
cd "d:\yashwanth project\Smart community health camp management system\frontend"
npm install
npm run dev
```
Open `http://localhost:3000` or `http://localhost:5173` in your browser.

---

---

## 📚 Complete Project Documentation Suite

All academic engineering project documentation has been prepared and formatted:

| Document | File Path | Contents |
| :--- | :--- | :--- |
| **Academic Project Report** | [`docs/PROJECT_REPORT.md`](docs/PROJECT_REPORT.md) | Formal 17-section engineering report (Abstract, SRS, Architecture, Module Specs, Testing, DPDP) |
| **System Architecture** | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | High-level Mermaid architecture diagram & layer-by-layer subsystem specification |
| **Demonstration Workflow** | [`docs/DEMO_WORKFLOW.md`](docs/DEMO_WORKFLOW.md) | Complete 10-step evaluator walkthrough from camp creation to PDF report download |
| **Presentation & Defense** | [`docs/PRESENTATION.md`](docs/PRESENTATION.md) | 15 slide outlines, 2-minute demo script, 20 viva Q&As, and 5 challenging defense questions |
| **Production Deployment** | [`DEPLOYMENT.md`](DEPLOYMENT.md) | Vercel, Netlify, Render Blueprint, Docker, and Supabase/Neon PostgreSQL instructions |

---

## 🧪 Automated Testing & Quality Assurance Suite

The project includes comprehensive automated test runners spanning unit, integration, role security, and end-to-end user workflows:

### 1. Upgrade 11: Smart Community Healthcare Ecosystem 2.0 Suite
Verifies personalized patient journey telemetry, executive operations command center, doctor consultation turnaround metrics, and clinical continuity of care:
```powershell
cd backend
npm test
# or: npm run test:upgrade11
```

### 2. Master QA Automation Suite (Backend & E2E)
Runs all 10 QA modules including security, capacity enforcement, QR lifecycle, IDOR protections, and the complete 8-step user journey:
```powershell
cd backend
npm run test:upgrade10
```

### 3. Frontend Unit & Geodetic Verification Suite
Validates date/time formatting, dynamic status badges, and geodetic Haversine straight-line distance calculations:
```powershell
cd frontend
npm test
```

### 4. Comprehensive 14-Suite Production Regression Suite
Validates atomic concurrent booking transactions, Bcrypt/JWT security, Zod schemas, inventory replenishment, and clinical AI interceptors:
```powershell
cd backend
npm run test:all
```

### 5. Specialized Verification Suites
- **3D Geographic Map & Routing**: `npx tsx tests/verifyUpgrade9.ts` (23/23 tests pass)
- **Camp Discovery & Public Map**: `npx tsx tests/verifyCampMap.ts` (8/8 tests pass)
- **Clinical Workflows & PDF**: `npx tsx tests/verifyAllWorkflows.ts` (21/21 tests pass)

### Verification Summary
```
========================================================================
📊 COMPREHENSIVE QUALITY ASSURANCE SUMMARY
========================================================================
  ✅ Upgrade 11 Healthcare Ecosystem 2.0 (verifyUpgrade11.ts): 19/19 PASSED
  ✅ Backend Master QA Suite (verifyUpgrade10.ts):            43/43 PASSED
  ✅ Frontend QA & Geodetic Suite (verifyFrontend.ts):        13/13 PASSED
  ✅ 14-Suite Production Regression (runAllTests.ts):         47/47 PASSED
  ✅ 3D Geographic Map & Routing (verifyUpgrade9.ts):         23/23 PASSED
  ✅ Camp Discovery & Public Map (verifyCampMap.ts):           8/8 PASSED
  ✅ Complete 8-Step End-to-End Simulation:                    8/8 PASSED
  ----------------------------------------------------------------------
  🎯 TOTAL AUTOMATED TESTS:                                 153/153 PASSED (100%)
========================================================================
```

---

## 🔑 Demo Login Accounts & 1-Click Role Switcher

You can click the **Demo Mode** button directly in the application header to switch roles instantly without typing:

| Role | Email | Password | Primary Capabilities |
|------|-------|----------|----------------------|
| **Admin** | `admin@healthcamp.com` | `Admin@123` | Executive command center, camp creation, staff deployment, DPDP consent, audit logs |
| **Doctor** | `doctor1@healthcamp.com` | `Doctor@123` | Real-time queue, clinical checkups, vitals, PDF report sealing, hospital referrals |
| **Volunteer** | `volunteer1@healthcamp.com` | `Volunteer@123` | Venue QR check-in terminal, queue coordination, attendance validation |
| **Patient 1** | `patient1@healthcamp.com` | `Patient@123` | Camp discovery, appointment booking, digital QR pass, private medical records |
| **Patient 2** | `patient2@healthcamp.com` | `Patient@123` | Queue token status, consent management, notifications |

---

## 🌐 Application Route Index

### Public Experience
- `/` — Homepage featuring 3D Hero scene, interactive 3D clinic, animated stats, and camp schedule.
- `/about` — Community healthcare mission, problem analysis, and technology solutions.
- `/camps` — Camp discovery engine with multi-filters, calendar picker, and interactive Leaflet map.
- `/health-awareness` — Preventative health articles and community advisories.
- `/contact` — Emergency helpline, camp locator, and inquiry form.
- `/privacy` — DPDP Act data rights, transparency disclosure, and retention policies.

### Authentication & Recovery
- `/auth/login` — Secure JWT session login with role redirection.
- `/auth/register` — Patient registration with password strength requirements.
- `/auth/forgot-password` — Password reset request via token.
- `/auth/reset-password` — Tokenized password renewal.

### Role Dashboards
- `/patient/dashboard` — Personal appointment history, live queue tracking, and QR pass.
- `/patient/appointments` — Interactive booking calendar with real-time slot availability.
- `/patient/profile` — Medical history, blood group, emergency contacts.
- `/doctor/dashboard` — Live clinic queue, vitals entry, observations, referrals, and PDF report signing.
- `/doctor/reports` — Authorized clinical records archive.
- `/volunteer/dashboard` — Fast QR scanner check-in and queue token caller.
- `/admin/dashboard` — Camp metrics, demographic charts, attendance breakdown.
- `/admin/audit` — Immutable system audit logs with JSON payload viewer.
- `/admin/consent` — DPDP consent registry with real-time revocation management.
- `/inventory` — Medicine batch expiry tracking, reorder thresholds, and PDF stock exports.

---

## 🛡️ Security, Privacy & Compliance

1. **Digital Personal Data Protection (DPDP) Act Compliance**:
   - Explicit consent tracking for health checkup, data sharing, research, and notifications.
   - One-click consent revocation with instant access restriction.
2. **Medical Guardrails on AI Assistant**:
   - Queries requesting medicine dosages, pharmaceutical treatments, or prescriptions are automatically intercepted.
   - Users receive safe non-diagnostic education and are redirected to licensed camp doctors.
3. **Transaction Safety**:
   - Camp capacity checks and appointment slot locking run within database transactions to eliminate race conditions and overbooking.
4. **Data Isolation**:
   - Patients can strictly access only their personal health records and appointments.
   - Audit logs record all administrative, doctor, and patient state mutations.

---

## 📄 License
This project is licensed under the **MIT License** for open community healthcare enhancement and educational purposes.
 