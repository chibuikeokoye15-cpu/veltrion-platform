const ASSETS = [
  { symbol: 'BTC', id: 'bitcoin', pair: 'BTCUSDT' },
  { symbol: 'ETH', id: 'ethereum', pair: 'ETHUSDT' },
  { symbol: 'USDT', id: 'tether', pair: null },
  { symbol: 'BNB', id: 'binancecoin', pair: 'BNBUSDT' },
  { symbol: 'SOL', id: 'solana', pair: 'SOLUSDT' },
  { symbol: 'XRP', id: 'ripple', pair: 'XRPUSDT' },
  { symbol: 'DOGE', id: 'dogecoin', pair: 'DOGEUSDT' },
  { symbol: 'ADA', id: 'cardano', pair: 'ADAUSDT' },
];

async function fetchJson(url, timeoutMs = 4000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fromCoinGecko() {
  const ids = ASSETS.map(asset => asset.id).join(',');
  const rows = await fetchJson(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(ids)}&price_change_percentage=24h`);
  if (!Array.isArray(rows)) throw new Error('CoinGecko returned an invalid response');
  const byId = new Map(rows.map(row => [row.id, row]));
  const data = ASSETS.map(asset => {
    const row = byId.get(asset.id);
    return { symbol: asset.symbol, price: Number(row?.current_price), change24h: Number(row?.price_change_percentage_24h ?? 0) };
  });
  if (data.some(row => !Number.isFinite(row.price) || row.price <= 0 || !Number.isFinite(row.change24h))) {
    throw new Error('CoinGecko response was incomplete');
  }
  return { provider: 'CoinGecko', data };
}

async function fromBinance() {
  const pairs = ASSETS.filter(asset => asset.pair).map(asset => asset.pair);
  const rows = await fetchJson(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(pairs))}`);
  if (!Array.isArray(rows)) throw new Error('Binance returned an invalid response');
  const byPair = new Map(rows.map(row => [row.symbol, row]));
  const data = ASSETS.map(asset => {
    if (asset.symbol === 'USDT') return { symbol: 'USDT', price: 1, change24h: 0 };
    const row = byPair.get(asset.pair);
    return { symbol: asset.symbol, price: Number(row?.lastPrice), change24h: Number(row?.priceChangePercent) };
  });
  if (data.some(row => !Number.isFinite(row.price) || row.price <= 0 || !Number.isFinite(row.change24h))) {
    throw new Error('Binance response was incomplete');
  }
  return { provider: 'Binance', data };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // Public market quotes only. No credentials or user data are involved.
  res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=40');
  try {
    const result = await fromCoinGecko();
    return res.status(200).json({ ...result, updatedAt: new Date().toISOString() });
  } catch (coinGeckoError) {
    try {
      const result = await fromBinance();
      return res.status(200).json({ ...result, updatedAt: new Date().toISOString() });
    } catch (binanceError) {
      return res.status(503).json({
        error: 'Live market providers are temporarily unavailable.',
        providers: { coinGecko: coinGeckoError?.message || 'unavailable', binance: binanceError?.message || 'unavailable' },
      });
    }
  }
}
