'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Candle } from '../types/market'
import { IndicatorResult } from '../types/indicators'
import { TradeSetup } from '../types/signals'

interface Props {
  candles: Candle[]
  results: IndicatorResult[]
  setups: TradeSetup[]
  alertPrices?: number[]
  currentPrice?: number
  asset?: string
}

// Shared types for chart objects
type ChartApi = {
  addSeries: (def: unknown, opts: unknown) => SeriesApi
  priceScale: (id: string) => { applyOptions: (o: unknown) => void }
  timeScale: () => { fitContent: () => void }
  applyOptions: (o: unknown) => void
  remove: () => void
  removeSeries: (s: unknown) => void
}
type SeriesApi = {
  setData: (d: unknown) => void
  update: (d: unknown) => void
  createPriceLine: (opts: unknown) => unknown
  removePriceLine: (line: unknown) => void
}

export default function Chart({ candles, results, setups, alertPrices = [], asset }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ChartApi | null>(null)
  const candleSeriesRef = useRef<SeriesApi | null>(null)
  const volumeSeriesRef = useRef<SeriesApi | null>(null)
  const overlaySeriesRef = useRef<Map<string, SeriesApi>>(new Map())
  const priceLinesRef = useRef<{ series: SeriesApi; line: unknown }[]>([])
  const prevCandleLengthRef = useRef(0)
  const prevFirstTimeRef = useRef(0)
  const lwsLineSeriesRef = useRef<unknown>(null)
  const candlesRef = useRef<Candle[]>([])
  const roRef = useRef<ResizeObserver | null>(null)

  // Keep candlesRef in sync
  candlesRef.current = candles

  const applyCandles = useCallback((candleData: Candle[]) => {
    if (!candleSeriesRef.current || !candleData.length) return
    const formatted = candleData.map(c => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close }))
    const volumes = candleData.map(c => ({ time: c.time, value: c.volume, color: c.close >= c.open ? '#10b98130' : '#ef444430' }))

    const firstTime = candleData[0].time
    const isNewSeries = candleData.length !== prevCandleLengthRef.current
      || prevCandleLengthRef.current === 0
      || firstTime !== prevFirstTimeRef.current

    if (isNewSeries) {
      candleSeriesRef.current.setData(formatted)
      volumeSeriesRef.current?.setData(volumes)
      prevCandleLengthRef.current = candleData.length
      prevFirstTimeRef.current = firstTime
      chartRef.current?.timeScale().fitContent()
    } else {
      candleSeriesRef.current.update(formatted[formatted.length - 1])
      if (volumes.length) volumeSeriesRef.current?.update(volumes[volumes.length - 1])
    }
  }, [])

  // Init chart once
  useEffect(() => {
    if (!containerRef.current) return
    let disposed = false

    import('lightweight-charts').then(({ createChart, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries, LineSeries: LWSLineSeries }) => {
      if (disposed || !containerRef.current) return

      const chart = createChart(containerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#0a1628' },
          textColor: '#94a3b8',
        },
        grid: {
          vertLines: { color: '#1e3a5f' },
          horzLines: { color: '#1e3a5f' },
        },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: '#1e3a5f' },
        timeScale: { borderColor: '#1e3a5f', timeVisible: true, secondsVisible: false },
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      })

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      })

      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' as const },
        priceScaleId: 'volume',
      })
      chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } })

      chartRef.current = chart as unknown as ChartApi
      candleSeriesRef.current = candleSeries as unknown as SeriesApi
      volumeSeriesRef.current = volumeSeries as unknown as SeriesApi
      lwsLineSeriesRef.current = LWSLineSeries

      // Apply any candles that arrived before chart was ready
      if (candlesRef.current.length) {
        applyCandles(candlesRef.current)
      }

      const ro = new ResizeObserver(() => {
        if (containerRef.current) {
          chart.applyOptions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
          })
        }
      })
      ro.observe(containerRef.current)
      roRef.current = ro
    })

    return () => {
      disposed = true
      roRef.current?.disconnect()
      roRef.current = null
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
        candleSeriesRef.current = null
        volumeSeriesRef.current = null
        overlaySeriesRef.current.clear()
        priceLinesRef.current = []
        prevCandleLengthRef.current = 0
      }
    }
  }, [applyCandles])

  // Update candles when new data arrives
  useEffect(() => {
    applyCandles(candles)
  }, [candles, applyCandles])

  // EMA overlays — clear and rebuild when asset changes
  const lastAssetRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!chartRef.current || !lwsLineSeriesRef.current || !candles.length) return
    const chart = chartRef.current
    const LWSLineSeries = lwsLineSeriesRef.current

    const closes = candles.map(c => c.close)
    const times = candles.map(c => c.time)

    // Clear overlays when asset changes
    if (lastAssetRef.current !== undefined && lastAssetRef.current !== asset) {
      for (const [, series] of overlaySeriesRef.current) {
        try { chart.removeSeries(series) } catch {}
      }
      overlaySeriesRef.current.clear()
    }
    lastAssetRef.current = asset

    function computeEMASeries(period: number) {
      if (closes.length < period) return []
      const k = 2 / (period + 1)
      let prev = closes.slice(0, period).reduce((a, b) => a + b) / period
      const out: { time: number; value: number }[] = []
      for (let i = period - 1; i < closes.length; i++) {
        if (i > period - 1) prev = closes[i] * k + prev * (1 - k)
        out.push({ time: times[i], value: prev })
      }
      return out
    }

    const configs = [
      { id: 'ema25', data: computeEMASeries(25), color: '#f59e0b' },
      { id: 'ema50', data: computeEMASeries(50), color: '#3b82f6' },
      { id: 'ema200', data: computeEMASeries(200), color: '#a855f7' },
    ]

    for (const { id, data, color } of configs) {
      if (!data.length) continue
      let lineSeries = overlaySeriesRef.current.get(id)
      if (!lineSeries) {
        lineSeries = chart.addSeries(LWSLineSeries, { color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
        overlaySeriesRef.current.set(id, lineSeries)
      }
      lineSeries.setData(data)
    }
  }, [candles, asset])

  // Signal price lines + alerts
  useEffect(() => {
    if (!candleSeriesRef.current) return
    const series = candleSeriesRef.current

    for (const { line } of priceLinesRef.current) {
      try { series.removePriceLine(line) } catch {}
    }
    priceLinesRef.current = []

    for (const setup of setups) {
      const lines = [
        { price: setup.entry, color: '#94a3b8', lineWidth: 1, lineStyle: 1, title: 'Entry' },
        { price: setup.tp1, color: '#f59e0b', lineWidth: 1, lineStyle: 2, title: 'TP1' },
        { price: setup.tp2, color: '#10b981', lineWidth: 1, lineStyle: 2, title: 'TP2' },
        { price: setup.stopLoss, color: '#ef4444', lineWidth: 1, lineStyle: 2, title: 'SL' },
      ]
      for (const opts of lines) {
        priceLinesRef.current.push({ series, line: series.createPriceLine(opts) })
      }
    }

    for (const price of alertPrices) {
      priceLinesRef.current.push({ series, line: series.createPriceLine({ price, color: '#f59e0b', lineWidth: 1, lineStyle: 3, title: 'Alert' }) })
    }
  }, [setups, alertPrices])

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-lg overflow-hidden"
      style={{ minHeight: '300px' }}
    />
  )
}
