# 🚀 Partner PowerUp BizObs - Business Observability Engine

A comprehensive business observability application optimized for Dynatrace ACE-Box demo environments.

## ⚡ Quick Start

Run the complete BizObs application with a single command:

```bash
./start-server.sh
```

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
