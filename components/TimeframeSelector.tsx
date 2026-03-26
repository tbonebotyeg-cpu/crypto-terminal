'use client'

import { Timeframe, TIMEFRAME_LABELS } from '../types/market'

const TIMEFRAMES: Timeframe[] = ['15m', '1H', '4H', '1D', '1W', '1M']

interface Props {
  selected: Timeframe
  onSelect: (tf: Timeframe) => void
}

export default function TimeframeSelector({ selected, onSelect }: Props) {
  return (
    <div className="flex gap-1">
      {TIMEFRAMES.map(tf => (
        <button
          key={tf}
          onClick={() => onSelect(tf)}
          className={`px-3 py-1.5 rounded text-xs font-mono transition-all ${
            tf === selected
              ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
              : 'bg-[#0d1829] border border-[#1e3a5f] text-slate-400 hover:border-cyan-700 hover:text-slate-200'
          }`}
        >
          {TIMEFRAME_LABELS[tf]}
        </button>
      ))}
    </div>
  )
}
