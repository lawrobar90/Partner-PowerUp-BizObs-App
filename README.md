# Partner PowerUp BizObs

A comprehensive **Business Observability** application designed for Dynatrace demonstrations and partner training. This application simulates real-world customer journeys with distributed microservices architecture, featuring a Smartscape-inspired UI and intelligent journey generation capabilities.

## Overview

The Partner PowerUp BizObs app is a sophisticated demonstration platform that showcases Dynatrace's business observability capabilities through:

- **Dynamic Customer Journey Generation**: AI-powered journey creation with real-world context
- **Distributed Microservices Architecture**: Dynamic service spawning based on journey steps
- **Real-time Event Simulation**: WebSocket-based business event streaming
- **Dynatrace Integration**: Built-in tagging and service flow optimization for observability
- **Modern Web Interface**: Smartscape-inspired dark theme with animated visualizations

## Key Features

### 🎯 Journey Generation & Simulation
- **AI-Enhanced Journey Creation**: Leverages Vertex AI (Gemini) or Perplexity API for context-aware journey generation
- **Industry-Specific Templates**: Pre-built journeys for retail, travel, banking, and general business scenarios
- **Custom Journey Support**: Flexible step definition with custom business logic
- **Real-time Simulation**: Live event streaming with WebSocket connections

### 🏗️ Microservices Architecture
- **Dynamic Service Management**: Automatic service spawning based on journey requirements
- **Distributed Processing**: Each journey step runs in its dedicated service process
- **Service Discovery**: Built-in service registry and health monitoring
- **Graceful Scaling**: On-demand service creation and cleanup

### 📊 Business Observability
- **Comprehensive Metrics**: Grail-style business metrics collection
- **Event Tracking**: User interactions, costs, NPS scores, and journey progression
- **Correlation IDs**: Full distributed tracing support across all services
- **Custom Tagging**: Dynatrace-optimized service and application tagging

### 🎨 User Interface
- **Smartscape-Inspired Design**: Dark theme with glowing nodes and animated connectors
- **Interactive Journey Visualization**: Real-time step progression and status updates
- **Company Filtering Helpers**: Built-in Dynatrace tag suggestions and filters
- **Responsive Design**: Optimized for various screen sizes and devices

## Architecture

### Core Components

1. **Main Server** (`server.js`): Express.js application serving the web interface and API endpoints
2. **Service Manager** (`services/service-manager.js`): Dynamic microservice lifecycle management
3. **Journey Service** (`services/journeyService.js`): AI-powered journey generation and templates
4. **Event Service** (`services/eventService.js`): Real-time event processing and WebSocket handling
5. **Metrics Service** (`services/metricsService.js`): Business metrics collection and aggregation

### API Endpoints

- `POST /api/journey/generateJourney` - Generate custom customer journeys
- `POST /api/simulate` - Execute journey simulation with real-time events
- `GET /api/metrics` - Retrieve business metrics and KPIs
- `GET /api/health` - Service health and status monitoring
- `POST /api/admin/reset-ports` - Administrative service management

### Dynamic Services

The application automatically creates dedicated microservices for each journey step:
- **Discovery Service**: Product/service discovery and search
- **Authentication Service**: User login and verification
- **Checkout Service**: Payment processing and order management
- **Fulfillment Service**: Order processing and logistics
- **Support Service**: Customer service and issue resolution
- **Feedback Service**: NPS collection and customer satisfaction

## Installation & Setup

### Prerequisites
- **Node.js 18+**
- **npm** (comes with Node.js)

### Basic Installation

```bash
cd partner-powerup-bizobs
npm install --production
npm start
```

Access the application at `http://YOUR_SERVER_IP:4000`

### Development Mode

```bash
npm run dev
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `4000` |
| `AI_PROVIDER` | AI service provider (`vertex` or `perplexity`) | - |
| `GCLOUD_PROJECT` | Google Cloud project for Vertex AI | - |
| `VERTEX_LOCATION` | Vertex AI region | `us-central1` |
| `VERTEX_MODEL` | Vertex AI model | `gemini-1.5-pro-001` |
| `PPLX_API_KEY` | Perplexity API key (fallback) | - |
| `APP_DOMAIN_LABEL` | Custom domain label for UI | - |

### AI Configuration Priority

1. **Vertex AI** (when `AI_PROVIDER=vertex` and `GCLOUD_PROJECT` are set)
2. **Perplexity API** (when `PPLX_API_KEY` is provided)
3. **Deterministic Templates** (fallback for offline/demo scenarios)

## Dynatrace Integration

### Service Tagging Strategy

The application implements Dynatrace-optimized tagging for enhanced observability:

```javascript
// Automatic service tags
company=YourCompanyName
app=BizObs-CustomerJourney
service=DiscoveryService
journey_step=product_discovery
region=us-east-1
```

### Business Event Tracking

All customer interactions generate structured business events:

```json
{
  "userId": "uuid",
  "email": "customer@example.com",
  "correlationId": "trace-uuid",
  "journeyStep": "checkout",
  "cost": 99.99,
  "nps": 8,
  "timestamp": "2025-10-06T12:00:00Z",
  "metadata": {
    "industry": "retail",
    "region": "north-america"
  }
}
```

## Usage Examples

### Generate a Retail Journey

```javascript
POST /api/journey/generateJourney
{
  "customer": "TechCorp Electronics",
  "region": "North America",
  "journeyType": "E-commerce Purchase",
  "website": "https://techcorp.example.com",
  "details": "Focus on premium electronics with subscription services"
}
```

### Simulate Journey Events

```javascript
POST /api/simulate
{
  "stepName": "Product Discovery",
  "substeps": [
    {
      "stepName": "Search Products",
      "description": "Customer searches for laptops",
      "expectedDuration": "2-3 minutes"
    }
  ]
}
```

## Development & Customization

### Adding Custom Journey Steps

1. Define step in `services/journeyService.js`
2. Create corresponding service handler in `services/`
3. Update service manager routing
4. Add UI visualization components

### Custom Metrics Integration

Extend the metrics service to collect custom business KPIs:

```javascript
// In routes/metrics.js
const customMetrics = {
  conversionRate: calculateConversionRate(),
  averageOrderValue: calculateAOV(),
  customerLifetimeValue: calculateCLV()
};
```

## Monitoring & Health Checks

- **Health Endpoint**: `GET /api/health` - Service status and child process monitoring
- **Service List**: `GET /api/admin/services` - Active microservices inventory
- **Metrics**: `GET /api/metrics` - Business and technical metrics

## Support & Troubleshooting

### Common Issues

1. **Service Port Conflicts**: Use `POST /api/admin/reset-ports` to cleanup
2. **AI Service Unavailable**: Application falls back to deterministic templates
3. **WebSocket Connection**: Check firewall settings for real-time features

### Logs & Debugging

- Server logs show detailed request/response information
- Child service logs available in individual process outputs
- Correlation IDs enable distributed tracing across all components

## License

This application is designed for Dynatrace partner demonstrations and training purposes.
