import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient, NotificationType } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();
const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/notifications
 * Get notifications for current user
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Unauthorized', 401);

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.json({
      success: true,
      message: 'Notifications retrieved',
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Unauthorized', 401);

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/notifications/:id/read
 * Mark single notification as read
 */
router.put('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      throw new AppError('Notification not found', 404);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/notifications
 * Broadcast or send notification (Admin)
 */
router.post('/', authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, userIds, title, message, type = 'INFO' } = req.body;

    if (!title || !message) {
      throw new AppError('Title and message are required', 400);
    }

    const notifType = Object.values(NotificationType).includes(type) ? type : NotificationType.INFO;

    if (userIds && Array.isArray(userIds)) {
      await prisma.notification.createMany({
        data: userIds.map((uid: string) => ({
          userId: uid,
          title,
          message,
          type: notifType,
        })),
      });
    } else if (userId) {
      await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type: notifType,
        },
      });
    } else {
      // Broadcast to all active users
      const allUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      await prisma.notification.createMany({
        data: allUsers.map((u) => ({
          userId: u.id,
          title,
          message,
          type: notifType,
        })),
      });
    }

    res.status(201).json({
      success: true,
      message: 'Notification dispatched successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
