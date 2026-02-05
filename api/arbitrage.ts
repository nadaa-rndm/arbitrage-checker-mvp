import type { VercelRequest, VercelResponse } from '@vercel/node';

// Types
interface Outcome {
  id: string;
  name: string;
  probability: number;
  price: number;
}

interface Market {
  id: string;
  platform: 'polymarket' | 'kalshi';
  title: string;
  description?: string;
  asset?: string;
  category: string;
  timeFrame?: string;
  endDate?: Date;
  outcomes: Outcome[];
  volume?: number;
  liquidity?: number;
  url?: string;
}

interface ArbitrageOpportunity {
  id: string;
  description: string;
  asset: string;
  markets: Array<{
    platform: string;
    market: Market;
    outcome: Outcome;
    side: string;
  }>;
  spread: number;
  potentialProfit: number;
  confidence: 'high' | 'medium' | 'low';
  expiresAt?: Date;
}

// Demo data
function getDemoData(): { polymarket: Market[]; kalshi: Market[] } {
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 0);

  const polymarket: Market[] = [
    {
      id: 'pm-btc-100k-daily',
      platform: 'polymarket',
      title: 'Will Bitcoin be above $100,000 by end of day?',
      asset: 'BTC',
      category: 'crypto',
      timeFrame: 'daily',
      endDate: endOfDay,
      outcomes: [
        { id: 'pm-btc-100k-yes', name: 'Yes', probability: 0.42, price: 0.42 },
        { id: 'pm-btc-100k-no', name: 'No', probability: 0.58, price: 0.58 },
      ],
      volume: 125000,
      liquidity: 45000,
      url: 'https://polymarket.com/event/btc-price',
    },
    {
      id: 'pm-eth-4k-daily',
      platform: 'polymarket',
      title: 'Will Ethereum be above $4,000 by end of day?',
      asset: 'ETH',
      category: 'crypto',
      timeFrame: 'daily',
      endDate: endOfDay,
      outcomes: [
        { id: 'pm-eth-4k-yes', name: 'Yes', probability: 0.35, price: 0.35 },
        { id: 'pm-eth-4k-no', name: 'No', probability: 0.65, price: 0.65 },
      ],
      volume: 78000,
      liquidity: 32000,
      url: 'https://polymarket.com/event/eth-price',
    },
    {
      id: 'pm-sol-250-daily',
      platform: 'polymarket',
      title: 'Will Solana be above $250 by end of day?',
      asset: 'SOL',
      category: 'crypto',
      timeFrame: 'daily',
      endDate: endOfDay,
      outcomes: [
        { id: 'pm-sol-250-yes', name: 'Yes', probability: 0.28, price: 0.28 },
        { id: 'pm-sol-250-no', name: 'No', probability: 0.72, price: 0.72 },
      ],
      volume: 45000,
      liquidity: 18000,
      url: 'https://polymarket.com/event/sol-price',
    },
    {
      id: 'pm-spy-500-daily',
      platform: 'polymarket',
      title: 'Will SPY close above $500 today?',
      asset: 'SPY',
      category: 'stocks',
      timeFrame: 'daily',
      endDate: endOfDay,
      outcomes: [
        { id: 'pm-spy-500-yes', name: 'Yes', probability: 0.55, price: 0.55 },
        { id: 'pm-spy-500-no', name: 'No', probability: 0.45, price: 0.45 },
      ],
      volume: 95000,
      liquidity: 40000,
      url: 'https://polymarket.com/event/spy-price',
    },
    {
      id: 'pm-tsla-400-daily',
      platform: 'polymarket',
      title: 'Will Tesla close above $400 today?',
      asset: 'TSLA',
      category: 'stocks',
      timeFrame: 'daily',
      endDate: endOfDay,
      outcomes: [
        { id: 'pm-tsla-400-yes', name: 'Yes', probability: 0.38, price: 0.38 },
        { id: 'pm-tsla-400-no', name: 'No', probability: 0.62, price: 0.62 },
      ],
      volume: 68000,
      liquidity: 28000,
      url: 'https://polymarket.com/event/tsla-price',
    },
    {
      id: 'pm-gold-2100-daily',
      platform: 'polymarket',
      title: 'Will Gold be above $2,100/oz by end of day?',
      asset: 'GOLD',
      category: 'commodities',
      timeFrame: 'daily',
      endDate: endOfDay,
      outcomes: [
        { id: 'pm-gold-2100-yes', name: 'Yes', probability: 0.62, price: 0.62 },
        { id: 'pm-gold-2100-no', name: 'No', probability: 0.38, price: 0.38 },
      ],
      volume: 52000,
      liquidity: 22000,
      url: 'https://polymarket.com/event/gold-price',
    },
    {
      id: 'pm-nvda-800-daily',
      platform: 'polymarket',
      title: 'Will NVIDIA close above $800 today?',
      asset: 'NVDA',
      category: 'stocks',
      timeFrame: 'daily',
      endDate: endOfDay,
      outcomes: [
        { id: 'pm-nvda-800-yes', name: 'Yes', probability: 0.71, price: 0.71 },
        { id: 'pm-nvda-800-no', name: 'No', probability: 0.29, price: 0.29 },
      ],
      volume: 110000,
      liquidity: 48000,
      url: 'https://polymarket.com/event/nvda-price',
    },
  ];

  const kalshi: Market[] = [
    {
      id: 'kal-btc-100k-daily',
      platform: 'kalshi',
      title: 'Bitcoin above $100,000?',
      description: 'Will Bitcoin trade above $100,000 before market close?',
      asset: 'BTC',
      category: 'crypto',
      timeFrame: 'daily',
      endDate: endOfDay,
      outcomes: [
        { id: 'kal-btc-100k-yes', name: 'Yes', probability: 0.45, price: 0.45 },
        { id: 'kal-btc-100k-no', name: 'No', probability: 0.55, price: 0.55 },
      ],
      volume: 98000,
      liquidity: 38000,
      url: 'https://kalshi.com/markets/btc-price',
    },
    {
      id: 'kal-eth-4k-daily',
      platform: 'kalshi',
      title: 'Ethereum above $4,000?',
      description: 'Will Ethereum trade above $4,000 before market close?',
      asset: 'ETH',
      category: 'crypto',
      timeFrame: 'daily',
      endDate: endOfDay,
      outcomes: [
        { id: 'kal-eth-4k-yes', name: 'Yes', probability: 0.32, price: 0.32 },
        { id: 'kal-eth-4k-no', name: 'No', probability: 0.68, price: 0.68 },
      ],
      volume: 65000,
      liquidity: 28000,
      url: 'https://kalshi.com/markets/eth-price',
    },
    {
      id: 'kal-sol-250-daily',
      platform: 'kalshi',
      title: 'Solana above $250?',
      description: 'Will Solana trade above $250 before market close?',
      asset: 'SOL',
      category: 'crypto',
      timeFrame: 'daily',
      endDate: endOfDay,
      outcomes: [
        { id: 'kal-sol-250-yes', name: 'Yes', probability: 0.31, price: 0.31 },
        { id: 'kal-sol-250-no', name: 'No', probability: 0.69, price: 0.69 },
      ],
      volume: 38000,
      liquidity: 15000,
      url: 'https://kalshi.com/markets/sol-price',
    },
    {
      id: 'kal-spy-500-daily',
      platform: 'kalshi',
      title: 'S&P 500 ETF above $500?',
      description: 'Will SPY close above $500 today?',
      asset: 'SPY',
      category: 'stocks',
      timeFrame: 'daily',
      endDate: endOfDay,
      outcomes: [
        { id: 'kal-spy-500-yes', name: 'Yes', probability: 0.52, price: 0.52 },
        { id: 'kal-spy-500-no', name: 'No', probability: 0.48, price: 0.48 },
      ],
      volume: 88000,
      liquidity: 35000,
      url: 'https://kalshi.com/markets/spy-price',
    },
    {
      id: 'kal-tsla-400-daily',
      platform: 'kalshi',
      title: 'Tesla above $400?',
      description: 'Will TSLA close above $400 today?',
      asset: 'TSLA',
      category: 'stocks',
      timeFrame: 'daily',
      endDate: endOfDay,
      outcomes: [
        { id: 'kal-tsla-400-yes', name: 'Yes', probability: 0.41, price: 0.41 },
        { id: 'kal-tsla-400-no', name: 'No', probability: 0.59, price: 0.59 },
      ],
      volume: 72000,
      liquidity: 30000,
      url: 'https://kalshi.com/markets/tsla-price',
    },
    {
      id: 'kal-gold-2100-daily',
      platform: 'kalshi',
      title: 'Gold above $2,100/oz?',
      description: 'Will Gold trade above $2,100 per ounce today?',
      asset: 'GOLD',
      category: 'commodities',
      timeFrame: 'daily',
      endDate: endOfDay,
      outcomes: [
        { id: 'kal-gold-2100-yes', name: 'Yes', probability: 0.58, price: 0.58 },
        { id: 'kal-gold-2100-no', name: 'No', probability: 0.42, price: 0.42 },
      ],
      volume: 48000,
      liquidity: 20000,
      url: 'https://kalshi.com/markets/gold-price',
    },
    {
      id: 'kal-nvda-800-daily',
      platform: 'kalshi',
      title: 'NVIDIA above $800?',
      description: 'Will NVDA close above $800 today?',
      asset: 'NVDA',
      category: 'stocks',
      timeFrame: 'daily',
      endDate: endOfDay,
      outcomes: [
        { id: 'kal-nvda-800-yes', name: 'Yes', probability: 0.68, price: 0.68 },
        { id: 'kal-nvda-800-no', name: 'No', probability: 0.32, price: 0.32 },
      ],
      volume: 102000,
      liquidity: 45000,
      url: 'https://kalshi.com/markets/nvda-price',
    },
  ];

  return { polymarket, kalshi };
}

// Arbitrage detection
function detectArbitrage(polymarket: Market[], kalshi: Market[]): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = [];
  const minSpread = 1.0;

  for (const pm of polymarket) {
    for (const km of kalshi) {
      if (pm.asset && km.asset && pm.asset === km.asset) {
        const yes1 = pm.outcomes.find(o => o.name.toLowerCase() === 'yes');
        const no1 = pm.outcomes.find(o => o.name.toLowerCase() === 'no');
        const yes2 = km.outcomes.find(o => o.name.toLowerCase() === 'yes');
        const no2 = km.outcomes.find(o => o.name.toLowerCase() === 'no');

        if (!yes1 || !no1 || !yes2 || !no2) continue;

        // Check for arbitrage: YES on one + NO on other < 1
        const combo1 = yes1.price + no2.price;
        if (combo1 < 0.99) {
          const spread = (1 - combo1) * 100;
          const profit = ((1 / combo1) - 1) * 100;

          opportunities.push({
            id: `${pm.id}-${km.id}-yes-no`,
            description: `Buy YES on Polymarket @ ${(yes1.price * 100).toFixed(1)}% + NO on Kalshi @ ${(no2.price * 100).toFixed(1)}%`,
            asset: pm.asset,
            markets: [
              { platform: 'polymarket', market: pm, outcome: yes1, side: 'yes' },
              { platform: 'kalshi', market: km, outcome: no2, side: 'no' },
            ],
            spread,
            potentialProfit: profit,
            confidence: spread >= 3 ? 'high' : spread >= 2 ? 'medium' : 'low',
            expiresAt: pm.endDate,
          });
        }

        const combo2 = no1.price + yes2.price;
        if (combo2 < 0.99) {
          const spread = (1 - combo2) * 100;
          const profit = ((1 / combo2) - 1) * 100;

          opportunities.push({
            id: `${pm.id}-${km.id}-no-yes`,
            description: `Buy NO on Polymarket @ ${(no1.price * 100).toFixed(1)}% + YES on Kalshi @ ${(yes2.price * 100).toFixed(1)}%`,
            asset: pm.asset,
            markets: [
              { platform: 'polymarket', market: pm, outcome: no1, side: 'no' },
              { platform: 'kalshi', market: km, outcome: yes2, side: 'yes' },
            ],
            spread,
            potentialProfit: profit,
            confidence: spread >= 3 ? 'high' : spread >= 2 ? 'medium' : 'low',
            expiresAt: pm.endDate,
          });
        }

        // Price discrepancy
        const yesDiff = Math.abs(yes1.price - yes2.price) * 100;
        if (yesDiff >= minSpread) {
          const buyPlatform = yes1.price < yes2.price ? 'polymarket' : 'kalshi';
          const buyPrice = Math.min(yes1.price, yes2.price);
          const sellPrice = Math.max(yes1.price, yes2.price);

          opportunities.push({
            id: `${pm.id}-${km.id}-discrepancy`,
            description: `YES priced at ${(buyPrice * 100).toFixed(1)}% on ${buyPlatform}, ${(sellPrice * 100).toFixed(1)}% elsewhere`,
            asset: pm.asset,
            markets: [
              { platform: 'polymarket', market: pm, outcome: yes1, side: 'yes' },
              { platform: 'kalshi', market: km, outcome: yes2, side: 'yes' },
            ],
            spread: yesDiff,
            potentialProfit: yesDiff,
            confidence: yesDiff >= 3 ? 'high' : yesDiff >= 2 ? 'medium' : 'low',
            expiresAt: pm.endDate,
          });
        }
      }
    }
  }

  // Sort by spread descending and dedupe
  const seen = new Set<string>();
  return opportunities
    .filter(op => op.spread >= minSpread)
    .sort((a, b) => b.spread - a.spread)
    .filter(op => {
      const key = `${op.asset}-${op.spread.toFixed(2)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { polymarket, kalshi } = getDemoData();
    const opportunities = detectArbitrage(polymarket, kalshi);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        opportunities,
        markets: {
          polymarket: polymarket.length,
          kalshi: kalshi.length,
        },
        summary: {
          totalOpportunities: opportunities.length,
          highConfidence: opportunities.filter(o => o.confidence === 'high').length,
          mediumConfidence: opportunities.filter(o => o.confidence === 'medium').length,
          lowConfidence: opportunities.filter(o => o.confidence === 'low').length,
          avgSpread: opportunities.length > 0
            ? opportunities.reduce((sum, o) => sum + o.spread, 0) / opportunities.length
            : 0,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
