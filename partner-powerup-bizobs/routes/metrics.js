import express from 'express';
import { getMetricsSummary } from '../services/metricsService.js';

const router = express.Router();

// GET /api/metrics
router.get('/metrics', async (req, res) => {
  try {
    const summary = await getMetricsSummary();
    res.json(summary);
  } catch (err) {
    console.error('metrics error', err);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

export default router;
