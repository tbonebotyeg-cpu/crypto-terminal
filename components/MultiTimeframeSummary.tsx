'use client'

import { Timeframe } from '../types/market'

interface TFScore {
  tf: Timeframe
  score: number
  loading?: boolean
}

interface Props {
  scores: TFScore[]
}

function badge(score: number) {
  if (score >= 65) return { label: 'BULL', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
  if (score <= 35) return { label: 'BEAR', cls: 'bg-red-500/20 text-red-400 border-red-500/30' }
  return { label: 'NEUT', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
}

export default function MultiTimeframeSummary({ scores }: Props) {
  if (!scores.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {scores.map(({ tf, score, loading }) => {
        const b = badge(score)
        return (
          <div key={tf} className="flex items-center gap-1 text-xs font-mono">
            <span className="text-slate-500">{tf}:</span>
            {loading ? (
              <span className="bg-slate-700/50 text-slate-500 border border-slate-600 px-1.5 py-0.5 rounded text-[10px]">—</span>
            ) : (
              <span className={`${b.cls} border px-1.5 py-0.5 rounded text-[10px] font-bold`}>{b.label}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
