const { getDashboardData } = require("../backend/marketService");

(async () => {
  const data = await getDashboardData({ force: true });
  const required = ["regime", "volatility", "market", "breadth", "sectors", "macro", "scanner", "aiBrief"];
  const missing = required.filter((key) => !data[key]);
  if (missing.length) {
    throw new Error(`Missing dashboard sections: ${missing.join(", ")}`);
  }
  console.log(JSON.stringify({
    ok: true,
    regime: data.regime.regime,
    marketScore: data.regime.marketScore,
    scanner: data.scanner.length,
    alerts: data.alerts.length
  }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
