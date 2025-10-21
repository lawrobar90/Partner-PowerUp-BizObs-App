# BizObs Service Startup and Dependencies Guide

## Overview

The BizObs application now includes comprehensive automatic service startup to ensure all dependencies and microservices are available when the server starts. This document describes the enhanced startup process and how to manage services.

## 🚀 Enhanced Startup Process

### Automatic Service Initialization

When the BizObs server starts, it automatically:

1. **Validates Dependencies**: Checks that all essential libraries and modules are available
2. **Verifies Directory Structure**: Ensures required directories exist
3. **Starts Core Services**: Automatically launches 20+ microservices
4. **Monitors Health**: Tracks service startup progress and health status
5. **Provides Detailed Logging**: Shows startup progress and any issues

### Core Services Started Automatically

The following services are started automatically on server startup:

#### Essential Customer Journey Services
- **DiscoveryService** (Port: 4110) - Product/service discovery
- **AwarenessService** (Port: 4152) - Brand awareness and marketing 
- **ConsiderationService** (Port: 4126) - Product consideration phase
- **PurchaseService** (Port: 4175) - Purchase and transaction processing
- **CompletionService** (Port: 4121) - Order completion and fulfillment
- **RetentionService** (Port: 4181) - Customer retention and follow-up
- **AdvocacyService** (Port: 4191) - Customer advocacy and referrals

#### Business Process Services  
- **DataPersistenceService** (Port: 4143) - Journey data storage (in-memory)
- **PolicySelectionService** (Port: 4189) - Insurance policy selection
- **QuotePersonalizationService** (Port: 4109) - Personalized quote generation
- **PolicyActivationService** (Port: 4157) - Policy activation workflow
- **CoverageExplorationService** (Port: 4168) - Coverage options exploration
- **SecureCheckoutService** (Port: 4120) - Secure payment processing
- **OngoingEngagementService** (Port: 4171) - Ongoing customer engagement

#### Additional Specialized Services
- **ProductSelectionService** (Port: 4147) - Product catalog and selection
- **CartManagementService** (Port: 4146) - Shopping cart operations
- **OrderManagementService** (Port: 4117) - Order processing and tracking
- **OrderConfirmationService** (Port: 4113) - Order confirmation workflow
- **CustomerSupportService** (Port: 4172) - Customer support integration
- **FeedbackCollectionService** (Port: 4149) - Customer feedback and NPS

## 📊 Service Management Endpoints

### Health and Status Monitoring

```bash
# Main server health check
GET /api/health

# Simple service list
GET /api/admin/services

# Detailed service status with startup times and metadata
GET /api/admin/services/status
```

### Service Management Operations

```bash
# Restart all core services
POST /api/admin/services/restart-all

# Ensure specific service is running
POST /api/admin/ensure-service
# Body: {"stepName": "ServiceName", "serviceName": "ServiceName"}

# Stop all services and reset ports
POST /api/admin/reset-ports
```

## 🔧 Validation and Troubleshooting

### Startup Validation Script

A comprehensive validation script is included to verify that all services are working correctly:

```bash
# Run validation script
npm run validate

# Or run directly
node scripts/validate-startup.cjs
```

The validation script checks:
- ✅ Essential API endpoints are responding
- ✅ All core services are running
- ✅ Service health status is good
- ✅ Web interface is accessible

### Manual Service Management

```bash
# Check service status
curl http://localhost:4000/api/admin/services/status | jq .

# Restart all services if needed
npm run restart-services

# Check individual service health (example for DiscoveryService)
curl http://localhost:4110/health
```

## 🔍 Monitoring Service Health

### Service Status Response Example

```json
{
  "ok": true,
  "timestamp": "2025-10-13T21:05:25.171Z",
  "totalServices": 20,
  "runningServices": 20,
  "services": [
    {
      "service": "DiscoveryService",
      "pid": 15791,
      "status": "running",
      "startTime": "2025-10-13T21:04:55.195Z",
      "uptime": 29,
      "port": 4110,
      "companyContext": {
        "companyName": "DefaultCompany",
        "domain": "default.com", 
        "industryType": "general"
      }
    }
  ],
  "serverUptime": 31,
  "serverPid": 15753
}
```

## ⚙️ Configuration

### Environment Variables

The following environment variables control the startup process:

```bash
# Default company context for all services
DEFAULT_COMPANY=DefaultCompany
DEFAULT_DOMAIN=default.com  
DEFAULT_INDUSTRY=general

# Main server port
PORT=4000
```

### Service Port Allocation

Services are automatically assigned ports in the range 4101-4199 using a consistent hash-based algorithm. This ensures:
- ✅ Predictable port assignments
- ✅ No port conflicts  
- ✅ Same service always gets the same port

## 🚨 Troubleshooting

### Common Issues and Solutions

1. **Service Failed to Start**
   ```bash
   # Check logs in server.log
   tail -f /home/ec2-user/partner-powerup-bizobs/server.log
   
   # Restart specific service
   curl -X POST -H "Content-Type: application/json" \
     -d '{"stepName": "Discovery"}' \
     http://localhost:4000/api/admin/ensure-service
   ```

2. **Port Conflicts**
   ```bash
   # Reset all ports and restart services
   curl -X POST http://localhost:4000/api/admin/reset-ports
   curl -X POST http://localhost:4000/api/admin/services/restart-all
   ```

3. **Validation Failures**
   ```bash
   # Run full validation to identify issues
   npm run validate
   
   # Check detailed service status
   curl http://localhost:4000/api/admin/services/status | jq .
   ```

### Log Locations

- **Main Server Logs**: `/home/ec2-user/partner-powerup-bizobs/server.log`
- **Individual Service Logs**: Displayed in main server log with service name prefix

## 📈 Performance Considerations

- **Startup Time**: ~5-10 seconds for all services to initialize
- **Memory Usage**: Each service uses ~20-50MB of memory
- **Port Range**: Services use ports 4101-4199
- **Health Checks**: Services respond to health checks within 1-2 seconds

## 🔄 Automatic Restart and Recovery

The application includes automatic restart capabilities:

- **Graceful Shutdown**: Services are properly terminated on server shutdown
- **Process Monitoring**: Failed services are logged and can be restarted
- **Health Monitoring**: Service health is continuously monitored
- **Quick Recovery**: Services can be restarted without affecting others

## 🎯 Best Practices

1. **Always run startup validation** after making changes
2. **Monitor service health** regularly using the status endpoint
3. **Use the restart endpoint** rather than manual process killing

## 🔗 Distributed Tracing and Service-to-Service Communication

### Overview

The BizObs application implements robust distributed tracing to ensure service calls are properly correlated in Dynatrace. When customers journey through multiple services (Discovery → Selection → Purchase → etc.), all service calls are linked via trace headers.

### How Trace Propagation Works

1. **W3C Trace Context**: Uses standard `traceparent` and `tracestate` headers
2. **Dynatrace Headers**: Includes `x-dynatrace-trace-id` and related headers
3. **Automatic Generation**: Creates trace IDs when none are present
4. **Service Chaining**: Each service forwards trace context to the next service

### Trace Header Format

```
traceparent: 00-{32-char-trace-id}-{16-char-span-id}-01
tracestate: optional vendor-specific state
x-dynatrace-trace-id: {trace-id-for-dynatrace-correlation}
x-correlation-id: {business-correlation-id}
```

### Verifying Trace Propagation

#### 1. Check Recent Trace Calls
```bash
# View recent service calls with trace headers
curl http://localhost:4000/api/admin/trace-validation

# Show more recent calls
curl "http://localhost:4000/api/admin/trace-validation?limit=20"
```

#### 2. Run a Test Journey Simulation
```bash
# Simulate a chained customer journey
curl -X POST http://localhost:4000/api/journey-simulation/simulate-journey \
  -H "Content-Type: application/json" \
  -d '{
    "chained": true,
    "thinkTimeMs": 100,
    "journey": {
      "companyName": "ShopMart",
      "domain": "shopmart.com", 
      "industryType": "retail",
      "steps": [
        {"stepName": "Product Discovery", "serviceName": "ProductDiscoveryService"},
        {"stepName": "Product Selection", "serviceName": "ProductSelectionService"},
        {"stepName": "Cart Addition", "serviceName": "CartAdditionService"}
      ]
    }
  }'
```

#### 3. Test Individual Service with Trace Headers
```bash
# Call a service directly with trace headers
curl -X POST http://127.0.0.1:4129/process \
  -H "Content-Type: application/json" \
  -H "traceparent: 00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01" \
  -d '{
    "journeyId": "test-123",
    "companyName": "ShopMart",
    "stepName": "Product Discovery"
  }'
```

### What to Look For in Dynatrace

1. **Service Names**: Should show as "ProductDiscoveryService", "ProductSelectionService", etc. (not generic names)
2. **Distributed Traces**: Multiple services should appear in the same trace
3. **Service Flow**: Clear service-to-service call relationships
4. **Business Events**: Custom journey step events with proper correlation

### Expected Service Names in Dynatrace

```
✅ Good: ProductDiscoveryService, ProductSelectionService, CartAdditionService
❌ Bad: partner-powerup-bizobs, node, server.js
```

### Troubleshooting Trace Issues

#### Problem: Services Not Linked in Dynatrace
```bash
# Check if trace headers are being propagated
curl "http://localhost:4000/api/admin/trace-validation?limit=5"

# Look for traceparent consistency across calls
# All calls in a journey should have the same trace ID (32-char portion)
```

#### Problem: Wrong Service Names in Dynatrace
```bash
# Verify service environment variables are set correctly
curl http://localhost:4000/api/admin/services/status | jq '.services[].service'

# Check that DT_SERVICE_NAME is set in service processes
ps aux | grep node | grep -E "(ProductDiscovery|ProductSelection|CartAddition)"
```

#### Problem: Missing Distributed Traces
- Ensure OneAgent is installed and running
- Check that `traceparent` headers are present in service calls
- Verify network connectivity between services (all on localhost)

### Debug Commands Summary

```bash
# Check service status and names
curl http://localhost:4000/api/admin/services/status

# View recent trace propagation
curl http://localhost:4000/api/admin/trace-validation

# Test journey simulation
curl -X POST http://localhost:4000/api/journey-simulation/simulate-journey \
  -H "Content-Type: application/json" -d '{"chained":true,"journey":{"steps":[{"stepName":"Discovery"}]}}'

# Check individual service health and trace support
curl http://127.0.0.1:4129/health
```

### Integration with OpenTelemetry (Optional)

While the app works with Dynatrace OneAgent by default, you can optionally add OpenTelemetry for more control:

1. Install OTel packages: `npm install @opentelemetry/sdk-node @opentelemetry/exporter-trace-otlp-http`
2. Configure OTLP export to Dynatrace endpoint
3. Set `OTEL_SERVICE_NAME` environment variable per service
4. Use OTel instead of or alongside OneAgent

The current implementation forwards W3C headers so it's compatible with both approaches.
4. **Check logs** if services fail to start properly
5. **Verify port availability** before starting additional services

This enhanced startup process ensures that the BizObs application is fully functional immediately after starting, with all microservices and dependencies properly initialized and monitored.