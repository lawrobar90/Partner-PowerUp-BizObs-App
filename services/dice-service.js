const { createService } = require('./service-runner');

createService(process.env.SERVICE_NAME || 'vegas-dice-service', (app) => {
  app.post('/roll', (req, res) => {
    const p = req.body || {};
    const betAmount = p.BetAmount || 10;
    const d1 = Math.floor(Math.random()*6)+1;
    const d2 = Math.floor(Math.random()*6)+1;
    const sum = d1+d2;
    const win = [7,11].includes(sum);
    const payout = win ? betAmount*2 : 0;
    res.json({ dice1:d1, dice2:d2, sum, win, payout, betAmount, timestamp: new Date().toISOString() });
  });
});
