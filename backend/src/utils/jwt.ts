import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRES = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Sign a new access token
 * @param payload - JWT payload containing user info
 * @returns Signed JWT access token string
 */
export const signAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
    issuer: 'health-camp-api',
    audience: 'health-camp-client',
  } as jwt.SignOptions);
};

/**
 * Sign a new refresh token
 * @param payload - JWT payload containing user info
 * @returns Signed JWT refresh token string
 */
export const signRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES,
    issuer: 'health-camp-api',
    audience: 'health-camp-client',
  } as jwt.SignOptions);
};

/**
 * Verify an access token
 * @param token - JWT token string to verify
 * @returns Decoded JWT payload
 * @throws JsonWebTokenError or TokenExpiredError
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET, {
    issuer: 'health-camp-api',
    audience: 'health-camp-client',
  }) as JwtPayload;
};

/**
 * Verify a refresh token
 * @param token - JWT refresh token string to verify
 * @returns Decoded JWT payload
 * @throws JsonWebTokenError or TokenExpiredError
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET, {
    issuer: 'health-camp-api',
    audience: 'health-camp-client',
  }) as JwtPayload;
};

/**
 * Generate both access and refresh tokens for a user
 * @param payload - JWT payload containing user info
 * @returns Object with accessToken and refreshToken
 */
export const generateTokenPair = (payload: JwtPayload): { accessToken: string; refreshToken: string } => {
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  return { accessToken, refreshToken };
};
