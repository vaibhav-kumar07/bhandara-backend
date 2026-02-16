import { Router } from 'express';
import { DonorService } from '../services/donor.service';
import { DonationService } from '../services/donation.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import {
  createDonorBodySchema,
  updateDonorBodySchema,
  donorIdParamSchema
} from '../validations/donor.schema';

const router = Router();

// Get all donors with donations
router.get('/', async (req, res, next) => {
  try {
    const donors = await DonorService.getAllDonors();
    const donorsWithDonations = await Promise.all(
      donors.map(async (donor) => {
        const donations = await DonationService.getDonationsByDonor(donor.id);
        return {
          ...donor,
          donations
        };
      })
    );

    res.json({
      success: true,
      donors: donorsWithDonations
    });
  } catch (error) {
    next(error);
  }
});

// Get donor by ID
router.get('/:id', validateParams(donorIdParamSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const donor = await DonorService.getDonorById(id);
    
    if (!donor) {
      res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
      return;
    }

    const donations = await DonationService.getDonationsByDonor(id);
    
    res.json({
      success: true,
      donor,
      donations
    });
  } catch (error) {
    next(error);
  }
});

// Create donor (requires authentication)
router.post(
  '/',
  authenticateToken,
  validateBody(createDonorBodySchema),
  async (req, res, next) => {
    try {
      const { donorName, fatherName } = req.body;
      const donor = await DonorService.createDonor({ donorName, fatherName });
      
      res.status(201).json({
        success: true,
        donorId: donor.id,
        message: 'Donor created successfully'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// Update donor (requires authentication)
router.put(
  '/:id',
  authenticateToken,
  validateParams(donorIdParamSchema),
  validateBody(updateDonorBodySchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { donorName, fatherName } = req.body;
      const donor = await DonorService.updateDonor(id, { donorName, fatherName });
      
      res.json({
        success: true,
        donor,
        message: 'Donor updated successfully'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;

