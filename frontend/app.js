const state = {
  data: null,
  page: "dashboard",
  lang: localStorage.getItem("market-dashboard-lang") || "zh"
};

const pageNode = document.getElementById("page");
const navNode = document.getElementById("nav");
const refreshButton = document.getElementById("refresh");
const langButtons = document.querySelectorAll("[data-lang]");

const I18N = {
  en: {
    "brand.subtitle": "Market Intelligence",
    "app.title": "US Market Intelligence Dashboard",
    "app.subtitle": "Market Data -> Regime -> Risk -> Scanner -> Brief",
    "nav.dashboard": "Dashboard",
    "nav.regime": "Market Regime",
    "nav.volatility": "Volatility",
    "nav.breadth": "Breadth",
    "nav.sectors": "Sectors",
    "nav.macro": "Macro",
    "nav.credit": "Credit",
    "nav.events": "Events",
    "nav.earnings": "Earnings",
    "nav.scanner": "Stock Scanner",
    "nav.portfolio": "Portfolio",
    "nav.backtest": "Backtest",
    "nav.ai": "AI Analyst",
    "nav.settings": "Settings",
    "actions.refresh": "Refresh",
    "status.updated": "Updated",
    "status.loading": "Loading market data...",
    "status.unavailable": "Data unavailable",
    "table.metric": "Metric",
    "table.value": "Value",
    "table.trend": "Trend",
    "table.percentile": "Percentile",
    "table.freshness": "Freshness",
    "table.symbol": "Symbol",
    "table.setup": "Setup",
    "table.price": "Price",
    "table.score": "Score",
    "table.type": "Type",
    "table.entryZone": "Entry Zone",
    "table.invalidation": "Invalidation",
    "table.target": "Target",
    "cards.marketScore": "Market Score",
    "cards.volatility": "Volatility",
    "cards.breadthProxy": "Breadth Proxy",
    "cards.macro": "Macro",
    "cards.marketRegime": "Market Regime",
    "cards.topScanner": "Top Stock Scanner",
    "cards.sectorRotation": "Sector Rotation",
    "cards.aiBrief": "AI Market Brief",
    "cards.components": "Components",
    "cards.volDashboard": "Volatility Dashboard",
    "cards.vixTerm": "VIX Term Structure",
    "cards.breadthScore": "Breadth Proxy Score",
    "cards.unavailableBreadth": "Unavailable Constituent Breadth",
    "cards.spProxy": "S&P 500 Proxy",
    "cards.nasdaqProxy": "Nasdaq Proxy",
    "cards.sectorHeatmap": "Sector Heatmap",
    "cards.macroDashboard": "Macro Dashboard",
    "cards.macroRisk": "Macro Risk Detection",
    "cards.finStress": "Financial Stress Score",
    "cards.creditData": "Credit Data",
    "cards.econCalendar": "Economic Calendar",
    "cards.earningsCalendar": "Earnings Calendar",
    "cards.opportunityScanner": "Opportunity Scanner",
    "cards.positionCalculator": "Position Risk Calculator",
    "cards.portfolioRisk": "Portfolio Risk",
    "cards.historicalBacktest": "Historical Backtest",
    "cards.aiAnalyst": "AI Market Analyst",
    "cards.dataSources": "Data Sources",
    "cards.envVars": "Environment Variables",
    "label.riskLevel": "Risk Level",
    "label.weights": "Weights",
    "label.account": "Account",
    "label.riskPct": "Risk %",
    "label.entry": "Entry",
    "label.stop": "Stop",
    "label.maxRisk": "Maximum Risk",
    "label.riskShare": "Risk per Share",
    "label.position": "Position",
    "label.positionValue": "Position Value",
    "label.exposure": "Exposure",
    "msg.noShock": "No shock detected",
    "msg.dataSourceUnavailable": "Data source unavailable",
    "msg.analyticalLevels": "Analytical levels only, not guaranteed predictions.",
    "msg.requiresCredit": "Requires credit and MOVE data",
    "msg.portfolioPhase": "MVP supports manual position calculator. Portfolio beta, VaR, correlation, and concentration need portfolio import and historical return matrix in Phase 2/3.",
    "msg.backtestPhase": "Backtest engine is reserved for Phase 3. Signals will require stored historical indicator series and forward return calculations. No signal validity is assumed before backtesting.",
    "msg.envHelp": "See .env.example for MARKET_DATA_API_KEY, NEWS_API_KEY, EARNINGS_API_KEY, OPTIONS_API_KEY, OPENAI_API_KEY.",
    "msg.sources": "Market data: Yahoo Finance chart. Put/Call: Cboe CSV.",
    "trend.up": "up",
    "trend.down": "down",
    "trend.flat": "flat"
  },
  zh: {
    "brand.subtitle": "市场智能",
    "app.title": "美股市场智能仪表盘",
    "app.subtitle": "市场数据 -> 市场状态 -> 风险分析 -> 机会扫描 -> 每日简报",
    "nav.dashboard": "首页",
    "nav.regime": "市场状态",
    "nav.volatility": "波动率",
    "nav.breadth": "市场广度",
    "nav.sectors": "板块轮动",
    "nav.macro": "宏观",
    "nav.credit": "信用风险",
    "nav.events": "事件日历",
    "nav.earnings": "财报",
    "nav.scanner": "股票扫描",
    "nav.portfolio": "组合风险",
    "nav.backtest": "历史回测",
    "nav.ai": "AI 分析",
    "nav.settings": "设置",
    "actions.refresh": "刷新",
    "status.updated": "更新时间",
    "status.loading": "正在加载市场数据...",
    "status.unavailable": "数据不可用",
    "table.metric": "指标",
    "table.value": "数值",
    "table.trend": "趋势",
    "table.percentile": "百分位",
    "table.freshness": "新鲜度",
    "table.symbol": "股票",
    "table.setup": "形态",
    "table.price": "价格",
    "table.score": "分数",
    "table.type": "类型",
    "table.entryZone": "观察区间",
    "table.invalidation": "失效位",
    "table.target": "潜在目标",
    "cards.marketScore": "市场分数",
    "cards.volatility": "波动率",
    "cards.breadthProxy": "广度代理",
    "cards.macro": "宏观",
    "cards.marketRegime": "市场状态",
    "cards.topScanner": "热门股票扫描",
    "cards.sectorRotation": "板块轮动",
    "cards.aiBrief": "AI 市场简报",
    "cards.components": "分项分数",
    "cards.volDashboard": "波动率面板",
    "cards.vixTerm": "VIX 期限结构",
    "cards.breadthScore": "广度代理分数",
    "cards.unavailableBreadth": "成分股广度不可用",
    "cards.spProxy": "标普 500 代理",
    "cards.nasdaqProxy": "纳指代理",
    "cards.sectorHeatmap": "板块热力图",
    "cards.macroDashboard": "宏观面板",
    "cards.macroRisk": "宏观风险检测",
    "cards.finStress": "金融压力分数",
    "cards.creditData": "信用数据",
    "cards.econCalendar": "经济日历",
    "cards.earningsCalendar": "财报日历",
    "cards.opportunityScanner": "机会扫描器",
    "cards.positionCalculator": "仓位风险计算器",
    "cards.portfolioRisk": "组合风险",
    "cards.historicalBacktest": "历史回测",
    "cards.aiAnalyst": "AI 市场分析",
    "cards.dataSources": "数据源",
    "cards.envVars": "环境变量",
    "label.riskLevel": "风险等级",
    "label.weights": "权重",
    "label.account": "账户资金",
    "label.riskPct": "风险 %",
    "label.entry": "入场价",
    "label.stop": "止损价",
    "label.maxRisk": "最大风险",
    "label.riskShare": "每股风险",
    "label.position": "仓位",
    "label.positionValue": "仓位金额",
    "label.exposure": "账户暴露",
    "msg.noShock": "未检测到冲击",
    "msg.dataSourceUnavailable": "数据源不可用",
    "msg.analyticalLevels": "这些只是分析区间，不是确定性预测。",
    "msg.requiresCredit": "需要信用利差和 MOVE 数据",
    "msg.portfolioPhase": "MVP 目前支持手动仓位计算。组合 beta、VaR、相关性和集中度需要在 Phase 2/3 接入持仓和历史收益矩阵。",
    "msg.backtestPhase": "回测引擎预留在 Phase 3。信号需要历史指标序列和未来收益计算；在回测前不假设任何信号有效。",
    "msg.envHelp": "参见 .env.example：MARKET_DATA_API_KEY、NEWS_API_KEY、EARNINGS_API_KEY、OPTIONS_API_KEY、OPENAI_API_KEY。",
    "msg.sources": "市场数据：Yahoo Finance chart。Put/Call：Cboe CSV。",
    "trend.up": "上升",
    "trend.down": "下降",
    "trend.flat": "持平"
  }
};

const VALUE_TRANSLATIONS = {
  zh: {
    "US Market Open": "美股开盘",
    "US Market Closed": "美股休市",
    "Delayed / best-effort": "延迟 / 尽力获取",
    "Near real-time": "近实时",
    "Delayed": "延迟",
    "Stale": "过期",
    "Data unavailable": "数据不可用",
    "Risk-On / Trend": "Risk-On / 趋势",
    "Risk-On / Choppy": "Risk-On / 震荡",
    "Neutral": "中性",
    "Transition": "转换期",
    "Risk-Off": "Risk-Off",
    "Volatility Expansion": "波动率扩张",
    "Panic": "恐慌",
    "Volatility Compression": "波动率压缩",
    "Low-Medium": "低-中",
    "Medium": "中等",
    "Elevated": "偏高",
    "High": "高",
    "Strong Setup": "强形态",
    "Moderate Setup": "中等形态",
    "Weak Setup": "弱形态",
    "Watch": "观察",
    "Avoid": "回避",
    "Momentum": "动量",
    "Breakout": "突破",
    "Pullback": "回踩",
    "Oversold": "超卖",
    "Relative Strength": "相对强度",
    "Normal": "正常",
    "Flat": "趋平",
    "Inverted": "倒挂",
    "Mixed": "混合",
    "Unavailable": "不可用",
    "Growth rotation": "成长板块轮动",
    "Defensive rotation": "防御板块轮动",
    "Cyclical rotation": "周期板块轮动",
    "Risk-off rotation": "避险轮动",
    "Rate Sensitive rotation": "利率敏感板块轮动",
    "What happened": "今日概况",
    "Volatility": "波动率",
    "Breadth": "市场广度",
    "Sector rotation": "板块轮动",
    "Macro": "宏观",
    "Main risks": "主要风险",
    "Top setups": "重点形态",
    "Tomorrow": "明日关注",
    "Normal term structure": "正常期限结构",
    "VIX curve is flat": "VIX 曲线趋平",
    "Mixed term structure": "期限结构混合",
    "VIX term structure data unavailable": "VIX 期限结构数据不可用",
    "Short-term volatility stress detected": "检测到短端波动率压力",
    "VIX curve inversion detected": "检测到 VIX 曲线倒挂",
    "No yield or dollar shock detected by MVP thresholds.": "MVP 阈值未检测到收益率或美元冲击。",
    "No high-severity cross-asset risk alert from available data.": "基于可用数据，未检测到高严重度跨资产风险警报。",
    "Scanner data unavailable.": "扫描器数据不可用。"
  }
};

function t(key) {
  return (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key;
}

function tv(value) {
  if (value == null) return value;
  return (VALUE_TRANSLATIONS[state.lang] && VALUE_TRANSLATIONS[state.lang][value]) || value;
}

function localizeText(text) {
  if (!text || state.lang === "en") return text;
  let output = text;
  Object.entries(VALUE_TRANSLATIONS.zh).forEach(([en, zh]) => {
    output = output.split(en).join(zh);
  });
  output = output
    .replace("This is an analytical brief, not a prediction or investment advice.", "这是分析简报，不是预测或投资建议。")
    .replace("Generated only from current dashboard data. No unavailable field is inferred.", "仅基于当前仪表盘数据生成，不推断不可用字段。")
    .replace("Constituent breadth unavailable; ETF proxy only.", "成分股广度不可用；当前仅使用 ETF 代理。")
    .replace("No unavailable data is simulated. Missing API-backed fields are marked Data source unavailable.", "不会模拟不可用数据。缺少 API 的字段会标记为数据源不可用。")
    .replace("Market data: Yahoo Finance chart. Put/Call: Cboe CSV.", "市场数据：Yahoo Finance chart。Put/Call：Cboe CSV。")
    .replace("Exact index contribution requires index weights. MVP reports directional Mag7 participation only.", "精确指数贡献需要指数权重。MVP 仅报告 Mag7 的方向性参与度。")
    .replace("Analytical levels only, not guaranteed predictions.", "这些只是分析区间，不是确定性预测。")
    .replace("Data source unavailable", "数据源不可用")
    .replace("Requires credit and MOVE data", "需要信用利差和 MOVE 数据")
    .replace("Risk", "风险")
    .replace("Current regime is", "当前市场状态为")
    .replace("with Market Score", "，市场分数")
    .replace("Volatility score is", "波动率分数")
    .replace("Breadth proxy score", "广度代理分数")
    .replace("over 5D", "过去 5 日")
    .replace("Watch volatility direction, DXY/10Y pressure, QQQ trend vs 20DMA, and upcoming data events if a calendar API is connected.", "关注波动率方向、DXY/10Y 压力、QQQ 相对 20 日均线趋势；若接入日历 API，也要关注即将公布的数据事件。");
  return output;
}

function applyStaticI18n() {
  document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  langButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === state.lang);
  });
}

function cls(value) {
  if (value == null) return "muted";
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

function fmt(value, digits = 2, suffix = "") {
  if (value == null || Number.isNaN(value)) return state.lang === "zh" ? "不可用" : "N/A";
  return `${Number(value).toFixed(digits)}${suffix}`;
}

function pct(value) {
  return `<span class="${cls(value)}">${fmt(value, 2, "%")}</span>`;
}

function scoreColor(score) {
  if (score == null) return "var(--muted)";
  if (score >= 70) return "var(--green)";
  if (score >= 55) return "var(--yellow)";
  if (score >= 40) return "var(--orange)";
  return "var(--red)";
}

function card(title, body) {
  return `<section class="panel"><h2>${title}</h2>${body}</section>`;
}

function scoreCard(title, score, subtitle = "") {
  return card(title, `
    <div class="score-card">
      <div class="big-score" style="color:${scoreColor(score)}">${score == null ? fmt(null) : score}</div>
      <div class="meter"><div class="meter-fill" style="width:${Math.max(0, Math.min(100, score || 0))}%"></div></div>
      <p>${localizeText(subtitle)}</p>
    </div>
  `);
}

function metricTable(items, columns = "standard") {
  const heads = columns === "setup"
    ? [t("table.symbol"), t("table.setup"), t("table.price"), "1D", "5D", "20DMA", "50DMA", t("table.score")]
    : [t("table.metric"), t("table.value"), "1D", "5D", t("table.trend"), t("table.percentile"), t("table.freshness")];
  const rows = items.map((item) => {
    if (columns === "setup") {
      return `<tr>
        <td>${item.symbol}</td>
        <td>${tv(item.setupLabel)}</td>
        <td>${fmt(item.price, 2)}</td>
        <td>${pct(item.dailyPct)}</td>
        <td>${pct(item.weeklyPct)}</td>
        <td>${pct(item.distance20Pct)}</td>
        <td>${pct(item.distance50Pct)}</td>
        <td>${fmt(item.setupScore, 1)}</td>
      </tr>`;
    }
    return `<tr>
      <td>${item.label || item.symbol}</td>
      <td>${item.value == null ? fmt(null) : fmt(item.value, item.unit === "%" ? 3 : 2, item.unit || "")}</td>
      <td>${pct(item.changePct)}</td>
      <td>${pct(item.weekChangePct)}</td>
      <td>${item.trend ? t(`trend.${item.trend}`) : fmt(null)}</td>
      <td>${fmt(item.percentile, 1, "%")}</td>
      <td>${item.freshness ? tv(item.freshness.status) : fmt(null)}</td>
    </tr>`;
  }).join("");
  return `<table class="table"><thead><tr>${heads.map((head) => `<th>${head}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`;
}

function renderChrome(data) {
  document.getElementById("market-status").textContent = tv(data.marketStatus.label);
  document.getElementById("data-delay").textContent = tv(data.dataStatus.delay);
  document.getElementById("updated-at").textContent = `${t("status.updated")} ${new Date(data.generatedAt).toLocaleString()}`;
  const alerts = data.alerts || [];
  document.getElementById("alerts").innerHTML = alerts.length
    ? alerts.map((alert) => `<div class="alert">ALERT: ${localizeText(alert.message)}</div>`).join("")
    : "";
}

function renderDashboard(data) {
  const r = data.regime;
  return `
    <div class="grid cols-4">
      ${scoreCard(t("cards.marketScore"), r.marketScore, `${tv(r.regime)} / ${t("label.riskLevel")} ${tv(r.riskLevel)}`)}
      ${scoreCard(t("cards.volatility"), data.volatility.score, data.volatility.termStructure.message)}
      ${scoreCard(t("cards.breadthProxy"), data.breadth.score, data.breadth.limitation)}
      ${scoreCard(t("cards.macro"), data.macro.score, data.macro.alerts.length ? data.macro.alerts[0].message : t("msg.noShock"))}
    </div>
    <div class="grid cols-2" style="margin-top:12px">
      ${card(t("cards.marketRegime"), `
        <div class="regime" style="color:${scoreColor(r.marketScore)}">${tv(r.regime)}</div>
        <p>${t("label.riskLevel")}: ${tv(r.riskLevel)}</p>
        <p>${t("label.weights")}: Vol ${r.weights.volatility * 100}% / Breadth ${r.weights.breadth * 100}% / Momentum ${r.weights.momentum * 100}% / Macro ${r.weights.macro * 100}% / Credit ${r.weights.credit * 100}% / Liquidity ${r.weights.liquidity * 100}%</p>
      `)}
      ${card(t("cards.topScanner"), metricTable(data.scanner.slice(0, 6), "setup"))}
      ${card(t("cards.sectorRotation"), renderHeatmap(data.sectors.items.slice(0, 11)))}
      ${card(t("cards.aiBrief"), renderBrief(data.aiBrief))}
    </div>
  `;
}

function renderRegime(data) {
  const parts = Object.entries(data.regime.parts).map(([key, value]) => `
    <div class="label-row"><span>${key}</span><strong style="color:${scoreColor(value)}">${value == null ? fmt(null) : value}</strong></div>
    <div class="meter"><div class="meter-fill" style="width:${Math.max(0, Math.min(100, value || 0))}%"></div></div>
  `).join("");
  return `<div class="grid cols-2">${scoreCard(t("cards.marketScore"), data.regime.marketScore, tv(data.regime.regime))}${card(t("cards.components"), parts)}</div>`;
}

function renderVolatility(data) {
  return `<div class="grid">${card(t("cards.volDashboard"), metricTable(data.volatility.items))}${card(t("cards.vixTerm"), `
    <div class="regime">${tv(data.volatility.termStructure.state)}</div>
    <p>${localizeText(data.volatility.termStructure.message)}</p>
  `)}</div>`;
}

function renderBreadth(data) {
  return `<div class="grid cols-2">
    ${scoreCard(t("cards.breadthScore"), data.breadth.score, data.breadth.limitation)}
    ${card(t("cards.unavailableBreadth"), `<p>${localizeText(data.breadth.unavailableReason)}</p>`)}
    ${card(t("cards.spProxy"), proxyRows(data.breadth.sp500))}
    ${card(t("cards.nasdaqProxy"), proxyRows(data.breadth.nasdaq))}
  </div>`;
}

function proxyRows(group) {
  return `<table class="table"><tbody>
    <tr><td>Above 20DMA</td><td>${group.above20dma == null ? t("msg.dataSourceUnavailable") : group.above20dma}</td><td>${pct(group.proxyDistance20Pct)}</td></tr>
    <tr><td>Above 50DMA</td><td>${group.above50dma == null ? t("msg.dataSourceUnavailable") : group.above50dma}</td><td>${pct(group.proxyDistance50Pct)}</td></tr>
    <tr><td>Above 200DMA</td><td>${group.above200dma == null ? t("msg.dataSourceUnavailable") : group.above200dma}</td><td>${pct(group.proxyDistance200Pct)}</td></tr>
  </tbody></table>`;
}

function heatColor(value) {
  if (value == null) return "#182229";
  const alpha = Math.min(0.85, Math.abs(value) / 8 + 0.18);
  return value >= 0 ? `rgba(39, 209, 127, ${alpha})` : `rgba(255, 93, 100, ${alpha})`;
}

function renderHeatmap(items) {
  return `<div class="heatmap">${items.map((item) => `
    <div class="heat" style="background:${heatColor(item.relativeStrengthWeekly)}">
      <strong>${item.symbol} ${item.label}</strong>
      <span>1D ${fmt(item.dailyReturn, 2, "%")} / 5D RS ${fmt(item.relativeStrengthWeekly, 2, "%")}</span>
      <span>Momentum ${fmt(item.momentumScore, 1)}</span>
    </div>
  `).join("")}</div>`;
}

function renderSectors(data) {
  return `<div class="grid">${card(`${t("cards.sectorHeatmap")} - ${localizeText(data.sectors.rotation.state)}`, renderHeatmap(data.sectors.items))}</div>`;
}

function renderMacro(data) {
  return `<div class="grid cols-2">${card(t("cards.macroDashboard"), metricTable(data.macro.items))}${card(t("cards.macroRisk"), `
    <p>10Y-2Y Spread: ${fmt(data.macro.spread10y2y, 3, "%")}</p>
    <p>10Y 5D Change: ${fmt(data.macro.yield5dBp, 1, " bp")}</p>
    <p>DXY 5D Change: ${fmt(data.macro.dollar5dPct, 2, "%")}</p>
  `)}</div>`;
}

function renderCredit(data) {
  return `<div class="grid cols-2">${scoreCard(t("cards.finStress"), data.credit.financialStressScore, t("msg.requiresCredit"))}${card(t("cards.creditData"), `<p>${localizeText(data.credit.unavailableReason)}</p>`)}</div>`;
}

function renderEvents(data) {
  return card(t("cards.econCalendar"), `<p>${localizeText(data.events.unavailableReason)}</p>`);
}

function renderEarnings(data) {
  return card(t("cards.earningsCalendar"), `<p>${localizeText(data.earnings.unavailableReason)}</p>`);
}

function renderScanner(data) {
  const detail = data.scanner.map((item) => `
    <tr>
      <td>${item.symbol}</td><td>${tv(item.setupLabel)}</td><td>${tv(item.setupType)}</td><td>${fmt(item.setupScore, 1)}</td>
      <td>${item.levels.entryZone ? `${fmt(item.levels.entryZone[0], 2)}-${fmt(item.levels.entryZone[1], 2)}` : fmt(null)}</td>
      <td>${fmt(item.levels.invalidationLevel, 2)}</td><td>${fmt(item.levels.potentialTarget, 2)}</td><td>${fmt(item.levels.riskReward, 2)}</td>
    </tr>`).join("");
  return card(t("cards.opportunityScanner"), `<table class="table"><thead><tr><th>${t("table.symbol")}</th><th>${t("table.setup")}</th><th>${t("table.type")}</th><th>${t("table.score")}</th><th>${t("table.entryZone")}</th><th>${t("table.invalidation")}</th><th>${t("table.target")}</th><th>R/R</th></tr></thead><tbody>${detail}</tbody></table><p>${t("msg.analyticalLevels")}</p>`);
}

function renderPortfolio() {
  return `<div class="grid cols-2">${card(t("cards.positionCalculator"), `
    <div class="form-grid">
      <label>${t("label.account")}<input id="account" type="number" value="20000"></label>
      <label>${t("label.riskPct")}<input id="risk" type="number" value="1" step="0.1"></label>
      <label>${t("label.entry")}<input id="entry" type="number" value="180"></label>
      <label>${t("label.stop")}<input id="stop" type="number" value="170"></label>
    </div>
    <div id="position-result" class="empty"></div>
  `)}${card(t("cards.portfolioRisk"), `<p>${t("msg.portfolioPhase")}</p>`)}</div>`;
}

function renderBacktest() {
  return card(t("cards.historicalBacktest"), `<p>${t("msg.backtestPhase")}</p>`);
}

function renderBrief(brief) {
  return `<div class="brief">${brief.sections.map((section) => `<div class="brief-item"><strong>${localizeText(section.label)}</strong><span>${localizeText(section.text)}</span></div>`).join("")}<p>${localizeText(brief.disclaimer)}</p></div>`;
}

function renderAI(data) {
  return card(t("cards.aiAnalyst"), renderBrief(data.aiBrief));
}

function renderSettings(data) {
  return `<div class="grid cols-2">
    ${card(t("cards.dataSources"), `<p>${localizeText(data.dataStatus.sourcePolicy)}</p><p>${t("msg.sources")}</p>`)}
    ${card(t("cards.envVars"), `<p>${t("msg.envHelp")}</p>`)}
  </div>`;
}

const renderers = {
  dashboard: renderDashboard,
  regime: renderRegime,
  volatility: renderVolatility,
  breadth: renderBreadth,
  sectors: renderSectors,
  macro: renderMacro,
  credit: renderCredit,
  events: renderEvents,
  earnings: renderEarnings,
  scanner: renderScanner,
  portfolio: renderPortfolio,
  backtest: renderBacktest,
  ai: renderAI,
  settings: renderSettings
};

function updatePositionCalculator() {
  const account = Number(document.getElementById("account") && document.getElementById("account").value);
  const risk = Number(document.getElementById("risk") && document.getElementById("risk").value);
  const entry = Number(document.getElementById("entry") && document.getElementById("entry").value);
  const stop = Number(document.getElementById("stop") && document.getElementById("stop").value);
  const node = document.getElementById("position-result");
  if (!node) return;
  const maxRisk = account * (risk / 100);
  const riskPerShare = entry - stop;
  const shares = riskPerShare > 0 ? Math.floor(maxRisk / riskPerShare) : 0;
  const value = shares * entry;
  node.innerHTML = `${t("label.maxRisk")}: $${fmt(maxRisk, 2)} / ${t("label.riskShare")}: $${fmt(riskPerShare, 2)} / ${t("label.position")}: ${shares} shares / ${t("label.positionValue")}: $${fmt(value, 2)} / ${t("label.exposure")}: ${fmt((value / account) * 100, 2, "%")}`;
}

function render() {
  applyStaticI18n();
  if (!state.data) {
    pageNode.innerHTML = `<div class="panel empty">${t("status.loading")}</div>`;
    return;
  }
  renderChrome(state.data);
  pageNode.innerHTML = renderers[state.page](state.data);
  pageNode.querySelectorAll("input").forEach((input) => input.addEventListener("input", updatePositionCalculator));
  updatePositionCalculator();
}

async function load(force = false) {
  refreshButton.disabled = true;
  try {
    const response = await fetch(`/api/dashboard${force ? "?force=1" : ""}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.data = await response.json();
  } catch (error) {
    pageNode.innerHTML = `<div class="panel empty">${t("status.unavailable")}: ${error.message}</div>`;
  } finally {
    refreshButton.disabled = false;
    render();
  }
}

navNode.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-page]");
  if (!button) return;
  state.page = button.dataset.page;
  navNode.querySelectorAll("button").forEach((node) => node.classList.toggle("active", node === button));
  render();
});

langButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.lang = button.dataset.lang;
    localStorage.setItem("market-dashboard-lang", state.lang);
    render();
  });
});

refreshButton.addEventListener("click", () => load(true));
applyStaticI18n();
load();
setInterval(load, 5 * 60 * 1000);
