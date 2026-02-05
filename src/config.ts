import dotenv from 'dotenv';

dotenv.config();

export const config = {
  kalshi: {
    baseUrl: 'https://api.elections.kalshi.com/trade-api/v2',
    apiKey: process.env.KALSHI_API_KEY || '',
    apiSecret: process.env.KALSHI_API_SECRET || '',
  },
  polymarket: {
    // Polymarket uses CLOB API for market data
    clobBaseUrl: 'https://clob.polymarket.com',
    gammaBaseUrl: 'https://gamma-api.polymarket.com',
  },
  refreshInterval: parseInt(process.env.REFRESH_INTERVAL || '30', 10) * 1000,
  minArbitragePercent: parseFloat(process.env.MIN_ARBITRAGE_PERCENT || '1.0'),
};
