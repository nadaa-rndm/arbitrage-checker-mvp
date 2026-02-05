import axios, { AxiosInstance } from 'axios';
import { Market, Outcome, AssetCategory, TRACKED_ASSETS } from '../types.js';
import { config } from '../config.js';

interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  markets: PolymarketMarket[];
  endDate?: string;
  volume?: number;
}

interface PolymarketMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  outcomePrices: string; // JSON string of prices
  outcomes: string; // JSON string of outcome names
  volume: string;
  liquidity: string;
  endDate?: string;
  active: boolean;
  closed: boolean;
}

export class PolymarketClient {
  private gammaClient: AxiosInstance;
  private clobClient: AxiosInstance;

  constructor() {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (compatible; ArbitrageChecker/1.0)',
      'Accept': 'application/json',
    };

    this.gammaClient = axios.create({
      baseURL: config.polymarket.gammaBaseUrl,
      timeout: 15000,
      headers,
    });

    this.clobClient = axios.create({
      baseURL: config.polymarket.clobBaseUrl,
      timeout: 15000,
      headers,
    });
  }

  async getMarkets(): Promise<Market[]> {
    const markets: Market[] = [];

    try {
      // Fetch events from Gamma API - this gives us structured market data
      const response = await this.gammaClient.get('/events', {
        params: {
          active: true,
          closed: false,
          limit: 100,
        },
      });

      const events: PolymarketEvent[] = response.data || [];

      for (const event of events) {
        const parsedMarkets = this.parseEvent(event);
        markets.push(...parsedMarkets);
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError?.response?.status === 403) {
        console.log('Polymarket API access restricted. Using CLOB API fallback...');
      } else {
        console.error('Error fetching Polymarket events');
      }
    }

    // Also try to get markets directly via CLOB
    try {
      const response = await this.clobClient.get('/markets', {
        params: {
          limit: 100,
        },
      });

      const rawMarkets: PolymarketMarket[] = response.data || [];

      for (const rawMarket of rawMarkets) {
        const market = this.parseMarket(rawMarket);
        if (market && !markets.find(m => m.id === market.id)) {
          markets.push(market);
        }
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError?.response?.status !== 403) {
        console.error('Error fetching Polymarket markets');
      }
    }

    return markets;
  }

  async searchMarkets(query: string): Promise<Market[]> {
    const markets: Market[] = [];

    try {
      const response = await this.gammaClient.get('/events', {
        params: {
          active: true,
          closed: false,
          limit: 50,
          title: query,
        },
      });

      const events: PolymarketEvent[] = response.data || [];

      for (const event of events) {
        markets.push(...this.parseEvent(event));
      }
    } catch (error) {
      console.error(`Error searching Polymarket for "${query}":`, error);
    }

    return markets;
  }

  async getAssetMarkets(): Promise<Market[]> {
    const allMarkets: Market[] = [];

    // Search for each tracked asset
    for (const asset of TRACKED_ASSETS) {
      for (const keyword of asset.keywords) {
        const markets = await this.searchMarkets(keyword);
        for (const market of markets) {
          if (!allMarkets.find(m => m.id === market.id)) {
            // Tag the market with the asset
            market.asset = asset.symbol;
            market.category = asset.category;
            allMarkets.push(market);
          }
        }
      }
    }

    return allMarkets;
  }

  private parseEvent(event: PolymarketEvent): Market[] {
    const markets: Market[] = [];

    if (event.markets) {
      for (const rawMarket of event.markets) {
        const market = this.parseMarket(rawMarket, event);
        if (market) {
          markets.push(market);
        }
      }
    }

    return markets;
  }

  private parseMarket(rawMarket: PolymarketMarket, event?: PolymarketEvent): Market | null {
    if (!rawMarket.active || rawMarket.closed) {
      return null;
    }

    try {
      const outcomePrices = JSON.parse(rawMarket.outcomePrices || '[]');
      const outcomeNames = JSON.parse(rawMarket.outcomes || '["Yes", "No"]');

      const outcomes: Outcome[] = outcomeNames.map((name: string, index: number) => ({
        id: `${rawMarket.id}-${index}`,
        name,
        probability: parseFloat(outcomePrices[index] || '0'),
        price: parseFloat(outcomePrices[index] || '0'),
      }));

      const { asset, category } = this.detectAssetAndCategory(
        rawMarket.question,
        event?.title
      );

      return {
        id: rawMarket.id,
        platform: 'polymarket',
        title: rawMarket.question,
        description: event?.description,
        asset,
        category,
        endDate: rawMarket.endDate ? new Date(rawMarket.endDate) : undefined,
        outcomes,
        volume: parseFloat(rawMarket.volume || '0'),
        liquidity: parseFloat(rawMarket.liquidity || '0'),
        url: `https://polymarket.com/event/${event?.slug || rawMarket.slug}`,
      };
    } catch (error) {
      console.error('Error parsing Polymarket market:', rawMarket.id, error);
      return null;
    }
  }

  private detectAssetAndCategory(
    question: string,
    eventTitle?: string
  ): { asset?: string; category: AssetCategory } {
    const text = `${question} ${eventTitle || ''}`.toLowerCase();

    for (const assetConfig of TRACKED_ASSETS) {
      for (const keyword of assetConfig.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          return { asset: assetConfig.symbol, category: assetConfig.category };
        }
      }
    }

    // Try to detect category even if specific asset not found
    if (text.includes('price') || text.includes('above') || text.includes('below')) {
      if (text.includes('stock') || text.includes('share')) {
        return { category: 'stocks' };
      }
      if (text.includes('crypto') || text.includes('coin')) {
        return { category: 'crypto' };
      }
    }

    return { category: 'other' };
  }
}
