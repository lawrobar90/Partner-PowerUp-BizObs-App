# Partner PowerUp BizObs Application# Partner PowerUp BizObs



## 🎯 OverviewA comprehensive **Business Observability** application designed for Dynatrace demonstrations and partner training. This application simulates real-world customer journeys with distributed microservices architecture, featuring a Smartscape-inspired UI and intelligent journey generation capabilities.



**Partner PowerUp BizObs** is a sophisticated microservices simulation platform designed for Dynatrace demonstrations, combining AI-powered customer journey generation with comprehensive business observability.## Overview



### 🚀 Key FeaturesThe Partner PowerUp BizObs app is a sophisticated demonstration platform that showcases Dynatrace's business observability capabilities through:



- **AI-Powered Journey Generation**: Generate realistic customer journeys using Copilot integration- **Dynamic Customer Journey Generation**: AI-powered journey creation with real-world context

- **Dynamic Microservices Simulation**: Real-time service creation and orchestration- **Distributed Microservices Architecture**: Dynamic service spawning based on journey steps

- **Business Event Capture**: OneAgent integration for complete observability- **Real-time Event Simulation**: WebSocket-based business event streaming

- **Load Testing Capabilities**: Multiple customer simulation support- **Dynatrace Integration**: Built-in tagging and service flow optimization for observability

- **Demo-Ready Interface**: Perfect for customer demonstrations and training- **Modern Web Interface**: Smartscape-inspired dark theme with animated visualizations



## 📋 Prerequisites## Key Features



Before installing the BizObs application, ensure you have the following:### 🎯 Journey Generation & Simulation

- **AI-Enhanced Journey Creation**: Leverages Vertex AI (Gemini) or Perplexity API for context-aware journey generation

### System Requirements- **Industry-Specific Templates**: Pre-built journeys for retail, travel, banking, and general business scenarios

- **Operating System**: Ubuntu 20.04+ or Amazon Linux 2- **Custom Journey Support**: Flexible step definition with custom business logic

- **Memory**: Minimum 2GB RAM (4GB recommended)- **Real-time Simulation**: Live event streaming with WebSocket connections

- **Storage**: At least 2GB free disk space

- **Network**: Internet connectivity for package downloads### 🏗️ Microservices Architecture

- **Dynamic Service Management**: Automatic service spawning based on journey requirements

### Required Software- **Distributed Processing**: Each journey step runs in its dedicated service process

- **Node.js**: Version 18.x or higher- **Service Discovery**: Built-in service registry and health monitoring

- **npm**: Version 8.x or higher (included with Node.js)- **Graceful Scaling**: On-demand service creation and cleanup

- **Git**: For cloning the repository

### 📊 Business Observability

### Optional (For Business Events)- **Comprehensive Metrics**: Grail-style business metrics collection

- **Dynatrace OneAgent**: For business event capture and observability- **Event Tracking**: User interactions, costs, NPS scores, and journey progression

- **Correlation IDs**: Full distributed tracing support across all services

## 🛠️ Installation Instructions- **Custom Tagging**: Dynatrace-optimized service and application tagging



### Step 1: Clone the Repository### 🎨 User Interface

- **Smartscape-Inspired Design**: Dark theme with glowing nodes and animated connectors

```bash- **Interactive Journey Visualization**: Real-time step progression and status updates

# Clone the repository- **Company Filtering Helpers**: Built-in Dynatrace tag suggestions and filters

git clone https://github.com/lawrobar90/Partner-PowerUp-BizObs-App.git- **Responsive Design**: Optimized for various screen sizes and devices



# Navigate to the project directory## Architecture

cd Partner-PowerUp-BizObs-App/partner-powerup-bizobs

```### Core Components



### Step 2: Install Node.js (if not already installed)1. **Main Server** (`server.js`): Express.js application serving the web interface and API endpoints

2. **Service Manager** (`services/service-manager.js`): Dynamic microservice lifecycle management

**For Amazon Linux 2:**3. **Journey Service** (`services/journeyService.js`): AI-powered journey generation and templates

```bash4. **Event Service** (`services/eventService.js`): Real-time event processing and WebSocket handling

# Install Node.js 18.x5. **Metrics Service** (`services/metricsService.js`): Business metrics collection and aggregation

curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -

sudo yum install -y nodejs### API Endpoints



# Verify installation- `POST /api/journey/generateJourney` - Generate custom customer journeys

node --version- `POST /api/simulate` - Execute journey simulation with real-time events

npm --version- `GET /api/metrics` - Retrieve business metrics and KPIs

```- `GET /api/health` - Service health and status monitoring

- `POST /api/admin/reset-ports` - Administrative service management

**For Ubuntu:**

```bash### Dynamic Services

# Install Node.js 18.x

curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -The application automatically creates dedicated microservices for each journey step:

sudo apt-get install -y nodejs- **Discovery Service**: Product/service discovery and search

- **Authentication Service**: User login and verification

# Verify installation- **Checkout Service**: Payment processing and order management

node --version- **Fulfillment Service**: Order processing and logistics

npm --version- **Support Service**: Customer service and issue resolution

```- **Feedback Service**: NPS collection and customer satisfaction



### Step 3: Install Application Dependencies## Installation & Setup



```bash### Prerequisites

# Install all required npm packages- **Node.js 18+**

npm install- **npm** (comes with Node.js)



# This will create node_modules/ directory with all dependencies### Basic Installation

```

```bash

### Step 4: Configure Environment (Optional)cd partner-powerup-bizobs

npm install --production

```bashnpm start

# Copy environment template (if needed)```

cp .env.example .env

Access the application at `http://YOUR_SERVER_IP:4000`

# Edit configuration file (optional)

nano .env### Development Mode

```

```bash

### Step 5: Verify Installationnpm run dev

```

```bash

# Test the application## Configuration

npm start

### Environment Variables

# You should see output similar to:

# Server running on port 4000| Variable | Description | Default |

# Dynamic services ready|----------|-------------|---------|

# Application accessible at http://localhost:4000| `PORT` | Server port | `4000` |

```| `AI_PROVIDER` | AI service provider (`vertex` or `perplexity`) | - |

| `GCLOUD_PROJECT` | Google Cloud project for Vertex AI | - |

### Step 6: Access the Application| `VERTEX_LOCATION` | Vertex AI region | `us-central1` |

| `VERTEX_MODEL` | Vertex AI model | `gemini-1.5-pro-001` |

Open your web browser and navigate to:| `PPLX_API_KEY` | Perplexity API key (fallback) | - |

```| `APP_DOMAIN_LABEL` | Custom domain label for UI | - |

http://localhost:4000

```### AI Configuration Priority



## 🎮 Quick Start Guide1. **Vertex AI** (when `AI_PROVIDER=vertex` and `GCLOUD_PROJECT` are set)

2. **Perplexity API** (when `PPLX_API_KEY` is provided)

### Basic Usage3. **Deterministic Templates** (fallback for offline/demo scenarios)



1. **Launch the Application**## Dynatrace Integration

   ```bash

   cd Partner-PowerUp-BizObs-App/partner-powerup-bizobs### Service Tagging Strategy

   npm start

   ```The application implements Dynatrace-optimized tagging for enhanced observability:



2. **Generate a Customer Journey**```javascript

   - Open http://localhost:4000 in your browser// Automatic service tags

   - Use the AI prompt to generate a customer scenariocompany=YourCompanyName

   - Configure the number of customers for simulationapp=BizObs-CustomerJourney

service=DiscoveryService

3. **Run Simulation**journey_step=product_discovery

   - Click "Simulate Journey" for single customerregion=us-east-1

   - Use "Multiple Customers" for load testing```

   - Monitor real-time execution in the interface

### Business Event Tracking

4. **View Results**

   - Check the browser console for detailed logsAll customer interactions generate structured business events:

   - Monitor Dynatrace (if OneAgent is installed) for business events

   - Review service interactions and performance metrics```json

{

## 🔧 Advanced Configuration  "userId": "uuid",

  "email": "customer@example.com",

### Production Deployment  "correlationId": "trace-uuid",

  "journeyStep": "checkout",

For production environments, consider using PM2:  "cost": 99.99,

  "nps": 8,

```bash  "timestamp": "2025-10-06T12:00:00Z",

# Install PM2 globally  "metadata": {

npm install -g pm2    "industry": "retail",

    "region": "north-america"

# Start with PM2  }

pm2 start ecosystem.config.json}

```

# Save PM2 configuration

pm2 save## Usage Examples



# Setup auto-startup### Generate a Retail Journey

pm2 startup

``````javascript

POST /api/journey/generateJourney

### Firewall Configuration{

  "customer": "TechCorp Electronics",

Ensure port 4000 is open:  "region": "North America",

  "journeyType": "E-commerce Purchase",

```bash  "website": "https://techcorp.example.com",

# For systems with ufw  "details": "Focus on premium electronics with subscription services"

sudo ufw allow 4000}

```

# For AWS EC2, configure Security Group to allow:

# - Type: Custom TCP### Simulate Journey Events

# - Port: 4000

# - Source: 0.0.0.0/0 (or specific IPs)```javascript

```POST /api/simulate

{

### Dynatrace Integration  "stepName": "Product Discovery",

  "substeps": [

1. **Install OneAgent** (Optional but recommended):    {

   ```bash      "stepName": "Search Products",

   # Download OneAgent installer      "description": "Customer searches for laptops",

   wget -O Dynatrace-OneAgent.sh "https://YOUR_ENVIRONMENT_ID.live.dynatrace.com/api/v1/deployment/installer/agent/unix/default/latest?arch=x86&flavor=default" --header="Authorization: Api-Token YOUR_PAAS_TOKEN"      "expectedDuration": "2-3 minutes"

       }

   # Install OneAgent  ]

   sudo /bin/sh Dynatrace-OneAgent.sh}

   ``````



2. **Configure Business Events**: The application automatically sends business events to OneAgent if installed.## Development & Customization



## 📁 Project Structure### Adding Custom Journey Steps



```1. Define step in `services/journeyService.js`

partner-powerup-bizobs/2. Create corresponding service handler in `services/`

├── package.json              # Dependencies and scripts3. Update service manager routing

├── server.js                 # Main application server4. Add UI visualization components

├── ecosystem.config.json     # PM2 configuration

├── public/                   # Frontend files### Custom Metrics Integration

│   └── index.html           # Main application interface

├── routes/                  # API endpointsExtend the metrics service to collect custom business KPIs:

│   ├── journey-simulation.js # Core simulation logic

│   ├── config.js           # Configuration management```javascript

│   └── ...                 # Other route handlers// In routes/metrics.js

├── services/               # Business logicconst customMetrics = {

│   ├── dynamic-step-service.cjs # Service orchestration  conversionRate: calculateConversionRate(),

│   ├── .dynamic-runners/   # Auto-generated service runners  averageOrderValue: calculateAOV(),

│   └── ...                # Core services  customerLifetimeValue: calculateCLV()

├── scripts/               # Utility scripts};

└── config/               # Configuration files```

```

## Monitoring & Health Checks

## 🐛 Troubleshooting

- **Health Endpoint**: `GET /api/health` - Service status and child process monitoring

### Common Issues- **Service List**: `GET /api/admin/services` - Active microservices inventory

- **Metrics**: `GET /api/metrics` - Business and technical metrics

**Port Already in Use:**

```bash## Support & Troubleshooting

# Find process using port 4000

sudo lsof -i :4000### Common Issues



# Kill the process1. **Service Port Conflicts**: Use `POST /api/admin/reset-ports` to cleanup

sudo kill -9 <PID>2. **AI Service Unavailable**: Application falls back to deterministic templates

```3. **WebSocket Connection**: Check firewall settings for real-time features



**Permission Errors:**### Logs & Debugging

```bash

# Fix npm permissions- Server logs show detailed request/response information

sudo chown -R $(whoami) ~/.npm- Child service logs available in individual process outputs

```- Correlation IDs enable distributed tracing across all components



**Module Not Found:**## License

```bash

# Reinstall dependenciesThis application is designed for Dynatrace partner demonstrations and training purposes.

rm -rf node_modules package-lock.json
npm install
```

### Logs and Debugging

- **Application Logs**: Check `server.log` in the project directory
- **Console Output**: Monitor the terminal where you ran `npm start`
- **Browser Console**: Check browser developer tools for frontend issues

## 🎯 Use Cases

### For Dynatrace Demonstrations
- **Business Observability**: Show complete customer journey visibility
- **Distributed Tracing**: Demonstrate service dependencies
- **Real User Monitoring**: Correlate business and technical metrics
- **Problem Detection**: Showcase anomaly detection in business processes

### For Load Testing
- **Scalability Testing**: Multiple concurrent customer journeys
- **Performance Baselines**: Establish normal operation patterns
- **Stress Testing**: Validate system limits and behaviors

### For Training
- **Hands-on Learning**: Interactive business observability concepts
- **Scenario Building**: Create custom demo scenarios
- **Integration Testing**: Validate Dynatrace configurations

## 🔄 Updates and Maintenance

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm install

# Restart application
npm start
```

### Backup Configuration

```bash
# Backup your configuration
cp -r partner-powerup-bizobs/ partner-powerup-bizobs-backup/
```

## 🤝 Support

For issues, questions, or contributions:

1. Check the troubleshooting section above
2. Review application logs for error details
3. Ensure all prerequisites are properly installed
4. Verify network connectivity and firewall settings

## 📄 License

This project is part of the Dynatrace Partner PowerUp program and is intended for demonstration and training purposes.

---

**Happy Simulating! 🚀**