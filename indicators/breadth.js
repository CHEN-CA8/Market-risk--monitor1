const { round, mean, isFiniteNumber, clamp } = require("../backend/utils/math");
const { unavailableSources } = require("../config/marketConfig");

function proxyBreadthFromEtfs(market) {
  const spy = market.spy;
  const qqq = market.qqq;
  const iwm = market.iwm;
  const proxies = [spy, qqq, iwm].filter((item) => item && !item.error);
  const distances20 = proxies.map((item) => item.movingAverages && item.movingAverages.distance20Pct).filter(isFiniteNumber);
  const distances50 = proxies.map((item) => item.movingAverages && item.movingAverages.distance50Pct).filter(isFiniteNumber);
  const distances200 = proxies.map((item) => item.movingAverages && item.movingAverages.distance200Pct).filter(isFiniteNumber);
  const score = mean([
    distances20.length ? clamp(50 + mean(distances20) * 2, 0, 100) : null,
    distances50.length ? clamp(50 + mean(distances50) * 1.4, 0, 100) : null,
    distances200.length ? clamp(50 + mean(distances200) * 0.8, 0, 100) : null
  ].filter(isFiniteNumber));

  return {
    score: isFiniteNumber(score) ? round(score, 1) : null,
    source: "ETF proxy from Yahoo Finance",
    limitation: "This is not constituent-level breadth. It uses SPY/QQQ/IWM distance from moving averages as a proxy only.",
    sp500: {
      above20dma: null,
      above50dma: null,
      above200dma: null,
      proxyDistance20Pct: spy && spy.movingAverages ? spy.movingAverages.distance20Pct : null,
      proxyDistance50Pct: spy && spy.movingAverages ? spy.movingAverages.distance50Pct : null,
      proxyDistance200Pct: spy && spy.movingAverages ? spy.movingAverages.distance200Pct : null
    },
    nasdaq: {
      above20dma: null,
      above50dma: null,
      above200dma: null,
      proxyDistance20Pct: qqq && qqq.movingAverages ? qqq.movingAverages.distance20Pct : null,
      proxyDistance50Pct: qqq && qqq.movingAverages ? qqq.movingAverages.distance50Pct : null,
      proxyDistance200Pct: qqq && qqq.movingAverages ? qqq.movingAverages.distance200Pct : null
    },
    advanceDecline: {
      advancingStocks: null,
      decliningStocks: null,
      ratio: null,
      status: "Data source unavailable"
    },
    newHighLow: {
      highs52w: null,
      lows52w: null,
      status: "Data source unavailable"
    },
    unavailableReason: unavailableSources.breadth
  };
}

module.exports = {
  proxyBreadthFromEtfs
};
