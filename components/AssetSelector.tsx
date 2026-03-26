'use client'

import { Asset } from '../types/market'

const ASSETS: Asset[] = ['BTC', 'ETH', 'SOL', 'XRP']

interface Props {
  selected: Asset
  onSelect: (a: Asset) => void
  stats?: Record<Asset, { price: number; change24h: number }>
}

export default function AssetSelector({ selected, onSelect, stats }: Props) {
  return (
    <div className="flex gap-1">
      {ASSETS.map(asset => {
        const s = stats?.[asset]
        const change = s?.change24h ?? 0
        const isSelected = asset === selected
        return (
          <button
            key={asset}
            onClick={() => onSelect(asset)}
            className={`px-3 py-2 rounded text-sm font-mono transition-all ${
              isSelected
                ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                : 'bg-[#0d1829] border border-[#1e3a5f] text-slate-400 hover:border-cyan-700 hover:text-slate-200'
            }`}
          >
            <span className="font-bold">{asset}</span>
            {s && (
              <span className={`ml-2 text-xs ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
