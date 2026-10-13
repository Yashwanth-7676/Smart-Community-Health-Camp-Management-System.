import { Request, Response, NextFunction } from 'express';

/**
 * Custom Application Error class
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let code: string | undefined;

  // Handle known AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
  }

  // Handle Prisma errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as { code: string; meta?: { target?: string[] } };

    if (prismaError.code === 'P2002') {
      statusCode = 409;
      const field = prismaError.meta?.target?.[0] || 'field';
      message = `A record with this ${field} already exists.`;
      code = 'DUPLICATE_ENTRY';
    } else if (prismaError.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found.';
      code = 'NOT_FOUND';
    } else if (prismaError.code === 'P2003') {
      statusCode = 400;
      message = 'Invalid reference. Related record not found.';
      code = 'INVALID_REFERENCE';
    } else if (prismaError.code === 'P2014') {
      statusCode = 400;
      message = 'The change you are trying to make would violate a required relation.';
      code = 'RELATION_VIOLATION';
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
    code = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired.';
    code = 'TOKEN_EXPIRED';
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
    code = 'VALIDATION_ERROR';
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.url}:`, err);
  } else {
    // Only log non-operational errors in production
    if (!(err instanceof AppError) || !err.isOperational) {
      console.error(`[${new Date().toISOString()}] Unhandled Error:`, err);
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(code && { code }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.message,
    }),
  });
};
