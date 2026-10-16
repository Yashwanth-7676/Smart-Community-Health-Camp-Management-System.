// backend/src/middleware/auditLog.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, AuditAction } from '@prisma/client';
import { isDbConnectionError, DEMO_SECURITY_ALERTS, DemoSecurityAlert } from '../utils/mockStore';

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

// Failed login attempt tracking window: Map<ipOrEmail, { count: number, firstAttempt: number }>
const failedLoginAttempts = new Map<string, { count: number; firstAttempt: number }>();

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'refreshtoken',
  'accesstoken',
  'jwt',
  'authorization',
  'cookie',
  'secret',
  'medicalhistory',
  'prescription',
  'observations',
  'creditcard',
]);

/**
 * Recursively sanitizes data before writing to audit trail.
 * Strips passwords, auth tokens, and detailed clinical notes.
 */
export function sanitizeAuditDetails(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(sanitizeAuditDetails);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = '[REDACTED_SECURITY]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeAuditDetails(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Record a failed authentication attempt and evaluate for brute-force intelligence
 */
export function recordFailedLoginAttempt(identifier: string, ipAddress: string): void {
  const key = `${identifier}_${ipAddress}`;
  const now = Date.now();
  const entry = failedLoginAttempts.get(key) || { count: 0, firstAttempt: now };

  // Reset if window > 15 minutes
  if (now - entry.firstAttempt > 15 * 60 * 1000) {
    entry.count = 1;
    entry.firstAttempt = now;
  } else {
    entry.count += 1;
  }

  failedLoginAttempts.set(key, entry);

  // If 5+ failed attempts in 15 minutes, trigger security intelligence alert
  if (entry.count >= 5) {
    const existing = DEMO_SECURITY_ALERTS.find(
      (a) => a.type === 'BRUTE_FORCE_SUSPECTED' && a.sourceIp === ipAddress && !a.resolved
    );

    if (!existing) {
      const alert: DemoSecurityAlert = {
        id: `sec-alert-${Date.now()}`,
        type: 'BRUTE_FORCE_SUSPECTED',
        severity: 'HIGH',
        title: 'Repeated Failed Login Threshold Exceeded',
        description: `${entry.count} consecutive authentication failures detected for account '${identifier}' from IP ${ipAddress}. Potential brute-force dictionary attack.`,
        targetEntity: 'Auth::Login',
        sourceIp: ipAddress,
        resolved: false,
        timestamp: new Date(),
      };
      DEMO_SECURITY_ALERTS.unshift(alert);
    }
  }
}

/**
 * Record an unusual access anomaly (e.g. unassigned doctor attempting report access or bulk export)
 */
export function recordSecurityAnomaly(
  type: DemoSecurityAlert['type'],
  title: string,
  description: string,
  targetEntity: string,
  sourceIp: string,
  userId?: string
): void {
  const alert: DemoSecurityAlert = {
    id: `sec-alert-${Date.now()}`,
    type,
    severity: type === 'UNAUTHORIZED_RECORD_ACCESS' ? 'HIGH' : 'MEDIUM',
    title,
    description,
    targetEntity,
    sourceIp,
    actorUserId: userId,
    resolved: false,
    timestamp: new Date(),
  };
  DEMO_SECURITY_ALERTS.unshift(alert);
}

/**
 * Direct function to log an audit event with automated sanitization
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
  const cleanDetails = sanitizeAuditDetails(details);

  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId: entityId || null,
        details: (cleanDetails as any) || null,
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
        details: cleanDetails,
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
    const userAgent = (req.headers['user-agent'] as string) || null;
    const entityId = req.params?.id || null;

    // Fire-and-forget without blocking response
    logAudit(userId, action, entity, entityId, { method: req.method, path: req.path }, ip, userAgent).catch(
      (err) => console.error('[AuditLog Middleware Error]', err)
    );

    next();
  };
};
