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

export const BINANCE_SYMBOLS: Record<Asset, string> = {
  BTC: 'BTCUSDT',
  ETH: 'ETHUSDT',
  SOL: 'SOLUSDT',
  XRP: 'XRPUSDT',
}

export const BINANCE_INTERVALS: Record<Timeframe, string> = {
  '15m': '15m',
  '1H': '1h',
  '4H': '4h',
  '1D': '1d',
  '1W': '1w',
  '1M': '1M',
}

export const BINANCE_LIMITS: Record<Timeframe, number> = {
  '15m': 200,
  '1H': 200,
  '4H': 200,
  '1D': 200,
  '1W': 100,
  '1M': 48,
}

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  '15m': '15m',
  '1H': '1H',
  '4H': '4H',
  '1D': '1D',
  '1W': '1W',
  '1M': '1M',
}
