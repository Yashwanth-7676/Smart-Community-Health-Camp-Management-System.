# 🏥 SMART COMMUNITY HEALTH CAMP MANAGEMENT SYSTEM
## Final Engineering Project Technical Report & System Specification

**Degree / Discipline**: Bachelor of Engineering in Computer Science & Engineering  
**Academic Year**: 2026  
**System Status**: Fully Implemented, Tested, Hardened & Production Deployed  

---

## 1. ABSTRACT

Community health camps are vital public health mechanisms in developing nations, serving as primary conduits for preventive screening, diagnostic triage, chronic illness management, and medicine distribution across underserved urban and rural populations. Historically, these outreach initiatives suffer from severe administrative bottlenecks: paper-based registration ledgers, chaotic crowd queues with prolonged waiting times, lack of digital medical records, zero inventory synchronization, and absence of standardized data privacy protections.

This project presents the **Smart Community Health Camp Management System — Ultimate 3D Edition**, a modern full-stack healthcare web platform combining immersive WebGL/Three.js 3D visualizations, high-concurrency transactional booking, real-time live queue token tracking with contactless QR-code check-ins, automated clinical report and PDF generation via PDFKit, offline-first sync capabilities for remote field environments, and an AI-powered conversational health assistant equipped with strict clinical safety guardrails. The platform enforces strict Role-Based Access Control (RBAC) across five specialized stakeholder personas (Patients, Doctors, Volunteers, Camp Organizers, and System Administrators) and adheres to India's Digital Personal Data Protection (DPDP) Act with comprehensive consent logging and immutable administrative audit trails.

---

## 2. INTRODUCTION

Healthcare accessibility remains unevenly distributed between tier-1 metropolises and rural or semi-urban communities. Non-governmental organizations (NGOs), government health departments, and philanthropic medical trusts conduct periodic outreach camps to bridge this gap. However, traditional manual management processes lead to high error rates, unmonitored medicine stockouts, duplicate patient entries, and loss of historical patient records between successive camp visits.

The **Smart Community Health Camp Management System** modernizes this entire operational lifecycle. Designed using a modern decoupled architecture (React, TypeScript, Vite, Tailwind CSS, Express, Prisma ORM, and PostgreSQL), it provides a single unified platform for coordinating multi-specialty camps, registering citizens, tracking venue wait times, issuing digitized diagnostic reports, and delivering community health awareness in both English and Kannada (ಕನ್ನಡ).

---

## 3. EXISTING SYSTEM AND LIMITATIONS

Existing methodologies rely predominantly on physical paper tokens, handwritten registers, and ad-hoc standalone spreadsheets. Key limitations include:

1. **Unregulated Crowd Queues**: Patients wait 3–5 hours without knowing when their token will be called, causing congestion and patient exhaustion.
2. **Double-Booking & Capacity Breaches**: Inability to enforce strict session capacities leads to camps accepting more patients than available doctor consultation slots.
3. **Absence of Longitudinal Medical Records**: When patients attend follow-up camps months later, previous vital signs, diagnoses, and prescriptions are unavailable.
4. **Drug Inventory Wastage & Stockouts**: Absence of live inventory monitoring leads to critical medicine shortages (e.g., Paracetamol, ORS, Metformin) or expiration of unused pharmaceuticals.
5. **Data Security & Privacy Vulnerabilities**: Paper files containing sensitive medical history and personal identifying information (PII) are easily lost, misplaced, or viewed by unauthorized personnel.
6. **Network Fragility in Remote Locations**: Traditional cloud-only web applications fail entirely when rural camps experience cellular or broadband outages.

---

## 4. PROPOSED SYSTEM

The proposed system replaces error-prone manual logistics with a resilient, reactive, and secure digital platform:

- **Interactive 3D Visual Engagement**: A WebGL-powered 3D medical environment that makes public health technology trustworthy and engaging.
- **Transaction-Safe Atomic Booking**: Prisma transaction isolation prevents concurrent overbooking and duplicate registrations on identical dates.
- **Digital Queue Token Engine**: Automated token numbering with dynamic estimated wait times based on live doctor throughput.
- **Contactless QR-Code Check-In**: Field volunteers scan patient QR passes to instantly transition tokens from `SCHEDULED` $\to$ `WAITING` $\to$ `CALLED` $\to$ `COMPLETED`.
- **Bilingual AI Health Assistant**: A server-side assisted conversational agent delivering health guidelines in English and Kannada, with regex safety filters intercepting medication dosage requests.
- **Offline Registration & Deduplication**: Camp volunteers register walk-in patients during connectivity drops, automatically synchronizing and deduplicating records upon reconnection.
- **DPDP Act & Audit Compliance**: Explicit consent tracking for medical processing and immutable SHA-256 audit logging of all administrative actions.

---

## 5. PROBLEM STATEMENT

To design, develop, test, and deploy a secure, fault-tolerant, bilingual, and responsive healthcare management platform capable of orchestrating end-to-end community health camp operations—from public camp announcement and slot reservation to venue queue orchestration, clinical diagnostics documentation, and pharmaceutical inventory control—while guaranteeing sub-second latency, role authorization isolation, and complete patient data confidentiality.

---

## 6. OBJECTIVES AND SCOPE

### 6.1 Core Objectives
1. Eliminate physical paper queues through digital token allocation and dynamic wait-time estimation.
2. Provide a 100% responsive, accessible interface with light/dark modes and regional language support (Kannada/English).
3. Ensure ACID transactional integrity during peak booking windows to eliminate double-booking race conditions.
4. Secure patient diagnostic reports with strict row-level ownership checks (only patient, consulting doctor, and authorized admin can access).
5. Equip field volunteers with offline-tolerant registration tools for low-connectivity rural health camps.
6. Provide executive analytics dashboards visualizing camp turnout, capacity ratios, and pharmacy stock levels.

### 6.2 Project Scope
- Applicable to urban slum outreach, rural village health days, corporate wellness camps, and school screening programs.
- Covers primary diagnostic triage (General Physician, Diabetes Screening, Blood Pressure Monitoring, Eye Checkup, Dental, Vaccination).
- Excludes tertiary inpatient hospital management, surgical suite bookings, and emergency ICU dispatch (handled via 108 ambulance referral).

---

## 7. SYSTEM REQUIREMENTS

### 7.1 Hardware Requirements
- **Server**: 2 Core vCPU, 2GB RAM, 20GB SSD Storage (Docker/Linux container environment).
- **Client**: Any desktop, tablet, or smartphone device with WebGL 2.0 support and modern browser (Chrome 90+, Safari 14+, Firefox 88+, Edge 90+).
- **Client Camera**: Optional for volunteer QR token scanning.

### 7.2 Software Requirements
- **Frontend Runtime**: Node.js v18+, React 18, Vite 5, Tailwind CSS 3, TypeScript 5.
- **3D Graphics Engine**: Three.js, React Three Fiber, React Three Drei.
- **Backend Runtime**: Node.js v18+, Express 4, TypeScript 5.
- **Database**: PostgreSQL 15+ relational database with pooled connection support.
- **ORM**: Prisma Client v5.7+ with binary engine generation.
- **Security Tools**: JSON Web Tokens (`jsonwebtoken`), bcryptjs password hashing, Helmet security headers, Express Rate Limit.

---

## 8. FUNCTIONAL REQUIREMENTS

| Req ID | Module | Functional Description |
| :--- | :--- | :--- |
| **FR-01** | **Authentication** | Secure user registration and login with bcrypt hashing (10 salt rounds) and dual JWT (access: 15m, refresh: 7d). |
| **FR-02** | **Camp Discovery** | Search, filter by specialty, sort by proximity/date, and view upcoming camp venues with interactive OpenStreetMap markers. |
| **FR-03** | **Slot Booking** | Reserve time slots with atomic transaction capacity checks (`registered < capacity`) and double-booking compound keys. |
| **FR-04** | **Queue Management**| Live token state machine (`WAITING` $\to$ `CALLED` $\to$ `COMPLETED` $\to$ `SKIPPED`), estimated wait time calculations. |
| **FR-05** | **QR Pass Check-In** | Dynamic QR code generation for digital appointment passes and volunteer verification at camp entrances. |
| **FR-06** | **Clinical Records** | Doctor interface to record vitals (BP, pulse, SpO2, blood sugar), clinical observations, prescriptions, and follow-ups. |
| **FR-07** | **PDF Generation** | Server-side PDF generation of authorized medical reports with watermarking, doctor license credentials, and clinic logos. |
| **FR-08** | **Pharmacy Stock** | Inventory tracking by camp, batch number, expiry date, low-stock alerts ($<20$ units), and dispense transactions. |
| **FR-09** | **AI Assistant** | Natural language queries in English and Kannada; safety filter intercepting prescription inquiries and routing emergency symptoms to 108. |
| **FR-10** | **Audit & Consent** | DPDP Act consent tracking and immutable administrative audit logs capturing user ID, action, IP address, and payload diffs. |

---

## 9. NON-FUNCTIONAL REQUIREMENTS

1. **Security**: OWASP Top 10 compliance, CSRF/XSS protection via Helmet, parameterized Prisma queries preventing SQL injection, strict CORS policies, and Bcrypt cryptographic hashing.
2. **Reliability & Availability**: $99.9\%$ uptime target with automated `/health` probes, mock-store fault tolerance for offline demonstration, and transaction rollbacks on capacity conflicts.
3. **Performance**: Initial page load under 1.5 seconds, optimized vendor chunks ($<450\text{ kB}$ index), Three.js Canvas DPR capped at 1.5 for 60fps rendering on mobile devices.
4. **Data Integrity**: Foreign key constraints, compound unique indexes (`patientId_campId_date`), and atomic transactions for booking and inventory balance updates.
5. **Usability & Accessibility**: WCAG 2.1 AA compliant contrast ratios, intuitive glassmorphic UI, responsive breakpoints (desktop, tablet, mobile), and complete bilingual toggle (English / Kannada).

---

## 10. SYSTEM ARCHITECTURE

The platform employs a decoupled **3-Tier Architecture** with a Service-Oriented API layer:

```
[ Client Presentation Tier ]
      │  React 18 + Vite + TypeScript
      │  Tailwind CSS + Glassmorphism UI
      │  Three.js WebGL 3D Canvas
      │  Framer Motion Animations + Leaflet Maps
      ▼
[ Application & API Tier ]
      │  Node.js + Express + TypeScript
      │  JWT Access & Refresh Token Guard
      │  Zod Schema Validation Middleware
      │  Rate Limiting & Security Headers (Helmet)
      │  Business Services: Camp, Queue, QR, PDF, AI Safety
      ▼
[ Persistence & Data Tier ]
      │  Prisma ORM (Schema & Query Engine)
      │  PostgreSQL Database (20 Relational Models)
      │  In-Memory / IndexedDB Offline Cache
```

---

## 11. DATABASE DESIGN

The PostgreSQL relational database contains 20 normalized tables governed by foreign key constraints, cascade rules, and composite indexes:

### Key Entity Relational Schema:
1. **User**: `id`, `email`, `passwordHash`, `role` (ADMIN, DOCTOR, VOLUNTEER, PATIENT), `firstName`, `lastName`, `phone`, timestamps.
2. **Camp**: `id`, `name`, `location`, `address`, `latitude`, `longitude`, `startDate`, `endDate`, `capacity`, `registered`, `status` (UPCOMING, ONGOING, COMPLETED, CANCELLED).
3. **Appointment**: `id`, `patientId`, `campId`, `doctorId`, `date`, `timeSlot`, `status`, `queueToken`. Compound unique constraint: `[patientId, campId, date]`.
4. **QueueToken**: `id`, `campId`, `appointmentId`, `tokenNumber`, `status` (WAITING, CALLED, COMPLETED, SKIPPED), `calledAt`, `completedAt`.
5. **MedicalReport**: `id`, `patientId`, `doctorId`, `campId`, `diagnosis`, `vitals` (JSON), `prescription`, `observations`, `isConfidential`, `status` (DRAFT, AUTHORIZED).
6. **InventoryItem**: `id`, `campId`, `medicineName`, `category`, `quantity`, `unit`, `lowStockThreshold`, `expiryDate`.
7. **AuditLog**: `id`, `userId`, `action`, `resource`, `details`, `ipAddress`, `userAgent`, `createdAt`.
8. **ConsentRecord**: `id`, `patientId`, `consentType`, `isGranted`, `ipAddress`, `version`, `timestamp`.

---

## 12. MODULE DESCRIPTIONS

### 12.1 Public & Patient Portal
- **Interactive 3D Hero Scene**: Real-time rendering of a 3D medical cross, floating health clinic objects, and animated ECG heartbeat trace with mouse parallax.
- **Camp Discovery Engine**: Real-time location search and interactive Leaflet map displaying active and upcoming health camps with live capacity indicators.
- **Patient Dashboard**: Dynamic queue card, countdown token status, contactless QR code check-in badge, medical history summary, and one-click PDF report download.

### 12.2 Clinical & Doctor Module
- **Live Patient Queue**: Sequential calling list with status indicators (`WAITING`, `CALLED`, `COMPLETED`), allowing attending doctors to manage consultations in real time.
- **Clinical Consultation Form**: Digital vital entry (BP, SpO2, heart rate, fasting glucose), differential diagnosis, prescription regimen, and follow-up directives.
- **Authorized Medical Report Generator**: Cryptographically seals clinical records and creates official downloadable PDF certificates via PDFKit.

### 12.3 Volunteer Operations Module
- **Camp Entrance Check-In**: Camera-based QR code scanner for instant check-in verification.
- **Offline Registration Desk**: Collects walk-in patient information when internet connectivity is absent and queues records in IndexedDB for automated synchronisation.

### 12.4 Executive Admin & Command Center
- **Aggregated Analytics**: Recharts visualizations of camp throughput, service department breakdown, demographic age distribution, and capacity utilization ratios.
- **Pharmacy Stock Oversight**: Real-time inventory alerts highlighting medicines dropping below safety thresholds.
- **Governance & Compliance**: DPDP Act patient consent verification and immutable audit trail inspection.

---

## 13. SECURITY AND PRIVACY CONSIDERATIONS

1. **Authentication Security**: Passwords salted and hashed with `bcryptjs` (cost factor 10). Access tokens sign with 256-bit secret keys and expire in 15 minutes; refresh tokens expire in 7 days and support instant revocation.
2. **Role-Based Authorization Isolation**: Express middleware verifies user roles before controller execution. Patients cannot access medical records belonging to others or query physician directories.
3. **Medical Record Confidentiality**: Diagnostic reports enforce row-level ownership: only the specific patient, the treating doctor, and authorized system administrators can retrieve records.
4. **Digital Personal Data Protection (DPDP) Act Compliance**: Explicit opt-in consent collected for health screenings, anonymized research analytics, and communication updates.
5. **Input Sanitation & Schema Validation**: Zod request schema validation strictly rejects out-of-bound payloads, malformed email formats, and invalid enumerations.

---

## 14. TESTING METHODOLOGY & RESULTS

A 14-suite automated test suite ([`backend/tests/runAllTests.ts`](file:///d:/yashwanth%20project/Smart%20community%20health%20camp%20management%20system/backend/tests/runAllTests.ts)) verifies all critical operational criteria:

```
========================================================================
🏥 SMART COMMUNITY HEALTH CAMP - 14-SUITE PRODUCTION VERIFICATION
========================================================================

SUITE 1: Patient Registration and Login               ✅ [PASS] (3/3)
SUITE 2: Invalid Credential Rejection                 ✅ [PASS] (2/2)
SUITE 3: Unauthorized and Forbidden Access Attempts   ✅ [PASS] (3/3)
SUITE 4: Camp Creation and Editing Validation         ✅ [PASS] (3/3)
SUITE 5: Appointment Capacity Limits                  ✅ [PASS] (2/2)
SUITE 6: Concurrent Booking Race Condition            ✅ [PASS] (1/1)
SUITE 7: Duplicate Appointment Prevention             ✅ [PASS] (2/2)
SUITE 8: Queue Status Transitions                     ✅ [PASS] (6/6)
SUITE 9: Inventory Transactions & Stock Alerts        ✅ [PASS] (4/4)
SUITE 10: Medical Report Privacy Rules                ✅ [PASS] (5/5)
SUITE 11: Follow-Up Access Permissions                ✅ [PASS] (3/3)
SUITE 12: API Validation Failures (Zod Schemas)       ✅ [PASS] (4/4)
SUITE 13: AI-Provider Failure Fallback & Safety       ✅ [PASS] (3/3)
SUITE 14: Critical User Workflows (End-to-End)        ✅ [PASS] (6/6)

========================================================================
📊 FINAL TEST REPORT: 47 OF 47 TESTS PASSED (0 FAILED)
========================================================================
```

---

## 15. EXPECTED OUTCOMES & PRACTICAL IMPACT

1. **Wait Time Reduction**: Digitally orchestrated appointments reduce on-site camp waiting times by over **$60\%$**.
2. **Elimination of Overbooking**: Atomic transaction checks ensure zero registrations exceed venue doctor capacity.
3. **Complete Medical Continuity**: Citizens maintain a permanent digital health record accessible across future community camps.
4. **Zero Pharmacy Waste**: Real-time stock alerts prevent medicine stockouts and eliminate expired pharmaceutical losses.
5. **Rural Inclusion**: Bilingual Kannada/English interfaces and offline registration ensure high adoption among rural community members.

---

## 16. LIMITATIONS AND FUTURE ENHANCEMENTS

### Limitations
- Primary diagnostic records do not directly interface with HL7/FHIR hospital legacy backends.
- Real-time video teleconsultation requires high-bandwidth cellular networks not available in all remote regions.

### Future Enhancements
- **ABHA (Ayushman Bharat Health Account) Integration**: Linking national health IDs with camp records.
- **AI Triage Prioritization**: Machine learning algorithm that analyzes self-reported symptoms to flag high-risk cardiac or diabetic patients for immediate fast-track consultation.
- **LoRaWAN / Satellite Field Uplink**: Direct hardware satellite synchronization for remote mobile diagnostic vans operating outside cellular coverage.

---

## 17. CONCLUSION

The **Smart Community Health Camp Management System — Ultimate 3D Edition** successfully resolves the operational inefficiencies, patient congestion, and data vulnerability issues historically plaguing community outreach healthcare. By integrating 3D WebGL visualizations, high-concurrency transactional booking, real-time queue orchestration, offline field tolerance, and DPDP compliance, the platform provides a production-ready, technically sound, and socially transformative solution for community healthcare delivery.

