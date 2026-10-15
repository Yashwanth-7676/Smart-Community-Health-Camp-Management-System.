# Production Deployment Guide: Smart Community Health Camp Management System

This guide outlines end-to-end instructions for deploying both the Frontend (React + Vite + Three.js) and Backend (Node.js + Express + Prisma + PostgreSQL) to modern cloud infrastructure.

---

## 🏗️ Architecture Overview

- **Frontend**: Single Page Application built with React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons, Three.js / React Three Fiber, Framer Motion, and Recharts.
- **Backend**: Express REST API built with TypeScript, Prisma ORM, JWT Authentication, and Zod Validation.
- **Database**: PostgreSQL 15+ (Compatible with Neon, Supabase, Render Postgres, AWS RDS, Railway).
- **Static Hosting**: Vercel or Netlify (Includes SPA rewrite headers and caching policies).
- **Backend Hosting**: Render, Railway, AWS ECS, or Docker container.

---

## 🔑 Environment Variables Configuration

### 1. Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` and update the parameters:

```env
# Server Runtime
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-frontend-app.vercel.app

# Database Connection (Neon / Supabase / Render Postgres)
DATABASE_URL="postgresql://user:password@ep-sample-host.neon.tech/healthcamp_prod?sslmode=require"

# Cryptographic Keys (Generate with `openssl rand -hex 32`)
JWT_SECRET="replace-with-64-character-cryptographically-secure-random-string"
JWT_REFRESH_SECRET="replace-with-another-64-character-cryptographically-secure-random-string"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300

# Optional Cloud AI Assistant Integration
AI_API_KEY=""
AI_API_URL="https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
```

### 2. Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env`:

```env
# URL pointing to your deployed backend API (exclude trailing slash)
VITE_API_URL=https://your-backend-api.onrender.com/api/v1
```

---

## 🗄️ Database Setup & Migrations

### Using Managed PostgreSQL (Neon, Supabase, or Render)
1. Create a PostgreSQL database on [Neon.tech](https://neon.tech), [Supabase.com](https://supabase.com), or [Render.com](https://render.com).
2. Copy the pooled or direct connection string into your backend `DATABASE_URL`.
3. Run migrations on the production database:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
4. (Optional) Populate fictional demonstration records for initial staging:
   ```bash
   npm run seed
   ```

---

## 🚀 Deployment Options

### Option A: Deploying Frontend to Vercel (Recommended)
1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_URL`: `https://<your-backend-domain>/api/v1`
5. Click **Deploy**.
   > *Note*: Client-side routing and security headers are pre-configured via `frontend/vercel.json`.

---

### Option B: Deploying Frontend to Netlify
1. Connect your repository to [Netlify](https://netlify.com).
2. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. Add Environment Variable:
   - `VITE_API_URL`: `https://<your-backend-domain>/api/v1`
4. Deploy site.
   > *Note*: Netlify uses `frontend/public/_redirects` and `frontend/netlify.toml` for 200 SPA rewrite and aggressive asset caching.

---

### Option C: Deploying Backend to Render (via Blueprint)
The repository contains a turnkey `render.yaml` blueprint:
1. Connect your GitHub repository to [Render.com](https://render.com).
2. Select **New Blueprint Instance**.
3. Render automatically creates:
   - A managed PostgreSQL database (`healthcamp-db`)
   - A Node.js web service (`healthcamp-api`)
   - Automatic execution of `npx prisma migrate deploy` and `node dist/src/server.js`
4. Under the Web Service settings, update `CLIENT_URL` to your Vercel or Netlify frontend URL.

---

### Option D: Docker Container Deployment
A multi-stage, non-root production `Dockerfile` is provided in `backend/Dockerfile`:

1. Build the production image:
   ```bash
   cd backend
   docker build -t smart-health-camp-backend:latest .
   ```
2. Run the container:
   ```bash
   docker run -d \
     -p 5000:5000 \
     --env-file .env \
     --name healthcamp-api \
     smart-health-camp-backend:latest
   ```
3. Test container health:
   ```bash
   curl http://localhost:5000/health
   ```

---

## 🔍 Verification & Health Monitoring

Once deployed, verify the following endpoints:

| Endpoint | Method | Expected Output | Purpose |
| :--- | :--- | :--- | :--- |
| `/health` | `GET` | `{"status":"ok","timestamp":"...","uptime":...}` | Container liveness & load-balancer check |
| `/api/docs` | `GET` | Interactive Swagger/OpenAPI HTML Portal | API testing & integration documentation |
| `/api/v1/camps` | `GET` | List of upcoming camps with pagination metadata | Core database and pagination test |
| `/api/v1/auth/login` | `POST` | Authenticated session with JWT token pair | Authentication & bcrypt verification |

---

## 🛠️ Automated Testing

Run the full 14-suite automated verification suite anytime:
```bash
cd backend
npx tsx tests/runAllTests.ts
```
Expected output: **47 OF 47 TESTS PASSED (0 FAILED)**.

---

## ❓ Troubleshooting

1. **CORS Error in Browser Console**:
   - Verify `CLIENT_URL` in the backend environment matches your frontend domain exactly (including `https://` without a trailing slash).
2. **Page Refresh Gives 404 on Static Hosting**:
   - Ensure `frontend/public/_redirects` (Netlify) or `frontend/vercel.json` (Vercel) exists in your deployed output. Both are included in this repository.
3. **Database Connection Timeout (`P1001`)**:
   - Verify your database host allows external connections (IP allowlist `0.0.0.0/0` on Supabase/Neon).
   - Ensure `sslmode=require` is present in the connection string.

