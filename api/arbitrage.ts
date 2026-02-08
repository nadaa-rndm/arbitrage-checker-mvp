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

// Asset keywords for detection
const TRACKED_ASSETS = [
  { symbol: 'BTC', keywords: ['bitcoin', 'btc'], category: 'crypto' },
  { symbol: 'ETH', keywords: ['ethereum', 'eth'], category: 'crypto' },
  { symbol: 'SOL', keywords: ['solana', 'sol'], category: 'crypto' },
  { symbol: 'SPY', keywords: ['spy', 's&p 500', 's&p500'], category: 'stocks' },
  { symbol: 'TSLA', keywords: ['tesla', 'tsla'], category: 'stocks' },
  { symbol: 'AAPL', keywords: ['apple', 'aapl'], category: 'stocks' },
  { symbol: 'GOOGL', keywords: ['google', 'googl', 'alphabet'], category: 'stocks' },
  { symbol: 'NVDA', keywords: ['nvidia', 'nvda'], category: 'stocks' },
  { symbol: 'GOLD', keywords: ['gold', 'xau'], category: 'commodities' },
];

function detectAsset(text: string): { asset?: string; category: string } {
  const lowerText = text.toLowerCase();
  for (const config of TRACKED_ASSETS) {
    for (const keyword of config.keywords) {
      if (lowerText.includes(keyword)) {
        return { asset: config.symbol, category: config.category };
      }
    }
  }
  return { category: 'other' };
}

// Fetch Kalshi markets
async function fetchKalshiMarkets(): Promise<Market[]> {
  const markets: Market[] = [];

  try {
    const response = await fetch(
      'https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=200',
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Kalshi API error:', response.status);
      return markets;
    }

    const data = await response.json();
    const rawMarkets = data.markets || [];

    for (const m of rawMarkets) {
      if (m.status !== 'open' || m.result) continue;

      const { asset, category } = detectAsset(`${m.title} ${m.subtitle || ''}`);
      if (!asset) continue; // Only include tracked assets

      // Kalshi prices are in cents (0-100)
      const yesPrice = ((m.yes_bid || 0) + (m.yes_ask || 0)) / 2 / 100;
      const noPrice = ((m.no_bid || 0) + (m.no_ask || 0)) / 2 / 100;

      markets.push({
        id: m.ticker,
        platform: 'kalshi',
        title: m.title,
        description: m.subtitle,
        asset,
        category,
        endDate: m.close_time ? new Date(m.close_time) : undefined,
        outcomes: [
          { id: `${m.ticker}-yes`, name: 'Yes', probability: yesPrice, price: yesPrice },
          { id: `${m.ticker}-no`, name: 'No', probability: noPrice, price: noPrice },
        ],
        volume: m.volume || 0,
        liquidity: m.open_interest || 0,
        url: `https://kalshi.com/markets/${m.event_ticker}`,
      });
    }
  } catch (error) {
    console.error('Error fetching Kalshi:', error);
  }

  return markets;
}

// Fetch Polymarket markets
async function fetchPolymarketMarkets(): Promise<Market[]> {
  const markets: Market[] = [];

  try {
    const response = await fetch(
      'https://clob.polymarket.com/markets?limit=100',
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Polymarket API error:', response.status);
      return markets;
    }

    const rawMarkets = await response.json();

    for (const m of rawMarkets) {
      if (!m.active || m.closed) continue;

      const { asset, category } = detectAsset(m.question || m.description || '');
      if (!asset) continue; // Only include tracked assets

      // Parse outcome prices
      let outcomes: Outcome[] = [];
      try {
        const tokens = m.tokens || [];
        if (tokens.length >= 2) {
          outcomes = [
            {
              id: tokens[0]?.token_id || `${m.condition_id}-yes`,
              name: 'Yes',
              probability: parseFloat(tokens[0]?.price || '0.5'),
              price: parseFloat(tokens[0]?.price || '0.5'),
            },
            {
              id: tokens[1]?.token_id || `${m.condition_id}-no`,
              name: 'No',
              probability: parseFloat(tokens[1]?.price || '0.5'),
              price: parseFloat(tokens[1]?.price || '0.5'),
            },
          ];
        }
      } catch {
        continue;
      }

      if (outcomes.length < 2) continue;

      markets.push({
        id: m.condition_id,
        platform: 'polymarket',
        title: m.question || m.description || 'Unknown',
        asset,
        category,
        endDate: m.end_date_iso ? new Date(m.end_date_iso) : undefined,
        outcomes,
        volume: parseFloat(m.volume || '0'),
        liquidity: parseFloat(m.liquidity || '0'),
        url: `https://polymarket.com/event/${m.condition_id}`,
      });
    }
  } catch (error) {
    console.error('Error fetching Polymarket:', error);
  }

  return markets;
}

// Demo data fallback
function getDemoData(): { polymarket: Market[]; kalshi: Market[] } {
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 0);

  const polymarket: Market[] = [
    {
      id: 'pm-btc-100k',
      platform: 'polymarket',
      title: 'Will Bitcoin be above $100,000 by end of day?',
      asset: 'BTC',
      category: 'crypto',
      endDate: endOfDay,
      outcomes: [
        { id: 'pm-btc-yes', name: 'Yes', probability: 0.42, price: 0.42 },
        { id: 'pm-btc-no', name: 'No', probability: 0.58, price: 0.58 },
      ],
      volume: 125000,
      liquidity: 45000,
      url: 'https://polymarket.com/event/btc-price',
    },
    {
      id: 'pm-eth-4k',
      platform: 'polymarket',
      title: 'Will Ethereum be above $4,000?',
      asset: 'ETH',
      category: 'crypto',
      endDate: endOfDay,
      outcomes: [
        { id: 'pm-eth-yes', name: 'Yes', probability: 0.35, price: 0.35 },
        { id: 'pm-eth-no', name: 'No', probability: 0.65, price: 0.65 },
      ],
      volume: 78000,
      liquidity: 32000,
      url: 'https://polymarket.com/event/eth-price',
    },
  ];

  const kalshi: Market[] = [
    {
      id: 'kal-btc-100k',
      platform: 'kalshi',
      title: 'Bitcoin above $100,000?',
      asset: 'BTC',
      category: 'crypto',
      endDate: endOfDay,
      outcomes: [
        { id: 'kal-btc-yes', name: 'Yes', probability: 0.45, price: 0.45 },
        { id: 'kal-btc-no', name: 'No', probability: 0.55, price: 0.55 },
      ],
      volume: 98000,
      liquidity: 38000,
      url: 'https://kalshi.com/markets/btc-price',
    },
    {
      id: 'kal-eth-4k',
      platform: 'kalshi',
      title: 'Ethereum above $4,000?',
      asset: 'ETH',
      category: 'crypto',
      endDate: endOfDay,
      outcomes: [
        { id: 'kal-eth-yes', name: 'Yes', probability: 0.32, price: 0.32 },
        { id: 'kal-eth-no', name: 'No', probability: 0.68, price: 0.68 },
      ],
      volume: 65000,
      liquidity: 28000,
      url: 'https://kalshi.com/markets/eth-price',
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

        // Arbitrage: Buy YES on one + NO on other < 1
        const combo1 = yes1.price + no2.price;
        if (combo1 < 0.99) {
          const spread = (1 - combo1) * 100;
          opportunities.push({
            id: `${pm.id}-${km.id}-yes-no`,
            description: `Buy YES on Polymarket @ ${(yes1.price * 100).toFixed(1)}% + NO on Kalshi @ ${(no2.price * 100).toFixed(1)}%`,
            asset: pm.asset,
            markets: [
              { platform: 'polymarket', market: pm, outcome: yes1, side: 'yes' },
              { platform: 'kalshi', market: km, outcome: no2, side: 'no' },
            ],
            spread,
            potentialProfit: ((1 / combo1) - 1) * 100,
            confidence: spread >= 3 ? 'high' : spread >= 2 ? 'medium' : 'low',
            expiresAt: pm.endDate,
          });
        }

        const combo2 = no1.price + yes2.price;
        if (combo2 < 0.99) {
          const spread = (1 - combo2) * 100;
          opportunities.push({
            id: `${pm.id}-${km.id}-no-yes`,
            description: `Buy NO on Polymarket @ ${(no1.price * 100).toFixed(1)}% + YES on Kalshi @ ${(yes2.price * 100).toFixed(1)}%`,
            asset: pm.asset,
            markets: [
              { platform: 'polymarket', market: pm, outcome: no1, side: 'no' },
              { platform: 'kalshi', market: km, outcome: yes2, side: 'yes' },
            ],
            spread,
            potentialProfit: ((1 / combo2) - 1) * 100,
            confidence: spread >= 3 ? 'high' : spread >= 2 ? 'medium' : 'low',
            expiresAt: pm.endDate,
          });
        }

        // Price discrepancy
        const yesDiff = Math.abs(yes1.price - yes2.price) * 100;
        if (yesDiff >= minSpread) {
          const buyPlatform = yes1.price < yes2.price ? 'polymarket' : 'kalshi';
          opportunities.push({
            id: `${pm.id}-${km.id}-discrepancy`,
            description: `YES priced at ${(Math.min(yes1.price, yes2.price) * 100).toFixed(1)}% on ${buyPlatform}, ${(Math.max(yes1.price, yes2.price) * 100).toFixed(1)}% elsewhere`,
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Fetch live data from both APIs
    const [polymarketMarkets, kalshiMarkets] = await Promise.all([
      fetchPolymarketMarkets(),
      fetchKalshiMarkets(),
    ]);

    let polymarket = polymarketMarkets;
    let kalshi = kalshiMarkets;
    let isDemo = false;

    // Fallback to demo data if APIs return empty
    if (polymarket.length === 0 && kalshi.length === 0) {
      const demo = getDemoData();
      polymarket = demo.polymarket;
      kalshi = demo.kalshi;
      isDemo = true;
    }

    const opportunities = detectArbitrage(polymarket, kalshi);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      isDemo,
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
