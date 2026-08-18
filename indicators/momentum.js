const { clamp, mean, round, isFiniteNumber } = require("../backend/utils/math");

function momentumScoreFor(metric) {
  if (!metric || metric.error || !isFiniteNumber(metric.changePct)) return null;
  const above20 = metric.movingAverages && metric.movingAverages.distance20Pct;
  const above50 = metric.movingAverages && metric.movingAverages.distance50Pct;
  const above200 = metric.movingAverages && metric.movingAverages.distance200Pct;
  const daily = clamp(50 + metric.changePct * 8, 0, 100);
  const weekly = clamp(50 + (metric.weekChangePct || 0) * 3, 0, 100);
  const trend = mean([
    isFiniteNumber(above20) ? clamp(50 + above20 * 2, 0, 100) : null,
    isFiniteNumber(above50) ? clamp(50 + above50 * 1.4, 0, 100) : null,
    isFiniteNumber(above200) ? clamp(50 + above200 * 0.8, 0, 100) : null
  ].filter(isFiniteNumber));
  return round(mean([daily, weekly, trend].filter(isFiniteNumber)), 1);
}

function buildMomentum(market) {
  const keyIds = ["spy", "qqq", "iwm"];
  const scores = keyIds.map((id) => momentumScoreFor(market[id])).filter(isFiniteNumber);
  return {
    score: scores.length ? round(mean(scores), 1) : null,
    items: Object.values(market).map((metric) => ({
      ...metric,
      momentumScore: momentumScoreFor(metric)
    }))
  };
}

module.exports = {
  buildMomentum,
  momentumScoreFor
};
