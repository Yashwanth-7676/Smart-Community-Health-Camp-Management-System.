import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimit';

// Route imports
import authRoutes from './routes/auth';
import campRoutes from './routes/camps';
import appointmentRoutes from './routes/appointments';
import patientRoutes from './routes/patients';
import doctorRoutes from './routes/doctors';
import volunteerRoutes from './routes/volunteers';
import adminRoutes from './routes/admin';
import inventoryRoutes from './routes/inventory';
import reportRoutes from './routes/reports';
import notificationRoutes from './routes/notifications';
import offlineRoutes from './routes/offline';
import passwordResetRoutes from './routes/passwordReset';
import qrRoutes from './routes/qr';
import pdfRoutes from './routes/pdf';
import aiRoutes from './routes/ai';
import consentRoutes from './routes/consent';
import analyticsRoutes from './routes/analytics';
import auditRoutes from './routes/audit';
import docsRoutes from './routes/docs';
import digitalTwinRoutes from './routes/digitalTwin';
import followUpRoutes from './routes/followUps';

const app: Application = express();

// ========================
// Security Middleware
// ========================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ========================
// CORS Configuration
// ========================
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''));

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes('*') ||
      /^http:\/\/localhost:\d+$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));

// ========================
// Logging
// ========================
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// ========================
// Body Parsing, Cookies & Compression
// ========================
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========================
// Health Check
// ========================
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0-ultimate-3d',
    features: [
      '3D Visualizations',
      'Live Queue Management',
      'QR Check-In',
      'PDF Medical Reports',
      'AI Health Assistant',
      'Offline Registration Sync',
      'DPDP Consent Management',
      'Audit Logging',
    ],
  });
});

// ========================
// Apply General Rate Limiter to API routes
// ========================
app.use('/api', generalLimiter);

// ========================
// API Routes (support both /api/v1 and /api)
// ========================
['/api/v1', '/api'].forEach((prefix) => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/camps`, campRoutes);
  app.use(`${prefix}/appointments`, appointmentRoutes);
  app.use(`${prefix}/patients`, patientRoutes);
  app.use(`${prefix}/doctors`, doctorRoutes);
  app.use(`${prefix}/volunteers`, volunteerRoutes);
  app.use(`${prefix}/admin`, adminRoutes);
  app.use(`${prefix}/inventory`, inventoryRoutes);
  app.use(`${prefix}/reports`, reportRoutes);
  app.use(`${prefix}/notifications`, notificationRoutes);
  app.use(`${prefix}/offline`, offlineRoutes);
  app.use(`${prefix}/password-reset`, passwordResetRoutes);
  app.use(`${prefix}/qr`, qrRoutes);
  app.use(`${prefix}/pdf`, pdfRoutes);
  app.use(`${prefix}/ai`, aiRoutes);
  app.use(`${prefix}/consent`, consentRoutes);
  app.use(`${prefix}/analytics`, analyticsRoutes);
  app.use(`${prefix}/audit`, auditRoutes);
  app.use(`${prefix}/docs`, docsRoutes);
  app.use(`${prefix}/digital-twin`, digitalTwinRoutes);
  app.use(`${prefix}/follow-ups`, followUpRoutes);
});

// ========================
// 404 Handler
// ========================
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ========================
// Global Error Handler
// ========================
app.use(errorHandler);

export default app;
