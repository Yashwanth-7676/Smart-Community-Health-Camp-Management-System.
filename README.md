# 🏥 Smart Community Health Camp Management System

A premium, full-stack web application for managing community health camps with real-time booking, role-based dashboards, 3D visualizations, and offline support.

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Tailwind CSS |
| **3D/Animation** | Three.js, React Three Fiber, Drei, GSAP, Framer Motion |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL + Prisma ORM |
| **Charts** | Recharts |
| **Maps** | Leaflet + OpenStreetMap |
| **Auth** | JWT (access + refresh tokens) |
| **State** | Zustand + React Query |
| **Forms** | React Hook Form + Zod |
| **i18n** | i18next (English + Kannada) |

---

## 📁 Project Structure

```
Smart community health camp management system/
├── backend/                    # Express + TypeScript API
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.ts             # Demo data seeder
│   ├── src/
│   │   ├── controllers/        # Route handler logic
│   │   ├── middleware/         # Auth, validation, error handling
│   │   ├── routes/             # Express route definitions
│   │   ├── utils/              # JWT, helpers
│   │   ├── types/              # TypeScript interfaces
│   │   ├── app.ts              # Express app setup
│   │   └── server.ts           # Server entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/                   # React + Vite app
    ├── src/
    │   ├── api/                # Axios API clients
    │   ├── components/
    │   │   ├── charts/         # Recharts components
    │   │   ├── common/         # Shared components
    │   │   ├── dashboard/      # Dashboard cards
    │   │   ├── forms/          # Form components
    │   │   ├── layout/         # Navbar, Sidebar, Footer
    │   │   ├── maps/           # Leaflet map components
    │   │   ├── three/          # React Three Fiber 3D scenes
    │   │   └── ui/             # Base UI components
    │   ├── contexts/           # React contexts (Auth, Theme, Language)
    │   ├── hooks/              # Custom React hooks
    │   ├── i18n/               # Translations (EN + KN)
    │   ├── pages/              # Page components
    │   ├── types/              # TypeScript types
    │   ├── utils/              # Helpers and constants
    │   ├── App.tsx
    │   └── main.tsx
    └── package.json
```

---

## ⚡ Quick Setup (Step-by-Step VS Code Commands)

### Prerequisites
- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **PostgreSQL 15+** — [postgresql.org](https://www.postgresql.org/download/)
- **Git** — [git-scm.com](https://git-scm.com)

---

### Step 1 — Set Up the Database

Open a new terminal in VS Code and run:

```powershell
# Start PostgreSQL service (if not already running)
# On Windows, PostgreSQL runs as a Windows Service — check Services or pgAdmin

# Connect to PostgreSQL as superuser
psql -U postgres
```

Inside psql, run:
```sql
CREATE DATABASE healthcamp;
CREATE USER healthcamp_user WITH PASSWORD 'HealthCamp@2024';
GRANT ALL PRIVILEGES ON DATABASE healthcamp TO healthcamp_user;
\q
```

---

### Step 2 — Configure Backend Environment

```powershell
# Navigate to backend
cd "d:\yashwanth project\Smart community health camp management system\backend"

# Copy environment example
Copy-Item .env.example .env
```

Edit `.env` in VS Code:
```env
DATABASE_URL="postgresql://healthcamp_user:HealthCamp@2024@localhost:5432/healthcamp"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-this-too"
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

---

### Step 3 — Install Backend Dependencies & Run Migrations

```powershell
# In backend/ directory
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed the database with demo data
npx prisma db seed
```

---

### Step 4 — Start the Backend Server

```powershell
# Still in backend/ directory
npm run dev
```

You should see: `✅ Server running on port 5000`

---

### Step 5 — Install Frontend Dependencies

Open a **new terminal** in VS Code:

```powershell
cd "d:\yashwanth project\Smart community health camp management system\frontend"
npm install
```

---

### Step 6 — Configure Frontend Environment

```powershell
# In frontend/ directory
Copy-Item .env.example .env
```

The `.env` should contain:
```env
VITE_API_URL=http://localhost:5000/api
```

---

### Step 7 — Start the Frontend Dev Server

```powershell
# In frontend/ directory
npm run dev
```

You should see: `Local: http://localhost:5173/`

---

### Step 8 — Open in Chrome

```powershell
Start-Process "chrome" "http://localhost:5173"
```

Or manually open `http://localhost:5173` in Chrome.

---

## 🔑 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@healthcamp.com | Admin@123 |
| **Doctor** | doctor1@healthcamp.com | Doctor@123 |
| **Doctor 2** | doctor2@healthcamp.com | Doctor@123 |
| **Volunteer** | volunteer1@healthcamp.com | Volunteer@123 |
| **Patient** | patient1@healthcamp.com | Patient@123 |
| **Patient 2** | patient2@healthcamp.com | Patient@123 |

---

## 🌐 Pages & URLs

| URL | Page | Access |
|-----|------|--------|
| `/` | Home (3D Hero) | Public |
| `/camps` | Camp Discovery + Map | Public |
| `/camps/:id` | Camp Detail + Booking | Public |
| `/auth/login` | Login | Public |
| `/auth/register` | Register | Public |
| `/patient/dashboard` | Patient Dashboard | Patient |
| `/patient/appointments` | Book Appointment | Patient |
| `/patient/profile` | Patient Profile | Patient |
| `/doctor/dashboard` | Doctor Dashboard | Doctor |
| `/doctor/patients` | Patient List + Checkup | Doctor |
| `/doctor/reports` | Medical Reports | Doctor |
| `/volunteer/dashboard` | Volunteer + Queue Mgmt | Volunteer |
| `/admin/dashboard` | Admin Overview | Admin |
| `/admin/camps` | Camp Management | Admin |
| `/admin/users` | User Management | Admin |
| `/admin/analytics` | Analytics | Admin |
| `/inventory` | Medicine Inventory | Doctor/Admin |
| `/reports` | Medical Report Portal | Doctor/Admin/Patient |
| `/health-awareness` | Health Tips | Public |
| `/contact` | Contact & Help | Public |
| `/notifications` | Notification Center | Authenticated |

---

## 🔒 Security Features

- **JWT Authentication** with access tokens (15min) + refresh tokens (7 days)
- **Role-Based Access Control** — Admin, Doctor, Volunteer, Patient
- **Password Hashing** with bcryptjs (salt rounds: 12)
- **Request Validation** with express-validator and Zod
- **Helmet.js** for security headers
- **Medical Record Protection** — patients can only see their own records
- **Capacity Enforcement** — double-booking prevented with database transactions
- **Confidential Reports** — access-controlled flag on medical reports

---

## 🗺️ API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout user |

### Camps
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/camps` | List camps (search/filter/paginate) |
| GET | `/api/camps/:id` | Get camp details |
| POST | `/api/camps` | Create camp (Admin) |
| PUT | `/api/camps/:id` | Update camp (Admin) |
| DELETE | `/api/camps/:id` | Delete camp (Admin) |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appointments` | List appointments |
| POST | `/api/appointments` | Book appointment |
| GET | `/api/appointments/:id` | Get appointment |
| PUT | `/api/appointments/:id` | Update/cancel appointment |
| GET | `/api/appointments/camp/:campId/slots` | Get available slots |

### Full API reference available at `http://localhost:5000/api/docs` (when running)

---

## 🎨 Design System

- **Primary**: Navy Blue (`#0a1628`, `#0d1f3c`, `#1a3358`)
- **Accent**: Cyan (`#06b6d4`, `#22d3ee`)
- **Success**: Green (`#10b981`)
- **Warning**: Amber (`#f59e0b`)
- **Error**: Red (`#ef4444`)
- **Font**: Inter (body), Poppins (headings)
- **Effects**: Glassmorphism, soft shadows, backdrop blur

---

## 🌏 Language Support

Toggle between **English** and **ಕನ್ನಡ** (Kannada) using the language switcher in the navbar.

---

## 📱 Responsive Design

- **Mobile**: < 768px (hamburger menu, stacked layouts)
- **Tablet**: 768px–1024px (collapsible sidebar)
- **Desktop**: > 1024px (full layout)

---

## 🔌 Offline Support

- Offline detection via `navigator.onLine`
- Patient registrations queued in IndexedDB when offline
- Auto-sync when connectivity returns
- Offline banner notification

---

## 🧪 Running in Production

```powershell
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
# Serve with nginx or any static file server
```

---

## 📝 License

MIT License — For educational and community health purposes.
