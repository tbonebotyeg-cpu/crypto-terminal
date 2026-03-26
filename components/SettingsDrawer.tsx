'use client'

import { IndicatorWeights, IndicatorGroup } from '../types/indicators'

interface Props {
  open: boolean
  onClose: () => void
  weights: IndicatorWeights
  onWeightsChange: (w: IndicatorWeights) => void
  accountSize: number
  onAccountSizeChange: (n: number) => void
}

const GROUPS: { key: IndicatorGroup; label: string }[] = [
  { key: 'trend', label: 'Trend Indicators' },
  { key: 'momentum', label: 'Momentum Indicators' },
  { key: 'volatility', label: 'Volatility Indicators' },
  { key: 'volume', label: 'Volume Indicators' },
  { key: 'statistical', label: 'Statistical Indicators' },
  { key: 'structure', label: 'Market Structure' },
]

export default function SettingsDrawer({ open, onClose, weights, onWeightsChange, accountSize, onAccountSizeChange }: Props) {
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-80 bg-[#0a1628] border-l border-[#1e3a5f] z-50 overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-mono font-semibold text-slate-200">Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg font-mono">×</button>
        </div>

        <div className="mb-6">
          <label className="text-xs font-mono text-slate-400 block mb-2">Account Size (USD)</label>
          <input
            type="number"
            value={accountSize}
            onChange={e => onAccountSizeChange(Number(e.target.value))}
            className="w-full bg-[#0d1829] border border-[#1e3a5f] text-slate-200 font-mono text-sm px-3 py-2 rounded focus:outline-none focus:border-cyan-500"
          />
          <p className="text-[10px] text-slate-500 font-mono mt-1">Position sized to risk 1.5% per trade</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Indicator Weights</h3>
          {GROUPS.map(({ key, label }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-mono text-slate-300">{label}</label>
                <span className="text-xs font-mono text-cyan-400">{weights[key].toFixed(1)}×</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={weights[key]}
                onChange={e => onWeightsChange({ ...weights, [key]: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500"
              />
            </div>
          ))}
        </div>

        <button
          onClick={() => onWeightsChange({ trend: 1, momentum: 1, volatility: 0.7, volume: 0.8, statistical: 0.9, structure: 1 })}
          className="mt-6 w-full px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded text-xs font-mono transition-colors"
        >
          Reset to defaults
        </button>
      </div>
    </>
  )
}
