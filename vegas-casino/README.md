# Dynatrace Vegas Casino

A sophisticated Node.js casino application featuring a Dynatrace Smartscape-inspired aesthetic with real-time telemetry, immersive gaming experiences, and comprehensive analytics.

## 🎯 Features

### 🎰 Games
- **Quantum Slots**: Advanced probability matrices with weighted symbol generation
- **Cosmic Roulette**: Animated spinning wheel with comprehensive betting options
- **Neural Dice**: Probability prediction engine with strategy recommendations
- **Quantum Blackjack**: Multi-turn gameplay with AI-powered strategy advisor

### 📊 Analytics & Monitoring
- **Real-time Metrics**: WebSocket-based live updates
- **Player Analytics**: Detailed behavior tracking and statistics  
- **System Health Monitoring**: CPU, memory, response time tracking
- **Leaderboard System**: Competitive rankings with animated charts
- **Comprehensive Telemetry**: Correlation IDs and structured logging
- **Dynatrace Integration**: OneAgent monitoring and BizEvents
- **Service Splitting**: Microservice architecture for observability
- **Business Events**: Custom business metrics and KPI tracking

### 🎨 Visual Design
- **Dynatrace Color Palette**: Purple, cyan, green, and yellow theme
- **Dark Theme**: Professional observability aesthetic
- **Neon Accents**: Glowing UI elements and animations
- **GSAP Animations**: Smooth transitions and interactive effects
- **Responsive Design**: Mobile-first Tailwind CSS implementation

## 🏗️ Architecture

### Backend (server.js)
- **Express.js Server**: RESTful API endpoints for all games
- **Socket.IO Integration**: Real-time WebSocket communication
- **Game Logic**: Comprehensive algorithms for each game type
- **Telemetry System**: Structured logging with correlation tracking
- **Error Handling**: Robust error management and recovery

### Frontend
- **Vault Entrance** (`index.html`): Secure login with biometric simulation
- **Smartscape Lobby** (`lobby.html`): Interactive game selection hub
- **Game Pages**: Immersive individual game experiences
- **Analytics Dashboard** (`analytics.html`): Real-time system insights
- **Leaderboard** (`leaderboard.html`): Competitive player rankings

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- For AWS EC2 deployment: Amazon Linux 2023 or Ubuntu 20.04+

### Quick Start (Local Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/lawrobar90/Vegas-App.git
   cd Vegas-App
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   # or
   node server.js
   ```

4. **Access the application**
   - Open http://localhost:3000 in your browser
   - Enter any username to access the casino lobby
   - Select your security level preference

## 🌐 Production Deployment

### AWS EC2 Deployment

#### Step 1: Prepare EC2 Instance
```bash
# Update system packages
sudo yum update -y  # Amazon Linux 2023
# or
sudo apt update && sudo apt upgrade -y  # Ubuntu

# Install Node.js 18+
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -  # Amazon Linux
sudo yum install -y nodejs  # Amazon Linux
# or
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -  # Ubuntu
sudo apt-get install -y nodejs  # Ubuntu

# Verify installation
node --version
npm --version
```

#### Step 2: Clone and Setup Application
```bash
# Clone the repository
git clone https://github.com/lawrobar90/Vegas-App.git
cd Vegas-App

# Install production dependencies
npm ci --only=production

# Install PM2 for process management (optional but recommended)
sudo npm install -g pm2
```

#### Step 3: Configure Server for External Access
The application is pre-configured to bind to all network interfaces (`0.0.0.0:3000`) for external access.

#### Step 4: Configure AWS Security Group
In your AWS Console, ensure your Security Group allows inbound traffic:
```
Type: Custom TCP
Port: 3000
Source: 0.0.0.0/0 (or restrict to specific IPs for security)
```

#### Step 5: Start the Application
```bash
# Option 1: Direct start (for testing)
node server.js

# Option 2: Using PM2 (recommended for production)
pm2 start server.js --name "vegas-casino"
pm2 startup  # Enable auto-start on system reboot
pm2 save     # Save current process list
```

#### Step 6: Verify Deployment
```bash
# Check if server is running
sudo netstat -tlnp | grep :3000
# or
sudo ss -tlnp | grep :3000

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
- **Features**: Probability charts, strategy recommendations

### Quantum Blackjack
- **Objective**: Get as close to 21 without going over
- **Actions**: Hit, Stand, Double Down
- **Features**: Multi-turn gameplay, strategy advisor, card counting tracker

## 📁 Project Structure

```
dynatrace-vegas-casino/
├── server.js                 # Main Express server
├── package.json              # Project dependencies
├── public/                   # Frontend assets
│   ├── index.html           # Vault entrance page
│   ├── lobby.html           # Smartscape game lobby  
│   ├── slots.html           # Quantum Slots game
│   ├── roulette.html        # Cosmic Roulette game
│   ├── dice.html            # Neural Dice game
│   ├── blackjack.html       # Quantum Blackjack game
│   ├── leaderboard.html     # Player rankings
│   ├── analytics.html       # Analytics dashboard
│   └── assets/              # Static assets
├── docs/                    # Documentation
│   ├── LOADRUNNER_INTEGRATION_GUIDE.md
│   ├── SRG-API-IMPORT-GUIDE.md
│   └── SRG-SETUP-GUIDE.md
├── scripts/                 # Utility scripts
├── loadrunner-scripts/      # Load testing configurations  
└── loadrunner-results/      # Test result archives
```

## 🔧 Dynatrace Integration

### OneAgent Installation
```bash
# Set required environment variables
export DT_TENANT='your-tenant-id'
export DT_API_TOKEN='your-api-token' 
export DT_PAAS_TOKEN='your-paas-token'

# Run installation script
./scripts/install-oneagent.sh
```

### Environment Setup
```bash
# Configure Dynatrace environment
./scripts/setup-environment.sh

# Edit .env file with your credentials
nano .env

# Install optional Dynatrace SDK
npm install --optional-only
```

### Service Architecture
The application is designed as microservices for Dynatrace observability:

- **vegas-casino-main**: Main application and user management
- **vegas-slots-service**: Slot machine game logic  
- **vegas-roulette-service**: Roulette game logic
- **vegas-dice-service**: Dice game logic
- **vegas-blackjack-service**: Blackjack game logic
- **vegas-analytics-service**: Metrics and analytics
- **vegas-leaderboard-service**: Player rankings

### BizEvents
The application sends comprehensive business events to Dynatrace:
- Game actions (spins, bets, wins/losses)
- User activities (login/logout, session data)
- Business metrics (revenue, player behavior)
- Custom metrics (bet amounts, win rates, player statistics)

See `docs/BIZEVENTS-CONFIGURATION.md` for complete BizEvents documentation.

## 🔧 Troubleshooting

### Common Deployment Issues

#### 1. Server Not Accessible Externally
```bash
# Check if server is binding to all interfaces
netstat -tlnp | grep :3000
# Should show: 0.0.0.0:3000, not 127.0.0.1:3000

# Verify AWS Security Group allows port 3000
# Check AWS Console > EC2 > Security Groups > Inbound Rules

# Test internal connectivity
curl http://localhost:3000
curl http://$(hostname -I | awk '{print $1}'):3000
```

#### 2. WebSocket Connection Issues
```bash
# Check WebSocket errors in browser console
# Ensure server supports WebSocket connections
# Verify no proxy/firewall blocking WebSocket protocols
```

#### 3. NPM Installation Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Use specific Node.js version if needed
nvm install 18
nvm use 18
```

#### 4. PM2 Process Management
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs vegas-casino

# Restart application
pm2 restart vegas-casino

# Stop and delete process
pm2 stop vegas-casino
pm2 delete vegas-casino
```

#### 5. Port Already in Use
```bash
# Find process using port 3000
sudo lsof -i :3000
sudo fuser -k 3000/tcp  # Kill process using port 3000

# Or use a different port
PORT=3001 node server.js
```

#### 6. Memory Issues
```bash
# Monitor memory usage
free -h
top

# Increase Node.js memory limit if needed
node --max-old-space-size=4096 server.js
```

### Performance Optimization

#### 1. Enable Gzip Compression
The server includes built-in compression middleware for better performance.

#### 2. Static File Caching
Static assets are served with appropriate cache headers for optimal performance.

#### 3. WebSocket Optimization
Real-time updates use efficient WebSocket connections with automatic reconnection.

### Health Checks

#### Application Health
```bash
# Basic health check
curl http://your-server:3000/

# API endpoint test
curl http://your-server:3000/api/metrics

# WebSocket test (using wscat if installed)
npm install -g wscat
wscat -c ws://your-server:3000
```

#### System Health
```bash
# Check system resources
df -h          # Disk space
free -h        # Memory usage
top            # CPU and process usage
systemctl status  # System services
```

## 🔧 API Endpoints

### Game APIs
- `POST /api/slots/spin` - Spin the slot reels
- `POST /api/roulette/spin` - Spin the roulette wheel  
- `POST /api/dice/roll` - Roll the dice
- `POST /api/blackjack/deal` - Deal initial blackjack hand
- `POST /api/blackjack/hit` - Player takes a card
- `POST /api/blackjack/stand` - Player stands, dealer plays
- `POST /api/blackjack/double` - Player doubles down

### Analytics APIs  
- `GET /api/metrics` - Real-time telemetry data
- `GET /api/leaderboard` - Player rankings and statistics

## 🎨 Styling & Theming

### Color Palette
```css
dt-purple: #6C2C9C    /* Primary brand color */
dt-blue: #00A1C9      /* Information elements */
dt-cyan: #00D4FF      /* Active states, highlights */
dt-green: #73BE28     /* Success, winning states */
dt-orange: #FFA86B    /* Warnings, attention */
dt-yellow: #FFD23F    /* Notifications, rewards */
dt-dark: #151515      /* Background base */
dt-gray: #2D2D2D      /* Secondary backgrounds */
```

### Animations
- **GSAP**: Smooth entrance animations and transitions
- **CSS Keyframes**: Pulsing effects and glowing elements
- **Chart.js**: Animated data visualizations
- **Game Animations**: Spinning reels, dice rolls, card flips

## 📊 Telemetry & Monitoring

### Metrics Tracked
- Player actions and game outcomes
- System performance (CPU, memory, response times)  
- Real-time user counts and session duration
- Game-specific statistics and win rates
- Error rates and system health

### Correlation IDs
All requests are tracked with unique correlation IDs for complete request tracing and debugging.

## 🔒 Security Features
- Input validation on all API endpoints
- Error handling to prevent information leakage
- Session management with timeout controls
- CORS configuration for secure cross-origin requests

## 🚀 Performance Features
- Efficient WebSocket communication for real-time updates
- Optimized animations with hardware acceleration
- Lazy loading of charts and heavy components
- Responsive design for all device types

## 📈 Future Enhancements
- Redis integration for session storage
- Advanced analytics with machine learning insights
- Tournament system with scheduled events
- Social features and player interactions
- Mobile app with React Native

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes with proper documentation
4. Test thoroughly across all games
5. Submit a pull request

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 About
Created as a demonstration of modern web application development with real-time features, sophisticated UI/UX design, and comprehensive monitoring capabilities inspired by Dynatrace's observability platform.