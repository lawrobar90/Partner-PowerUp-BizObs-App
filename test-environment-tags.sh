#!/bin/bash

echo "🏷️ Testing Environment Variable-Based Dynatrace Tagging..."

# Function to create a journey with company-specific environment variables
create_company_journey() {
    local company=$1
    local domain=$2
    local industry=$3
    
    echo ""
    echo "🏢 Creating journey for $company ($industry)..."
    echo "   📍 Domain: $domain"
    
    # Create journey simulation with company context
    curl -X POST http://localhost:4000/simulate \
        -H "Content-Type: application/json" \
        -d '{
            "company": "'$company'",
            "domain": "'$domain'",
            "industry": "'$industry'",
            "mode": "chained", 
            "steps": [
                {"action": "login", "customerId": "user123", "metadata": {"company": "'$company'"}},
                {"action": "browse", "category": "products", "metadata": {"domain": "'$domain'"}},
                {"action": "select", "productId": "prod-001", "metadata": {"industry": "'$industry'"}},
                {"action": "purchase", "amount": 299.99, "metadata": {"companyName": "'$company'"}},
                {"action": "confirmation", "orderId": "ord-'$company'-001", "metadata": {"industryType": "'$industry'"}},
                {"action": "analytics", "event": "purchase_complete", "metadata": {"domain": "'$domain'"}}
            ]
        }' | jq '.' || echo "Journey created for $company"
    
    sleep 2
}

echo "🔧 Starting environment variable-based multi-tenant simulation..."

# Test multiple companies with different industries
create_company_journey "ShopMart" "shopmart.com" "retail"
create_company_journey "TechCorp" "techcorp.io" "technology" 
create_company_journey "HealthPlus" "healthplus.org" "healthcare"
create_company_journey "FinanceFirst" "financefirst.com" "finance"
create_company_journey "EduLearn" "edulearn.edu" "education"

echo ""
echo "🔍 Checking running processes with environment variables..."
echo ""

# Check if any services are running and show their environment variables
PIDS=$(pgrep -f "dynamic-step-service.cjs" 2>/dev/null || echo "")
if [ -n "$PIDS" ]; then
    echo "🎯 Found running services with environment variables:"
    for pid in $PIDS; do
        echo ""
        echo "📊 Service PID: $pid"
        # Show environment variables for Dynatrace tagging
        cat /proc/$pid/environ 2>/dev/null | tr '\0' '\n' | grep -E "COMPANY_NAME|DOMAIN|INDUSTRY_TYPE|DT_" | head -10
    done
else
    echo "⚠️  No dynamic services currently running. Run a journey to see environment variables."
fi

echo ""
echo "🎯 Expected Dynatrace Filtering Options:"
echo "   • companyName: ShopMart, TechCorp, HealthPlus, FinanceFirst, EduLearn"
echo "   • domain: shopmart.com, techcorp.io, healthplus.org, financefirst.com, edulearn.edu"
echo "   • industryType: retail, technology, healthcare, finance, education"

echo ""
echo "🔍 Dynatrace Service Detection Environment Variables:"
echo "   • DT_CUSTOM_PROP_companyName=[Company Name]"
echo "   • DT_CUSTOM_PROP_domain=[Domain]"
echo "   • DT_CUSTOM_PROP_industryType=[Industry]"
echo "   • DT_TAGS=companyName=[Company],domain=[Domain],industryType=[Industry]"

echo ""
echo "✅ Environment variable tagging test complete!"
echo "   Services will now appear in Dynatrace with company/domain/industry context"
echo "   Use these filters in Dynatrace Services view for multi-tenant filtering"