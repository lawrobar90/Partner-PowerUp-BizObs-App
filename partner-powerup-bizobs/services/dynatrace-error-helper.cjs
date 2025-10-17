/**
 * Enhanced Dynatrace Error Handling and Trace Failure Reporting
 * Ensures exceptions are properly captured and propagated in traces
 */

// Dynatrace API helpers for error reporting
const addCustomAttributes = (attributes) => {
  console.log('[dynatrace] Custom attributes:', attributes);
  // In real Dynatrace environment, this would call dynatrace.addCustomAttributes(attributes)
};

const reportError = (error, context = {}) => {
  console.log('[dynatrace] Error reported:', {
    error: error.message || error,
    stack: error.stack,
    context
  });
  // In real Dynatrace environment, this would call dynatrace.reportError(error)
};

const markSpanAsFailed = (error, context = {}) => {
  console.log('[dynatrace] Span marked as failed:', {
    error: error.message || error,
    context
  });
  // In real Dynatrace environment, this would mark the current span as failed
  addCustomAttributes({
    'error.message': error.message || error,
    'error.type': error.constructor.name || 'Error',
    'span.status': 'ERROR',
    'trace.failed': true,
    ...context
  });
};

const sendErrorEvent = (eventType, error, context = {}) => {
  console.log('[dynatrace] Error business event:', eventType, {
    error: error.message || error,
    errorType: error.constructor.name || 'Error',
    timestamp: new Date().toISOString(),
    ...context
  });
  // In real Dynatrace environment, this would send a business event
};

/**
 * Enhanced error wrapper that captures errors for Dynatrace tracing
 */
class TracedError extends Error {
  constructor(message, context = {}) {
    super(message);
    this.name = 'TracedError';
    this.context = context;
    this.timestamp = new Date().toISOString();
    
    // Immediately report to Dynatrace
    markSpanAsFailed(this, context);
    reportError(this, context);
  }
}

/**
 * Async function wrapper that catches errors and reports them to Dynatrace
 */
const withErrorTracking = (serviceName, operation) => {
  return async (...args) => {
    try {
      const result = await operation(...args);
      return result;
    } catch (error) {
      const context = {
        'service.name': serviceName,
        'operation': operation.name || 'unknown',
        'error.caught': true
      };
      
      // Mark trace as failed
      markSpanAsFailed(error, context);
      reportError(error, context);
      
      // Send error business event
      sendErrorEvent('service_operation_failed', error, {
        serviceName,
        operation: operation.name || 'unknown'
      });
      
      // Re-throw to maintain error flow
      throw new TracedError(error.message, context);
    }
  };
};

/**
 * Express middleware for error handling with Dynatrace integration
 */
const errorHandlingMiddleware = (serviceName) => {
  return (error, req, res, next) => {
    const context = {
      'service.name': serviceName,
      'request.path': req.path,
      'request.method': req.method,
      'correlation.id': req.correlationId,
      'journey.step': req.body?.stepName || 'unknown'
    };
    
    // Report error to Dynatrace
    markSpanAsFailed(error, context);
    reportError(error, context);
    
    // Send error business event
    sendErrorEvent('http_request_failed', error, {
      serviceName,
      path: req.path,
      method: req.method,
      correlationId: req.correlationId,
      stepName: req.body?.stepName
    });
    
    // Add error headers for trace propagation
    res.setHeader('x-trace-error', 'true');
    res.setHeader('x-error-type', error.constructor.name);
    res.setHeader('x-error-message', error.message);
    
    // Return standardized error response
    const errorResponse = {
      status: 'error',
      error: error.message,
      errorType: error.constructor.name,
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
      service: serviceName,
      traceError: true
    };
    
    res.status(error.status || 500).json(errorResponse);
  };
};

/**
 * Simulate random errors based on error profiles for testing
 */
const simulateRandomError = (errorProfile, stepName, context = {}) => {
  if (!errorProfile || Math.random() >= errorProfile.errorRate) {
    return null; // No error
  }
  
  const errorType = errorProfile.errorTypes[Math.floor(Math.random() * errorProfile.errorTypes.length)];
  const httpStatus = errorProfile.httpErrors[Math.floor(Math.random() * errorProfile.httpErrors.length)];
  
  const error = new TracedError(`Simulated ${errorType} in ${stepName}`, {
    'error.simulated': true,
    'error.type': errorType,
    'http.status': httpStatus,
    'journey.step': stepName,
    ...context
  });
  
  error.status = httpStatus;
  error.errorType = errorType;
  
  return error;
};

/**
 * Check if a step should fail based on hasError flag or error simulation
 */
const checkForStepError = (payload, errorProfile) => {
  // Check explicit error flag first
  if (payload.hasError === true) {
    const error = new TracedError(
      payload.errorMessage || `Step ${payload.stepName} marked as failed`,
      {
        'error.explicit': true,
        'journey.step': payload.stepName,
        'service.name': payload.serviceName
      }
    );
    error.status = payload.httpStatus || 500;
    return error;
  }
  
  // Check for simulated errors
  if (errorProfile) {
    return simulateRandomError(errorProfile, payload.stepName, {
      'journey.step': payload.stepName,
      'service.name': payload.serviceName
    });
  }
  
  return null;
};

module.exports = {
  TracedError,
  withErrorTracking,
  errorHandlingMiddleware,
  simulateRandomError,
  checkForStepError,
  markSpanAsFailed,
  reportError,
  sendErrorEvent,
  addCustomAttributes
};