import { Asset, Candle, MarketStats, Timeframe, BINANCE_SYMBOLS, BINANCE_INTERVALS, BINANCE_LIMITS } from '../types/market'

// Prices via CoinMarketCap (authenticated, reliable)
const CMC_BASE = 'https://pro-api.coinmarketcap.com/v1'

function cmcHeaders(): HeadersInit {
  return {
    'Accept': 'application/json',
    'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY ?? '',
  }
}

export async function fetchPrice(assets: Asset[]): Promise<Record<Asset, MarketStats>> {
  const symbols = assets.join(',')
  const url = `${CMC_BASE}/cryptocurrency/quotes/latest?symbol=${symbols}&convert=USD`
  const res = await fetch(url, { next: { revalidate: 60 }, headers: cmcHeaders() })
  if (!res.ok) throw new Error(`CMC price ${res.status}: ${await res.text()}`)
  const json = await res.json()
  const result = {} as Record<Asset, MarketStats>
  for (const asset of assets) {
    // CMC returns an array per symbol; first entry is the canonical asset
    const entries = json.data?.[asset]
    const d = Array.isArray(entries) ? entries[0] : entries
    if (!d) continue
    const q = d.quote?.USD
    result[asset] = {
      price: q?.price ?? 0,
      change24h: q?.percent_change_24h ?? 0,
      volume24h: q?.volume_24h ?? 0,
      marketCap: q?.market_cap ?? 0,
    }
  }
  return result
}

export async function fetchOHLCV(asset: Asset, timeframe: Timeframe): Promise<Candle[]> {
  const symbol = BINANCE_SYMBOLS[asset]
  const interval = BINANCE_INTERVALS[timeframe]
  const limit = BINANCE_LIMITS[timeframe]
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`Binance OHLCV ${res.status}: ${await res.text()}`)
  // Binance returns [openTime, open, high, low, close, volume, ...]
  const raw: string[][] = await res.json()
  return raw.map(k => ({
    time: Math.floor(Number(k[0]) / 1000),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }))
}
