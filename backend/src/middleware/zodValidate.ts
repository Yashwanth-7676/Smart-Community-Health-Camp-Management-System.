// backend/src/middleware/zodValidate.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validateZod = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // Assign back sanitized/transformed values
      req.body = parsed.body ?? req.body;
      req.query = (parsed.query as any) ?? req.query;
      req.params = (parsed.params as any) ?? req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Input validation failed',
          code: 'VALIDATION_ERROR',
          errors: error.errors.map((e) => ({
            field: e.path.slice(1).join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};

export default validateZod;

