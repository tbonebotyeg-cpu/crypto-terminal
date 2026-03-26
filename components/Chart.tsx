'use client'

import { useEffect, useRef } from 'react'
import { Candle } from '../types/market'
import { IndicatorResult } from '../types/indicators'
import { TradeSetup } from '../types/signals'

interface Props {
  candles: Candle[]
  results: IndicatorResult[]
  setups: TradeSetup[]
  alertPrices?: number[]
  currentPrice?: number
}

export default function Chart({ candles, results, setups, alertPrices = [] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<unknown>(null)
  const candleSeriesRef = useRef<unknown>(null)
  const volumeSeriesRef = useRef<unknown>(null)
  const overlaySeriesRef = useRef<Map<string, unknown>>(new Map())
  const priceLinesRef = useRef<{ series: unknown; line: unknown }[]>([])
  const prevCandleLengthRef = useRef(0)
  const initializedRef = useRef(false)

  // Init chart once
  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return
    initializedRef.current = true

    import('lightweight-charts').then(({ createChart, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries, LineSeries: LWSLineSeries }) => {
      if (!containerRef.current) return

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

      // v5 API: chart.addSeries(SeriesDefinition, options)
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
      // Store LineSeries constructor for EMA overlays
      ;(chartRef as unknown as { lwsLineSeries: unknown }).lwsLineSeries = LWSLineSeries

      chartRef.current = chart
      candleSeriesRef.current = candleSeries
      volumeSeriesRef.current = volumeSeries

      const ro = new ResizeObserver(() => {
        if (containerRef.current) {
          chart.applyOptions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
          })
        }
      })
      ro.observe(containerRef.current)
    })

    return () => {
      initializedRef.current = false
      if (chartRef.current) {
        (chartRef.current as { remove: () => void }).remove()
        chartRef.current = null
        candleSeriesRef.current = null
        volumeSeriesRef.current = null
        overlaySeriesRef.current.clear()
        priceLinesRef.current = []
        prevCandleLengthRef.current = 0
      }
    }
  }, [])

  // Update candles
  useEffect(() => {
    if (!candleSeriesRef.current || !candles.length) return
    const series = candleSeriesRef.current as {
      setData: (d: unknown) => void
      update: (d: unknown) => void
    }
    const volSeries = volumeSeriesRef.current as {
      setData: (d: unknown) => void
      update: (d: unknown) => void
    } | null

    const formatted = candles.map(c => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close }))
    const volumes = candles.map(c => ({ time: c.time, value: c.volume, color: c.close >= c.open ? '#10b98130' : '#ef444430' }))

    if (candles.length !== prevCandleLengthRef.current || prevCandleLengthRef.current === 0) {
      series.setData(formatted)
      if (volSeries) volSeries.setData(volumes)
      prevCandleLengthRef.current = candles.length
    } else {
      series.update(formatted[formatted.length - 1])
      if (volSeries && volumes.length) volSeries.update(volumes[volumes.length - 1])
    }
  }, [candles])

  // EMA overlays
  useEffect(() => {
    if (!chartRef.current || !candles.length) return
    const chart = chartRef.current as {
      addSeries: (def: unknown, opts: unknown) => { setData: (d: unknown) => void }
    }
    const LWSLineSeries = (chartRef as unknown as { lwsLineSeries: unknown }).lwsLineSeries
    if (!LWSLineSeries) return

    const closes = candles.map(c => c.close)
    const times = candles.map(c => c.time)

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
        // v5 API: addSeries(SeriesDefinition, options)
        lineSeries = chart.addSeries(LWSLineSeries, { color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
        overlaySeriesRef.current.set(id, lineSeries)
      }
      (lineSeries as { setData: (d: unknown) => void }).setData(data)
    }
  }, [candles])

  // Signal price lines + alerts
  useEffect(() => {
    if (!candleSeriesRef.current) return
    const series = candleSeriesRef.current as {
      createPriceLine: (opts: unknown) => unknown
      removePriceLine: (line: unknown) => void
    }

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
