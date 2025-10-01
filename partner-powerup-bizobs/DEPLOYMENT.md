# Partner PowerUp BizObs App - Deployment Guide

## 🚀 Successfully Deployed

The Partner PowerUp BizObs App has been successfully uploaded to GitHub:
**Repository**: https://github.com/lawrobar90/Partner-PowerUp-BizObs-App

## 📋 Current Features

### ✅ Dynamic Service Chaining
- **Sequential Flow**: Step1Service → Step2Service → Step3Service → Step4Service → Step5Service → Step6Service
- **Dynamic Mapping**: Any customer `stepName` automatically maps to appropriate `StepXService`
- **Proper Dynatrace Visualization**: Shows connected linear flow instead of star pattern

### ✅ Industry-Specific Journey Generation
- **Telecommunications**: Discovery → PlanExploration → ServiceSelection → AccountSetup → ServiceActivation → PostActivation
- **Banking**: Research → ProductComparison → ApplicationSubmission → Verification → AccountSetup → Onboarding
- **Retail**: Browse → Compare → AddToCart → Checkout → Payment → OrderConfirmation
- **And more industries supported**

### ✅ Realistic Timing Simulation
- **Think Time**: Configurable delays between service calls (default 500ms)
- **Sequential Timestamps**: Creates realistic customer journey timing
- **Correlation ID**: Propagated across entire service chain for tracing

### ✅ Service Architecture
- **Main Server**: Port 4000 with health monitoring
- **Step Services**: Ports 4101-4106 for each StepXService
- **Process Separation**: Individual child processes for Dynatrace service detection
- **Dynatrace Headers**: Proper correlation and tracing support

## 🔧 Quick Start

```bash
# Clone the repository
git clone https://github.com/lawrobar90/Partner-PowerUp-BizObs-App.git
cd Partner-PowerUp-BizObs-App

# Install dependencies
npm install

# Start the application
npm start

# Or use the start script
chmod +x start-server.sh
./start-server.sh
```

## 🧪 Testing

### Health Check
```bash
curl http://localhost:4000/api/health
```

### Test EE Telecommunications Journey
```bash
curl -s -H 'Content-Type: application/json' \
  -d '{
    "payload": {
      "journey": {
        "steps": [
          {"stepName": "Discovery"},
          {"stepName": "PlanExploration"},
          {"stepName": "ServiceSelection"},
          {"stepName": "AccountSetup"},
          {"stepName": "ServiceActivation"},
          {"stepName": "PostActivation"}
        ]
      },
      "id": "EE_Journey_Test",
      "domain": "telecommunications",
      "thinkTimeMs": 500
    }
  }' \
  http://localhost:4000/api/flow/runFlow
```

## 📊 Expected Results

The application will:
1. Show 6 separate services in Dynatrace: Step1Service, Step2Service, Step3Service, Step4Service, Step5Service, Step6Service
2. Display sequential service flow with proper timing
3. Map any customer step names to the appropriate numbered services
4. Generate industry-specific journey prompts based on company input

## 🎯 Use Cases

- **Customer Journey Simulation**: Test any industry's customer journey with realistic timing
- **Dynatrace Service Mapping**: Visualize sequential service flows instead of monolithic traces
- **Partner Demonstrations**: Show dynamic service chaining with customer-specific examples
- **Performance Testing**: Simulate realistic customer behavior patterns with configurable timing

---

**Status**: ✅ Ready for Production
**Last Updated**: October 1, 2025
**GitHub**: https://github.com/lawrobar90/Partner-PowerUp-BizObs-App