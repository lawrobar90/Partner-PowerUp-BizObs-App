/**
 * Dynamic Step Service - Creates services with proper Dynatrace identification
 * This service dynamically adapts its identity based on the step name provided
 */
const { createService } = require('./service-runner.cjs');
const { callService, getServiceNameFromStep, getServicePortFromStep } = require('./child-caller.cjs');

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

      // Log service processing
      console.log(`[${properServiceName}] Processing step with payload:`, JSON.stringify(payload, null, 2));
      console.log(`[${properServiceName}] Current step name: ${currentStepName}`);
      console.log(`[${properServiceName}] Steps array:`, payload.steps);

      // Simulate processing with realistic timing
      const processingTime = Math.floor(Math.random() * 200) + 100; // 100-300ms
      
      const finish = async () => {
        // Generate dynamic metadata based on step name
        const metadata = generateStepMetadata(currentStepName);
        
        const response = {
          stepName: currentStepName,
          service: properServiceName, // Use properly formatted service name for Dynatrace
          status: 'completed',
          correlationId,
          processingTime,
          pid: process.pid,
          timestamp: new Date().toISOString(),
          metadata,
          ...payload
        };
        
        console.log(`[${properServiceName}] Completed processing in ${processingTime}ms`);

        // Dynamic chaining to next service (prefer exact serviceName from payload if provided)
        let nextStepName = payload.nextStepName;
        let nextServiceName;
        if ((!nextStepName || !nextServiceName) && payload.steps && Array.isArray(payload.steps)) {
          // Find current step and get the next one
          const currentIndex = payload.steps.findIndex(s => 
            (s.stepName === currentStepName) || 
            (s.name === currentStepName) ||
            (getServiceNameFromStep(s.stepName || s.name) === properServiceName)
          );
          console.log(`[${properServiceName}] Current step index: ${currentIndex}, looking for: ${currentStepName}`);
          console.log(`[${properServiceName}] Available steps:`, payload.steps.map(s => s.stepName || s.name));
          
          if (currentIndex >= 0 && currentIndex < payload.steps.length - 1) {
            const nextStep = payload.steps[currentIndex + 1];
            nextStepName = nextStep ? (nextStep.stepName || nextStep.name) : null;
            // IMPORTANT: prefer exact serviceName from payload when provided
            nextServiceName = nextStep && nextStep.serviceName ? nextStep.serviceName : (nextStepName ? getServiceNameFromStep(nextStepName) : undefined);
            console.log(`[${properServiceName}] Found next step: ${nextStepName} -> service: ${nextServiceName}`);
          }
        }
        
        if (nextStepName) {
          // nextServiceName already computed above (prefers payload's serviceName). Fallback for safety:
          nextServiceName = nextServiceName || getServiceNameFromStep(nextStepName);
          
          try {
            // Simulate user think time before next step
            await new Promise(r => setTimeout(r, thinkTimeMs));
            const nextPayload = {
              ...payload, // Inherit all original payload properties
              stepName: nextStepName,
              action: 'auto_chained',
              parentStep: currentStepName,
              correlationId,
              journeyId: payload.journeyId,
              domain: payload.domain,
              companyName: payload.companyName,
              thinkTimeMs,
              steps: payload.steps
            };
            
            // Extract and propagate all Dynatrace tracing headers for trace continuity
            const traceHeaders = {
              'x-correlation-id': correlationId
            };
            
            // Extract all potential Dynatrace and tracing headers from incoming request
            const headerKeys = Object.keys(req.headers || {});
            for (const key of headerKeys) {
              const lowerKey = key.toLowerCase();
              // Capture Dynatrace, W3C Trace Context, and other distributed tracing headers
              if (lowerKey.startsWith('x-dynatrace') || 
                  lowerKey.startsWith('traceparent') || 
                  lowerKey.startsWith('tracestate') || 
                  lowerKey.startsWith('x-trace') || 
                  lowerKey.startsWith('x-request-id') || 
                  lowerKey.startsWith('x-span-id') || 
                  lowerKey.startsWith('dt-') ||
                  lowerKey.startsWith('uber-trace-id')) {
                traceHeaders[key] = req.headers[key];
              }
            }
            
            const next = await callService(nextServiceName, nextPayload, traceHeaders);
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