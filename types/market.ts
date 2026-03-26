export type Asset = 'BTC' | 'ETH' | 'SOL' | 'XRP'

export type Timeframe = '15m' | '1H' | '4H' | '1D' | '1W' | '1M'

export type DataSource = 'live' | 'sim'

export interface Candle {
  time: number   // Unix timestamp (seconds)
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface MarketStats {
  price: number
  change24h: number     // percentage
  volume24h: number
  marketCap: number
}

export interface MarketData {
  candles: Candle[]
  stats: MarketStats
  source: DataSource
  lastFetch: number    // Unix ms timestamp
}

export const ASSET_IDS: Record<Asset, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  XRP: 'ripple',
}

export const TIMEFRAME_DAYS: Record<Timeframe, number> = {
  '15m': 1,
  '1H': 2,
  '4H': 14,
  '1D': 90,
  '1W': 365,
  '1M': 365,
}

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  '15m': '30m*',  // CoinGecko free tier returns 30m candles for days=1
  '1H': '1H',
  '4H': '4H',
  '1D': '1D',
  '1W': '1W',
  '1M': '1M',
}
