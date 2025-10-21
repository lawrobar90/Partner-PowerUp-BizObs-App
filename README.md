# Dynatrace Partner Power-Up: Business Observability App

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Dynatrace](https://img.shields.io/badge/Dynatrace-OneAgent-blue.svg)](https://www.dynatrace.com/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey.svg)](https://expressjs.com/)

A comprehensive business observability application demonstrating advanced distributed tracing, customer journey simulation, and business event generation for Dynatrace monitoring.

## 🚀 Features

- **Customer Journey Simulation**: Realistic multi-step customer journeys with proper trace propagation
- **Distributed Tracing**: W3C Trace Context headers with Dynatrace OneAgent integration
- **Business Context**: Rich business metadata in traces including company, domain, and customer data
- **Microservice Architecture**: Dynamic service spawning with proper service isolation
- **Business Events**: Structured business event generation for Dynatrace BizEvents
- **Multiple Simulation Types**: Single journey, multiple customers, batch processing
- **Realistic Data Generation**: Authentic customer profiles, additional fields, and trace metadata
- **Health Monitoring**: Comprehensive service health checks and status monitoring

## 🏗️ Architecture

- **Main Server** (`server.js`): Express.js application serving frontend and coordinating services
- **Journey Simulation** (`routes/journey-simulation.js`): Core business logic for customer journey processing
- **Service Manager** (`services/service-manager.js`): Dynamic microservice spawning and management
- **Dynamic Services**: Auto-generated services for different customer journey steps
- **Frontend**: HTML interfaces for testing and simulation control

## 📦 Installation

### Prerequisites

- Node.js 18+
- Dynatrace OneAgent (recommended for full observability)

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/lawrobar90/Partner-PowerUp-BizObs-App.git
   cd Partner-PowerUp-BizObs-App
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the application**:
   ```bash
   npm start
   # or
   ./start.sh
   ```

4. **Access the application**:
   - Main interface: http://localhost:4000
   - Health check: http://localhost:4000/health
   - Admin interface: http://localhost:4000/index-full.html

## 🎯 Usage

### Customer Journey Simulation

**Single Journey**:
```bash
curl -X POST http://localhost:4000/api/journey-simulation/simulate-journey \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "TechCorp",
    "domain": "techcorp.com",
    "industryType": "technology",
    "customerId": "customer_123"
  }'
```

**Multiple Customers**:
```bash
curl -X POST http://localhost:4000/api/journey-simulation/simulate-multiple-journeys \
  -H "Content-Type: application/json" \
  -d '{
    "customers": 5,
    "aiJourney": {
      "companyName": "TechCorp",
      "steps": [
        {"stepName": "Discovery"},
        {"stepName": "Consideration"},
        {"stepName": "Purchase"}
      ]
    }
  }'
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
PORT=4000
NODE_ENV=production

# Dynatrace Integration
DT_SERVICE_NAME=BizObs-MainServer
DT_APPLICATION_NAME=BizObs-CustomerJourney
DT_TAGS="app=BizObs environment=production"
```

## 🛠️ Scripts

- `npm start` / `./start.sh` - Start the application
- `./restart.sh` - Restart with health checks
- `./stop.sh` - Graceful shutdown
- `./status.sh` - Application status check

## 📋 Key Endpoints

- `POST /api/journey-simulation/simulate-journey` - Single customer journey
- `POST /api/journey-simulation/simulate-multiple-journeys` - Multiple customers
- `GET /health` - Application health
- `GET /api/admin/services/status` - Service status

## 🔍 Troubleshooting

**Port conflicts**: Use `./restart.sh` to reset port allocations

**Service startup failures**: Check logs with `tail -f logs/bizobs.log`

**Missing traces**: Verify Dynatrace OneAgent is installed and running

---

**Built for Dynatrace Partner Power-Up Program**  
Demonstrating advanced business observability and distributed tracing capabilities.
