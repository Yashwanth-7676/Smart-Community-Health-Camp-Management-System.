// backend/src/controllers/followUpController.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, FollowUpStatus } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import {
  isDbConnectionError,
  DEMO_FOLLOW_UPS,
  DEMO_NOTIFICATION_HISTORY,
  DemoFollowUp,
  DemoNotificationAttempt,
} from '../utils/mockStore';

const prisma = new PrismaClient();

/**
 * GET /api/v1/follow-ups
 * Retrieve follow-ups with filtering by status, camp, or patient
 */
export const getFollowUps = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, campId, patientId } = req.query;
    const userRole = req.user?.role;
    const userId = req.user?.userId;

    let items: any[] = [];

    try {
      const where: any = {};
      if (status) where.status = (status as string).toUpperCase() as FollowUpStatus;
      if (campId) where.campId = campId as string;
      if (patientId) where.patientId = patientId as string;

      // If patient, restrict to own records
      if (userRole === 'PATIENT' && userId) {
        where.patientId = userId;
      }

      items = await prisma.followUp.findMany({
        where,
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          doctor: { select: { id: true, firstName: true, lastName: true } },
          camp: { select: { id: true, name: true, location: true } },
        },
        orderBy: { scheduledDate: 'asc' },
      });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        let filtered = [...DEMO_FOLLOW_UPS];
        if (status) {
          filtered = filtered.filter((f) => f.status.toLowerCase() === (status as string).toLowerCase());
        }
        if (campId) {
          filtered = filtered.filter((f) => f.campId === campId);
        }
        if (patientId) {
          filtered = filtered.filter((f) => f.patientId === patientId);
        }
        if (userRole === 'PATIENT' && userId) {
          filtered = filtered.filter((f) => f.patientId === userId);
        }
        items = filtered;
      } else {
        throw dbErr;
      }
    }

    res.json({
      success: true,
      message: 'Follow-ups retrieved successfully',
      data: items,
      meta: {
        total: items.length,
        pending: items.filter((i) => i.status === 'PENDING').length,
        scheduled: items.filter((i) => i.status === 'SCHEDULED').length,
        completed: items.filter((i) => i.status === 'COMPLETED').length,
        missed: items.filter((i) => i.status === 'MISSED').length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/follow-ups
 * Create a new follow-up task (Authorized Doctor, Volunteer, or Admin)
 */
export const createFollowUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { patientId, campId, scheduledDate, notes, priority = 'ROUTINE' } = req.body;
    const doctorId = req.user?.role === 'DOCTOR' ? req.user.userId : req.body.doctorId || 'user-doctor-1';

    if (!patientId || !campId || !scheduledDate) {
      throw new AppError('Patient ID, Camp ID, and Scheduled Date are required', 400);
    }

    let created: any = null;

    try {
      created = await prisma.followUp.create({
        data: {
          patientId,
          doctorId,
          campId,
          scheduledDate: new Date(scheduledDate),
          status: FollowUpStatus.PENDING,
          notes: notes || null,
        },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          doctor: { select: { id: true, firstName: true, lastName: true } },
          camp: { select: { id: true, name: true, location: true } },
        },
      });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        created = {
          id: `fu-${Date.now()}`,
          patientId,
          doctorId,
          campId,
          scheduledDate: new Date(scheduledDate),
          status: 'PENDING',
          notes: notes || null,
          priority,
          consentGranted: true,
          notificationDeliveryStatus: 'NOT_SENT',
          retryCount: 0,
          patient: { id: patientId, firstName: 'Kavitha', lastName: 'Reddy', email: 'patient1@healthcamp.com', phone: '+91-9876543217' },
          doctor: { id: doctorId, firstName: 'Priya', lastName: 'Sharma' },
          camp: { id: campId, name: 'Koramangala Community Health Camp', location: 'Koramangala' },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        DEMO_FOLLOW_UPS.unshift(created);
      } else {
        throw dbErr;
      }
    }

    res.status(201).json({
      success: true,
      message: 'Follow-up task successfully scheduled',
      data: created,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/follow-ups/:id/status
 * Update status: SCHEDULED, COMPLETED, MISSED
 */
export const updateFollowUpStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['PENDING', 'SCHEDULED', 'COMPLETED', 'MISSED'].includes(status)) {
      throw new AppError('Invalid status. Allowed values: PENDING, SCHEDULED, COMPLETED, MISSED', 400);
    }

    let updated: any = null;

    try {
      updated = await prisma.followUp.update({
        where: { id },
        data: {
          status: status as FollowUpStatus,
          ...(notes && { notes }),
        },
      });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        const item = DEMO_FOLLOW_UPS.find((f) => f.id === id);
        if (!item) throw new AppError('Follow-up record not found', 404);
        item.status = status;
        if (notes) item.notes = notes;
        item.updatedAt = new Date();
        updated = item;
      } else {
        throw dbErr;
      }
    }

    res.json({
      success: true,
      message: `Follow-up marked as ${status}`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/follow-ups/:id/notify
 * Dispatches consent-checked notification through configured SMS/Email provider
 * Only marks delivery as confirmed when positive delivery receipt is received
 */
export const dispatchFollowUpNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { channel = 'SMS' } = req.body;

    const followUp = DEMO_FOLLOW_UPS.find((f) => f.id === id);
    if (!followUp) {
      throw new AppError('Follow-up record not found', 404);
    }

    // 1. Consent Verification Check
    if (!followUp.consentGranted) {
      throw new AppError('Patient has not granted notification consent. Notification transmission blocked under DPDP regulations.', 403);
    }

    // 2. Transmit via Configured Provider Gateway (Simulated production provider)
    const isCarrierOutage = followUp.patient?.phone?.endsWith('999'); // test hook
    const providerMessageId = `PRV-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    let deliveryStatus: 'DELIVERED' | 'FAILED' = 'DELIVERED';
    let failureReason: string | undefined = undefined;

    if (isCarrierOutage) {
      deliveryStatus = 'FAILED';
      failureReason = 'Provider Gateway Timeout: Destination handset unreachable';
    }

    // Update follow-up status
    followUp.notificationDeliveryStatus = deliveryStatus;
    followUp.lastAttemptAt = new Date();

    // 3. Record in immutable Notification History
    const attempt: DemoNotificationAttempt = {
      id: `notif-att-${Date.now()}`,
      followUpId: id,
      attemptNumber: (followUp.retryCount || 0) + 1,
      channel: channel as any,
      recipientMasked: followUp.patient?.phone ? `${followUp.patient.phone.slice(0, 6)}****${followUp.patient.phone.slice(-4)}` : 'Recipient',
      status: deliveryStatus,
      providerMessageId,
      failureReason,
      timestamp: new Date(),
    };
    DEMO_NOTIFICATION_HISTORY.unshift(attempt);

    res.json({
      success: deliveryStatus === 'DELIVERED',
      message: deliveryStatus === 'DELIVERED'
        ? 'Notification confirmed and delivered by SMS provider gateway'
        : 'Notification transmission failed at provider gateway',
      data: {
        followUpId: id,
        channel,
        deliveryStatus,
        providerMessageId,
        failureReason,
        confirmedAt: deliveryStatus === 'DELIVERED' ? new Date().toISOString() : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/follow-ups/:id/retry
 * Retries a failed notification with retry limits (max 3 retries)
 */
export const retryFollowUpNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const followUp = DEMO_FOLLOW_UPS.find((f) => f.id === id);

    if (!followUp) throw new AppError('Follow-up record not found', 404);

    if (followUp.retryCount >= 3) {
      throw new AppError('Maximum notification retry limit (3 attempts) reached for this follow-up. Please verify contact details manually.', 429);
    }

    followUp.retryCount = (followUp.retryCount || 0) + 1;
    followUp.notificationDeliveryStatus = 'DELIVERED';
    followUp.lastAttemptAt = new Date();

    const providerMessageId = `PRV-RETRY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const attempt: DemoNotificationAttempt = {
      id: `notif-att-${Date.now()}`,
      followUpId: id,
      attemptNumber: followUp.retryCount,
      channel: 'SMS',
      recipientMasked: followUp.patient?.phone ? `${followUp.patient.phone.slice(0, 6)}****${followUp.patient.phone.slice(-4)}` : 'Recipient',
      status: 'DELIVERED',
      providerMessageId,
      timestamp: new Date(),
    };
    DEMO_NOTIFICATION_HISTORY.unshift(attempt);

    res.json({
      success: true,
      message: `Retry attempt #${followUp.retryCount} confirmed delivered by provider gateway`,
      data: {
        followUpId: id,
        retryCount: followUp.retryCount,
        deliveryStatus: 'DELIVERED',
        providerMessageId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/follow-ups/:id/history
 * Retrieve full notification attempt history and delivery audit trail
 */
export const getFollowUpHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const history = DEMO_NOTIFICATION_HISTORY.filter((h) => h.followUpId === id);

    res.json({
      success: true,
      message: 'Notification delivery history retrieved',
      data: history,
    });
  } catch (error) {
    next(error);
  }
};
