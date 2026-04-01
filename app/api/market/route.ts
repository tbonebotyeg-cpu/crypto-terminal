import { NextRequest, NextResponse } from 'next/server'
import { fetchPrice, fetchOHLCV } from '../../../lib/coingecko'
import { fetchYahooPrice, fetchYahooOHLCV } from '../../../lib/yahoo'
import { generateSimCandles, simParams } from '../../../lib/simulator'
import { Asset, Timeframe, ASSET_REGISTRY, MarketStats, Candle } from '../../../types/market'

export const runtime = 'nodejs'

const VALID_TIMEFRAMES: Timeframe[] = ['15m', '1H', '4H', '1D', '1W', '1M']

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const asset = (searchParams.get('asset') ?? 'BTC') as Asset
  const timeframe = (searchParams.get('timeframe') ?? '1H') as Timeframe
  const config = ASSET_REGISTRY[asset]

  if (!config) {
    return NextResponse.json({ error: 'Unknown asset' }, { status: 400 })
  }

  if (!VALID_TIMEFRAMES.includes(timeframe)) {
    return NextResponse.json({ error: `Invalid timeframe. Valid: ${VALID_TIMEFRAMES.join(', ')}` }, { status: 400 })
  }

  try {
    let stats: MarketStats
    let candles: Candle[]

    if (config.provider === 'crypto_com') {
      const [statsMap, candleData] = await Promise.all([
        fetchPrice([asset]),
        fetchOHLCV(asset, timeframe),
      ])
      stats = statsMap[asset] ?? { price: 0, change24h: 0, volume24h: 0, marketCap: 0 }
      candles = candleData
    } else if (config.provider === 'yahoo') {
      const [yahooStats, candleData] = await Promise.all([
        fetchYahooPrice(config.instrumentName),
        fetchYahooOHLCV(config.instrumentName, timeframe),
      ])
      stats = yahooStats
      candles = candleData
    } else {
      throw new Error('Unknown provider')
    }

    // Snap last candle close to live price, keeping high/low valid
    if (candles.length && stats.price) {
      const last = candles[candles.length - 1]
      candles[candles.length - 1] = {
        ...last,
        close: stats.price,
        high: Math.max(last.high, stats.price),
        low: Math.min(last.low, stats.price),
      }
    }

    return NextResponse.json(
      { candles, stats, source: 'live' },
      { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' } }
    )
  } catch (err) {
    console.error(`[market] ${asset} fetch failed, falling back to SIM:`, err)
    const seedPrice = config.fallbackPrice
    const { intervalSeconds, count } = simParams(timeframe)
    const candles = generateSimCandles(seedPrice, count, intervalSeconds)

    return NextResponse.json(
      {
        candles,
        stats: {
          price: candles[candles.length - 1].close,
          change24h: 0,
          volume24h: 0,
          marketCap: 0,
        },
        source: 'sim',
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
