import { Market } from '../types.js';

// Demo data for testing when APIs are unavailable
// These represent realistic market scenarios

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(23, 59, 59, 0);

const endOfDay = new Date();
endOfDay.setHours(23, 59, 59, 0);

const endOfWeek = new Date();
endOfWeek.setDate(endOfWeek.getDate() + 7);

export function getDemoPolymarketMarkets(): Market[] {
  return [
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
}

export function getDemoKalshiMarkets(): Market[] {
  return [
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
}
