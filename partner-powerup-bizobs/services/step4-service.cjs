const { createService } = require('./service-runner.cjs');
const { callService, getServiceNameFromStep } = require('./child-caller.cjs');

createService('purchase-service', (app) => {
  app.post('/process', async (req, res) => {
    const payload = req.body || {};
    const correlationId = req.correlationId;
    const thinkTimeMs = Number(payload.thinkTimeMs || 200);
    
    // Log purchase service processing
    console.log(`[purchase-service] Processing step: ${JSON.stringify(payload)}`);
    
    // Simulate purchase processing
    const processingTime = Math.floor(Math.random() * 250) + 150; // 150-400ms
    
    const finish = async () => {
      const response = {
        stepName: 'Purchase',
        service: 'purchase-service',
        status: 'completed',
        correlationId,
        processingTime,
        pid: process.pid,
        timestamp: new Date().toISOString(),
        metadata: {
          transactionValue: Math.floor(Math.random() * 1000) + 100,
          paymentMethod: ['credit_card', 'paypal', 'bank_transfer'][Math.floor(Math.random() * 3)],
          conversionRate: (Math.random() * 0.05 + 0.02).toFixed(3)
        },
        ...payload
      };
      console.log(`[purchase-service] Completed processing in ${processingTime}ms`);

      const nextName = payload.nextStepName || 'Retention';
      const nextService = payload.nextService || getServiceNameFromStep(nextName);
      if (nextService) {
        try {
          await new Promise(r => setTimeout(r, thinkTimeMs));
          const stepNames = payload.stepNames || ['Retention', 'Advocacy'];
          const nextPayload = {
            stepName: nextName,
            nextStepName: stepNames[1] || 'Step6',
            action: 'auto_chained',
            parentStep: payload.stepName || 'Step4',
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