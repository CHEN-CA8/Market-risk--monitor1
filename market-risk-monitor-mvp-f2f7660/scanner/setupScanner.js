const { clamp, mean, round, isFiniteNumber } = require("../backend/utils/math");

function scoreTrend(metric) {
  if (!metric || metric.error || !metric.movingAverages) return null;
  const d20 = metric.movingAverages.distance20Pct;
  const d50 = metric.movingAverages.distance50Pct;
  const d200 = metric.movingAverages.distance200Pct;
  return round(mean([
    isFiniteNumber(d20) ? clamp(50 + d20 * 2.2, 0, 100) : null,
    isFiniteNumber(d50) ? clamp(50 + d50 * 1.5, 0, 100) : null,
    isFiniteNumber(d200) ? clamp(50 + d200 * 0.8, 0, 100) : null
  ].filter(isFiniteNumber)), 1);
}

function scoreMomentum(metric) {
  if (!metric || metric.error) return null;
  return round(mean([
    isFiniteNumber(metric.changePct) ? clamp(50 + metric.changePct * 8, 0, 100) : null,
    isFiniteNumber(metric.weekChangePct) ? clamp(50 + metric.weekChangePct * 3, 0, 100) : null,
    isFiniteNumber(metric.monthChangePct) ? clamp(50 + metric.monthChangePct * 1.2, 0, 100) : null
  ].filter(isFiniteNumber)), 1);
}

function scoreRelativeStrength(metric, benchmark) {
  if (!metric || !benchmark || metric.error || benchmark.error) return null;
  const weekRs = isFiniteNumber(metric.weekChangePct) && isFiniteNumber(benchmark.weekChangePct)
    ? metric.weekChangePct - benchmark.weekChangePct
    : null;
  const monthRs = isFiniteNumber(metric.monthChangePct) && isFiniteNumber(benchmark.monthChangePct)
    ? metric.monthChangePct - benchmark.monthChangePct
    : null;
  return round(mean([
    isFiniteNumber(weekRs) ? clamp(50 + weekRs * 5, 0, 100) : null,
    isFiniteNumber(monthRs) ? clamp(50 + monthRs * 2, 0, 100) : null
  ].filter(isFiniteNumber)), 1);
}

function scoreVolume(metric) {
  if (!metric || metric.error || !isFiniteNumber(metric.volumeTrend)) return null;
  return round(clamp(50 + metric.volumeTrend * 0.5, 0, 100), 1);
}

function scoreVolatility(metric) {
  if (!metric || metric.error || !metric.history || metric.history.length < 22) return null;
  const closes = metric.history.map((row) => row.close).filter(isFiniteNumber);
  const returns = closes.slice(1).map((close, index) => ((close - closes[index]) / closes[index]) * 100);
  const recent = returns.slice(-5).map(Math.abs);
  const medium = returns.slice(-21).map(Math.abs);
  const recentVol = mean(recent);
  const mediumVol = mean(medium);
  if (!isFiniteNumber(recentVol) || !isFiniteNumber(mediumVol)) return null;
  const expansion = recentVol / Math.max(0.01, mediumVol);
  return round(clamp(70 - Math.abs(expansion - 1) * 22, 0, 100), 1);
}

function setupLabel(score) {
  if (score >= 82) return "Strong Setup";
  if (score >= 68) return "Moderate Setup";
  if (score >= 52) return "Watch";
  if (score >= 38) return "Weak Setup";
  return "Avoid";
}

function inferSetupType(scores, metric) {
  if (scores.trend >= 70 && scores.momentum >= 70 && scores.relativeStrength >= 65) return "Momentum";
  if (metric && metric.movingAverages && metric.movingAverages.distance20Pct > 0 && metric.weekChangePct > 2) return "Breakout";
  if (scores.trend >= 65 && metric && metric.changePct < 0) return "Pullback";
  if (scores.momentum <= 35) return "Oversold";
  return "Relative Strength";
}

function analyticalLevels(metric) {
  if (!metric || !isFiniteNumber(metric.value)) {
    return { entryZone: null, invalidationLevel: null, potentialTarget: null, riskReward: null };
  }
  const ma20 = metric.movingAverages && metric.movingAverages.ma20;
  const ma50 = metric.movingAverages && metric.movingAverages.ma50;
  const price = metric.value;
  const entryLow = isFiniteNumber(ma20) ? Math.min(price, ma20) : price * 0.98;
  const entryHigh = price * 1.01;
  const invalidation = isFiniteNumber(ma50) ? Math.min(ma50, price * 0.94) : price * 0.94;
  const target = price * 1.08;
  const risk = entryLow - invalidation;
  const reward = target - entryHigh;
  return {
    entryZone: [round(entryLow, 2), round(entryHigh, 2)],
    invalidationLevel: round(invalidation, 2),
    potentialTarget: round(target, 2),
    riskReward: risk > 0 ? round(reward / risk, 2) : null
  };
}

function scanStocks(stockMap, benchmark, marketRegime) {
  return Object.values(stockMap)
    .filter((metric) => metric && !metric.error)
    .map((metric) => {
      const scores = {
        trend: scoreTrend(metric),
        momentum: scoreMomentum(metric),
        relativeStrength: scoreRelativeStrength(metric, benchmark),
        volume: scoreVolume(metric),
        volatility: scoreVolatility(metric),
        marketRegime: marketRegime.marketScore,
        eventRisk: null
      };
      const valid = Object.values(scores).filter(isFiniteNumber);
      const setupScore = valid.length ? round(mean(valid), 1) : null;
      return {
        symbol: metric.symbol,
        label: metric.label,
        price: metric.value,
        dailyPct: metric.changePct,
        weeklyPct: metric.weekChangePct,
        volume: metric.volume,
        distance20Pct: metric.movingAverages.distance20Pct,
        distance50Pct: metric.movingAverages.distance50Pct,
        distance200Pct: metric.movingAverages.distance200Pct,
        setupScore,
        setupLabel: isFiniteNumber(setupScore) ? setupLabel(setupScore) : "Data unavailable",
        setupType: inferSetupType(scores, metric),
        scores,
        levels: analyticalLevels(metric),
        note: "Analytical levels only, not guaranteed predictions."
      };
    })
    .sort((a, b) => (b.setupScore || 0) - (a.setupScore || 0))
    .slice(0, 12);
}

module.exports = {
  scanStocks
};
