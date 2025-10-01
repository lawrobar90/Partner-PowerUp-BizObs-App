let EVENTS = [];

export function recordEvent(evt) {
  EVENTS.push(evt);
  if (EVENTS.length > 5000) EVENTS = EVENTS.slice(-2500);
}

export async function getMetricsSummary() {
  const count = EVENTS.length;
  const totalCost = EVENTS.reduce((sum, e) => sum + (e.cost || 0), 0);
  const avgCost = count ? (totalCost / count) : 0;
  const npsScores = EVENTS.map(e => (Number.isFinite(e.npsScore) ? e.npsScore : e.nps)).filter(n => Number.isFinite(n));
  const avgNps = npsScores.length ? (npsScores.reduce((a,b)=>a+b,0)/npsScores.length) : 0;
  const byStep = {};
  const byDomain = {};
  const byServiceName = {};
  for (const e of EVENTS) {
    byStep[e.journeyStep] = (byStep[e.journeyStep] || 0) + 1;
    if (e.domain) byDomain[e.domain] = (byDomain[e.domain] || 0) + 1;
    if (e.serviceName) byServiceName[e.serviceName] = (byServiceName[e.serviceName] || 0) + 1;
  }
  return {
    totalEvents: count,
    totalCost: Number(totalCost.toFixed(2)),
    avgCost: Number(avgCost.toFixed(2)),
    avgNps: Number(avgNps.toFixed(2)),
    byStep,
    byDomain,
    byServiceName,
    last10: EVENTS.slice(-10)
  };
}
