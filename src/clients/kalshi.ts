import axios, { AxiosInstance } from 'axios';
import { Market, Outcome, AssetCategory, TRACKED_ASSETS } from '../types.js';
import { config } from '../config.js';

interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  title: string;
  subtitle?: string;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  last_price: number;
  volume: number;
  open_interest: number;
  close_time: string;
  status: string;
  result?: string;
  category: string;
}

interface KalshiEvent {
  event_ticker: string;
  title: string;
  category: string;
  markets: KalshiMarket[];
}

export class KalshiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.kalshi.baseUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; ArbitrageChecker/1.0)',
        'Accept': 'application/json',
      },
    });

    // Add auth if credentials provided
    if (config.kalshi.apiKey && config.kalshi.apiSecret) {
      // Kalshi uses different auth methods - for public data we don't need auth
    }
  }

  async getMarkets(): Promise<Market[]> {
    const markets: Market[] = [];

    try {
      // Fetch all active markets
      const response = await this.client.get('/markets', {
        params: {
          status: 'open',
          limit: 200,
        },
      });

      const rawMarkets: KalshiMarket[] = response.data?.markets || [];

      for (const rawMarket of rawMarkets) {
        const market = this.parseMarket(rawMarket);
        if (market) {
          markets.push(market);
        }
      }
    } catch (error) {
      console.error('Error fetching Kalshi markets:', error);
    }

    return markets;
  }

  async getEvents(): Promise<Market[]> {
    const markets: Market[] = [];

    try {
      const response = await this.client.get('/events', {
        params: {
          status: 'open',
          limit: 100,
        },
      });

      const events: KalshiEvent[] = response.data?.events || [];

      for (const event of events) {
        if (event.markets) {
          for (const rawMarket of event.markets) {
            const market = this.parseMarket(rawMarket, event);
            if (market) {
              markets.push(market);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching Kalshi events:', error);
    }

    return markets;
  }

  async searchMarkets(query: string): Promise<Market[]> {
    const allMarkets = await this.getMarkets();
    const queryLower = query.toLowerCase();

    return allMarkets.filter(
      market =>
        market.title.toLowerCase().includes(queryLower) ||
        market.description?.toLowerCase().includes(queryLower) ||
        market.asset?.toLowerCase().includes(queryLower)
    );
  }

  async getAssetMarkets(): Promise<Market[]> {
    const allMarkets = await this.getMarkets();
    const assetMarkets: Market[] = [];

    for (const market of allMarkets) {
      const textToSearch = `${market.title} ${market.description || ''}`.toLowerCase();

      for (const assetConfig of TRACKED_ASSETS) {
        let matched = false;
        for (const keyword of assetConfig.keywords) {
          if (textToSearch.includes(keyword.toLowerCase())) {
            market.asset = assetConfig.symbol;
            market.category = assetConfig.category;
            if (!assetMarkets.find(m => m.id === market.id)) {
              assetMarkets.push(market);
            }
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
    }

    return assetMarkets;
  }

  private parseMarket(rawMarket: KalshiMarket, event?: KalshiEvent): Market | null {
    if (rawMarket.status !== 'open' || rawMarket.result) {
      return null;
    }

    // Calculate mid prices for outcomes
    const yesMid = (rawMarket.yes_bid + rawMarket.yes_ask) / 2 / 100;
    const noMid = (rawMarket.no_bid + rawMarket.no_ask) / 2 / 100;

    const outcomes: Outcome[] = [
      {
        id: `${rawMarket.ticker}-yes`,
        name: 'Yes',
        probability: yesMid,
        price: yesMid,
      },
      {
        id: `${rawMarket.ticker}-no`,
        name: 'No',
        probability: noMid,
        price: noMid,
      },
    ];

    const { asset, category } = this.detectAssetAndCategory(
      rawMarket.title,
      rawMarket.subtitle,
      event?.title,
      rawMarket.category
    );

    return {
      id: rawMarket.ticker,
      platform: 'kalshi',
      title: rawMarket.title,
      description: rawMarket.subtitle,
      asset,
      category,
      endDate: new Date(rawMarket.close_time),
      outcomes,
      volume: rawMarket.volume,
      liquidity: rawMarket.open_interest,
      url: `https://kalshi.com/markets/${rawMarket.event_ticker}`,
    };
  }

  private detectAssetAndCategory(
    title: string,
    subtitle?: string,
    eventTitle?: string,
    kalshiCategory?: string
  ): { asset?: string; category: AssetCategory } {
    const text = `${title} ${subtitle || ''} ${eventTitle || ''}`.toLowerCase();

    // First check tracked assets
    for (const assetConfig of TRACKED_ASSETS) {
      for (const keyword of assetConfig.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          return { asset: assetConfig.symbol, category: assetConfig.category };
        }
      }
    }

    // Map Kalshi categories
    if (kalshiCategory) {
      const catLower = kalshiCategory.toLowerCase();
      if (catLower.includes('crypto')) {
        return { category: 'crypto' };
      }
      if (catLower.includes('financial') || catLower.includes('stock')) {
        return { category: 'stocks' };
      }
      if (catLower.includes('commodit')) {
        return { category: 'commodities' };
      }
    }

    return { category: 'other' };
  }
}
