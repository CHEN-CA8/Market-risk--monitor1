const scoreWeights = {
  volatility: 0.20,
  breadth: 0.20,
  momentum: 0.20,
  macro: 0.15,
  credit: 0.15,
  liquidity: 0.10
};

const symbols = {
  volatility: {
    vix: { symbol: "^VIX", label: "VIX" },
    vxn: { symbol: "^VXN", label: "VXN" },
    vvix: { symbol: "^VVIX", label: "VVIX" },
    vix9d: { symbol: "^VIX9D", label: "VIX9D" },
    vix3m: { symbol: "^VIX3M", label: "VIX3M" },
    vix6m: { symbol: "^VIX6M", label: "VIX6M" }
  },
  market: {
    spx: { symbol: "^GSPC", label: "SPX" },
    ndx: { symbol: "^NDX", label: "NDX" },
    spy: { symbol: "SPY", label: "SPY" },
    qqq: { symbol: "QQQ", label: "QQQ" },
    iwm: { symbol: "IWM", label: "IWM" }
  },
  macro: {
    us2y: { symbol: "^IRX", label: "US 2Y proxy", unit: "%" },
    us10y: { symbol: "^TNX", label: "US 10Y", unit: "%", divisorIfLarge: 10 },
    dxy: { symbol: "DX-Y.NYB", label: "DXY" },
    gold: { symbol: "GC=F", label: "Gold" },
    oil: { symbol: "CL=F", label: "WTI" },
    copper: { symbol: "HG=F", label: "Copper" },
    tlt: { symbol: "TLT", label: "TLT" }
  },
  sectors: {
    xlk: { symbol: "XLK", label: "Technology", style: "Growth" },
    xlc: { symbol: "XLC", label: "Communication", style: "Growth" },
    xly: { symbol: "XLY", label: "Discretionary", style: "Cyclical" },
    xlp: { symbol: "XLP", label: "Staples", style: "Defensive" },
    xlf: { symbol: "XLF", label: "Financials", style: "Cyclical" },
    xli: { symbol: "XLI", label: "Industrials", style: "Cyclical" },
    xle: { symbol: "XLE", label: "Energy", style: "Cyclical" },
    xlv: { symbol: "XLV", label: "Health Care", style: "Defensive" },
    xlu: { symbol: "XLU", label: "Utilities", style: "Defensive" },
    xlre: { symbol: "XLRE", label: "Real Estate", style: "Rate Sensitive" },
    xlb: { symbol: "XLB", label: "Materials", style: "Cyclical" }
  },
  mag7: {
    nvda: { symbol: "NVDA", label: "NVDA", sector: "Technology" },
    aapl: { symbol: "AAPL", label: "AAPL", sector: "Technology" },
    msft: { symbol: "MSFT", label: "MSFT", sector: "Technology" },
    amzn: { symbol: "AMZN", label: "AMZN", sector: "Consumer" },
    meta: { symbol: "META", label: "META", sector: "Communication" },
    googl: { symbol: "GOOGL", label: "GOOGL", sector: "Communication" },
    tsla: { symbol: "TSLA", label: "TSLA", sector: "Consumer" }
  },
  scanner: ["GOOGL", "GOOG", "ORCL", "RKLB", "AI", "NVDA", "AMD", "PLTR", "MSFT", "META", "TSLA", "AAPL", "AMZN", "QQQ", "SPY", "IWM"]
};

const thresholds = {
  vix: { low: 18, elevated: 25, panic: 30 },
  vxn: { low: 22, elevated: 30, panic: 35 },
  vvix: { elevated: 100, panic: 120 },
  putCall: { calm: 0.8, elevated: 1.05, panic: 1.25 },
  yieldShockBp5d: 18,
  dollarShock5dPct: 1.2,
  volatilityExpansion5dPct: 12,
  breadthRisk: 40,
  breadthStrong: 60
};

const unavailableSources = {
  breadth:
    "Constituent-level breadth needs a market data API such as Polygon, Tiingo, Finnhub, or a maintained S&P/Nasdaq constituent feed.",
  credit:
    "HY/IG credit spreads and MOVE require FRED/ICE/BofA or another licensed macro data source.",
  events:
    "Economic calendar requires a calendar API such as Nasdaq Data Link, Financial Modeling Prep, Trading Economics, or Finnhub.",
  earnings:
    "Earnings estimates and reactions require an earnings API such as Finnhub, FMP, Polygon, or Benzinga.",
  options:
    "Expected move requires options chain implied volatility from Polygon, Tradier, Cboe, or another options API."
};

module.exports = {
  scoreWeights,
  symbols,
  thresholds,
  unavailableSources
};
