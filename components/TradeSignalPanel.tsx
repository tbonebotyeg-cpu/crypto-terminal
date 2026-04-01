'use client'

import { useState } from 'react'
import { TradeSetup } from '../types/signals'
import TradeSetupCard from './TradeSetupCard'

interface Props {
  setups: TradeSetup[]
}

export default function TradeSignalPanel({ setups }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="bg-[#0a1628] border border-[#1e3a5f] rounded-lg p-4" data-testid="trade-signal-panel">
      <h2 className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Trade Signals
        {setups.length > 0 && (
          <span className="ml-2 px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] rounded border border-cyan-500/30">
            {setups.length}
          </span>
        )}
      </h2>

      {setups.length === 0 ? (
        <div className="text-center text-slate-500 font-mono text-sm py-6">
          No active signals — waiting for confluence...
        </div>
      ) : (
        <div className="space-y-2">
          {setups.map(setup => (
            <TradeSetupCard
              key={setup.id}
              setup={setup}
              expanded={expandedId === setup.id}
              onToggle={() => setExpandedId(prev => prev === setup.id ? null : setup.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
