const { createService } = require('./service-runner.cjs');
const { callService, getServiceNameFromStep } = require('./child-caller.cjs');

createService('discovery-service', (app) => {
  app.post('/process', async (req, res) => {
    const payload = req.body || {};
    const correlationId = req.correlationId;
    const thinkTimeMs = Number(payload.thinkTimeMs || 200);
    
    // Log discovery service processing
    console.log(`[discovery-service] Processing step: ${JSON.stringify(payload)}`);
    
    // Simulate discovery processing with realistic timing
    const processingTime = Math.floor(Math.random() * 200) + 100; // 100-300ms
    
    const finish = async () => {
      const response = {
        stepName: payload.stepName || 'Discovery',
        service: `${payload.stepName || 'Discovery'}Service`,
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
      console.log(`[discovery-service] Completed processing in ${processingTime}ms`);

      // Optional chaining to next service - dynamically determine from steps
      let nextStepName = payload.nextStepName;
      if (!nextStepName && payload.steps && Array.isArray(payload.steps)) {
        // Find current step and get the next one
        const currentStep = payload.steps.find(s => s.stepName === (payload.stepName || 'Discovery'));
        const currentIndex = payload.steps.indexOf(currentStep);
        const nextStep = payload.steps[currentIndex + 1];
        nextStepName = nextStep ? nextStep.stepName : null;
      }
      const nextService = payload.nextService || getServiceNameFromStep(nextStepName);
      if (nextService && nextStepName) {
        try {
          // Simulate user think time before next step
          await new Promise(r => setTimeout(r, thinkTimeMs));
          const nextPayload = {
            stepName: nextStepName,
            action: 'auto_chained',
            parentStep: payload.stepName || 'Discovery',
            correlationId,
            journeyId: payload.journeyId,
            domain: payload.domain,
            thinkTimeMs,
            steps: payload.steps // Pass steps for continued dynamic mapping
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