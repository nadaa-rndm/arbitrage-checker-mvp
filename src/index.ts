import { PolymarketClient } from './clients/polymarket.js';
import { KalshiClient } from './clients/kalshi.js';
import { MarketMatcher } from './services/marketMatcher.js';
import { ArbitrageDetector } from './services/arbitrageDetector.js';
import { Display } from './cli/display.js';
import { config } from './config.js';
import { Market } from './types.js';
import { getDemoPolymarketMarkets, getDemoKalshiMarkets } from './data/demoData.js';

class ArbitrageChecker {
  private polymarket: PolymarketClient;
  private kalshi: KalshiClient;
  private matcher: MarketMatcher;
  private detector: ArbitrageDetector;
  private display: Display;
  private isRunning = false;
  private demoMode: boolean;

  constructor(demoMode = false) {
    this.demoMode = demoMode;
    this.polymarket = new PolymarketClient();
    this.kalshi = new KalshiClient();
    this.matcher = new MarketMatcher();
    this.detector = new ArbitrageDetector(config.minArbitragePercent);
    this.display = new Display();
  }

  async run(): Promise<void> {
    this.isRunning = true;

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\nShutting down...');
      this.isRunning = false;
      process.exit(0);
    });

    while (this.isRunning) {
      await this.checkArbitrage();

      // Wait for next refresh
      await this.sleep(config.refreshInterval);
    }
  }

  async checkArbitrage(): Promise<void> {
    this.display.showHeader();

    if (this.demoMode) {
      this.display.showInfo('Running in DEMO mode with simulated market data\n');
    } else {
      this.display.showLoading();
    }

    try {
      let polymarketMarkets: Market[];
      let kalshiMarkets: Market[];

      if (this.demoMode) {
        // Use demo data
        polymarketMarkets = getDemoPolymarketMarkets();
        kalshiMarkets = getDemoKalshiMarkets();
      } else {
        // Fetch from real APIs
        [polymarketMarkets, kalshiMarkets] = await Promise.all([
          this.fetchPolymarketMarkets(),
          this.fetchKalshiMarkets(),
        ]);

        // Fall back to demo data if APIs return empty
        if (polymarketMarkets.length === 0 && kalshiMarkets.length === 0) {
          this.display.showInfo('APIs unavailable. Falling back to demo data...\n');
          polymarketMarkets = getDemoPolymarketMarkets();
          kalshiMarkets = getDemoKalshiMarkets();
        }
      }

      // Match markets across platforms
      const normalizedMarkets = this.matcher.matchMarkets(polymarketMarkets, kalshiMarkets);

      // Display summary
      this.display.showMarketSummary(
        polymarketMarkets.length,
        kalshiMarkets.length,
        normalizedMarkets.length
      );

      // Detect arbitrage opportunities
      const opportunities = this.detector.detectOpportunities(normalizedMarkets);

      // Display opportunities
      this.display.showOpportunities(opportunities);

      // Show price comparison
      if (opportunities.length === 0) {
        this.display.showPriceComparison([...polymarketMarkets, ...kalshiMarkets]);
      }

      this.display.showFooter();
    } catch (error) {
      this.display.showError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  private async fetchPolymarketMarkets(): Promise<Market[]> {
    try {
      // Get general markets and asset-specific markets
      const [general, assetSpecific] = await Promise.all([
        this.polymarket.getMarkets(),
        this.polymarket.getAssetMarkets(),
      ]);

      // Merge and dedupe
      const allMarkets = [...general];
      for (const market of assetSpecific) {
        if (!allMarkets.find(m => m.id === market.id)) {
          allMarkets.push(market);
        }
      }

      return allMarkets;
    } catch (error) {
      console.error('Error fetching Polymarket markets');
      return [];
    }
  }

  private async fetchKalshiMarkets(): Promise<Market[]> {
    try {
      const [markets, assetSpecific] = await Promise.all([
        this.kalshi.getMarkets(),
        this.kalshi.getAssetMarkets(),
      ]);

      const allMarkets = [...markets];
      for (const market of assetSpecific) {
        if (!allMarkets.find(m => m.id === market.id)) {
          allMarkets.push(market);
        }
      }

      return allMarkets;
    } catch (error) {
      console.error('Error fetching Kalshi markets');
      return [];
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Print usage help
function printHelp(): void {
  console.log(`
Polymarket <-> Kalshi Arbitrage Checker

Usage:
  npm start              Run in continuous monitoring mode
  npm start -- --once    Run once and exit
  npm start -- --demo    Run with demo data (no API calls)
  npm start -- --help    Show this help message

Options:
  -o, --once    Run a single check and exit
  -d, --demo    Use demo data instead of live APIs
  -h, --help    Show help
`);
}

// Main entry point
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

const demoMode = args.includes('--demo') || args.includes('-d');
const checker = new ArbitrageChecker(demoMode);

if (args.includes('--once') || args.includes('-o')) {
  // Single run mode
  checker.checkArbitrage().catch(console.error);
} else {
  // Continuous monitoring mode
  checker.run().catch(console.error);
}
