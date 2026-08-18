# US Market Intelligence Dashboard

Professional US market dashboard for regime classification, risk analysis, sector rotation, setup scanning, and a rules-based daily market brief.

This tool is an analytical decision-support dashboard. It does not predict stock prices and does not provide investment advice.

## Tech Stack

- Frontend: vanilla HTML/CSS/JavaScript SPA in `frontend/`
- Backend: Node.js HTTP server in `server.js`
- Serverless API: Vercel-compatible functions in `api/`
- Indicators: modular CommonJS calculators in `indicators/`
- Scanner: `scanner/setupScanner.js`
- AI brief: rules-based data-only summary in `ai/dailySummary.js`
- Config: all score weights and thresholds in `config/marketConfig.js`
- Dependencies: none for MVP

## Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:4173
```

## Project Structure

```text
/frontend      UI shell and views
/backend       market service and data source adapters
/data          reserved for cached or imported datasets
/indicators    market score, volatility, macro, breadth, sector, regime logic
/scanner       opportunity scanner and setup scoring
/backtest      reserved for historical signal tests
/ai            dashboard-data-only market brief
/config        centralized weights, thresholds, symbols, unavailable-source notes
/api           Vercel serverless functions
```

## Data Sources

Current MVP:

- Yahoo Finance chart endpoint: SPY, QQQ, IWM, VIX, VXN, VVIX, VIX9D, VIX3M, VIX6M, 10Y proxy, DXY, Gold, WTI, Copper, sector ETFs, Mag7, scanner tickers.
- Cboe CSV: Total Put/Call Ratio.

Unavailable in MVP unless API keys are added:

- Constituent-level breadth
- Economic calendar
- Earnings estimates and historical reaction
- Options chain implied volatility / expected move
- HY and IG credit spreads
- MOVE Index

Unavailable data is displayed as `Data source unavailable`. The app does not fill missing data with simulated values.

## Environment Variables

Copy `.env.example` when you add paid or authenticated providers.

```text
MARKET_DATA_API_KEY=
NEWS_API_KEY=
EARNINGS_API_KEY=
OPTIONS_API_KEY=
ECONOMIC_CALENDAR_API_KEY=
CREDIT_DATA_API_KEY=
OPENAI_API_KEY=
```

No API key is required for the current MVP data sources.

## Market Score Formula

Weights are centralized in `config/marketConfig.js`:

```text
Volatility 20%
Breadth    20%
Momentum   20%
Macro      15%
Credit     15%
Liquidity  10%
```

`Market Score = weighted average of available component scores`.

If a component is unavailable, its weight is excluded from the denominator instead of being treated as zero. This avoids punishing the score for missing data.

## Component Definitions

Volatility Score:

- Uses VIX, VXN, VVIX, VIX9D level, 1D change, 5D change, and VIX term structure.
- Detects `VIX9D > VIX > VIX3M` as short-term volatility stress.
- High volatility and volatility expansion reduce the score.

Momentum Score:

- Uses SPY, QQQ, IWM daily return, weekly return, and distance from 20/50/200DMA.

Breadth Score:

- MVP uses an ETF proxy from SPY/QQQ/IWM distance from moving averages.
- True S&P/Nasdaq constituent breadth is marked unavailable until a constituent data provider is connected.

Macro Score:

- Uses 10Y, DXY, Gold, Copper, and short-term changes.
- Detects yield pressure and USD liquidity pressure.

Credit Score:

- Marked unavailable in MVP.
- Future source should include HY spreads, IG spreads, and MOVE.

Liquidity/Risk Score:

- Uses Put/Call Ratio, DXY pressure, and volatility score.

## Regime Classification

Supported states:

- Risk-On / Trend
- Risk-On / Choppy
- Neutral
- Transition
- Risk-Off
- Volatility Expansion
- Panic
- Volatility Compression

The classifier uses Market Score, QQQ momentum, volatility trend, VIX/VXN panic thresholds, and liquidity pressure.

## Opportunity Scanner

Default universe:

```text
GOOGL, GOOG, ORCL, RKLB, AI, NVDA, AMD, PLTR, MSFT, META, TSLA, AAPL, AMZN, QQQ, SPY, IWM
```

Setup Score components:

```text
Trend Score
Momentum Score
Relative Strength
Volume Score
Volatility Score
Market Regime Compatibility
Event Risk
```

Labels:

- Strong Setup
- Moderate Setup
- Watch
- Weak Setup
- Avoid

The scanner also provides analytical entry zone, invalidation level, potential target, and risk/reward. These are analytical levels, not guaranteed predictions.

## Backtest Usage

Backtest is planned for Phase 3. The intended interface:

```text
Signal:
VIX > 25
VXN > 30
QQQ < 50DMA
Breadth < 40%

Outputs:
Next 1D Return
Next 5D Return
Next 20D Return
Win Rate
Average Return
Maximum Drawdown
Sample Size
```

Implementation plan:

1. Store daily historical indicator snapshots in `/data`.
2. Evaluate signal rules on each historical date.
3. Join with SPY/QQQ forward returns.
4. Report sample size, win rate, average return, and drawdown.
5. Never assume a signal works until the backtest shows evidence.

## Deployment

Vercel:

- Root page rewrites to `frontend/index.html`
- `/api/dashboard` returns full MVP dashboard data
- `/api/market` remains as compatibility endpoint

Push changes to GitHub, then Vercel will redeploy automatically if the project is connected to the repository.

## Future Extensions

- Add Polygon/Finnhub/FMP for constituent breadth, earnings, and options chains.
- Add FRED/BofA/ICE-compatible source for credit spreads and MOVE.
- Add economic calendar provider.
- Add portfolio import, beta, VaR, concentration, and correlation matrix.
- Add persistent historical snapshots and backtest engine.
- Add OpenAI-backed analyst mode that only summarizes supplied dashboard data.
