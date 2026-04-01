import { NextRequest, NextResponse } from 'next/server'
import { Asset, ASSET_REGISTRY } from '../../../types/market'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const asset = (req.nextUrl.searchParams.get('asset') ?? 'BTC') as Asset
  const config = ASSET_REGISTRY[asset]
  if (!config || config.provider !== 'crypto_com') {
    return NextResponse.json({ bids: [], asks: [] })
  }

  try {
    const url = `https://api.crypto.com/exchange/v1/public/get-book?instrument_name=${config.instrumentName}&depth=10`
    const res = await fetch(url, { next: { revalidate: 5 } })
    if (!res.ok) throw new Error(`Book ${res.status}`)
    const json = await res.json()
    const data = json.result?.data?.[0] ?? json.result ?? json
    return NextResponse.json({
      bids: (data.bids ?? []).map((b: [string, string, number] | { price: string; qty: string }) =>
        Array.isArray(b) ? { price: b[0], qty: b[1] } : b
      ),
      asks: (data.asks ?? []).map((a: [string, string, number] | { price: string; qty: string }) =>
        Array.isArray(a) ? { price: a[0], qty: a[1] } : a
      ),
    })
  } catch (err) {
    console.error('[orderbook]', err)
    return NextResponse.json({ bids: [], asks: [] })
  }
}
