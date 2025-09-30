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

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dynatrace-vegas-casino
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