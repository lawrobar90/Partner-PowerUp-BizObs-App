# BizObs Security Setup Guide

## ⚠️ Important Security Notice
This repository has been cleaned of sensitive information including:
- OneAgent installation scripts 
- Dynatrace API tokens and configuration files
- SSH private keys and deployment credentials
- Environment-specific configuration

## 🔧 Dynatrace Integration Setup

### Prerequisites
- Dynatrace SaaS/Managed environment 
- API access token with appropriate permissions
- OneAgent installed on target hosts

### Environment Variables Required
Set these environment variables for proper Dynatrace integration:

```bash
# Dynatrace Configuration (set these in your environment, NOT in code)
export DT_TENANT="your-tenant.live.dynatrace.com"
export DT_API_TOKEN="dt0c01.YOUR_TOKEN_HERE"

# Service Configuration  
export SERVICE_NAME="bizobs-service"
export COMPANY_NAME="your-company"
export DOMAIN="your-domain.com"
export INDUSTRY_TYPE="your-industry"
```

### OneAgent Installation
Install OneAgent using official Dynatrace documentation:
1. Log into your Dynatrace environment
2. Go to Deployment Status > Download OneAgent
3. Follow platform-specific installation instructions
4. Do NOT commit installation scripts to version control

### Application Configuration
The application automatically configures Dynatrace service detection using:
- Service names based on step names (discovery-service, purchase-service, etc.)
- Custom properties for business context
- Distributed tracing with proper span management
- Enhanced error handling with automatic trace failure marking

### Error Handling Features
- **TracedError class**: Automatically marks spans as failed in Dynatrace
- **Error propagation**: Headers communicate errors between services
- **Business events**: Failed operations emit events for observability
- **Context capture**: Comprehensive error details including correlation IDs

## 🚀 Running the Application

```bash
# Install dependencies
npm install

# Start the server
./start-server.sh
# or
npm start
```

## 📊 Observability Features

### Automatic Service Detection
- Services are automatically detected based on step names
- Each microservice runs on dedicated ports (4000-4299 range)
- Proper service topology mapping in Dynatrace

### Enhanced Error Tracking
- Exceptions automatically mark traces as failed
- Error context includes service names, journey IDs, and timestamps
- Service-to-service error propagation maintains trace integrity

### Business Context
- Journey steps mapped to business processes
- Company and industry tagging for filtering
- Custom metrics for business KPIs

## 🔒 Security Best Practices

1. **Never commit sensitive files:**
   - API tokens or credentials
   - OneAgent installation scripts
   - Environment-specific configuration
   - SSH keys or certificates

2. **Use environment variables for:**
   - Dynatrace tenant URLs
   - API tokens
   - Database connections
   - Third-party service credentials

3. **Regular security reviews:**
   - Audit git history for leaked credentials
   - Rotate API tokens periodically
   - Review .gitignore patterns

## 📚 Additional Resources

- [Dynatrace OneAgent Installation](https://docs.dynatrace.com)
- [Node.js Monitoring Setup](https://docs.dynatrace.com/docs/setup-and-configuration/setup-on-k8s)
- [Custom Service Detection](https://docs.dynatrace.com/docs/how-to-use-dynatrace/services/service-detection-and-naming)

## 🆘 Support

For questions about this setup:
1. Check Dynatrace documentation
2. Review environment variable configuration
3. Verify OneAgent installation status
4. Test service connectivity

**Note**: This application includes enhanced error handling that ensures exceptions properly mark traces as failed in Dynatrace, addressing observability gaps in distributed tracing scenarios.