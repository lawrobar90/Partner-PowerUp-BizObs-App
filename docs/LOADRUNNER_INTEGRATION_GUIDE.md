# Vegas Slots LoadRunner Integration Guide

## Overview
This integration combines your Vegas Slots application with LoadRunner performance testing and Dynatrace observability. The setup includes automatic Dynatrace request tagging for enhanced monitoring during load tests.

## Prerequisites
- Vegas application running on localhost:3000
- LoadRunner (or simulation mode using curl)
- Dynatrace agent installed and configured
- Basic Linux command line tools (curl, bc)

## Files Structure
```
/home/ec2-user/
├── loadrunner-scripts/
│   └── Vegas-Slots-Load-Test/
│       ├── vegas_slots_test.c      # Main LoadRunner test script
│       ├── globals.h               # Dynatrace integration functions
│       ├── vuser_init.c           # Test initialization
│       ├── default.usr            # LoadRunner project file
│       ├── parameters.prm         # Test parameters
│       ├── ServerHosts.dat        # Server configuration
│       └── BetAmounts.dat         # Bet amount variations
├── run-vegas-loadtest.sh          # 5-minute test execution script
├── test-integration.sh            # Integration verification script
├── dynatrace-request-attributes-config.txt  # Dynatrace setup guide
└── loadrunner-results/            # Test results directory (created during execution)
```

## Quick Start - 5 Minute Load Test

### 1. Run the Command
```bash
./run-vegas-loadtest.sh
```

This single command will:
- ✅ Verify Vegas application is running
- 🚀 Execute 5-minute load test with 10 virtual users
- 📊 Generate detailed HTML report
- 🏷️ Include proper Dynatrace request tagging

### 2. Test Configuration
- **Duration:** 5 minutes (300 seconds)
- **Virtual Users:** 10 concurrent users
- **Ramp Up:** 60 seconds
- **Ramp Down:** 60 seconds
- **Target:** localhost:3000 (your Vegas app)

### 3. Test Scenarios
Each virtual user will:
1. Navigate to lobby (`/lobby.html`)
2. Navigate to slots game (`/vegas-slots.html`)
3. Perform 3-8 random slot spins via API (`/api/slots/spin`)
4. Return to lobby
5. Repeat cycle for test duration

## Dynatrace Integration

### Request Tagging
Each HTTP request includes the `x-dynatrace-test` header with:
- **TSN** (Test Step Name): Navigate_To_Lobby, Navigate_To_Slots, Slot_Spin, etc.
- **LSN** (Load Script Name): Vegas-Slots-Load-Test
- **LTN** (Load Test Name): Unique test execution identifier
- **VU** (Virtual User): 1-10
- **SI** (Source ID): LoadRunner

### Dynatrace Configuration Required
Before running tests, configure these request attributes in Dynatrace:

1. Go to **Settings → Server-side service monitoring → Request attributes**
2. Create 5 new request attributes using configurations in `dynatrace-request-attributes-config.txt`

### Example Request Header
```
x-dynatrace-test: TSN=Slot_Spin;LSN=Vegas-Slots-Load-Test;LTN=Vegas_Slots_5Min_Load_Test_20250929_143022;VU=3;SI=LoadRunner
```

## Test Execution Process

### With LoadRunner Installed
If LoadRunner Controller/VuGen is installed:
```bash
# The script automatically detects and uses LoadRunner binaries
./run-vegas-loadtest.sh
```

### Simulation Mode (No LoadRunner)
If LoadRunner is not installed, the script falls back to curl-based simulation:
- Creates 10 concurrent background processes
- Each simulates a virtual user journey
- Includes proper Dynatrace headers
- Generates same telemetry as real LoadRunner

## Results and Analysis

### Test Results Location
```
/home/ec2-user/loadrunner-results/Vegas_Slots_5Min_Load_Test_TIMESTAMP/
├── vegas_slots_scenario.lrs    # LoadRunner scenario file
├── test_report.html           # Comprehensive test report
├── simulation.log             # Overall test log
├── user_1.log                 # Individual user logs
├── user_2.log
└── ...
```

### Dynatrace Analysis
After test execution:

1. **Navigate to Services** in Dynatrace
2. **Find your Vegas service** (likely shown as Node.js service on port 3000)
3. **Filter by Load Test Name**: Use request attribute filter
4. **Analyze Metrics**:
   - Response times by test step
   - Throughput and error rates
   - Resource utilization
   - PurePaths for detailed transaction analysis

### Key Metrics to Monitor
- **Response Time**: Average response time for each test step
- **Throughput**: Requests per second during peak load
- **Error Rate**: Percentage of failed requests
- **Resource Usage**: CPU, memory, and database impact
- **Business Transactions**: Slot spin success rates and payouts

## Customization Options

### Modify Test Duration
Edit `run-vegas-loadtest.sh`:
```bash
TEST_DURATION=300  # Change to desired seconds
```

### Adjust Virtual Users
```bash
VIRTUAL_USERS=10   # Change to desired user count
```

### Change Target Server
```bash
SERVER_HOST="your-server-ip"
SERVER_PORT="3000"
```

### Modify Test Scenarios
Edit `vegas_slots_test.c` to:
- Add new API endpoints
- Change think times
- Modify test data
- Add error scenarios

## Integration Benefits

### Performance Engineering
- **Shift-Left Testing**: Integrate load testing into CI/CD pipeline
- **Performance Budgets**: Set SLAs based on load test results  
- **Capacity Planning**: Understand application scaling limits

### Observability
- **Request Correlation**: Link load test traffic to specific performance issues
- **Service Dependencies**: Identify bottlenecks in microservice calls
- **Real User Impact**: Compare load test results to production metrics

### Automation
- **Scheduled Testing**: Run regular performance regression tests
- **Alert Integration**: Trigger alerts when performance degrades
- **Report Generation**: Automatic HTML reports with actionable insights

## Troubleshooting

### Vegas App Not Running
```bash
cd /home/ec2-user/vegas-observability
nohup node dynatrace/server.js > server.log 2>&1 &
```

### Port Conflicts
Change port in script if 3000 is occupied:
```bash
netstat -tlnp | grep :3000
```

### Dynatrace Headers Not Appearing
1. Check Dynatrace agent configuration
2. Verify request attribute regex patterns
3. Ensure x-dynatrace-test header is properly formatted

### Test Execution Fails
```bash
# Run integration test first
./test-integration.sh

# Check logs
tail -f /home/ec2-user/loadrunner-results/latest/simulation.log
```

## Advanced Usage

### Custom Test Scenarios
Create new LoadRunner scripts for:
- Multi-game testing (slots + roulette + blackjack)
- Error scenario testing
- Peak traffic simulation
- Endurance testing

### CI/CD Integration
```bash
# Add to your pipeline
./run-vegas-loadtest.sh && echo "Performance test passed" || exit 1
```

### Monitoring Dashboard
Create Dynatrace dashboard filtering by:
- Load test name
- Test step name
- Virtual user ID

## Support and Extension

This LoadRunner integration provides a foundation for comprehensive performance testing of your Vegas application. The combination of LoadRunner's load generation capabilities with Dynatrace's observability creates a powerful performance engineering solution.

For questions or enhancements, refer to the individual script files which contain detailed comments and configuration options.