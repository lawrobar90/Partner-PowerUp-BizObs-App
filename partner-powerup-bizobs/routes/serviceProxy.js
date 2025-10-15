import express from 'express';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Service proxy endpoints to simulate distributed services
const serviceEndpoints = {
  'search-service': ['/api/search', '/api/products', '/api/catalog'],
  'cart-service': ['/api/cart', '/api/cart/add', '/api/cart/update'],
  'payment-service': ['/api/payment', '/api/checkout', '/api/billing'],
  'user-service': ['/api/user', '/api/profile', '/api/auth'],
  'notification-service': ['/api/notifications', '/api/email', '/api/sms'],
  'order-service': ['/api/orders', '/api/fulfillment', '/api/shipping'],
  'frontend-service': ['/frontend', '/products-page', '/checkout-page'],
  'analytics-service': ['/api/analytics', '/api/tracking']
};

// Create proxy endpoints for each service
Object.entries(serviceEndpoints).forEach(([serviceName, endpoints]) => {
  endpoints.forEach(endpoint => {
    // GET endpoints
    router.get(endpoint, (req, res) => {
      const requestStartTime = Date.now();
      const traceId = req.headers['x-trace-id'] || uuidv4();
      const spanId = uuidv4().slice(0, 16);
      const processingDelay = Math.floor(Math.random() * 500) + 50;
      
      // Set response headers for Dynatrace
      res.set({
        'X-Service-Name': serviceName,
        'X-Trace-ID': traceId,
        'X-Span-ID': spanId,
        'X-Duration': processingDelay
      });
      
      // Simulate processing time
      setTimeout(() => {
        const actualDuration = Date.now() - requestStartTime;
        
        const response = {
          service: serviceName,
          endpoint: endpoint,
          method: 'GET',
          traceId,
          spanId,
          duration: actualDuration,
          timestamp: new Date().toISOString(),
          status: 'success',
          data: generateMockResponse(serviceName, endpoint)
        };
        
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          service: serviceName,
          'dt.service': serviceName,
          'dt.trace_id': traceId,
          'dt.span_id': spanId,
          'service.name': serviceName,
          method: 'GET',
          endpoint,
          duration: actualDuration,
          statusCode: 200,
          responseBody: response,
          message: `${serviceName} handled GET ${endpoint}`
        }));
        
        res.json(response);
      }, processingDelay);
    });
    
    // POST endpoints
    router.post(endpoint, (req, res) => {
      const requestStartTime = Date.now();
      const traceId = req.headers['x-trace-id'] || uuidv4();
      const spanId = uuidv4().slice(0, 16);
      const processingDelay = Math.floor(Math.random() * 800) + 100;
      
      // Add request start time to request body for OneAgent capture
      // Preserve all Copilot duration fields that came in the request
      const enhancedRequestBody = {
        ...req.body,
        requestStartTime: requestStartTime,
        // Preserve Copilot duration fields if they exist
        estimatedDuration: req.body.estimatedDuration,
        businessRationale: req.body.businessRationale,
        category: req.body.category,
        substeps: req.body.substeps,
        estimatedDurationMs: req.body.estimatedDurationMs
      };
      
      // Set response headers for Dynatrace
      res.set({
        'X-Service-Name': serviceName,
        'X-Trace-ID': traceId,
        'X-Span-ID': spanId,
        'X-Duration': processingDelay
      });
      
      // Simulate processing time
      setTimeout(() => {
        const actualDuration = Date.now() - requestStartTime;
        
        const response = {
          service: serviceName,
          endpoint: endpoint,
          method: 'POST',
          traceId,
          spanId,
          duration: actualDuration,
          timestamp: new Date().toISOString(),
          status: 'success',
          data: generateMockResponse(serviceName, endpoint, enhancedRequestBody),
          // Include Copilot duration fields in response for OneAgent capture
          estimatedDuration: req.body.estimatedDuration,
          businessRationale: req.body.businessRationale,
          category: req.body.category,
          substeps: req.body.substeps,
          estimatedDurationMs: req.body.estimatedDurationMs
        };
        
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          service: serviceName,
          'dt.service': serviceName,
          'dt.trace_id': traceId,
          'dt.span_id': spanId,
          'service.name': serviceName,
          method: 'POST',
          endpoint,
          duration: actualDuration,
          statusCode: 200,
          requestBody: enhancedRequestBody,
          responseBody: response,
          message: `${serviceName} handled POST ${endpoint}`
        }));
        
        res.json(response);
      }, processingDelay);
    });
  });
});

function generateMockResponse(serviceName, endpoint, requestBody = {}) {
  switch (serviceName) {
    case 'search-service':
      return {
        results: [
          { id: 1, name: 'Product A', price: 29.99 },
          { id: 2, name: 'Product B', price: 49.99 }
        ],
        total: 2,
        searchTerm: requestBody.query || 'default'
      };
    case 'cart-service':
      return {
        cartId: uuidv4(),
        items: requestBody.items || [],
        total: Math.floor(Math.random() * 200) + 50
      };
    case 'payment-service':
      return {
        transactionId: uuidv4(),
        status: 'completed',
        amount: requestBody.amount || Math.floor(Math.random() * 500) + 100
      };
    case 'user-service':
      return {
        userId: uuidv4(),
        profile: { name: 'John Doe', email: 'john@example.com' }
      };
    case 'notification-service':
      return {
        notificationId: uuidv4(),
        status: 'sent',
        type: 'email'
      };
    case 'order-service':
      return {
        orderId: uuidv4(),
        status: 'processing',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      };
    default:
      return { message: 'Service response', service: serviceName };
  }
}

export default router;