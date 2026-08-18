const { clamp, mean, round, isFiniteNumber } = require("../backend/utils/math");

function sectorScore(sector, spy) {
  if (!sector || sector.error || !isFiniteNumber(sector.weekChangePct)) return null;
  const rsDaily = spy && isFiniteNumber(spy.changePct) ? sector.changePct - spy.changePct : null;
  const rsWeekly = spy && isFiniteNumber(spy.weekChangePct) ? sector.weekChangePct - spy.weekChangePct : null;
  const momentum = clamp(50 + sector.weekChangePct * 4 + (sector.monthChangePct || 0), 0, 100);
  const rs = isFiniteNumber(rsWeekly) ? clamp(50 + rsWeekly * 8, 0, 100) : null;
  return {
    ...sector,
    dailyReturn: sector.changePct,
    weeklyReturn: sector.weekChangePct,
    monthlyReturn: sector.monthChangePct,
    relativeStrengthDaily: round(rsDaily, 2),
    relativeStrengthWeekly: round(rsWeekly, 2),
    momentumScore: round(momentum, 1),
    score: round(mean([momentum, rs].filter(isFiniteNumber)), 1)
  };
}

function classifyRotation(items) {
  const groups = {
    Growth: ["xlk", "xlc", "xly"],
    Defensive: ["xlp", "xlv", "xlu"],
    Cyclical: ["xlf", "xli", "xle", "xlb"],
    "Rate Sensitive": ["xlre"]
  };
  const averages = Object.fromEntries(
    Object.entries(groups).map(([name, ids]) => {
      const values = ids.map((id) => items.find((item) => item.id === id)).filter(Boolean).map((item) => item.relativeStrengthWeekly);
      return [name, round(mean(values.filter(isFiniteNumber)), 2)];
    })
  );
  const ranked = Object.entries(averages)
    .filter(([, value]) => isFiniteNumber(value))
    .sort((a, b) => b[1] - a[1]);
  if (!ranked.length) return { state: "Data unavailable", groups: averages };

  const leader = ranked[0][0];
  let state = `${leader} rotation`;
  if (averages.Defensive > averages.Growth && averages.Defensive > 0 && averages.Growth < 0) state = "Risk-off rotation";
  return { state, groups: averages };
}

function buildSectorRotation(sectors, spy) {
  const items = Object.values(sectors).map((sector) => sectorScore(sector, spy));
  const valid = items.filter((item) => item && isFiniteNumber(item.score));
  const rotation = classifyRotation(valid);
  return {
    score: valid.length ? round(mean(valid.map((item) => item.score)), 1) : null,
    rotation,
    items: valid.sort((a, b) => (b.score || 0) - (a.score || 0))
  };
}

module.exports = {
  buildSectorRotation
};
