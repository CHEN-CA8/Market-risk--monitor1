function bullet(label, text) {
  return { label, text };
}

function buildDailySummary({ regime, volatility, breadth, sectors, macro, scanner }) {
  const topSector = sectors.items && sectors.items[0];
  const topSetups = scanner.slice(0, 4).map((item) => `${item.symbol} (${item.setupLabel}, ${item.setupScore}/100)`);
  const keyDrivers = [];
  const mainRisks = [];

  if (volatility.termStructure.stress) mainRisks.push(volatility.termStructure.message);
  macro.alerts.forEach((alert) => mainRisks.push(alert.message));
  volatility.alerts.forEach((alert) => mainRisks.push(alert.message));
  if (topSector) keyDrivers.push(`${topSector.label} sector relative strength ${topSector.relativeStrengthWeekly}% vs SPY over 5D`);
  if (breadth.score != null) keyDrivers.push(`Breadth proxy score ${breadth.score}/100`);

  return {
    title: "AI Market Brief",
    model: "Rules-based analyst summary",
    dataPolicy: "Generated only from current dashboard data. No unavailable field is inferred.",
    marketRegime: regime.regime,
    marketScore: regime.marketScore,
    riskLevel: regime.riskLevel,
    sections: [
      bullet("What happened", `Current regime is ${regime.regime} with Market Score ${regime.marketScore}/100.`),
      bullet("Volatility", `${volatility.termStructure.message}. Volatility score is ${volatility.score ?? "unavailable"}/100.`),
      bullet("Breadth", breadth.score == null ? "Constituent breadth unavailable; ETF proxy only." : `Breadth proxy is ${breadth.score}/100.`),
      bullet("Sector rotation", sectors.rotation.state),
      bullet("Macro", macro.alerts.length ? macro.alerts.map((alert) => alert.message).join("; ") : "No yield or dollar shock detected by MVP thresholds."),
      bullet("Main risks", mainRisks.length ? mainRisks.join("; ") : "No high-severity cross-asset risk alert from available data."),
      bullet("Top setups", topSetups.length ? topSetups.join(", ") : "Scanner data unavailable."),
      bullet("Tomorrow", "Watch volatility direction, DXY/10Y pressure, QQQ trend vs 20DMA, and upcoming data events if a calendar API is connected.")
    ],
    disclaimer: "This is an analytical brief, not a prediction or investment advice."
  };
}

module.exports = {
  buildDailySummary
};
