# Dynatrace Vegas Casino - Testing Guide

## 🧪 Testing Dynatrace Integration

### Prerequisites
- Dynatrace tenant with appropriate permissions
- API tokens configured in `.env` file
- OneAgent installed (optional but recommended)

### Quick Integration Test

```bash
# Run the integration test script
./scripts/test-integration.sh

# Or test individual components:

# 1. Test server startup
npm start

# 2. Test BizEvents (in another terminal)
curl -X POST http://localhost:3000/api/slots/spin \
  -H "Content-Type: application/json" \
  -d '{"bet": 10, "userId": "test-user"}'

# 3. Check metrics endpoint
curl http://localhost:3000/metrics
```

### Testing Service Identification

Each service should appear separately in Dynatrace. Test by making requests to different game endpoints:

```bash
# Slots Service
curl -X POST http://localhost:3000/api/slots/spin \
  -H "Content-Type: application/json" \
  -d '{"bet": 5, "userId": "player1"}'

# Roulette Service  
curl -X POST http://localhost:3000/api/roulette/bet \
  -H "Content-Type: application/json" \
  -d '{"bet": 10, "number": 7, "userId": "player1"}'

# Blackjack Service
curl -X POST http://localhost:3000/api/blackjack/start \
  -H "Content-Type: application/json" \
  -d '{"bet": 15, "userId": "player1"}'

# Dice Service
curl -X POST http://localhost:3000/api/dice/roll \
  -H "Content-Type: application/json" \
  -d '{"bet": 8, "userId": "player1"}'
```

### Verifying BizEvents in Dynatrace

1. **Navigate to Dynatrace**: Open your Dynatrace tenant
2. **Business Events**: Go to `Observe and explore > Business events`
3. **Filter by Source**: Look for events with source `vegas-casino`
4. **Event Types**: Verify these event types appear:
   - `com.vegas.casino.game.spin`
   - `com.vegas.casino.game.bet`
   - `com.vegas.casino.user.login`
   - `com.vegas.casino.user.logout`

### USQL Query Examples

Test these queries in Dynatrace Data Explorer:

```sql
-- Game activity summary
FETCH bizevents
| FILTER event.type == "com.vegas.casino.game.spin"
| SUMMARIZE count() BY game, result

-- Player bet analysis
FETCH bizevents
| FILTER event.type STARTS_WITH "com.vegas.casino.game"
| SUMMARIZE total_bets = sum(bet_amount), total_winnings = sum(win_amount) BY user_id

-- Game performance metrics
FETCH bizevents
| FILTER event.type STARTS_WITH "com.vegas.casino.game"
| SUMMARIZE avg_bet = avg(bet_amount), max_win = max(win_amount) BY game
```

### Service Topology Verification

In Dynatrace Smartscape, you should see these services:

- **vegas-casino-main**: Main application service
- **vegas-slots-service**: Slot machine operations
- **vegas-roulette-service**: Roulette game logic
- **vegas-dice-service**: Dice game operations
- **vegas-blackjack-service**: Blackjack game logic
- **vegas-analytics-service**: Analytics and metrics
- **vegas-leaderboard-service**: Player rankings

### Load Testing with LoadRunner Results

The application includes LoadRunner test results in `/loadrunner-results/`. These can be used to:

1. **Baseline Performance**: Compare current metrics with load test results
2. **Stress Testing**: Understand application behavior under load
3. **Capacity Planning**: Use historical data for scaling decisions

### Troubleshooting

#### OneAgent Not Loading
- Check if OneAgent is installed: `ls -la /opt/dynatrace/oneagent/`
- Verify environment variables in `.env`
- Check server logs for OneAgent initialization messages

#### BizEvents Not Appearing
- Verify `DT_BIZEVENTS_TOKEN` and `DT_BIZEVENTS_TENANT_URL` in `.env`
- Check network connectivity to Dynatrace tenant
- Validate event payload format in server logs

#### Services Not Splitting
- Confirm service identification middleware is active
- Check HTTP headers in browser developer tools
- Verify service detection rules in Dynatrace

### Performance Benchmarks

Expected performance metrics from LoadRunner tests:

- **Concurrent Users**: 10 users
- **Test Duration**: 5 minutes
- **Average Response Time**: < 100ms
- **Throughput**: ~50 requests/second
- **Error Rate**: < 1%

### Monitoring Dashboards

Create these dashboards in Dynatrace:

1. **Casino Operations Dashboard**
   - Total bets and winnings
   - Game popularity metrics
   - Player activity patterns

2. **Technical Performance Dashboard**
   - Service response times
   - Error rates by service
   - WebSocket connection metrics

3. **Business Intelligence Dashboard**
   - Revenue per game
   - Player retention metrics
   - Peak usage periods