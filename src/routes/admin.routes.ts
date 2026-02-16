import { Router } from 'express';
import { AdminService } from '../services/admin.service';
import { authenticateToken, requireSuperAdmin, AuthRequest } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { createAdminBodySchema, loginAdminBodySchema } from '../validations/admin.schema';
import jwt, { SignOptions } from 'jsonwebtoken';

const router = Router();
const JWT_SECRET: string = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

// Login admin
router.post('/login', validateBody(loginAdminBodySchema), async (req, res, next) => {
  try {
    const { username, pin } = req.body;
    const admin = await AdminService.verifyAdmin(username, pin);
    
    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    const token = jwt.sign(
      {
        adminId: admin.id,
        username: admin.username,
        role: admin.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as SignOptions
    );

    res.json({
      success: true,
      admin,
      token,
      message: 'Login successful'
    });
  } catch (error) {
    next(error);
  }
});

// Create admin (requires authentication and super admin)
router.post(
  '/create',
  authenticateToken,
  requireSuperAdmin,
  validateBody(createAdminBodySchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { username, pin, role } = req.body;
      const admin = await AdminService.createAdmin({ username, pin, role });
      
      res.status(201).json({
        success: true,
        adminId: admin.id,
        message: 'Admin added successfully'
      });
    } catch (error: any) {
      if (error.message === 'Username already exists') {
        res.status(409).json({
          success: false,
          message: error.message
        });
        return;
      }
      next(error);
    }
  }
);

// Get current admin info
router.get('/me', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
      return;
    }

    const admin = await AdminService.getAdminById(req.admin.id);
    if (!admin) {
      res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
      return;
    }

    res.json({
      success: true,
      admin
    });
  } catch (error) {
    next(error);
  }
});

export default router;

