# Polymarket ↔ Kalshi Arbitrage Checker MVP

Real-time arbitrage opportunity detection between Polymarket and Kalshi prediction markets.

## Features

- **Real-time monitoring** - Continuously fetches market data from both platforms
- **Asset tracking** - Monitors crypto (BTC, ETH, SOL), stocks (SPY, TSLA, AAPL, GOOGL, NVDA), and Gold
- **Arbitrage detection** - Identifies price discrepancies and cross-platform arbitrage opportunities
- **Smart matching** - Matches similar markets across platforms using NLP-based parsing
- **CLI dashboard** - Beautiful terminal interface showing opportunities

## Tracked Assets

| Category | Assets | Timeframes |
|----------|--------|------------|
| Crypto | BTC, ETH, SOL | Hourly, Daily |
| Stocks | SPY, TSLA, AAPL, GOOGL, NVDA | Daily |
| Commodities | Gold | Daily |

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Build the project
npm run build
```

## Usage

```bash
# Run in continuous monitoring mode
npm start

# Run once and exit
npm start -- --once

# Development mode with hot reload
npm run dev
```

## Configuration

Edit `.env` to customize:

```env
# Minimum spread to display (percentage)
MIN_ARBITRAGE_PERCENT=1.0

# Refresh interval (seconds)
REFRESH_INTERVAL=30

# Kalshi API credentials (optional - public markets work without auth)
KALSHI_API_KEY=
KALSHI_API_SECRET=
```

## How It Works

### Arbitrage Detection

The checker identifies three types of opportunities:

1. **Cross-platform arbitrage**: Buy YES on one platform + NO on another when combined cost < $1
2. **Price discrepancy**: Same outcome priced differently across platforms
3. **Matched market arbitrage**: Similar markets with different probabilities

### Market Matching

Markets are matched using:
- Asset detection (BTC, ETH, etc.)
- Price condition parsing ("above $100k", "below $50k")
- End date alignment
- Title similarity scoring

## Example Output

```
╔═══════════════════════════════════════════════════════════════════╗
║        POLYMARKET ↔ KALSHI ARBITRAGE CHECKER                      ║
╚═══════════════════════════════════════════════════════════════════╝

🎯 Found 2 Arbitrage Opportunities:

Asset: BTC  [HIGH CONFIDENCE]
Spread: 3.50% | Potential Profit: 3.63%
Strategy: Buy YES on polymarket, Buy NO on kalshi

┌────────────┬────────────────────────┬────────┬─────────┐
│ Platform   │ Market                 │ Side   │ Price   │
├────────────┼────────────────────────┼────────┼─────────┤
│ polymarket │ BTC above $100k by EOD │ YES    │ 45.0%   │
│ kalshi     │ Bitcoin > $100,000     │ NO     │ 51.5%   │
└────────────┴────────────────────────┴────────┴─────────┘
```

## Disclaimer

This tool is for informational purposes only. Always verify opportunities manually before trading. Prediction market trading involves risk. The authors are not responsible for any financial losses.

## License

MIT
