--8<-- "snippets/3-concepts.js"

# Core Concepts

Understanding the fundamental concepts behind business observability and journey simulation is essential for effectively using the BizObs Journey Simulator.

## 🎯 Business Observability

Business observability goes beyond traditional technical monitoring by connecting system performance directly to business outcomes and customer experiences.



### Traditional vs Business Observability

| Traditional Monitoring | Business Observability |
|----------------------|----------------------|
| Server CPU usage: 85% | Customer journey completion rate: 92% |
| Database response time: 250ms | Average quote generation time impacts 15% of conversions |
| HTTP 500 errors: 12 per minute | Payment failures cause $50K/hour revenue loss |
| Service uptime: 99.9% | Customer satisfaction score: 4.2/5.0 |

### Key Principles

1. **Business Context First**: Every technical metric should relate to a business outcome
2. **Customer-Centric Views**: Monitor from the customer's perspective, not just system health
3. **End-to-End Visibility**: Track complete business processes across all systems
4. **Real-Time Decision Making**: Enable immediate response to business-impacting issues

## 🛤️ Customer Journeys

Customer journeys represent the complete path a customer takes to achieve a goal, from initial awareness through conversion and beyond.

### Journey Components

#### 1. Journey Steps
Each journey consists of discrete, measurable steps:
```mermaid
graph LR
    A[Discovery] --> B[Research]
    B --> C[Comparison]
    C --> D[Decision]
    D --> E[Purchase]
    E --> F[Fulfillment]
    F --> G[Support]
```

#### 2. Business Context
Every step carries business meaning:
- **Discovery**: Marketing attribution, channel effectiveness
- **Research**: Content engagement, feature interest
- **Comparison**: Competitive positioning, price sensitivity
- **Decision**: Conversion optimization, abandonment reasons
- **Purchase**: Transaction success, payment preferences
- **Fulfillment**: Operational efficiency, satisfaction drivers
- **Support**: Retention indicators, upsell opportunities

## 👥 Customer Personas

Personas represent different customer types with unique behaviors, preferences, and technical requirements.

### Built-in Personas

#### Karen (Retail Customer)
- **Behavior**: Price-conscious, mobile-first shopper
- **Technical Profile**:
  - Think time: 3-5 seconds
  - Error tolerance: Low (abandons quickly)
  - Session duration: 5-10 minutes
  - Device preference: Mobile (70%)
- **Business Impact**: 
  - 60% of total conversions
  - Highest volume, lowest margin
  - Most sensitive to performance issues

#### Raj (Insurance Professional)  
- **Behavior**: Risk-aware, thorough researcher
- **Technical Profile**:
  - Think time: 5-8 seconds
  - Error tolerance: Medium (retries once)
  - Session duration: 15-25 minutes
  - Device preference: Desktop (80%)
- **Business Impact**:
  - 25% of conversions
  - Highest margin customers
  - Requires detailed data and complex calculations

#### Alex (Tech Innovator)
- **Behavior**: Efficiency-focused, quick decision maker
- **Technical Profile**:
  - Think time: 1-2 seconds
  - Error tolerance: High (troubleshoots issues)
  - Session duration: 3-7 minutes
  - Device preference: Desktop (90%)
- **Business Impact**:
  - 15% of conversions
  - Early adopters of new features
  - Provides valuable feedback

#### Sophia (Enterprise Customer)
- **Behavior**: Process-oriented, compliance-focused
- **Technical Profile**:
  - Think time: 4-6 seconds
  - Error tolerance: Very low (requires perfection)
  - Session duration: 20-45 minutes
  - Device preference: Desktop (95%)
- **Business Impact**:
  - 5% of conversions but highest value
  - Requires enterprise features and support
  - Long sales cycles but high retention

## 🔧 Technical Architecture

The BizObs Journey Simulator implements business observability through a distributed architecture that mirrors real-world enterprise systems.

### Dynatrace Integration Middleware
Injects 13 standard headers for complete observability:
```javascript
{
  'dt-journey-id': 'insurance-policy-abc123',
  'dt-customer-id': 'karen-45789', 
  'dt-persona': 'karen',
  'dt-journey-step': 'quote-generation',
  'dt-business-value': '1200',
  'dt-channel': 'web-mobile',
  'dt-campaign': 'summer-promotion',
  'dt-region': 'north-america',
  'dt-customer-tier': 'standard',
  'dt-product': 'auto-insurance',
  'dt-interaction-type': 'quote-request',
  'dt-session-type': 'authenticated',
  'dt-risk-score': 'low'
}
```

## 📊 Observability Data Types

### Business Events
```json
{
  "eventType": "journey.step.completed",
  "timestamp": "2025-11-27T10:30:00Z",
  "customerId": "karen-45789",
  "journeyId": "insurance-policy-abc123",
  "step": "quote-generation", 
  "success": true,
  "duration": 1247,
  "businessValue": 1200,
  "conversionProbability": 0.85
}
```

### Distributed Traces
Complete journey traces showing:
- Service call sequences
- Cross-service dependencies
- Business context propagation
- Error handling and retries

!!! success "Foundation Complete"
    You now understand the core concepts that make business observability powerful. These principles guide every aspect of the BizObs Journey Simulator design and implementation.

<div class="grid cards" markdown>
- [🚀 Explore Advanced Features :octicons-arrow-right-24:](4-advanced-features.md)
</div>
