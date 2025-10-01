const { createService } = require('./service-runner.cjs');
const { callService, getServiceNameFromStep } = require('./child-caller.cjs');

createService('retention-service', (app) => {
  app.post('/process', async (req, res) => {
    const payload = req.body || {};
    const correlationId = req.correlationId;
    const thinkTimeMs = Number(payload.thinkTimeMs || 200);
    
    // Log retention service processing
    console.log(`[retention-service] Processing step: ${JSON.stringify(payload)}`);
    
    // Simulate retention processing
    const processingTime = Math.floor(Math.random() * 200) + 100; // 100-300ms
    
    const finish = async () => {
      const response = {
        stepName: 'Retention',
        service: 'retention-service',
        status: 'completed',
        correlationId,
        processingTime,
        pid: process.pid,
        timestamp: new Date().toISOString(),
        metadata: {
          retentionRate: (Math.random() * 0.3 + 0.6).toFixed(3),
          supportTickets: Math.floor(Math.random() * 5),
          satisfactionScore: (Math.random() * 2 + 8).toFixed(1)
        },
        ...payload
      };
      console.log(`[retention-service] Completed processing in ${processingTime}ms`);

      const nextName = payload.nextStepName || 'Advocacy';
      const nextService = payload.nextService || getServiceNameFromStep(nextName);
      if (nextService) {
        try {
          await new Promise(r => setTimeout(r, thinkTimeMs));
          const stepNames = payload.stepNames || ['Advocacy'];
          const nextPayload = {
            stepName: nextName,
            action: 'auto_chained',
            parentStep: payload.stepName || 'Step5',
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