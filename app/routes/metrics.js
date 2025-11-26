import express from 'express';
import { getMetricsSummary } from '../services/metricsService.js';

const router = express.Router();

// Lightweight root metrics endpoint to avoid 404s from pollers
router.get('/', (req, res) => {
  // Minimal text response; adjust to Prometheus format if needed later
  res.type('text/plain').send('ok\n');
});

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
