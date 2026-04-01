'use client'

import { useEffect, useState, useRef, memo } from 'react'
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

const TradeRow = memo(function TradeRow({ trade, isNew }: { trade: Trade; isNew: boolean }) {
  const isBuy = trade.side === 'BUY'
  const time = new Date(trade.time)
  const timeStr = time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return (
    <div
      data-testid="trade-row"
      className={`flex justify-between items-center text-[11px] font-mono py-[2px] px-1 rounded transition-colors ${isNew ? (isBuy ? 'animate-pulse bg-emerald-500/10' : 'animate-pulse bg-red-500/10') : ''}`}
    >
      <span className={isBuy ? 'text-emerald-400' : 'text-red-400'}>
        {parseFloat(trade.price).toLocaleString()}
      </span>
      <span className="text-slate-500">{parseFloat(trade.qty).toFixed(4)}</span>
      <span className="text-slate-600">{timeStr}</span>
    </div>
  )
})

export default function RecentTrades({ asset }: Props) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [newTradeKeys, setNewTradeKeys] = useState<Set<number>>(new Set())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevTopTimeRef = useRef<number>(0)
  const config = ASSET_REGISTRY[asset]

  useEffect(() => {
    if (config.provider !== 'crypto_com') { setTrades([]); return }

    const fetchTrades = async () => {
      try {
        const res = await fetch(`/api/trades?asset=${asset}`)
        if (!res.ok) return
        const data = await res.json()
        const incoming: Trade[] = data.trades ?? []
        setTrades(incoming)

        // Flash new trades since last fetch
        if (incoming.length && incoming[0].time !== prevTopTimeRef.current) {
          const newKeys = new Set<number>()
          for (const t of incoming) {
            if (t.time > prevTopTimeRef.current) newKeys.add(t.time)
            else break
          }
          prevTopTimeRef.current = incoming[0].time
          setNewTradeKeys(newKeys)
          setTimeout(() => setNewTradeKeys(new Set()), 1000)
        }
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

  const buys = trades.filter(t => t.side === 'BUY')
  const buyVol = buys.reduce((s, t) => s + parseFloat(t.qty), 0)
  const totalVol = trades.reduce((s, t) => s + parseFloat(t.qty), 0)
  const buyPct = totalVol > 0 ? (buyVol / totalVol) * 100 : 50

  return (
    <div className="bg-[#0a1628] rounded-lg border border-[#1e3a5f] p-3">
      <h3 className="text-xs font-mono font-bold text-slate-400 tracking-wider uppercase mb-2">Recent Trades</h3>

      {/* Buy/Sell pressure bar */}
      <div className="mb-2">
        <div className="flex justify-between text-[9px] font-mono mb-0.5">
          <span className="text-emerald-400">Buy {buyPct.toFixed(0)}%</span>
          <span className="text-red-400">{(100 - buyPct).toFixed(0)}% Sell</span>
        </div>
        <div className="h-1.5 bg-red-500/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500/60 rounded-full transition-all duration-500"
            style={{ width: `${buyPct}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between text-[9px] font-mono text-slate-600 mb-1 px-1">
        <span>Price</span>
        <span>Size</span>
        <span>Time</span>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {trades.map((t, i) => (
          <TradeRow key={`${t.time}-${i}`} trade={t} isNew={newTradeKeys.has(t.time)} />
        ))}
      </div>
    </div>
  )
}
