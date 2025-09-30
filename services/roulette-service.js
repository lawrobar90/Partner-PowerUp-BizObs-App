const { createService } = require('./service-runner');

createService(process.env.SERVICE_NAME || 'vegas-roulette-service', (app) => {
  app.post('/spin', (req, res) => {
    const p = req.body || {};
    const winningNumber = Math.floor(Math.random()*37);
    const red = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    const color = winningNumber===0 ? 'green' : (red.includes(winningNumber)?'red':'black');
    let payout = 0;
    let anyWin = false;
    // Support multiple bets structure from UI: BetType: 'multiple', BetValue: { key: { type, value, amount } }
    if (p.BetType === 'multiple' && p.BetValue && typeof p.BetValue === 'object') {
      for (const [, bet] of Object.entries(p.BetValue)) {
        if (!bet || typeof bet !== 'object') continue;
        const amount = Number(bet.amount || 0);
        const type = bet.type;
        const val = bet.value;
        let win = false;
        let multi = 0;
        if (type === 'straight') {
          win = (winningNumber === Number(val));
          multi = 35;
        } else if (type === 'red') {
          win = (color === 'red');
          multi = 1;
        } else if (type === 'black') {
          win = (color === 'black');
          multi = 1;
        } else if (type === 'even') {
          win = (winningNumber > 0 && winningNumber % 2 === 0);
          multi = 1;
        } else if (type === 'odd') {
          win = (winningNumber > 0 && winningNumber % 2 === 1);
          multi = 1;
        } else if (type === 'low') { // 1-18
          win = (winningNumber >= 1 && winningNumber <= 18);
          multi = 1;
        } else if (type === 'high') { // 19-36
          win = (winningNumber >= 19 && winningNumber <= 36);
          multi = 1;
        }
        if (win && amount > 0) {
          payout += amount * (multi + 1); // return stake + winnings (align with UI calc)
          anyWin = true;
        }
      }
    } else {
      // Fallback simple color bet
      const betAmount = Number(p.BetAmount || 10);
      const isWin = color === (p.BetType||'red');
      payout = isWin ? betAmount * 2 : 0; // include stake back
      anyWin = isWin;
    }
    res.json({ winningNumber, color, win: anyWin, payout, timestamp: new Date().toISOString() });
  });
});
