'use client'

import { MarketStats as StatsType } from '../types/market'

interface Props {
  stats: StatsType | null
  asset: string
}

function fmt(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`
  return `$${n.toFixed(2)}`
}

function fmtPrice(n: number): string {
  if (n >= 10000) return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  if (n >= 100) return `$${n.toFixed(2)}`
  if (n >= 1) return `$${n.toFixed(4)}`
  return `$${n.toFixed(6)}`
}

function fmtCompact(n: number): string {
  if (n >= 10000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (n >= 100) return n.toFixed(1)
  if (n >= 1) return n.toFixed(2)
  return n.toFixed(4)
}

export default function MarketStats({ stats, asset }: Props) {
  if (!stats) {
    return (
      <div className="flex gap-3 text-xs font-mono text-slate-500 animate-pulse">
        <span>Loading {asset} data...</span>
      </div>
    )
  }
  const changePositive = stats.change24h >= 0
  const hasRange = stats.high24h && stats.low24h && stats.high24h > stats.low24h
  const rangePct = hasRange
    ? ((stats.price - stats.low24h!) / (stats.high24h! - stats.low24h!)) * 100
    : 50

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <span className="text-xl font-mono font-bold text-white">{fmtPrice(stats.price)}</span>
      <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${
        changePositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
      }`}>
        {changePositive ? '+' : ''}{stats.change24h.toFixed(2)}%
      </span>
      {stats.volume24h > 0 && (
        <span className="text-xs font-mono text-slate-400">
          Vol <span className="text-slate-200">{fmt(stats.volume24h)}</span>
        </span>
      )}
      {stats.marketCap > 0 && (
        <span className="text-xs font-mono text-slate-400">
          MCap <span className="text-slate-200">{fmt(stats.marketCap)}</span>
        </span>
      )}
      {hasRange && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-red-400">{fmtCompact(stats.low24h!)}</span>
          <div className="w-20 h-1.5 bg-[#1e3a5f] rounded-full relative">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500"
              style={{ width: '100%' }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow border border-slate-700"
              style={{ left: `calc(${Math.max(2, Math.min(98, rangePct))}% - 4px)` }}
            />
          </div>
          <span className="text-[10px] font-mono text-emerald-400">{fmtCompact(stats.high24h!)}</span>
        </div>
      )}
    </div>
  )
}
