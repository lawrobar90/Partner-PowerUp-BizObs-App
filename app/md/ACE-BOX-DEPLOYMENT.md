# Partner PowerUp BizObs - Ace-Box Deployment Guide

## 🚀 Quick Start for Fresh Ace-Box Environment

This guide will help you deploy the complete BizObs application on a fresh ace-box environment with a single command.

### Prerequisites

- Fresh ace-box environment (Ubuntu/Debian-based)
- Internet connectivity
- `dt_training` user access (typical for ace-boxes)

### One-Command Deployment

```bash
curl -fsSL https://raw.githubusercontent.com/lawrobar90/Partner-PowerUp-BizObs-App/main/start-server.sh | bash
```

Or clone and run manually:

```bash
git clone https://github.com/lawrobar90/Partner-PowerUp-BizObs-App.git
cd Partner-PowerUp-BizObs-App
chmod +x start-server.sh
./start-server.sh
```

## 🔧 Command Line Options

```bash
./start-server.sh [OPTIONS]

Options:
  --force-clone    Force fresh clone even if directory exists
  --dry-run       Check prerequisites without starting server
  --follow-logs   Start server and follow logs in real-time
```

Examples:
```bash
# Check if environment is ready without starting
./start-server.sh --dry-run

# Force fresh deployment
./start-server.sh --force-clone

# Start and monitor logs
./start-server.sh --follow-logs
```

## 🎯 What Gets Deployed

### System Dependencies
- ✅ Node.js 20+ (auto-installed if missing)
- ✅ npm (auto-installed if missing)
- ✅ git (auto-installed if missing)
- ✅ curl & jq (for API testing)
- ✅ lsof (for port management)

### Application Components
- ✅ BizObs main server (port 8080)
- ✅ Dynamic service mesh
- ✅ Essential infrastructure services (Discovery, Purchase, DataPersistence)
- ✅ Customer journey simulation engine
- ✅ Multi-persona load generation
- ✅ Dynatrace metadata injection

### Kubernetes Integration
- ✅ Automatic ingress deployment (if kubectl available)
- ✅ External URL routing
- ✅ Service mesh connectivity

### Monitoring & Management
- ✅ Health check endpoints
- ✅ Admin dashboard
- ✅ Real-time logging
- ✅ Process monitoring scripts

## 🌐 Access URLs

After successful deployment, you'll have access to:

### Primary Access
- **External URL**: `http://bizobs.[ace-box-id].dynatrace.training/`
- **Local URL**: `http://localhost:8080/`

### Key Endpoints
| Endpoint | Purpose | URL |
|----------|---------|-----|
| Main UI | Primary interface | `/` |
| Health Check | System status | `/health` |
| Admin Panel | Service management | `/api/admin/services/status` |
| Detailed Health | Comprehensive status | `/api/health/detailed` |
| Journey Simulation | Customer journey API | `/api/journey-simulation/simulate-journey` |
| Load Generation | Traffic generation | `/api/load-gen/start` |

## 🎭 Demo Features

### Customer Journey Types
1. **Insurance Journey**
   - PolicyDiscovery → QuoteGeneration → PolicySelection → PaymentProcessing
   
2. **Retail Journey**
   - ProductBrowsing → CartManagement → CheckoutProcess → OrderFulfillment
   
3. **Technology Journey**
   - UserOnboarding → FeatureExploration → DataProcessing → AnalyticsReporting
   
4. **Banking Journey**
   - AccountCreation → KYCVerification → ProductSelection → TransactionProcessing

### Multi-Persona Load Generation
- **Karen** (High-demand customer with escalations)
- **Raj** (Power user with complex workflows)
- **Alex** (Mobile-first younger demographic)
- **Sophia** (Analytics-focused business user)

### Dynatrace Integration Features
- ✅ 13+ metadata headers per request
- ✅ Service-specific environment variables
- ✅ Process group identification
- ✅ Application context tagging
- ✅ Company-specific service isolation
- ✅ Real-time observability metrics

## 🔧 Management Commands

### Status Monitoring
```bash
# Check overall status
./status.sh

# View real-time logs
tail -f logs/bizobs.log

# Check service health via API
curl http://localhost:8080/api/admin/services/status | jq
```

### Process Management
```bash
# Stop all services
./stop.sh

# Restart server
./restart.sh

# Force restart with fresh dependencies
./start-server.sh --force-clone
```

### Testing Customer Journeys
```bash
# Test insurance journey
curl -X POST http://localhost:8080/api/journey-simulation/simulate-journey \
  -H "Content-Type: application/json" \
  -d '{
    "journey": {
      "companyName": "Demo Insurance Corp",
      "domain": "demo-insurance.com",
      "industryType": "Insurance",
      "steps": [
        {"stepName": "PolicyDiscovery", "serviceName": "PolicyDiscoveryService", "category": "Research"},
        {"stepName": "QuoteGeneration", "serviceName": "QuoteGenerationService", "category": "Pricing"}
      ]
    }
  }'

# Test retail journey
curl -X POST http://localhost:8080/api/journey-simulation/simulate-journey \
  -H "Content-Type: application/json" \
  -d '{
    "journey": {
      "companyName": "Demo Retail Co",
      "domain": "demo-retail.com", 
      "industryType": "Retail",
      "steps": [
        {"stepName": "ProductBrowsing", "serviceName": "ProductBrowsingService", "category": "Discovery"},
        {"stepName": "CartManagement", "serviceName": "CartManagementService", "category": "Shopping"}
      ]
    }
  }'
```

## 🐛 Troubleshooting

### Common Issues

#### Port 8080 Already in Use
```bash
# Check what's using the port
lsof -i:8080

# Kill existing processes
./stop.sh

# Start fresh
./start-server.sh
```

#### Services Not Starting
```bash
# Check logs for errors
tail -20 logs/bizobs.log

# Verify Node.js version
node --version  # Should be 18+

# Check disk space
df -h
```

#### External Access Not Working
```bash
# Check ingress status
kubectl get ingress bizobs-ingress

# Verify internal connectivity
curl http://localhost:8080/health

# Check DNS resolution
nslookup bizobs.[ace-box-id].dynatrace.training
```

#### Dynatrace Integration Issues
```bash
# Check environment variables
env | grep DT_

# Verify OneAgent installation
ps aux | grep oneagent

# Test service detection
curl http://localhost:8080/api/admin/services/status
```

### Log Analysis
```bash
# View startup logs
head -50 logs/bizobs.log

# Monitor real-time activity
tail -f logs/bizobs.log

# Search for errors
grep -i error logs/bizobs.log

# Check service creation
grep -i "starting.*service" logs/bizobs.log
```

## 📊 Monitoring and Observability

### Health Endpoints
```bash
# Basic health check
curl http://localhost:8080/health

# Detailed health information
curl http://localhost:8080/api/health/detailed | jq

# Service status overview
curl http://localhost:8080/api/admin/services/status | jq

# Port allocation status
curl http://localhost:8080/api/admin/ports | jq
```

### Performance Monitoring
```bash
# Check memory usage
ps aux | grep "node server.js" | awk '{print $4}'

# Monitor CPU usage
top -p $(cat server.pid)

# Check service count
curl -s http://localhost:8080/api/admin/services/status | jq '.runningServices'
```

## 🚀 Advanced Configuration

### Environment Variables
Key environment variables that can be customized:

```bash
# Dynatrace Configuration
export DT_SERVICE_NAME="bizobs-main-server"
export DT_APPLICATION_NAME="BizObs-CustomerJourney"
export DT_TAGS="environment=demo app=BizObs-CustomerJourney"

# Application Configuration
export NODE_ENV="production"
export BIZOBS_EXTERNAL_URL="http://your-custom-domain.com"
export COMPANY_NAME="Your Company"
export INDUSTRY_TYPE="Your Industry"
```

### Custom Journeys
Create custom customer journeys by modifying the journey configuration:

```javascript
{
  "journey": {
    "companyName": "Your Company",
    "domain": "yourcompany.com",
    "industryType": "Your Industry",
    "steps": [
      {
        "stepName": "CustomStep1",
        "serviceName": "CustomService1",
        "category": "Custom Category"
      }
    ]
  }
}
```

## 📈 Demo Scenarios

### Scenario 1: Insurance Company Demo
1. Start with PolicyDiscovery service
2. Generate quotes with multiple personas
3. Show service creation and scaling
4. Demonstrate error handling and recovery

### Scenario 2: Multi-Company Comparison
1. Create services for Company A (Insurance)
2. Create services for Company B (Retail)
3. Show service isolation and reuse
4. Compare observability data

### Scenario 3: Load Testing
1. Start background load generation
2. Simulate peak traffic scenarios
3. Monitor service performance
4. Show auto-scaling behavior

## 🔒 Security Considerations

- Default deployment runs on localhost:8080
- External access requires ace-box ingress configuration
- No authentication required for demo purposes
- Environment variables may contain sensitive data

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs in `logs/bizobs.log`
3. Verify system requirements are met
4. Ensure network connectivity is available

---

**Ready to demonstrate Dynatrace observability with realistic customer journeys!** 🎉