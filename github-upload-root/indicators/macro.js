const { basisPointChange, clamp, mean, round, isFiniteNumber } = require("../backend/utils/math");
const { thresholds } = require("../config/marketConfig");

function buildMacro(macro) {
  const us10y = macro.us10y;
  const us2y = macro.us2y;
  const dxy = macro.dxy;
  const spread = us10y && us2y && isFiniteNumber(us10y.value) && isFiniteNumber(us2y.value)
    ? round(us10y.value - us2y.value, 3)
    : null;

  const yield5dBp = us10y && isFiniteNumber(us10y.value) && us10y.history && us10y.history.length >= 6
    ? round(basisPointChange(us10y.value, us10y.history[us10y.history.length - 6].close), 1)
    : null;
  const dollar5d = dxy && isFiniteNumber(dxy.weekChangePct) ? dxy.weekChangePct : null;

  const yieldScore = isFiniteNumber(yield5dBp) ? clamp(70 - Math.max(0, yield5dBp) * 1.6, 0, 100) : null;
  const dollarScore = isFiniteNumber(dollar5d) ? clamp(70 - Math.max(0, dollar5d) * 12, 0, 100) : null;
  const goldScore = macro.gold && isFiniteNumber(macro.gold.changePct) ? clamp(55 + macro.gold.changePct * 3, 0, 100) : null;
  const copperScore = macro.copper && isFiniteNumber(macro.copper.weekChangePct) ? clamp(55 + macro.copper.weekChangePct * 2, 0, 100) : null;
  const score = round(mean([yieldScore, dollarScore, goldScore, copperScore].filter(isFiniteNumber)), 1);

  const alerts = [];
  if (isFiniteNumber(yield5dBp) && yield5dBp >= thresholds.yieldShockBp5d) {
    alerts.push({ severity: "high", message: "Yield pressure detected" });
  }
  if (isFiniteNumber(dollar5d) && dollar5d >= thresholds.dollarShock5dPct) {
    alerts.push({ severity: "high", message: "USD liquidity pressure detected" });
  }

  return {
    score,
    spread10y2y: spread,
    yield5dBp,
    dollar5dPct: dollar5d,
    items: Object.values(macro),
    alerts
  };
}

module.exports = {
  buildMacro
};
