/**
 * Dynamic Step Service - Creates services with proper Dynatrace identification
 * This service dynamically adapts its identity based on the step name provided
 */
const { createService } = require('./service-runner.cjs');
const { callService, getServiceNameFromStep, getServicePortFromStep } = require('./child-caller.cjs');
const http = require('http');

// Wait for a service health endpoint to respond on the given port
function waitForServiceReady(port, timeout = 5000) {
  return new Promise((resolve) => {
    const start = Date.now();
    function check() {
      const req = http.request({ hostname: '127.0.0.1', port, path: '/health', method: 'GET', timeout: 1000 }, (res) => {
        resolve(true);
      });
      req.on('error', () => {
        if (Date.now() - start < timeout) setTimeout(check, 150); else resolve(false);
      });
      req.on('timeout', () => { req.destroy(); if (Date.now() - start < timeout) setTimeout(check, 150); else resolve(false); });
      req.end();
    }
    check();
  });
}

// Get service name from command line arguments or environment
const serviceNameArg = process.argv.find((arg, index) => process.argv[index - 1] === '--service-name');
const serviceName = serviceNameArg || process.env.SERVICE_NAME;
const stepName = process.env.STEP_NAME;

// CRITICAL: Set process title immediately for Dynatrace detection
// This is what Dynatrace uses to identify the service
if (serviceName) {
  try {
    process.title = serviceName;
    // Also set argv[0] to the service name - this is crucial for Dynatrace
    if (process.argv && process.argv.length > 0) {
      process.argv[0] = serviceName;
    }
    // Strengthen Dynatrace identification with comprehensive env vars
    process.env.DT_SERVICE_NAME = serviceName;
    process.env.DYNATRACE_SERVICE_NAME = serviceName;
    process.env.DT_LOGICAL_SERVICE_NAME = serviceName;
    process.env.DT_PROCESS_GROUP_NAME = serviceName;
    process.env.DT_PROCESS_GROUP_INSTANCE = `${serviceName}-${process.env.PORT || ''}`;
    process.env.DT_APPLICATION_NAME = 'BizObs-CustomerJourney';
    process.env.DT_CLUSTER_ID = serviceName;
    process.env.DT_NODE_ID = `${serviceName}-node`;
    console.log(`[dynamic-step-service] Set process identity to: ${serviceName}`);
  } catch (e) {
    console.error(`[dynamic-step-service] Failed to set process identity: ${e.message}`);
  }
}

// Generic step service that can handle any step name dynamically
function createStepService(serviceName, stepName) {
  // Convert stepName to proper service format if needed
  const properServiceName = getServiceNameFromStep(stepName || serviceName);
  
  createService(properServiceName, (app) => {
    app.post('/process', async (req, res) => {
      const payload = req.body || {};
      const correlationId = req.correlationId;
      const thinkTimeMs = Number(payload.thinkTimeMs || 200);
      const currentStepName = payload.stepName || stepName;
      // --- Trace logic ---
      const crypto = require('crypto');
      // Use existing traceId or generate new
      const traceId = payload.traceId || crypto.randomBytes(8).toString('hex');
      // Use parentSpanId from payload, or null for first
      const parentSpanId = payload.spanId || null;
      // Always generate a new spanId for this service
      const spanId = crypto.randomBytes(4).toString('hex');
      // Build/extend trace array
      const trace = Array.isArray(payload.trace) ? [...payload.trace] : [];
      trace.push({ traceId, spanId, parentSpanId, stepName: currentStepName });

      // Log service processing
      console.log(`[${properServiceName}] Processing step with payload:`, JSON.stringify(payload, null, 2));
      console.log(`[${properServiceName}] Current step name: ${currentStepName}`);
      console.log(`[${properServiceName}] Steps array:`, payload.steps);
      console.log(`[${properServiceName}] Trace so far:`, JSON.stringify(trace));

      // Simulate processing with realistic timing
      const processingTime = Math.floor(Math.random() * 200) + 100; // 100-300ms

      const finish = async () => {
        // Generate dynamic metadata based on step name
        const metadata = generateStepMetadata(currentStepName);

        let response = {
          // Spread payload first so our computed fields below take precedence
          ...payload,
          stepName: currentStepName,
          service: properServiceName,
          status: 'completed',
          correlationId,
          processingTime,
          pid: process.pid,
          timestamp: new Date().toISOString(),
          metadata,
          traceId,
          spanId,
          parentSpanId,
          trace
        };


        // --- Chaining logic ---
        let nextStepName = null;
        let nextServiceName = undefined;
        if (payload.steps && Array.isArray(payload.steps)) {
          const currentIndex = payload.steps.findIndex(s =>
            (s.stepName === currentStepName) ||
            (s.name === currentStepName) ||
            (s.serviceName === properServiceName)
          );
          if (currentIndex >= 0 && currentIndex < payload.steps.length - 1) {
            const nextStep = payload.steps[currentIndex + 1];
            nextStepName = nextStep ? (nextStep.stepName || nextStep.name) : null;
            nextServiceName = nextStep && nextStep.serviceName ? nextStep.serviceName : (nextStepName ? getServiceNameFromStep(nextStepName) : undefined);
          } else {
            nextStepName = null;
            nextServiceName = undefined;
          }
        }

        if (nextStepName && nextServiceName) {
          try {
            await new Promise(r => setTimeout(r, thinkTimeMs));
            // Ask main server to ensure next service is running (in case it wasn't pre-started)
            try {
              const adminPort = process.env.MAIN_SERVER_PORT || '4000';
              await new Promise((resolve) => {
                const req = http.request({ hostname: '127.0.0.1', port: adminPort, path: '/api/admin/ensure-service', method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => { res.resume(); resolve(); });
                req.on('error', () => resolve());
                req.end(JSON.stringify({ stepName: nextStepName, serviceName: nextServiceName }));
              });
            } catch {}
            const nextPayload = {
              ...payload,
              stepName: nextStepName,
              serviceName: nextServiceName,
              action: 'auto_chained',
              parentStep: currentStepName,
              correlationId,
              journeyId: payload.journeyId,
              domain: payload.domain,
              companyName: payload.companyName,
              thinkTimeMs,
              steps: payload.steps,
              traceId,
              spanId, // pass as parentSpanId to next
              trace
            };
            const traceHeaders = { 'x-correlation-id': correlationId };
            // Always use serviceName for port mapping
            const { getServicePortFromStep } = require('./child-caller.cjs');
            const nextPort = getServicePortFromStep(nextServiceName);
            // Ensure next service is listening before calling
            await waitForServiceReady(nextPort, 5000);
            const next = await callService(nextServiceName, nextPayload, traceHeaders, nextPort);
            // Bubble up the full downstream trace to the current response; ensure our own span is included once
            if (next && Array.isArray(next.trace)) {
              const last = next.trace[next.trace.length - 1];
              // If our span isn't the last, append ours before adopting
              const hasCurrent = next.trace.some(s => s.spanId === spanId);
              response.trace = hasCurrent ? next.trace : [...next.trace, { traceId, spanId, parentSpanId, stepName: currentStepName }];
            }
            response.next = next;
          } catch (e) {
            response.nextError = e.message;
            console.error(`[${properServiceName}] Error calling next service:`, e.message);
          }
        }

        res.json(response);
      };

      setTimeout(finish, processingTime);
    });
  });
}

// Generate dynamic metadata based on step name
function generateStepMetadata(stepName) {
  const lowerStep = stepName.toLowerCase();
  
  // Discovery/Exploration type steps
  if (lowerStep.includes('discover') || lowerStep.includes('explor')) {
    return {
      itemsDiscovered: Math.floor(Math.random() * 100) + 50,
      touchpointsAnalyzed: Math.floor(Math.random() * 20) + 10,
      dataSourcesConnected: Math.floor(Math.random() * 5) + 3
    };
  }
  
  // Awareness/Marketing type steps
  if (lowerStep.includes('aware') || lowerStep.includes('market')) {
    return {
      impressionsGenerated: Math.floor(Math.random() * 10000) + 5000,
      channelsActivated: Math.floor(Math.random() * 8) + 4,
      audienceReach: Math.floor(Math.random() * 50000) + 25000
    };
  }
  
  // Consideration/Selection type steps
  if (lowerStep.includes('consider') || lowerStep.includes('select') || lowerStep.includes('evaluat')) {
    return {
      optionsEvaluated: Math.floor(Math.random() * 15) + 5,
      comparisonsMade: Math.floor(Math.random() * 8) + 3,
      criteriaAnalyzed: Math.floor(Math.random() * 20) + 10
    };
  }
  
  // Purchase/Process/Transaction type steps
  if (lowerStep.includes('purchase') || lowerStep.includes('process') || lowerStep.includes('transaction') || lowerStep.includes('start')) {
    return {
      transactionValue: Math.floor(Math.random() * 1000) + 100,
      processingMethod: ['automated', 'manual', 'hybrid'][Math.floor(Math.random() * 3)],
      conversionRate: (Math.random() * 0.05 + 0.02).toFixed(3)
    };
  }
  
  // Completion/Retention type steps
  if (lowerStep.includes('complet') || lowerStep.includes('retain') || lowerStep.includes('finish')) {
    return {
      completionRate: (Math.random() * 0.3 + 0.6).toFixed(3),
      satisfactionScore: (Math.random() * 2 + 8).toFixed(1),
      issuesResolved: Math.floor(Math.random() * 5)
    };
  }
  
  // PostProcess/Advocacy type steps
  if (lowerStep.includes('post') || lowerStep.includes('advocacy') || lowerStep.includes('follow')) {
    return {
      followUpActions: Math.floor(Math.random() * 10) + 2,
      referralsGenerated: Math.floor(Math.random() * 8) + 1,
      engagementScore: Math.floor(Math.random() * 4) + 7
    };
  }
  
  // Generic fallback
  return {
    itemsProcessed: Math.floor(Math.random() * 50) + 20,
    processingEfficiency: (Math.random() * 0.2 + 0.8).toFixed(3),
    qualityScore: (Math.random() * 2 + 8).toFixed(1)
  };
}

module.exports = { createStepService };

// Auto-start the service when this file is run directly
if (require.main === module) {
  // Get service name from command line arguments or environment
  const serviceNameArg = process.argv.find((arg, index) => process.argv[index - 1] === '--service-name');
  const serviceName = serviceNameArg || process.env.SERVICE_NAME || 'DynamicService';
  const stepName = process.env.STEP_NAME || 'DefaultStep';
  
  // Set process title immediately for Dynatrace detection
  try {
    process.title = serviceName;
    console.log(`[dynamic-step-service] Set process title to: ${serviceName}`);
  } catch (e) {
    console.error(`[dynamic-step-service] Failed to set process title: ${e.message}`);
  }
  
  console.log(`[dynamic-step-service] Starting service: ${serviceName} for step: ${stepName}`);
  createStepService(serviceName, stepName);
}