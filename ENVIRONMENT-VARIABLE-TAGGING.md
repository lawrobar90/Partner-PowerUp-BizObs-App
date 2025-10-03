# Environment Variable-Based Dynatrace Tagging

## Overview
This implementation uses environment variables to tag all processes with company context, enabling easy filtering in Dynatrace without relying on AWS metadata or manual configuration.

## Environment Variables Set on All Processes

### Core Tagging Variables
```bash
COMPANY_NAME=ShopMart
DOMAIN=shopmart.com
INDUSTRY_TYPE=retail
```

### Dynatrace Service Detection
```bash
DT_SERVICE_NAME=[ServiceName]
DT_LOGICAL_SERVICE_NAME=[ServiceName]
DT_PROCESS_GROUP_NAME=[ServiceName]
DT_APPLICATION_NAME=BizObs-CustomerJourney
```

### Dynatrace Custom Properties
```bash
DT_CUSTOM_PROP_companyName=ShopMart
DT_CUSTOM_PROP_domain=shopmart.com
DT_CUSTOM_PROP_industryType=retail
DT_CUSTOM_PROP_service_type=customer_journey_step
```

### Dynatrace Tags
```bash
DT_TAGS=companyName=ShopMart,domain=shopmart.com,industryType=retail,service=[ServiceName]
```

## Dynatrace Filtering

### Filter by Company
```
companyName:ShopMart
companyName:TechCorp
companyName:HealthPlus
```

### Filter by Domain
```
domain:shopmart.com
domain:techcorp.io
domain:healthplus.org
```

### Filter by Industry
```
industryType:retail
industryType:technology
industryType:healthcare
industryType:finance
```

## Benefits Over AWS Tags

### ✅ **Immediate Availability**
- No dependency on AWS metadata service
- Works in any environment (local, cloud, hybrid)
- Instant propagation to child processes

### ✅ **Process-Level Granularity**
- Each service process gets tagged individually
- No reliance on host-level inheritance
- Direct process identification in Dynatrace

### ✅ **Multi-Tenant Support**
- Different services can have different company contexts
- Dynamic tagging based on journey data
- Isolated customer environments

### ✅ **Debugging Friendly**
- Environment variables visible in process lists
- Easy to verify tags are set correctly
- Simple troubleshooting with `/proc/[pid]/environ`

## Implementation Details

### Service Manager Enhancement
The `service-manager.js` sets environment variables when starting child processes:

```javascript
env: { 
  // Core company context for Dynatrace filtering
  COMPANY_NAME: companyName,
  DOMAIN: domain, 
  INDUSTRY_TYPE: industryType,
  // Dynatrace tags for easy filtering 
  DT_TAGS: `companyName=${companyName},domain=${domain},industryType=${industryType}`,
  // Dynatrace custom properties
  DT_CUSTOM_PROP_companyName: companyName,
  DT_CUSTOM_PROP_domain: domain,
  DT_CUSTOM_PROP_industryType: industryType,
}
```

### Service Runner Headers
The `service-runner.cjs` exposes tags via HTTP headers:

```javascript
res.setHeader('dt.custom.companyName', companyName);
res.setHeader('dt.custom.domain', domain);
res.setHeader('dt.custom.industryType', industryType);
```

## Testing

### Run Environment Variable Test
```bash
chmod +x test-environment-tags.sh
./test-environment-tags.sh
```

### Verify Process Environment
```bash
# Find service processes
pgrep -f "dynamic-step-service.cjs"

# Check environment variables for a specific PID
cat /proc/[PID]/environ | tr '\0' '\n' | grep -E "COMPANY_NAME|DOMAIN|INDUSTRY_TYPE|DT_"
```

### Expected Dynatrace Results
After 1-2 minutes, services appear in Dynatrace with:
- **Service names**: Clear service identification
- **Custom properties**: companyName, domain, industryType filters
- **Tags**: Multi-dimensional filtering options
- **Process groups**: Isolated by service type

## Multi-Tenant Scenarios

### Retail Customer Journey
```bash
companyName=ShopMart
domain=shopmart.com 
industryType=retail
```

### Technology Company Journey
```bash
companyName=TechCorp
domain=techcorp.io
industryType=technology
```

### Healthcare Provider Journey
```bash
companyName=HealthPlus
domain=healthplus.org
industryType=healthcare
```

## Troubleshooting

### Tags Not Appearing
1. Verify environment variables are set: `env | grep DT_`
2. Check process environment: `cat /proc/[PID]/environ`
3. Restart services to pick up new variables
4. Wait 2-3 minutes for Dynatrace propagation

### Missing Company Context
1. Ensure journey data includes company/domain/industry
2. Verify service-manager receives company context
3. Check service-runner headers in network traffic

### Process Detection Issues
1. Confirm DT_SERVICE_NAME is unique per service
2. Verify DT_PROCESS_GROUP_NAME is set
3. Check Dynatrace agent logs for detection

## Advantages

| Aspect | Environment Variables | AWS Tags | Manual Config |
|--------|----------------------|----------|---------------|
| **Setup Time** | Immediate | Complex | Manual |
| **Reliability** | 100% | Variable | Manual errors |
| **Multi-Tenant** | Native | Limited | Tedious |
| **Debugging** | Easy | Complex | Limited |
| **Cross-Platform** | Yes | AWS only | Platform specific |
| **Process Granularity** | Per-process | Host-level | Service-level |

This approach provides the most reliable and flexible multi-tenant tagging for Dynatrace observability.