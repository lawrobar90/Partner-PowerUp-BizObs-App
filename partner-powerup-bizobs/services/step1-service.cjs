const { createService } = require('./service-runner.cjs');
const { callService, getServiceNameFromStep } = require('./child-caller.cjs');

createService('Step1Service', (app) => {
  app.post('/process', async (req, res) => {
    const payload = req.body || {};
    const correlationId = req.correlationId;
    const thinkTimeMs = Number(payload.thinkTimeMs || 200);
    
    // Log Step1Service processing
    console.log(`[Step1Service] Processing step: ${JSON.stringify(payload)}`);
    
    // Simulate discovery processing with realistic timing
    const processingTime = Math.floor(Math.random() * 200) + 100; // 100-300ms
    
    const finish = async () => {
      const response = {
        stepName: 'Discovery',
        service: 'Step1Service',
        status: 'completed',
        correlationId,
        processingTime,
        pid: process.pid,
        timestamp: new Date().toISOString(),
        metadata: {
          customersDiscovered: Math.floor(Math.random() * 100) + 50,
          touchpointsAnalyzed: Math.floor(Math.random() * 20) + 10,
          dataSourcesConnected: Math.floor(Math.random() * 5) + 3
        },
        ...payload
      };
      console.log(`[Step1Service] Completed processing in ${processingTime}ms`);

      // Optional chaining to next service
      const nextName = payload.nextStepName || 'Awareness';
      const nextService = payload.nextService || getServiceNameFromStep(nextName);
      if (nextService) {
        try {
          // Simulate user think time before next step
          await new Promise(r => setTimeout(r, thinkTimeMs));
          const nextPayload = {
            stepName: nextName,
            nextStepName: 'Consideration',
            action: 'auto_chained',
            parentStep: 'Discovery',
            correlationId,
            journeyId: payload.journeyId,
            domain: payload.domain,
            thinkTimeMs
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