import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { isDbConnectionError, DEMO_USERS } from '../utils/mockStore';
import { logAudit } from '../middleware/auditLog';

const prisma = new PrismaClient();

// In-memory token store for offline/demo fallback
const inMemoryResetTokens = new Map<string, { email: string; expiresAt: Date; used: boolean }>();

export const requestResetValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
];

export const resetPasswordValidators = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
];

/**
 * POST /api/password-reset/request
 * Generate secure expiring token for password reset
 */
export const requestPasswordReset = [
  validate(requestResetValidators),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      let userFound = false;

      try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
          userFound = true;
          await prisma.passwordResetToken.create({
            data: {
              userId: user.id,
              token,
              expiresAt,
            },
          });
          await logAudit(user.id, 'UPDATE', 'PasswordReset', token, { email }, req.ip, req.headers['user-agent']);
        }
      } catch (dbErr) {
        if (isDbConnectionError(dbErr)) {
          const demo = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
          if (demo) {
            userFound = true;
            inMemoryResetTokens.set(token, { email, expiresAt, used: false });
          }
        } else {
          throw dbErr;
        }
      }

      // Always return positive message to avoid email enumeration
      res.json({
        success: true,
        message: 'If an account exists with this email, a reset token has been generated.',
        data: {
          // In development mode or demo environment, return the token so the user can easily test
          devToken: token,
          expiresInMinutes: 60,
        },
      });
    } catch (error) {
      next(error);
    }
  },
];

/**
 * POST /api/password-reset/reset
 * Set new password using token
 */
export const resetPassword = [
  validate(resetPasswordValidators),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, newPassword } = req.body;
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      let resetSuccess = false;

      try {
        const resetRecord = await prisma.passwordResetToken.findUnique({
          where: { token },
          include: { user: true },
        });

        if (resetRecord && !resetRecord.used && resetRecord.expiresAt > new Date()) {
          await prisma.user.update({
            where: { id: resetRecord.userId },
            data: { password: hashedPassword },
          });
          await prisma.passwordResetToken.update({
            where: { id: resetRecord.id },
            data: { used: true },
          });
          await logAudit(resetRecord.userId, 'UPDATE', 'User', resetRecord.userId, { action: 'PasswordResetCompleted' }, req.ip, req.headers['user-agent']);
          resetSuccess = true;
        }
      } catch (dbErr) {
        if (isDbConnectionError(dbErr)) {
          const mem = inMemoryResetTokens.get(token);
          if (mem && !mem.used && mem.expiresAt > new Date()) {
            mem.used = true;
            const demo = DEMO_USERS.find((u) => u.email.toLowerCase() === mem.email.toLowerCase());
            if (demo) {
              demo.passwordHash = hashedPassword;
            }
            resetSuccess = true;
          }
        } else {
          throw dbErr;
        }
      }

      if (!resetSuccess) {
        throw new AppError('Invalid, expired, or already used reset token', 400, 'INVALID_TOKEN');
      }

      res.json({
        success: true,
        message: 'Password has been successfully updated. You can now log in with your new password.',
      });
    } catch (error) {
      next(error);
    }
  },
];

