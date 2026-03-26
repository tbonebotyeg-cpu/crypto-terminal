'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Candle, MarketStats, DataSource, Asset, Timeframe } from '../types/market'

interface MarketDataState {
  candles: Candle[]
  stats: MarketStats | null
  source: DataSource
  lastFetch: number | null
  isLoading: boolean
  error: string | null
}

const POLL_INTERVAL_MS = 30_000
const SIM_RETRY_INTERVAL_MS = 120_000

export function useMarketData(asset: Asset, timeframe: Timeframe) {
  const [state, setState] = useState<MarketDataState>({
    candles: [],
    stats: null,
    source: 'live',
    lastFetch: null,
    isLoading: true,
    error: null,
  })

  const failureCountRef = useRef(0)
  const inSimModeRef = useRef(false)
  const simRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/market?asset=${asset}&timeframe=${timeframe}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      failureCountRef.current = 0
      if (data.source === 'live') inSimModeRef.current = false

      setState(prev => {
        let candles = data.candles as Candle[]
        if (prev.candles.length && candles.length && data.source === 'live') {
          const prevLast = prev.candles[prev.candles.length - 1]
          const newLast = candles[candles.length - 1]
          if (prevLast.time === newLast.time && !prev.isLoading) {
            candles = [...prev.candles.slice(0, -1), newLast]
          }
        }
        return {
          candles,
          stats: data.stats,
          source: data.source,
          lastFetch: Date.now(),
          isLoading: false,
          error: null,
        }
      })
    } catch (err) {
      failureCountRef.current++
      if (failureCountRef.current >= 3 && !inSimModeRef.current) {
        inSimModeRef.current = true
        if (simRetryRef.current) clearTimeout(simRetryRef.current)
        simRetryRef.current = setTimeout(() => {
          failureCountRef.current = 0
          inSimModeRef.current = false
          fetchData()
        }, SIM_RETRY_INTERVAL_MS)
      }
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Fetch failed',
      }))
    }
  }, [asset, timeframe])

  useEffect(() => {
    setState(prev => ({ ...prev, isLoading: true, candles: [], stats: null }))
    failureCountRef.current = 0

    if (pollRef.current) clearInterval(pollRef.current)
    fetchData()
    pollRef.current = setInterval(fetchData, POLL_INTERVAL_MS)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (simRetryRef.current) clearTimeout(simRetryRef.current)
    }
  }, [asset, timeframe, fetchData])

  return state
}
