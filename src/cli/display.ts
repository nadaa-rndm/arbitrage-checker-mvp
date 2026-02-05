import chalk from 'chalk';
import Table from 'cli-table3';
import { ArbitrageOpportunity, Market, TRACKED_ASSETS } from '../types.js';

export class Display {
  showHeader(): void {
    console.clear();
    console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════╗
║        POLYMARKET ↔ KALSHI ARBITRAGE CHECKER                      ║
║        Real-time prediction market opportunities                   ║
╚═══════════════════════════════════════════════════════════════════╝
`));
    console.log(chalk.gray(`Tracking: ${TRACKED_ASSETS.map(a => a.symbol).join(', ')}`));
    console.log(chalk.gray(`Last updated: ${new Date().toLocaleTimeString()}\n`));
  }

  showLoading(): void {
    console.log(chalk.yellow('⏳ Fetching market data from Polymarket and Kalshi...\n'));
  }

  showMarketSummary(polymarketCount: number, kalshiCount: number, matchedCount: number): void {
    const table = new Table({
      head: [chalk.white.bold('Platform'), chalk.white.bold('Markets Found')],
      style: { head: [], border: [] },
    });

    table.push(
      [chalk.blue('Polymarket'), polymarketCount.toString()],
      [chalk.green('Kalshi'), kalshiCount.toString()],
      [chalk.yellow('Matched Markets'), matchedCount.toString()]
    );

    console.log(table.toString());
    console.log();
  }

  showOpportunities(opportunities: ArbitrageOpportunity[]): void {
    if (opportunities.length === 0) {
      console.log(chalk.gray('No arbitrage opportunities found above threshold.\n'));
      console.log(chalk.gray('Tips:'));
      console.log(chalk.gray('  • Lower MIN_ARBITRAGE_PERCENT in .env to see smaller spreads'));
      console.log(chalk.gray('  • Markets may be efficiently priced right now'));
      console.log(chalk.gray('  • Check back during high volatility periods\n'));
      return;
    }

    console.log(chalk.green.bold(`\n🎯 Found ${opportunities.length} Arbitrage Opportunities:\n`));

    for (const op of opportunities) {
      this.showOpportunity(op);
    }
  }

  private showOpportunity(op: ArbitrageOpportunity): void {
    const confidenceColor =
      op.confidence === 'high' ? chalk.green :
      op.confidence === 'medium' ? chalk.yellow :
      chalk.red;

    const spreadColor =
      op.spread >= 5 ? chalk.green.bold :
      op.spread >= 2 ? chalk.yellow :
      chalk.white;

    console.log(chalk.cyan('─'.repeat(70)));
    console.log(chalk.white.bold(`Asset: ${op.asset}`) + '  ' + confidenceColor(`[${op.confidence.toUpperCase()} CONFIDENCE]`));
    console.log(spreadColor(`Spread: ${op.spread.toFixed(2)}%`) + chalk.gray(` | Potential Profit: ${op.potentialProfit.toFixed(2)}%`));
    console.log(chalk.gray(`Strategy: ${op.description}`));

    if (op.expiresAt) {
      const hoursLeft = (op.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
      console.log(chalk.gray(`Expires: ${op.expiresAt.toLocaleString()} (${hoursLeft.toFixed(1)} hours)`));
    }

    console.log();

    const table = new Table({
      head: [
        chalk.white.bold('Platform'),
        chalk.white.bold('Market'),
        chalk.white.bold('Side'),
        chalk.white.bold('Price'),
        chalk.white.bold('Link'),
      ],
      style: { head: [], border: [] },
      colWidths: [12, 30, 8, 10, 35],
      wordWrap: true,
    });

    for (const m of op.markets) {
      const platformColor = m.platform === 'polymarket' ? chalk.blue : chalk.green;
      table.push([
        platformColor(m.platform),
        m.market.title.slice(0, 28),
        m.side.toUpperCase(),
        `${(m.outcome.price * 100).toFixed(1)}%`,
        chalk.gray(m.market.url.slice(0, 33)),
      ]);
    }

    console.log(table.toString());
    console.log();
  }

  showPriceComparison(markets: Market[]): void {
    const byAsset = new Map<string, Market[]>();

    for (const market of markets) {
      if (!market.asset) continue;
      const existing = byAsset.get(market.asset) || [];
      existing.push(market);
      byAsset.set(market.asset, existing);
    }

    console.log(chalk.cyan.bold('\n📊 Price Comparison by Asset:\n'));

    for (const [asset, assetMarkets] of byAsset) {
      const polyMarkets = assetMarkets.filter(m => m.platform === 'polymarket');
      const kalshiMarkets = assetMarkets.filter(m => m.platform === 'kalshi');

      if (polyMarkets.length === 0 || kalshiMarkets.length === 0) continue;

      console.log(chalk.white.bold(`\n${asset}:`));

      const table = new Table({
        head: [
          chalk.white.bold('Market'),
          chalk.blue.bold('Polymarket'),
          chalk.green.bold('Kalshi'),
          chalk.yellow.bold('Diff'),
        ],
        style: { head: [], border: [] },
        colWidths: [35, 15, 15, 10],
        wordWrap: true,
      });

      // Simple comparison - show first few markets
      const comparisons = Math.min(3, polyMarkets.length, kalshiMarkets.length);
      for (let i = 0; i < comparisons; i++) {
        const pm = polyMarkets[i];
        const km = kalshiMarkets[i];
        const pmYes = pm.outcomes.find(o => o.name.toLowerCase() === 'yes');
        const kmYes = km.outcomes.find(o => o.name.toLowerCase() === 'yes');

        if (pmYes && kmYes) {
          const diff = Math.abs(pmYes.price - kmYes.price) * 100;
          const diffColor = diff >= 2 ? chalk.green : chalk.gray;

          table.push([
            pm.title.slice(0, 33),
            `${(pmYes.price * 100).toFixed(1)}%`,
            `${(kmYes.price * 100).toFixed(1)}%`,
            diffColor(`${diff.toFixed(1)}%`),
          ]);
        }
      }

      console.log(table.toString());
    }
  }

  showError(message: string): void {
    console.log(chalk.red.bold(`\n❌ Error: ${message}\n`));
  }

  showInfo(message: string): void {
    console.log(chalk.gray(`ℹ️  ${message}`));
  }

  showFooter(): void {
    console.log(chalk.gray('\n─'.repeat(70)));
    console.log(chalk.gray('Press Ctrl+C to exit | Data refreshes automatically'));
    console.log(chalk.gray('Note: Always verify opportunities manually before trading'));
    console.log(chalk.gray('─'.repeat(70) + '\n'));
  }
}
