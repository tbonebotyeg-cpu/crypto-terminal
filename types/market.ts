export type AssetCategory = 'crypto' | 'commodity' | 'index'

export type DataProvider = 'crypto_com' | 'yahoo'

export type Asset =
  | 'BTC' | 'ETH' | 'SOL' | 'XRP'
  | 'DOGE' | 'ADA' | 'AVAX' | 'LINK' | 'DOT'
  | 'PAXG'  // Gold (Paxos Gold)
  | 'SPX'   // S&P 500
  | 'OIL'   // WTI Crude
  | 'DJI'   // Dow Jones

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
  high24h?: number
  low24h?: number
}

export interface MarketData {
  candles: Candle[]
  stats: MarketStats
  source: DataSource
  lastFetch: number    // Unix ms timestamp
}

export interface AssetConfig {
  symbol: Asset
  name: string
  category: AssetCategory
  provider: DataProvider
  instrumentName: string
  decimals: number
  fallbackPrice: number
}

export const ASSET_REGISTRY: Record<Asset, AssetConfig> = {
  BTC:  { symbol: 'BTC',  name: 'Bitcoin',       category: 'crypto',    provider: 'crypto_com', instrumentName: 'BTC_USDT',  decimals: 0, fallbackPrice: 68000 },
  ETH:  { symbol: 'ETH',  name: 'Ethereum',      category: 'crypto',    provider: 'crypto_com', instrumentName: 'ETH_USDT',  decimals: 2, fallbackPrice: 2100 },
  SOL:  { symbol: 'SOL',  name: 'Solana',        category: 'crypto',    provider: 'crypto_com', instrumentName: 'SOL_USDT',  decimals: 2, fallbackPrice: 83 },
  XRP:  { symbol: 'XRP',  name: 'XRP',           category: 'crypto',    provider: 'crypto_com', instrumentName: 'XRP_USDT',  decimals: 4, fallbackPrice: 1.35 },
  DOGE: { symbol: 'DOGE', name: 'Dogecoin',      category: 'crypto',    provider: 'crypto_com', instrumentName: 'DOGE_USDT', decimals: 4, fallbackPrice: 0.17 },
  ADA:  { symbol: 'ADA',  name: 'Cardano',       category: 'crypto',    provider: 'crypto_com', instrumentName: 'ADA_USDT',  decimals: 4, fallbackPrice: 0.70 },
  AVAX: { symbol: 'AVAX', name: 'Avalanche',     category: 'crypto',    provider: 'crypto_com', instrumentName: 'AVAX_USDT', decimals: 2, fallbackPrice: 22 },
  LINK: { symbol: 'LINK', name: 'Chainlink',     category: 'crypto',    provider: 'crypto_com', instrumentName: 'LINK_USDT', decimals: 2, fallbackPrice: 14 },
  DOT:  { symbol: 'DOT',  name: 'Polkadot',      category: 'crypto',    provider: 'crypto_com', instrumentName: 'DOT_USDT',  decimals: 2, fallbackPrice: 4.5 },
  PAXG: { symbol: 'PAXG', name: 'Gold (PAXG)',   category: 'commodity', provider: 'crypto_com', instrumentName: 'PAXG_USDT', decimals: 2, fallbackPrice: 3100 },
  SPX:  { symbol: 'SPX',  name: 'S&P 500',       category: 'index',     provider: 'yahoo',      instrumentName: '^GSPC',     decimals: 0, fallbackPrice: 5600 },
  OIL:  { symbol: 'OIL',  name: 'WTI Crude',     category: 'commodity', provider: 'yahoo',      instrumentName: 'CL=F',      decimals: 2, fallbackPrice: 70 },
  DJI:  { symbol: 'DJI',  name: 'Dow Jones',     category: 'index',     provider: 'yahoo',      instrumentName: '^DJI',      decimals: 0, fallbackPrice: 42000 },
}

export const ALL_ASSETS = Object.keys(ASSET_REGISTRY) as Asset[]

// Crypto.com candlestick timeframe strings
export const CRYPTO_COM_TIMEFRAMES: Record<Timeframe, string> = {
  '15m': '15m',
  '1H': '1h',
  '4H': '4h',
  '1D': '1D',
  '1W': '1W',
  '1M': '1M',
}

// Yahoo Finance timeframe mapping
export const YAHOO_TIMEFRAMES: Record<Timeframe, { interval: string; range: string }> = {
  '15m': { interval: '15m', range: '5d' },
  '1H':  { interval: '1h',  range: '12d' },
  '4H':  { interval: '1h',  range: '30d' },  // fetch 1h, resample to 4h
  '1D':  { interval: '1d',  range: '1y' },
  '1W':  { interval: '1wk', range: '5y' },
  '1M':  { interval: '1mo', range: '10y' },
}

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  '15m': '15m',
  '1H': '1H',
  '4H': '4H',
  '1D': '1D',
  '1W': '1W',
  '1M': '1M',
}
