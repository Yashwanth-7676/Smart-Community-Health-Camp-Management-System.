import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimit';
import { env } from './config/env';

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
import commandCenterRoutes from './routes/commandCenter';
import digitalHealthIdRoutes from './routes/digitalHealthId';
import aiPlannerRoutes from './routes/aiPlanner';

const app: Application = express();
const isProduction = env.NODE_ENV === 'production';

// Render and similar hosts terminate TLS before the application. Trust exactly
// the first proxy in production so rate limits use the real client address.
if (isProduction) {
  app.set('trust proxy', 1);
}

// ========================
// Security Middleware
// ========================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ========================
// CORS Configuration
// ========================
const allowedOrigins = env.CORS_ORIGIN
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter((origin) => origin && origin !== '*');

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      (!isProduction && /^http:\/\/localhost:\d+$/.test(origin)) ||
      (!isProduction && /^http:\/\/127\.0\.0\.1:\d+$/.test(origin))
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
app.use(morgan(isProduction ? 'combined' : 'dev', {
  // A share-pass token is a bearer secret embedded in the URL. Keep it out of
  // application logs, even when access logging is enabled.
  skip: (req) => req.originalUrl.startsWith('/api/v1/health-id/shared/') || req.originalUrl.startsWith('/api/health-id/shared/'),
}));

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
  app.use(`${prefix}/command-center`, commandCenterRoutes);
  app.use(`${prefix}/health-id`, digitalHealthIdRoutes);
  app.use(`${prefix}/ai-planner`, aiPlannerRoutes);
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
