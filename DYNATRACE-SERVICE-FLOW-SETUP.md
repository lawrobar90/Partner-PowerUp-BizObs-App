# Dynatrace Service Flow Configuration

## Problem
Services appearing as "dynamic-runners" instead of proper service names, and showing vertically instead of horizontally in service flow.

## Solution: Process Group Detection Rules

### 1. Create Process Group Detection Rule in Dynatrace

Navigate to: **Settings → Processes and containers → Process group detection**

#### Rule Configuration:
- **Rule name**: `BizObs Customer Journey Services`
- **Process group naming**: Use environment variable
- **Environment variable**: `DT_PROCESS_GROUP_NAME`
- **Fallback to**: `DT_SERVICE_NAME`

#### Conditions:
- **Environment variable exists**: `DT_APPLICATION_NAME`
- **Environment variable value**: `BizObs-CustomerJourney`

### 2. Service Detection Rule

Navigate to: **Settings → Server-side service monitoring → Service detection rules**

#### Rule Configuration:
- **Rule name**: `BizObs Service Detection`
- **Service naming**: Use environment variable
- **Environment variable**: `DT_SERVICE_NAME`

#### Conditions:
- **Process group name contains**: `Service`
- **Environment variable exists**: `DT_APPLICATION_NAME`

### 3. Expected Result

After applying these rules and triggering journeys, you should see:

**Horizontal Service Flow:**
```
ProductDiscoveryService → ProductSelectionService → CartAdditionService → CheckoutProcessService → OrderConfirmationService → PostPurchaseService
```

**Service Names:**
- ✅ ProductDiscoveryService (instead of dynamic-runners)
- ✅ ProductSelectionService
- ✅ CartAdditionService  
- ✅ CheckoutProcessService
- ✅ OrderConfirmationService
- ✅ PostPurchaseService

### 4. Verify Configuration

1. **Run a journey simulation:**
   ```bash
   curl -X POST http://127.0.0.1:4000/api/journey-simulation/simulate-journey \
     -H 'Content-Type: application/json' \
     -d '{"journeyId":"test_flow","stepNames":["ProductDiscovery","ProductSelection","CartAddition","CheckoutProcess","OrderConfirmation","PostPurchase"],"chained":true}'
   ```

2. **Check Dynatrace Service Flow:** Services → Service flow
3. **Look for horizontal flow** with proper service names

### 5. Environment Variables Set

The application now sets these Dynatrace detection variables:

```bash
DT_SERVICE_NAME=ProductDiscoveryService
DYNATRACE_SERVICE_NAME=ProductDiscoveryService  
DT_LOGICAL_SERVICE_NAME=ProductDiscoveryService
DT_PROCESS_GROUP_NAME=ProductDiscoveryService
DT_PROCESS_GROUP_INSTANCE=ProductDiscoveryService-4101
DT_APPLICATION_NAME=BizObs-CustomerJourney
DT_CLUSTER_ID=ProductDiscoveryService
DT_NODE_ID=ProductDiscoveryService-node
```

### 6. Troubleshooting

If services still appear as dynamic-runners:
1. Verify the detection rules are enabled
2. Check rule order (BizObs rules should be at the top)
3. Restart OneAgent if needed
4. Allow 2-3 minutes for rule processing

### 7. Expected Trace Flow

With proper configuration, traces should show:
- **Request enters**: BizObs main server (port 4000)
- **Calls**: ProductDiscoveryService (port 4101)
- **Chains to**: ProductSelectionService (port 4102)
- **Continues**: CartAdditionService → CheckoutProcessService → OrderConfirmationService → PostPurchaseService
- **Result**: Single distributed trace across all 6 services horizontally