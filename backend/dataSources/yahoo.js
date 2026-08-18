const { pctChange, percentileRank, sma, direction, round, isFiniteNumber } = require("../utils/math");

function normalizeValue(value, config = {}) {
  if (!isFiniteNumber(value)) return null;
  if (config.divisorIfLarge && value > 20) return value / config.divisorIfLarge;
  return value;
}

function marketFreshness(timestampSeconds) {
  if (!timestampSeconds) return { status: "Delayed", minutes: null };
  const minutes = Math.max(0, Math.round((Date.now() - timestampSeconds * 1000) / 60000));
  if (minutes <= 20) return { status: "Near real-time", minutes };
  if (minutes <= 24 * 60) return { status: "Delayed", minutes };
  return { status: "Stale", minutes };
}

async function fetchYahooHistory(id, config, range = "1y", interval = "1d") {
  const encoded = encodeURIComponent(config.symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?range=${range}&interval=${interval}`;
  const response = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 market-intelligence-dashboard" }
  });
  if (!response.ok) throw new Error(`${config.symbol} HTTP ${response.status}`);

  const data = await response.json();
  const result = data.chart && data.chart.result && data.chart.result[0];
  if (!result || !result.indicators || !result.indicators.quote) {
    throw new Error(`${config.symbol} missing chart data`);
  }

  const quote = result.indicators.quote[0];
  const timestamps = result.timestamp || [];
  const rows = (quote.close || [])
    .map((close, index) => ({
      date: timestamps[index] ? new Date(timestamps[index] * 1000).toISOString().slice(0, 10) : null,
      timestamp: timestamps[index] || null,
      close: normalizeValue(close, config),
      volume: quote.volume ? quote.volume[index] : null,
      high: normalizeValue(quote.high ? quote.high[index] : null, config),
      low: normalizeValue(quote.low ? quote.low[index] : null, config),
      open: normalizeValue(quote.open ? quote.open[index] : null, config)
    }))
    .filter((row) => isFiniteNumber(row.close));

  if (!rows.length) {
    const meta = result.meta || {};
    const regular = normalizeValue(Number(meta.regularMarketPrice), config);
    if (!isFiniteNumber(regular)) throw new Error(`${config.symbol} unavailable`);
    rows.push({
      date: new Date((meta.regularMarketTime || Math.floor(Date.now() / 1000)) * 1000).toISOString().slice(0, 10),
      timestamp: meta.regularMarketTime || Math.floor(Date.now() / 1000),
      close: regular,
      volume: null,
      high: regular,
      low: regular,
      open: regular
    });
  }

  const last = rows[rows.length - 1];
  const prev = rows[rows.length - 2] || last;
  const five = rows[rows.length - 6] || prev;
  const month = rows[rows.length - 22] || five;
  const values = rows.map((row) => row.close);
  const ma20 = sma(values, 20);
  const ma50 = sma(values, 50);
  const ma200 = sma(values, 200);
  const freshness = marketFreshness(last.timestamp);

  return {
    id,
    symbol: config.symbol,
    label: config.label || config.symbol,
    value: round(last.close, config.unit === "%" ? 3 : 2),
    previous: round(prev.close, config.unit === "%" ? 3 : 2),
    change: round(last.close - prev.close, 3),
    changePct: round(pctChange(last.close, prev.close), 2),
    weekChangePct: round(pctChange(last.close, five.close), 2),
    monthChangePct: round(pctChange(last.close, month.close), 2),
    trend: direction(last.close, prev.close),
    percentile: round(percentileRank(values, last.close), 1),
    movingAverages: {
      ma20: round(ma20, 2),
      ma50: round(ma50, 2),
      ma200: round(ma200, 2),
      distance20Pct: round(pctChange(last.close, ma20), 2),
      distance50Pct: round(pctChange(last.close, ma50), 2),
      distance200Pct: round(pctChange(last.close, ma200), 2)
    },
    volume: last.volume,
    volumeTrend: rows.length >= 21 && isFiniteNumber(last.volume) ? round(pctChange(last.volume, sma(rows.map((row) => row.volume), 20)), 1) : null,
    history: rows,
    unit: config.unit || "",
    date: last.date,
    timestamp: last.timestamp ? new Date(last.timestamp * 1000).toISOString() : null,
    freshness,
    source: "Yahoo Finance chart",
    delayed: true
  };
}

async function fetchManyYahoo(groups) {
  const entries = Object.entries(groups);
  const results = await Promise.all(
    entries.map(async ([id, config]) => {
      try {
        return await fetchYahooHistory(id, config);
      } catch (error) {
        return {
          id,
          symbol: config.symbol,
          label: config.label || config.symbol,
          value: null,
          error: error.message,
          source: "Yahoo Finance chart",
          freshness: { status: "Data unavailable", minutes: null },
          delayed: true
        };
      }
    })
  );
  return Object.fromEntries(results.map((item) => [item.id, item]));
}

module.exports = {
  fetchYahooHistory,
  fetchManyYahoo
};
