# Multi-Project Development Repository# Dynatrace Vegas Casino



This repository contains multiple applications and projects for development and testing purposes.A sophisticated Node.js casino application featuring a Dynatrace Smartscape-inspired aesthetic with real-time telemetry, immersive gaming experiences, and comprehensive analytics.



## 📁 Project Structure## 🎯 Features



```### 🎰 Games

/- **Quantum Slots**: Advanced probability matrices with weighted symbol generation

├── vegas-casino/              # Dynatrace Vegas Casino Application- **Cosmic Roulette**: Animated spinning wheel with comprehensive betting options

│   ├── server.js             # Main Express server- **Neural Dice**: Probability prediction engine with strategy recommendations

│   ├── package.json          # Dependencies- **Quantum Blackjack**: Multi-turn gameplay with AI-powered strategy advisor

│   ├── public/               # Frontend assets

│   ├── services/             # Game services### 📊 Analytics & Monitoring

│   ├── scripts/              # Deployment scripts- **Real-time Metrics**: WebSocket-based live updates

│   ├── docs/                 # Documentation- **Player Analytics**: Detailed behavior tracking and statistics  

│   └── README.md             # Vegas Casino documentation- **System Health Monitoring**: CPU, memory, response time tracking

├── .git/                     # Git repository- **Leaderboard System**: Competitive rankings with animated charts

├── .gitignore               # Global gitignore- **Comprehensive Telemetry**: Correlation IDs and structured logging

└── README.md                # This file- **Dynatrace Integration**: OneAgent monitoring and BizEvents

```- **Service Splitting**: Microservice architecture for observability

- **Business Events**: Custom business metrics and KPI tracking

## 🎰 Vegas Casino Application

### 🎨 Visual Design

A sophisticated Node.js casino application featuring a Dynatrace Smartscape-inspired aesthetic with real-time telemetry, immersive gaming experiences, and comprehensive analytics.- **Dynatrace Color Palette**: Purple, cyan, green, and yellow theme

- **Dark Theme**: Professional observability aesthetic

**Location**: `./vegas-casino/`- **Neon Accents**: Glowing UI elements and animations

- **GSAP Animations**: Smooth transitions and interactive effects

**Features**:- **Responsive Design**: Mobile-first Tailwind CSS implementation

- Quantum Slots, Cosmic Roulette, Neural Dice, Quantum Blackjack

- Real-time WebSocket communication## 🏗️ Architecture

- Comprehensive analytics and monitoring

- Dynatrace integration### Backend (server.js)

- Professional observability aesthetic- **Express.js Server**: RESTful API endpoints for all games

- **Socket.IO Integration**: Real-time WebSocket communication

**Quick Start**:- **Game Logic**: Comprehensive algorithms for each game type

```bash- **Telemetry System**: Structured logging with correlation tracking

cd vegas-casino- **Error Handling**: Robust error management and recovery

npm install

npm start### Frontend

```- **Vault Entrance** (`index.html`): Secure login with biometric simulation

- **Smartscape Lobby** (`lobby.html`): Interactive game selection hub

**Live Deployment**: Available at your AWS EC2 public IP on port 3000- **Game Pages**: Immersive individual game experiences

- **Analytics Dashboard** (`analytics.html`): Real-time system insights

For detailed documentation, see [`vegas-casino/README.md`](./vegas-casino/README.md)- **Leaderboard** (`leaderboard.html`): Competitive player rankings



## 🚀 Adding New Projects## 🚀 Getting Started



When adding new applications to this repository:### Prerequisites

- Node.js 18+ 

1. **Create a new directory** for your project- npm or yarn

2. **Add project documentation** to this README- For AWS EC2 deployment: Amazon Linux 2023 or Ubuntu 20.04+

3. **Update .gitignore** if needed for new file types

4. **Commit changes** with descriptive messages### Quick Start (Local Development)



### Example Structure for New Project1. **Clone the repository**

```   ```bash

new-project/   git clone https://github.com/lawrobar90/Vegas-App.git

├── README.md   cd Vegas-App

├── package.json   ```

├── src/

└── ...2. **Install dependencies**

```   ```bash

   npm install

## 🔧 Git Management   ```



### Current Status3. **Start the server**

- **Main Branch**: Contains all projects   ```bash

- **Remote**: https://github.com/lawrobar90/Vegas-App.git   npm start

- **Structure**: Multi-project monorepo   # or

   node server.js

### Working with Multiple Projects   ```

```bash

# Work on Vegas Casino4. **Access the application**

cd vegas-casino   - Open http://localhost:3000 in your browser

# Make changes, then commit from root   - Enter any username to access the casino lobby

   - Select your security level preference

# Work on new project

cd new-project## 🌐 Production Deployment

# Make changes, then commit from root

### AWS EC2 Deployment

# Commit changes (from root directory)

git add .#### Step 1: Prepare EC2 Instance

git commit -m "Update: specific changes made"```bash

git push origin main# Update system packages

```sudo yum update -y  # Amazon Linux 2023

# or

### Branch Strategysudo apt update && sudo apt upgrade -y  # Ubuntu

- **main**: Stable versions of all projects

- **feature/project-name**: Feature branches for specific projects# Install Node.js 18+

- **dev/project-name**: Development branches for ongoing workcurl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -  # Amazon Linux

sudo yum install -y nodejs  # Amazon Linux

## 🌐 Deployment Information# or

curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -  # Ubuntu

### Current Deploymentssudo apt-get install -y nodejs  # Ubuntu

- **Vegas Casino**: Running on AWS EC2, port 3000

- **Server**: Amazon Linux 2023, Node.js 18+# Verify installation

- **Access**: http://YOUR_PUBLIC_IP:3000node --version

npm --version

### Adding New Deployments```

When deploying new applications:

1. Choose different ports for each app#### Step 2: Clone and Setup Application

2. Update AWS Security Group rules```bash

3. Use PM2 for process management# Clone the repository

4. Document deployment in project READMEgit clone https://github.com/lawrobar90/Vegas-App.git

cd Vegas-App

## 📝 Development Guidelines

# Install production dependencies

### Code Organizationnpm ci --only=production

- Keep each project self-contained

- Use descriptive commit messages# Install PM2 for process management (optional but recommended)

- Include proper documentationsudo npm install -g pm2

- Test thoroughly before committing```



### Environment Management#### Step 3: Configure Server for External Access

- Use `.env` files for configurationThe application is pre-configured to bind to all network interfaces (`0.0.0.0:3000`) for external access.

- Keep sensitive data out of git

- Document required environment variables#### Step 4: Configure AWS Security Group

- Use different ports for local developmentIn your AWS Console, ensure your Security Group allows inbound traffic:

```

## 🔒 Security NotesType: Custom TCP

Port: 3000

- **Environment Variables**: Keep sensitive data in `.env` filesSource: 0.0.0.0/0 (or restrict to specific IPs for security)

- **Git Exclusions**: Large files and secrets are excluded via `.gitignore````

- **Access Control**: Configure AWS Security Groups appropriately

- **Process Management**: Use PM2 for production deployments#### Step 5: Start the Application

```bash

## 📈 Future Projects# Option 1: Direct start (for testing)

node server.js

This repository is structured to support multiple projects:

- Web applications# Option 2: Using PM2 (recommended for production)

- APIs and microservicespm2 start server.js --name "vegas-casino"

- Development toolspm2 startup  # Enable auto-start on system reboot

- Testing frameworkspm2 save     # Save current process list

- Documentation sites```



Each project should maintain its own documentation and dependencies while sharing common development practices.#### Step 6: Verify Deployment

```bash

---# Check if server is running

sudo netstat -tlnp | grep :3000

**Last Updated**: September 30, 2025  # or

**Repository**: https://github.com/lawrobar90/Vegas-App  sudo ss -tlnp | grep :3000

**Maintainer**: Development Team
# Get your public IP
curl -s http://169.254.169.254/latest/meta-data/public-ipv4

# Test access
curl http://YOUR_PUBLIC_IP:3000
```

### Docker Deployment (Alternative)

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "server.js"]
```

#### Build and Run
```bash
# Build image
docker build -t vegas-casino .

# Run container
docker run -d -p 3000:3000 --name vegas-casino-app vegas-casino

# Check logs
docker logs vegas-casino-app
```

### Environment Variables (Optional)
Create a `.env` file for custom configuration:
```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Dynatrace Configuration (if using)
DT_TENANT=your-tenant-id
DT_API_TOKEN=your-api-token
DT_PAAS_TOKEN=your-paas-token

# Game Configuration
MAX_BET_AMOUNT=1000
MIN_BET_AMOUNT=1
```

## 🗂️ Repository Information

### Git Repository Cleanup
This repository has been optimized for GitHub by removing large VS Code server files that were exceeding GitHub's file size limits. The following files were removed from the entire git history:

- **VS Code Server Binaries**: `.vscode-server/` directory containing Node.js executables and binary files
- **Large Database Files**: SQLite databases and cache files (66-74 MB each)
- **Binary Executables**: Node.js runtime files (115+ MB)
- **System Cache Files**: Various development cache and temporary files

The cleanup was performed using:
```bash
git filter-branch --force --index-filter \
  'git rm -rf --cached --ignore-unmatch .vscode-server/' \
  HEAD
```

This ensures a clean repository while preserving all application code and functionality.

### Repository Structure After Cleanup
```
Vegas-App/
├── server.js                 # Main Express server (✅ Included)
├── package.json              # Dependencies (✅ Included)
├── public/                   # Frontend assets (✅ Included)
├── services/                 # Game services (✅ Included)
├── scripts/                  # Deployment scripts (✅ Included)
├── docs/                     # Documentation (✅ Included)
├── loadrunner-scripts/       # Load testing (✅ Included)
├── loadrunner-results/       # Test results (✅ Included)
└── .gitignore               # Excludes future large files (✅ Updated)
```

### .gitignore Configuration
The repository includes a comprehensive `.gitignore` to prevent future large file commits:
```gitignore
# VS Code Server Files
.vscode-server/

# System Files
.wget-hsts
.bash_history

# Node.js
node_modules/
npm-debug.log*
.npm/

# Environment Files
.env
.env.local

# Logs
*.log
logs/
```

## 🎮 Game Rules

### Quantum Slots
- **Symbols**: Cherry, Lemon, Orange, Plum, Grapes, Bell, Bar, Seven
- **Payouts**: Line matches from 2x to 100x bet amount
- **Special Features**: Weighted probability system, animated reels

### Cosmic Roulette  
- **Numbers**: 0-36 with red/black/green colors
- **Betting Options**: Straight up (35:1), Red/Black (1:1), Even/Odd (1:1)
- **Features**: Animated spinning wheel, multiple bet types

### Neural Dice
- **Dice**: Two standard 6-sided dice
- **Betting Options**: Pass Line, Don't Pass, Field, Snake Eyes, Boxcars
# Partner PowerUp BizObs App

This repository contains only the BizObs application (ignore `vegas-casino/`). It’s a Node.js + Express app with a Smartscape-like UI and dynamic per-step services that form a true sequential service chain with a 6-span trace.

## Project layout

```
partner-powerup-bizobs/
   package.json
   server.js
   public/
   routes/
   services/
   README.md
   .gitignore
```

## Prerequisites
- Node.js 18+
- Linux/macOS/Windows

## Install & run

```bash
cd partner-powerup-bizobs
npm ci --only=production
npm start
# App runs on http://127.0.0.1:4000
```

Optional local scripts (root directory):

```bash
./start-bizobs       # starts server and waits for health
./stop-bizobs        # stops server using server.pid
./restart-bizobs.sh  # convenience restart
```

## Key endpoints

- Health: GET `/api/health`
- Metrics: GET `/api/metrics` (basic placeholder)
- Journey routes: `/api/journey/*`
- Steps routes:
   - POST `/api/steps/step1` .. `/step6` (legacy single-step)
   - POST `/api/steps/step1-chained` (new chained flow; returns full 6-span trace)
- Admin:
   - POST `/api/admin/reset-ports` (stop all dynamic services, free ports)
   - GET `/api/admin/services` (list running dynamic services)

## 6-step chained flow (sequential services)

The chained route spins up per-step child processes and calls them sequentially. Each service appends a span with: `traceId`, `spanId`, `parentSpanId`, `stepName`.

Request example:

```bash
curl -s -X POST http://127.0.0.1:4000/api/steps/step1-chained \
   -H 'Content-Type: application/json' \
   -d '{
            "thinkTimeMs": 100,
            "steps": [
               {"stepName":"ProductDiscovery"},
               {"stepName":"ProductSelection"},
               {"stepName":"AddToCart"},
               {"stepName":"CheckoutProcess"},
               {"stepName":"PaymentProcessing"},
               {"stepName":"OrderConfirmation"}
            ]
         }'
```

Response (trimmed):

```json
{
   "ok": true,
   "pipeline": "chained-child-services",
   "result": {
      "trace": [
         {"traceId":"...","spanId":"...","parentSpanId":null,"stepName":"ProductDiscovery"},
         {"traceId":"...","spanId":"...","parentSpanId":"...","stepName":"ProductSelection"},
         {"traceId":"...","spanId":"...","parentSpanId":"...","stepName":"AddToCart"},
         {"traceId":"...","spanId":"...","parentSpanId":"...","stepName":"CheckoutProcess"},
         {"traceId":"...","spanId":"...","parentSpanId":"...","stepName":"PaymentProcessing"},
         {"traceId":"...","spanId":"...","parentSpanId":"...","stepName":"OrderConfirmation"}
      ]
   }
}
```

## UI quick tour

- Open http://127.0.0.1:4000 and use these buttons:
   - “Run 6-Step Chained Flow”: Executes the sequential chain and prints the trace under it.
   - “Reset Dynamic Services”: Stops all dynamic child services, freeing ports.

## Environment

- `PORT` (default `4000`)
- Optional AI vars (if you add journey generation backends):
   - `PPLX_API_KEY`, `AI_PROVIDER`, `GCLOUD_PROJECT`, `VERTEX_LOCATION`, `VERTEX_MODEL`

## Ignore vegas app

Only push `partner-powerup-bizobs/` to GitHub. The `vegas-casino/` folder and related scripts are unrelated and should be excluded from commits or a separate repo.

## License

MIT