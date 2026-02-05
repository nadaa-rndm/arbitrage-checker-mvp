import { Market, ArbitrageOpportunity, NormalizedMarket, Platform } from '../types.js';

export class ArbitrageDetector {
  private minSpread: number;

  constructor(minSpreadPercent = 1.0) {
    this.minSpread = minSpreadPercent;
  }

  detectOpportunities(normalizedMarkets: NormalizedMarket[]): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    for (const normalized of normalizedMarkets) {
      const marketsByPlatform = this.groupByPlatform(normalized.markets);

      // Need markets from at least 2 platforms
      const platforms = Object.keys(marketsByPlatform) as Platform[];
      if (platforms.length < 2) continue;

      // Compare each pair of platforms
      for (let i = 0; i < platforms.length; i++) {
        for (let j = i + 1; j < platforms.length; j++) {
          const platform1Markets = marketsByPlatform[platforms[i]];
          const platform2Markets = marketsByPlatform[platforms[j]];

          for (const market1 of platform1Markets) {
            for (const market2 of platform2Markets) {
              const arbOps = this.findArbitrage(market1, market2);
              opportunities.push(...arbOps);
            }
          }
        }
      }
    }

    // Also do direct comparison for all markets
    const directOpportunities = this.detectDirectArbitrage(
      normalizedMarkets.flatMap(nm => nm.markets)
    );

    // Merge and dedupe
    for (const op of directOpportunities) {
      if (!opportunities.find(o => o.id === op.id)) {
        opportunities.push(op);
      }
    }

    return opportunities
      .filter(op => op.spread >= this.minSpread)
      .sort((a, b) => b.spread - a.spread);
  }

  private detectDirectArbitrage(markets: Market[]): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];
    const polymarketMarkets = markets.filter(m => m.platform === 'polymarket');
    const kalshiMarkets = markets.filter(m => m.platform === 'kalshi');

    // Compare markets with matching assets and similar end dates
    for (const pm of polymarketMarkets) {
      for (const km of kalshiMarkets) {
        if (pm.asset && km.asset && pm.asset === km.asset) {
          // Check if end dates are within 24 hours
          if (pm.endDate && km.endDate) {
            const diffHours = Math.abs(pm.endDate.getTime() - km.endDate.getTime()) / (1000 * 60 * 60);
            if (diffHours <= 24) {
              const arbOps = this.findArbitrage(pm, km);
              opportunities.push(...arbOps);
            }
          }
        }
      }
    }

    return opportunities;
  }

  private findArbitrage(market1: Market, market2: Market): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    // Get Yes/No outcomes from each market
    const yes1 = market1.outcomes.find(o => o.name.toLowerCase() === 'yes');
    const no1 = market1.outcomes.find(o => o.name.toLowerCase() === 'no');
    const yes2 = market2.outcomes.find(o => o.name.toLowerCase() === 'yes');
    const no2 = market2.outcomes.find(o => o.name.toLowerCase() === 'no');

    if (!yes1 || !no1 || !yes2 || !no2) return opportunities;

    // Arbitrage opportunity 1: Buy YES on platform with lower price, sell YES (buy NO) on platform with higher price
    // If YES1 + NO2 < 1, there's arbitrage (you can buy both and guarantee profit)
    const combo1 = yes1.price + no2.price;
    if (combo1 < 0.99) {
      const spread = (1 - combo1) * 100;
      const profit = ((1 / combo1) - 1) * 100;

      opportunities.push({
        id: `${market1.id}-${market2.id}-yes-no`,
        description: `Buy YES on ${market1.platform}, Buy NO on ${market2.platform}`,
        asset: market1.asset || market2.asset || 'Unknown',
        markets: [
          { platform: market1.platform, market: market1, outcome: yes1, side: 'yes' },
          { platform: market2.platform, market: market2, outcome: no2, side: 'no' },
        ],
        spread,
        potentialProfit: profit,
        confidence: this.calculateConfidence(market1, market2, spread),
        expiresAt: market1.endDate && market2.endDate
          ? new Date(Math.min(market1.endDate.getTime(), market2.endDate.getTime()))
          : undefined,
      });
    }

    // Arbitrage opportunity 2: Buy NO on platform with lower price, sell NO (buy YES) on platform with higher price
    const combo2 = no1.price + yes2.price;
    if (combo2 < 0.99) {
      const spread = (1 - combo2) * 100;
      const profit = ((1 / combo2) - 1) * 100;

      opportunities.push({
        id: `${market1.id}-${market2.id}-no-yes`,
        description: `Buy NO on ${market1.platform}, Buy YES on ${market2.platform}`,
        asset: market1.asset || market2.asset || 'Unknown',
        markets: [
          { platform: market1.platform, market: market1, outcome: no1, side: 'no' },
          { platform: market2.platform, market: market2, outcome: yes2, side: 'yes' },
        ],
        spread,
        potentialProfit: profit,
        confidence: this.calculateConfidence(market1, market2, spread),
        expiresAt: market1.endDate && market2.endDate
          ? new Date(Math.min(market1.endDate.getTime(), market2.endDate.getTime()))
          : undefined,
      });
    }

    // Also check for simple price discrepancy (same outcome, different price)
    const yesDiff = Math.abs(yes1.price - yes2.price) * 100;
    if (yesDiff >= this.minSpread) {
      const buyPlatform = yes1.price < yes2.price ? market1 : market2;
      const sellPlatform = yes1.price < yes2.price ? market2 : market1;
      const buyOutcome = yes1.price < yes2.price ? yes1 : yes2;
      const sellOutcome = yes1.price < yes2.price ? yes2 : yes1;

      opportunities.push({
        id: `${market1.id}-${market2.id}-yes-discrepancy`,
        description: `YES price discrepancy: Buy at ${(buyOutcome.price * 100).toFixed(1)}% on ${buyPlatform.platform}, worth ${(sellOutcome.price * 100).toFixed(1)}% on ${sellPlatform.platform}`,
        asset: market1.asset || market2.asset || 'Unknown',
        markets: [
          { platform: buyPlatform.platform, market: buyPlatform, outcome: buyOutcome, side: 'yes' },
          { platform: sellPlatform.platform, market: sellPlatform, outcome: sellOutcome, side: 'yes' },
        ],
        spread: yesDiff,
        potentialProfit: yesDiff,
        confidence: this.calculateConfidence(market1, market2, yesDiff),
        expiresAt: market1.endDate && market2.endDate
          ? new Date(Math.min(market1.endDate.getTime(), market2.endDate.getTime()))
          : undefined,
      });
    }

    return opportunities;
  }

  private groupByPlatform(markets: Market[]): Record<Platform, Market[]> {
    const grouped: Record<Platform, Market[]> = {
      polymarket: [],
      kalshi: [],
    };

    for (const market of markets) {
      grouped[market.platform].push(market);
    }

    return grouped;
  }

  private calculateConfidence(
    market1: Market,
    market2: Market,
    spread: number
  ): 'high' | 'medium' | 'low' {
    let score = 0;

    // Higher spread = higher confidence opportunity exists
    if (spread >= 5) score += 2;
    else if (spread >= 2) score += 1;

    // Higher liquidity = more confidence we can execute
    const minLiquidity = Math.min(market1.liquidity || 0, market2.liquidity || 0);
    if (minLiquidity >= 10000) score += 2;
    else if (minLiquidity >= 1000) score += 1;

    // Same asset confirmed
    if (market1.asset && market2.asset && market1.asset === market2.asset) {
      score += 1;
    }

    // Close end dates
    if (market1.endDate && market2.endDate) {
      const diffHours = Math.abs(market1.endDate.getTime() - market2.endDate.getTime()) / (1000 * 60 * 60);
      if (diffHours <= 1) score += 2;
      else if (diffHours <= 24) score += 1;
    }

    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }
}
