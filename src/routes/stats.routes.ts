import { Router } from 'express';
import { StatsService } from '../services/stats.service';

const router = Router();

// Get overall stats
router.get('/', async (_req, res, next) => {
  try {
    const stats = await StatsService.getStats();
    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    next(error);
  }
});

export default router;

