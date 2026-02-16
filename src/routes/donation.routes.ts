import { Router } from 'express';
import { DonationService } from '../services/donation.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import {
  createDonationBodySchema,
  updateDonationBodySchema,
  donationIdParamSchema
} from '../validations/donation.schema';
import { bhandaraIdParamSchema } from '../validations/bhandara.schema';
import { donorIdParamSchema } from '../validations/donor.schema';

const router = Router();

// Get all donations
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const donations = await DonationService.getAllDonations();
    res.json({
      success: true,
      donations
    });
  } catch (error) {
    next(error);
  }
});

// Get donation by ID
router.get(
  '/:id',
  authenticateToken,
  validateParams(donationIdParamSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const donation = await DonationService.getDonationById(id);
      
      if (!donation) {
        res.status(404).json({
          success: false,
          message: 'Donation not found'
        });
        return;
      }

      res.json({
        success: true,
        donation
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get donations by bhandara
router.get(
  '/bhandara/:id',
  validateParams(bhandaraIdParamSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const donations = await DonationService.getDonationsByBhandara(id);
      
      res.json({
        success: true,
        donations
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get donations by donor
router.get(
  '/donor/:id',
  validateParams(donorIdParamSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const donations = await DonationService.getDonationsByDonor(id);
      
      res.json({
        success: true,
        donations
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create donation (requires authentication)
router.post(
  '/',
  authenticateToken,
  validateBody(createDonationBodySchema),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.admin) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { donorId, bhandaraId, amount, paymentMode } = req.body;
      const donation = await DonationService.createDonation(
        { donorId, bhandaraId, amount, paymentMode },
        req.admin
      );
      
      res.status(201).json({
        success: true,
        donationId: donation.id,
        message: 'Donation created successfully'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// Update donation (requires authentication)
router.put(
  '/:id',
  authenticateToken,
  validateParams(donationIdParamSchema),
  validateBody(updateDonationBodySchema),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.admin) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { id } = req.params;
      const { amount, paymentMode, note } = req.body;
      const donation = await DonationService.updateDonation(
        id,
        { amount, paymentMode, note },
        req.admin
      );
      
      res.json({
        success: true,
        donationId: donation.id,
        message: 'Donation updated successfully'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;

