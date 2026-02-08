import type { VercelRequest, VercelResponse } from '@vercel/node';

// Fetch Kalshi markets
async function fetchKalshi() {
  try {
    const response = await fetch(
      'https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=200',
      { headers: { 'Accept': 'application/json' } }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.markets || [];
  } catch (e) {
    console.error('Kalshi error:', e);
    return [];
  }
}

// Fetch Polymarket markets
async function fetchPolymarket() {
  try {
    const response = await fetch(
      'https://clob.polymarket.com/markets?limit=100',
      { headers: { 'Accept': 'application/json' } }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : (data.markets || data.data || []);
  } catch (e) {
    console.error('Polymarket error:', e);
    return [];
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const [kalshi, polymarket] = await Promise.all([
      fetchKalshi(),
      fetchPolymarket(),
    ]);

    return res.status(200).json({
      success: true,
      kalshi,
      polymarket,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
