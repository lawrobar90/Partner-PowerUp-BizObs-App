import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getServiceNameFromStep } from '../services/service-manager.js';

const router = express.Router();

// Helper: build a single business event line
function buildBizEventLine({ ts, journey, step, substep, correlationId }) {
  const company = journey?.companyName || journey?.company || 'UnknownCompany';
  const domain = journey?.domain || journey?.website || 'unknown.domain';
  const journeyId = journey?.journeyId || journey?.id || uuidv4();
  const stepName = step?.stepName || step?.name || 'UnknownStep';
  const serviceName = step?.serviceName || getServiceNameFromStep(stepName);
  const substepName = substep?.substepName || substep?.name;

  const event = {
    eventType: 'customer_journey_step',
    timestamp: ts, // epoch millis
    journeyId,
    company,
    domain,
    stepName,
    serviceName,
    substepName,
    metadata: {
      ...((step && step.metadata) || {}),
      ...((substep && substep.metadata) || {}),
    },
    correlationId,
    source: 'bizobs-backfill'
  };
  return JSON.stringify(event);
}

// POST /api/backfill/bizevents
// Body: { journey, startTime, stepIntervalMs=60000, includeSubsteps=true, push=false, dynatraceUrl?, apiToken? }
router.post('/bizevents', async (req, res) => {
  try {
    const {
      journey,
      startTime,
      stepIntervalMs = 60000,
      includeSubsteps = true,
      push = false,
      dynatraceUrl = process.env.DT_BIZEVENTS_URL, // e.g. https://<env>.live.dynatrace.com/bizevents/ingest
      apiToken = process.env.DT_API_TOKEN
    } = req.body || {};

    if (!journey || !Array.isArray(journey.steps) || journey.steps.length === 0) {
      return res.status(400).json({ ok: false, error: 'journey.steps required' });
    }

    const startTs = startTime ? new Date(startTime).getTime() : Date.now();
    if (!Number.isFinite(startTs)) {
      return res.status(400).json({ ok: false, error: 'Invalid startTime' });
    }

    const correlationId = uuidv4();
    const lines = [];
    let ts = startTs;
    for (let i = 0; i < Math.min(journey.steps.length, 50); i++) { // safety bound
      const step = journey.steps[i];
      if (includeSubsteps && Array.isArray(step.substeps) && step.substeps.length > 0) {
        for (const sub of step.substeps) {
          lines.push(buildBizEventLine({ ts, journey, step, substep: sub, correlationId }));
          ts += Math.max(1, Math.floor(stepIntervalMs / (step.substeps.length || 1)));
        }
      } else {
        lines.push(buildBizEventLine({ ts, journey, step, correlationId }));
        ts += stepIntervalMs;
      }
    }

    const ndjson = lines.join('\n') + '\n';

    // If push requested and env/params provided, attempt to POST to Dynatrace ingest
    if (push) {
      if (!dynatraceUrl || !apiToken) {
        return res.status(400).json({ ok: false, error: 'dynatraceUrl and apiToken required when push=true' });
      }
      try {
        const response = await fetch(dynatraceUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Api-Token ${apiToken}`,
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: ndjson
        });
        const text = await response.text();
        if (!response.ok) {
          return res.status(response.status).json({ ok: false, error: 'Dynatrace ingest failed', response: text });
        }
        return res.json({ ok: true, pushed: true, count: lines.length, response: text });
      } catch (e) {
        return res.status(500).json({ ok: false, error: e.message });
      }
    }

    // Default: return NDJSON content for preview or manual ingestion
    res.setHeader('Content-Type', 'application/x-ndjson');
    return res.send(ndjson);
  } catch (e) {
    console.error('backfill error', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
