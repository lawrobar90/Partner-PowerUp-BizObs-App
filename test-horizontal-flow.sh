#!/bin/bash

echo "🚀 Testing Horizontal Service Flow in Dynatrace..."

echo "1️⃣ Restarting services with enhanced detection..."
bash ./restart-bizobs.sh
sleep 3

echo "2️⃣ Checking service health..."
curl -sS http://127.0.0.1:4000/api/health | jq '{status, services: .childServices | length}'

echo ""
echo "3️⃣ Running sequential journey for horizontal trace flow..."

# Create a perfect sequential flow
curl -sS -X POST http://127.0.0.1:4000/api/journey-simulation/simulate-journey \
  -H 'Content-Type: application/json' \
  -d '{
    "journeyId": "horizontal_flow_test",
    "customerId": "customer_flow",
    "stepNames": [
      "ProductDiscovery",
      "ProductSelection", 
      "CartAddition",
      "CheckoutProcess",
      "OrderConfirmation",
      "PostPurchase"
    ],
    "chained": true,
    "thinkTimeMs": 200
  }' | jq '{
    success,
    journey: {
      journeyId: .journey.journeyId,
      completedSteps: .journey.completedSteps,
      totalSteps: .journey.totalSteps,
      duration: .journey.totalDuration,
      services: [.journey.steps[].serviceName]
    }
  }'

echo ""
echo "4️⃣ Expected Dynatrace Service Flow:"
echo "   ProductDiscoveryService → ProductSelectionService → CartAdditionService"
echo "   → CheckoutProcessService → OrderConfirmationService → PostPurchaseService"

echo ""
echo "5️⃣ Check Dynatrace:"
echo "   • Go to Services → Service flow"
echo "   • Look for 'BizObs-CustomerJourney' services"
echo "   • Should see horizontal flow with proper service names"

echo ""
echo "✅ Test complete! Services should now appear horizontally in Dynatrace."