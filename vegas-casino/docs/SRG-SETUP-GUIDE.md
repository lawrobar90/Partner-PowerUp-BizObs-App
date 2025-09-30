# Vegas Slots LoadRunner Site Reliability Guardian (SRG) Setup Guide

## Overview
This Site Reliability Guardian monitors your Vegas Slots application during LoadRunner performance tests and provides automated quality gates to ensure performance standards are met.

## Files Provided

### 1. `vegas-slots-srg-simple.json` (Recommended)
- Simplified configuration for easy import
- 5 key performance objectives
- Ready to use with minimal customization

### 2. `vegas-slots-srg-detailed.json` 
- Comprehensive configuration with advanced features
- 6 detailed objectives with business metrics
- Custom alerting messages and metadata

### 3. `vegas-slots-loadrunner-srg.json`
- Basic template with full structure
- Includes alerting configuration
- Good starting point for customization

## Quick Setup Instructions

### Step 1: Import the SRG into Dynatrace

1. **Navigate to Site Reliability Guardian**:
   - Go to your Dynatrace tenant
   - Navigate to **Observe and explore** → **Site Reliability Guardian**
   - Click **"Create new guardian"**

2. **Import Configuration**:
   - Choose **"Import from JSON"**
   - Copy the contents of `vegas-slots-srg-simple.json`
   - Paste into the JSON editor
   - Click **"Import"**

### Step 2: Configure Service Mapping

**IMPORTANT**: You need to update the service references to match your actual Vegas service.

1. **Find Your Service ID**:
   ```
   Go to Services → Find your Vegas Slots service → Copy the service ID from URL
   Example: SERVICE-1234567890ABCDEF
   ```

2. **Update Service References** (if using detailed version):
   - Replace `"SERVICE-YOUR_VEGAS_SERVICE_ID"` with your actual service ID
   - Or use service tags: `entitySelector("type(service),tag(vegas-slots)")`

### Step 3: Verify Request Attributes

Ensure these request attributes are configured in Dynatrace:

1. **Navigate to Settings** → **Server-side service monitoring** → **Request attributes**

2. **Create these request attributes** (if not already created):

   **LoadRunner Source ID**:
   - Data source: HTTP request header
   - Header name: `x-dynatrace-test`
   - Extract using regex: `SI=([^;]+)`

   **LoadRunner Test Step Name**:
   - Data source: HTTP request header  
   - Header name: `x-dynatrace-test`
   - Extract using regex: `TSN=([^;]+)`

   **LoadRunner Test Name**:
   - Data source: HTTP request header
   - Header name: `x-dynatrace-test` 
   - Extract using regex: `LTN=([^;]+)`

   **LoadRunner Virtual User**:
   - Data source: HTTP request header
   - Header name: `x-dynatrace-test`
   - Extract using regex: `VU=([^;]+)`

### Step 4: Test the Guardian

1. **Run a LoadRunner Test**:
   ```bash
   ./run-vegas-loadtest.sh
   ```

2. **Verify Guardian Activation**:
   - Go to Site Reliability Guardian
   - Find "Vegas Slots LoadRunner SRG"
   - Check that it shows "Active" during test execution
   - Monitor objective evaluations in real-time

## Performance Objectives Explained

### 1. **Slot Spin Response Time** (Weight: 30%)
- **Warning**: > 500ms
- **Failure**: > 1000ms
- **Purpose**: Ensures slot spin API maintains fast response times

### 2. **Error Rate** (Weight: 25%) 
- **Warning**: > 2%
- **Failure**: > 5%
- **Purpose**: Monitors overall error rate across LoadRunner requests

### 3. **Throughput (RPM)** (Weight: 20%)
- **Warning**: < 30 requests/minute
- **Failure**: < 15 requests/minute  
- **Purpose**: Validates expected load generation

### 4. **Navigation Response Time** (Weight: 15%)
- **Warning**: > 300ms
- **Failure**: > 800ms
- **Purpose**: Ensures page navigation stays responsive

### 5. **Success Rate** (Weight: 10%)
- **Warning**: < 98%
- **Failure**: < 95%
- **Purpose**: Monitors business transaction success rate

## Guardian Conditions

The Guardian only evaluates when:
- LoadRunner tests are actively running (detects LoadRunner traffic)
- At least one request with `LoadRunner Source ID = "LoadRunner"` in the last 2 minutes

## Alerting Configuration

### Failure Alerts
- Triggered when any objective exceeds failure threshold
- Includes test details and recommended actions
- Provides links to relevant Dynatrace analysis views

### Warning Alerts  
- Triggered when any objective exceeds warning threshold
- Lighter notification for monitoring trends
- Helps prevent issues before they become failures

## Customization Options

### Adjust Thresholds
Modify `warn` and `fail` values based on your performance requirements:

```json
"target": {
  "warn": 300,  // Warning threshold
  "fail": 800   // Failure threshold
}
```

### Change Weights
Adjust objective importance (total must equal 100%):

```json
"weight": 35  // 35% of overall score
```

### Add Custom Objectives
Add new performance criteria:

```json
{
  "displayName": "Database Response Time",
  "target": {"warn": 100, "fail": 200},
  "weight": 10,
  "query": "builtin:service.database.response.time:filter(...):avg",
  "timeFrame": "-5m"
}
```

## Troubleshooting

### Guardian Not Activating
1. Verify LoadRunner tests are sending `x-dynatrace-test` headers
2. Check request attributes are properly configured
3. Ensure service is receiving LoadRunner traffic

### Objectives Always Failing
1. Check if thresholds are too strict for your environment
2. Verify metric queries are returning data
3. Review service performance baseline

### No Data in Metrics
1. Confirm request attributes are capturing header values
2. Verify service entity selector is correct
3. Check time frame settings match test duration

## Integration with CI/CD

Use the Guardian API to integrate quality gates into your pipeline:

```bash
# Check Guardian status
curl -H "Authorization: Api-Token YOUR_TOKEN" \
  "https://YOUR_TENANT.dynatrace.com/api/v2/slo/YOUR_GUARDIAN_ID/evaluation"

# Fail pipeline if Guardian fails
if [ $guardian_score -lt 80 ]; then
  echo "Quality gate failed!"
  exit 1
fi
```

## Best Practices

1. **Baseline First**: Run tests without Guardian to establish performance baseline
2. **Gradual Rollout**: Start with lenient thresholds, tighten over time
3. **Regular Review**: Adjust thresholds as application performance improves
4. **Team Alignment**: Ensure all stakeholders agree on performance criteria
5. **Documentation**: Keep performance requirements documented and updated

## Advanced Features

### Multiple Test Environments
Create separate Guardians for different environments:
- `Vegas Slots LoadRunner SRG - DEV`
- `Vegas Slots LoadRunner SRG - STAGING` 
- `Vegas Slots LoadRunner SRG - PROD`

### Time-based Conditions
Add time-based activation:
```json
"conditions": [{
  "displayName": "Business Hours Only",
  "query": "builtin:synthetic.browser.availability",
  "timeFrame": "-1h",
  "schedule": "CRON:0 9-17 * * 1-5"
}]
```

### Custom Dashboards
Create LoadRunner-specific dashboards filtered by Guardian results for deeper analysis.

---

## Support

For questions about this Site Reliability Guardian configuration:
1. Review the LoadRunner integration guide
2. Check Dynatrace documentation for SRG best practices  
3. Validate request attribute configuration
4. Test with smaller load first to verify setup