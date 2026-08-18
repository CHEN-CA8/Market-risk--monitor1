const { round, isFiniteNumber } = require("../backend/utils/math");

function buildMag7(stockMap, qqq) {
  const items = Object.values(stockMap).map((stock) => {
    const relativeStrength = qqq && !qqq.error && isFiniteNumber(stock.weekChangePct) && isFiniteNumber(qqq.weekChangePct)
      ? round(stock.weekChangePct - qqq.weekChangePct, 2)
      : null;
    return {
      symbol: stock.symbol,
      price: stock.value,
      dailyPct: stock.changePct,
      weeklyPct: stock.weekChangePct,
      relativeStrength,
      volume: stock.volume,
      distance20Pct: stock.movingAverages ? stock.movingAverages.distance20Pct : null,
      distance50Pct: stock.movingAverages ? stock.movingAverages.distance50Pct : null,
      distance200Pct: stock.movingAverages ? stock.movingAverages.distance200Pct : null,
      source: stock.source,
      timestamp: stock.timestamp,
      error: stock.error || null
    };
  });
  const positive = items.filter((item) => isFiniteNumber(item.dailyPct) && item.dailyPct > 0).length;
  const valid = items.filter((item) => !item.error).length;
  return {
    breadth: {
      positive,
      total: valid,
      label: `${positive} / ${valid} stocks positive`
    },
    indexContributionNote:
      "Exact index contribution requires index weights. MVP reports directional Mag7 participation only.",
    items
  };
}

module.exports = {
  buildMag7
};
