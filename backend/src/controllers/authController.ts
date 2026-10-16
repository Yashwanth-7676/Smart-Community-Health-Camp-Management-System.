import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { sanitizeUser } from '../utils/helpers';
import { LoginDto, RegisterDto } from '../types';
import { DEMO_USERS, isDbConnectionError } from '../utils/mockStore';
import { recordFailedLoginAttempt } from '../middleware/auditLog';

const prisma = new PrismaClient();

// ========================
// Validators
// ========================

export const loginValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

export const registerValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('firstName').trim().notEmpty().withMessage('First name required'),
  body('lastName').trim().notEmpty().withMessage('Last name required'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
  body('role').optional().isIn(['PATIENT', 'DOCTOR', 'VOLUNTEER']).withMessage('Invalid role'),
];

/**
 * POST /api/v1/auth/login
 * Authenticate user and return JWT tokens
 */
export const login = [
  validate(loginValidators),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body as LoginDto;

      // Find user by email (with fallback to demo users if DB is unreachable)
      let user: any;
      try {
        user = await prisma.user.findUnique({ where: { email } });
      } catch (dbErr) {
        if (isDbConnectionError(dbErr)) {
          const demo = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
          if (demo) {
            user = {
              id: demo.id,
              email: demo.email,
              password: demo.passwordHash,
              role: demo.role,
              firstName: demo.firstName,
              lastName: demo.lastName,
              phone: demo.phone,
              isActive: demo.isActive,
            };
          }
        } else {
          throw dbErr;
        }
      }

      if (!user) {
        recordFailedLoginAttempt(email, (req.ip || (req.headers['x-forwarded-for'] as string)) || '127.0.0.1');
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      if (!user.isActive) {
        throw new AppError('Your account has been deactivated. Please contact support.', 403, 'ACCOUNT_INACTIVE');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        recordFailedLoginAttempt(email, (req.ip || (req.headers['x-forwarded-for'] as string)) || '127.0.0.1');
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      // Generate tokens
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };

      const { accessToken, refreshToken } = generateTokenPair(tokenPayload);

      const sanitized = sanitizeUser(user);
      const userWithDetails = {
        ...sanitized,
        name: `${sanitized.firstName || ''} ${sanitized.lastName || ''}`.trim() || sanitized.email,
        role: sanitized.role.toLowerCase(),
        Role: sanitized.role,
      };

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userWithDetails,
          tokens: {
            accessToken,
            refreshToken,
          },
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  },
];

/**
 * POST /api/v1/auth/register
 * Register a new user account
 */
export const register = [
  validate(registerValidators),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, firstName, lastName, phone, role } = req.body as RegisterDto;

      // Check for existing user
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new AppError('An account with this email already exists', 409, 'EMAIL_EXISTS');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Only allow PATIENT role for self-registration
      const userRole = role && ['PATIENT'].includes(role) ? role : 'PATIENT';

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role: userRole,
        },
      });

      // Auto-create patient profile for PATIENT role
      if (user.role === 'PATIENT') {
        await prisma.patientProfile.create({
          data: { userId: user.id },
        });
      }

      // Generate tokens
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };

      const { accessToken, refreshToken } = generateTokenPair(tokenPayload);

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: {
          user: sanitizeUser(user),
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  },
];

/**
 * GET /api/v1/auth/me
 * Get current authenticated user's profile
 */
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;

    let user: any;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          patientProfile: true,
          doctorProfile: {
            include: {
              assignedCamps: {
                select: { id: true, name: true, location: true, status: true },
              },
            },
          },
          volunteerProfile: {
            include: {
              assignedCamp: {
                select: { id: true, name: true, location: true, status: true },
              },
            },
          },
        },
      });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        const demo = DEMO_USERS.find(
          (u) => u.id === userId || u.email.toLowerCase() === req.user?.email?.toLowerCase()
        );
        if (demo) {
          user = {
            id: demo.id,
            email: demo.email,
            role: demo.role,
            firstName: demo.firstName,
            lastName: demo.lastName,
            phone: demo.phone,
            isActive: demo.isActive,
            patientProfile: demo.patientProfile || null,
            doctorProfile: demo.doctorProfile || null,
            volunteerProfile: demo.volunteerProfile || null,
          };
        }
      } else {
        throw dbErr;
      }
    }

    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    const sanitized = sanitizeUser(user);
    const userWithDetails = {
      ...sanitized,
      name: `${sanitized.firstName || ''} ${sanitized.lastName || ''}`.trim() || sanitized.email,
      role: sanitized.role.toLowerCase(),
      Role: sanitized.role,
    };

    res.json({
      success: true,
      message: 'User profile retrieved',
      data: userWithDetails,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      throw new AppError('Refresh token required', 400, 'TOKEN_REQUIRED');
    }

    const decoded = verifyRefreshToken(token);

    // Verify user still exists and is active
    let user: any;
    try {
      user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        const demo = DEMO_USERS.find(
          (u) => u.id === decoded.userId || u.email.toLowerCase() === decoded.email?.toLowerCase()
        );
        if (demo) {
          user = demo;
        }
      } else {
        throw dbErr;
      }
    }

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401, 'UNAUTHORIZED');
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(tokenPayload);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/logout
 * Logout user (client-side token removal)
 */
export const logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully. Please remove your tokens on the client side.',
    });
  } catch (error) {
    next(error);
  }
};
