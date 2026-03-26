import { NextRequest, NextResponse } from 'next/server'
import { fetchPrice, fetchOHLCV } from '../../../lib/coingecko'
import { generateSimCandles, simParams, FALLBACK_PRICES } from '../../../lib/simulator'
import { resampleCandles } from '../../../lib/utils'
import { Asset, Timeframe, TIMEFRAME_DAYS } from '../../../types/market'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const asset = (searchParams.get('asset') ?? 'BTC') as Asset
  const timeframe = (searchParams.get('timeframe') ?? '1H') as Timeframe

  const days = TIMEFRAME_DAYS[timeframe] ?? 2

  try {
    const [statsMap, rawCandles] = await Promise.all([
      fetchPrice([asset]),
      fetchOHLCV(asset, days),
    ])

    let candles = rawCandles
    if (timeframe === '1W') candles = resampleCandles(rawCandles, 'week')
    if (timeframe === '1M') candles = resampleCandles(rawCandles, 'month')

    const stats = statsMap[asset] ?? {
      price: candles[candles.length - 1]?.close ?? 0,
      change24h: 0, volume24h: 0, marketCap: 0,
    }

    if (candles.length && stats.price) {
      candles[candles.length - 1] = {
        ...candles[candles.length - 1],
        close: stats.price,
      }
    }

    return NextResponse.json(
      { candles, stats, source: 'live' },
      { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' } }
    )
  } catch {
    const seedPrice = FALLBACK_PRICES[asset] ?? 1000
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
