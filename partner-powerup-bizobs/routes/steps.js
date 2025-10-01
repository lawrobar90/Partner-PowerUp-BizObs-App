import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import eventService, { buildEventPayload, emitEvent, inferDomain } from '../services/eventService.js';

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
router.post('/step1-chained', async (req, res) => {
  try {
    const { journeyId, domain, journey } = req.body || {};
    const correlationId = req.correlationId;
    
    // Extract step names from journey configuration if provided
    let stepNames = ['Discovery', 'Awareness', 'Consideration', 'Purchase', 'Retention', 'Advocacy'];
    if (journey && journey.steps && Array.isArray(journey.steps)) {
      stepNames = journey.steps.map(step => step.stepName || step.name || `Step${step.stepIndex || 1}`);
    }
    
    // Start with the first step name
    const firstStepName = stepNames[0];
    const secondStepName = stepNames[1] || 'Step2';
    
    // Call the appropriate service based on step name
    const serviceName = `Step1Service`;
    const SERVICE_PORTS = { 'Step1Service': 4101 };
    const http = await import('http');
    
    const payload = { 
      stepName: firstStepName, 
      nextStepName: secondStepName,
      correlationId, 
      journeyId, 
      domain,
      journey,
      stepNames: stepNames.slice(1) // Pass remaining step names for chaining
    };
    
    const options = { 
      hostname: '127.0.0.1', 
      port: SERVICE_PORTS['Step1Service'], 
      path: '/process', 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', 'x-correlation-id': correlationId } 
    };
    
    const result = await new Promise((resolve, reject) => {
      const rq = http.request(options, (rs) => { 
        let b=''; 
        rs.on('data', c => b+=c); 
        rs.on('end', () => { 
          try { resolve(JSON.parse(b||'{}')); } catch(e){ reject(e);} 
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
