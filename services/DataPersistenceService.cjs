/**
 * Data Persistence Service - Final step in customer journey
 * Stores complete journey data in memory with Dynatrace tracing
 * (MongoDB integration removed)
 */

const { createService } = require('./service-runner.cjs');
const http = require('http');
const crypto = require('crypto');

// In-memory storage for journey data (replaces MongoDB)
const journeyStorage = {
  journeys: new Map(),
  steps: [],
  stats: {
    totalJourneys: 0,
    companiesStats: new Map()
  }
};

// Fallback Dynatrace helpers
const addCustomAttributes = (attributes) => {
  console.log('[dynatrace] Custom attributes:', attributes);
};

const withCustomSpan = (name, callback) => {
  console.log('[dynatrace] Custom span:', name);
  return callback();
};

const sendBusinessEvent = (eventType, data) => {
  console.log('[dynatrace] Business event:', eventType, data);
};

createService('DataPersistenceService', (app) => {
  app.post('/process', async (req, res) => {
    const payload = req.body || {};
    const correlationId = req.correlationId;
    const currentStepName = payload.stepName || 'DataPersistence';
    
    console.log(`[DataPersistenceService] Processing final journey step with correlation: ${correlationId}`);
    console.log(`[DataPersistenceService] Received journey data:`, JSON.stringify(payload, null, 2));

    // Extract trace context
    const incomingTraceParent = req.headers['traceparent'];
    const incomingTraceState = req.headers['tracestate'];
    const dynatraceTraceId = req.headers['x-dynatrace-trace-id'];
    
    // Generate span ID for this service
    const spanId = crypto.randomUUID().slice(0, 16).replace(/-/g, '');
    
    let traceId, parentSpanId;
    
    if (incomingTraceParent) {
      const parts = incomingTraceParent.split('-');
      if (parts.length === 4) {
        traceId = parts[1];
        parentSpanId = parts[2];
      }
    } else if (dynatraceTraceId) {
      traceId = dynatraceTraceId;
      parentSpanId = req.headers['x-dynatrace-parent-span-id'];
    } else {
      traceId = payload.traceId || crypto.randomUUID().replace(/-/g, '');
      parentSpanId = payload.spanId || null;
    }

    console.log(`[DataPersistenceService] Trace context: traceId=${traceId.substring(0,8)}..., spanId=${spanId.substring(0,8)}..., parentSpanId=${parentSpanId ? parentSpanId.substring(0,8) + '...' : 'none'}`);

    // Simulate processing time (database operations take longer)
    const processingTime = Math.floor(Math.random() * 300) + 200; // 200-500ms for DB operations

    const finish = async () => {
      try {
        // Prepare comprehensive journey data for MongoDB storage
        const journeyData = {
          journeyId: payload.journeyId || correlationId,
          correlationId,
          traceId,
          
          // Company context
          companyName: payload.companyName || 'Unknown Company',
          domain: payload.domain || 'unknown.com',
          industryType: payload.industryType || 'general',
          
          // Customer profile
          customerProfile: {
            userId: payload.userId || crypto.randomUUID(),
            email: payload.email || `customer@${payload.domain || 'example.com'}`,
            demographic: payload.demographic || `${payload.industryType || 'general'} customers`,
            painPoints: payload.painPoints || ['complexity', 'cost'],
            goals: payload.goals || ['efficiency', 'value']
          },
          
          // Journey metadata
          status: 'completed',
          totalSteps: Array.isArray(payload.steps) ? payload.steps.length : 6,
          completedSteps: Array.isArray(payload.steps) ? payload.steps.length : 6,
          
          // Journey trace with all steps
          steps: payload.journeyTrace || payload.steps || [],
          stepNames: Array.isArray(payload.steps) ? payload.steps.map(s => s.stepName || s.name) : [],
          
          // Business metrics (aggregate from all steps)
          totalProcessingTime: processingTime + (payload.processingTime || 0),
          conversionValue: payload.conversionValue || Math.floor(Math.random() * 1000) + 500,
          satisfactionScore: payload.satisfactionScore || (Math.random() * 2 + 8).toFixed(1),
          npsScore: payload.npsScore || Math.floor(Math.random() * 11),
          businessValue: payload.businessValue || Math.floor(Math.random() * 1000) + 500,
          
          // Technical context
          sessionId: payload.sessionId || crypto.randomUUID(),
          deviceType: payload.deviceType || 'web',
          browser: payload.browser || 'Chrome',
          location: payload.location || 'London, UK',
          
          // Additional fields from journey generation
          additionalFields: payload.additionalFields || {}
        };

        // Add custom attributes for Dynatrace
        const customAttributes = {
          'journey.step': currentStepName,
          'journey.service': 'DataPersistenceService',
          'journey.correlationId': correlationId,
          'journey.company': journeyData.companyName,
          'journey.domain': journeyData.domain,
          'journey.industryType': journeyData.industryType,
          'journey.totalSteps': journeyData.totalSteps,
          'journey.processingTime': processingTime,
          'database.operation': 'store_customer_journey',
          'database.collection': 'customer_journeys'
        };
        
        addCustomAttributes(customAttributes);

        // Store in memory (replaces MongoDB)
        let storageResult = null;
        let storageError = null;
        
        try {
          console.log('[DataPersistenceService] Storing journey data in memory...');
          
          // Store journey in memory
          const documentId = crypto.randomUUID();
          journeyData.documentId = documentId;
          journeyData.storedAt = new Date().toISOString();
          
          // Store in memory collections
          journeyStorage.journeys.set(journeyData.journeyId, journeyData);
          
          // Store individual steps
          if (journeyData.steps && Array.isArray(journeyData.steps)) {
            journeyData.steps.forEach((step, index) => {
              journeyStorage.steps.push({
                id: crypto.randomUUID(),
                journeyId: journeyData.journeyId,
                stepIndex: index + 1,
                stepName: step.stepName || `Step${index + 1}`,
                serviceName: step.serviceName || `${step.stepName}Service`,
                stepData: step,
                companyContext: {
                  companyName: journeyData.companyName,
                  industryType: journeyData.industryType,
                  domain: journeyData.domain
                },
                timestamp: new Date().toISOString()
              });
            });
          }
          
          // Update stats
          journeyStorage.stats.totalJourneys++;
          
          if (!journeyStorage.stats.companiesStats.has(journeyData.companyName)) {
            journeyStorage.stats.companiesStats.set(journeyData.companyName, {
              count: 0,
              latestJourney: null,
              avgBusinessValue: 0,
              industries: new Set()
            });
          }
          
          const companyStats = journeyStorage.stats.companiesStats.get(journeyData.companyName);
          companyStats.count++;
          companyStats.latestJourney = journeyData.storedAt;
          companyStats.avgBusinessValue = ((companyStats.avgBusinessValue * (companyStats.count - 1)) + journeyData.businessValue) / companyStats.count;
          companyStats.industries.add(journeyData.industryType);
          
          storageResult = {
            success: true,
            journeyId: journeyData.journeyId,
            documentId: documentId,
            timestamp: journeyData.storedAt
          };
          
          console.log(`[DataPersistenceService] Successfully stored journey in memory:`, storageResult);
          
          // Send business event for successful storage
          sendBusinessEvent('journey_data_persisted', {
            journeyId: journeyData.journeyId,
            correlationId,
            companyName: journeyData.companyName,
            industryType: journeyData.industryType,
            totalSteps: journeyData.totalSteps,
            businessValue: journeyData.businessValue,
            documentId: storageResult.documentId,
            storageType: 'in-memory'
          });
          
        } catch (error) {
          console.error('[DataPersistenceService] Memory storage failed:', error.message);
          storageError = error.message;
          
          // Send business event for storage failure
          sendBusinessEvent('journey_storage_failed', {
            journeyId: journeyData.journeyId,
            correlationId,
            error: error.message,
            companyName: journeyData.companyName,
            storageType: 'in-memory'
          });
        }

        // Update journey trace with this final step
        const journeyTrace = Array.isArray(payload.journeyTrace) ? [...payload.journeyTrace] : [];
        const stepEntry = {
          stepName: currentStepName,
          serviceName: 'DataPersistenceService',
          timestamp: new Date().toISOString(),
          correlationId,
          processingTime,
          storageOperation: storageResult ? 'success' : 'failed',
          documentId: storageResult?.documentId || null
        };
        journeyTrace.push(stepEntry);

        // Prepare final response
        const response = {
          ...payload,
          stepName: currentStepName,
          service: 'DataPersistenceService',
          status: 'completed',
          correlationId,
          processingTime,
          pid: process.pid,
          timestamp: new Date().toISOString(),
          
          // Storage operation results
          storageResults: {
            success: !!storageResult,
            journeyId: journeyData.journeyId,
            documentId: storageResult?.documentId || null,
            error: storageError,
            storedAt: storageResult?.timestamp || null,
            storageType: 'in-memory'
          },
          
          // Final journey summary
          journeySummary: {
            totalSteps: journeyData.totalSteps,
            completedSteps: journeyData.completedSteps,
            totalProcessingTime: journeyData.totalProcessingTime,
            businessValue: journeyData.businessValue,
            satisfactionScore: journeyData.satisfactionScore,
            company: journeyData.companyName,
            industry: journeyData.industryType
          },
          
          journeyTrace,
          
          // Metadata for final step
          metadata: {
            isTerminalStep: true,
            dataPersisted: !!storageResult,
            finalStep: true,
            dataIntegrity: 'validated',
            archivalStatus: 'completed',
            storageType: 'in-memory'
          }
        };

        console.log(`[DataPersistenceService] Final journey processing completed:`, {
          journeyId: journeyData.journeyId,
          correlationId,
          storageSuccess: !!storageResult,
          totalSteps: journeyData.totalSteps,
          processingTime
        });

        res.json(response);
        
      } catch (error) {
        console.error('[DataPersistenceService] Critical error in final processing:', error);
        
        // Emergency response for critical failures
        res.status(500).json({
          stepName: currentStepName,
          service: 'DataPersistenceService',
          status: 'error',
          correlationId,
          error: error.message,
          processingTime,
          timestamp: new Date().toISOString(),
          metadata: {
            isTerminalStep: true,
            criticalError: true,
            errorType: 'service_failure'
          }
        });
      }
    };

    // Simulate database processing time
    setTimeout(finish, processingTime);
  });

  // Health check endpoint that includes storage status
  app.get('/health', async (req, res) => {
    try {
      const storageHealth = {
        status: 'healthy',
        type: 'in-memory',
        journeysStored: journeyStorage.journeys.size,
        stepsStored: journeyStorage.steps.length,
        companiesTracked: journeyStorage.stats.companiesStats.size
      };
      
      res.json({
        service: 'DataPersistenceService',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        pid: process.pid,
        storage: storageHealth,
        capabilities: [
          'journey_storage',
          'in_memory_persistence', 
          'analytics_support',
          'dynatrace_tracing'
        ]
      });
    } catch (error) {
      res.status(500).json({
        service: 'DataPersistenceService',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Analytics endpoint for stored journey data
  app.get('/analytics/:companyName', async (req, res) => {
    try {
      const { companyName } = req.params;
      const { timeframe = '24h' } = req.query;
      
      // Calculate time range
      const now = new Date();
      const timeRanges = {
        '1h': new Date(now - 60 * 60 * 1000),
        '24h': new Date(now - 24 * 60 * 60 * 1000),
        '7d': new Date(now - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(now - 30 * 24 * 60 * 60 * 1000)
      };
      
      const startTime = timeRanges[timeframe] || timeRanges['24h'];
      
      // Filter journeys by company and timeframe
      const companyJourneys = Array.from(journeyStorage.journeys.values())
        .filter(journey => 
          journey.companyName === companyName && 
          new Date(journey.timestamp) >= startTime
        );
      
      // Calculate analytics
      const analytics = {
        companyName,
        timeframe,
        totalJourneys: companyJourneys.length,
        avgProcessingTime: companyJourneys.reduce((sum, j) => sum + (j.totalProcessingTime || 0), 0) / companyJourneys.length || 0,
        avgSatisfactionScore: companyJourneys.reduce((sum, j) => sum + (j.businessMetrics?.satisfactionScore || 0), 0) / companyJourneys.length || 0,
        totalBusinessValue: companyJourneys.reduce((sum, j) => sum + (j.businessMetrics?.businessValue || 0), 0),
        completionRate: companyJourneys.reduce((sum, j) => sum + ((j.completedSteps || 0) / (j.totalSteps || 1)), 0) / companyJourneys.length || 0,
        industries: [...new Set(companyJourneys.map(j => j.industryType))]
      };
      
      res.json({
        company: companyName,
        timeframe,
        analytics,
        generatedAt: new Date().toISOString(),
        storageType: 'in-memory'
      });
      
    } catch (error) {
      res.status(500).json({
        error: 'Analytics generation failed',
        message: error.message
      });
    }
  });

  // Journey stats endpoint
  app.get('/stats', async (req, res) => {
    try {
      const companiesStats = Array.from(journeyStorage.stats.companiesStats.entries()).map(([companyName, stats]) => ({
        _id: companyName,
        count: stats.count,
        latestJourney: stats.latestJourney,
        avgBusinessValue: stats.avgBusinessValue,
        industries: Array.from(stats.industries)
      })).sort((a, b) => b.count - a.count);
      
      const stats = {
        totalJourneys: journeyStorage.stats.totalJourneys,
        companiesStats
      };
      
      res.json({
        ...stats,
        generatedAt: new Date().toISOString(),
        service: 'DataPersistenceService',
        storageType: 'in-memory'
      });
      
    } catch (error) {
      res.status(500).json({
        error: 'Stats generation failed',
        message: error.message
      });
    }
  });
});

console.log('[DataPersistenceService] Service initialized with in-memory storage');