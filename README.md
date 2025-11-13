# 🚀 Partner PowerUp BizObs - Business Observability Engine

A comprehensive business observability application optimized for Dynatrace ACE-Box demo environments.

## ⚡ Quick Start

## Install OneAgent 
- Install a Dynatrace OneAgent on your machine where you are installing the BizObs application
- See Documentation here for a guide of deployment methods:
- https://docs.dynatrace.com/docs/ingest-from/dynatrace-oneagent/installation-and-operation

In a terminal - Git/Powershell etc
- Download this BizObs repository, and change directory to where the start-server.sh is located

- Run the complete BizObs application with a single command:
```bash
./start-server.sh
```

## Add configuration to Dynatrace Tenant
Follow this guide
https://github.com/lawrobar90/Partner-PowerUp-BizObs-App/blob/main/DynatraceConfig.md

## 🌐 Access URLs

- **Local**: http://localhost:8080/

## 🎯 Key Features

- **Customer Journey Simulation**: Multi-step business process simulation
- **Multi-persona Load Generation**: Realistic customer behavior patterns  
- **Dynatrace Integration**: Full metadata injection and observability
- **Real-time Monitoring**: Live metrics and health endpoints
- **Error Simulation**: Configurable failure scenarios for demos

## 🏗️ Architecture

- **Main Server**: Port 8080 with full web interface
- **Child Services**: Dynamic service creation on ports 8081-8094
- **Kubernetes Ingress**: External routing via ingress controller
- **Health Monitoring**: Comprehensive service health tracking

## 🔧 Management Commands

```bash
./start-server.sh    # Complete startup with ingress deployment
./status.sh          # Detailed status report
./stop.sh            # Stop all services
./restart.sh         # Restart application
```

## 📊 Demo Scenarios

### Insurance Journey Example
PolicyDiscovery → QuoteGeneration → PolicySelection → PaymentProcessing → PolicyActivation → OngoingEngagement

### Customer Personas
- **Karen (Retail)**: Price-conscious shopper
- **Raj (Insurance)**: Risk-aware professional  
- **Alex (Tech)**: Innovation-focused buyer
- **Sophia (Enterprise)**: Process-oriented decision maker

## 🛠️ Technical Stack

- **Runtime**: Node.js v22+ with Express.js
- **Observability**: Dynatrace metadata injection (13 headers)
- **Load Balancing**: NGINX with upstream configuration
- **Process Management**: Native Node.js with health checks
- **Ingress**: Kubernetes ingress for external access

## 📁 Project Structure

```
├── server.js              # Main application server
├── start-server.sh        # Complete startup script
├── routes/                # API route handlers
├── services/              # Business logic services
├── middleware/            # Dynatrace and observability middleware
├── scripts/               # Utility and simulation scripts
├── k8s/                   # Kubernetes ingress configuration
├── nginx/                 # NGINX load balancer configuration
└── logs/                  # Application logs
```

## 🎭 Ready for Demos

This application is specifically designed for Dynatrace customer journey demonstrations with full observability integration and realistic business scenarios.

For detailed usage instructions, see [START-SERVER-GUIDE.md](START-SERVER-GUIDE.md).
For deployment details, see [DEPLOYMENT-SUMMARY.md](DEPLOYMENT-SUMMARY.md).
For repository clone tracking, see [TRACKING-CLONES.md](TRACKING-CLONES.md).

- **Main Server** (`server.js`): Express.js application serving frontend and coordinating services
- **Journey Simulation** (`routes/journey-simulation.js`): Core business logic for customer journey processing
- **Service Manager** (`services/service-manager.js`): Dynamic microservice spawning and management
- **Dynamic Services**: Auto-generated services for different customer journey steps
- **Frontend**: HTML interfaces for testing and simulation control


---

**Built for Dynatrace Partner Power-Up Program**  
Demonstrating advanced business observability and distributed tracing capabilities.
