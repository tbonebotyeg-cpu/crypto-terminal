'use client'

import { TradeSetup } from '../types/signals'

interface Props {
  setup: TradeSetup
  expanded: boolean
  onToggle: () => void
}

function fmtPrice(n: number): string {
  if (n >= 10000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (n >= 1) return n.toFixed(4)
  return n.toFixed(6)
}

export default function TradeSetupCard({ setup, expanded, onToggle }: Props) {
  const isLong = setup.direction === 'LONG'
  const dirStyles = isLong
    ? { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400' }
    : { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', badge: 'bg-red-500/20 text-red-400' }

  const risk = Math.abs(setup.entry - setup.stopLoss)

  return (
    <div
      className={`${dirStyles.bg} border ${dirStyles.border} rounded-lg overflow-hidden cursor-pointer transition-all`}
      onClick={onToggle}
    >
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${dirStyles.badge}`}>
            {setup.direction}
          </span>
          {setup.isPremiumSetup && (
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              PREMIUM
            </span>
          )}
          <span className="text-xs font-mono text-slate-400">{setup.asset} · {setup.timeframe}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">
            <span className="text-slate-200">{setup.winProbability.toFixed(0)}%</span> conf
          </span>
          <span className="text-xs font-mono text-slate-400">
            1:{setup.rrRatio.toFixed(2)} R:R
          </span>
          <span className={`text-xs font-mono ${dirStyles.text}`}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[#1e3a5f] p-3 space-y-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-xs">
            <div className="text-slate-400">Entry</div>
            <div className="text-white">${fmtPrice(setup.entry)}</div>

            <div className="text-amber-400">TP1 (1:{risk > 0 ? (Math.abs(setup.tp1 - setup.entry) / risk).toFixed(1) : '—'})</div>
            <div className="text-amber-400">${fmtPrice(setup.tp1)}</div>

            <div className="text-emerald-400">TP2 (1:{risk > 0 ? (Math.abs(setup.tp2 - setup.entry) / risk).toFixed(1) : '—'})</div>
            <div className="text-emerald-400">${fmtPrice(setup.tp2)}</div>

            <div className="text-red-400">Stop Loss</div>
            <div className="text-red-400">${fmtPrice(setup.stopLoss)}</div>

            <div className="text-slate-400">Confirming</div>
            <div className="text-slate-200">{setup.confirmingCount}/{setup.totalIndicators} indicators</div>

            <div className="text-slate-400">Position Size</div>
            <div className="text-slate-200">{(setup.positionSizePct * 100).toFixed(2)}% of account</div>
          </div>

          {setup.isPremiumSetup && (
            <div className="mt-2 p-2 bg-yellow-500/5 border border-yellow-500/20 rounded text-[11px] font-mono text-yellow-400">
              Multi-TF EMA + RSI bounce confirmed on higher timeframe
            </div>
          )}
        </div>
      )}
    </div>
  )
}
