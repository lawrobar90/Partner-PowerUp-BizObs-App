#!/bin/bash

echo "Testing multiple customer simulation..."

# Wait for server to be ready
sleep 3

# Test multiple customers
echo "Sending request for 2 customers..."
curl -s -X POST http://localhost:4000/api/journey-simulation/simulate-journey \
  -H "Content-Type: application/json" \
  -d '{
    "journeyName": "Multi-Customer Port Test", 
    "companyName": "TestCorp",
    "numberOfCustomers": 2,
    "steps": [{"stepName": "ProductSelection"}]
  }' | jq -r '.journey.summary // .error // "ERROR: No response"'

echo "Test completed."