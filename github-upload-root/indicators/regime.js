const { clamp, mean, round, isFiniteNumber } = require("../backend/utils/math");
const { scoreWeights, thresholds } = require("../config/marketConfig");

function weightedScore(parts) {
  let weighted = 0;
  let usedWeight = 0;
  Object.entries(scoreWeights).forEach(([key, weight]) => {
    const value = parts[key];
    if (isFiniteNumber(value)) {
      weighted += value * weight;
      usedWeight += weight;
    }
  });
  if (!usedWeight) return null;
  return round(weighted / usedWeight, 1);
}

function classifyRegime({ marketScore, volatility, momentum, breadth, macro, liquidity }) {
  const vix = volatility.items.find((item) => item.id === "vix");
  const vxn = volatility.items.find((item) => item.id === "vxn");
  const qqqMomentum = momentum.items.find((item) => item.id === "qqq");
  const volExpanding = volatility.alerts.some((alert) => /expansion|stress|inversion/i.test(alert.message));
  const qqqPositive = qqqMomentum && qqqMomentum.changePct > 0 && qqqMomentum.weekChangePct > 0;
  const qqqChoppy = qqqMomentum && Math.abs(qqqMomentum.weekChangePct || 0) < 1.2;
  const vixPanic = vix && vix.value >= thresholds.vix.panic;
  const vxnPanic = vxn && vxn.value >= thresholds.vxn.panic;

  if (vixPanic || vxnPanic) return "Panic";
  if (volExpanding && marketScore <= 55) return "Volatility Expansion";
  if (marketScore >= 72 && qqqPositive && volatility.score >= 65) return "Risk-On / Trend";
  if (marketScore >= 62 && qqqChoppy) return "Risk-On / Choppy";
  if (marketScore >= 58 && volatility.score >= 72 && liquidity >= 60) return "Volatility Compression";
  if (marketScore <= 42) return "Risk-Off";
  if (marketScore > 42 && marketScore < 58) return "Transition";
  return "Neutral";
}

function buildMarketRegime({ volatility, momentum, breadth, macro, credit, liquidity }) {
  const parts = {
    volatility: volatility.score,
    breadth: breadth.score,
    momentum: momentum.score,
    macro: macro.score,
    credit: credit.score,
    liquidity: liquidity.score
  };
  const marketScore = weightedScore(parts);
  const regime = classifyRegime({
    marketScore: marketScore || 50,
    volatility,
    momentum,
    breadth,
    macro,
    liquidity: liquidity.score
  });
  const riskLevel = marketScore >= 70 ? "Low-Medium" : marketScore >= 55 ? "Medium" : marketScore >= 40 ? "Elevated" : "High";

  return {
    marketScore,
    regime,
    riskLevel,
    parts: Object.fromEntries(Object.entries(parts).map(([key, value]) => [key, isFiniteNumber(value) ? round(value, 1) : null])),
    weights: scoreWeights,
    confidence: round(mean(Object.values(parts).filter(isFiniteNumber).map(() => 100)), 0)
  };
}

function buildCreditUnavailable(unavailableReason) {
  return {
    score: null,
    items: [
      { label: "HY Credit Spread", status: "Data source unavailable" },
      { label: "IG Credit Spread", status: "Data source unavailable" },
      { label: "MOVE Index", status: "Data source unavailable" }
    ],
    financialStressScore: null,
    unavailableReason
  };
}

function buildLiquidity(volatility, macro, putCall) {
  const dxyScore = macro.dollar5dPct == null ? null : clamp(70 - Math.max(0, macro.dollar5dPct) * 12, 0, 100);
  const putCallScore = putCall && isFiniteNumber(putCall.value) ? clamp(100 - ((putCall.value - 0.6) / 0.8) * 100, 0, 100) : null;
  const volScore = volatility.score;
  return {
    score: round(mean([dxyScore, putCallScore, volScore].filter(isFiniteNumber)), 1),
    putCall
  };
}

module.exports = {
  buildMarketRegime,
  buildCreditUnavailable,
  buildLiquidity
};
