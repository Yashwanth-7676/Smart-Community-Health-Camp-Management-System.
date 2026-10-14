import { Request, Response, NextFunction } from 'express';
import { PrismaClient, ConsentType } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { isDbConnectionError } from '../utils/mockStore';
import { logAudit } from '../middleware/auditLog';

const prisma = new PrismaClient();

// In-memory fallback
const inMemoryConsents: Array<{
  id: string;
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  grantedAt: Date;
  revokedAt?: Date | null;
  createdAt: Date;
}> = [];

/**
 * GET /api/consent
 * Get all consent records for the authenticated user
 */
export const getMyConsents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;

    let records: any[] = [];
    try {
      records = await prisma.consentRecord.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        records = inMemoryConsents.filter((c) => c.userId === userId);
        if (records.length === 0) {
          // Provide default initial consent records for demo
          records = [
            {
              id: 'c-1',
              userId,
              consentType: 'TREATMENT',
              granted: true,
              grantedAt: new Date(),
              createdAt: new Date(),
            },
            {
              id: 'c-2',
              userId,
              consentType: 'DATA_SHARING',
              granted: true,
              grantedAt: new Date(),
              createdAt: new Date(),
            },
          ];
        }
      } else {
        throw dbErr;
      }
    }

    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/consent/grant
 * Record granting of patient consent under data protection principles
 */
export const grantConsent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { consentType } = req.body;

    if (!consentType || !['TREATMENT', 'DATA_SHARING', 'RESEARCH'].includes(consentType)) {
      throw new AppError('Valid consent type is required (TREATMENT, DATA_SHARING, RESEARCH)', 400);
    }

    let record: any = null;
    try {
      record = await prisma.consentRecord.create({
        data: {
          userId,
          consentType: consentType as ConsentType,
          granted: true,
          grantedAt: new Date(),
          ipAddress: req.ip || null,
          userAgent: (req.headers['user-agent'] as string) || null,
        },
      });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        record = {
          id: `c-${Date.now()}`,
          userId,
          consentType,
          granted: true,
          grantedAt: new Date(),
          createdAt: new Date(),
        };
        inMemoryConsents.push(record);
      } else {
        throw dbErr;
      }
    }

    await logAudit(userId, 'CREATE', 'ConsentRecord', record?.id, { consentType, granted: true }, req.ip, req.headers['user-agent']);

    res.status(201).json({
      success: true,
      message: 'Consent recorded successfully',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/consent/revoke
 * Revoke previously granted consent
 */
export const revokeConsent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { consentId } = req.body;

    if (!consentId) {
      throw new AppError('Consent ID is required', 400);
    }

    try {
      await prisma.consentRecord.updateMany({
        where: { id: consentId, userId },
        data: {
          granted: false,
          revokedAt: new Date(),
        },
      });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        const found = inMemoryConsents.find((c) => c.id === consentId && c.userId === userId);
        if (found) {
          found.granted = false;
          found.revokedAt = new Date();
        }
      } else {
        throw dbErr;
      }
    }

    await logAudit(userId, 'UPDATE', 'ConsentRecord', consentId, { action: 'REVOKE' }, req.ip, req.headers['user-agent']);

    res.json({
      success: true,
      message: 'Consent revoked successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/consent/all (Admin only)
 */
export const getAllConsents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let records: any[] = [];
    try {
      records = await prisma.consentRecord.findMany({
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        records = [
          {
            id: 'demo-c-1',
            userId: 'user-patient-1',
            user: { email: 'patient1@healthcamp.com', firstName: 'Kavitha', lastName: 'Reddy' },
            consentType: 'TREATMENT',
            granted: true,
            grantedAt: new Date('2026-10-01'),
            createdAt: new Date('2026-10-01'),
          },
          {
            id: 'demo-c-2',
            userId: 'user-patient-1',
            user: { email: 'patient1@healthcamp.com', firstName: 'Kavitha', lastName: 'Reddy' },
            consentType: 'DATA_SHARING',
            granted: true,
            grantedAt: new Date('2026-10-01'),
            createdAt: new Date('2026-10-01'),
          },
        ];
      } else {
        throw dbErr;
      }
    }

    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

