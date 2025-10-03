import express from 'express';
import http from 'http';
import { randomBytes } from 'crypto';
import { ensureServiceRunning, getServicePort, getServiceNameFromStep } from '../services/service-manager.js';

const router = express.Router();

// Default journey steps
const DEFAULT_JOURNEY_STEPS = [
  'Discovery', 'Awareness', 'Consideration', 'Purchase', 'Retention', 'Advocacy'
];

// Call a service
async function callDynamicService(stepName, port, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: port,
      path: '/process',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': headers['x-correlation-id'] || payload.correlationId
      }
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Invalid JSON: ${body}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

// Simulate journey
router.post('/simulate-journey', async (req, res) => {
  try {
    const { 
      journeyId = `journey_${Date.now()}`, 
      customerId = `customer_${Date.now()}`,
      chained = true,
      thinkTimeMs = 250
    } = req.body || {};
    
    const correlationId = req.correlationId;
    
    // Extract step data with serviceName support
    let stepData = [];
    
    try {
      // Check multiple possible payload structures
      let stepsArray = null;
      
      if (req.body.journey?.steps && Array.isArray(req.body.journey.steps)) {
        stepsArray = req.body.journey.steps;
        console.log('[journey-sim] Using journey.steps structure');
      } else if (req.body.aiJourney?.steps && Array.isArray(req.body.aiJourney.steps)) {
        stepsArray = req.body.aiJourney.steps;
        console.log('[journey-sim] Using aiJourney.steps structure');
      }
      
      if (stepsArray) {
        stepData = stepsArray.slice(0, 6).map(step => ({
          stepName: step.stepName || step.name || 'UnknownStep',
          serviceName: step.serviceName || null
        }));
        console.log('[journey-sim] Extracted stepData with serviceName:', stepData);
      } else {
        stepData = DEFAULT_JOURNEY_STEPS.map(name => ({ stepName: name, serviceName: null }));
        console.log('[journey-sim] Using default steps');
      }
    } catch (error) {
      console.error('[journey-sim] Error extracting step data:', error.message);
      stepData = DEFAULT_JOURNEY_STEPS.map(name => ({ stepName: name, serviceName: null }));
    }
    
    // Ensure stepData is valid
    if (!Array.isArray(stepData) || stepData.length === 0) {
      stepData = DEFAULT_JOURNEY_STEPS.map(name => ({ stepName: name, serviceName: null }));
      console.log('[journey-sim] Fallback to default steps due to invalid stepData');
    }
    
    // Extract company context from multiple possible locations
    const currentPayload = {
      journeyId: req.body.journey?.journeyId || journeyId,
      customerId,
      correlationId,
      startTime: new Date().toISOString(),
      companyName: req.body.journey?.companyName || req.body.companyName || 'DefaultCompany',
      domain: req.body.journey?.domain || req.body.domain || 'default.com',
      industryType: req.body.journey?.industryType || req.body.industryType || 'general'
    };
    
    console.log(`[journey-sim] Company: ${currentPayload.companyName}, Domain: ${currentPayload.domain}`);
    
    // Start services with company context
    const companyContext = {
      companyName: currentPayload.companyName,
      domain: currentPayload.domain,
      industryType: currentPayload.industryType
    };
    
    for (const { stepName, serviceName } of stepData) {
      ensureServiceRunning(stepName, { ...companyContext, stepName, serviceName });
    }

    await new Promise(resolve => setTimeout(resolve, 5000));  // Wait for services to fully start

    const journeyResults = [];
    
    if (chained) {
      const first = stepData[0];
      if (!first) {
        throw new Error('No steps available for chained execution');
      }
      
      const firstPort = getServicePort(first.stepName);
      const actualServiceName = first.serviceName || getServiceNameFromStep(first.stepName);
      
      console.log(`[journey-sim] [chained] Calling first service ${actualServiceName} on port ${firstPort}`);
      
      const payload = {
        ...currentPayload,
        stepName: first.stepName,
        thinkTimeMs,
        steps: stepData
      };
      
      const chainedResult = await callDynamicService(first.stepName, firstPort, payload, { 'x-correlation-id': correlationId });
      
      if (chainedResult) {
        journeyResults.push({
          ...chainedResult,
          stepNumber: 1,
          serviceName: actualServiceName
        });
      }
    } else {
      for (let i = 0; i < stepData.length; i++) {
        const stepInfo = stepData[i];
        if (!stepInfo) {
          console.error(`[journey-sim] Step ${i} is undefined, skipping`);
          continue;
        }
        
        const { stepName, serviceName: payloadServiceName } = stepInfo;
        if (!stepName) {
          console.error(`[journey-sim] Step ${i} has no stepName, skipping`);
          continue;
        }
        
        const serviceName = payloadServiceName || getServiceNameFromStep(stepName);
        const servicePort = getServicePort(stepName);
        
        try {
          const stepResult = await callDynamicService(stepName, servicePort, {
            ...currentPayload,
            stepName,
            stepIndex: i + 1,
            totalSteps: stepData.length
          }, { 'x-correlation-id': correlationId });
          
          journeyResults.push({
            ...stepResult,
            stepNumber: i + 1,
            stepName,
            serviceName
          });
          
          console.log(`[journey-sim] ✅ Step ${i + 1}: ${serviceName}`);
        } catch (error) {
          console.error(`[journey-sim] ❌ Step ${i + 1} failed: ${error.message}`);
          journeyResults.push({
            stepNumber: i + 1,
            stepName,
            serviceName,
            status: 'failed',
            error: error.message
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, thinkTimeMs));
      }
    }
    
    const journeyComplete = {
      journeyId,
      customerId,
      correlationId,
      status: 'completed',
      totalSteps: stepData.length,
      completedSteps: journeyResults.filter(r => r.status !== 'failed').length,
      stepNames: stepData.map(s => s.stepName),
      steps: journeyResults
    };
    
    res.json({
      success: true,
      journey: journeyComplete
    });

  } catch (error) {
    console.error('[journey-sim] Journey simulation failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
