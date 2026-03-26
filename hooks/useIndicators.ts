'use client'

import { useState, useEffect, useRef } from 'react'
import { Candle } from '../types/market'
import { IndicatorResult, IndicatorWeights, AggregateScore, DEFAULT_WEIGHTS } from '../types/indicators'
import { runAllIndicators } from '../lib/indicators'
import { computeAggregateScore } from '../lib/signals'

interface IndicatorsState {
  results: IndicatorResult[]
  aggregate: AggregateScore
}

const DEBOUNCE_MS = 500

export function useIndicators(candles: Candle[], weights: IndicatorWeights = DEFAULT_WEIGHTS): IndicatorsState {
  const [state, setState] = useState<IndicatorsState>({
    results: [],
    aggregate: { score: 50, bullCount: 0, bearCount: 0, neutralCount: 0 },
  })

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!candles.length) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const results = runAllIndicators(candles)
      const aggregate = computeAggregateScore(results, weights)
      setState({ results, aggregate })
    }, DEBOUNCE_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [candles, weights])

  return state
}
