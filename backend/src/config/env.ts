// backend/src/config/env.ts
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1).default('postgresql://healthcamp_user:HealthCamp@2024@localhost:5432/healthcamp?schema=public'),
  JWT_SECRET: z.string().min(16).default('smart-health-camp-jwt-secret-key-2024-production'),
  JWT_REFRESH_SECRET: z.string().min(16).default('smart-health-camp-refresh-secret-key-2024-production'),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:5173'),
  RATE_LIMIT_MAX: z.coerce.number().default(200),
  AI_API_KEY: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

let parsedEnv: EnvConfig;

try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.warn('⚠️  [Env Warning] Some environment variables failed strict schema check:');
    error.errors.forEach((err) => {
      console.warn(`   - ${err.path.join('.')}: ${err.message}`);
    });
  }
  // Safe default fallback in development
  parsedEnv = {
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',
    PORT: parseInt(process.env.PORT || '5000', 10),
    HOST: process.env.HOST || '0.0.0.0',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://healthcamp_user:HealthCamp@2024@localhost:5432/healthcamp?schema=public',
    JWT_SECRET: process.env.JWT_SECRET || 'smart-health-camp-jwt-secret-key-2024-production',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'smart-health-camp-refresh-secret-key-2024-production',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173',
    RATE_LIMIT_MAX: 200,
  };
}

export const env = parsedEnv;
export default env;
