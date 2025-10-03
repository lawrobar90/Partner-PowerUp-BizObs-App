# Dynatrace Service Tagging by Company

## 🎯 Overview

Services are now automatically tagged with company context to enable easy filtering and splitting in Dynatrace Service view. Each service carries tags for company name, domain, and industry type.

## 🏷️ Automatic Tags Applied

### Environment Variables Set:
```bash
DT_TAGS=company=ShopMart,domain=shopmart.com,industry=retail,service=ProductDiscoveryService
DT_CUSTOM_PROP_company=ShopMart
DT_CUSTOM_PROP_domain=shopmart.com
DT_CUSTOM_PROP_industry=retail
DT_CUSTOM_PROP_service_type=customer_journey_step
```

### HTTP Headers Set:
```http
X-Company-Name: ShopMart
X-Company-Domain: shopmart.com
X-Industry-Type: retail
dt.custom.company: ShopMart
dt.custom.domain: shopmart.com
dt.custom.industry: retail
```

## 📊 Dynatrace Filtering & Splitting

### 1. Service View Filtering

**Navigate to:** Services → Service view

**Filter Options:**
- **By Company:** `company:ShopMart`
- **By Industry:** `industry:retail`
- **By Domain:** `domain:shopmart.com`
- **Combined:** `company:ShopMart AND industry:retail`

### 2. Service Overview Dashboard

**Create Custom Dashboard:**
1. Add "Services" tile
2. Set filter: `company:[CompanyName]`
3. Group by: `Service name`
4. Split by: `company` tag

### 3. Multi-Tenant View

**Filter Examples:**
```
company:ShopMart           # Show only ShopMart services
company:TechCorp           # Show only TechCorp services  
company:HealthPlus         # Show only HealthPlus services
industry:retail            # Show all retail companies
industry:technology        # Show all tech companies
```

## 🔍 Testing Different Companies

### Example Journey Calls:

**ShopMart (Retail):**
```bash
curl -X POST http://127.0.0.1:4000/api/journey-simulation/simulate-journey \
  -H 'Content-Type: application/json' \
  -d '{
    "companyName": "ShopMart",
    "domain": "shopmart.com", 
    "industryType": "retail",
    "stepNames": ["ProductDiscovery", "ProductSelection", "CartAddition"]
  }'
```

**TechCorp (Technology):**
```bash
curl -X POST http://127.0.0.1:4000/api/journey-simulation/simulate-journey \
  -H 'Content-Type: application/json' \
  -d '{
    "companyName": "TechCorp",
    "domain": "techcorp.io",
    "industryType": "technology", 
    "stepNames": ["ProductDiscovery", "FeatureExploration", "TrialSignup"]
  }'
```

**HealthPlus (Healthcare):**
```bash
curl -X POST http://127.0.0.1:4000/api/journey-simulation/simulate-journey \
  -H 'Content-Type: application/json' \
  -d '{
    "companyName": "HealthPlus",
    "domain": "healthplus.care",
    "industryType": "healthcare",
    "stepNames": ["ServiceExploration", "AppointmentScheduling", "Registration"] 
  }'
```

## 🎨 Dashboard Creation

### Company Comparison Dashboard:

**Tiles to Add:**
1. **Service Throughput by Company**
   - Filter: `service_type:customer_journey_step`
   - Split by: `company`

2. **Response Time by Industry**
   - Filter: `service_type:customer_journey_step`
   - Split by: `industry`

3. **Error Rate by Domain**
   - Filter: `service_type:customer_journey_step`
   - Split by: `domain`

4. **Service Flow by Company**
   - Filter: `company:ShopMart`
   - Visualization: Service flow

## 🔧 Management & Queries

### DQL Queries:

**All Services by Company:**
```sql
fetch dt.entity.service
| filter tags[company] == "ShopMart"
| fields entity.name, tags[company], tags[industry], tags[domain]
```

**Performance by Company:**
```sql
timeseries avg(dt.service.response_time), by:{tags[company]}
| filter tags[service_type] == "customer_journey_step"
```

**Journey Completion by Industry:**
```sql
fetch dt.entity.service
| filter tags[service_type] == "customer_journey_step"
| summarize count(), by:{tags[industry]}
```

## 🚀 Quick Test

Run the company tagging test:
```bash
./test-company-tagging.sh
```

This will create services for 3 different companies and show how they appear with different tags in Dynatrace.

## ✅ Expected Results

**In Dynatrace Services View:**
- ShopMart services tagged: `company=ShopMart, industry=retail`
- TechCorp services tagged: `company=TechCorp, industry=technology`
- HealthPlus services tagged: `company=HealthPlus, industry=healthcare`

**Filtering Benefits:**
- Split multi-tenant workloads
- Compare performance across companies
- Filter by industry vertical
- Create company-specific dashboards
- Monitor SLA compliance per customer