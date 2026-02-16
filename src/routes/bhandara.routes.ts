import { Router } from 'express';
import { BhandaraService } from '../services/bhandara.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import {
  createBhandaraBodySchema,
  updateBhandaraBodySchema,
  bhandaraIdParamSchema
} from '../validations/bhandara.schema';
import { StatsService } from '../services/stats.service';

const router = Router();

// Get all bhandaras with stats
router.get('/', async (req, res, next) => {
  try {
    const bhandaras = await BhandaraService.getAllBhandaras();
    
    let stats = null;
    try {
      const statsData = await StatsService.getStats();
      stats = statsData.bhandaras;
    } catch (statsError) {
      console.error('Error fetching stats (continuing without stats):', statsError);
    }

    const statsMap = new Map();
    if (stats && Array.isArray(stats)) {
      stats.forEach((stat: any) => {
        statsMap.set(stat.bhandaraId, stat);
      });
    }

    const bhandarasWithStats = bhandaras.map(bhandara => {
      const stat = statsMap.get(bhandara.id) || {
        totalCollected: 0,
        totalPending: 0,
        totalDonations: 0,
        donorCount: 0,
        paymentModeBreakdown: {
          cash: 0,
          upi: 0,
          bank: 0
        }
      };
      
      return {
        ...bhandara,
        ...stat
      };
    });

    bhandarasWithStats.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    res.json({
      success: true,
      bhandaras: bhandarasWithStats
    });
  } catch (error) {
    next(error);
  }
});

// Get bhandara by ID
router.get('/:id', validateParams(bhandaraIdParamSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const bhandara = await BhandaraService.getBhandaraById(id);
    
    if (!bhandara) {
      res.status(404).json({
        success: false,
        message: 'Bhandara not found'
      });
      return;
    }

    res.json({
      success: true,
      bhandara
    });
  } catch (error) {
    next(error);
  }
});

// Create bhandara (requires authentication)
router.post(
  '/',
  authenticateToken,
  validateBody(createBhandaraBodySchema),
  async (req, res, next) => {
    try {
      const { name, date } = req.body;
      const bhandara = await BhandaraService.createBhandara({ name, date });
      
      res.status(201).json({
        success: true,
        bhandaraId: bhandara.id,
        bhandara,
        message: 'Bhandara created successfully'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// Update bhandara (requires authentication)
router.put(
  '/:id',
  authenticateToken,
  validateParams(bhandaraIdParamSchema),
  validateBody(updateBhandaraBodySchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, date } = req.body;
      const bhandara = await BhandaraService.updateBhandara(id, { name, date });
      
      res.json({
        success: true,
        bhandara,
        message: 'Bhandara updated successfully'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// Delete bhandara (requires authentication)
router.delete(
  '/:id',
  authenticateToken,
  validateParams(bhandaraIdParamSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      await BhandaraService.deleteBhandara(id);
      
      res.json({
        success: true,
        message: 'Bhandara deleted successfully'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;

