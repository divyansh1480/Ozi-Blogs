import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { JwtPayload } from '../types/index';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from cookies
    const token = req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - No token provided',
      });
    }

    // Verify token
    const payload = verifyAccessToken(token);

    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Invalid or expired token',
      });
    }

    // Attach user to request
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }
}

export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.accessToken;

    if (token) {
      const payload = verifyAccessToken(token);
      if (payload) {
        req.user = payload;
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
}
