// Pure math primitives — no imports, no side effects

export function ema(values: number[], period: number): number[] {
  if (values.length < period) return []
  const k = 2 / (period + 1)
  const result: number[] = []
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period
  result.push(prev)
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k)
    result.push(prev)
  }
  return result
}

export function emaLast(values: number[], period: number): number {
  const arr = ema(values, period)
  return arr.length ? arr[arr.length - 1] : NaN
}

export function sma(values: number[], period: number): number[] {
  const result: number[] = []
  for (let i = period - 1; i < values.length; i++) {
    const slice = values.slice(i - period + 1, i + 1)
    result.push(slice.reduce((a, b) => a + b, 0) / period)
  }
  return result
}

export function smaLast(values: number[], period: number): number {
  if (values.length < period) return NaN
  return values.slice(-period).reduce((a, b) => a + b, 0) / period
}

export function stdDev(values: number[], period: number): number {
  if (values.length < period) return NaN
  const slice = values.slice(-period)
  const mean = slice.reduce((a, b) => a + b, 0) / period
  const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / (period - 1)
  return Math.sqrt(variance)
}

export function highest(values: number[], period: number): number {
  return Math.max(...values.slice(-period))
}

export function lowest(values: number[], period: number): number {
  return Math.min(...values.slice(-period))
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 50
  return clamp(((value - min) / (max - min)) * 100, 0, 100)
}

// Wilder's smoothing (used in RSI and ATR)
export function wilderSmooth(values: number[], period: number): number[] {
  if (values.length < period) return []
  const result: number[] = []
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period
  result.push(prev)
  for (let i = period; i < values.length; i++) {
    prev = (prev * (period - 1) + values[i]) / period
    result.push(prev)
  }
  return result
}

// True Range for ATR
export function trueRange(high: number, low: number, prevClose: number): number {
  return Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose))
}

// ATR (Wilder's)
export function atr(highs: number[], lows: number[], closes: number[], period: number): number {
  if (closes.length < period + 1) return NaN
  const trs: number[] = []
  for (let i = 1; i < closes.length; i++) {
    trs.push(trueRange(highs[i], lows[i], closes[i - 1]))
  }
  const smoothed = wilderSmooth(trs, period)
  return smoothed.length ? smoothed[smoothed.length - 1] : NaN
}

// Pearson correlation coefficient between two arrays
export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length)
  if (n < 2) return 0
  const xSlice = xs.slice(-n)
  const ySlice = ys.slice(-n)
  const xMean = xSlice.reduce((a, b) => a + b, 0) / n
  const yMean = ySlice.reduce((a, b) => a + b, 0) / n
  let num = 0, xVar = 0, yVar = 0
  for (let i = 0; i < n; i++) {
    const dx = xSlice[i] - xMean
    const dy = ySlice[i] - yMean
    num += dx * dy
    xVar += dx * dx
    yVar += dy * dy
  }
  return xVar && yVar ? num / Math.sqrt(xVar * yVar) : 0
}

// Linear regression slope over last N values
export function linRegSlope(values: number[], period: number): number {
  if (values.length < period) return 0
  const slice = values.slice(-period)
  const n = slice.length
  const xMean = (n - 1) / 2
  const yMean = slice.reduce((a, b) => a + b, 0) / n
  let num = 0, den = 0
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (slice[i] - yMean)
    den += (i - xMean) ** 2
  }
  return den ? num / den : 0
}

// R-squared of values vs their linear regression
export function rSquared(values: number[], period: number): number {
  if (values.length < period) return 0
  const slice = values.slice(-period)
  const n = slice.length
  const slope = linRegSlope(values, period)
  const yMean = slice.reduce((a, b) => a + b, 0) / n
  const intercept = yMean - slope * (n - 1) / 2
  let ssTot = 0, ssRes = 0
  for (let i = 0; i < n; i++) {
    const predicted = intercept + slope * i
    ssTot += (slice[i] - yMean) ** 2
    ssRes += (slice[i] - predicted) ** 2
  }
  return ssTot ? clamp(1 - ssRes / ssTot, 0, 1) : 0
}

// Resample daily candles to weekly or monthly
export function resampleCandles(
  candles: import('../types/market').Candle[],
  period: 'week' | 'month'
): import('../types/market').Candle[] {
  if (!candles.length) return []
  const grouped = new Map<number, import('../types/market').Candle[]>()
  for (const c of candles) {
    const d = new Date(c.time * 1000)
    let key: number
    if (period === 'week') {
      const day = d.getDay()
      const monday = new Date(d)
      monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
      monday.setHours(0, 0, 0, 0)
      key = monday.getTime() / 1000
    } else {
      key = new Date(d.getFullYear(), d.getMonth(), 1).getTime() / 1000
    }
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(c)
  }
  return Array.from(grouped.entries())
    .sort(([a], [b]) => a - b)
    .map(([time, cs]) => ({
      time,
      open: cs[0].open,
      high: Math.max(...cs.map(c => c.high)),
      low: Math.min(...cs.map(c => c.low)),
      close: cs[cs.length - 1].close,
      volume: cs.reduce((a, c) => a + c.volume, 0),
    }))
}
