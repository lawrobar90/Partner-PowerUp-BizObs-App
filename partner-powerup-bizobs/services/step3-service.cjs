const { createService } = require('./service-runner.cjs');
const { callService, getServiceNameFromStep } = require('./child-caller.cjs');

createService('consideration-service', (app) => {
  app.post('/process', async (req, res) => {
    const payload = req.body || {};
    const correlationId = req.correlationId;
    const thinkTimeMs = Number(payload.thinkTimeMs || 200);
    
    // Log consideration service processing
    console.log(`[consideration-service] Processing step: ${JSON.stringify(payload)}`);
    
    // Simulate consideration processing
    const processingTime = Math.floor(Math.random() * 180) + 120; // 120-300ms
    
    const finish = async () => {
      const response = {
        stepName: 'Consideration',
        service: 'consideration-service',
        status: 'completed',
        correlationId,
        processingTime,
        pid: process.pid,
        timestamp: new Date().toISOString(),
        metadata: {
          productsEvaluated: Math.floor(Math.random() * 15) + 5,
          comparisonsMade: Math.floor(Math.random() * 8) + 3,
          reviewsRead: Math.floor(Math.random() * 20) + 10
        },
        ...payload
      };
      console.log(`[consideration-service] Completed processing in ${processingTime}ms`);

      const nextName = payload.nextStepName || 'Purchase';
      const nextService = payload.nextService || getServiceNameFromStep(nextName);
      if (nextService) {
        try {
          await new Promise(r => setTimeout(r, thinkTimeMs));
          const stepNames = payload.stepNames || ['Purchase', 'Retention', 'Advocacy'];
          const nextPayload = {
            stepName: nextName,
            nextStepName: stepNames[1] || 'Step5',
            action: 'auto_chained',
            parentStep: payload.stepName || 'Step3',
            correlationId,
            journeyId: payload.journeyId,
            domain: payload.domain,
            thinkTimeMs,
            stepNames: stepNames.slice(1)
          };
          const next = await callService(nextService, nextPayload, { 'x-correlation-id': correlationId });
          response.next = next;
        } catch (e) {
          response.nextError = e.message;
        }
      }
      res.json(response);
    };

    setTimeout(finish, processingTime);
  });
});