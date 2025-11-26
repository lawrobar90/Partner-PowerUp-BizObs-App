/**
 * Dynamic Step Service - Creates services with proper Dynatrace identification
 * This service dynamically adapts its identity based on the step name provided
 */
const { createService } = require('./service-runner.cjs');
const { callService, getServiceNameFromStep, getServicePortFromStep } = require('./child-caller.cjs');
const { 
  TracedError, 
  withErrorTracking, 
  errorHandlingMiddleware,
  checkForStepError, 
  markSpanAsFailed, 
  reportError,
  sendErrorEvent,
  addCustomAttributes 
} = require('./dynatrace-error-helper.cjs');
const http = require('http');
const crypto = require('crypto');

// Enhanced Dynatrace helpers with error tracking
const withCustomSpan = (name, callback) => {
  console.log('[dynatrace] Custom span:', name);
  return withErrorTracking(name, callback)();
};

const sendBusinessEvent = (eventType, data) => {
  console.log('[dynatrace] Business event:', eventType, data);
  
  // Business events not needed - OneAgent captures flattened rqBody automatically
  console.log('[dynatrace] OneAgent will capture flattened request structure for:', eventType);
  
  // Log flattened fields separately so they appear in logs as individual entries
  Object.keys(flattenedData).forEach(key => {
    if (key.startsWith('additional.') || key.startsWith('customer.') || key.startsWith('business.') || key.startsWith('trace.')) {
      console.log(`[bizevent-field] ${key}=${flattenedData[key]}`);
    }
  });
  
  // Make a lightweight HTTP call to an internal endpoint with flattened data as headers
  // This will be captured by OneAgent as a separate HTTP request with flattened fields
  try {
    const mainServerPort = process.env.MAIN_SERVER_PORT || '4000';
    const flattenedHeaders = {};
    
    // Add flattened fields as HTTP headers (OneAgent will capture these)
    Object.keys(flattenedData).forEach(key => {
      if (key.startsWith('additional.') || key.startsWith('customer.') || key.startsWith('business.') || key.startsWith('trace.')) {
        // HTTP headers can't have dots, so replace with dashes
        const headerKey = `x-biz-${key.replace(/\./g, '-')}`;
        const headerValue = String(flattenedData[key]).substring(0, 100); // Limit header length
        flattenedHeaders[headerKey] = headerValue;
      }
    });
    
    // Add core business event metadata
    flattenedHeaders['x-biz-event-type'] = eventType;
    flattenedHeaders['x-biz-correlation-id'] = flattenedData.correlationId || '';
    flattenedHeaders['x-biz-step-name'] = flattenedData.stepName || '';
    flattenedHeaders['x-biz-company'] = flattenedData.company || '';
    
    const postData = JSON.stringify(flattenedData);
    const options = {
      hostname: '127.0.0.1',
      port: mainServerPort,
      path: '/api/internal/bizevent',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...flattenedHeaders
      },
      timeout: 1000
    };
    
    const req = http.request(options, (res) => {
      // Consume response to complete the request
      res.on('data', () => {});
      res.on('end', () => {
        console.log(`[dynatrace] Business event HTTP call completed: ${res.statusCode}`);
      });
    });
    
    req.on('error', (err) => {
      // Ignore errors - this is just for OneAgent capture
      console.log(`[dynatrace] Business event HTTP call failed (expected): ${err.message}`);
    });
    
    req.on('timeout', () => {
      req.destroy();
    });
    
    req.write(postData);
    req.end();
    
  } catch (err) {
    // Ignore errors in business event HTTP call
    console.log(`[dynatrace] Business event HTTP call error (expected): ${err.message}`);
  }
};

// Old flattening function removed - using ultra-simple flattening in request processing instead// Wait for a service health endpoint to respond on the given port
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
    // Add error handling middleware
    app.use(errorHandlingMiddleware(properServiceName));
    
    app.post('/process', async (req, res) => {
      const payload = req.body || {};
      const correlationId = req.correlationId;
      const thinkTimeMs = Number(payload.thinkTimeMs || 200);
      const currentStepName = payload.stepName || stepName;
      
      // Process payload to ensure single values for arrays (no flattening, just array simplification)
      const processedPayload = { ...payload };
      
      console.log(`[${properServiceName}] Processing payload with ${Object.keys(processedPayload).length} fields`);
      
      // The payload should already be simplified from journey-simulation.js
      // We'll just ensure any remaining arrays are converted to single values
      function simplifyArraysInObject(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        
        const simplified = {};
        Object.keys(obj).forEach(key => {
          const value = obj[key];
          if (Array.isArray(value) && value.length > 0) {
            // Pick ONE random item from any array
            const randomIndex = Math.floor(Math.random() * value.length);
            simplified[key] = value[randomIndex];
          } else if (typeof value === 'object' && value !== null) {
            // Recursively simplify nested objects
            simplified[key] = simplifyArraysInObject(value);
          } else {
            simplified[key] = value;
          }
        });
        return simplified;
      }
      
      // Simplify any remaining arrays in nested objects
      if (processedPayload.additionalFields) {
        processedPayload.additionalFields = simplifyArraysInObject(processedPayload.additionalFields);
        console.log(`[${properServiceName}] Simplified arrays in additionalFields`);
      }
      
      if (processedPayload.customerProfile) {
        processedPayload.customerProfile = simplifyArraysInObject(processedPayload.customerProfile);
        console.log(`[${properServiceName}] Simplified arrays in customerProfile`);
      }
      
      if (processedPayload.traceMetadata) {
        processedPayload.traceMetadata = simplifyArraysInObject(processedPayload.traceMetadata);
        console.log(`[${properServiceName}] Simplified arrays in traceMetadata`);
      }
      
      // Update the request body with the processed payload
      req.body = processedPayload;
      
      try {
        // Check for step errors first (both explicit and simulated)
        const stepError = checkForStepError(payload, null); // You can pass error profile here
        if (stepError) {
          console.error(`[${properServiceName}] Step error detected:`, stepError.message);
          throw stepError;
        }
        
        // Extract trace context from incoming request headers
        const incomingTraceParent = req.headers['traceparent'];
        const incomingTraceState = req.headers['tracestate'];
        const dynatraceTraceId = req.headers['x-dynatrace-trace-id'];
        
        // Generate trace IDs for distributed tracing
        function generateUUID() {
          return crypto.randomUUID();
        }
        
        let traceId, parentSpanId;
        
        if (incomingTraceParent) {
          // Parse W3C traceparent: 00-trace_id-parent_id-flags
          const parts = incomingTraceParent.split('-');
          if (parts.length === 4) {
            traceId = parts[1];
            parentSpanId = parts[2];
            console.log(`[${properServiceName}] Using incoming trace context: ${traceId.substring(0,8)}...`);
          }
        } else if (dynatraceTraceId) {
          traceId = dynatraceTraceId;
          parentSpanId = req.headers['x-dynatrace-parent-span-id'];
          console.log(`[${properServiceName}] Using Dynatrace trace context: ${traceId.substring(0,8)}...`);
        }
        
        // Fallback to payload or generate new
        if (!traceId) {
          traceId = payload.traceId || generateUUID().replace(/-/g, '');
          parentSpanId = payload.spanId || null;
        }
        
        const spanId = generateUUID().slice(0, 16).replace(/-/g, '');
        
        console.log(`[${properServiceName}] Trace context: traceId=${traceId.substring(0,8)}..., spanId=${spanId.substring(0,8)}..., parentSpanId=${parentSpanId ? parentSpanId.substring(0,8) + '...' : 'none'}`);
        
        // --- OneAgent Distributed Tracing Integration ---
        // Let OneAgent handle trace/span propagation automatically
        // Store journey context for business observability
        const journeyTrace = Array.isArray(payload.journeyTrace) ? [...payload.journeyTrace] : [];
        const stepEntry = {
          stepName: currentStepName,
          serviceName: properServiceName,
          timestamp: new Date().toISOString(),
          correlationId,
          success: true, // Will be updated if error occurs
          traceId: traceId.substring(0,8) + '...',
          spanId: spanId.substring(0,8) + '...'
        };
        journeyTrace.push(stepEntry);

      // Look up current step's data from the journey steps array for chained execution
      let currentStepData = null;
      if (payload.steps && Array.isArray(payload.steps)) {
        console.log(`[${properServiceName}] Looking for step data for: ${currentStepName}, Available steps:`, payload.steps.map(s => s.stepName || s.name));
        currentStepData = payload.steps.find(step => 
          step.stepName === currentStepName || 
          step.name === currentStepName ||
          step.serviceName === properServiceName
        );
        console.log(`[${properServiceName}] Found step data:`, currentStepData ? 'YES' : 'NO');
        if (currentStepData) {
          console.log(`[${properServiceName}] Step data details:`, JSON.stringify(currentStepData, null, 2));
        }
      } else {
        console.log(`[${properServiceName}] No steps array in payload`);
      }
      
      // Use step-specific data if found, otherwise use payload defaults
      const stepDescription = currentStepData?.description || payload.stepDescription || '';
      const stepCategory = currentStepData?.category || payload.stepCategory || '';
      const estimatedDuration = currentStepData?.estimatedDuration || payload.estimatedDuration;
      const businessRationale = currentStepData?.businessRationale || payload.businessRationale;
      const substeps = currentStepData?.substeps || payload.substeps;

      // Log service processing with step-specific details
      console.log(`[${properServiceName}] Processing step with payload:`, JSON.stringify({
        stepName: payload.stepName,
        stepIndex: payload.stepIndex,
        totalSteps: payload.totalSteps,
        stepDescription: stepDescription,
        stepCategory: stepCategory,
        subSteps: payload.subSteps,
        hasError: payload.hasError,
        errorType: payload.errorType,
        companyName: payload.companyName,
        domain: payload.domain,
        industryType: payload.industryType,
        correlationId: payload.correlationId,
        // Include Copilot duration fields for OneAgent capture (step-specific)
        estimatedDuration: estimatedDuration,
        businessRationale: businessRationale,
        category: stepCategory,
        substeps: substeps,
        estimatedDurationMs: payload.estimatedDurationMs
      }, null, 2));
      console.log(`[${properServiceName}] Current step name: ${currentStepName}`);
      console.log(`[${properServiceName}] Step-specific substeps:`, payload.subSteps || []);
      console.log(`[${properServiceName}] Journey trace so far:`, JSON.stringify(journeyTrace));

      // Simulate processing with realistic timing
      const processingTime = Math.floor(Math.random() * 200) + 100; // 100-300ms

      const finish = async () => {
        // Generate dynamic metadata based on step name
        const metadata = generateStepMetadata(currentStepName);

        // Add custom attributes to OneAgent span (simplified)
        const customAttributes = {
          'journey.step': currentStepName,
          'journey.service': properServiceName,
          'journey.correlationId': correlationId,
          'journey.company': processedPayload.companyName || 'unknown',
          'journey.domain': processedPayload.domain || 'unknown',
          'journey.industryType': processedPayload.industryType || 'unknown',
          'journey.processingTime': processingTime
        };
        
        addCustomAttributes(customAttributes);

        // No complex business event API calls needed - OneAgent captures the flattened rqBody automatically
        console.log(`[${properServiceName}] Step completed - OneAgent will capture flattened request body`);

        let response = {
          // Include the clean processed payload without duplication
          ...processedPayload,
          stepName: currentStepName,
          service: properServiceName,
          status: 'completed',
          correlationId,
          processingTime,
          pid: process.pid,
          timestamp: new Date().toISOString(),
          // Include step-specific duration fields from the current step data
          stepDescription: stepDescription,
          stepCategory: stepCategory,
          estimatedDuration: estimatedDuration,
          businessRationale: businessRationale,
          duration: processedPayload.duration,
          substeps: substeps,
          metadata,
          journeyTrace
        };

        // No flattened fields duplication - the processedPayload already contains clean data

        // Include incoming trace headers in the response for validation (non-invasive)
        try {
          response.traceparent = incomingTraceParent || null;
          response.tracestate = incomingTraceState || null;
          response.x_dynatrace_trace_id = dynatraceTraceId || null;
          response.x_dynatrace_parent_span_id = req.headers['x-dynatrace-parent-span-id'] || null;
        } catch (e) {}


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
                req.end(JSON.stringify({ 
                  stepName: nextStepName, 
                  serviceName: nextServiceName,
                  context: {
                    companyName: payload.companyName,
                    domain: payload.domain,
                    industryType: payload.industryType,
                    stepName: nextStepName
                  }
                }));
              });
            } catch {}
            // Look up next step's specific data
            let nextStepData = null;
            if (payload.steps && Array.isArray(payload.steps)) {
              nextStepData = payload.steps.find(step => 
                step.stepName === nextStepName || 
                step.name === nextStepName ||
                step.serviceName === nextServiceName
              );
            }

            const nextPayload = {
              ...processedPayload,  // Use flattened payload instead of original
              stepName: nextStepName,
              serviceName: nextServiceName,
              // Add step-specific fields for the next step
              stepDescription: nextStepData?.description || '',
              stepCategory: nextStepData?.category || '',
              estimatedDuration: nextStepData?.estimatedDuration,
              businessRationale: nextStepData?.businessRationale,
              substeps: nextStepData?.substeps,
              estimatedDurationMs: nextStepData?.estimatedDuration ? nextStepData.estimatedDuration * 60 * 1000 : null,
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
              journeyTrace
            };
            
            // Build proper trace headers for service-to-service call
            const traceHeaders = { 
              'x-correlation-id': correlationId,
              // W3C Trace Context format
              'traceparent': `00-${traceId.padEnd(32, '0')}-${spanId.padEnd(16, '0')}-01`,
              // Dynatrace specific headers
              'x-dynatrace-trace-id': traceId,
              'x-dynatrace-parent-span-id': spanId
            };
            
            // Pass through any incoming trace state
            if (incomingTraceState) {
              traceHeaders['tracestate'] = incomingTraceState;
            }
            
            console.log(`[${properServiceName}] Propagating trace to ${nextServiceName}: traceparent=${traceHeaders['traceparent']}`);
            
            // Always use serviceName for port mapping
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
      
    } catch (error) {
      // Handle any errors that occur during step processing
      console.error(`[${properServiceName}] Step processing error:`, error.message);
      
      // Ensure proper HTTP status code is set
      const httpStatus = error.status || error.httpStatus || 500;
      
      // Report the error to Dynatrace as a trace exception
      reportError(error, {
        'journey.step': currentStepName,
        'service.name': properServiceName,
        'correlation.id': correlationId,
        'http.status': httpStatus,
        'error.category': 'journey_step_failure'
      });
      
      // Mark trace as failed with comprehensive context
      markSpanAsFailed(error, {
        'journey.step': currentStepName,
        'service.name': properServiceName,
        'correlation.id': correlationId,
        'http.status': httpStatus,
        'error.category': 'journey_step_failure',
        'journey.company': processedPayload.companyName || 'unknown',
        'journey.domain': processedPayload.domain || 'unknown'
      });
      
      // Update journey trace to mark this step as failed
      const journeyTrace = Array.isArray(payload.journeyTrace) ? [...payload.journeyTrace] : [];
      const failedStepEntry = {
        stepName: currentStepName,
        serviceName: properServiceName,
        timestamp: new Date().toISOString(),
        correlationId,
        success: false,
        error: error.message,
        errorType: error.constructor.name,
        httpStatus: httpStatus
      };
      journeyTrace.push(failedStepEntry);
      
      // Send error business event with enhanced context
      sendErrorEvent('journey_step_failed', error, {
        stepName: currentStepName,
        serviceName: properServiceName,
        correlationId,
        httpStatus: httpStatus,
        company: processedPayload.companyName || 'unknown',
        domain: processedPayload.domain || 'unknown'
      });
      
      // Build comprehensive error response
      const errorResponse = {
        ...processedPayload,  // Include flattened fields for consistency
        status: 'error',
        error: error.message,
        errorType: error.constructor.name,
        stepName: currentStepName,
        service: properServiceName,
        correlationId,
        timestamp: new Date().toISOString(),
        journeyTrace,
        traceError: true,
        pid: process.pid,
        httpStatus: httpStatus,
        // Add OneAgent-friendly trace failure markers
        _traceInfo: {
          failed: true,
          errorMessage: error.message,
          errorType: error.constructor.name,
          httpStatus: httpStatus,
          requestCorrelationId: correlationId
        }
      };
      
      // Set comprehensive error headers for trace propagation
      res.setHeader('x-trace-error', 'true');
      res.setHeader('x-error-type', error.constructor.name);
      res.setHeader('x-journey-failed', 'true');
      res.setHeader('x-http-status', httpStatus.toString());
      res.setHeader('x-correlation-id', correlationId);
      
      // Return with appropriate HTTP status code
      console.log(`[${properServiceName}] Returning error response with HTTP ${httpStatus}`);
      res.status(httpStatus).json(errorResponse);
    }
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
  
  // Data Persistence/Storage type steps (MongoDB integration)
  if (lowerStep.includes('persist') || lowerStep.includes('storage') || lowerStep.includes('data') || 
      lowerStep.includes('archive') || lowerStep.includes('record') || lowerStep.includes('save')) {
    return {
      recordsStored: Math.floor(Math.random() * 50) + 10,
      dataIntegrityScore: (Math.random() * 0.05 + 0.95).toFixed(3),
      storageEfficiency: (Math.random() * 0.1 + 0.85).toFixed(3),
      backupStatus: 'completed',
      indexingTime: Math.floor(Math.random() * 100) + 50
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
