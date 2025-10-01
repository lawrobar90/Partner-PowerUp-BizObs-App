import express from 'express';
import { simulateEvents } from '../services/eventService.js';

const router = express.Router();

// POST /api/simulateEvents
router.post('/simulateEvents', async (req, res) => {
  try {
  const { journey, ratePerSecond = 2, durationSeconds = 10 } = req.body || {};
  const stats = await simulateEvents({ io: req.io, journey, ratePerSecond, durationSeconds, correlationId: req.correlationId, frontendHostLabel: req.frontendHostLabel });
    res.json({ status: 'started', stats });
  } catch (err) {
    console.error('simulateEvents error', err);
    res.status(500).json({ error: 'Failed to start simulation' });
  }
});

export default router;
