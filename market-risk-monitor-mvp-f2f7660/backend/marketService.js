const { symbols, unavailableSources } = require("../config/marketConfig");
const { fetchManyYahoo } = require("./dataSources/yahoo");
const { fetchPutCall } = require("./dataSources/cboe");
const { buildVolatilityDashboard } = require("../indicators/volatility");
const { buildMomentum } = require("../indicators/momentum");
const { buildMacro } = require("../indicators/macro");
const { buildSectorRotation } = require("../indicators/sectors");
const { proxyBreadthFromEtfs } = require("../indicators/breadth");
const { buildMarketRegime, buildCreditUnavailable, buildLiquidity } = require("../indicators/regime");
const { scanStocks } = require("../scanner/setupScanner");
const { buildMag7 } = require("../indicators/mag7");
const { buildDailySummary } = require("../ai/dailySummary");

let cache = null;
let cacheTime = 0;
const CACHE_MS = 5 * 60 * 1000;

function flattenSymbolConfig() {
  const scannerSymbols = Object.fromEntries(
    symbols.scanner.map((symbol) => [
      symbol.toLowerCase().replace(/[^a-z0-9]/g, ""),
      { symbol, label: symbol }
    ])
  );
  return {
    volatility: symbols.volatility,
    market: symbols.market,
    macro: symbols.macro,
    sectors: symbols.sectors,
    mag7: symbols.mag7,
    scanner: scannerSymbols
  };
}

function marketSessionStatus(now = new Date()) {
  const ny = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(now);
  const part = (type) => ny.find((item) => item.type === type).value;
  const weekday = part("weekday");
  const hour = Number(part("hour"));
  const minute = Number(part("minute"));
  const minutes = hour * 60 + minute;
  const isWeekday = !["Sat", "Sun"].includes(weekday);
  const isOpen = isWeekday && minutes >= 9 * 60 + 30 && minutes < 16 * 60;
  return {
    label: isOpen ? "US Market Open" : "US Market Closed",
    isOpen,
    timezone: "America/New_York"
  };
}

async function safePutCall() {
  try {
    return await fetchPutCall();
  } catch (error) {
    return {
      id: "putCall",
      label: "Put/Call",
      symbol: "Cboe Total P/C",
      value: null,
      error: error.message,
      source: "Cboe totalpc.csv",
      freshness: { status: "Data unavailable", minutes: null },
      delayed: true
    };
  }
}

async function getDashboardData({ force = false } = {}) {
  if (!force && cache && Date.now() - cacheTime < CACHE_MS) return cache;

  const cfg = flattenSymbolConfig();
  const [volatilityRaw, marketRaw, macroRaw, sectorsRaw, mag7Raw, scannerRaw, putCall] = await Promise.all([
    fetchManyYahoo(cfg.volatility),
    fetchManyYahoo(cfg.market),
    fetchManyYahoo(cfg.macro),
    fetchManyYahoo(cfg.sectors),
    fetchManyYahoo(cfg.mag7),
    fetchManyYahoo(cfg.scanner),
    safePutCall()
  ]);

  const volatility = buildVolatilityDashboard(volatilityRaw);
  const momentum = buildMomentum(marketRaw);
  const macro = buildMacro(macroRaw);
  const breadth = proxyBreadthFromEtfs(marketRaw);
  const sectors = buildSectorRotation(sectorsRaw, marketRaw.spy);
  const credit = buildCreditUnavailable(unavailableSources.credit);
  const liquidity = buildLiquidity(volatility, macro, putCall);
  const regime = buildMarketRegime({ volatility, momentum, breadth, macro, credit, liquidity });
  const scanner = scanStocks(scannerRaw, marketRaw.spy, regime);
  const mag7 = buildMag7(mag7Raw, marketRaw.qqq);
  const aiBrief = buildDailySummary({ regime, volatility, breadth, sectors, macro, scanner });
  const alerts = [
    ...volatility.alerts,
    ...macro.alerts,
    ...(liquidity.putCall && liquidity.putCall.value >= 1.25 ? [{ severity: "high", message: "Put/Call ratio indicates elevated demand for downside protection" }] : [])
  ];

  cache = {
    app: "US Market Intelligence Dashboard",
    version: "0.2.0-mvp",
    generatedAt: new Date().toISOString(),
    marketStatus: marketSessionStatus(),
    dataStatus: {
      delay: "Delayed / best-effort",
      sourcePolicy: "No unavailable data is simulated. Missing API-backed fields are marked Data source unavailable."
    },
    regime,
    volatility,
    market: {
      score: momentum.score,
      items: momentum.items
    },
    breadth,
    sectors,
    mag7,
    macro,
    credit,
    liquidity,
    events: {
      status: "Data source unavailable",
      unavailableReason: unavailableSources.events,
      items: []
    },
    earnings: {
      status: "Data source unavailable",
      unavailableReason: unavailableSources.earnings
    },
    expectedMove: {
      status: "Data source unavailable",
      unavailableReason: unavailableSources.options
    },
    scanner,
    aiBrief,
    alerts,
    disclaimer:
      "This dashboard is an analytical decision-support tool. It does not predict price moves and does not provide investment advice."
  };
  cacheTime = Date.now();
  return cache;
}

module.exports = {
  getDashboardData,
  marketSessionStatus
};
