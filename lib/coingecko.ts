import { Asset, Candle, MarketStats, ASSET_IDS } from '../types/market'

const BASE = 'https://api.coingecko.com/api/v3'

export async function fetchPrice(assets: Asset[]): Promise<Record<Asset, MarketStats>> {
  const ids = assets.map(a => ASSET_IDS[a]).join(',')
  const url = `${BASE}/simple/price?ids=${ids}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`
  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`CoinGecko price ${res.status}`)
  const data = await res.json()
  const result = {} as Record<Asset, MarketStats>
  for (const asset of assets) {
    const d = data[ASSET_IDS[asset]]
    if (!d) continue
    result[asset] = {
      price: d.usd,
      change24h: d.usd_24h_change ?? 0,
      volume24h: d.usd_24h_vol ?? 0,
      marketCap: d.usd_market_cap ?? 0,
    }
  }
  return result
}

export async function fetchOHLCV(asset: Asset, days: number): Promise<Candle[]> {
  const id = ASSET_IDS[asset]
  const url = `${BASE}/coins/${id}/ohlc?vs_currency=usd&days=${days}`
  const res = await fetch(url, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`CoinGecko OHLCV ${res.status}`)
  const raw: [number, number, number, number, number][] = await res.json()
  // CoinGecko returns [timestamp_ms, open, high, low, close] — no volume
  return raw.map(([ts, o, h, l, c]) => ({
    time: Math.floor(ts / 1000),
    open: o,
    high: h,
    low: l,
    close: c,
    volume: 0,   // CoinGecko OHLC endpoint does not include volume
  }))
}
