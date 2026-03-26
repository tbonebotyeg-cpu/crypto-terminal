'use client'

import { IndicatorResult } from '../types/indicators'

interface Props {
  result: IndicatorResult
}

const SIGNAL_STYLES = {
  BULLISH: { badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', bar: 'bg-emerald-500', border: 'border-emerald-500/20' },
  BEARISH: { badge: 'bg-red-500/20 text-red-400 border-red-500/40', bar: 'bg-red-500', border: 'border-red-500/20' },
  NEUTRAL: { badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40', bar: 'bg-amber-500', border: 'border-amber-500/20' },
}

const SIGNAL_SHORT = { BULLISH: 'BULL', BEARISH: 'BEAR', NEUTRAL: 'NEUT' }

export default function IndicatorTile({ result }: Props) {
  const styles = SIGNAL_STYLES[result.signal]
  return (
    <div className={`bg-[#0d1829] border ${styles.border} rounded p-2 flex flex-col gap-1.5 hover:border-cyan-700/50 transition-colors`}>
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-mono text-slate-300 truncate" title={result.name}>{result.name}</span>
        <span className={`text-[10px] font-mono font-bold px-1 py-0.5 rounded border ${styles.badge} flex-shrink-0`}>
          {SIGNAL_SHORT[result.signal]}
        </span>
      </div>
      <div className="text-[10px] font-mono text-slate-500 truncate">{result.label}</div>
      <div className="w-full h-1 bg-[#1e3a5f] rounded-full overflow-hidden">
        <div
          className={`h-full ${styles.bar} rounded-full transition-all duration-500`}
          style={{ width: `${result.strength}%` }}
        />
      </div>
    </div>
  )
}
