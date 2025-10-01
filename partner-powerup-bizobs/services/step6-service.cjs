const { createService } = require('./service-runner.cjs');
const crypto = require('crypto');

createService('Step6Service', (app) => {
  app.post('/process', async (req, res) => {
    const payload = req.body || {};
    const correlationId = req.correlationId;
    const thinkTimeMs = Number(payload.thinkTimeMs || 200);

    // Log Step6Service processing
    console.log(`[Step6Service] Processing step: ${JSON.stringify(payload)}`);

    // Simulate advocacy processing
    const processingTime = Math.floor(Math.random() * 150) + 80; // 80-230ms

    await new Promise(r => setTimeout(r, thinkTimeMs));
    setTimeout(() => {
      const response = {
        stepName: 'Advocacy',
        service: 'Step6Service',
        status: 'completed',
        correlationId,
        processingTime,
        pid: process.pid,
        timestamp: new Date().toISOString(),
        metadata: {
          referralsGenerated: Math.floor(Math.random() * 10) + 2,
          socialShares: Math.floor(Math.random() * 50) + 20,
          npsScore: Math.floor(Math.random() * 4) + 7
        },
        ...payload
      };
      
      console.log(`[Step6Service] Completed processing in ${processingTime}ms`);
      res.json(response);
    }, processingTime);
  });
});