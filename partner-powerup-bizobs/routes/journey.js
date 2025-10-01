import express from 'express';
import { generateJourney } from '../services/journeyService.js';

const router = express.Router();

// POST /api/generateJourney
router.post('/generateJourney', async (req, res) => {
  try {
    const { customer = '', region = '', journeyType = '', details = '', website = '' } = req.body || {};
    const aiHint = [
      customer && `Company: ${customer}.`,
      region && `Region: ${region}.`,
      website && `Official website: ${website}.`,
      journeyType && `Journey focus: ${journeyType}.`,
      'Please research official and reputable public sources to infer a realistic 6-step customer journey with concrete touchpoints, product/service terms, checkout, logistics/fulfilment, support, and NPS/feedback. Include 2-5 source URLs.',
      details && `Additional notes: ${details}`
    ].filter(Boolean).join(' ');

    const journey = await generateJourney({ customer, region, journeyType, details: aiHint, website });
    res.json({ journey });
  } catch (err) {
    console.error('generateJourney error', err);
    res.status(500).json({ error: 'Failed to generate journey' });
  }
});

export default router;
