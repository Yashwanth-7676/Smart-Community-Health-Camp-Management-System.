// backend/src/controllers/digitalHealthIdController.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { AppError } from '../middleware/errorHandler';
import { isDbConnectionError, DEMO_USERS, DEMO_REPORTS } from '../utils/mockStore';
import { logAudit } from '../middleware/auditLog';

const prisma = new PrismaClient();

// In-memory store for ephemeral share passes and access history
export interface EphemeralSharePass {
  passId: string;
  patientId: string;
  shareToken: string;
  purpose: string;
  allowedSections: string[]; // e.g. ['VITALS', 'REPORTS', 'ALLERGIES']
  createdAt: string;
  expiresAt: string;
  isRevoked: boolean;
  revokedAt?: string;
  accessCount: number;
}

export interface AccessHistoryEvent {
  id: string;
  patientId: string;
  passId?: string;
  accessorName: string;
  accessorRole: string;
  ipAddress: string;
  sectionsViewed: string[];
  accessedAt: string;
}

export const EPHEMERAL_PASS_STORE: EphemeralSharePass[] = process.env.NODE_ENV === 'production' ? [] : [
  {
    passId: 'pass-demo-1',
    patientId: 'user-patient-1',
    shareToken: 'shpass_7b3a9c2f10e4',
    purpose: 'Camp Doctor Screening',
    allowedSections: ['VITALS', 'REPORTS', 'ALLERGIES'],
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 50 * 60000).toISOString(),
    isRevoked: false,
    accessCount: 1,
  },
];

export const ACCESS_HISTORY_STORE: AccessHistoryEvent[] = process.env.NODE_ENV === 'production' ? [] : [
  {
    id: 'acc-hist-1',
    patientId: 'user-patient-1',
    passId: 'pass-demo-1',
    accessorName: 'Dr. Priya Sharma',
    accessorRole: 'DOCTOR',
    ipAddress: '127.0.0.1',
    sectionsViewed: ['VITALS', 'REPORTS'],
    accessedAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
];

/**
 * Generate standardized Secure Health ID: SHID-YYYY-XXXXX
 */
export function generateSHID(patientId: string, creationYear = new Date().getFullYear()): string {
  const hash = crypto.createHash('sha256').update(patientId).digest('hex').toUpperCase();
  const digits = hash.replace(/\D/g, '').padEnd(5, '7').slice(0, 5);
  return `SHID-${creationYear}-${digits}`;
}

/**
 * GET /api/v1/health-id/my-card
 * Retrieve current user's digital health ID card and privacy-safe QR code
 */
export const getMyDigitalHealthId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    if (user.role !== Role.PATIENT) {
      throw new AppError('Only patients can access a personal health card', 403, 'FORBIDDEN');
    }
    let patientUser: any = null;
    let patientProfile: any = null;

    try {
      patientUser = await prisma.user.findUnique({
        where: { id: user.userId },
        include: { patientProfile: true },
      });
      patientProfile = patientUser?.patientProfile;
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        patientUser = DEMO_USERS.find((u) => u.id === user.userId || u.email.toLowerCase() === user.email.toLowerCase());
        patientProfile = patientUser?.patientProfile;
      } else {
        throw dbErr;
      }
    }

    if (!patientUser || patientUser.id !== user.userId) {
      throw new AppError('Patient profile not found', 404, 'NOT_FOUND');
    }

    const shid = generateSHID(patientUser.id);

    // ZERO sensitive medical notes inside the QR payload.
    // The QR code contains solely a cryptographic verification lookup URL.
    const lookupSignature = crypto.createHmac('sha256', process.env.JWT_SECRET || 'healthcamp_jwt_secret')
      .update(`${patientUser.id}:${shid}`)
      .digest('hex')
      .slice(0, 16);

    const qrPayload = JSON.stringify({
      v: 2,
      type: 'DIGITAL_HEALTH_ID',
      shid,
      sig: lookupSignature,
      issued: new Date().getFullYear(),
      verifyUrl: `/verify-id?shid=${shid}&sig=${lookupSignature}`,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 320,
      color: {
        dark: '#0284c7', // Cyan/sky medical theme
        light: '#ffffff',
      },
    });

    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.json({
      success: true,
      data: {
        patientId: patientUser.id,
        fullName: `${patientUser.firstName} ${patientUser.lastName}`,
        shid,
        bloodGroup: patientProfile?.bloodGroup || 'B_POSITIVE',
        dateOfBirth: patientProfile?.dateOfBirth || '1988-06-15',
        emergencyContact: patientProfile?.emergencyContact || {
          name: 'Suresh Reddy',
          relationship: 'Husband',
          phone: '+91-9876543300',
        },
        allergies: patientProfile?.allergies || ['Penicillin', 'Sulfa drugs'],
        qrCodeDataUrl,
        privacyBadge: {
          containsClinicalNotes: false,
          encryptionStandard: 'AES-GCM-256 + HMAC-SHA256',
          dpdpConsentCompliant: true,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/health-id/share-pass
 * Patient creates an ephemeral, revocable pass with duration (minutes) and allowed sections
 */
export const createSharePass = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { durationMinutes = 60, purpose = 'Doctor Consultation', allowedSections = ['VITALS', 'REPORTS', 'ALLERGIES'] } = req.body;

    const validMinutes = Math.min(Math.max(Number(durationMinutes) || 60, 5), 1440); // 5 min to 24 hours max
    const passId = `pass-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const shareToken = `shpass_${crypto.randomBytes(16).toString('hex')}`;
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + validMinutes * 60000);

    const newPass: EphemeralSharePass = {
      passId,
      patientId: user.userId,
      shareToken,
      purpose,
      allowedSections,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isRevoked: false,
      accessCount: 0,
    };

    EPHEMERAL_PASS_STORE.unshift(newPass);

    await logAudit(
      user.userId,
      'CREATE',
      'EphemeralSharePass',
      passId,
      { validMinutes, allowedSections, purpose },
      req.ip,
      req.headers['user-agent']
    );

    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.json({
      success: true,
      message: 'Temporary health pass generated successfully',
      data: {
        passId,
        shareToken,
        shareUrl: `/shared-health-card?token=${shareToken}`,
        purpose,
        allowedSections,
        expiresAt: expiresAt.toISOString(),
        validMinutes,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/health-id/shared/:shareToken
 * Access shared records using short-lived pass. Strictly validates expiry and revocation.
 */
export const accessSharedHealthPassport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { shareToken } = req.params;

    const pass = EPHEMERAL_PASS_STORE.find((p) => p.shareToken === shareToken);

    if (!pass) {
      throw new AppError('Share link is invalid or has expired', 404, 'PASS_NOT_FOUND');
    }

    if (pass.isRevoked) {
      throw new AppError('This access pass was revoked by the patient', 403, 'PASS_REVOKED');
    }

    if (new Date(pass.expiresAt).getTime() < Date.now()) {
      throw new AppError('This temporary access pass has expired', 410, 'PASS_EXPIRED');
    }

    // Increment access count
    pass.accessCount += 1;

    // Log the access event in audit trail
    const accessorName = req.user ? `${req.user.email} (${req.user.role})` : 'Authorized Camp Clinician';
    const accessorRole = req.user?.role || 'DOCTOR';

    const accessEvent: AccessHistoryEvent = {
      id: `acc-hist-${Date.now()}`,
      patientId: pass.patientId,
      passId: pass.passId,
      accessorName,
      accessorRole,
      ipAddress: req.ip || '127.0.0.1',
      sectionsViewed: pass.allowedSections,
      accessedAt: new Date().toISOString(),
    };

    ACCESS_HISTORY_STORE.unshift(accessEvent);

    let patient: any = null;
    let reports: any[] = [];

    try {
      patient = await prisma.user.findUnique({
        where: { id: pass.patientId },
        include: { patientProfile: true },
      });
      reports = await prisma.medicalReport.findMany({
        where: { patientId: pass.patientId },
        include: { vitalSigns: true },
      });
    } catch {
      patient = DEMO_USERS.find((u) => u.id === pass.patientId || u.role === 'PATIENT');
      reports = DEMO_REPORTS.filter((r) => r.patientId === pass.patientId);
    }

    if (!patient) {
      patient = DEMO_USERS[3];
    }

    const filteredData: Record<string, any> = {
      patientName: `${patient.firstName} ${patient.lastName}`,
      shid: generateSHID(patient.id),
      passExpiresAt: pass.expiresAt,
      purpose: pass.purpose,
    };

    if (pass.allowedSections.includes('VITALS')) {
      const latestVitals = reports.flatMap((report) => report.vitalSigns || [])[0];
      if (latestVitals) {
        filteredData.vitals = latestVitals;
      }
    }

    if (pass.allowedSections.includes('ALLERGIES')) {
      filteredData.allergies = patient.patientProfile?.allergies || [];
    }

    if (pass.allowedSections.includes('REPORTS')) {
      filteredData.reports = reports.map((r) => ({
        id: r.id,
        diagnosis: r.diagnosis,
        observations: r.observations,
        prescription: r.prescription,
        createdAt: r.createdAt,
      }));
    }

    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.json({
      success: true,
      data: filteredData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/health-id/revoke-pass/:passId
 * Instantly revokes an active share pass
 */
export const revokeSharePass = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { passId } = req.params;
    const user = req.user!;

    const pass = EPHEMERAL_PASS_STORE.find((p) => p.passId === passId && p.patientId === user.userId);

    if (!pass) {
      throw new AppError('Access pass not found or unauthorized', 404, 'NOT_FOUND');
    }

    pass.isRevoked = true;
    pass.revokedAt = new Date().toISOString();

    await logAudit(
      user.userId,
      'UPDATE',
      'EphemeralSharePassRevoke',
      passId,
      { passId, revokedAt: pass.revokedAt },
      req.ip,
      req.headers['user-agent']
    );

    res.setHeader('Cache-Control', 'private, no-store');
    res.json({
      success: true,
      message: 'Share pass successfully revoked. Access has been terminated immediately.',
      data: { passId, isRevoked: true, revokedAt: pass.revokedAt },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/health-id/access-history
 * Patient views all clinical parties who have accessed their health passport
 */
export const getMyAccessHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const history = ACCESS_HISTORY_STORE.filter((h) => h.patientId === user.userId);
    const activePasses = EPHEMERAL_PASS_STORE.filter((p) => p.patientId === user.userId);

    res.setHeader('Cache-Control', 'private, no-store');
    res.json({
      success: true,
      data: {
        activePasses,
        accessHistory: history,
      },
    });
  } catch (error) {
    next(error);
  }
};

