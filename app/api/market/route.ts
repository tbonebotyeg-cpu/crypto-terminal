import { NextRequest, NextResponse } from 'next/server'
import { fetchPrice, fetchOHLCV } from '../../../lib/coingecko'
import { generateSimCandles, simParams, FALLBACK_PRICES } from '../../../lib/simulator'
import { Asset, Timeframe } from '../../../types/market'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const asset = (searchParams.get('asset') ?? 'BTC') as Asset
  const timeframe = (searchParams.get('timeframe') ?? '1H') as Timeframe

  try {
    const [statsMap, candles] = await Promise.all([
      fetchPrice([asset]),
      fetchOHLCV(asset, timeframe),
    ])

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
  } catch (err) {
    console.error('[market] data fetch failed, falling back to SIM:', err)
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
