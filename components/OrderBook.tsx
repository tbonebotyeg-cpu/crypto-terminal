'use client'

import { useEffect, useState, useRef } from 'react'
import { Asset, ASSET_REGISTRY } from '../types/market'

interface OrderBookEntry {
  price: string
  qty: string
}

interface OrderBookData {
  bids: OrderBookEntry[]
  asks: OrderBookEntry[]
}

interface Props {
  asset: Asset
  currentPrice: number
}

export default function OrderBook({ asset, currentPrice }: Props) {
  const [book, setBook] = useState<OrderBookData | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const config = ASSET_REGISTRY[asset]

  useEffect(() => {
    if (config.provider !== 'crypto_com') { setBook(null); return }

    const fetchBook = async () => {
      try {
        const res = await fetch(`/api/orderbook?asset=${asset}`)
        if (!res.ok) return
        const data = await res.json()
        setBook(data)
      } catch {}
    }
    fetchBook()
    timerRef.current = setInterval(fetchBook, 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [asset, config.provider])

  if (config.provider !== 'crypto_com') {
    return (
      <div className="bg-[#0a1628] rounded-lg border border-[#1e3a5f] p-3">
        <h3 className="text-xs font-mono font-bold text-slate-400 tracking-wider uppercase mb-2">Order Book</h3>
        <p className="text-xs text-slate-600 text-center py-4">Not available for {config.name}</p>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="bg-[#0a1628] rounded-lg border border-[#1e3a5f] p-3">
        <h3 className="text-xs font-mono font-bold text-slate-400 tracking-wider uppercase mb-2">Order Book</h3>
        <p className="text-xs text-slate-600 text-center py-4 animate-pulse">Loading...</p>
      </div>
    )
  }

  const asks = book.asks.slice(0, 8).reverse()
  const bids = book.bids.slice(0, 8)
  const maxQty = Math.max(
    ...asks.map(a => parseFloat(a.qty)),
    ...bids.map(b => parseFloat(b.qty)),
    0.001
  )

  return (
    <div className="bg-[#0a1628] rounded-lg border border-[#1e3a5f] p-3">
      <h3 className="text-xs font-mono font-bold text-slate-400 tracking-wider uppercase mb-2">Order Book</h3>
      <div className="flex justify-between text-[9px] font-mono text-slate-600 mb-1 px-1">
        <span>Price</span>
        <span>Size</span>
      </div>
      {/* Asks (sells) — red */}
      {asks.map((a, i) => {
        const pct = (parseFloat(a.qty) / maxQty) * 100
        return (
          <div key={`a-${i}`} className="relative flex justify-between items-center text-[11px] font-mono py-[2px] px-1">
            <div className="absolute inset-y-0 right-0 bg-red-500/10 rounded-sm" style={{ width: `${pct}%` }} />
            <span className="text-red-400 relative z-10">{parseFloat(a.price).toLocaleString()}</span>
            <span className="text-slate-500 relative z-10">{parseFloat(a.qty).toFixed(4)}</span>
          </div>
        )
      })}
      {/* Spread */}
      <div className="flex justify-center items-center py-1 my-0.5 border-y border-[#1e3a5f]/50">
        <span className="text-xs font-mono font-bold text-cyan-400">
          {currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
        {asks.length > 0 && bids.length > 0 && (
          <span className="text-[9px] font-mono text-slate-600 ml-2">
            spread {(parseFloat(asks[asks.length - 1]?.price ?? '0') - parseFloat(bids[0]?.price ?? '0')).toFixed(2)}
          </span>
        )}
      </div>
      {/* Bids (buys) — green */}
      {bids.map((b, i) => {
        const pct = (parseFloat(b.qty) / maxQty) * 100
        return (
          <div key={`b-${i}`} className="relative flex justify-between items-center text-[11px] font-mono py-[2px] px-1">
            <div className="absolute inset-y-0 right-0 bg-emerald-500/10 rounded-sm" style={{ width: `${pct}%` }} />
            <span className="text-emerald-400 relative z-10">{parseFloat(b.price).toLocaleString()}</span>
            <span className="text-slate-500 relative z-10">{parseFloat(b.qty).toFixed(4)}</span>
          </div>
        )
      })}
    </div>
  )
}
