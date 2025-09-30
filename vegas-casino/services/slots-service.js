const { createService } = require('./service-runner');
const express = require('express');

createService(process.env.SERVICE_NAME || 'vegas-slots-service', (app) => {
  app.post('/spin', (req, res) => {
    const p = req.body || {};
    const betAmount = p.BetAmount || 10;
    const icons = ['dynatrace','smartscape','application','database','server','cloud','shield','chart','network','services','host','process','memory','cpu'];
    const result = Array.from({ length: 3 }, () => icons[Math.floor(Math.random()*icons.length)]);
    const counts = result.reduce((m, s) => (m[s]=(m[s]||0)+1, m), {});
    let win=false, mult=0;
    if (Object.values(counts).includes(3)) mult = 3, win=true; else if (Object.values(counts).includes(2)) mult = 2, win=true;
    const winAmount = win ? betAmount * mult : 0;
    res.json({ result, win, winAmount, betAmount, multiplier: win?mult:0, timestamp: new Date().toISOString() });
  });
});
