const { createService } = require('./service-runner');

// In-memory game state by Username
const games = new Map(); // key: Username, value: { playerHand, dealerHand, betAmount }

function drawCard() {
  const rank = Math.floor(Math.random()*13)+1; // 1..13 (Ace..King)
  const suits = ['♥','♦','♣','♠'];
  const suit = suits[Math.floor(Math.random()*suits.length)];
  return { rank, suit };
}

function scoreHand(hand) {
  let score = 0;
  let aces = 0;
  for (const c of hand) {
    if (c.rank === 1) { aces++; score += 11; }
    else score += Math.min(c.rank, 10);
  }
  while (score > 21 && aces > 0) { score -= 10; aces--; }
  return score;
}

createService(process.env.SERVICE_NAME || 'vegas-blackjack-service', (app) => {
  app.post('/deal', (req, res) => {
    const p = req.body || {};
    const betAmount = Number(p.BetAmount || 10);
    const Username = p.Username || 'Anonymous';
    const playerHand = [drawCard(), drawCard()];
    const dealerHand = [drawCard(), drawCard()];
    games.set(Username, { playerHand, dealerHand, betAmount });
    res.json({
      playerHand,
      dealerHand,
      playerScore: scoreHand(playerHand),
      dealerScore: scoreHand(playerHand) >= 21 ? scoreHand(dealerHand) : scoreHand([dealerHand[0]]),
      betAmount,
      timestamp: new Date().toISOString()
    });
  });

  app.post('/hit', (req, res) => {
    const p = req.body || {};
    const Username = p.Username || 'Anonymous';
    const g = games.get(Username);
    if (!g) return res.status(400).json({ error: 'No active hand' });
    const newCard = drawCard();
    g.playerHand.push(newCard);
    const playerScore = scoreHand(g.playerHand);
    const dealerScore = scoreHand([g.dealerHand[0]]);
    res.json({ newCard, playerScore, dealerScore, timestamp: new Date().toISOString() });
  });

  app.post('/stand', (req, res) => {
    const p = req.body || {};
    const Username = p.Username || 'Anonymous';
    const g = games.get(Username);
    if (!g) return res.status(400).json({ error: 'No active hand' });
    // Reveal dealer and draw to 17+
    while (scoreHand(g.dealerHand) < 17) {
      g.dealerHand.push(drawCard());
    }
    const playerScore = scoreHand(g.playerHand);
    const dealerScore = scoreHand(g.dealerHand);
    let result = 'lose';
    if (playerScore > 21) result = 'lose';
    else if (dealerScore > 21 || playerScore > dealerScore) result = 'win';
    else if (playerScore === dealerScore) result = 'push';
    let payout = 0;
    if (result === 'win') payout = g.betAmount * 2; // return stake + win
    else if (result === 'push') payout = g.betAmount; // return stake
    const dealerFinalHand = g.dealerHand;
    // Clear game
    games.delete(Username);
    res.json({ dealerFinalHand, dealerScore, result, payout, timestamp: new Date().toISOString() });
  });

  app.post('/double', (req, res) => {
    const p = req.body || {};
    const Username = p.Username || 'Anonymous';
    const g = games.get(Username);
    if (!g) return res.status(400).json({ error: 'No active hand' });
    const newCard = drawCard();
    g.playerHand.push(newCard);
    // Indicate additional bet required equals original betAmount
    const additionalBet = g.betAmount;
    // Optionally adjust betAmount for final payout logic
    g.betAmount *= 2;
    const playerScore = scoreHand(g.playerHand);
    const dealerScore = scoreHand([g.dealerHand[0]]);
    res.json({ newCard, playerScore, dealerScore, additionalBet, timestamp: new Date().toISOString() });
  });
});
