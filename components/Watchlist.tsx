'use client'

import { useState } from 'react'
import { Asset, ASSET_REGISTRY, ALL_ASSETS } from '../types/market'
import { WatchlistItem } from '../hooks/useWatchlist'

function formatPrice(price: number, decimals: number): string {
  if (price >= 10000) return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  return price.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

interface Props {
  items: WatchlistItem[]
  watchlist: Asset[]
  selected: Asset
  onSelect: (a: Asset) => void
  onAdd: (a: Asset) => void
  onRemove: (a: Asset) => void
  collapsed: boolean
  onToggle: () => void
}

export default function Watchlist({ items, watchlist, selected, onSelect, onAdd, onRemove, collapsed, onToggle }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const available = ALL_ASSETS.filter(a => !watchlist.includes(a))

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="w-8 h-full bg-[#0a1628] border-r border-[#1e3a5f] flex items-center justify-center hover:bg-[#0d1829] transition-colors"
        title="Show watchlist"
      >
        <span className="text-slate-500 text-xs [writing-mode:vertical-rl] rotate-180 tracking-widest font-mono">WATCHLIST</span>
      </button>
    )
  }

  return (
    <div className="w-52 flex-shrink-0 bg-[#0a1628] border-r border-[#1e3a5f] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e3a5f]">
        <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">Watchlist</span>
        <div className="flex gap-1">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="w-5 h-5 flex items-center justify-center rounded text-xs text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
            title="Add asset"
          >+</button>
          <button
            onClick={onToggle}
            className="w-5 h-5 flex items-center justify-center rounded text-xs text-slate-500 hover:text-slate-300 transition-colors"
            title="Collapse"
          >&laquo;</button>
        </div>
      </div>

      {/* Add dropdown */}
      {showAdd && available.length > 0 && (
        <div className="max-h-40 overflow-y-auto border-b border-[#1e3a5f] bg-[#0d1829]">
          {available.map(a => {
            const cfg = ASSET_REGISTRY[a]
            return (
              <button
                key={a}
                onClick={() => { onAdd(a); setShowAdd(false) }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-[#1e3a5f]/30 transition-colors"
              >
                <span className="font-mono font-bold text-slate-300">{a}</span>
                <span className="text-[10px] text-slate-500 truncate">{cfg.name}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {items.map(item => {
          const cfg = ASSET_REGISTRY[item.asset]
          const isActive = item.asset === selected
          return (
            <div
              key={item.asset}
              onClick={() => onSelect(item.asset)}
              className={`group flex items-center justify-between px-3 py-2 cursor-pointer transition-colors border-l-2 ${
                isActive
                  ? 'bg-cyan-500/10 border-cyan-500'
                  : 'border-transparent hover:bg-[#0d1829]'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`font-mono font-bold text-xs ${isActive ? 'text-cyan-400' : 'text-slate-300'}`}>
                    {item.asset}
                  </span>
                  <span className="text-[9px] text-slate-600 truncate">{cfg.name}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-300 font-mono">
                    ${formatPrice(item.price, cfg.decimals)}
                  </span>
                  <span className={`text-[10px] font-mono ${item.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(item.asset) }}
                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 text-xs transition-opacity ml-1"
                title="Remove"
              >&times;</button>
            </div>
          )
        })}
        {items.length === 0 && watchlist.length > 0 && (
          <div className="px-3 py-4 text-xs text-slate-600 text-center font-mono">Loading...</div>
        )}
      </div>
    </div>
  )
}
