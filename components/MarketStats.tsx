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

export default function MarketStats({ stats, asset }: Props) {
  if (!stats) {
    return (
      <div className="flex gap-3 text-xs font-mono text-slate-500 animate-pulse">
        <span>Loading {asset} data...</span>
      </div>
    )
  }
  const changePositive = stats.change24h >= 0
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <span className="text-xl font-mono font-bold text-white">{fmtPrice(stats.price)}</span>
      <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${
        changePositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
      }`}>
        {changePositive ? '+' : ''}{stats.change24h.toFixed(2)}%
      </span>
      <span className="text-xs font-mono text-slate-400">
        Vol <span className="text-slate-200">{fmt(stats.volume24h)}</span>
      </span>
      <span className="text-xs font-mono text-slate-400">
        MCap <span className="text-slate-200">{fmt(stats.marketCap)}</span>
      </span>
    </div>
  )
}
