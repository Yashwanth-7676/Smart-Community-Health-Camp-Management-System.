import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient, Role, AppointmentStatus, QueueStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateQueueToken } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();
const router = Router();

/**
 * POST /api/v1/offline/sync
 * Sync batch of offline patient registrations collected by field volunteers
 */
router.post('/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { registrations } = req.body;

    if (!registrations || !Array.isArray(registrations)) {
      throw new AppError('Array of registrations is required', 400);
    }

    const defaultPassword = await bcrypt.hash('Patient@123', 10);
    const results = [];

    for (const reg of registrations) {
      try {
        const { firstName, lastName, phone, email, campId, timeSlot, medicalHistory, offlineId } = reg;

        if (!firstName || !lastName || !campId) {
          results.push({ offlineId, status: 'FAILED', error: 'Missing required fields' });
          continue;
        }

        const camp = await prisma.camp.findUnique({ where: { id: campId } });
        if (!camp) {
          results.push({ offlineId, status: 'FAILED', error: 'Camp not found' });
          continue;
        }

        const userEmail = email || `patient_sync_${Date.now()}_${Math.floor(Math.random() * 1000)}@healthcamp.local`;

        const outcome = await prisma.$transaction(async (tx) => {
          let user = await tx.user.findFirst({
            where: {
              OR: [
                { email: userEmail },
                phone ? { phone } : { email: userEmail },
              ],
            },
          });

          if (!user) {
            user = await tx.user.create({
              data: {
                email: userEmail,
                password: defaultPassword,
                firstName,
                lastName,
                phone: phone || null,
                role: Role.PATIENT,
                patientProfile: {
                  create: {
                    medicalHistory: medicalHistory || null,
                  },
                },
              },
            });
          }

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const totalBooked = await tx.appointment.count({
            where: { campId, date: { gte: today } },
          });

          const tokenNumber = totalBooked + 1;
          const queueTokenStr = generateQueueToken(camp.location, tokenNumber);

          const appointment = await tx.appointment.create({
            data: {
              patientId: user.id,
              campId,
              date: new Date(),
              timeSlot: timeSlot || '09:00 - 10:00',
              status: AppointmentStatus.CONFIRMED,
              queueToken: queueTokenStr,
              queueTokenRef: {
                create: {
                  tokenNumber,
                  status: QueueStatus.WAITING,
                },
              },
            },
          });

          await tx.camp.update({
            where: { id: campId },
            data: { registered: { increment: 1 } },
          });

          // Log offline sync record
          await tx.offlineRegistration.create({
            data: {
              data: reg,
              synced: true,
              syncedAt: new Date(),
            },
          });

          return { userId: user.id, appointmentId: appointment.id, queueToken: queueTokenStr };
        });

        results.push({ offlineId, status: 'SYNCED', ...outcome });
      } catch (err: any) {
        results.push({
          offlineId: reg.offlineId,
          status: 'FAILED',
          error: err.message || 'Sync error',
        });
      }
    }

    res.json({
      success: true,
      message: 'Batch synchronization complete',
      data: {
        totalProcessed: registrations.length,
        syncedCount: results.filter((r) => r.status === 'SYNCED').length,
        failedCount: results.filter((r) => r.status === 'FAILED').length,
        results,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
