# Vegas Slots LoadRunner Site Reliability Guardian - API Import Guide

## Quick Setup

I've created **3 SRG configurations** and an **automated import script** for your Dynatrace tenant.

### 📁 Files Created

1. **`vegas-slots-srg-simple-api.json`** ⭐ **RECOMMENDED**
   - Correctly formatted for Dynatrace Settings API
   - 5 key performance objectives
   - Ready for immediate import

2. **`vegas-slots-srg-api-format.json`**
   - Comprehensive version with advanced features
   - More detailed configuration options

3. **`import-srg.sh`**
   - Automated import script using Dynatrace API
   - Includes validation and error handling

## 🚀 Import Methods

### Method 1: API Import (Recommended)

1. **Configure the import script**:
   ```bash
   # Edit import-srg.sh and update these values:
   DYNATRACE_TENANT="https://YOUR_TENANT.live.dynatrace.com"
   API_TOKEN="dt0c01.YOUR_API_TOKEN_HERE"
   ```

2. **Run the import**:
   ```bash
   ./import-srg.sh
   ```

### Method 2: Manual API Import

```bash
curl -X POST \
  -H "Authorization: Api-Token YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d @vegas-slots-srg-simple-api.json \
  "https://YOUR_TENANT.live.dynatrace.com/api/v2/settings/objects"
```

### Method 3: Dynatrace UI Import

1. Go to **Settings** → **Objects** → **Site Reliability Guardian**
2. Click **"Create new"**
3. Copy and paste the JSON content from `vegas-slots-srg-simple-api.json`

## 📊 Site Reliability Guardian Objectives

### 1. **Slot Spin Response Time** (30% weight)
- **Warning**: > 500ms
- **Failure**: > 1000ms
- **Query**: `builtin:service.response.time:filter(and(eq("request.url.path","/api/slots/spin"),eq("LoadRunner Source ID","LoadRunner"))):avg`

### 2. **Error Rate** (25% weight)
- **Warning**: > 2%
- **Failure**: > 5%
- **Query**: `builtin:service.errors.total.rate:filter(eq("LoadRunner Source ID","LoadRunner")):avg`

### 3. **Throughput** (20% weight)
- **Warning**: < 30 RPM
- **Failure**: < 15 RPM
- **Query**: `builtin:service.requestCount.total:filter(eq("LoadRunner Source ID","LoadRunner")):rate`

### 4. **Navigation Response Time** (15% weight)
- **Warning**: > 300ms
- **Failure**: > 800ms
- **Query**: `builtin:service.response.time:filter(and(in("LoadRunner Test Step Name",["Navigate_To_Lobby","Navigate_To_Slots"]),eq("LoadRunner Source ID","LoadRunner"))):avg`

### 5. **Success Rate** (10% weight)
- **Warning**: < 98%
- **Failure**: < 95%
- **Query**: Complex calculation for success percentage

## ✅ Prerequisites

### Required Request Attributes

Ensure these are configured in **Settings** → **Server-side service monitoring** → **Request attributes**:

1. **LoadRunner Source ID**
   - Data source: `HTTP request header`
   - Header name: `x-dynatrace-test`
   - Extract using regex: `SI=([^;]+)`

2. **LoadRunner Test Step Name**
   - Data source: `HTTP request header`
   - Header name: `x-dynatrace-test`
   - Extract using regex: `TSN=([^;]+)`

3. **LoadRunner Virtual User**
   - Data source: `HTTP request header`
   - Header name: `x-dynatrace-test`
   - Extract using regex: `VU=([^;]+)`

### API Token Permissions

Your API token needs:
- ✅ **Read settings**
- ✅ **Write settings**

## 🧪 Testing the Guardian

1. **Import the SRG** (using method above)

2. **Run LoadRunner test**:
   ```bash
   ./run-vegas-loadtest.sh
   ```

3. **Verify Guardian activation**:
   - Go to **Observe and explore** → **Site Reliability Guardian**
   - Find "Vegas Slots LoadRunner SRG"
   - Should show "Active" during test execution

4. **Monitor objectives** in real-time during test execution

## 🔧 Troubleshooting

### Import Fails with "Could not map JSON"
- ✅ Use `vegas-slots-srg-simple-api.json` (correct API format)
- ❌ Don't use `vegas-slots-loadrunner-srg.json` (wrong format)

### Guardian Not Activating
1. Verify LoadRunner tests send `x-dynatrace-test` headers
2. Check request attributes capture header values
3. Run test and check server logs for header confirmation

### No Data in Metrics
1. Confirm request attributes are working
2. Verify service is receiving LoadRunner traffic
3. Check metric queries return data in Data Explorer

### Objectives Always Fail
1. Run baseline test to establish realistic thresholds
2. Adjust warn/fail values in the JSON before import
3. Consider your environment's performance characteristics

## 📈 Using the Guardian

### During LoadRunner Tests
- Guardian automatically evaluates when LoadRunner traffic detected
- Real-time monitoring of all 5 objectives
- Automatic alerts if quality gates fail

### Integration with CI/CD
```bash
# Check guardian status after test
GUARDIAN_ID="your-guardian-id"
curl -H "Authorization: Api-Token $API_TOKEN" \
  "$DYNATRACE_TENANT/api/v2/slo/$GUARDIAN_ID/evaluation"
```

### Dashboard Integration
- Create custom dashboards filtered by LoadRunner Test Name
- Use guardian results for performance trend analysis
- Set up additional alerting based on guardian scores

## 🎯 Next Steps

1. **Import the SRG** using the provided script or API call
2. **Configure request attributes** if not already done
3. **Run a test** to verify everything works
4. **Adjust thresholds** based on your performance requirements
5. **Set up alerting** for your team's notification preferences

The Site Reliability Guardian will now automatically monitor your Vegas Slots LoadRunner tests and provide quality gates to ensure performance standards! 🚀