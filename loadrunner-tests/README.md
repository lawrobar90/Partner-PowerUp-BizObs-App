# BizObs LoadRunner Integration

This directory contains LoadRunner test scripts and configurations generated from BizObs customer journey simulations, with full **Dynatrace tagging support** using LSN, TSN, and LTN parameters.

## 🏗️ Directory Structure

```
loadrunner-tests/
├── templates/                          # LoadRunner script templates
│   └── bizobs-journey-template.c       # Base template with LSN/TSN/LTN support
├── scenarios/                          # Test scenario configurations
│   ├── light-load.json                 # Baseline performance testing
│   ├── medium-load.json                # Standard volume testing
│   ├── heavy-load.json                 # Peak hour simulation
│   ├── stress-test.json                # Beyond capacity limits
│   └── spike-test.json                 # Sudden traffic surge
├── lr-test-manager.sh                  # Test suite management script
└── [Company]_[Timestamp]/              # Generated test runs
    ├── [Company]_Journey.c             # Generated LoadRunner script
    └── test-config.json                # Test configuration and metadata
```

## 🏷️ Dynatrace Integration Tags

### LSN (Load Script Name)
Identifies the LoadRunner script uniquely across all tests.
- **Format**: `BizObs_[Company]_[Domain]_Journey`
- **Example**: `BizObs_Next_Retail_Journey`

### TSN (Test Step Name) 
Identifies individual steps within the customer journey.
- **Values**: Dynamic per journey step
- **Examples**: `ProductDiscovery`, `CartManagement`, `CheckoutProcess`
- **Special**: `Journey_Start`, `Journey_Complete` for test boundaries

### LTN (Load Test Name)
Identifies the specific test execution run.
- **Format**: `[Company]_[TestType]_Test_[Date]`
- **Example**: `Next_Performance_Test_20251127`

## 🚀 Usage

### Generate LoadRunner Scripts

#### Via Web Interface
1. Navigate to BizObs Generator web interface
2. Create/load a customer journey configuration
3. Click "Generate LoadRunner Script"
4. Select desired test scenario (light, medium, heavy, stress, spike)
5. Download generated script and configuration

#### Via API
```bash
curl -X POST http://localhost:8080/api/loadrunner/generate \
  -H "Content-Type: application/json" \
  -d '{
    "journey": {
      "companyName": "Next",
      "domain": "retail",
      "steps": [...journey steps...]
    },
    "scenario": "medium",
    "dynatraceConfig": {
      "lsn": "BizObs_Next_Retail_Journey",
      "ltn": "Next_Performance_Test_20251127"
    }
  }'
```

### Manage Test Suite

Use the test manager script for comprehensive test management:

```bash
# List available test scenarios
./loadrunner-tests/lr-test-manager.sh list-scenarios

# List generated test runs  
./loadrunner-tests/lr-test-manager.sh list-tests

# Validate a specific test
./loadrunner-tests/lr-test-manager.sh validate Next_2025-11-27T10-30-00-000Z

# Clean old test runs (older than 7 days)
./loadrunner-tests/lr-test-manager.sh clean 7d

# Monitor active tests
./loadrunner-tests/lr-test-manager.sh monitor --active-only
```

## 📊 Test Scenarios

### Light Load
- **Purpose**: Baseline performance validation
- **VUsers**: 20 | **Duration**: 10 minutes
- **Journey Interval**: 30 seconds
- **Error Simulation**: Disabled

### Medium Load  
- **Purpose**: Standard business volume simulation
- **VUsers**: 60 | **Duration**: 15 minutes
- **Journey Interval**: 15 seconds
- **Error Simulation**: 2% error rate

### Heavy Load
- **Purpose**: Peak business hour simulation  
- **VUsers**: 120 | **Duration**: 20 minutes
- **Journey Interval**: 10 seconds
- **Error Simulation**: 5% error rate

### Stress Test
- **Purpose**: Beyond normal capacity limits
- **VUsers**: 360 | **Duration**: 30 minutes
- **Journey Interval**: 5 seconds
- **Error Simulation**: 10% error rate

### Spike Test
- **Purpose**: Sudden traffic surge simulation
- **VUsers**: 600 | **Duration**: 5 minutes
- **Journey Interval**: 2 seconds
- **Error Simulation**: 15% error rate

## 🎯 Generated Script Features

### Dynatrace Headers
Every request includes Dynatrace tagging headers:
```c
sprintf(dt_header, "VU: %d; SI: %s; TSN: %s; LSN: %s; LTN: %s", 
        lr_get_vuser_id(), lr_get_session_id(), step_name, LSN, LTN);
web_add_header("X-dynaTrace", dt_header);
```

### LoadRunner Metadata
Additional headers for LoadRunner integration:
```c
web_add_header("X-LoadRunner-Company", company_name);
web_add_header("X-LoadRunner-Step", step_name);
web_add_header("X-LoadRunner-Duration", duration);
```

### Error Simulation
Configurable error injection based on scenario:
```c
if (error_simulation && (rand() % 100) < error_rate) {
    lr_end_transaction(transaction_name, LR_FAIL);
    lr_error_message("Simulated error in step: %s", step_name);
    return LR_FAIL;
}
```

### Journey Timing
Realistic think times and step durations:
```c
lr_think_time(duration * 1000);  // Convert to milliseconds
```

## 🔍 Monitoring & Analytics

### Transaction Names
- `Journey_Initialization` - Test setup
- `Step_[StepName]` - Individual journey steps  
- `Journey_Complete` - Test cleanup
- `Error_[StepName]` - Error handling transactions

### Performance Metrics
Each scenario includes monitoring thresholds:
- Response time thresholds
- Error rate limits  
- Throughput targets
- Resource utilization bounds

### Dynatrace Integration
Scripts automatically tag requests for:
- Service flow analysis
- Performance trending
- Error correlation
- Load test identification
- Business journey tracking

## 📋 Example Generated Script Structure

```c
Action()
{
    // Initialize with Dynatrace tagging
    lr_start_transaction("Journey_Initialization");
    sprintf(dt_header, "VU: %d; SI: %s; TSN: Journey_Start; LSN: %s; LTN: %s", 
            lr_get_vuser_id(), lr_get_session_id(), LSN, LTN);
    web_add_header("X-dynaTrace", dt_header);
    lr_end_transaction("Journey_Initialization", LR_PASS);
    
    // Execute journey steps with individual TSN tagging
    execute_journey_step("ProductDiscovery", "/api/process", "POST", body, 13);
    execute_journey_step("CartManagement", "/api/process", "POST", body, 8);
    execute_journey_step("CheckoutProcess", "/api/process", "POST", body, 19);
    
    // Complete journey with final tagging
    lr_start_transaction("Journey_Complete");
    sprintf(dt_header, "VU: %d; SI: %s; TSN: Journey_Complete; LSN: %s; LTN: %s", 
            lr_get_vuser_id(), lr_get_session_id(), LSN, LTN);
    web_add_header("X-dynaTrace", dt_header);
    lr_end_transaction("Journey_Complete", LR_PASS);
    
    return 0;
}
```

## 🔧 Configuration Files

Each generated test includes a `test-config.json` with:
- Test execution metadata
- Dynatrace integration settings (LSN/TSN/LTN)
- Journey configuration details  
- LoadRunner parameters
- Monitoring thresholds

## 🚦 Best Practices

1. **Use appropriate scenarios** for your testing objectives
2. **Monitor Dynatrace** for real-time performance data during tests
3. **Validate scripts** before executing large-scale tests
4. **Clean old test runs** regularly to manage disk space  
5. **Review error patterns** in generated scripts for realism
6. **Correlate LoadRunner results** with Dynatrace analytics

## 🆘 Troubleshooting

### Common Issues
- **Missing headers**: Ensure Dynatrace integration is enabled
- **Script syntax errors**: Validate using lr-test-manager.sh
- **Performance issues**: Check scenario parameters match system capacity
- **Tag correlation**: Verify LSN/TSN/LTN values in Dynatrace

### Support
- Check BizObs Generator logs for script generation issues  
- Use test manager validation for script verification
- Review journey configuration JSON for completeness