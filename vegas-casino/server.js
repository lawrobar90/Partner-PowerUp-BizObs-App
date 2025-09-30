/**
 * Dynatrace Vegas Casino Server
 * A Node.js casino application with Smartscape-inspired UI and real-time telemetry
 * 
 * Features:
 * - WebSocket-based real-time metric updates
 * - Telemetry simulation via /metrics route
 * - Game APIs for Roulette, Slots, Dice Roll, and Blackjack
 * - Dynatrace-style logging and monitoring
 */

const express = require('express');
const http = require('http');
const { spawn } = require('child_process');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');

// Remove OneAgent SDK: we'll rely on OneAgent auto-instrumentation only
const recordCustomMetric = () => { /* no-op: use request attributes via body capture instead */ };

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// --- Internal service launcher & proxy (no SDK) ---
// We'll spawn lightweight child processes per service and proxy requests to them via HTTP.
// OneAgent will see separate processes/services and build a proper topology.
const childServices = {};
const SERVICE_PORTS = {
  'vegas-slots-service': 3101,
  'vegas-roulette-service': 3102,
  'vegas-dice-service': 3103,
  'vegas-blackjack-service': 3104
};

function startChildService(name, script, env = {}) {
  if (childServices[name]) return childServices[name];
  const child = spawn('node', [script], {
    cwd: __dirname,
    env: { ...process.env, PORT: String(SERVICE_PORTS[name] || 0), SERVICE_NAME: name, ...env },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  child.stdout.on('data', d => console.log(`[${name}] ${d.toString().trim()}`));
  child.stderr.on('data', d => console.error(`[${name}][ERR] ${d.toString().trim()}`));
  child.on('exit', code => {
    console.log(`[${name}] exited with code ${code}`);
    delete childServices[name];
  });
  childServices[name] = child;
  return child;
}

function proxyJson(targetPort, req, res) {
  const options = {
    hostname: '127.0.0.1',
    port: targetPort,
    path: req.url.replace(/^\/api\/(slots|roulette|dice|blackjack)/, ''),
    method: req.method,
    headers: { 'Content-Type': 'application/json' }
  };

  const proxyReq = http.request(options, proxyRes => {
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', err => {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: 'Service unavailable', details: err.message }));
  });
  if (req.body && Object.keys(req.body).length) {
    proxyReq.end(JSON.stringify(req.body));
  } else {
    proxyReq.end();
  }
}

// --- Simple in-memory user store for per-user balance persistence ---
const DEFAULT_START_BALANCE = 1000;
const users = new Map(); // key: username, value: { username, balance }

function getOrCreateUser(username) {
  const key = (username || 'Anonymous').trim() || 'Anonymous';
  if (!users.has(key)) {
    users.set(key, { username: key, balance: DEFAULT_START_BALANCE });
  }
  return users.get(key);
}

function updateUserBalance(username, delta) {
  const user = getOrCreateUser(username);
  user.balance = Math.max(0, (user.balance || 0) + Number(delta || 0));
  return user.balance;
}

// User API
app.post('/api/user/init', (req, res) => {
  const username = (req.body && (req.body.Username || req.body.username)) || 'Anonymous';
  const user = getOrCreateUser(username);
  res.json({ username: user.username, balance: user.balance });
});

app.get('/api/user/balance', (req, res) => {
  const username = req.query.username || 'Anonymous';
  const user = getOrCreateUser(username);
  res.json({ username: user.username, balance: user.balance });
});

// Persistent Top-Up endpoint
app.post('/api/user/topup', (req, res) => {
  const username = (req.body && (req.body.Username || req.body.username)) || 'Anonymous';
  const amount = Number((req.body && (req.body.Amount || req.body.amount)) || 500);
  updateUserBalance(username, Math.max(0, amount));
  const user = getOrCreateUser(username);
  // Log BizEvent for top-up action
  logTelemetry('USER_TOPUP', {
    action: 'topup',
    username: user.username,
    amount: amount,
    balance: user.balance,
    correlationId: generateCorrelationId()
  });
  res.json({ username: user.username, balance: user.balance });
});

// Helper to call child service and parse JSON
function callChildJson(targetPort, pathName, payload) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: targetPort,
      path: pathName,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };
    const req2 = http.request(options, (res2) => {
      let body = '';
      res2.setEncoding('utf8');
      res2.on('data', chunk => body += chunk);
      res2.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve(json);
        } catch (e) {
          reject(new Error(`Invalid JSON from child service on port ${targetPort}: ${e.message}`));
        }
      });
    });
    req2.on('error', reject);
    req2.end(JSON.stringify(payload || {}));
  });
}

// Game configuration
const GAME_CONFIG = {
  slots: {
    icons: [
      // Premium Dynatrace Symbols (Highest Payouts)
      'dynatrace', 'smartscape', 'application', 'database',
      // Technology Symbols (High Payouts)  
      'server', 'cloud', 'shield', 'chart', 'network',
      // Service Symbols (Medium Payouts)
      'services', 'host', 'process', 'memory', 'cpu'
    ],
    multipliers: { 3: 5, 2: 2 },
    baseWinChance: 0.15,
    // Enhanced payout system
    payouts: {
      triple: {
        'dynatrace': 100, 'smartscape': 50, 'application': 25, 'database': 20,
        'server': 15, 'cloud': 12, 'shield': 10, 'chart': 8, 'network': 6,
        'services': 4, 'host': 3, 'process': 2, 'memory': 2, 'cpu': 2
      },
      double: {
        'dynatrace': 10, 'smartscape': 5, 'application': 3, 'database': 2,
        'server': 2, 'cloud': 1.5, 'shield': 1.5, 'chart': 1.2, 'network': 1.2,
        'services': 1, 'host': 1, 'process': 0.5, 'memory': 0.5, 'cpu': 0.5
      }
    }
  },
  roulette: {
    numbers: Array.from({ length: 37 }, (_, i) => i), // 0-36
    colors: { red: [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36], black: [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35] },
    payouts: { straight: 35, split: 17, street: 11, corner: 8, sixline: 5, column: 2, dozen: 2, evenodd: 1, redblack: 1, highlow: 1 }
  },
  dice: {
    sides: 6,
    combinations: {
      snake_eyes: { dice: [1, 1], multiplier: 30 },
      boxcars: { dice: [6, 6], multiplier: 30 },
      hard_eight: { dice: [4, 4], multiplier: 9 },
      hard_six: { dice: [3, 3], multiplier: 9 },
      seven_out: { sum: 7, multiplier: 4 }
    }
  },
  blackjack: {
    deck: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
    suits: ['hearts', 'diamonds', 'clubs', 'spades'],
    blackjackPayout: 1.5,
    insurancePayout: 2
  }
};

// Telemetry storage
let gameMetrics = {
  totalSpins: 0,
  totalWins: 0,
  totalLosses: 0,
  totalRevenue: 0,
  totalPayout: 0,
  activeUsers: 0,
  gamesPlayed: { slots: 0, roulette: 0, dice: 0, blackjack: 0 },
  averageSessionTime: 0,
  errors: [],
  systemHealth: {
    cpu: 0,
    memory: 0,
    latency: 0,
    uptime: 0
  }
};

// User sessions for tracking
const userSessions = new Map();

// Dynatrace Configuration
// Configuration
const PORT = process.env.PORT || 3000;
const DYNATRACE_CONFIG = {
  environment: process.env.DT_ENVIRONMENT || 'sprint-labs',
  serviceVersion: '2.0.0',
  serviceName: 'dynatrace-vegas-casino',
  ingestEndpoint: process.env.DT_INGEST_ENDPOINT,
  apiToken: process.env.DT_API_TOKEN,
  // Enhanced service detection tags
  serviceTags: {
    'dt.service.name': 'dynatrace-vegas-casino',
    'dt.service.version': '2.0.0',
    'dt.service.environment': 'sprint-labs'
  }
};

// Service Identification for Dynatrace
const SERVICE_NAMES = {
  casino: 'vegas-casino-main',
  slots: 'vegas-slots-service',
  roulette: 'vegas-roulette-service',
  dice: 'vegas-dice-service',
  blackjack: 'vegas-blackjack-service',
  analytics: 'vegas-analytics-service',
  leaderboard: 'vegas-leaderboard-service'
};

// Utility functions
function generateCorrelationId() {
  return crypto.randomBytes(8).toString('hex');
}

// Slots game logic
function spinSlots(betAmount) {
  return new Promise((resolve) => {
    // Generate slot result
    const result = Array.from({ length: 3 }, () => 
      GAME_CONFIG.slots.icons[Math.floor(Math.random() * GAME_CONFIG.slots.icons.length)]
    );
    
    // Enhanced win calculation
    const symbolCounts = {};
    result.forEach(symbol => {
      symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
    });
    
    let isWin = false;
    let multiplier = 0;
    let winType = '';
    
    // Check for triple matches first (highest priority)
    for (const [symbol, count] of Object.entries(symbolCounts)) {
      if (count === 3) {
        multiplier = GAME_CONFIG.slots.payouts.triple[symbol] || 2;
        isWin = true;
        winType = 'triple';
        break;
      }
    }
    
    // If no triple, check for double matches
    if (!isWin) {
      for (const [symbol, count] of Object.entries(symbolCounts)) {
        if (count === 2) {
          multiplier = GAME_CONFIG.slots.payouts.double[symbol] || 1;
          isWin = true;
          winType = 'double';
          break;
        }
      }
    }
    
    const winAmount = isWin ? betAmount * multiplier : 0;
    
    const responseData = {
      result,
      win: isWin,
      winAmount,
      betAmount,
      multiplier: isWin ? multiplier : 0,
      winType,
      correlationId: generateCorrelationId(),
      timestamp: new Date().toISOString()
    };
    
    resolve(responseData);
  });
}

// Dynatrace BizEvents payload builder
function createBizEvent(eventType, data) {
  const serviceName = data.service || SERVICE_NAMES.casino;
  
  // Extract Vegas Casino specific data for rqBody
  const vegasCasinoData = { ...data };
  delete vegasCasinoData.service; // Remove service from the payload
  
  const baseEvent = {
    specversion: '1.0',
    type: `com.dynatrace.vegas.${eventType}`,
    source: serviceName,
    id: generateCorrelationId(),
    time: new Date().toISOString(),
    dt: {
      entity: {
        type: 'SERVICE',
        name: serviceName
      },
      trace_id: generateCorrelationId(),
      span_id: generateCorrelationId()
    },
    data: {
      casino: 'Dynatrace Vegas',
      environment: DYNATRACE_CONFIG.environment,
      service: serviceName,
      // Put the actual Vegas Casino game data in rqBody
      rqBody: vegasCasinoData
    }
  };
  
  return baseEvent;
}

// Send BizEvent to Dynatrace
function sendBizEvent(eventType, data) {
  const bizEvent = createBizEvent(eventType, data);
  
  // Log BizEvent for debugging
  console.log(`📊 BizEvent [${eventType}]:`, JSON.stringify(bizEvent, null, 2));
  
  // In a real implementation, send to Dynatrace Ingest API
  if (DYNATRACE_CONFIG.ingestEndpoint && DYNATRACE_CONFIG.apiToken) {
    // TODO: Implement actual HTTP POST to Dynatrace Ingest API
    // fetch(DYNATRACE_CONFIG.ingestEndpoint + '/v1/events/ingest', { ... })
  }
  
  return bizEvent;
}

function logTelemetry(event, data) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${event}:`, JSON.stringify(data, null, 2));
  
  // Send corresponding BizEvent to Dynatrace
  if (event.includes('GAME_') || event.includes('USER_') || event.includes('SPIN') || event.includes('DEAL')) {
    const eventType = event.toLowerCase().replace('_', '.');
    const serviceName = getServiceNameFromEvent(event, data);
    
    sendBizEvent(eventType, {
      ...data,
      telemetryEvent: event,
      timestamp,
      service: serviceName
    });
  }
  
  // No SDK metrics; BizEvents come from request body capture on /api/* endpoints
  
  // Update metrics
  gameMetrics.totalSpins += data.action === 'spin' ? 1 : 0;
  gameMetrics.totalWins += data.win ? 1 : 0;
  gameMetrics.totalLosses += !data.win && data.action === 'spin' ? 1 : 0;
  gameMetrics.totalRevenue += data.betAmount || 0;
  gameMetrics.totalPayout += data.winAmount || 0;
  
  if (data.game) {
    gameMetrics.gamesPlayed[data.game.toLowerCase()] = (gameMetrics.gamesPlayed[data.game.toLowerCase()] || 0) + 1;
  }
  
  if (data.error) {
    gameMetrics.errors.push({
      timestamp,
      error: data.error,
      correlationId: data.correlationId
    });
    
    // Keep only last 100 errors
    if (gameMetrics.errors.length > 100) {
      gameMetrics.errors = gameMetrics.errors.slice(-100);
    }
  }
}

// Helper function to determine service name from event
function getServiceNameFromEvent(event, data) {
  if (event.includes('SLOTS') || data.game === 'Slots') return SERVICE_NAMES.slots;
  if (event.includes('ROULETTE') || data.game === 'Roulette') return SERVICE_NAMES.roulette;
  if (event.includes('DICE') || data.game === 'Dice') return SERVICE_NAMES.dice;
  if (event.includes('BLACKJACK') || data.game === 'Blackjack') return SERVICE_NAMES.blackjack;
  if (event.includes('LEADERBOARD')) return SERVICE_NAMES.leaderboard;
  if (event.includes('METRICS')) return SERVICE_NAMES.analytics;
  return SERVICE_NAMES.casino;
}

// Dynatrace middleware for service identification
function dynatraceMiddleware(serviceName) {
  return (req, res, next) => {
    // Enhanced Dynatrace headers for proper service separation
    res.setHeader('X-Dynatrace-Service', serviceName);
    res.setHeader('X-Dynatrace-Version', DYNATRACE_CONFIG.serviceVersion);
    res.setHeader('X-Dynatrace-Environment', DYNATRACE_CONFIG.environment);
    res.setHeader('X-Service-Instance', `${serviceName}-${process.pid}`);
    
    // Critical: Set different service detection per endpoint
    res.setHeader('X-dynaTrace-PC', serviceName); // Process Name Component
    res.setHeader('X-dynaTrace-PG', `${serviceName}-group`); // Process Group
    res.setHeader('dt-logicalServiceName', serviceName); // Logical Service Name
    
    // No SDK attributes; rely on OneAgent auto-instrumentation
    
    // Log request for tracing
    const correlationId = generateCorrelationId();
    req.correlationId = correlationId;
    req.serviceName = serviceName;
    
    logTelemetry('HTTP_REQUEST', {
      method: req.method,
      path: req.path,
      service: serviceName,
      correlationId,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      serviceInstance: `${serviceName}-${process.pid}`
    });
    
    next();
  };
}

// Simulate system metrics
function simulateSystemMetrics() {
  gameMetrics.systemHealth.cpu = Math.floor(Math.random() * 100);
  gameMetrics.systemHealth.memory = Math.floor(Math.random() * 100);
  gameMetrics.systemHealth.latency = Math.floor(Math.random() * 200) + 50;
  gameMetrics.systemHealth.uptime = process.uptime();
}

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);
  gameMetrics.activeUsers++;
  
  // Send initial metrics
  socket.emit('metrics-update', gameMetrics);
  
  // Handle user session tracking
  socket.on('user-login', (userData) => {
    userSessions.set(socket.id, {
      username: userData.username,
      loginTime: Date.now(),
      gamesPlayed: 0,
      totalWagered: 0
    });
    
    logTelemetry('USER_LOGIN', {
      username: userData.username,
      socketId: socket.id,
      correlationId: generateCorrelationId()
    });
  });
  
  // Handle game events
  socket.on('game-action', (gameData) => {
    const correlationId = generateCorrelationId();
    const session = userSessions.get(socket.id);
    
    if (session) {
      session.gamesPlayed++;
      session.totalWagered += gameData.betAmount || 0;
    }
    
    logTelemetry('GAME_ACTION', {
      ...gameData,
      socketId: socket.id,
      username: session?.username || 'Anonymous',
      correlationId
    });
    
    // Broadcast metrics update to all connected clients
    io.emit('metrics-update', gameMetrics);
  });
  
  // Handle slots spin events
  socket.on('slots-spin', async (data) => {
    try {
      const { betAmount, username } = data;
      const correlationId = generateCorrelationId();
      
      // Call the slots API logic
      const slotsResult = await spinSlots(betAmount);
      
      // Update session data
      let session = userSessions.get(socket.id);
      if (!session) {
        session = {
          username: username || 'Anonymous',
          balance: 1000,
          gamesPlayed: 0,
          totalWagered: 0
        };
        userSessions.set(socket.id, session);
      }
      
      // Update session with spin results
      session.gamesPlayed++;
      session.totalWagered += betAmount;
      session.balance += (slotsResult.winAmount - betAmount); // Add winnings, subtract bet
      
      // Ensure balance doesn't go negative
      if (session.balance < 0) session.balance = 0;
      
      // Log telemetry
      logTelemetry('SLOTS_SPIN', {
        betAmount,
        result: slotsResult.result,
        win: slotsResult.win,
        winAmount: slotsResult.winAmount,
        socketId: socket.id,
        username: session.username,
        correlationId
      });
      
      // Send result back to the client with consistent field names
      socket.emit('slots-result', {
        symbols: slotsResult.result,
        result: slotsResult.result,
        multiplier: slotsResult.multiplier,
        winAmount: slotsResult.winAmount,
        winnings: slotsResult.winAmount, // Keep both for compatibility
        betAmount: betAmount,
        newBalance: session.balance,
        correlationId: correlationId
      });
      
      // Update global metrics
      gameMetrics.totalWagers += betAmount;
      if (slotsResult.win) {
        gameMetrics.totalPayouts += slotsResult.winAmount;
      }
      
      // Broadcast metrics update
      io.emit('metrics-update', gameMetrics);
      
    } catch (error) {
      console.error('Slots spin error:', error);
      socket.emit('slots-error', { message: 'Spin failed. Please try again.' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
    gameMetrics.activeUsers = Math.max(0, gameMetrics.activeUsers - 1);
    
    const session = userSessions.get(socket.id);
    if (session) {
      const sessionTime = (Date.now() - session.loginTime) / 1000 / 60; // minutes
      gameMetrics.averageSessionTime = (gameMetrics.averageSessionTime + sessionTime) / 2;
      
      logTelemetry('USER_LOGOUT', {
        username: session.username,
        sessionTime,
        gamesPlayed: session.gamesPlayed,
        totalWagered: session.totalWagered,
        correlationId: generateCorrelationId()
      });
      
      userSessions.delete(socket.id);
    }
    
    io.emit('metrics-update', gameMetrics);
  });
});

// API Routes

/**
 * Metrics endpoint - Returns comprehensive telemetry data
 */
app.get('/api/metrics', dynatraceMiddleware(SERVICE_NAMES.analytics), (req, res) => {
  simulateSystemMetrics();
  
  const metricsData = {
    ...gameMetrics,
    timestamp: new Date().toISOString(),
    correlationId: generateCorrelationId()
  };
  
  res.json(metricsData);
});

/**
 * BizEvent capture endpoint - accepts completed game events with resolved outcomes
 * OneAgent can capture this request body as Business Events with full fields.
 */
app.post('/api/bizevent', dynatraceMiddleware(SERVICE_NAMES.analytics), (req, res) => {
  try {
    const payload = req.body || {};
    // Log minimal telemetry and forward as BizEvent structure for visibility
    logTelemetry('BIZEVENT_COMPLETED', {
      action: payload.Action || 'Completed',
      game: payload.Game || 'Vegas',
      username: payload.Username || 'Anonymous',
      correlationId: payload.CorrelationId,
      win: Boolean(payload.WinFlag),
      winAmount: Number(payload.WinningAmount || 0),
      lossAmount: Number(payload.LossAmount || 0)
    });
  } catch (e) {
    // ignore errors; this is best-effort
  }
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

/**
 * Metrics Route (Alternative endpoint for lobby compatibility)
 */
app.get('/metrics', dynatraceMiddleware(SERVICE_NAMES.analytics), (req, res) => {
  simulateSystemMetrics();
  
  const metricsData = {
    ...gameMetrics,
    timestamp: new Date().toISOString(),
    correlationId: generateCorrelationId()
  };
  
  res.json(metricsData);
});

/**
 * Slots API - Receives bizevent payload directly in request body for OneAgent capture
 */
// Proxy: Slots
app.post('/api/slots/spin', dynatraceMiddleware(SERVICE_NAMES.slots), async (req, res) => {
  try {
    startChildService(SERVICE_NAMES.slots, path.join('services','slots-service.js'));
    const Username = (req.body && (req.body.Username || req.body.userId || req.body.username)) || 'Anonymous';
    const BetAmount = Number((req.body && (req.body.BetAmount ?? req.body.betAmount)) || 10);
    const user = getOrCreateUser(Username);
    if (user.balance < BetAmount) return res.status(400).json({ error: 'Insufficient balance', balance: user.balance });
    // Deduct bet
    updateUserBalance(Username, -BetAmount);
    const payload = { ...req.body, Username, BetAmount, Balance: users.get(Username).balance };
    const data = await callChildJson(SERVICE_PORTS[SERVICE_NAMES.slots], '/spin', payload);
    const winAmount = Number(data.winAmount || 0);
    if (winAmount > 0) updateUserBalance(Username, winAmount);
    res.json({ ...data, newBalance: users.get(Username).balance, Username });
  } catch (e) {
    res.status(502).json({ error: 'Service unavailable', details: e.message });
  }
});

/**
 * Roulette API - Receives bizevent payload directly in request body for OneAgent capture
 */
// Proxy: Roulette
app.post('/api/roulette/spin', dynatraceMiddleware(SERVICE_NAMES.roulette), async (req, res) => {
  try {
    startChildService(SERVICE_NAMES.roulette, path.join('services','roulette-service.js'));
    const Username = (req.body && (req.body.Username || req.body.userId || req.body.username)) || 'Anonymous';
    const BetAmount = Number((req.body && (req.body.BetAmount ?? req.body.betAmount)) || 10);
    const user = getOrCreateUser(Username);
    if (user.balance < BetAmount) return res.status(400).json({ error: 'Insufficient balance', balance: user.balance });
    updateUserBalance(Username, -BetAmount);
    const payload = { ...req.body, Username, BetAmount, Balance: users.get(Username).balance };
    const data = await callChildJson(SERVICE_PORTS[SERVICE_NAMES.roulette], '/spin', payload);
    const payout = Number(data.payout || 0);
    if (payout > 0) updateUserBalance(Username, payout);
    res.json({ ...data, newBalance: users.get(Username).balance, Username });
  } catch (e) {
    res.status(502).json({ error: 'Service unavailable', details: e.message });
  }
});

/**
 * Dice API - Receives bizevent payload directly in request body for OneAgent capture
 */
// Proxy: Dice
app.post('/api/dice/roll', dynatraceMiddleware(SERVICE_NAMES.dice), async (req, res) => {
  try {
    startChildService(SERVICE_NAMES.dice, path.join('services','dice-service.js'));
    const Username = (req.body && (req.body.Username || req.body.userId || req.body.username)) || 'Anonymous';
    const BetAmount = Number((req.body && (req.body.BetAmount ?? req.body.betAmount)) || 10);
    const user = getOrCreateUser(Username);
    if (user.balance < BetAmount) return res.status(400).json({ error: 'Insufficient balance', balance: user.balance });
    updateUserBalance(Username, -BetAmount);
    const payload = { ...req.body, Username, BetAmount, Balance: users.get(Username).balance };
    const data = await callChildJson(SERVICE_PORTS[SERVICE_NAMES.dice], '/roll', payload);
    const payout = Number(data.payout || 0);
    if (payout > 0) updateUserBalance(Username, payout);
    res.json({ ...data, newBalance: users.get(Username).balance, Username });
  } catch (e) {
    res.status(502).json({ error: 'Service unavailable', details: e.message });
  }
});

/**
 * Blackjack API - Receives bizevent payload directly in request body for OneAgent capture
 */
// Proxy: Blackjack
app.post('/api/blackjack/deal', dynatraceMiddleware(SERVICE_NAMES.blackjack), async (req, res) => {
  try {
    startChildService(SERVICE_NAMES.blackjack, path.join('services','blackjack-service.js'));
    const Username = (req.body && (req.body.Username || req.body.userId || req.body.username)) || 'Anonymous';
    const BetAmount = Number((req.body && req.body.BetAmount) || 10);
    const user = getOrCreateUser(Username);
    if (user.balance < BetAmount) return res.status(400).json({ error: 'Insufficient balance', balance: user.balance });
    updateUserBalance(Username, -BetAmount);
    const payload = { ...req.body, Username, BetAmount, Balance: users.get(Username).balance };
    const data = await callChildJson(SERVICE_PORTS[SERVICE_NAMES.blackjack], '/deal', payload);
    // For now, no automatic payout on deal; following actions (not yet proxied) would adjust
    res.json({ ...data, newBalance: users.get(Username).balance, Username });
  } catch (e) {
    res.status(502).json({ error: 'Service unavailable', details: e.message });
  }
});

// Game state storage for blackjack (in production, use Redis or database)
const blackjackGames = new Map();

// Blackjack helper functions
function calculateBlackjackScore(hand) {
  let score = 0;
  let aces = 0;
  
  for (let card of hand) {
    const value = parseInt(card.value);
    if (value === 1) {
      aces++;
      score += 11;
    } else if (value > 10) {
      score += 10;
    } else {
      score += value;
    }
  }
  
  // Adjust for aces
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  
  return score;
}

/**
 * Blackjack Hit API - Player takes additional card
 */
app.post('/api/blackjack/hit', dynatraceMiddleware(SERVICE_NAMES.blackjack), (req, res) => {
  startChildService(SERVICE_NAMES.blackjack, path.join('services','blackjack-service.js'));
  proxyJson(SERVICE_PORTS[SERVICE_NAMES.blackjack], req, res);
});

/**
 * Blackjack Stand API - Player stands, dealer plays
 */
app.post('/api/blackjack/stand', dynatraceMiddleware(SERVICE_NAMES.blackjack), (req, res) => {
  startChildService(SERVICE_NAMES.blackjack, path.join('services','blackjack-service.js'));
  // Proxy then adjust balance based on result
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const payload = body ? JSON.parse(body) : {};
      const Username = (payload && (payload.Username || payload.username)) || 'Anonymous';
      const data = await callChildJson(SERVICE_PORTS[SERVICE_NAMES.blackjack], '/stand', payload);
      const payout = Number(data.payout || 0);
      if (payout > 0) updateUserBalance(Username, payout);
      res.json({ ...data, newBalance: users.get(Username).balance, Username });
    } catch (e) {
      res.status(502).json({ error: 'Service unavailable', details: e.message });
    }
  });
});

/**
 * Blackjack Double API - Player doubles down
 */
app.post('/api/blackjack/double', dynatraceMiddleware(SERVICE_NAMES.blackjack), (req, res) => {
  startChildService(SERVICE_NAMES.blackjack, path.join('services','blackjack-service.js'));
  // Proxy then deduct additional bet and return updated balance
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const payload = body ? JSON.parse(body) : {};
      const Username = (payload && (payload.Username || payload.username)) || 'Anonymous';
      const data = await callChildJson(SERVICE_PORTS[SERVICE_NAMES.blackjack], '/double', payload);
      const additional = Number(data.additionalBet || 0);
      if (additional > 0) {
        const user = getOrCreateUser(Username);
        if (user.balance < additional) {
          return res.status(400).json({ error: 'Insufficient balance to double', balance: user.balance });
        }
        updateUserBalance(Username, -additional);
      }
      res.json({ ...data, newBalance: users.get(Username).balance, Username });
    } catch (e) {
      res.status(502).json({ error: 'Service unavailable', details: e.message });
    }
  });
});

/**
 * Leaderboard API - Returns top players
 */
app.get('/api/leaderboard', dynatraceMiddleware(SERVICE_NAMES.leaderboard), (req, res) => {
  const correlationId = generateCorrelationId();
  
  // Simulate leaderboard data
  const leaderboard = [
    { username: 'DynaTrader', totalWins: 1250, totalWagered: 15000, winRate: 0.83 },
    { username: 'ObservabilityKing', totalWins: 980, totalWagered: 12500, winRate: 0.78 },
    { username: 'MetricMaster', totalWins: 875, totalWagered: 11200, winRate: 0.78 },
    { username: 'TelemetryPro', totalWins: 750, totalWagered: 9800, winRate: 0.77 },
    { username: 'TracingExpert', totalWins: 720, totalWagered: 9500, winRate: 0.76 },
    { username: 'MonitoringGuru', totalWins: 650, totalWagered: 8900, winRate: 0.73 },
    { username: 'APMSpecialist', totalWins: 580, totalWagered: 8100, winRate: 0.72 },
    { username: 'SmartscapeNavigator', totalWins: 520, totalWagered: 7300, winRate: 0.71 },
    { username: 'CloudObserver', totalWins: 480, totalWagered: 6800, winRate: 0.71 },
    { username: 'PerformanceTracker', totalWins: 420, totalWagered: 6200, winRate: 0.68 }
  ];
  
  logTelemetry('LEADERBOARD_REQUEST', {
    action: 'get_leaderboard',
    correlationId
  });
  
  res.json({
    leaderboard,
    correlationId,
    timestamp: new Date().toISOString()
  });
});

/**
 * Slots Test Payout API - For testing specific symbol combinations
 */
app.post('/api/slots/test-payout', dynatraceMiddleware(SERVICE_NAMES.slots), (req, res) => {
  const { symbols, betAmount } = req.body;
  const actualBetAmount = betAmount || 10;
  const correlationId = generateCorrelationId();
  
  try {
    // Calculate win based on provided symbols
    const uniqueIcons = [...new Set(symbols)];
    const isWin = uniqueIcons.length === 1 || uniqueIcons.length === 2;
    
    let multiplier = 0;
    if (uniqueIcons.length === 1) {
      // All three symbols match
      const symbol = uniqueIcons[0];
      if (symbol === 'dynatrace') {
        multiplier = 50; // Special Dynatrace jackpot
      } else if (symbol === 'diamond') {
        multiplier = 20;
      } else if (symbol === 'seven') {
        multiplier = 10;
      } else if (symbol === 'cherry') {
        multiplier = 5;
      } else {
        multiplier = 3;
      }
    } else if (uniqueIcons.length === 2) {
      // Two matching symbols
      multiplier = 2;
    }
    
    const winAmount = isWin ? actualBetAmount * multiplier : 0;
    
    const responseData = {
      symbols,
      win: isWin,
      winAmount,
      betAmount: actualBetAmount,
      multiplier: isWin ? multiplier : 0,
      correlationId,
      timestamp: new Date().toISOString()
    };
    
    logTelemetry('SLOTS_TEST_PAYOUT', {
      game: 'Vegas Slots',
      action: 'test-payout',
      symbols,
      betAmount: actualBetAmount,
      win: isWin,
      winAmount,
      multiplier,
      correlationId
    });
    
    res.json(responseData);
    
  } catch (error) {
    const errorData = {
      error: 'SLOTS_TEST_ERROR',
      message: error.message,
      correlationId,
      timestamp: new Date().toISOString()
    };
    
    logTelemetry('ERROR', {
      game: 'Vegas Slots',
      action: 'test-payout',
      error: error.message,
      correlationId
    });
    
    res.status(500).json(errorData);
  }
});

/**
 * Health check endpoint - Returns server status
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Start periodic metrics simulation
setInterval(() => {
  simulateSystemMetrics();
  io.emit('metrics-update', gameMetrics);
}, 5000); // Update every 5 seconds

// Error handling middleware
app.use((err, req, res, next) => {
  const correlationId = generateCorrelationId();
  
  logTelemetry('SERVER_ERROR', {
    error: err.message,
    stack: err.stack,
    correlationId
  });
  
  res.status(500).json({
    error: 'Internal Server Error',
    correlationId,
    timestamp: new Date().toISOString()
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎰 Dynatrace Vegas Casino Server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Metrics available at http://0.0.0.0:${PORT}/metrics`);
  console.log(`🌐 External access available at http://3.85.230.103:${PORT}`);
  console.log(`🔌 WebSocket server ready for real-time updates`);
  // Pre-start game services to improve first-request experience
  startChildService(SERVICE_NAMES.slots, path.join('services','slots-service.js'));
  startChildService(SERVICE_NAMES.roulette, path.join('services','roulette-service.js'));
  startChildService(SERVICE_NAMES.dice, path.join('services','dice-service.js'));
  startChildService(SERVICE_NAMES.blackjack, path.join('services','blackjack-service.js'));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});