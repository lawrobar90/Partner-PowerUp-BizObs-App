--8<-- "snippets/2-getting-started.js"

# Getting Started

Welcome to the BizObs Journey Simulator! This guide will help you set up your environment and run your first customer journey simulation.

## 🔧 Prerequisites

Before you begin, ensure you have:

### Required
- **GitHub Account**: For accessing Codespaces
- **Dynatrace Environment**: Access to a Dynatrace tenant (SaaS or Managed)

### Recommended  
- **Basic Understanding**: Customer journeys and business processes
- **Dynatrace Knowledge**: Basic familiarity with Dynatrace observability concepts

## 🚀 Deployment Options

### Option 1: GitHub Codespaces (Recommended)

!!! tip "Fastest Setup"
    GitHub Codespaces provides a pre-configured environment with all dependencies ready to use.

#### Step 1: Launch Codespace
1. Navigate to the [BizObs Journey Simulator repository](https://github.com/lawrobar90/Partner-PowerUp-BizObs-App)
2. Click **"Code"** → **"Codespaces"** → **"Create codespace on main"**
3. Wait for the environment to initialize (2-3 minutes)

#### Step 2: Configure Dynatrace (Optional)
Set up Dynatrace integration by adding Codespace secrets:

1. In your Codespace, go to **Settings** → **Codespaces** → **Secrets**
2. Add these secrets:
   - `DYNATRACE_URL`: Your tenant URL (e.g., `https://abc12345.live.dynatrace.com`)
   - `DYNATRACE_TOKEN`: API token with trace ingestion permissions

#### Step 3: Start the Application
```bash
cd app
npm start
```

The application will be available on port 8080 with automatic port forwarding.

### Option 2: Local Installation

For local development with OneAgent installation:

#### Step 1: Install OneAgent
1. Download and install a Dynatrace OneAgent on your machine
2. Follow the [OneAgent installation guide](https://docs.dynatrace.com/docs/ingest-from/dynatrace-oneagent/installation-and-operation)

#### Step 2: Clone and Setup
```bash
git clone https://github.com/lawrobar90/Partner-PowerUp-BizObs-App.git
cd Partner-PowerUp-BizObs-App
./start-server.sh
```

Or for simple Node.js startup:
```bash
npm install
npm start
```

## 🎯 Verify Your Setup

### 1. Access the Web Interface
Open your browser to:
- **Codespaces**: Use the forwarded port 8080
- **Local**: http://localhost:8080

You should see the BizObs Journey Simulator interface.

### 2. Test Basic Functionality
1. Click **"Simulate Journey"** 
2. Select a customer persona (e.g., "Karen - Retail Customer")
3. Choose a journey type (e.g., "Insurance Policy Journey")
4. Click **"Start Simulation"**

### 3. Verify Dynatrace Integration
If OneAgent is installed, check Dynatrace for:
- **Services**: New services appearing in the Services view
- **Distributed Traces**: Journey traces with business context
- **Business Events**: Customer journey events in the Business Events dashboard

## 🔍 Understanding the Interface

### Main Dashboard
- **Journey Controls**: Start, stop, and configure simulations
- **Persona Selection**: Choose from 4 pre-built customer personas
- **Journey Templates**: Pre-configured business scenarios
- **Real-time Metrics**: Live journey success rates and performance

### Available Journeys
1. **Insurance Policy Journey**
   - Policy Discovery → Quote Generation → Selection → Payment → Activation
   
2. **E-Commerce Journey**  
   - Product Browse → Cart Addition → Checkout → Payment → Confirmation
   
3. **Banking Journey**
   - Account Inquiry → Loan Application → Credit Check → Approval → Setup

### Customer Personas
- **Karen (Retail)**: Price-conscious, mobile-first shopper
- **Raj (Insurance)**: Risk-aware professional, thorough researcher  
- **Alex (Tech)**: Innovation-focused, quick decision maker
- **Sophia (Enterprise)**: Process-oriented, compliance-focused

!!! success "Environment Ready!"
    Your BizObs Journey Simulator is now ready for business observability exploration. The next section will introduce you to the key concepts that make business observability powerful.

<div class="grid cards" markdown>
- [📚 Learn Core Concepts :octicons-arrow-right-24:](3-concepts.md)
</div>
