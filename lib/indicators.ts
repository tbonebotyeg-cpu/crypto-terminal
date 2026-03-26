import { Candle } from '../types/market'
import { IndicatorResult, Signal } from '../types/indicators'
import {
  ema, emaLast, smaLast, stdDev, highest, lowest,
  clamp, wilderSmooth, atr,
  linRegSlope, rSquared,
} from './utils'

function bull(strength: number): Pick<IndicatorResult, 'signal' | 'strength'> {
  return { signal: 'BULLISH', strength: clamp(strength, 0, 100) }
}
function bear(strength: number): Pick<IndicatorResult, 'signal' | 'strength'> {
  return { signal: 'BEARISH', strength: clamp(strength, 0, 100) }
}
function neut(strength = 30): Pick<IndicatorResult, 'signal' | 'strength'> {
  return { signal: 'NEUTRAL', strength: clamp(strength, 0, 100) }
}

// ─── Trend ────────────────────────────────────────────────────────────────────

export function calcEMA25(candles: Candle[]): IndicatorResult {
  const closes = candles.map(c => c.close)
  const emaVal = emaLast(closes, 25)
  const price = closes[closes.length - 1]
  const atrVal = atr(candles.map(c => c.high), candles.map(c => c.low), closes, 14) || 1
  const dist = Math.abs(price - emaVal) / atrVal * 20
  const ss = price > emaVal ? bull(dist) : bear(dist)
  return { id: 'ema25', name: 'EMA 25', group: 'trend', value: emaVal, label: `EMA25: ${emaVal.toFixed(2)}`, ...ss }
}

export function calcEMA50(candles: Candle[]): IndicatorResult {
  const closes = candles.map(c => c.close)
  const emaVal = emaLast(closes, 50)
  const price = closes[closes.length - 1]
  const atrVal = atr(candles.map(c => c.high), candles.map(c => c.low), closes, 14) || 1
  const dist = Math.abs(price - emaVal) / atrVal * 20
  const ss = price > emaVal ? bull(dist) : bear(dist)
  return { id: 'ema50', name: 'EMA 50', group: 'trend', value: emaVal, label: `EMA50: ${emaVal.toFixed(2)}`, ...ss }
}

export function calcEMACross(candles: Candle[]): IndicatorResult {
  const closes = candles.map(c => c.close)
  const e25 = emaLast(closes, 25)
  const e50 = emaLast(closes, 50)
  const separation = Math.abs(e25 - e50) / closes[closes.length - 1] * 1000
  const ss = e25 > e50 ? bull(Math.min(separation, 100)) : bear(Math.min(separation, 100))
  return { id: 'emaCross', name: 'EMA Cross', group: 'trend', value: e25 - e50, label: `25/50: ${e25 > e50 ? 'Golden' : 'Death'}`, ...ss }
}

export function calcEMA200(candles: Candle[]): IndicatorResult {
  const closes = candles.map(c => c.close)
  if (closes.length < 200) {
    return { id: 'ema200', name: 'EMA 200', group: 'trend', value: NaN, label: 'EMA200: N/A', ...neut(20) }
  }
  const emaVal = emaLast(closes, 200)
  const price = closes[closes.length - 1]
  const ss = price > emaVal ? bull(70) : bear(70)
  return { id: 'ema200', name: 'EMA 200', group: 'trend', value: emaVal, label: `EMA200: ${emaVal.toFixed(2)}`, ...ss }
}

export function calcSMA20(candles: Candle[]): IndicatorResult {
  const closes = candles.map(c => c.close)
  const smaVal = smaLast(closes, 20)
  const price = closes[closes.length - 1]
  const atrVal = atr(candles.map(c => c.high), candles.map(c => c.low), closes, 14) || 1
  const dist = Math.abs(price - smaVal) / atrVal * 20
  const ss = price > smaVal ? bull(dist) : bear(dist)
  return { id: 'sma20', name: 'SMA 20', group: 'trend', value: smaVal, label: `SMA20: ${smaVal.toFixed(2)}`, ...ss }
}

export function calcVWAP(candles: Candle[]): IndicatorResult {
  let cumTPV = 0, cumVol = 0
  for (const c of candles) {
    const tp = (c.high + c.low + c.close) / 3
    cumTPV += tp * c.volume
    cumVol += c.volume
  }
  const vwap = cumVol ? cumTPV / cumVol : candles[candles.length - 1].close
  const price = candles[candles.length - 1].close
  const atrVal = atr(candles.map(c => c.high), candles.map(c => c.low), candles.map(c => c.close), 14) || 1
  const dist = Math.abs(price - vwap) / atrVal * 20
  const ss = price > vwap ? bull(dist) : bear(dist)
  return { id: 'vwap', name: 'VWAP', group: 'trend', value: vwap, label: `VWAP: ${vwap.toFixed(2)}`, ...ss }
}

export function calcSupertrend(candles: Candle[]): IndicatorResult {
  const period = 7
  const mult = 3.0
  if (candles.length < period + 1) return { id: 'supertrend', name: 'Supertrend', group: 'trend', value: NaN, label: 'ST: N/A', ...neut() }
  const closes = candles.map(c => c.close)
  const highs = candles.map(c => c.high)
  const lows = candles.map(c => c.low)

  let trend = 1 // 1 = bullish, -1 = bearish
  let upperBand = 0, lowerBand = 0
  for (let i = period; i < candles.length; i++) {
    const atrVal = atr(highs.slice(0, i + 1), lows.slice(0, i + 1), closes.slice(0, i + 1), period)
    const hl2 = (highs[i] + lows[i]) / 2
    const newUpper = hl2 + mult * atrVal
    const newLower = hl2 - mult * atrVal
    if (i > period) {
      upperBand = closes[i - 1] > upperBand ? Math.min(newUpper, upperBand) : newUpper
      lowerBand = closes[i - 1] < lowerBand ? Math.max(newLower, lowerBand) : newLower
    } else {
      upperBand = newUpper
      lowerBand = newLower
    }
    if (closes[i] > upperBand) trend = 1
    else if (closes[i] < lowerBand) trend = -1
  }
  const ss = trend === 1 ? bull(80) : bear(80)
  return { id: 'supertrend', name: 'Supertrend', group: 'trend', value: trend, label: `ST: ${trend === 1 ? 'BULL' : 'BEAR'}`, ...ss }
}

// ─── Momentum ─────────────────────────────────────────────────────────────────

function calcRSIValues(closes: number[], period = 14): number[] {
  if (closes.length < period + 1) return []
  const gains: number[] = [], losses: number[] = []
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    gains.push(diff > 0 ? diff : 0)
    losses.push(diff < 0 ? -diff : 0)
  }
  const smoothG = wilderSmooth(gains, period)
  const smoothL = wilderSmooth(losses, period)
  return smoothG.map((g, i) => {
    const l = smoothL[i]
    return l === 0 ? 100 : 100 - 100 / (1 + g / l)
  })
}

export function calcRSI(candles: Candle[]): IndicatorResult {
  const closes = candles.map(c => c.close)
  const rsiVals = calcRSIValues(closes, 14)
  if (!rsiVals.length) return { id: 'rsi14', name: 'RSI (14)', group: 'momentum', value: 50, label: 'RSI: N/A', ...neut() }
  const rsi = rsiVals[rsiVals.length - 1]
  let ss: ReturnType<typeof bull>
  if (rsi < 30) ss = bull(70)
  else if (rsi > 70) ss = bear(70)
  else if (rsi >= 40 && rsi <= 65) ss = bull(Math.abs(rsi - 50) * 2)
  else ss = neut(30)
  return { id: 'rsi14', name: 'RSI (14)', group: 'momentum', value: rsi, label: `RSI: ${rsi.toFixed(1)}`, ...ss }
}

export function calcRSIBounce(candles: Candle[]): IndicatorResult {
  const closes = candles.map(c => c.close)
  const rsiVals = calcRSIValues(closes, 14)
  if (rsiVals.length < 5) return { id: 'rsiBounce', name: 'RSI Bounce', group: 'momentum', value: 50, label: 'RSI Bounce: N/A', ...neut() }
  const last5 = rsiVals.slice(-5)
  const current = last5[last5.length - 1]
  const hadOversold = last5.slice(0, -1).some(r => r <= 32)
  const hadOverbought = last5.slice(0, -1).some(r => r >= 68)
  if (hadOversold && current > 35) {
    return { id: 'rsiBounce', name: 'RSI Bounce', group: 'momentum', value: current, label: `RSI Bounce: ${current.toFixed(1)}`, ...bull(90) }
  }
  if (hadOverbought && current < 65) {
    return { id: 'rsiBounce', name: 'RSI Bounce', group: 'momentum', value: current, label: `RSI Bounce: ${current.toFixed(1)}`, ...bear(90) }
  }
  return { id: 'rsiBounce', name: 'RSI Bounce', group: 'momentum', value: current, label: `RSI Bounce: None`, ...neut(20) }
}

export function calcStochRSI(candles: Candle[]): IndicatorResult {
  const closes = candles.map(c => c.close)
  const rsiVals = calcRSIValues(closes, 14)
  if (rsiVals.length < 14) return { id: 'stochRsi', name: 'Stoch RSI', group: 'momentum', value: 50, label: 'StochRSI: N/A', ...neut() }

  const stoch: number[] = []
  for (let i = 13; i < rsiVals.length; i++) {
    const slice = rsiVals.slice(i - 13, i + 1)
    const hi = Math.max(...slice), lo = Math.min(...slice)
    stoch.push(hi === lo ? 50 : (rsiVals[i] - lo) / (hi - lo) * 100)
  }

  if (stoch.length < 5) return { id: 'stochRsi', name: 'Stoch RSI', group: 'momentum', value: 50, label: 'StochRSI: N/A', ...neut() }
  const kVals: number[] = []
  for (let i = 2; i < stoch.length; i++) {
    kVals.push((stoch[i - 2] + stoch[i - 1] + stoch[i]) / 3)
  }
  if (kVals.length < 3) return { id: 'stochRsi', name: 'Stoch RSI', group: 'momentum', value: 50, label: 'StochRSI: N/A', ...neut() }
  const dVals: number[] = []
  for (let i = 2; i < kVals.length; i++) {
    dVals.push((kVals[i - 2] + kVals[i - 1] + kVals[i]) / 3)
  }

  const k = kVals[kVals.length - 1]
  const d = dVals[dVals.length - 1]
  const kPrev = kVals[kVals.length - 2]
  const dPrev = dVals[dVals.length - 2]

  let ss: ReturnType<typeof bull>
  if (k < 20 && k > dPrev && kPrev <= dPrev) ss = bull(85)
  else if (k > 80 && k < dPrev && kPrev >= dPrev) ss = bear(85)
  else if (k > d && k < 50) ss = bull(50)
  else if (k < d && k > 50) ss = bear(50)
  else ss = neut()
  return { id: 'stochRsi', name: 'Stoch RSI', group: 'momentum', value: k, label: `StochRSI K: ${k.toFixed(1)}`, ...ss }
}

export function calcMACD(candles: Candle[]): IndicatorResult {
  const closes = candles.map(c => c.close)
  const e12 = ema(closes, 12)
  const e26 = ema(closes, 26)
  if (!e12.length || !e26.length) return { id: 'macd', name: 'MACD', group: 'momentum', value: 0, label: 'MACD: N/A', ...neut() }
  const len = Math.min(e12.length, e26.length)
  const macdLine = e12.slice(-len).map((v, i) => v - e26.slice(-len)[i])
  const signalLine = ema(macdLine, 9)
  if (!signalLine.length) return { id: 'macd', name: 'MACD', group: 'momentum', value: 0, label: 'MACD: N/A', ...neut() }
  const histogram = macdLine.slice(-signalLine.length).map((v, i) => v - signalLine[i])
  const hist = histogram[histogram.length - 1]
  const histPrev = histogram[histogram.length - 2] ?? 0
  const price = closes[closes.length - 1]
  const strength = clamp(Math.abs(hist) / price * 10000, 0, 100)
  let ss: ReturnType<typeof bull>
  if (hist > 0 && histPrev <= 0) ss = bull(90)
  else if (hist < 0 && histPrev >= 0) ss = bear(90)
  else if (hist > 0) ss = bull(strength)
  else ss = bear(strength)
  return { id: 'macd', name: 'MACD', group: 'momentum', value: hist, label: `MACD Hist: ${hist.toFixed(4)}`, ...ss }
}

export function calcROC(candles: Candle[]): IndicatorResult {
  const closes = candles.map(c => c.close)
  if (closes.length < 11) return { id: 'roc', name: 'ROC (10)', group: 'momentum', value: 0, label: 'ROC: N/A', ...neut() }
  const roc = (closes[closes.length - 1] - closes[closes.length - 11]) / closes[closes.length - 11] * 100
  const strength = clamp(Math.abs(roc) / 10 * 100, 0, 100)
  const ss = roc > 0 ? bull(strength) : bear(strength)
  return { id: 'roc', name: 'ROC (10)', group: 'momentum', value: roc, label: `ROC: ${roc.toFixed(2)}%`, ...ss }
}

export function calcMomentum(candles: Candle[]): IndicatorResult {
  const closes = candles.map(c => c.close)
  if (closes.length < 11) return { id: 'momentum', name: 'Momentum', group: 'momentum', value: 0, label: 'MOM: N/A', ...neut() }
  const mom = closes[closes.length - 1] - closes[closes.length - 11]
  const strength = clamp(Math.abs(mom) / closes[closes.length - 1] * 1000, 0, 100)
  const ss = mom > 0 ? bull(strength) : bear(strength)
  return { id: 'momentum', name: 'Momentum', group: 'momentum', value: mom, label: `MOM: ${mom > 0 ? '+' : ''}${mom.toFixed(2)}`, ...ss }
}

export function calcWilliamsR(candles: Candle[]): IndicatorResult {
  const period = 14
  const closes = candles.map(c => c.close)
  const highs = candles.map(c => c.high)
  const lows = candles.map(c => c.low)
  if (candles.length < period) return { id: 'williamsR', name: 'Williams %R', group: 'momentum', value: -50, label: 'W%R: N/A', ...neut() }
  const hh = highest(highs, period)
  const ll = lowest(lows, period)
  const wr = hh === ll ? -50 : (hh - closes[closes.length - 1]) / (hh - ll) * -100
  let ss: ReturnType<typeof bull>
  if (wr > -20) ss = bear(80)
  else if (wr < -80) ss = bull(80)
  else if (wr >= -80 && wr <= -50) ss = bull(40)
  else ss = bear(40)
  return { id: 'williamsR', name: 'Williams %R', group: 'momentum', value: wr, label: `W%R: ${wr.toFixed(1)}`, ...ss }
}

// ─── Volatility ───────────────────────────────────────────────────────────────

export function calcBollingerBands(candles: Candle[]): IndicatorResult {
  const closes = candles.map(c => c.close)
  const mid = smaLast(closes, 20)
  const sd = stdDev(closes, 20)
  const upper = mid + 2 * sd
  const lower = mid - 2 * sd
  const price = closes[closes.length - 1]
  const bw = upper - lower

  let isSqueezing = false
  if (closes.length >= 50) {
    const bws: number[] = []
    for (let i = 20; i <= closes.length; i++) {
      const s = stdDev(closes.slice(0, i), 20)
      const m = smaLast(closes.slice(0, i), 20)
      bws.push((m + 2 * s) - (m - 2 * s))
    }
    const sorted = [...bws].sort((a, b) => a - b)
    const rank = sorted.indexOf(bw) / sorted.length
    isSqueezing = rank < 0.2
  }

  const proximity = (price - lower) / (upper - lower)
  let ss: ReturnType<typeof bull>
  if (isSqueezing) ss = neut(50)
  else if (proximity < 0.2) ss = bull(85)
  else if (proximity > 0.8) ss = bear(85)
  else ss = neut(30)
  return { id: 'bb', name: 'Bollinger Bands', group: 'volatility', value: bw, label: `BB${isSqueezing ? ' Squeeze' : ''}: ${price > mid ? 'Upper' : 'Lower'} half`, ...ss }
}

export function calcATR(candles: Candle[]): IndicatorResult {
  const highs = candles.map(c => c.high)
  const lows = candles.map(c => c.low)
  const closes = candles.map(c => c.close)
  const atrVal = atr(highs, lows, closes, 14)
  const pct = atrVal / closes[closes.length - 1] * 100
  return { id: 'atr14', name: 'ATR (14)', group: 'volatility', value: atrVal, label: `ATR: ${pct.toFixed(2)}%`, ...neut(50) }
}

export function calcKeltner(candles: Candle[]): IndicatorResult {
  const closes = candles.map(c => c.close)
  const highs = candles.map(c => c.high)
  const lows = candles.map(c => c.low)
  const mid = emaLast(closes, 20)
  const atrVal = atr(highs, lows, closes, 14)
  const upper = mid + 2 * atrVal
  const lower = mid - 2 * atrVal
  const price = closes[closes.length - 1]
  const proximity = (price - lower) / (upper - lower)
  let ss: ReturnType<typeof bull>
  if (proximity < 0.2) ss = bull(75)
  else if (proximity > 0.8) ss = bear(75)
  else ss = neut(30)
  return { id: 'keltner', name: 'Keltner Ch.', group: 'volatility', value: price, label: `KC: ${proximity < 0.5 ? 'Lower' : 'Upper'} half`, ...ss }
}

export function calcHistVol(candles: Candle[]): IndicatorResult {
  const closes = candles.map(c => c.close)
  if (closes.length < 21) return { id: 'histVol', name: 'Hist. Volatility', group: 'volatility', value: 0, label: 'HV: N/A', ...neut() }
  const logRet: number[] = []
  for (let i = 1; i < closes.length; i++) {
    logRet.push(Math.log(closes[i] / closes[i - 1]))
  }
  const slice = logRet.slice(-20)
  const mean = slice.reduce((a, b) => a + b, 0) / 20
  const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / 20
  const hv = Math.sqrt(variance * 252) * 100
  const trend = closes[closes.length - 1] > closes[closes.length - 10] ? 1 : -1
  const prev20 = logRet.slice(-25, -5)
  const prevMean = prev20.reduce((a, b) => a + b, 0) / (prev20.length || 1)
  const prevVar = prev20.reduce((a, b) => a + (b - prevMean) ** 2, 0) / (prev20.length || 1)
  const hvPrev = Math.sqrt(prevVar * 252) * 100
  let ss: ReturnType<typeof bull>
  if (hv > hvPrev && trend > 0) ss = bull(60)
  else if (hv > hvPrev && trend < 0) ss = bear(60)
  else ss = neut(30)
  return { id: 'histVol', name: 'Hist. Volatility', group: 'volatility', value: hv, label: `HV: ${hv.toFixed(1)}%`, ...ss }
}

export function calcVolatilityPercentile(candles: Candle[]): IndicatorResult {
  const closes = candles.map(c => c.close)
  if (closes.length < 90) return { id: 'volPctile', name: 'Vol Percentile', group: 'volatility', value: 50, label: 'VolPctile: N/A', ...neut() }
  const hvs: number[] = []
  for (let i = 20; i <= closes.length; i++) {
    const slice = closes.slice(i - 20, i)
    const mean = slice.reduce((a, b) => a + b, 0) / 20
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / 20
    hvs.push(Math.sqrt(variance * 252) * 100)
  }
  const current = hvs[hvs.length - 1]
  const window = hvs.slice(-90)
  const sorted = [...window].sort((a, b) => a - b)
  const rank = (sorted.filter(v => v <= current).length / sorted.length) * 100
  let ss: ReturnType<typeof bull>
  if (rank < 20) ss = neut(60)
  else if (rank > 80) ss = bear(50)
  else ss = neut(30)
  return { id: 'volPctile', name: 'Vol Percentile', group: 'volatility', value: rank, label: `VolPctile: ${rank.toFixed(0)}th`, ...ss }
}

// ─── Volume ───────────────────────────────────────────────────────────────────

export function calcOBV(candles: Candle[]): IndicatorResult {
  let obv = 0
  const obvArr: number[] = [0]
  for (let i = 1; i < candles.length; i++) {
    if (candles[i].close > candles[i - 1].close) obv += candles[i].volume
    else if (candles[i].close < candles[i - 1].close) obv -= candles[i].volume
    obvArr.push(obv)
  }
  const obvMa = smaLast(obvArr, 10)
  const ss = obv > obvMa ? bull(65) : bear(65)
  return { id: 'obv', name: 'OBV', group: 'volume', value: obv, label: `OBV: ${obv > 0 ? '+' : ''}${(obv / 1e6).toFixed(2)}M`, ...ss }
}

export function calcVolumeTrend(candles: Candle[]): IndicatorResult {
  const vols = candles.map(c => c.volume)
  const avgVol = smaLast(vols, 20)
  const current = vols[vols.length - 1]
  const ratio = current / (avgVol || 1)
  if (ratio >= 1.5) {
    const priceTrend = candles[candles.length - 1].close > candles[candles.length - 2].close ? 1 : -1
    const ss = priceTrend > 0 ? bull(75) : bear(75)
    return { id: 'volTrend', name: 'Volume Trend', group: 'volume', value: ratio, label: `Vol: ${ratio.toFixed(1)}x avg`, ...ss }
  }
  return { id: 'volTrend', name: 'Volume Trend', group: 'volume', value: ratio, label: `Vol: ${ratio.toFixed(1)}x avg`, ...neut(20) }
}

export function calcCMF(candles: Candle[]): IndicatorResult {
  const period = 20
  if (candles.length < period) return { id: 'cmf', name: 'CMF (20)', group: 'volume', value: 0, label: 'CMF: N/A', ...neut() }
  const slice = candles.slice(-period)
  let mfvSum = 0, volSum = 0
  for (const c of slice) {
    const range = c.high - c.low
    const mfm = range ? (c.close - c.low - (c.high - c.close)) / range : 0
    mfvSum += mfm * c.volume
    volSum += c.volume
  }
  const cmf = volSum ? mfvSum / volSum : 0
  const strength = clamp(Math.abs(cmf) * 200, 0, 100)
  const ss = cmf > 0 ? bull(strength) : bear(strength)
  return { id: 'cmf', name: 'CMF (20)', group: 'volume', value: cmf, label: `CMF: ${cmf.toFixed(3)}`, ...ss }
}

export function calcADLine(candles: Candle[]): IndicatorResult {
  let ad = 0
  const adArr: number[] = []
  for (const c of candles) {
    const range = c.high - c.low
    const mfm = range ? (c.close - c.low - (c.high - c.close)) / range : 0
    ad += mfm * c.volume
    adArr.push(ad)
  }
  const adMa = smaLast(adArr, 10)
  const ss = ad > adMa ? bull(60) : bear(60)
  return { id: 'adLine', name: 'A/D Line', group: 'volume', value: ad, label: `A/D: ${ad > 0 ? '↑' : '↓'} Trend`, ...ss }
}

// ─── Statistical ──────────────────────────────────────────────────────────────

export function calcZScore(candles: Candle[]): IndicatorResult {
  const closes = candles.map(c => c.close)
  const mean = smaLast(closes, 20)
  const sd = stdDev(closes, 20)
  const z = sd ? (closes[closes.length - 1] - mean) / sd : 0
  let ss: ReturnType<typeof bull>
  if (z < -2) ss = bull(95)
  else if (z >= -2 && z < -0.5) ss = bull(clamp((-z - 0.5) / 1.5 * 70, 30, 70))
  else if (z > 2) ss = bear(90)
  else if (z > 1.5) ss = bear(60)
  else ss = neut(30)
  return { id: 'zScore', name: 'Z-Score', group: 'statistical', value: z, label: `Z: ${z.toFixed(2)}`, ...ss }
}

export function calcPricePercentile(candles: Candle[]): IndicatorResult {
  const closes = candles.map(c => c.close)
  const lookback = Math.min(100, closes.length - 1)
  const window = closes.slice(-lookback - 1, -1)
  const current = closes[closes.length - 1]
  const rank = window.length ? window.filter(v => v <= current).length / window.length * 100 : 50
  let ss: ReturnType<typeof bull>
  if (rank < 30) ss = bull(75)
  else if (rank > 70) ss = bear(75)
  else ss = neut(30)
  return { id: 'pricePctile', name: 'Price Percentile', group: 'statistical', value: rank, label: `Pctile: ${rank.toFixed(0)}th`, ...ss }
}

export function calcStdDevBands(candles: Candle[]): IndicatorResult {
  const closes = candles.map(c => c.close)
  const mean = smaLast(closes, 20)
  const sd = stdDev(closes, 20)
  const upper2 = mean + 2 * sd
  const lower2 = mean - 2 * sd
  const price = closes[closes.length - 1]
  const range = upper2 - lower2
  const proximity = range ? (price - lower2) / range : 0.5
  let ss: ReturnType<typeof bull>
  if (proximity < 0.1) ss = bull(85)
  else if (proximity > 0.9) ss = bear(85)
  else if (proximity < 0.35) ss = bull(50)
  else if (proximity > 0.65) ss = bear(50)
  else ss = neut(30)
  return { id: 'stdDevBands', name: 'StdDev Bands', group: 'statistical', value: proximity, label: `σBands: ${(proximity * 100).toFixed(0)}%`, ...ss }
}

export function calcLinRegSlope(candles: Candle[]): IndicatorResult {
  const closes = candles.map(c => c.close)
  const slope = linRegSlope(closes, 20)
  const price = closes[closes.length - 1]
  const normalizedSlope = slope / price * 100
  const strength = clamp(Math.abs(normalizedSlope) * 50, 0, 100)
  const ss = slope > 0 ? bull(strength) : bear(strength)
  return { id: 'linRegSlope', name: 'LinReg Slope', group: 'statistical', value: slope, label: `Slope: ${slope > 0 ? '+' : ''}${normalizedSlope.toFixed(3)}%`, ...ss }
}

export function calcRSquared(candles: Candle[]): IndicatorResult {
  const closes = candles.map(c => c.close)
  const r2 = rSquared(closes, 20)
  const strength = r2 * 100
  return { id: 'rSquared', name: 'R-Squared', group: 'statistical', value: r2, label: `R²: ${(r2 * 100).toFixed(0)}%`, ...neut(strength) }
}

// ─── Market Structure ─────────────────────────────────────────────────────────

export function calcHHHL(candles: Candle[]): IndicatorResult {
  if (candles.length < 20) return { id: 'hhhl', name: 'HH/HL', group: 'structure', value: 0, label: 'HH/HL: N/A', ...neut() }
  const swingHighs: number[] = []
  const swingLows: number[] = []
  for (let i = 3; i < candles.length - 3; i++) {
    const isSwingHigh = candles[i].high > candles[i-1].high && candles[i].high > candles[i-2].high &&
                        candles[i].high > candles[i+1].high && candles[i].high > candles[i+2].high
    const isSwingLow  = candles[i].low < candles[i-1].low && candles[i].low < candles[i-2].low &&
                        candles[i].low < candles[i+1].low && candles[i].low < candles[i+2].low
    if (isSwingHigh) swingHighs.push(candles[i].high)
    if (isSwingLow) swingLows.push(candles[i].low)
  }
  if (swingHighs.length < 2 || swingLows.length < 2) return { id: 'hhhl', name: 'HH/HL', group: 'structure', value: 0, label: 'Structure: Mixed', ...neut(30) }

  const lastHighs = swingHighs.slice(-3)
  const lastLows = swingLows.slice(-3)
  const hhPattern = lastHighs.every((v, i) => i === 0 || v > lastHighs[i-1])
  const hlPattern = lastLows.every((v, i) => i === 0 || v > lastLows[i-1])
  const llPattern = lastLows.every((v, i) => i === 0 || v < lastLows[i-1])
  const lhPattern = lastHighs.every((v, i) => i === 0 || v < lastHighs[i-1])

  if (hhPattern && hlPattern) return { id: 'hhhl', name: 'HH/HL', group: 'structure', value: 1, label: 'Structure: HH+HL ↑', ...bull(80) }
  if (llPattern && lhPattern) return { id: 'hhhl', name: 'HH/HL', group: 'structure', value: -1, label: 'Structure: LL+LH ↓', ...bear(80) }
  return { id: 'hhhl', name: 'HH/HL', group: 'structure', value: 0, label: 'Structure: Mixed', ...neut(40) }
}

export function calcSRProximity(candles: Candle[]): IndicatorResult {
  const highs = candles.map(c => c.high)
  const lows = candles.map(c => c.low)
  const closes = candles.map(c => c.close)
  const price = closes[closes.length - 1]
  const atrVal = atr(highs, lows, closes, 14)
  const threshold = atrVal * 0.5

  const levels: number[] = []
  const window = candles.slice(-50)
  for (let i = 2; i < window.length - 2; i++) {
    if (window[i].high >= window[i-1].high && window[i].high >= window[i+1].high &&
        window[i].high >= window[i-2].high && window[i].high >= window[i+2].high) {
      levels.push(window[i].high)
    }
    if (window[i].low <= window[i-1].low && window[i].low <= window[i+1].low &&
        window[i].low <= window[i-2].low && window[i].low <= window[i+2].low) {
      levels.push(window[i].low)
    }
  }

  const nearLevels = levels.filter(l => Math.abs(l - price) <= threshold)
  if (!nearLevels.length) return { id: 'srProximity', name: 'S/R Proximity', group: 'structure', value: 0, label: 'S/R: No nearby level', ...neut(20) }

  const closest = nearLevels.reduce((a, b) => Math.abs(a - price) < Math.abs(b - price) ? a : b)
  const proximity = clamp((1 - Math.abs(closest - price) / threshold) * 100, 0, 100)
  const ss = closest < price ? bull(proximity) : bear(proximity)
  return { id: 'srProximity', name: 'S/R Proximity', group: 'structure', value: closest, label: `S/R: ${closest < price ? 'Support' : 'Resist'} @ ${closest.toFixed(2)}`, ...ss }
}

export function calcPivotPoints(candles: Candle[]): IndicatorResult {
  if (candles.length < 2) return { id: 'pivots', name: 'Pivot Points', group: 'structure', value: 0, label: 'Pivots: N/A', ...neut() }
  const prev = candles[candles.length - 2]
  const pp = (prev.high + prev.low + prev.close) / 3
  const s1 = 2 * pp - prev.high
  const r1 = 2 * pp - prev.low
  const price = candles[candles.length - 1].close
  let ss: ReturnType<typeof bull>
  if (price >= s1 && price <= pp) ss = bull(65)
  else if (price < s1) ss = bull(80)
  else if (price >= pp && price <= r1) ss = neut(50)
  else ss = bear(70)
  return { id: 'pivots', name: 'Pivot Points', group: 'structure', value: pp, label: `PP: ${pp.toFixed(2)} | R1: ${r1.toFixed(2)} | S1: ${s1.toFixed(2)}`, ...ss }
}

// ─── Run all indicators ───────────────────────────────────────────────────────

export function runAllIndicators(candles: Candle[]): IndicatorResult[] {
  if (candles.length < 30) return []
  return [
    calcEMA25(candles),
    calcEMA50(candles),
    calcEMACross(candles),
    calcEMA200(candles),
    calcSMA20(candles),
    calcVWAP(candles),
    calcSupertrend(candles),
    calcRSI(candles),
    calcRSIBounce(candles),
    calcStochRSI(candles),
    calcMACD(candles),
    calcROC(candles),
    calcMomentum(candles),
    calcWilliamsR(candles),
    calcBollingerBands(candles),
    calcATR(candles),
    calcKeltner(candles),
    calcHistVol(candles),
    calcVolatilityPercentile(candles),
    calcOBV(candles),
    calcVolumeTrend(candles),
    calcCMF(candles),
    calcADLine(candles),
    calcZScore(candles),
    calcPricePercentile(candles),
    calcStdDevBands(candles),
    calcLinRegSlope(candles),
    calcRSquared(candles),
    calcHHHL(candles),
    calcSRProximity(candles),
    calcPivotPoints(candles),
  ]
}
