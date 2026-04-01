'use client'

import { useState } from 'react'
import { Asset, AssetCategory, ASSET_REGISTRY, AssetConfig } from '../types/market'

const CATEGORY_LABELS: Record<AssetCategory, string> = {
  crypto: 'Crypto',
  commodity: 'Commodities',
  index: 'Indices',
}

const CATEGORIES: AssetCategory[] = ['crypto', 'commodity', 'index']

const GROUPED: Record<AssetCategory, AssetConfig[]> = CATEGORIES.reduce((acc, cat) => {
  acc[cat] = Object.values(ASSET_REGISTRY).filter(a => a.category === cat)
  return acc
}, {} as Record<AssetCategory, AssetConfig[]>)

interface Props {
  selected: Asset
  onSelect: (a: Asset) => void
  stats?: Partial<Record<Asset, { price: number; change24h: number }>>
}

export default function AssetSelector({ selected, onSelect, stats }: Props) {
  const selectedCategory = ASSET_REGISTRY[selected]?.category ?? 'crypto'
  const [category, setCategory] = useState<AssetCategory>(selectedCategory)

  return (
    <div className="flex items-center gap-2">
      {/* Category tabs */}
      <div className="flex gap-0.5 bg-[#0d1829] rounded p-0.5 border border-[#1e3a5f]">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all ${
              cat === category
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Asset buttons for selected category */}
      <div className="flex gap-1 overflow-x-auto scrollbar-thin">
        {GROUPED[category].map(cfg => {
          const s = stats?.[cfg.symbol]
          const change = s?.change24h ?? 0
          const isSelected = cfg.symbol === selected
          return (
            <button
              key={cfg.symbol}
              onClick={() => onSelect(cfg.symbol)}
              className={`px-2.5 py-1.5 rounded text-xs font-mono transition-all whitespace-nowrap flex-shrink-0 ${
                isSelected
                  ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                  : 'bg-[#0d1829] border border-[#1e3a5f] text-slate-400 hover:border-cyan-700 hover:text-slate-200'
              }`}
            >
              <span className="font-bold">{cfg.symbol}</span>
              {s && (
                <span className={`ml-1.5 text-[10px] ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
