export type Direction = 'LONG' | 'SHORT'

export interface TradeSetup {
  id: string
  direction: Direction
  entry: number
  stopLoss: number
  tp1: number
  tp2: number
  rrRatio: number        // risk:reward (e.g. 1.5)
  winProbability: number // 0–100, based on confluence score
  confirmingCount: number
  totalIndicators: number
  isPremiumSetup: boolean
  positionSizePct: number  // % of account to risk
  detectedAt: number       // Unix ms timestamp
  asset: string
  timeframe: string
}

export interface PriceLine {
  price: number
  color: string
  lineWidth: number
  lineStyle: number
  label: string
}
