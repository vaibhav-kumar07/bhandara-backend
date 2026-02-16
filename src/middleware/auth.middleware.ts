import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ADMIN_ROLE } from '../config/constants';
import { AdminSession } from '../utils/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

export interface AuthRequest extends Request {
  admin?: AdminSession;
}

export interface JWTPayload {
  adminId: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware to authenticate requests using JWT token
 */
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid token.'
      });
      return;
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        res.status(403).json({
          success: false,
          message: 'Invalid or expired token'
        });
        return;
      }

      const payload = decoded as JWTPayload;
      req.admin = {
        id: payload.adminId,
        username: payload.username,
        role: payload.role as typeof ADMIN_ROLE.ADMIN | typeof ADMIN_ROLE.SUPER_ADMIN
      };
      next();
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
}

/**
 * Middleware to check if user is super admin
 */
export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.admin) {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
    return;
  }

  if (req.admin.role !== ADMIN_ROLE.SUPER_ADMIN) {
    res.status(403).json({
      success: false,
      message: 'Super admin access required'
    });
    return;
  }

  next();
}

