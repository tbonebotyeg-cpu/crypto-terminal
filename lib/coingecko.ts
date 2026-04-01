import { Asset, Candle, MarketStats, Timeframe, ASSET_REGISTRY, CRYPTO_COM_TIMEFRAMES } from '../types/market'

const CDC_BASE = 'https://api.crypto.com/exchange/v1/public'

// Fetch current price + 24h stats from Crypto.com ticker endpoint
export async function fetchPrice(assets: Asset[]): Promise<Record<Asset, MarketStats>> {
  const result = {} as Record<Asset, MarketStats>

  // Fetch all tickers in parallel
  const fetches = assets.map(async (asset) => {
    const instrument = ASSET_REGISTRY[asset].instrumentName
    const url = `${CDC_BASE}/get-tickers?instrument_name=${instrument}`
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error(`CDC ticker ${res.status}: ${await res.text()}`)
    const json = await res.json()
    const data = json?.result?.data?.[0] ?? json?.data?.[0] ?? json
    const price = parseFloat(data.a ?? data.last ?? '0')  // 'a' = last trade price
    const change = parseFloat(data.c ?? data.change ?? '0') * 100 // 'c' = 24h change ratio
    const vol = parseFloat(data.v ?? data.volume ?? '0')  // 'v' = 24h volume
    const volValue = parseFloat(data.vv ?? data.volume_value ?? '0') // 'vv' = 24h volume in USD
    const high24h = parseFloat(data.h ?? data.high ?? '0')
    const low24h = parseFloat(data.l ?? data.low ?? '0')
    result[asset] = {
      price,
      change24h: change,
      volume24h: volValue || vol * price,
      marketCap: 0,
      high24h: high24h || undefined,
      low24h: low24h || undefined,
    }
  })

  await Promise.all(fetches)
  return result
}

// Fetch OHLCV candles from Crypto.com candlestick endpoint
export async function fetchOHLCV(asset: Asset, timeframe: Timeframe): Promise<Candle[]> {
  const instrument = ASSET_REGISTRY[asset].instrumentName
  const tf = CRYPTO_COM_TIMEFRAMES[timeframe]
  const url = `${CDC_BASE}/get-candlestick?instrument_name=${instrument}&timeframe=${tf}&count=300`
  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`CDC OHLCV ${res.status}: ${await res.text()}`)
  const json = await res.json()
  const data = json?.result?.data ?? json?.data ?? []

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No candle data returned from Crypto.com')
  }

  return data
    .map((k: Record<string, string | number>) => {
      // t can be a Unix ms number or timestamp can be an ISO string
      const rawTime = k.t ?? k.timestamp
      const timeMs = typeof rawTime === 'number' ? rawTime : new Date(String(rawTime)).getTime()
      return {
        time: Math.floor(timeMs / 1000),
        open: parseFloat(String(k.o ?? k.open)),
        high: parseFloat(String(k.h ?? k.high)),
        low: parseFloat(String(k.l ?? k.low)),
        close: parseFloat(String(k.c ?? k.close)),
        volume: parseFloat(String(k.v ?? k.volume)),
      }
    })
    .sort((a: Candle, b: Candle) => a.time - b.time)
}
