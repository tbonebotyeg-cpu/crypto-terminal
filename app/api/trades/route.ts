import { NextRequest, NextResponse } from 'next/server'
import { Asset, ASSET_REGISTRY } from '../../../types/market'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const asset = (req.nextUrl.searchParams.get('asset') ?? 'BTC') as Asset
  const config = ASSET_REGISTRY[asset]
  if (!config || config.provider !== 'crypto_com') {
    return NextResponse.json({ trades: [] })
  }

  try {
    const url = `https://api.crypto.com/exchange/v1/public/get-trades?instrument_name=${config.instrumentName}&count=20`
    const res = await fetch(url, { next: { revalidate: 5 } })
    if (!res.ok) throw new Error(`Trades ${res.status}`)
    const json = await res.json()
    const data = json.result?.data ?? json.data ?? []
    const trades = data.map((t: Record<string, string | number>) => ({
      price: String(t.p ?? t.price ?? '0'),
      qty: String(t.q ?? t.qty ?? '0'),
      side: String(t.s ?? t.side ?? 'BUY'),
      time: Number(t.t ?? t.timestamp ?? Date.now()),
    }))
    return NextResponse.json({ trades })
  } catch (err) {
    console.error('[trades]', err)
    return NextResponse.json({ trades: [] })
  }
}
