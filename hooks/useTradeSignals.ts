'use client'

import { useState, useEffect } from 'react'
import { Candle, Asset, Timeframe } from '../types/market'
import { IndicatorResult, IndicatorWeights, DEFAULT_WEIGHTS } from '../types/indicators'
import { TradeSetup } from '../types/signals'
import { detectTradeSetup } from '../lib/signals'

export function useTradeSignals(
  candles: Candle[],
  results: IndicatorResult[],
  asset: Asset,
  timeframe: Timeframe,
  weights: IndicatorWeights = DEFAULT_WEIGHTS,
  accountSize = 10000,
  higherTFCandles?: Candle[]
): TradeSetup[] {
  const [setups, setSetups] = useState<TradeSetup[]>([])

  useEffect(() => {
    if (!results.length || !candles.length) {
      setSetups([])
      return
    }
    const setup = detectTradeSetup(
      candles, results, weights, accountSize,
      asset, timeframe, higherTFCandles
    )
    if (setup) {
      setSetups(prev => {
        const filtered = prev.filter(s => !(s.asset === asset && s.timeframe === timeframe))
        return [setup, ...filtered].slice(0, 5)
      })
    } else {
      setSetups(prev => prev.filter(s => !(s.asset === asset && s.timeframe === timeframe)))
    }
  }, [results, candles, asset, timeframe, weights, accountSize, higherTFCandles])

  return setups
}
