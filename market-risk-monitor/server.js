const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;

const YAHOO_SYMBOLS = {
  vix: { symbol: "^VIX", label: "VIX", unit: "", low: 18, bear: 25, panic: 30 },
  vxn: { symbol: "^VXN", label: "VXN", unit: "", low: 22, bear: 30, panic: 35 },
  teny: { symbol: "^TNX", label: "10Y", unit: "%", divisorIfLarge: 10 },
  dxy: { symbol: "DX-Y.NYB", label: "DXY", unit: "" },
  nasdaq: { symbol: "^IXIC", label: "Nasdaq", unit: "%", percentMove: true, bear: -1.5, panic: -3 },
  vix3m: { symbol: "^VIX3M", label: "VIX3M", unit: "" },
  vix6m: { symbol: "^VIX6M", label: "VIX6M", unit: "" }
};

let cache = null;
let cacheTime = 0;
const CACHE_MS = 5 * 60 * 1000;

function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(body, null, 2));
}

function serveFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "content-type": contentType });
    res.end(data);
  });
}

function normalizeValue(value, config) {
  if (!Number.isFinite(value)) return null;
  if (config.divisorIfLarge && value > 20) return value / config.divisorIfLarge;
  return value;
}

function direction(current, previous, epsilon = 0.001) {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return "flat";
  const diff = current - previous;
  if (Math.abs(diff) <= epsilon) return "flat";
  return diff > 0 ? "up" : "down";
}

async function fetchYahoo(id, config) {
  const encoded = encodeURIComponent(config.symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?range=10d&interval=1d`;
  const response = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 market-risk-monitor" }
  });
  if (!response.ok) throw new Error(`${config.symbol} HTTP ${response.status}`);
  const data = await response.json();
  const result = data.chart && data.chart.result && data.chart.result[0];
  if (!result) throw new Error(`${config.symbol} missing chart result`);

  const quote = result.indicators.quote[0];
  const closes = quote.close
    .map((value, index) => ({
      close: normalizeValue(value, config),
      time: result.timestamp[index]
    }))
    .filter((item) => Number.isFinite(item.close));
  if (closes.length < 2) {
    const meta = result.meta || {};
    const regular = normalizeValue(Number(meta.regularMarketPrice), config);
    const previous = normalizeValue(Number(meta.previousClose), config);
    if (!Number.isFinite(regular)) throw new Error(`${config.symbol} insufficient observations`);
    const prev = Number.isFinite(previous) ? previous : regular;
    return {
      id,
      label: config.label,
      symbol: config.symbol,
      value: regular,
      last: regular,
      previous: prev,
      change: regular - prev,
      percentChange: prev ? ((regular - prev) / prev) * 100 : 0,
      trend: direction(regular, prev),
      unit: config.unit,
      date: new Date((meta.regularMarketTime || Math.floor(Date.now() / 1000)) * 1000).toISOString().slice(0, 10),
      source: "Yahoo Finance chart metadata"
    };
  }

  const last = closes[closes.length - 1];
  const prev = closes[closes.length - 2];
  const rawChange = last.close - prev.close;
  const percentChange = prev.close ? (rawChange / prev.close) * 100 : 0;
  const displayValue = config.percentMove ? percentChange : last.close;

  return {
    id,
    label: config.label,
    symbol: config.symbol,
    value: displayValue,
    last: last.close,
    previous: prev.close,
    change: rawChange,
    percentChange,
    trend: direction(last.close, prev.close),
    unit: config.unit,
    date: new Date(last.time * 1000).toISOString().slice(0, 10),
    source: "Yahoo Finance chart"
  };
}

async function fetchPutCall() {
  const url = "https://cdn.cboe.com/resources/options/volume_and_call_put_ratios/totalpc.csv";
  const response = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 market-risk-monitor" }
  });
  if (!response.ok) throw new Error(`Cboe put/call HTTP ${response.status}`);
  const text = await response.text();
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(",").map((cell) => cell.replace(/^"|"$/g, "").trim()))
    .filter((row) => row.length >= 5 && /\d{1,2}\/\d{1,2}\/\d{4}/.test(row[0]));

  if (rows.length < 2) throw new Error("Cboe put/call insufficient observations");
  const parse = (row) => ({
    date: row[0],
    value: Number(row[row.length - 1])
  });
  const last = parse(rows[rows.length - 1]);
  const prev = parse(rows[rows.length - 2]);
  if (!Number.isFinite(last.value) || !Number.isFinite(prev.value)) {
    throw new Error("Cboe put/call parse failed");
  }

  return {
    id: "putcall",
    label: "Put/Call",
    symbol: "Cboe Total P/C",
    value: last.value,
    last: last.value,
    previous: prev.value,
    change: last.value - prev.value,
    percentChange: prev.value ? ((last.value - prev.value) / prev.value) * 100 : 0,
    trend: direction(last.value, prev.value, 0.01),
    unit: "",
    date: last.date,
    source: "Cboe totalpc.csv"
  };
}

function trendScore(metric) {
  if (metric.id === "nasdaq") {
    return metric.trend === "up" ? 1 : metric.trend === "down" ? -1 : 0;
  }
  return metric.trend === "down" ? 1 : metric.trend === "up" ? -1 : 0;
}

function levelAdjustment(metric) {
  if (metric.id === "vix") {
    if (metric.value >= 30) return { mod: -1, note: "极端恐慌" };
    if (metric.value >= 25) return { mod: 0, note: "偏空区间" };
    if (metric.value < 18) return { mod: 0, note: "舒适区间" };
    return { mod: 0, note: "中性区间" };
  }
  if (metric.id === "vxn") {
    if (metric.value >= 35) return { mod: -1, note: "极端恐慌" };
    if (metric.value >= 30) return { mod: 0, note: "偏空区间" };
    if (metric.value < 22) return { mod: 0, note: "舒适区间" };
    return { mod: 0, note: "中性区间" };
  }
  if (metric.id === "putcall") {
    if (metric.value >= 1.25) return { mod: -1, note: "保险需求极高" };
    if (metric.value >= 1.05) return { mod: 0, note: "避险升温" };
    if (metric.value <= 0.8) return { mod: 0, note: "风险偏好较好" };
    return { mod: 0, note: "中性区间" };
  }
  if (metric.id === "nasdaq") {
    if (metric.value <= -3) return { mod: -1, note: "快速下跌" };
    if (metric.value < 0) return { mod: 0, note: "走弱" };
    return { mod: 0, note: "上涨" };
  }
  return { mod: 0, note: "看方向" };
}

function termAdjustment(metrics) {
  const spot = metrics.vix && metrics.vix.value;
  const v3m = metrics.vix3m && metrics.vix3m.value;
  const v6m = metrics.vix6m && metrics.vix6m.value;
  if (![spot, v3m, v6m].every(Number.isFinite)) {
    return { mod: 0, state: "unknown", note: "期限结构数据暂不可用" };
  }
  if (spot > v3m && v3m > v6m) {
    return { mod: -1, state: "inverted", note: "VIX期限结构倒挂，短期恐慌高于中长期" };
  }
  if (spot > v3m) {
    return { mod: -1, state: "front-stress", note: "短端VIX高于VIX3M，短期压力偏高" };
  }
  if (spot < v3m && v3m < v6m) {
    return { mod: 1, state: "normal", note: "正常期限结构，短端低于长端" };
  }
  return { mod: 0, state: "mixed", note: "期限结构混合，按中性处理" };
}

function buildScore(items) {
  const metrics = Object.fromEntries(items.map((item) => [item.id, item]));
  const rows = [];
  let score = 0;
  let extremeCount = 0;

  ["vix", "vxn", "putcall", "teny", "dxy", "nasdaq"].forEach((id) => {
    const metric = metrics[id];
    if (!metric || metric.error) return;
    const level = levelAdjustment(metric);
    const points = trendScore(metric) + level.mod;
    score += points;
    if (["极端恐慌", "保险需求极高", "快速下跌"].includes(level.note)) extremeCount += 1;
    rows.push({ ...metric, points, note: level.note });
  });

  const term = termAdjustment(metrics);
  score += term.mod;
  rows.push({
    id: "term",
    label: "VIX期限结构",
    value: term.state,
    trend: term.mod > 0 ? "down" : term.mod < 0 ? "up" : "flat",
    points: term.mod,
    note: term.note,
    unit: ""
  });

  const vix = metrics.vix;
  const vxn = metrics.vxn;
  const nasdaq = metrics.nasdaq;
  const panicFade = vix && vxn && nasdaq &&
    (vix.value >= 25 || vxn.value >= 30) &&
    vix.trend === "down" &&
    vxn.trend === "down" &&
    nasdaq.trend !== "down";
  const panicBuild = vix && vxn && nasdaq &&
    extremeCount >= 3 &&
    (vix.trend === "up" || vxn.trend === "up") &&
    nasdaq.trend === "down";

  let state = "Neutral";
  let action = "正常交易，仓位不要太激进。";
  if (panicFade) {
    state = "Panic fading";
    action = "极端恐慌正在降温：不追高，优先观察分批补仓或反转确认。";
  } else if (panicBuild || score <= -4) {
    state = "Panic";
    action = "尽量不要接飞刀；已有仓位以减仓、止损或保护为主。";
  } else if (score >= 4) {
    state = "Risk-on";
    action = "可以积极寻找开仓和加仓机会，仍按个股计划控制仓位。";
  } else if (score <= 0) {
    state = "Risk-off";
    action = "降低仓位，等待 VIX/VXN、10Y、DXY 至少两项转稳。";
  }

  return { score, state, action, rows, term, panicFade, panicBuild };
}

async function getMarketData(force = false) {
  if (!force && cache && Date.now() - cacheTime < CACHE_MS) return cache;

  const requests = Object.entries(YAHOO_SYMBOLS).map(async ([id, config]) => {
    try {
      return await fetchYahoo(id, config);
    } catch (error) {
      return { id, label: config.label, symbol: config.symbol, error: error.message };
    }
  });
  requests.push(fetchPutCall().catch((error) => ({
    id: "putcall",
    label: "Put/Call",
    symbol: "Cboe Total P/C",
    error: error.message
  })));

  const items = await Promise.all(requests);
  const score = buildScore(items);
  cache = {
    updatedAt: new Date().toISOString(),
    items,
    score,
    disclaimer: "仅供监测和交易计划参考，不构成投资建议。Yahoo/Cboe数据可能延迟或短暂不可用。"
  };
  cacheTime = Date.now();
  return cache;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === "/api/market") {
    try {
      const data = await getMarketData(url.searchParams.get("force") === "1");
      json(res, 200, data);
    } catch (error) {
      json(res, 500, { error: error.message });
    }
    return;
  }

  if (url.pathname === "/" || url.pathname === "/index.html") {
    serveFile(res, path.join(ROOT, "index.html"), "text/html; charset=utf-8");
    return;
  }

  res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  res.end("Not found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Market risk monitor: http://localhost:${PORT}`);
});
