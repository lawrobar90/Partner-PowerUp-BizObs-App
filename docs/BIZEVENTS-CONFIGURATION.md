# Dynatrace BizEvents Configuration for Vegas Casino

This document describes the BizEvents (Business Events) that are sent to Dynatrace from the Vegas Casino application for comprehensive business monitoring and analysis.

## BizEvents Overview

BizEvents provide business context to technical metrics, allowing you to correlate business outcomes with system performance. The Vegas Casino application sends the following BizEvents:

## Event Types

### 1. Game Events

#### `com.dynatrace.vegas.slots.spin`
**Description**: Triggered when a player spins the slot machine
**Frequency**: Per spin action

```json
{
  "specversion": "1.0",
  "type": "com.dynatrace.vegas.slots.spin",
  "source": "vegas-slots-service",
  "id": "abc123def456",
  "time": "2025-09-29T14:30:22.123Z",
  "dt": {
    "entity": {
      "type": "SERVICE",
      "name": "vegas-slots-service"
    }
  },
  "data": {
    "game": "Slots",
    "username": "PlayerName",
    "betAmount": 25,
    "win": true,
    "winAmount": 150,
    "symbols": ["cherry", "cherry", "cherry"],
    "payline": "center",
    "casino": "Dynatrace Vegas",
    "environment": "production",
    "correlationId": "def789ghi012"
  }
}
```

#### `com.dynatrace.vegas.roulette.spin`
**Description**: Triggered when a player spins the roulette wheel

```json
{
  "specversion": "1.0",
  "type": "com.dynatrace.vegas.roulette.spin",
  "source": "vegas-roulette-service",
  "id": "ghi456jkl789",
  "time": "2025-09-29T14:31:15.456Z",
  "dt": {
    "entity": {
      "type": "SERVICE",
      "name": "vegas-roulette-service"
    }
  },
  "data": {
    "game": "Roulette",
    "username": "PlayerName",
    "betAmount": 50,
    "betType": "color",
    "betValue": "red",
    "winningNumber": 18,
    "color": "red",
    "win": true,
    "winAmount": 100,
    "casino": "Dynatrace Vegas",
    "environment": "production"
  }
}
```

#### `com.dynatrace.vegas.dice.roll`
**Description**: Triggered when a player rolls the dice

```json
{
  "specversion": "1.0",
  "type": "com.dynatrace.vegas.dice.roll",
  "source": "vegas-dice-service",
  "id": "jkl789mno012",
  "time": "2025-09-29T14:32:08.789Z",
  "dt": {
    "entity": {
      "type": "SERVICE",
      "name": "vegas-dice-service"
    }
  },
  "data": {
    "game": "Dice",
    "username": "PlayerName",
    "betAmount": 10,
    "betType": "seven_out",
    "dice1": 3,
    "dice2": 4,
    "sum": 7,
    "win": true,
    "winAmount": 40,
    "casino": "Dynatrace Vegas",
    "environment": "production"
  }
}
```

#### `com.dynatrace.vegas.blackjack.deal`
**Description**: Triggered when a blackjack hand is dealt

```json
{
  "specversion": "1.0",
  "type": "com.dynatrace.vegas.blackjack.deal",
  "source": "vegas-blackjack-service",
  "id": "mno012pqr345",
  "time": "2025-09-29T14:33:42.012Z",
  "dt": {
    "entity": {
      "type": "SERVICE",
      "name": "vegas-blackjack-service"
    }
  },
  "data": {
    "game": "Blackjack",
    "username": "PlayerName",
    "betAmount": 75,
    "gameId": "PlayerName_1727618022012",
    "playerScore": 20,
    "dealerUpCard": {"suit": "♠", "value": "7"},
    "casino": "Dynatrace Vegas",
    "environment": "production"
  }
}
```

### 2. User Events

#### `com.dynatrace.vegas.user.login`
**Description**: Triggered when a user logs into the casino

```json
{
  "specversion": "1.0",
  "type": "com.dynatrace.vegas.user.login",
  "source": "vegas-casino-main",
  "id": "pqr345stu678",
  "time": "2025-09-29T14:25:15.345Z",
  "dt": {
    "entity": {
      "type": "SERVICE",
      "name": "vegas-casino-main"
    }
  },
  "data": {
    "username": "PlayerName",
    "securityLevel": "Maximum Security",
    "sessionId": "sess_789abc456def",
    "userAgent": "Mozilla/5.0...",
    "casino": "Dynatrace Vegas",
    "environment": "production"
  }
}
```

#### `com.dynatrace.vegas.user.logout`
**Description**: Triggered when a user logs out

```json
{
  "specversion": "1.0",
  "type": "com.dynatrace.vegas.user.logout",
  "source": "vegas-casino-main",
  "id": "stu678vwx901",
  "time": "2025-09-29T15:45:30.678Z",
  "dt": {
    "entity": {
      "type": "SERVICE",
      "name": "vegas-casino-main"
    }
  },
  "data": {
    "username": "PlayerName",
    "sessionTime": 1215.5,
    "gamesPlayed": 23,
    "totalWagered": 850,
    "netWinnings": 125,
    "casino": "Dynatrace Vegas",
    "environment": "production"
  }
}
```

### 3. Business Metrics Events

#### `com.dynatrace.vegas.metric.custom`
**Description**: Custom business metrics

```json
{
  "specversion": "1.0",
  "type": "com.dynatrace.vegas.metric.custom",
  "source": "vegas-analytics-service",
  "id": "vwx901yza234",
  "time": "2025-09-29T14:35:00.000Z",
  "dt": {
    "entity": {
      "type": "SERVICE",
      "name": "vegas-analytics-service"
    }
  },
  "data": {
    "metricName": "casino.bet.amount",
    "value": 25,
    "dimensions": {
      "game": "slots"
    },
    "casino": "Dynatrace Vegas",
    "environment": "production"
  }
}
```

## Configuration for Dynatrace

### 1. Ingest API Setup
To send BizEvents to Dynatrace, configure these environment variables:

```bash
export DT_TENANT="your-tenant-id"
export DT_API_TOKEN="your-api-token"
export DT_INGEST_URL="https://your-tenant.live.dynatrace.com/api/v2"
```

### 2. Business Events Configuration
In Dynatrace, go to **Applications & Microservices → Business Events** to:
- View incoming business events
- Create custom metrics from business events
- Set up business event-based alerts
- Create dashboards with business context

### 3. Custom Dashboards
Create dashboards that combine:
- Technical metrics (response time, error rate, throughput)
- Business metrics (bet amounts, win rates, player activity)
- Service topology view showing all Vegas Casino microservices

## Benefits

1. **Business Context**: Correlate technical issues with business impact
2. **Service Visibility**: Each game appears as a separate service in Dynatrace
3. **End-to-End Tracing**: Full request flow visibility across all services
4. **Custom Metrics**: Business KPIs alongside technical metrics
5. **Alerting**: Alert on both technical and business anomalies
6. **Root Cause Analysis**: Quickly identify which service/game is affected

## Example Queries

### USQL Queries for Business Events

```sql
-- Top players by total wagered
SELECT username, SUM(betAmount) as totalWagered 
FROM bizevents 
WHERE event.type LIKE "com.dynatrace.vegas.%"
GROUP BY username 
ORDER BY totalWagered DESC

-- Win rate by game type
SELECT game, 
       AVG(CASE WHEN win=true THEN 1.0 ELSE 0.0 END) as winRate,
       COUNT(*) as totalGames
FROM bizevents 
WHERE event.type LIKE "com.dynatrace.vegas.%.spin"
GROUP BY game

-- Revenue by hour
SELECT HOUR(timestamp) as hour,
       SUM(betAmount) as revenue,
       SUM(winAmount) as payouts,
       SUM(betAmount) - SUM(winAmount) as profit
FROM bizevents 
WHERE event.type LIKE "com.dynatrace.vegas.%"
GROUP BY hour
ORDER BY hour
```

This comprehensive BizEvents setup provides full business observability for the Vegas Casino application.