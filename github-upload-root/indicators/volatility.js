const { clamp, mean, round, scoreFromRange, isFiniteNumber } = require("../backend/utils/math");
const { thresholds } = require("../config/marketConfig");

function volatilityItemScore(metric, calm, panic) {
  if (!metric || metric.error || !isFiniteNumber(metric.value)) return null;
  const levelScore = 100 - scoreFromRange(metric.value, calm, panic);
  const trendPenalty = metric.weekChangePct > thresholds.volatilityExpansion5dPct ? 18 : metric.changePct > 5 ? 10 : 0;
  const trendBonus = metric.weekChangePct < -thresholds.volatilityExpansion5dPct ? 8 : 0;
  return clamp(levelScore - trendPenalty + trendBonus, 0, 100);
}

function classifyTermStructure(vol) {
  const vix9d = vol.vix9d && vol.vix9d.value;
  const vix = vol.vix && vol.vix.value;
  const vix3m = vol.vix3m && vol.vix3m.value;
  const vix6m = vol.vix6m && vol.vix6m.value;
  if (![vix, vix3m, vix6m].every(isFiniteNumber)) {
    return {
      state: "Unavailable",
      stress: false,
      message: "VIX term structure data unavailable"
    };
  }

  if (isFiniteNumber(vix9d) && vix9d > vix && vix > vix3m) {
    return {
      state: "Inverted",
      stress: true,
      message: "Short-term volatility stress detected"
    };
  }
  if (vix > vix3m && vix3m >= vix6m) {
    return {
      state: "Inverted",
      stress: true,
      message: "VIX curve inversion detected"
    };
  }
  if (Math.abs(vix - vix3m) <= 1.5) {
    return {
      state: "Flat",
      stress: false,
      message: "VIX curve is flat"
    };
  }
  if (vix < vix3m && vix3m <= vix6m) {
    return {
      state: "Normal",
      stress: false,
      message: "Normal term structure"
    };
  }
  return {
    state: "Mixed",
    stress: false,
    message: "Mixed term structure"
  };
}

function buildVolatilityDashboard(vol) {
  const term = classifyTermStructure(vol);
  const itemScores = [
    volatilityItemScore(vol.vix, 12, 35),
    volatilityItemScore(vol.vxn, 16, 42),
    volatilityItemScore(vol.vvix, 70, 130),
    volatilityItemScore(vol.vix9d, 10, 38)
  ].filter(isFiniteNumber);
  const score = itemScores.length ? round(mean(itemScores), 1) : null;
  const alerts = [];

  if (term.stress) alerts.push({ severity: "high", message: term.message });
  if (vol.vix && vol.vix.weekChangePct > thresholds.volatilityExpansion5dPct) {
    alerts.push({ severity: "medium", message: `VIX volatility expansion: ${vol.vix.weekChangePct}% over 5D` });
  }
  if (vol.vxn && vol.vxn.weekChangePct > thresholds.volatilityExpansion5dPct) {
    alerts.push({ severity: "medium", message: `VXN volatility expansion: ${vol.vxn.weekChangePct}% over 5D` });
  }

  return {
    score,
    termStructure: term,
    items: Object.values(vol),
    alerts
  };
}

module.exports = {
  buildVolatilityDashboard,
  classifyTermStructure
};
