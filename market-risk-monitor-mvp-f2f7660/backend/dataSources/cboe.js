const { direction, pctChange, round } = require("../utils/math");

async function fetchPutCall() {
  const url = "https://cdn.cboe.com/resources/options/volume_and_call_put_ratios/totalpc.csv";
  const response = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 market-intelligence-dashboard" }
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
  const week = parse(rows[Math.max(0, rows.length - 6)]);
  if (!Number.isFinite(last.value) || !Number.isFinite(prev.value)) {
    throw new Error("Cboe put/call parse failed");
  }

  return {
    id: "putCall",
    label: "Put/Call",
    symbol: "Cboe Total P/C",
    value: round(last.value, 2),
    previous: round(prev.value, 2),
    change: round(last.value - prev.value, 2),
    changePct: round(pctChange(last.value, prev.value), 2),
    weekChangePct: round(pctChange(last.value, week.value), 2),
    trend: direction(last.value, prev.value, 0.01),
    date: last.date,
    timestamp: null,
    freshness: { status: "Delayed", minutes: null },
    source: "Cboe totalpc.csv",
    delayed: true
  };
}

module.exports = {
  fetchPutCall
};
