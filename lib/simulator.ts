import { Candle } from '../types/market'

// Geometric Brownian Motion OHLCV generator
// Produces statistically realistic candles anchored to a seed price
export function generateSimCandles(
  seedPrice: number,
  count: number,
  intervalSeconds: number,
  annualVolatility = 0.6  // crypto-appropriate default
): Candle[] {
  const dt = intervalSeconds / (365 * 24 * 3600)
  const mu = 0.1 * dt           // slight upward drift
  const sigma = annualVolatility * Math.sqrt(dt)

  const candles: Candle[] = []
  let price = seedPrice
  const now = Math.floor(Date.now() / 1000)
  const startTime = now - count * intervalSeconds

  // Simple seeded-ish pseudo-random using price as seed
  let seed = seedPrice * 1000
  function rand(): number {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  function randn(): number {
    // Box-Muller
    const u1 = Math.max(rand(), 1e-10)
    const u2 = rand()
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  }

  for (let i = 0; i < count; i++) {
    const logReturn = mu + sigma * randn()
    const closePrice = price * Math.exp(logReturn)
    const range = closePrice * sigma * 3
    const high = Math.max(price, closePrice) + Math.abs(randn()) * range * 0.5
    const low  = Math.min(price, closePrice) - Math.abs(randn()) * range * 0.5
    const volume = seedPrice * (50 + Math.abs(randn()) * 30)   // synthetic volume proportional to price

    candles.push({
      time: startTime + i * intervalSeconds,
      open: price,
      high,
      low,
      close: closePrice,
      volume,
    })
    price = closePrice
  }
  return candles
}

// Maps timeframe string to interval in seconds and candle count
export function simParams(timeframe: string): { intervalSeconds: number; count: number } {
  switch (timeframe) {
    case '15m': return { intervalSeconds: 30 * 60, count: 200 }
    case '1H':  return { intervalSeconds: 60 * 60, count: 200 }
    case '4H':  return { intervalSeconds: 4 * 3600, count: 200 }
    case '1D':  return { intervalSeconds: 24 * 3600, count: 200 }
    case '1W':  return { intervalSeconds: 7 * 24 * 3600, count: 104 }
    case '1M':  return { intervalSeconds: 30 * 24 * 3600, count: 48 }
    default:    return { intervalSeconds: 3600, count: 200 }
  }
}
