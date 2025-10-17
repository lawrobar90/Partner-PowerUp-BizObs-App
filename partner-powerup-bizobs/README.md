# Partner PowerUp BizObs App

A comprehensive Business Observability application for customer journey simulation and monitoring with Dynatrace integration. Perfect for demonstrating end-to-end customer journey tracking, service decomposition, and observability best practices.

## 🚀 Quick Start

### One-Command Deployment (New EC2 Instance)

```bash
git clone https://github.com/lawrobar90/Partner-PowerUp-BizObs-App.git
cd Partner-PowerUp-BizObs-App
chmod +x deploy.sh
./deploy.sh
```

### Simple Start/Stop Commands

```bash
# Start the application
./start.sh

# Stop the application  
./stop.sh

# Check status
./status.sh

# Restart
./restart.sh
```

## 🎯 What This App Does

- **Multi-Company Journey Simulation**: Simulate customer journeys for different companies with isolated services
- **Dynamic Service Architecture**: Services auto-start on demand with intelligent port management
- **Real-time Journey Tracking**: Live monitoring of customer journey progress via Socket.IO
- **Dynatrace Integration**: Full observability with distributed tracing and service tagging
- **High Availability Design**: Automatic service recovery and port conflict resolution

## Run
- Node.js 18+

```bash
cd partner-powerup-bizobs
npm install --production
npm start
```

Open http://YOUR_SERVER_IP:4000

## Env
- PORT (default 4000)
- PPLX_API_KEY (optional) — Perplexity API key to enable web-researched journeys
 - AI_PROVIDER=vertex to enable Gemini via Vertex AI (with Google Search grounding)
 - GCLOUD_PROJECT, VERTEX_LOCATION (default us-central1), VERTEX_MODEL (default gemini-1.5-pro-001)
 - Perplexity fallback: PPLX_API_KEY (optional)

## Notes
- AI call uses Perplexity (if PPLX_API_KEY is set) to research the web and produce a 6-step journey. If not set, a deterministic mock is returned.
 - AI call prefers Vertex AI Gemini with Google Search grounding when AI_PROVIDER=vertex and GCLOUD_PROJECT are set. If not configured, it falls back to Perplexity (when PPLX_API_KEY is set), else to the deterministic mock.
- OneAgent/Grail integration hooks can be added where events are recorded and emitted.
