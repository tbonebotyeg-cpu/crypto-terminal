'use client'

import { useEffect, useState, useRef } from 'react'
import { Asset, ASSET_REGISTRY } from '../types/market'

interface Trade {
  price: string
  qty: string
  side: string
  time: number
}

interface Props {
  asset: Asset
}

export default function RecentTrades({ asset }: Props) {
  const [trades, setTrades] = useState<Trade[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const config = ASSET_REGISTRY[asset]

  useEffect(() => {
    if (config.provider !== 'crypto_com') { setTrades([]); return }

    const fetchTrades = async () => {
      try {
        const res = await fetch(`/api/trades?asset=${asset}`)
        if (!res.ok) return
        const data = await res.json()
        setTrades(data.trades ?? [])
      } catch {}
    }
    fetchTrades()
    timerRef.current = setInterval(fetchTrades, 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [asset, config.provider])

  if (config.provider !== 'crypto_com') {
    return (
      <div className="bg-[#0a1628] rounded-lg border border-[#1e3a5f] p-3">
        <h3 className="text-xs font-mono font-bold text-slate-400 tracking-wider uppercase mb-2">Recent Trades</h3>
        <p className="text-xs text-slate-600 text-center py-4">Not available for {config.name}</p>
      </div>
    )
  }

  if (!trades.length) {
    return (
      <div className="bg-[#0a1628] rounded-lg border border-[#1e3a5f] p-3">
        <h3 className="text-xs font-mono font-bold text-slate-400 tracking-wider uppercase mb-2">Recent Trades</h3>
        <p className="text-xs text-slate-600 text-center py-4 animate-pulse">Loading...</p>
      </div>
    )
  }

  return (
    <div className="bg-[#0a1628] rounded-lg border border-[#1e3a5f] p-3">
      <h3 className="text-xs font-mono font-bold text-slate-400 tracking-wider uppercase mb-2">Recent Trades</h3>
      <div className="flex justify-between text-[9px] font-mono text-slate-600 mb-1 px-1">
        <span>Price</span>
        <span>Size</span>
        <span>Time</span>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {trades.map((t, i) => {
          const isBuy = t.side === 'BUY'
          const time = new Date(t.time)
          const timeStr = time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
          return (
            <div key={i} className="flex justify-between items-center text-[11px] font-mono py-[2px] px-1">
              <span className={isBuy ? 'text-emerald-400' : 'text-red-400'}>
                {parseFloat(t.price).toLocaleString()}
              </span>
              <span className="text-slate-500">{parseFloat(t.qty).toFixed(4)}</span>
              <span className="text-slate-600">{timeStr}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
