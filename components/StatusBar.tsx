'use client'

import { DataSource } from '../types/market'

interface Props {
  source: DataSource
  lastFetch: number | null
  isLoading: boolean
}

export default function StatusBar({ source, lastFetch, isLoading }: Props) {
  const time = lastFetch ? new Date(lastFetch).toLocaleTimeString() : '--:--:--'
  return (
    <div className="flex items-center gap-2">
      {isLoading ? (
        <span className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          LOADING
        </span>
      ) : source === 'live' ? (
        <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          LIVE
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-xs font-mono text-amber-400">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          SIM
        </span>
      )}
      <span className="text-xs font-mono text-slate-500">{time}</span>
    </div>
  )
}
