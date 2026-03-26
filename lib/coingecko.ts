import { Asset, Candle, MarketStats, ASSET_IDS } from '../types/market'

// Prices via CoinMarketCap (authenticated, reliable)
const CMC_BASE = 'https://pro-api.coinmarketcap.com/v1'

// OHLCV via CoinGecko (free tier, no OHLCV on CMC free plan)
const CG_BASE = 'https://api.coingecko.com/api/v3'

function cgHeaders(): HeadersInit {
  return {
    'Accept': 'application/json',
    'User-Agent': 'CryptoTerminal/1.0',
  }
}

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

export async function fetchOHLCV(asset: Asset, days: number): Promise<Candle[]> {
  const id = ASSET_IDS[asset]
  const url = `${CG_BASE}/coins/${id}/ohlc?vs_currency=usd&days=${days}`
  const res = await fetch(url, { next: { revalidate: 300 }, headers: cgHeaders() })
  if (!res.ok) throw new Error(`CoinGecko OHLCV ${res.status}: ${await res.text()}`)
  const raw: [number, number, number, number, number][] = await res.json()
  // CoinGecko returns [timestamp_ms, open, high, low, close] — no volume
  return raw.map(([ts, o, h, l, c]) => ({
    time: Math.floor(ts / 1000),
    open: o,
    high: h,
    low: l,
    close: c,
    volume: 0,
  }))
}
