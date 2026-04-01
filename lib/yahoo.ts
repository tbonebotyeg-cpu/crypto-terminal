import { Candle, MarketStats, Timeframe, YAHOO_TIMEFRAMES } from '../types/market'

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart'

export async function fetchYahooPrice(ticker: string): Promise<MarketStats> {
  const url = `${YAHOO_BASE}/${encodeURIComponent(ticker)}?interval=1d&range=2d`
  const res = await fetch(url, {
    next: { revalidate: 60 },
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })
  if (res.status === 429) throw new Error('Yahoo rate limited (429) — back off')
  if (!res.ok) throw new Error(`Yahoo ticker ${res.status}`)
  const json = await res.json()
  const meta = json.chart?.result?.[0]?.meta
  if (!meta) throw new Error('No Yahoo meta data')
  const price = meta.regularMarketPrice ?? 0
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price
  const change24h = prevClose ? ((price - prevClose) / prevClose) * 100 : 0
  const volume = meta.regularMarketVolume ?? 0
  const high24h = meta.regularMarketDayHigh ?? undefined
  const low24h = meta.regularMarketDayLow ?? undefined
  return { price, change24h, volume24h: volume * price, marketCap: 0, high24h, low24h }
}

export async function fetchYahooOHLCV(ticker: string, timeframe: Timeframe): Promise<Candle[]> {
  const { interval, range } = YAHOO_TIMEFRAMES[timeframe]
  const url = `${YAHOO_BASE}/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`
  const res = await fetch(url, {
    next: { revalidate: 60 },
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })
  if (res.status === 429) throw new Error('Yahoo OHLCV rate limited (429) — back off')
  if (!res.ok) throw new Error(`Yahoo OHLCV ${res.status}`)
  const json = await res.json()
  const result = json.chart?.result?.[0]
  if (!result) throw new Error('No Yahoo chart data')
  const timestamps: number[] = result.timestamp ?? []
  const quote = result.indicators?.quote?.[0]
  if (!quote) throw new Error('No Yahoo quote data')

  let candles: Candle[] = []
  for (let i = 0; i < timestamps.length; i++) {
    if (quote.open[i] == null || quote.close[i] == null || quote.high[i] == null || quote.low[i] == null) continue
    candles.push({
      time: timestamps[i],
      open: quote.open[i],
      high: quote.high[i],
      low: quote.low[i],
      close: quote.close[i],
      volume: quote.volume?.[i] ?? 0,
    })
  }
  candles.sort((a, b) => a.time - b.time)

  // Resample 1h → 4h if needed
  if (timeframe === '4H' && interval === '1h') {
    candles = resample4H(candles)
  }

  return candles
}

function resample4H(hourly: Candle[]): Candle[] {
  if (!hourly.length) return []
  const groups = new Map<number, Candle[]>()
  for (const c of hourly) {
    const key = Math.floor(c.time / (4 * 3600)) * (4 * 3600)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(c)
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a - b)
    .map(([time, cs]) => ({
      time,
      open: cs[0].open,
      high: Math.max(...cs.map(c => c.high)),
      low: Math.min(...cs.map(c => c.low)),
      close: cs[cs.length - 1].close,
      volume: cs.reduce((a, c) => a + c.volume, 0),
    }))
}
