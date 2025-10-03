import express from 'express';
import http from 'http';
import { randomBytes } from 'crypto';
import { ensureServiceRunning, getServicePort, getServiceNameFromStep } from '../services/service-manager.js';

const router = express.Router();

// Default journey steps
const DEFAULT_JOURNEY_STEPS = [
  'Discovery', 'Awareness', 'Consideration', 'Purchase', 'Retention', 'Advocacy'
];

// Extract Dynatrace tracing headers from incoming request
function extractTracingHeaders(req) {
  const tracingHeaders = {};
  
  // Extract all potential Dynatrace and tracing headers
  const headerKeys = Object.keys(req.headers || {});
  for (const key of headerKeys) {
    const lowerKey = key.toLowerCase();
    // Capture Dynatrace, W3C Trace Context, and other distributed tracing headers
    if (lowerKey.startsWith('x-dynatrace') || 
        lowerKey.startsWith('traceparent') || 
        lowerKey.startsWith('tracestate') || 
        lowerKey.startsWith('x-trace') || 
        lowerKey.startsWith('x-request-id') || 
        lowerKey.startsWith('x-correlation-id') || 
        lowerKey.startsWith('x-span-id') || 
        lowerKey.startsWith('dt-') ||
        lowerKey.startsWith('uber-trace-id')) {
      tracingHeaders[key] = req.headers[key];
    }
  }
  
  return tracingHeaders;
}

// Generate dynamic service name based on AI/Copilot response details
function generateDynamicServiceName(stepName, description = '', category = '', originalStep = {}) {
  // If step already has a service-like name, use it
  if (/Service$/.test(stepName)) {
    return stepName;
  }
  
  // Extract meaningful keywords from description
  const descriptionKeywords = description.toLowerCase().match(/\b(api|service|endpoint|processor|handler|manager|controller|gateway|orchestrator)\b/g) || [];
  
  // Determine service type based on content analysis
  let serviceType = 'Service'; // default
  
  if (description.toLowerCase().includes('api') || originalStep.endpoint) {
    serviceType = 'API';
  } else if (description.toLowerCase().includes('process') || description.toLowerCase().includes('handle')) {
    serviceType = 'Processor';
  } else if (description.toLowerCase().includes('manage') || description.toLowerCase().includes('control')) {
    serviceType = 'Manager';
  } else if (description.toLowerCase().includes('gateway') || description.toLowerCase().includes('proxy')) {
    serviceType = 'Gateway';
  } else if (category) {
    // Use category as service type if available
    serviceType = category.charAt(0).toUpperCase() + category.slice(1) + 'Service';
  }
  
  // Clean and format the step name
  const cleaned = String(stepName).replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
  const serviceBase = cleaned
    .replace(/[\-_]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
  
  const dynamicServiceName = `${serviceBase}${serviceType}`;
  console.log(`[journey-sim] Generated dynamic service name: ${stepName} -> ${dynamicServiceName}`);
  
  return dynamicServiceName;
}

// Call a service
async function callDynamicService(stepName, port, payload, incomingHeaders = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: port,
      path: '/process',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Only pass correlation/business headers; let OneAgent inject tracing headers
        'x-correlation-id': incomingHeaders['x-correlation-id'] || payload.correlationId
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
    const payloadString = JSON.stringify(payload);
    console.log(`[journey-sim] Sending to ${stepName}:`, payloadString);
    req.write(payloadString);
    req.end();
  });
}

// Simulate journey
router.post('/simulate-journey', async (req, res) => {
  console.log('[journey-sim] Route handler called with body:', JSON.stringify(req.body, null, 2));
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
        stepData = stepsArray.slice(0, 6).map(step => {
          // Extract step name from various AI response formats
          const stepName = step.stepName || step.name || step.step || step.title || 'UnknownStep';
          
          // Generate dynamic service name based on AI response details
          let serviceName = step.serviceName;
          if (!serviceName) {
            // Try to extract service name from description, action, or other fields
            const description = step.description || step.action || step.summary || '';
            const category = step.category || step.type || step.phase || '';
            
            // Create intelligent service name based on available data
            serviceName = generateDynamicServiceName(stepName, description, category, step);
          }
          
          return {
            stepName,
            serviceName,
            description: step.description || '',
            category: step.category || step.type || '',
            originalStep: step // Keep original for reference
          };
        });
        console.log('[journey-sim] Extracted dynamic stepData:', stepData);
      } else {
        stepData = DEFAULT_JOURNEY_STEPS.map(name => ({ 
          stepName: name, 
          serviceName: null,
          description: '',
          category: ''
        }));
        console.log('[journey-sim] Using default steps');
      }
    } catch (error) {
      console.error('[journey-sim] Error extracting step data:', error.message);
      stepData = DEFAULT_JOURNEY_STEPS.map(name => ({ stepName: name, serviceName: null }));
    }
    
    // Extract tracing headers once at the beginning for use throughout the journey
    const tracingHeaders = extractTracingHeaders(req);
    
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
    
    for (const stepInfo of stepData) {
      const { stepName, serviceName, description, category } = stepInfo;
      ensureServiceRunning(stepName, { 
        ...companyContext, 
        stepName, 
        serviceName,
        description,
        category,
        type: category
      });
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
      
      console.log(`[journey-sim] [chained] Payload for first service:`, JSON.stringify(payload, null, 2));
      
      const chainedResult = await callDynamicService(first.stepName, firstPort, payload, { 'x-correlation-id': correlationId, ...tracingHeaders });
      
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
          }, { 'x-correlation-id': correlationId, ...tracingHeaders });
          
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
