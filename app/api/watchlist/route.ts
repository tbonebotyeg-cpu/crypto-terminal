import { NextRequest, NextResponse } from 'next/server'
import { fetchPrice } from '../../../lib/coingecko'
import { fetchYahooPrice } from '../../../lib/yahoo'
import { Asset, ASSET_REGISTRY } from '../../../types/market'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const assetList = (searchParams.get('assets') ?? 'BTC,ETH,SOL,XRP')
    .split(',')
    .filter(a => a in ASSET_REGISTRY) as Asset[]

  if (!assetList.length) {
    return NextResponse.json({ items: [] })
  }

  const cdcAssets = assetList.filter(a => ASSET_REGISTRY[a].provider === 'crypto_com')
  const yahooAssets = assetList.filter(a => ASSET_REGISTRY[a].provider === 'yahoo')

  const items: { asset: Asset; price: number; change24h: number }[] = []

  // Fetch in parallel
  const [cdcStats, ...yahooResults] = await Promise.all([
    cdcAssets.length
      ? fetchPrice(cdcAssets).catch(() => ({} as Partial<Record<Asset, { price: number; change24h: number; volume24h: number; marketCap: number }>>))
      : Promise.resolve({} as Partial<Record<Asset, { price: number; change24h: number; volume24h: number; marketCap: number }>>),
    ...yahooAssets.map(a =>
      fetchYahooPrice(ASSET_REGISTRY[a].instrumentName)
        .then(s => ({ asset: a, price: s.price, change24h: s.change24h }))
        .catch(() => ({ asset: a, price: ASSET_REGISTRY[a].fallbackPrice, change24h: 0 }))
    ),
  ])

  // Merge Crypto.com results
  for (const a of cdcAssets) {
    const s = (cdcStats as Record<string, { price: number; change24h: number }>)[a]
    items.push({ asset: a, price: s?.price ?? ASSET_REGISTRY[a].fallbackPrice, change24h: s?.change24h ?? 0 })
  }

  // Merge Yahoo results
  for (const yr of yahooResults) {
    items.push(yr as { asset: Asset; price: number; change24h: number })
  }

  // Sort by original request order
  items.sort((a, b) => assetList.indexOf(a.asset) - assetList.indexOf(b.asset))

  return NextResponse.json(
    { items },
    { headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=15' } }
  )
}
