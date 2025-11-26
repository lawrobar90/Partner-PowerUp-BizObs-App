# 🚀 Dynatrace BizObs Generator - Codespaces Edition

**AI-powered business observability platform with comprehensive Dynatrace integration, optimized for GitHub Codespaces deployment following the Dynatrace Enablement Framework.**

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/lawrobar90/Partner-PowerUp-BizObs-App?quickstart=1)

## 🎯 What This Application Does

The **Dynatrace BizObs Generator** transforms technical observability into business intelligence by:

- 🤖 **Generating AI-powered customer journeys** with C-suite business context analysis
- 📊 **Creating 60+ rich business metadata fields** for comprehensive observability coverage
- 🔄 **Simulating realistic user journeys** with real-time business event generation
- 📈 **Providing dashboard creation guidance** with business-friendly descriptions
- 🎯 **Integrating with Dynatrace MCP Server** for AI-powered observability queries

## 🚀 Quick Start - Choose Your Deployment

### ☁️ GitHub Codespaces (Recommended - Zero Setup)
```bash
# 1. Click the Codespaces badge above
# 2. Wait 2-3 minutes for initialization
# 3. Application auto-starts on port 8080
# 4. Configure Dynatrace: run `selectEnvironment`
```

### 🖥️ VS Code Dev Container (Local + Cloud Features)
```bash
git clone https://github.com/lawrobar90/Partner-PowerUp-BizObs-App.git
cd Partner-PowerUp-BizObs-App
code .
# Select "Reopen in Container" when prompted
```

### 🐳 Local Docker Container (Full Control)
```bash
git clone https://github.com/lawrobar90/Partner-PowerUp-BizObs-App.git
cd Partner-PowerUp-BizObs-App/.devcontainer
make start
```

## 🌟 Framework Integration

This application follows the **[Dynatrace Enablement Framework](https://dynatrace-wwse.github.io/codespaces-framework/)** providing:

- ✅ **Universal Deployment**: GitHub Codespaces, VS Code Dev Containers, local Docker
- ✅ **Automated Setup**: Post-create hooks and comfort functions  
- ✅ **MCP Server Integration**: AI-powered observability queries
- ✅ **Standardized Environment**: Consistent across all deployment types
- ✅ **Self-Service Documentation**: Built-in guidance and examples

## 🔧 Dynatrace Configuration

### Quick Environment Setup
```bash
# Use the comfort function to select your environment
selectEnvironment

# Options:
# 1) Playground (wkf10640.apps.dynatrace.com) - Default
# 2) Demo Live (demo.live.dynatrace.com)  
# 3) TacoCorp (tacocorp.live.dynatrace.com)
# 4) Custom Environment
```

### GitHub Codespaces Secrets
Configure in your GitHub repository settings → Secrets → Codespaces:

| Secret | Description | Example |
|--------|-------------|---------|
| `DT_ENVIRONMENT` | Dynatrace tenant URL | `https://abc12345.live.dynatrace.com` |
| `DT_INGEST_TOKEN` | Data ingestion token | `dt0c01.*****` |
| `DT_OPERATOR_TOKEN` | Kubernetes operator token | `dt0c01.*****` |

## 🤖 MCP Server Integration

**Dynatrace MCP Server** provides AI-powered observability:

### Setup Steps:
1. **Auto-installed** in Codespaces (dynatrace-oss.dynatrace-mcp extension)
2. **Configure environment**: Run `selectEnvironment`  
3. **Start MCP server**: Extensions → MCP Servers → dynatrace-mcp-server → Start
4. **Authenticate**: Follow SSO link in output
5. **Start chatting**: Ask "What can I do with my Dynatrace MCP server?"

### Example Prompts:
- "Show me error logs from the payment service"
- "Write a DQL query for checkout performance in the last hour"
- "Investigate high database response times"
- "Send incident notification to team@company.com"

## 📊 Business Observability Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript/HTML/CSS + Tailwind CSS (3,676-line SPA)
- **Backend**: Node.js Express + Socket.IO for real-time communication  
- **Observability**: Dynatrace BizEvents, distributed tracing, service entities
- **AI Integration**: Dual-prompt system (C-suite + journey generation)
- **Storage**: LocalStorage with comprehensive save/load functionality

### Data Flow
```
AI Prompts → Business Context → Journey Generation → 
60+ Metadata Fields → Real-time Simulation → 
BizEvents/Traces → Dynatrace → Dashboard Insights
```

### Key Features
- **Dual AI Prompts**: C-suite analysis before journey generation
- **60+ Business Fields**: Customer segments, revenue impact, operational metrics
- **Real-time Simulations**: Multi-step journeys with business context
- **Dashboard Guidance**: 8 business-friendly dashboard descriptions
- **Save/Load**: Complete form state persistence

## 🎯 Use Cases & Demo Scenarios

### Sales Enablement
- **Customer Presentations**: One-click deployment for prospect meetings
- **ROI Demonstrations**: Show business impact of technical metrics
- **Competitive Differentiation**: AI-powered observability capabilities

### Partner Enablement  
- **Training Delivery**: Standardized demo environments
- **Certification Programs**: Hands-on business observability learning
- **Solution Development**: Rapid prototyping platform

### Technical Demonstrations
- **Business Context**: Technical metrics → business impact translation
- **AI Integration**: MCP Server capabilities showcase
- **Real-time Analytics**: Live business event generation

## 🛠️ Development & Customization

### Available Commands
```bash
# Quick setup guide
./quick-setup.sh

# Start application
npm start

# Development with debugging  
npm run dev

# Select environment
selectEnvironment

# View application logs
tail -f logs/*.log

# Helpful aliases (auto-configured)
bizobs    # npm start
setup     # ./quick-setup.sh  
env       # selectEnvironment
logs      # tail -f logs/*.log
```

### Environment Configuration
Edit `.devcontainer/runlocal/.env`:
```bash
# Dynatrace Configuration
DT_ENVIRONMENT=https://your-tenant.live.dynatrace.com
DT_INGEST_TOKEN=your_token_here

# Application Features
BIZEVENTS_ENABLED=true
JOURNEY_SIMULATION_ENABLED=true  
DASHBOARD_AUTO_GENERATE=true

# Debug Settings
DEBUG=bizobs:*
```

## 📚 Framework Documentation

- **[Dynatrace Enablement Framework](https://dynatrace-wwse.github.io/codespaces-framework/)**: Complete deployment patterns
- **[MCP Server Guide](https://github.com/dynatrace-oss/dynatrace-mcp)**: AI integration documentation  
- **[GitHub Codespaces](https://docs.github.com/en/codespaces)**: Platform documentation

## 🔍 Troubleshooting

### Common Issues
- **Port conflicts**: App tries 8080, 8081, 8082 automatically
- **MCP Server**: Restart if environment changes (`Extensions → Restart Server`)
- **Secrets**: Verify GitHub Codespaces secrets are configured

### Getting Help
1. Run `./quick-setup.sh` for guided setup
2. Check logs with `tail -f logs/*.log`  
3. Use MCP Server AI agent for observability questions
4. Reference [framework documentation](https://dynatrace-wwse.github.io/codespaces-framework/)

## 🤝 Contributing & Customization

Perfect for:
1. **Custom Journey Templates**: Add industry-specific scenarios
2. **Enhanced Metadata**: Extend the 60+ business fields
3. **Dashboard Templates**: Create new business-friendly descriptions
4. **Integration Examples**: Add more Dynatrace API usage

## 📝 Framework Compliance

This application demonstrates:
- ✅ **Universal Base Image**: Multi-architecture support
- ✅ **Separation of Concerns**: Modular design
- ✅ **Automated Testing**: CI/CD integration ready
- ✅ **Monitoring & Analytics**: Built-in observability  
- ✅ **Self-Service Documentation**: Comprehensive guidance

---

**🎯 Ready to demonstrate comprehensive business observability?**

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/lawrobar90/Partner-PowerUp-BizObs-App?quickstart=1)

*Powered by the [Dynatrace Enablement Framework](https://dynatrace-wwse.github.io/codespaces-framework/) • Framework Version 2024.11*