function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function clamp(value, min, max) {
  if (!isFiniteNumber(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 2) {
  if (!isFiniteNumber(value)) return null;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function mean(values) {
  const clean = values.filter(isFiniteNumber);
  if (!clean.length) return null;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function pctChange(current, previous) {
  if (!isFiniteNumber(current) || !isFiniteNumber(previous) || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function basisPointChange(current, previous) {
  if (!isFiniteNumber(current) || !isFiniteNumber(previous)) return null;
  return (current - previous) * 100;
}

function percentileRank(values, current) {
  const clean = values.filter(isFiniteNumber).sort((a, b) => a - b);
  if (!clean.length || !isFiniteNumber(current)) return null;
  const below = clean.filter((value) => value <= current).length;
  return (below / clean.length) * 100;
}

function sma(values, length) {
  const clean = values.filter(isFiniteNumber);
  if (clean.length < length) return null;
  const slice = clean.slice(-length);
  return mean(slice);
}

function direction(current, previous, epsilon = 0.001) {
  if (!isFiniteNumber(current) || !isFiniteNumber(previous)) return "flat";
  const diff = current - previous;
  if (Math.abs(diff) <= epsilon) return "flat";
  return diff > 0 ? "up" : "down";
}

function scoreFromRange(value, bearishLow, bullishHigh) {
  if (!isFiniteNumber(value)) return null;
  const raw = ((value - bearishLow) / (bullishHigh - bearishLow)) * 100;
  return clamp(raw, 0, 100);
}

module.exports = {
  isFiniteNumber,
  clamp,
  round,
  mean,
  pctChange,
  basisPointChange,
  percentileRank,
  sma,
  direction,
  scoreFromRange
};
