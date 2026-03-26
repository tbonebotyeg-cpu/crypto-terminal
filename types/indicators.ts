export type Signal = 'BULLISH' | 'BEARISH' | 'NEUTRAL'

export type IndicatorGroup = 'trend' | 'momentum' | 'volatility' | 'volume' | 'statistical' | 'structure'

export interface IndicatorResult {
  id: string
  name: string
  group: IndicatorGroup
  value: number
  signal: Signal
  strength: number    // 0–100
  label: string       // display string e.g. "RSI: 34.2"
}

export interface IndicatorWeights {
  trend: number        // 0–2, default 1
  momentum: number
  volatility: number
  volume: number
  statistical: number
  structure: number
}

export const DEFAULT_WEIGHTS: IndicatorWeights = {
  trend: 1,
  momentum: 1,
  volatility: 0.7,
  volume: 0.8,
  statistical: 0.9,
  structure: 1,
}

export interface AggregateScore {
  score: number         // 0–100 (0=pure bear, 100=pure bull, 50=neutral)
  bullCount: number
  bearCount: number
  neutralCount: number
}
