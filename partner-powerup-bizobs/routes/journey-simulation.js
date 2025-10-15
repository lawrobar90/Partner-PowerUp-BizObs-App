import express from 'express';
import http from 'http';
import crypto, { randomBytes } from 'crypto';
import { ensureServiceRunning, getServicePort, getServiceNameFromStep } from '../services/service-manager.js';

const router = express.Router();

// Default journey steps
const DEFAULT_JOURNEY_STEPS = [
  'Discovery', 'Awareness', 'Consideration', 'Purchase', 'Retention', 'Advocacy'
];

// Helper to infer a domain if missing
  function inferDomain(obj) {
    const d = obj?.domain || obj?.website || obj?.companyDomain || '';
    if (d)
      return d;
    const name = (obj?.companyName || 'default').toLowerCase().replace(/\s+/g, '');
    return `${name}.com`;
}

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

// --- Customer-specific error profiles and helpers ---
const CUSTOMER_ERROR_PROFILES = {
  'acme corp': {
    errorRate: 0.15,
    errorTypes: ['payment_gateway_timeout', 'inventory_service_down', 'authentication_failure'],
    httpErrors: [500, 503, 429],
    problematicSteps: ['checkout', 'payment', 'order confirmation']
  },
  'globex corporation': {
    errorRate: 0.25,
    errorTypes: ['database_connection_lost', 'third_party_api_failure', 'rate_limit_exceeded'],
    httpErrors: [500, 502, 503, 429],
    problematicSteps: ['product selection', 'cart', 'verification']
  },
  'initech': {
    errorRate: 0.08,
    errorTypes: ['session_timeout', 'validation_error', 'temporary_service_unavailable'],
    httpErrors: [408, 422, 503],
    problematicSteps: ['discovery', 'application', 'login']
  },
  'stark industries': {
    errorRate: 0.05,
    errorTypes: ['minor_validation_warning', 'cache_miss'],
    httpErrors: [422, 404],
    problematicSteps: ['customization']
  },
  'umbrella corporation': {
    errorRate: 0.35,
    errorTypes: ['security_breach_detected', 'system_contamination', 'containment_failure', 'biohazard_alert'],
    httpErrors: [500, 503, 502],
    problematicSteps: ['verification', 'security', 'data processing', 'confirmation']
  },
  'default': {
    errorRate: 0.12,
    errorTypes: ['network_timeout', 'service_unavailable', 'validation_failed'],
    httpErrors: [500, 503, 422],
    problematicSteps: ['checkout', 'verification']
  }
};

function generateErrorMessage(errorType, stepName) {
  const messages = {
    payment_gateway_timeout: `Payment gateway timeout during ${stepName}`,
    inventory_service_down: `Inventory service unavailable for ${stepName}`,
    authentication_failure: `Authentication failed during ${stepName}`,
    database_connection_lost: `Database connection lost while processing ${stepName}`,
    third_party_api_failure: `Third-party API failure in ${stepName}`,
    rate_limit_exceeded: `Rate limit exceeded for ${stepName}`,
    session_timeout: `Session expired during ${stepName}`,
    validation_error: `Validation error during ${stepName}`,
    temporary_service_unavailable: `Service temporarily unavailable for ${stepName}`,
    minor_validation_warning: `Minor validation issue during ${stepName}`,
    cache_miss: `Cache miss in ${stepName}`,
    security_breach_detected: `SECURITY ALERT during ${stepName}`,
    system_contamination: `System contamination in ${stepName}`,
    containment_failure: `Containment failure during ${stepName}`,
    biohazard_alert: `Biohazard alert in ${stepName}`,
    network_timeout: `Network timeout during ${stepName}`,
    service_unavailable: `Service unavailable for ${stepName}`,
    validation_failed: `Validation failed in ${stepName}`
  };
  return messages[errorType] || `Unknown error in ${stepName}`;
}

function computeCustomerError(customerName, stepName) {
  const key = String(customerName || '').toLowerCase().trim();
  const profile = CUSTOMER_ERROR_PROFILES[key] || CUSTOMER_ERROR_PROFILES.default;
  const isProblematic = profile.problematicSteps.some(s =>
    String(stepName || '').toLowerCase().includes(s)
  );
  const effectiveRate = Math.min(0.95, profile.errorRate * (isProblematic ? 1.5 : 1));
  if (Math.random() < effectiveRate) {
    const errorType = profile.errorTypes[Math.floor(Math.random() * profile.errorTypes.length)];
    const httpStatus = profile.httpErrors[Math.floor(Math.random() * profile.httpErrors.length)];
    return {
      hasError: true,
      errorType,
      httpStatus,
      errorMessage: generateErrorMessage(errorType, stepName),
      retryable: httpStatus !== 400 && httpStatus !== 404 && httpStatus !== 422,
      severity: httpStatus >= 500 ? 'critical' : httpStatus >= 400 ? 'warning' : 'info'
    };
  }
  return { hasError: false };
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
    // Build outgoing headers by preserving tracing headers when present
    const headers = {
      'Content-Type': 'application/json',
      'x-correlation-id': incomingHeaders['x-correlation-id'] || payload.correlationId || ''
    };

    // Helper to ensure a valid W3C traceparent (version-00)
    function ensureTraceparent(hdrs, correlationId) {
      // If already provided, validate and return it
      if (hdrs['traceparent']) {
        const tp = hdrs['traceparent'];
        // Basic W3C traceparent validation: 00-{32hex}-{16hex}-{2hex}
        if (/^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/i.test(tp)) {
          return tp;
        }
        console.warn(`[journey-sim] Invalid traceparent format: ${tp}, generating new one`);
      }
      
      // Generate a new W3C traceparent
      try {
        const traceId = crypto.randomBytes(16).toString('hex');
        const spanId = crypto.randomBytes(8).toString('hex');
        // flags 01 = sampled
        const traceparent = `00-${traceId}-${spanId}-01`;
        console.log(`[journey-sim] Generated new traceparent: ${traceparent} (correlationId: ${correlationId})`);
        return traceparent;
      } catch (e) {
        // Fallback using timestamp + correlation ID for deterministic but unique IDs
        const timestamp = Date.now().toString(16).padStart(16, '0');
        const corrHash = correlationId ? crypto.createHash('md5').update(correlationId).digest('hex').slice(0, 16) : Math.random().toString(16).slice(2, 18).padEnd(16, '0');
        const traceId = (timestamp + corrHash).slice(0, 32);
        const spanId = Math.random().toString(16).slice(2, 18).padEnd(16, '0').slice(0, 16);
        const fallbackTraceparent = `00-${traceId}-${spanId}-01`;
        console.log(`[journey-sim] Fallback traceparent generated: ${fallbackTraceparent}`);
        return fallbackTraceparent;
      }
    }

    // Copy known tracing headers if present
    if (incomingHeaders['traceparent']) headers['traceparent'] = incomingHeaders['traceparent'];
    if (incomingHeaders['tracestate']) headers['tracestate'] = incomingHeaders['tracestate'];
    if (incomingHeaders['x-dynatrace-trace-id']) headers['x-dynatrace-trace-id'] = incomingHeaders['x-dynatrace-trace-id'];
    if (incomingHeaders['x-dynatrace-parent-span-id']) headers['x-dynatrace-parent-span-id'] = incomingHeaders['x-dynatrace-parent-span-id'];
    if (incomingHeaders['uber-trace-id']) headers['uber-trace-id'] = incomingHeaders['uber-trace-id'];

    // Ensure a traceparent exists so OneAgent and downstream services will join the trace
    if (!headers['traceparent']) {
      headers['traceparent'] = ensureTraceparent(incomingHeaders || {}, payload.correlationId);
      // also set Dynatrace header to help trace correlation (value = trace id portion)
      try {
        const tpParts = headers['traceparent'].split('-');
        if (tpParts.length >= 2 && !headers['x-dynatrace-trace-id']) headers['x-dynatrace-trace-id'] = tpParts[1];
      } catch (e) {}
    }

    console.log(`[journey-sim] Calling ${stepName} with trace headers: traceparent=${headers['traceparent']?.substring(0, 20)}...`);
    
    const options = {
      hostname: '127.0.0.1',
      port: port,
      path: '/process',
      method: 'POST',
      headers,
      timeout: 10000  // 10 second timeout
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          // Attach HTTP status for downstream logic
          parsed.httpStatus = res.statusCode;
          // Include trace validation info
          parsed._traceInfo = {
            requestTraceparent: headers['traceparent'],
            requestTracestate: headers['tracestate'],
            responseTraceparent: res.headers['traceparent'],
            requestCorrelationId: headers['x-correlation-id']
          };
          console.log(`[journey-sim] ${stepName} responded with status ${res.statusCode}, trace: ${headers['traceparent']?.substring(0, 20)}...`);
          
          // Record trace validation data for debugging
          if (typeof global.recordTraceValidation === 'function') {
            global.recordTraceValidation(stepName, headers, parsed);
          }
          
          resolve(parsed);
        } catch (e) {
          console.error(`[journey-sim] JSON parse error from ${stepName}:`, e.message, 'Body:', body);
          reject(new Error(`Invalid JSON from ${stepName}: ${body}`));
        }
      });
    });
    
    req.on('error', (err) => {
      console.error(`[journey-sim] Request error to ${stepName} on port ${port}:`, err.message);
      reject(err);
    });
    
    req.on('timeout', () => {
      console.error(`[journey-sim] Request timeout to ${stepName} on port ${port}`);
      req.destroy();
      reject(new Error(`Timeout calling ${stepName} on port ${port}`));
    });
    const payloadString = JSON.stringify(payload);
    console.log(`[journey-sim] Sending to ${stepName}:`, payloadString);
    req.write(payloadString);
    req.end();
  });
}

// Simulate journey
router.post('/simulate-journey', async (req, res) => {
  console.log('[journey-sim] Route handler called');
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
      
      console.log('[journey-sim] Checking payload structure. req.body.journey:', !!req.body.journey);
      console.log('[journey-sim] req.body.journey.steps:', !!req.body.journey?.steps);
      console.log('[journey-sim] req.body.aiJourney:', !!req.body.aiJourney);
      console.log('[journey-sim] req.body.aiJourney.steps:', !!req.body.aiJourney?.steps);
      
      if (req.body.journey?.steps && Array.isArray(req.body.journey.steps)) {
        stepsArray = req.body.journey.steps;
        console.log('[journey-sim] Using journey.steps structure');
      } else if (req.body.aiJourney?.steps && Array.isArray(req.body.aiJourney.steps)) {
        stepsArray = req.body.aiJourney.steps;
        console.log('[journey-sim] Using aiJourney.steps structure');
      }
      
      if (stepsArray) {
        console.log('[journey-sim] Raw stepsArray:', JSON.stringify(stepsArray, null, 2));
        stepData = stepsArray.slice(0, 6).map(step => {
          console.log('[journey-sim] Processing step:', JSON.stringify(step, null, 2));
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
          
          const extractedStep = {
            stepName,
            serviceName,
            description: step.description || '',
            category: step.category || step.type || '',
            estimatedDuration: step.estimatedDuration,
            businessRationale: step.businessRationale,
            timestamp: step.timestamp,
            duration: step.duration,
            substeps: step.substeps,
            originalStep: step // Keep original for reference
          };
          console.log('[journey-sim] Extracted step data:', JSON.stringify(extractedStep, null, 2));
          return extractedStep;
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
    
    // Extract company context and all business analytics details
    const currentPayload = {
      journeyId: req.body.journey?.journeyId || journeyId,
      customerId,
      correlationId,
      startTime: new Date().toISOString(),
      companyName: req.body.journey?.companyName || req.body.companyName || 'DefaultCompany',
      domain: req.body.journey?.domain || req.body.domain || 'default.com',
      industryType: req.body.journey?.industryType || req.body.industryType || 'general',
      additionalFields: req.body.journey?.additionalFields || req.body.additionalFields || {},
      customerProfile: req.body.journey?.customerProfile || req.body.customerProfile || {},
      traceMetadata: req.body.journey?.traceMetadata || req.body.traceMetadata || {},
      sources: req.body.journey?.sources || req.body.sources || [],
      provider: req.body.journey?.provider || req.body.provider || 'unknown',
      steps: req.body.journey?.steps || req.body.steps || []
    };
    
    console.log(`[journey-sim] Company: ${currentPayload.companyName}, Domain: ${currentPayload.domain}`);
    
    // Start services with company context
    const companyContext = {
      companyName: currentPayload.companyName,
      domain: currentPayload.domain,
      industryType: currentPayload.industryType
    };
    
    // Compute per-step error plans based on customer profile, with optional hints from the journey JSON
    const errorPlannedSteps = stepData.map(s => {
      // Start with customer-derived plan
      let plan = computeCustomerError(currentPayload.companyName, s.stepName);

      // Allow AI/journey JSON to provide an optional hint per step
      const hint = s.originalStep?.errorHint || s.originalStep?.errorPlan;
      if (hint && typeof hint === 'object') {
        const typeFromHint = hint.type || hint.errorType;
        const statusFromHint = hint.httpStatus || hint.status;
        const likelihood = typeof hint.likelihood === 'number' ? Math.max(0, Math.min(1, hint.likelihood)) : null;
        // force=true overrides randomness (deterministic demo)
        const forced = hint.force === true;
        const shouldFail = forced ? true : (likelihood != null ? Math.random() < likelihood : null);

        if (shouldFail === true) {
          const chosenType = typeFromHint || plan.errorType || 'service_unavailable';
          const chosenStatus = statusFromHint || plan.httpStatus || 500;
          plan = {
            hasError: true,
            errorType: chosenType,
            httpStatus: chosenStatus,
            errorMessage: generateErrorMessage(chosenType, s.stepName),
            retryable: ![400, 404, 422].includes(Number(chosenStatus)),
            severity: Number(chosenStatus) >= 500 ? 'critical' : Number(chosenStatus) >= 400 ? 'warning' : 'info'
          };
        } else if (shouldFail === false) {
          // Explicitly indicate success if hint likelihood says so
          plan = { hasError: false };
        }
      }

      return { ...s, ...plan };
    });

    for (const stepInfo of errorPlannedSteps) {
      const { stepName, serviceName, description, category } = stepInfo;
      await ensureServiceRunning(stepName, { 
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
      
      // Ensure first service is up with correct company context
      await ensureServiceRunning(first.stepName, { ...companyContext, stepName: first.stepName, serviceName: first.serviceName });
  const firstPort = getServicePort(first.stepName);
      const actualServiceName = first.serviceName || getServiceNameFromStep(first.stepName);
      
      console.log(`[journey-sim] [chained] Calling first service ${actualServiceName} on port ${firstPort}`);
      
      // Create step-specific payload for chained execution
      const firstStepInfo = errorPlannedSteps[0];
      const chainedPayload = {
        // Journey metadata
        journeyId: currentPayload.journeyId,
        customerId: currentPayload.customerId,
        correlationId: currentPayload.correlationId,
        startTime: currentPayload.startTime,
        companyName: currentPayload.companyName,
        domain: currentPayload.domain,
        industryType: currentPayload.industryType,
        
        // First step specific data
        stepName: first.stepName,
        stepIndex: 1,
        totalSteps: stepData.length,
        stepDescription: firstStepInfo.description || '',
        stepCategory: firstStepInfo.category || '',
        
        // Add Copilot duration fields for OneAgent capture
        estimatedDuration: firstStepInfo.estimatedDuration,
        businessRationale: firstStepInfo.businessRationale,
        substeps: firstStepInfo.substeps,
        estimatedDurationMs: firstStepInfo.estimatedDuration ? firstStepInfo.estimatedDuration * 60 * 1000 : null,
        
        // Chain configuration
        thinkTimeMs,
        isChained: true,
        
        // Next steps for chaining (with Copilot duration fields for OneAgent capture)
        steps: errorPlannedSteps.map((step, idx) => ({
          stepName: step.stepName,
          serviceName: step.serviceName,
          stepIndex: idx + 1,
          hasError: step.hasError,
          errorType: step.errorType,
          // Include Copilot duration fields for each step
          description: step.description,
          category: step.category,
          estimatedDuration: step.estimatedDuration,
          businessRationale: step.businessRationale,
          substeps: step.substeps
        })),
        
        // Current step's substeps
        subSteps: firstStepInfo.originalStep?.subSteps || [],
        
        // Error configuration for first step
        hasError: firstStepInfo.hasError,
        errorType: firstStepInfo.errorType,
        errorMessage: firstStepInfo.errorMessage,
        httpStatus: firstStepInfo.httpStatus,
        retryable: firstStepInfo.retryable,
        severity: firstStepInfo.severity,
        
        // Keep essential metadata
        additionalFields: currentPayload.additionalFields || {},
        customerProfile: currentPayload.customerProfile || {},
        traceMetadata: currentPayload.traceMetadata || {}
      };
      
      console.log(`[journey-sim] [chained] Step-specific payload for first service:`, JSON.stringify(chainedPayload, null, 2));
      
      const chainedResult = await callDynamicService(first.stepName, firstPort, chainedPayload, { 'x-correlation-id': correlationId, ...tracingHeaders });
      
      if (chainedResult) {
        journeyResults.push({
          ...chainedResult,
          stepNumber: 1,
          serviceName: actualServiceName
        });
      }
    } else {
      for (let i = 0; i < stepData.length; i++) {
        const stepInfo = errorPlannedSteps[i];
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
        // Ensure service is up with correct company context prior to call
        await ensureServiceRunning(stepName, { ...companyContext, stepName, serviceName });
  const servicePort = getServicePort(stepName);
        
        try {
          // Create step-specific payload with only current step data
          const stepPayload = {
            // Journey metadata
            journeyId: currentPayload.journeyId,
            customerId: currentPayload.customerId,
            correlationId: currentPayload.correlationId,
            startTime: currentPayload.startTime,
            companyName: currentPayload.companyName,
            domain: currentPayload.domain,
            industryType: currentPayload.industryType,
            
            // Current step specific data
            stepName,
            stepIndex: i + 1,
            totalSteps: stepData.length,
            stepDescription: stepInfo.description || '',
            stepCategory: stepInfo.category || '',
            
            // Add Copilot duration fields for OneAgent capture
            estimatedDuration: stepInfo.estimatedDuration,
            businessRationale: stepInfo.businessRationale,
            substeps: stepInfo.substeps,
            estimatedDurationMs: stepInfo.estimatedDuration ? stepInfo.estimatedDuration * 60 * 1000 : null,
            
            // Current step's substeps if available
            subSteps: stepInfo.originalStep?.subSteps || [],
            
            // Error configuration for current step only
            hasError: stepInfo.hasError,
            errorType: stepInfo.errorType,
            errorMessage: stepInfo.errorMessage,
            httpStatus: stepInfo.httpStatus,
            retryable: stepInfo.retryable,
            severity: stepInfo.severity,
            
            // Keep essential customer/trace metadata
            additionalFields: currentPayload.additionalFields || {},
            customerProfile: currentPayload.customerProfile || {},
            traceMetadata: currentPayload.traceMetadata || {}
          };

          const stepResult = await callDynamicService(stepName, servicePort, stepPayload, { 'x-correlation-id': correlationId, ...tracingHeaders });
          
          const isFailed = stepResult?.status === 'failed' || (stepResult?.httpStatus && stepResult.httpStatus >= 400);
          journeyResults.push({
            ...stepResult,
            stepNumber: i + 1,
            stepName,
            serviceName,
            status: isFailed ? 'failed' : (stepResult?.status || 'completed')
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
      steps: journeyResults,
      additionalFields: currentPayload.additionalFields,
      customerProfile: currentPayload.customerProfile,
      traceMetadata: currentPayload.traceMetadata,
      sources: currentPayload.sources,
      provider: currentPayload.provider
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

// Multiple customer journey simulation with detailed output
router.post('/simulate-multiple-journeys', async (req, res) => {
  console.log('[journey-sim] Multiple journeys simulation called');
  try {
    const { 
      customers = 1,
      thinkTimeMs = 250,
      aiJourney,
      journey
    } = req.body || {};

    // Use aiJourney or journey
    const journeyObj = aiJourney || journey || {};
    if (!journeyObj.steps || !Array.isArray(journeyObj.steps)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing aiJourney.steps or journey.steps array' 
      });
    }

    const results = [];
    let totalSuccessful = 0;
    let totalFailed = 0;

    console.log(`[journey-sim] Running ${customers} customer journeys`);

    for (let customerIndex = 0; customerIndex < customers; customerIndex++) {
      try {
        // Generate unique IDs for each customer
        const uniqueId = Date.now() + customerIndex;
        const journeyId = `journey_${uniqueId}`;
        const customerId = `customer_${uniqueId}`;
        const correlationId = crypto.randomUUID();

        console.log(`[journey-sim] Starting journey for customer ${customerIndex + 1}, correlationId: ${correlationId}`);

        // Prepare step data with duration fields from Copilot response
        const stepData = journeyObj.steps.slice(0, 6).map(step => {
          const stepName = step.stepName || step.name || step.step || step.title || 'UnknownStep';
          const description = step.description || step.action || step.summary || '';
          const category = step.category || step.type || step.phase || '';
          
          return {
            stepName,
            serviceName: getServiceNameFromStep(stepName),
            description,
            category,
            // Include Copilot duration fields for OneAgent capture
            estimatedDuration: step.estimatedDuration,
            businessRationale: step.businessRationale,
            substeps: step.substeps,
            originalStep: step,
            hasError: false
          };
        });

        // Simulate the journey
        const customerJourney = {
          customerIndex: customerIndex + 1,
          journeyId,
          customerId, 
          correlationId,
          stepNames: stepData.map(s => s.stepName),
          serviceNames: stepData.map(s => s.serviceName),
          steps: [],
          totalTime: 0,
          status: 'in_progress'
        };

        // Process each step in sequence
        for (let stepIndex = 0; stepIndex < stepData.length; stepIndex++) {
          const step = stepData[stepIndex];
          const stepStartTime = Date.now();

          try {
            // Ensure service is running for this step
            await ensureServiceRunning(step.stepName, journeyObj.company || 'DefaultCompany');
            const port = getServicePort(step.stepName);

            // Build payload with duration fields from Copilot response
            const payload = {
              journeyId,
              customerId,
              correlationId,
              startTime: new Date().toISOString(),
              companyName: journeyObj.company || 'DefaultCompany',
              domain: journeyObj.domain || 'default.com',
              industryType: journeyObj.industry || 'general',
              additionalFields: journeyObj.additionalFields || {},
              customerProfile: journeyObj.customerProfile || {},
              traceMetadata: journeyObj.traceMetadata || {},
              sources: journeyObj.sources || [],
              provider: journeyObj.provider || 'unknown',
              steps: stepData,
              stepName: step.stepName,
              thinkTimeMs,
              hasError: false,
              // Add duration fields from Copilot response for OneAgent capture
              estimatedDuration: step.estimatedDuration,
              businessRationale: step.businessRationale,
              category: step.category,
              substeps: step.substeps,
              // Convert estimated duration from minutes to milliseconds for processing simulation
              estimatedDurationMs: step.estimatedDuration ? step.estimatedDuration * 60 * 1000 : null
            };

            // Call the service
            const traceHeaders = {
              'traceparent': `00-${crypto.randomBytes(16).toString('hex')}-${crypto.randomBytes(8).toString('hex')}-01`,
              'x-correlation-id': correlationId
            };

            const response = await callDynamicService(step.stepName, port, payload, traceHeaders);
            const processingTime = Date.now() - stepStartTime;

            const stepResult = {
              stepName: step.stepName,
              serviceName: step.serviceName,
              processingTime,
              status: (response && response.httpStatus && response.httpStatus < 400) ? 'completed' : 'failed',
              httpStatus: response?.httpStatus || 200,
              // Include duration fields from Copilot response
              estimatedDuration: step.estimatedDuration,
              businessRationale: step.businessRationale,
              category: step.category,
              substeps: step.substeps
            };

            customerJourney.steps.push(stepResult);
            customerJourney.totalTime += processingTime;

            // Small delay between steps
            if (stepIndex < stepData.length - 1) {
              await new Promise(resolve => setTimeout(resolve, thinkTimeMs));
            }

          } catch (stepError) {
            console.error(`[journey-sim] Step ${step.stepName} failed for customer ${customerIndex + 1}:`, stepError.message);
            const processingTime = Date.now() - stepStartTime;
            
            customerJourney.steps.push({
              stepName: step.stepName,
              serviceName: step.serviceName,
              processingTime,
              status: 'failed',
              error: stepError.message,
              // Include duration fields from Copilot response even on failure
              estimatedDuration: step.estimatedDuration,
              businessRationale: step.businessRationale,
              category: step.category,
              substeps: step.substeps
            });
            customerJourney.totalTime += processingTime;
            break; // Stop processing further steps for this customer
          }
        }

        // Determine final status
        const completedSteps = customerJourney.steps.filter(s => s.status === 'completed').length;
        customerJourney.status = completedSteps === stepData.length ? 'completed' : 'failed';
        customerJourney.completedSteps = completedSteps;
        customerJourney.totalSteps = stepData.length;

        if (customerJourney.status === 'completed') {
          totalSuccessful++;
        } else {
          totalFailed++;
        }

        results.push(customerJourney);

        // Small delay between customers to avoid overwhelming services
        if (customerIndex < customers - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }

      } catch (customerError) {
        console.error(`[journey-sim] Customer ${customerIndex + 1} journey failed:`, customerError.message);
        totalFailed++;
        results.push({
          customerIndex: customerIndex + 1,
          status: 'failed',
          error: customerError.message,
          correlationId: crypto.randomUUID()
        });
      }
    }

    // Format the response with cleaner load test summary
    const summary = {
      totalCustomers: customers,
      successful: totalSuccessful,
      failed: totalFailed,
      successRate: `${((totalSuccessful / customers) * 100).toFixed(1)}%`
    };

    // Create a clean summary for successful journeys
    const successfulJourneys = results.filter(c => c.status === 'completed');
    const failedJourneys = results.filter(c => c.status === 'failed');
    
    // Get average metrics from successful journeys
    const avgSteps = successfulJourneys.length > 0 ? 
      Math.round(successfulJourneys.reduce((sum, c) => sum + c.completedSteps, 0) / successfulJourneys.length) : 0;
    const avgTime = successfulJourneys.length > 0 ? 
      Math.round(successfulJourneys.reduce((sum, c) => sum + c.totalTime, 0) / successfulJourneys.length) : 0;

    // Create representative journey example from first successful customer
    let journeyExample = null;
    if (successfulJourneys.length > 0) {
      const example = successfulJourneys[0];
      const executionSteps = example.steps.map((step, index) => 
        `${step.status === 'completed' ? '✅' : '❌'} Step ${index + 1}: ${step.serviceName} (${step.processingTime}ms)`
      ).join('\n');

      const servicesUsed = example.steps.map(step => 
        step.stepName.replace(/Service$/, '')
      ).join(' → ');

      journeyExample = {
        execution: executionSteps,
        servicesUsed: servicesUsed,
        correlationId: example.correlationId
      };
    }

    // Collect all correlation IDs
    const correlationIds = results.map(c => c.correlationId);
    
    // Collect error summary
    const errorSummary = failedJourneys.length > 0 ? 
      failedJourneys.map(f => `Customer ${f.customerIndex}: ${f.error || 'Journey incomplete'}`).slice(0, 3) : [];

    res.json({
      success: true,
      loadTestSummary: {
        customersProcessed: customers,
        successfulCustomers: totalSuccessful,
        failedCustomers: totalFailed,
        successRate: summary.successRate,
        averageCompletionTime: `${avgTime}ms`,
        averageStepsCompleted: avgSteps
      },
      correlationIds: correlationIds,
      errors: errorSummary,
      sampleJourney: journeyExample,
      detailedResults: results.map(customer => ({
        customerIndex: customer.customerIndex,
        correlationId: customer.correlationId,
        status: customer.status,
        completedSteps: customer.completedSteps,
        totalSteps: customer.totalSteps,
        totalTime: customer.totalTime
      }))
    });

  } catch (error) {
    console.error('[journey-sim] Multiple journeys simulation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;

// Batch simulate: run the 6-step chained flow for multiple customers
router.post('/simulate-batch-chained', async (req, res) => {
  try {
    const {
      customers = 10,
      thinkTimeMs = 100,
      journey,
      aiJourney,
      steps: customSteps,
      companyName: bodyCompany,
      domain: bodyDomain,
      industryType: bodyIndustry
    } = req.body || {};

    const correlationId = req.correlationId;
    // Prefer journey payload then aiJourney
    const journeyObj = journey || aiJourney || {};

    // Build step data using the same logic as /simulate-journey
    let stepData = [];
    let stepsArray = null;
    if (journeyObj?.steps && Array.isArray(journeyObj.steps)) {
      stepsArray = journeyObj.steps;
    } else if (Array.isArray(customSteps)) {
      stepsArray = customSteps;
    }
    if (stepsArray) {
      stepData = stepsArray.slice(0, 6).map(step => {
        const stepName = step.stepName || step.name || step.step || step.title || 'UnknownStep';
        const description = step.description || step.action || step.summary || '';
        const category = step.category || step.type || step.phase || '';
        return {
          stepName,
          serviceName: step.serviceName || generateDynamicServiceName(stepName, description, category, step),
          description,
          category,
          originalStep: step
        };
      });
    } else {
      stepData = DEFAULT_JOURNEY_STEPS.map(name => ({ stepName: name, serviceName: null }));
    }

    const companyName = journeyObj.companyName || bodyCompany || 'DefaultCompany';
    const domain = journeyObj.domain || bodyDomain || inferDomain(journeyObj);
    const industryType = journeyObj.industryType || bodyIndustry || 'general';

    // Compute per-step error plan
    const errorPlannedSteps = stepData.map(s => {
      const hint = s.originalStep?.errorHint || s.originalStep?.errorPlan;
      let plan = computeCustomerError(companyName, s.stepName);
      if (hint && typeof hint === 'object') {
        const typeFromHint = hint.type || hint.errorType;
        const statusFromHint = hint.httpStatus || hint.status;
        const likelihood = typeof hint.likelihood === 'number' ? Math.max(0, Math.min(1, hint.likelihood)) : null;
        const forced = hint.force === true;
        const shouldFail = forced ? true : (likelihood != null ? Math.random() < likelihood : null);
        if (shouldFail === true) {
          const chosenType = typeFromHint || plan.errorType || 'service_unavailable';
          const chosenStatus = statusFromHint || plan.httpStatus || 500;
          plan = {
            hasError: true,
            errorType: chosenType,
            httpStatus: chosenStatus,
            errorMessage: generateErrorMessage(chosenType, s.stepName),
            retryable: ![400, 404, 422].includes(Number(chosenStatus)),
            severity: Number(chosenStatus) >= 500 ? 'critical' : Number(chosenStatus) >= 400 ? 'warning' : 'info'
          };
        } else if (shouldFail === false) {
          plan = { hasError: false };
        }
      }
      return { ...s, ...plan };
    });

    // Ensure services running with correct context
    for (const s of errorPlannedSteps) {
      await ensureServiceRunning(s.stepName, { companyName, domain, industryType, stepName: s.stepName, serviceName: s.serviceName, description: s.description, category: s.category });
    }

    // Give time to boot
    await new Promise(r => setTimeout(r, 1000));

    let completed = 0;
    let failed = 0;
    const results = [];

    // Identify first step and its port
    const first = errorPlannedSteps[0];
    const firstPort = getServicePort(first.stepName);

    for (let i = 0; i < Number(customers || 0); i++) {
      try {
        const payload = {
          companyName,
          domain,
          industryType,
          correlationId,
          stepName: first.stepName,
          thinkTimeMs,
          steps: errorPlannedSteps,
          additionalFields: journeyObj.additionalFields || {},
          customerProfile: journeyObj.customerProfile || {},
          traceMetadata: journeyObj.traceMetadata || {},
          sources: journeyObj.sources || [],
          provider: journeyObj.provider || 'unknown'
        };
        const r = await callDynamicService(first.stepName, firstPort, payload, { 'x-correlation-id': correlationId });
        const isFailed = r?.status === 'failed' || (r?.httpStatus && r.httpStatus >= 400);
        if (isFailed) failed++; else completed++;
        if (i < 5) results.push({ index: i + 1, status: isFailed ? 'failed' : 'completed', service: first.serviceName, httpStatus: r?.httpStatus, error: r?.error });
      } catch (e) {
        failed++;
        if (i < 5) results.push({ index: i + 1, status: 'failed', error: e.message });
      }
      // Small delay to avoid thundering herd, optional
      await new Promise(r => setTimeout(r, 10));
    }

    res.json({ ok: true, summary: { customers: Number(customers), completed, failed }, sample: results });
  } catch (e) {
    console.error('[journey-sim] simulate-batch-chained error:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});
