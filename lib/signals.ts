import { Candle } from '../types/market'
import { IndicatorResult, IndicatorWeights, AggregateScore } from '../types/indicators'
import { TradeSetup, Direction } from '../types/signals'
import { atr, highest, lowest } from './utils'

export function computeAggregateScore(
  results: IndicatorResult[],
  weights: IndicatorWeights
): AggregateScore {
  let bullWeighted = 0, bearWeighted = 0
  let bullCount = 0, bearCount = 0, neutralCount = 0

  for (const r of results) {
    if (r.id === 'rSquared') continue  // quality filter, not directional
    if (r.id === 'atr14') continue      // not directional

    const w = weights[r.group as keyof IndicatorWeights] ?? 1
    if (r.signal === 'BULLISH') {
      bullWeighted += r.strength * w
      bullCount++
    } else if (r.signal === 'BEARISH') {
      bearWeighted += r.strength * w
      bearCount++
    } else {
      neutralCount++
    }
  }

  const total = bullWeighted + bearWeighted
  const score = total > 0 ? (bullWeighted / total) * 100 : 50

  return { score, bullCount, bearCount, neutralCount }
}

// ─── Reversal candle patterns ────────────────────────────────────────────────

function isEngulfing(candles: Candle[], direction: Direction): boolean {
  if (candles.length < 2) return false
  const prev = candles[candles.length - 2]
  const curr = candles[candles.length - 1]
  const prevBody = Math.abs(prev.close - prev.open)
  const currBody = Math.abs(curr.close - curr.open)
  if (direction === 'LONG') {
    return curr.close > curr.open &&
           prev.close < prev.open &&
           currBody > prevBody * 1.2 &&
           curr.open <= prev.close &&
           curr.close >= prev.open
  } else {
    return curr.close < curr.open &&
           prev.close > prev.open &&
           currBody > prevBody * 1.2 &&
           curr.open >= prev.close &&
           curr.close <= prev.open
  }
}

function isPinBar(candles: Candle[], direction: Direction): boolean {
  if (!candles.length) return false
  const c = candles[candles.length - 1]
  const body = Math.abs(c.close - c.open)
  if (!body) return false
  const upperWick = c.high - Math.max(c.open, c.close)
  const lowerWick = Math.min(c.open, c.close) - c.low
  if (direction === 'LONG') {
    return lowerWick > body * 2 && upperWick < body * 0.5
  } else {
    return upperWick > body * 2 && lowerWick < body * 0.5
  }
}

// ─── Ty's Multi-Timeframe Strategy ───────────────────────────────────────────

function computeHTFRSI(closes: number[], period = 14): number[] {
  if (closes.length < period + 1) return []
  const gains: number[] = [], losses: number[] = []
  for (let i = 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1]
    gains.push(d > 0 ? d : 0)
    losses.push(d < 0 ? -d : 0)
  }
  let avgG = gains.slice(0, period).reduce((a, b) => a + b) / period
  let avgL = losses.slice(0, period).reduce((a, b) => a + b) / period
  const result: number[] = [100 - 100 / (1 + (avgG || 1e-10) / (avgL || 1e-10))]
  for (let i = period; i < gains.length; i++) {
    avgG = (avgG * (period - 1) + gains[i]) / period
    avgL = (avgL * (period - 1) + losses[i]) / period
    result.push(100 - 100 / (1 + (avgG || 1e-10) / (avgL || 1e-10)))
  }
  return result
}

export function checkTyStrategy(
  currentCandles: Candle[],
  higherTFCandles: Candle[],
  direction: Direction
): boolean {
  if (!higherTFCandles.length || higherTFCandles.length < 20) return false
  if (!currentCandles.length || currentCandles.length < 10) return false

  const htf = higherTFCandles
  const htfCloses = htf.map(c => c.close)

  // ── Condition A: EMA 25/50 confluence on higher TF ───────────────────────
  let ema25 = htfCloses[0]
  let ema50 = htfCloses[0]
  const k25 = 2 / 26, k50 = 2 / 51
  for (const p of htfCloses) {
    ema25 = p * k25 + ema25 * (1 - k25)
    ema50 = p * k50 + ema50 * (1 - k50)
  }

  const htfAtr = atr(htf.map(c => c.high), htf.map(c => c.low), htfCloses, 14)
  const emaZoneHigh = Math.max(ema25, ema50) + htfAtr * 0.3
  const emaZoneLow  = Math.min(ema25, ema50) - htfAtr * 0.3

  const recent5 = htf.slice(-5)
  const touchedZone = recent5.some(c =>
    (c.low <= emaZoneHigh && c.high >= emaZoneLow)
  )
  if (!touchedZone) return false

  // ── Condition B: RSI bounce on higher TF ─────────────────────────────────
  const htfRsiVals = computeHTFRSI(htfCloses)
  if (htfRsiVals.length < 5) return false
  const last5Rsi = htfRsiVals.slice(-5)
  const currentRsi = last5Rsi[last5Rsi.length - 1]
  const hadOversold = last5Rsi.slice(0, -1).some(r => r <= 32)
  const hadOverbought = last5Rsi.slice(0, -1).some(r => r >= 68)

  if (direction === 'LONG' && !(hadOversold && currentRsi > 35)) return false
  if (direction === 'SHORT' && !(hadOverbought && currentRsi < 65)) return false

  // ── Condition C: Reversal candle on current (low) TF ────────────────────
  const hasReversal = isPinBar(currentCandles, direction) ||
                      isEngulfing(currentCandles, direction)
  if (!hasReversal) return false

  return true
}

// ─── Main signal engine ───────────────────────────────────────────────────────

export function detectTradeSetup(
  candles: Candle[],
  results: IndicatorResult[],
  weights: IndicatorWeights,
  accountSize: number,
  asset: string,
  timeframe: string,
  higherTFCandles?: Candle[]
): TradeSetup | null {
  if (!results.length || candles.length < 30) return null

  const { score } = computeAggregateScore(results, weights)

  let direction: Direction
  if (score >= 65) direction = 'LONG'
  else if (score <= 35) direction = 'SHORT'
  else return null

  const byId = Object.fromEntries(results.map(r => [r.id, r]))

  // EMA alignment gate
  if (direction === 'LONG') {
    if (byId.ema25?.signal !== 'BULLISH' || byId.ema50?.signal !== 'BULLISH') return null
  } else {
    if (byId.ema25?.signal !== 'BEARISH' || byId.ema50?.signal !== 'BEARISH') return null
  }

  // RSI extreme filter
  const rsiVal = byId.rsi14?.value ?? 50
  const rsiBounce = byId.rsiBounce?.signal
  if (direction === 'LONG' && rsiVal > 75 && rsiBounce !== 'BULLISH') return null
  if (direction === 'SHORT' && rsiVal < 25 && rsiBounce !== 'BEARISH') return null

  // Momentum consensus — 3 of 5
  const momentumIds = ['rsi14', 'stochRsi', 'macd', 'roc', 'williamsR']
  const targetSignal = direction === 'LONG' ? 'BULLISH' : 'BEARISH'
  const confirming = momentumIds.filter(id => byId[id]?.signal === targetSignal)
  if (confirming.length < 3) return null

  // Volume confirmation
  const volConfirm = byId.volTrend?.signal !== 'NEUTRAL' || byId.obv?.signal === targetSignal
  if (!volConfirm) return null

  // Build setup
  const highs = candles.map(c => c.high)
  const lows = candles.map(c => c.low)
  const closes = candles.map(c => c.close)
  const currentPrice = closes[closes.length - 1]
  const atrVal = atr(highs, lows, closes, 14)
  if (!atrVal || isNaN(atrVal)) return null

  let stopLoss: number, tp1: number, tp2: number
  if (direction === 'LONG') {
    const swingLow = lowest(lows.slice(-10), 10)
    stopLoss = swingLow - atrVal * 1.5
    const risk = currentPrice - stopLoss
    if (risk <= 0) return null
    tp1 = currentPrice + risk * 1.5
    tp2 = currentPrice + risk * 2.5
  } else {
    const swingHigh = highest(highs.slice(-10), 10)
    stopLoss = swingHigh + atrVal * 1.5
    const risk = stopLoss - currentPrice
    if (risk <= 0) return null
    tp1 = currentPrice - risk * 1.5
    tp2 = currentPrice - risk * 2.5
  }

  const risk = Math.abs(currentPrice - stopLoss)
  const rrRatio = Math.abs(tp1 - currentPrice) / risk
  const positionSizePct = (accountSize * 0.015) / risk
  const confirmingCount = results.filter(r => r.signal === targetSignal).length
  const isPremiumSetup = higherTFCandles
    ? checkTyStrategy(candles, higherTFCandles, direction)
    : false

  return {
    id: `${asset}-${timeframe}-${Date.now()}`,
    direction,
    entry: currentPrice,
    stopLoss,
    tp1,
    tp2,
    rrRatio,
    winProbability: score,
    confirmingCount,
    totalIndicators: results.length,
    isPremiumSetup,
    positionSizePct,
    detectedAt: Date.now(),
    asset,
    timeframe,
  }
}
