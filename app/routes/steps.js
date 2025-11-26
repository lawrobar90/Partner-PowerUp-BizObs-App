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
        serviceName: step.serviceName || getServiceNameFromStep(step.stepName || step.name || `Step${idx+1}`),
        estimatedDuration: step.estimatedDuration,
        businessRationale: step.businessRationale,
        timestamp: step.timestamp,
        duration: step.duration,
        substeps: step.substeps
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

    // Ensure all dynamic services are running before chaining with company context if journey provided
    const companyContext = {
      companyName: journey?.companyName || req.body.companyName,
      domain: journey?.domain || req.body.domain,
      industryType: journey?.industryType || req.body.industryType
    };
    for (const s of stepsArr) {
      ensureServiceRunning(s.stepName, { ...companyContext, stepName: s.stepName, serviceName: s.serviceName });
    }
    await new Promise(resolve => setTimeout(resolve, 1000));

  const first = stepsArr[0];
  const second = stepsArr[1] || null;
  // Ensure first service is started and ready
  const servicePort = await ensureServiceReadyForStep(first.stepName, { serviceName: first.serviceName });
    const http = await import('http');

    // Generate initial trace context for the chain
    const rootTraceId = uuidv4().replace(/-/g, '');
    const rootSpanId = uuidv4().slice(0, 16).replace(/-/g, '');

    const payload = {
      stepName: first.stepName,
      serviceName: first.serviceName,
      nextStepName: second ? second.stepName : null,
      correlationId,
      journeyId,
      domain,
      journey,
      steps: stepsArr,
      thinkTimeMs: req.body.thinkTimeMs,
      traceId: rootTraceId,
      spanId: rootSpanId
    };

    const options = {
      hostname: '127.0.0.1',
      port: servicePort,
      path: '/process',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': correlationId,
        // Start the distributed trace chain with W3C headers
        'traceparent': `00-${rootTraceId.padEnd(32, '0')}-${rootSpanId.padEnd(16, '0')}-01`,
        'x-dynatrace-trace-id': rootTraceId,
        'x-dynatrace-parent-span-id': rootSpanId
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

// Full chain execution - runs all steps in sequence
router.post('/full-chain', async (req, res) => {
  try {
    const { stepName, journeyId, domain, journey, steps: customSteps } = req.body || {};
    console.log(`🔥🔥🔥 [FULL-CHAIN ROUTE] Body: ${JSON.stringify(req.body)} 🔥🔥🔥`);
    const correlationId = req.correlationId;

    // Build ordered steps array (same logic as step1-chained)
    let stepsArr = [];
    if (customSteps && Array.isArray(customSteps)) {
      stepsArr = customSteps.map((step, idx) => ({
        stepName: step.stepName || step.name || `Step${idx+1}`,
        serviceName: step.serviceName || getServiceNameFromStep(step.stepName || step.name || `Step${idx+1}`)
      }));
    } else if (journey && journey.steps && Array.isArray(journey.steps)) {
      stepsArr = journey.steps.map((step, idx) => ({
        stepName: step.stepName || step.name || `Step${idx+1}`,
        serviceName: step.serviceName || getServiceNameFromStep(step.stepName || step.name || `Step${idx+1}`),
        estimatedDuration: step.estimatedDuration,
        businessRationale: step.businessRationale,
        timestamp: step.timestamp,
        duration: step.duration,
        substeps: step.substeps
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

    // Start all services
    const companyContext = {
      companyName: journey?.companyName || req.body.companyName,
      domain: journey?.domain || req.body.domain,
      industryType: journey?.industryType || req.body.industryType
    };
    
    for (const s of stepsArr) {
      ensureServiceRunning(s.stepName, { ...companyContext, stepName: s.stepName, serviceName: s.serviceName });
    }
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for services to start

    // Execute all steps in sequence
    const http = await import('http');
    const allResults = [];
    let totalDuration = 0;

    for (let i = 0; i < stepsArr.length; i++) {
      const currentStep = stepsArr[i];
      const nextStep = stepsArr[i + 1] || null;
      
      try {
        const servicePort = await ensureServiceReadyForStep(currentStep.stepName, { serviceName: currentStep.serviceName });
        
        const payload = {
          stepName: currentStep.stepName,
          serviceName: currentStep.serviceName,
          nextStepName: nextStep ? nextStep.stepName : null,
          correlationId,
          journeyId,
          domain,
          journey,
          steps: stepsArr,
          thinkTimeMs: req.body.thinkTimeMs || 100,
          journeyTrace: allResults // Pass previous results as journey trace
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

        const stepResult = await new Promise((resolve, reject) => {
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

        if (stepResult.journeyTrace && Array.isArray(stepResult.journeyTrace)) {
          allResults.push(...stepResult.journeyTrace);
        }
        totalDuration += stepResult.processingTime || 0;
        
      } catch (stepError) {
        console.error(`Error executing step ${currentStep.stepName}:`, stepError);
        allResults.push({
          stepName: currentStep.stepName,
          serviceName: currentStep.serviceName,
          timestamp: new Date().toISOString(),
          correlationId,
          error: stepError.message,
          status: 'failed'
        });
      }
    }

    res.json({ 
      ok: true, 
      pipeline: 'full-chain-execution', 
      result: {
        steps: stepsArr,
        journeyTrace: allResults,
        totalSteps: stepsArr.length,
        completedSteps: allResults.filter(r => r.status !== 'failed').length,
        totalDuration,
        correlationId,
        journeyId
      }
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
