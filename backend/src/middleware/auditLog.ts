import { Request, Response, NextFunction } from 'express';
import { PrismaClient, AuditAction } from '@prisma/client';
import { isDbConnectionError } from '../utils/mockStore';

const prisma = new PrismaClient();

// In-memory audit log buffer for development / offline mode
export const inMemoryAuditLogs: Array<{
  id: string;
  userId: string | null;
  action: AuditAction;
  entity: string;
  entityId: string | null;
  details: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}> = [];

/**
 * Direct function to log an audit event
 */
export async function logAudit(
  userId: string | null,
  action: AuditAction,
  entity: string,
  entityId?: string | null,
  details?: unknown,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId: entityId || null,
        details: (details as any) || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch (error) {
    if (isDbConnectionError(error)) {
      inMemoryAuditLogs.unshift({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        userId: userId || null,
        action,
        entity,
        entityId: entityId || null,
        details,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        createdAt: new Date(),
      });
      if (inMemoryAuditLogs.length > 500) {
        inMemoryAuditLogs.pop();
      }
    } else {
      console.error('[AuditLog] Failed to record audit log:', error);
    }
  }
}

/**
 * Express middleware generator for route-level audit logging
 */
export const createAuditLog = (action: AuditAction, entity: string) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userId = req.user?.userId || null;
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || null;
    const userAgent = req.headers['user-agent'] || null;
    const entityId = req.params?.id || null;

    // Fire-and-forget without blocking response
    logAudit(userId, action, entity, entityId, { method: req.method, path: req.path }, ip, userAgent).catch(
      (err) => console.error('[AuditLog Middleware Error]', err)
    );

    next();
  };
};

