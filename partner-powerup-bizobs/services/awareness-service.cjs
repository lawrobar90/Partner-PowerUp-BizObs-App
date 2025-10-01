const { createService } = require('./service-runner.cjs');
const { callService, getServiceNameFromStep } = require('./child-caller.cjs');

createService('awareness-service', (app) => {
  app.post('/process', async (req, res) => {
    const payload = req.body || {};
    const correlationId = req.correlationId;
    const thinkTimeMs = Number(payload.thinkTimeMs || 200);
    
    // Log awareness service processing
    console.log(`[awareness-service] Processing step: ${JSON.stringify(payload)}`);
    
    // Simulate awareness processing
    const processingTime = Math.floor(Math.random() * 150) + 80; // 80-230ms
    
    const finish = async () => {
      const response = {
        stepName: payload.stepName || 'Awareness',
        service: `${payload.stepName || 'Awareness'}Service`,
        status: 'completed',
        correlationId,
        processingTime,
        pid: process.pid,
        timestamp: new Date().toISOString(),
        metadata: {
          impressionsGenerated: Math.floor(Math.random() * 10000) + 5000,
          channelsActivated: Math.floor(Math.random() * 8) + 4,
          audienceReach: Math.floor(Math.random() * 50000) + 25000
        },
        ...payload
      };
      console.log(`[awareness-service] Completed processing in ${processingTime}ms`);

      // Optional chaining to next service - dynamically determine from steps
      let nextStepName = payload.nextStepName;
      if (!nextStepName && payload.steps && Array.isArray(payload.steps)) {
        const currentStep = payload.steps.find(s => s.stepName === (payload.stepName || 'Awareness'));
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
            parentStep: payload.stepName || 'Awareness',
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