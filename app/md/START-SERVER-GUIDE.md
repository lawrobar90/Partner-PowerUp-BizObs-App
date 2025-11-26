# BizObs Start Server - Usage Guide

## 🚀 Quick Start

Run the complete BizObs application with a single command:

```bash
./start-server.sh
```

## 📋 What the Script Does

The `start-server.sh` script handles everything automatically:

1. **📂 Project Setup**: Detects if running from existing project directory or clones fresh from GitHub
2. **🧹 Cleanup**: Stops existing processes and frees ports
3. **📦 Dependencies**: Installs/updates npm packages
4. **🔧 Permissions**: Makes all scripts executable
5. **📡 Ingress**: Deploys Kubernetes ingress for external access
6. **🏗️ Environment**: Configures Dynatrace metadata and observability
7. **🚀 Server**: Starts BizObs with full health monitoring
8. **✅ Verification**: Tests local and external access

## 🌐 Access URLs After Startup

- **External**: http://bizobs.c469ba93-51c8-40eb-979d-1c9075a148a0.dynatrace.training/
- **Local**: http://localhost:8080/

## 🔧 Script Options

### Follow Logs
```bash
./start-server.sh --follow-logs
```
Starts the server and shows real-time logs (Ctrl+C to exit log view)

### Environment Variables
You can customize behavior by setting these before running:

```bash
export FORCE_CLONE=true    # Force fresh git clone
export DRY_RUN=true       # Test setup without starting server
```

## 🎯 Script Features

### ✅ Automatic Detection
- Detects if you're already in the project directory
- Updates existing repo or clones fresh as needed
- Handles different base directories automatically

### 🧹 Smart Cleanup
- Kills existing BizObs processes safely
- Frees ports 8080-8094 if occupied
- Cleans up stale PID files

### 🔗 Full Integration
- Deploys Kubernetes ingress automatically
- Configures Dynatrace metadata injection
- Sets up child services (Discovery, Purchase, DataPersistence)
- Verifies health endpoints

### 📊 Health Monitoring
- Waits for server startup (15 second timeout)
- Verifies all child services are running
- Tests both local and external connectivity
- Reports service health status

## 🔄 Management Commands

After startup, use these commands:

```bash
./status.sh    # Check detailed status
./stop.sh      # Stop all services
./restart.sh   # Restart application
tail -f logs/bizobs.log  # View logs
```

## 🎭 Demo Ready Features

After startup, your BizObs app includes:

- **Customer Journey Simulation**: Insurance, retail, tech, and enterprise personas
- **Multi-step Journeys**: PolicyDiscovery → QuoteGeneration → PolicySelection → PaymentProcessing → PolicyActivation → OngoingEngagement
- **Dynatrace Integration**: 13 metadata headers per request
- **Load Generation**: Realistic multi-persona traffic simulation
- **Real-time Monitoring**: Live metrics and observability

## 🚨 Troubleshooting

### Server Won't Start
```bash
# Check logs
tail -20 logs/bizobs.log

# Verify ports are free
lsof -i:8080

# Check process status
./status.sh
```

### External Access Issues
```bash
# Verify ingress
kubectl get ingress bizobs-ingress

# Test local connectivity first
curl http://localhost:8080/health
```

### Permission Issues
```bash
# Fix script permissions
chmod +x *.sh scripts/*.sh
```

## 🎯 Perfect for Demos

This single script gets your entire BizObs application ready for customer journey demonstrations with full Dynatrace observability integration!