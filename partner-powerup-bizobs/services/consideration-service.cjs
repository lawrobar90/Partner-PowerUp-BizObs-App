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
        stepName: payload.stepName || 'Consideration',
        service: `${payload.stepName || 'Consideration'}Service`,
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

      // Optional chaining to next service - dynamically determine from steps
      let nextStepName = payload.nextStepName;
      if (!nextStepName && payload.steps && Array.isArray(payload.steps)) {
        const currentStep = payload.steps.find(s => s.stepName === (payload.stepName || 'Consideration'));
        const currentIndex = payload.steps.indexOf(currentStep);
        const nextStep = payload.steps[currentIndex + 1];
        nextStepName = nextStep ? nextStep.stepName : null;
      }
      const nextService = payload.nextService || getServiceNameFromStep(nextStepName);
      if (nextService && nextStepName) {
        try {
          await new Promise(r => setTimeout(r, thinkTimeMs));
          const nextPayload = {
            stepName: nextStepName,
            action: 'auto_chained',
            parentStep: payload.stepName || 'Consideration',
            correlationId,
            journeyId: payload.journeyId,
            domain: payload.domain,
            thinkTimeMs,
            steps: payload.steps
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