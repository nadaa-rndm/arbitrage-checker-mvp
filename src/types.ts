export type Platform = 'polymarket' | 'kalshi';

export type AssetCategory = 'crypto' | 'stocks' | 'commodities' | 'other';

export type TimeFrame = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Market {
  id: string;
  platform: Platform;
  title: string;
  description?: string;
  asset?: string;
  category: AssetCategory;
  timeFrame?: TimeFrame;
  endDate?: Date;
  outcomes: Outcome[];
  volume?: number;
  liquidity?: number;
  url: string;
}

export interface Outcome {
  id: string;
  name: string;
  probability: number; // 0-1
  price: number; // 0-1 (essentially same as probability in prediction markets)
}

export interface NormalizedMarket {
  key: string; // Normalized key for matching (e.g., "btc_above_100000_2024-01-15")
  asset: string;
  condition: string;
  targetValue?: number;
  endDate?: Date;
  markets: Market[];
}

export interface ArbitrageOpportunity {
  id: string;
  description: string;
  asset: string;
  markets: {
    platform: Platform;
    market: Market;
    outcome: Outcome;
    side: 'yes' | 'no';
  }[];
  spread: number; // Percentage spread
  potentialProfit: number; // Percentage profit on $100
  confidence: 'high' | 'medium' | 'low';
  expiresAt?: Date;
}

export interface AssetConfig {
  symbol: string;
  name: string;
  category: AssetCategory;
  timeFrames: TimeFrame[];
  keywords: string[];
}

export const TRACKED_ASSETS: AssetConfig[] = [
  // Crypto - hourly and daily
  { symbol: 'BTC', name: 'Bitcoin', category: 'crypto', timeFrames: ['hourly', 'daily'], keywords: ['bitcoin', 'btc'] },
  { symbol: 'ETH', name: 'Ethereum', category: 'crypto', timeFrames: ['hourly', 'daily'], keywords: ['ethereum', 'eth'] },
  { symbol: 'SOL', name: 'Solana', category: 'crypto', timeFrames: ['hourly', 'daily'], keywords: ['solana', 'sol'] },

  // Stocks - daily
  { symbol: 'SPY', name: 'S&P 500 ETF', category: 'stocks', timeFrames: ['daily'], keywords: ['spy', 's&p', 'sp500'] },
  { symbol: 'TSLA', name: 'Tesla', category: 'stocks', timeFrames: ['daily'], keywords: ['tesla', 'tsla'] },
  { symbol: 'AAPL', name: 'Apple', category: 'stocks', timeFrames: ['daily'], keywords: ['apple', 'aapl'] },
  { symbol: 'GOOGL', name: 'Google', category: 'stocks', timeFrames: ['daily'], keywords: ['google', 'googl', 'alphabet'] },
  { symbol: 'NVDA', name: 'NVIDIA', category: 'stocks', timeFrames: ['daily'], keywords: ['nvidia', 'nvda'] },

  // Commodities - daily
  { symbol: 'GOLD', name: 'Gold', category: 'commodities', timeFrames: ['daily'], keywords: ['gold', 'xau'] },
];
