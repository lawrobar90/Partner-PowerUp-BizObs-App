#!/bin/bash

echo "🏢 Testing Company-Tagged Services for Dynatrace Filtering..."

echo "1️⃣ Restarting services..."
bash ./restart-bizobs.sh
sleep 3

echo ""
echo "2️⃣ Testing ShopMart (Retail) Journey..."
curl -sS -X POST http://127.0.0.1:4000/api/journey-simulation/simulate-journey \
  -H 'Content-Type: application/json' \
  -d '{
    "journeyId": "shopmart_journey",
    "customerId": "customer_sm",
    "companyName": "ShopMart",
    "domain": "shopmart.com",
    "industryType": "retail",
    "stepNames": ["ProductDiscovery", "ProductSelection", "CartAddition"],
    "chained": true,
    "thinkTimeMs": 150
  }' | jq '{success, company: "ShopMart", services: [.journey.steps[].serviceName]}'

echo ""
echo "3️⃣ Testing TechCorp (Technology) Journey..."
curl -sS -X POST http://127.0.0.1:4000/api/journey-simulation/simulate-journey \
  -H 'Content-Type: application/json' \
  -d '{
    "journeyId": "techcorp_journey",
    "customerId": "customer_tc",
    "companyName": "TechCorp",
    "domain": "techcorp.io",
    "industryType": "technology",
    "stepNames": ["ProductDiscovery", "FeatureExploration", "TrialSignup"],
    "chained": true,
    "thinkTimeMs": 150
  }' | jq '{success, company: "TechCorp", services: [.journey.steps[].serviceName]}'

echo ""
echo "4️⃣ Testing HealthPlus (Healthcare) Journey..."
curl -sS -X POST http://127.0.0.1:4000/api/journey-simulation/simulate-journey \
  -H 'Content-Type: application/json' \
  -d '{
    "journeyId": "healthplus_journey", 
    "customerId": "customer_hp",
    "companyName": "HealthPlus",
    "domain": "healthplus.care",
    "industryType": "healthcare",
    "stepNames": ["ServiceExploration", "AppointmentScheduling", "Registration"],
    "chained": true,
    "thinkTimeMs": 150
  }' | jq '{success, company: "HealthPlus", services: [.journey.steps[].serviceName]}'

echo ""
echo "5️⃣ Checking service health with company context..."
curl -sS http://127.0.0.1:4000/api/health | jq '{status, totalServices: (.childServices | length), services: [.childServices[].service]}'

echo ""
echo "📊 Expected Dynatrace Tags:"
echo "   ShopMart services: company=ShopMart, domain=shopmart.com, industry=retail"
echo "   TechCorp services: company=TechCorp, domain=techcorp.io, industry=technology"  
echo "   HealthPlus services: company=HealthPlus, domain=healthplus.care, industry=healthcare"

echo ""
echo "🔍 Dynatrace Filtering Options:"
echo "   • Filter by company: company=ShopMart"
echo "   • Filter by industry: industry=retail"
echo "   • Filter by domain: domain=shopmart.com"
echo "   • Combine filters: company=TechCorp AND industry=technology"

echo ""
echo "✅ Company tagging test complete!"
echo "   Check Dynatrace Services view and use tag filters to split by company."