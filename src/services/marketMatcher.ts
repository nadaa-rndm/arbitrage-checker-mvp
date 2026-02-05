import { Market, NormalizedMarket, TRACKED_ASSETS } from '../types.js';

interface PriceCondition {
  asset: string;
  direction: 'above' | 'below' | 'between' | 'at';
  targetValue: number;
  upperValue?: number;
  endDate?: Date;
}

export class MarketMatcher {
  matchMarkets(polymarketMarkets: Market[], kalshiMarkets: Market[]): NormalizedMarket[] {
    const normalizedMap = new Map<string, NormalizedMarket>();

    // Process all markets and create normalized keys
    const allMarkets = [...polymarketMarkets, ...kalshiMarkets];

    for (const market of allMarkets) {
      const keys = this.generateNormalizedKeys(market);

      for (const key of keys) {
        if (!normalizedMap.has(key)) {
          normalizedMap.set(key, {
            key,
            asset: market.asset || 'unknown',
            condition: this.extractCondition(market.title),
            endDate: market.endDate,
            markets: [],
          });
        }

        const normalized = normalizedMap.get(key)!;
        // Only add if not already in the list
        if (!normalized.markets.find(m => m.id === market.id && m.platform === market.platform)) {
          normalized.markets.push(market);
        }
      }
    }

    // Filter to only keep normalized markets that have markets from multiple platforms
    const matchedMarkets = Array.from(normalizedMap.values()).filter(nm => {
      const platforms = new Set(nm.markets.map(m => m.platform));
      return platforms.size > 1;
    });

    return matchedMarkets;
  }

  findSimilarMarkets(market: Market, candidates: Market[], threshold = 0.7): Market[] {
    const similar: Market[] = [];

    for (const candidate of candidates) {
      if (candidate.platform === market.platform) continue;
      if (candidate.id === market.id) continue;

      const similarity = this.calculateSimilarity(market, candidate);
      if (similarity >= threshold) {
        similar.push(candidate);
      }
    }

    return similar.sort((a, b) =>
      this.calculateSimilarity(market, b) - this.calculateSimilarity(market, a)
    );
  }

  private generateNormalizedKeys(market: Market): string[] {
    const keys: string[] = [];
    const condition = this.parseCondition(market.title);

    if (!condition) {
      // Create a fuzzy key based on asset and date
      if (market.asset && market.endDate) {
        const dateStr = this.formatDate(market.endDate);
        keys.push(`${market.asset.toLowerCase()}_${dateStr}`);
      }
      return keys;
    }

    // Create specific key based on parsed condition
    const dateStr = market.endDate ? this.formatDate(market.endDate) : 'ongoing';
    const key = `${condition.asset.toLowerCase()}_${condition.direction}_${condition.targetValue}_${dateStr}`;
    keys.push(key);

    // Also add a broader key for fuzzy matching
    keys.push(`${condition.asset.toLowerCase()}_${condition.direction}_${dateStr}`);

    return keys;
  }

  private parseCondition(title: string): PriceCondition | null {
    const text = title.toLowerCase();

    // Find which asset this is about
    let detectedAsset: string | null = null;
    for (const asset of TRACKED_ASSETS) {
      for (const keyword of asset.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          detectedAsset = asset.symbol;
          break;
        }
      }
      if (detectedAsset) break;
    }

    if (!detectedAsset) return null;

    // Parse price conditions
    // Patterns like "above $100,000", "below $50k", "between $90k and $100k"
    const aboveMatch = text.match(/above\s*\$?([\d,\.]+)([km]?)/i);
    const belowMatch = text.match(/below\s*\$?([\d,\.]+)([km]?)/i);
    const betweenMatch = text.match(/between\s*\$?([\d,\.]+)([km]?)\s*(?:and|-)\s*\$?([\d,\.]+)([km]?)/i);
    const atMatch = text.match(/(?:at|reach|hit)\s*\$?([\d,\.]+)([km]?)/i);

    const parseValue = (val: string, suffix: string): number => {
      let num = parseFloat(val.replace(/,/g, ''));
      if (suffix.toLowerCase() === 'k') num *= 1000;
      if (suffix.toLowerCase() === 'm') num *= 1000000;
      return num;
    };

    if (betweenMatch) {
      return {
        asset: detectedAsset,
        direction: 'between',
        targetValue: parseValue(betweenMatch[1], betweenMatch[2]),
        upperValue: parseValue(betweenMatch[3], betweenMatch[4]),
      };
    }

    if (aboveMatch) {
      return {
        asset: detectedAsset,
        direction: 'above',
        targetValue: parseValue(aboveMatch[1], aboveMatch[2]),
      };
    }

    if (belowMatch) {
      return {
        asset: detectedAsset,
        direction: 'below',
        targetValue: parseValue(belowMatch[1], belowMatch[2]),
      };
    }

    if (atMatch) {
      return {
        asset: detectedAsset,
        direction: 'at',
        targetValue: parseValue(atMatch[1], atMatch[2]),
      };
    }

    return {
      asset: detectedAsset,
      direction: 'above',
      targetValue: 0,
    };
  }

  private extractCondition(title: string): string {
    const text = title.toLowerCase();

    // Extract the core condition
    const aboveMatch = text.match(/(above|over|greater than)\s*\$?[\d,\.]+[km]?/i);
    const belowMatch = text.match(/(below|under|less than)\s*\$?[\d,\.]+[km]?/i);
    const betweenMatch = text.match(/between\s*\$?[\d,\.]+[km]?\s*(?:and|-)\s*\$?[\d,\.]+[km]?/i);

    if (betweenMatch) return betweenMatch[0];
    if (aboveMatch) return aboveMatch[0];
    if (belowMatch) return belowMatch[0];

    return title.slice(0, 50);
  }

  private calculateSimilarity(market1: Market, market2: Market): number {
    let score = 0;

    // Same asset is a strong signal
    if (market1.asset && market2.asset && market1.asset === market2.asset) {
      score += 0.4;
    }

    // Same category
    if (market1.category === market2.category) {
      score += 0.1;
    }

    // Close end dates (within 24 hours)
    if (market1.endDate && market2.endDate) {
      const diffMs = Math.abs(market1.endDate.getTime() - market2.endDate.getTime());
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours <= 1) score += 0.3;
      else if (diffHours <= 24) score += 0.2;
      else if (diffHours <= 168) score += 0.1; // Within a week
    }

    // Title similarity (simple word overlap)
    const words1 = new Set(market1.title.toLowerCase().split(/\s+/));
    const words2 = new Set(market2.title.toLowerCase().split(/\s+/));
    const commonWords = [...words1].filter(w => words2.has(w) && w.length > 3);
    score += Math.min(0.2, commonWords.length * 0.05);

    return Math.min(1, score);
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
