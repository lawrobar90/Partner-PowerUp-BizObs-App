import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import eventService, { buildEventPayload, emitEvent, inferDomain } from '../services/eventService.js';
import { ensureServiceRunning, getServiceNameFromStep, getServicePort, ensureServiceReadyForStep } from '../services/service-manager.js';

const router = express.Router();

function stepHandler(stepNum) {
  return async (req, res) => {
    const correlationId = req.correlationId;
    const {
      userId = uuidv4(),
      email = `${uuidv4().slice(0,8)}@example.com`,
      cost = Number((Math.random() * 2000 + 50).toFixed(2)),
      npsScore = Math.floor(Math.random() * 11) - 1,
      journeyStep = `Step${stepNum}`,
      stepName = journeyStep,
      serviceName,
      metadata = {},
      journeyId,
      stepIndex,
      domain,
      substeps
    } = req.body || {};

    const traceId = uuidv4();
    const spanId = uuidv4().slice(0,16);
    const resolvedDomain = domain || inferDomain(req.body || {});
    const resolvedService = serviceName || `${resolvedDomain}-${journeyStep.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-svc`;

    // If substeps are provided, route through the new child-service pipeline for better service separation
    if (Array.isArray(substeps) && substeps.length > 0) {
      try {
        const result = await eventService.emitEvent('customer_journey_step', {
          stepName: stepName || journeyStep,
          substeps,
          correlationId,
          journeyId,
          domain: resolvedDomain
        });
        // Emit a light UI event for visibility
        if (req.io) {
          req.io.emit('bizEvent', {
            timestamp: new Date().toISOString(),
            domain: resolvedDomain,
            journeyStep: stepName || journeyStep,
            email,
            metadata: { correlationId }
          });
        }
        return res.json({ ok: true, step: journeyStep, pipeline: 'child-services', result });
      } catch (e) {
        return res.status(500).json({ ok: false, error: e.message, step: journeyStep });
      }
    }

    // Fallback: legacy single-event emission
    const payload = buildEventPayload({ userId, email, cost, npsScore, journeyStep, serviceName: resolvedService, traceId, spanId, domain: resolvedDomain, journeyId, stepIndex: stepIndex ?? (stepNum - 1), metadata: { ...metadata, correlationId, frontendHostLabel: req.frontendHostLabel }, eventType: req.body?.eventType });
    emitEvent(req.io, payload);
    res.json({ ok: true, step: journeyStep, event: payload, pipeline: 'legacy' });
  };
}

router.post('/step1', stepHandler(1));
router.post('/step2', stepHandler(2));
router.post('/step3', stepHandler(3));
router.post('/step4', stepHandler(4));
router.post('/step5', stepHandler(5));
router.post('/step6', stepHandler(6));

// Optional: trigger a chained flow across services starting at the first step
// Copilot Prompt: Always return steps as an array ordered by execution (step1, step2, ...), each with a unique serviceName and stepName.
router.post('/step1-chained', async (req, res) => {
  try {
    const { stepName, journeyId, domain, journey, steps: customSteps } = req.body || {};
    console.log(`🔥🔥🔥 [STEP1-CHAINED ROUTE] Body: ${JSON.stringify(req.body)} 🔥🔥🔥`);
    const correlationId = req.correlationId;

    // Build ordered steps array
    let stepsArr = [];
    if (customSteps && Array.isArray(customSteps)) {
      stepsArr = customSteps.map((step, idx) => ({
        stepName: step.stepName || step.name || `Step${idx+1}`,
        serviceName: step.serviceName || getServiceNameFromStep(step.stepName || step.name || `Step${idx+1}`)
      }));
    } else if (journey && journey.steps && Array.isArray(journey.steps)) {
      stepsArr = journey.steps.map((step, idx) => ({
        stepName: step.stepName || step.name || `Step${idx+1}`,
        serviceName: step.serviceName || getServiceNameFromStep(step.stepName || step.name || `Step${idx+1}`)
      }));
    } else if (stepName) {
      stepsArr = [{ stepName, serviceName: getServiceNameFromStep(stepName) }];
    } else {
      stepsArr = [
        { stepName: 'Discovery', serviceName: getServiceNameFromStep('Discovery') },
        { stepName: 'Awareness', serviceName: getServiceNameFromStep('Awareness') },
        { stepName: 'Consideration', serviceName: getServiceNameFromStep('Consideration') },
        { stepName: 'Purchase', serviceName: getServiceNameFromStep('Purchase') },
        { stepName: 'Retention', serviceName: getServiceNameFromStep('Retention') },
        { stepName: 'Advocacy', serviceName: getServiceNameFromStep('Advocacy') }
      ];
    }

    // Ensure all dynamic services are running before chaining
    for (const s of stepsArr) {
      ensureServiceRunning(s.stepName, { serviceName: s.serviceName });
    }
    await new Promise(resolve => setTimeout(resolve, 1000));

  const first = stepsArr[0];
  const second = stepsArr[1] || null;
  // Ensure first service is started and ready
  const servicePort = await ensureServiceReadyForStep(first.stepName, { serviceName: first.serviceName });
    const http = await import('http');

    const payload = {
      stepName: first.stepName,
      serviceName: first.serviceName,
      nextStepName: second ? second.stepName : null,
      correlationId,
      journeyId,
      domain,
      journey,
      steps: stepsArr,
      thinkTimeMs: req.body.thinkTimeMs
    };

    const options = {
      hostname: '127.0.0.1',
      port: servicePort,
      path: '/process',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': correlationId
      }
    };

    const result = await new Promise((resolve, reject) => {
      const rq = http.request(options, (rs) => {
        let b = '';
        rs.on('data', c => b += c);
        rs.on('end', () => {
          try { resolve(JSON.parse(b || '{}')); }
          catch (e) { resolve({ raw: b, parseError: e.message }); }
        });
      });
      rq.on('error', reject);
      rq.end(JSON.stringify(payload));
    });
    res.json({ ok: true, pipeline: 'chained-child-services', result });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
