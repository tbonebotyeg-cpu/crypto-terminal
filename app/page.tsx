'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useWatchlist } from '../hooks/useWatchlist'
import { Asset, ASSET_REGISTRY } from '../types/market'

interface TradeLog {
  id: string
  instrument: string
  side: 'long' | 'short'
  entry: number
  exit: number | null
  qty: number
  leverage: number
  pnl: number | null
  status: 'open' | 'closed'
  date: string
}

function loadTradeLog(): TradeLog[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem('tt_trades') || '[]') } catch { return [] }
}

function loadAccountSize(): number {
  if (typeof window === 'undefined') return 10000
  return parseFloat(localStorage.getItem('tt_account_size') || '10000')
}

export default function DashboardPage() {
  const { items: watchlistItems } = useWatchlist()
  const [trades, setTrades] = useState<TradeLog[]>([])
  const [accountSize, setAccountSize] = useState(10000)

  useEffect(() => {
    setTrades(loadTradeLog())
    setAccountSize(loadAccountSize())
  }, [])

  const openTrades = trades.filter(t => t.status === 'open')
  const closedTrades = trades.filter(t => t.status === 'closed')
  const totalPnl = closedTrades.reduce((s, t) => s + (t.pnl ?? 0), 0)
  const equity = accountSize + totalPnl
  const winCount = closedTrades.filter(t => (t.pnl ?? 0) > 0).length
  const lossCount = closedTrades.filter(t => (t.pnl ?? 0) < 0).length
  const winRate = closedTrades.length > 0 ? (winCount / closedTrades.length) * 100 : 0
  const avgWin = winCount > 0 ? closedTrades.filter(t => (t.pnl ?? 0) > 0).reduce((s, t) => s + (t.pnl ?? 0), 0) / winCount : 0
  const avgLoss = lossCount > 0 ? closedTrades.filter(t => (t.pnl ?? 0) < 0).reduce((s, t) => s + (t.pnl ?? 0), 0) / lossCount : 0

  return (
    <div className="p-3 space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-lg font-mono font-bold text-cyan-400 tracking-wider">TRADING TERMINAL</h1>
          <p className="text-[10px] font-mono text-slate-600 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            {' · '}
            <span className="text-emerald-400 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
              Live
            </span>
          </p>
        </div>
      </div>

      {/* Equity Card */}
      <div className="bg-[#0a1628] border border-[#1e3a5f] rounded-lg p-4">
        <p className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">Portfolio Equity</p>
        <p className="text-2xl font-mono font-bold text-slate-100 mt-1">
          ${equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className={`text-xs font-mono font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
          </span>
          <span className={`text-[10px] font-mono ${totalPnl >= 0 ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
            ({accountSize > 0 ? ((totalPnl / accountSize) * 100).toFixed(2) : '0.00'}%)
          </span>
          <span className="text-[10px] font-mono text-slate-700">from ${accountSize.toLocaleString()} base</span>
        </div>
        {/* Mini equity bar */}
        {totalPnl !== 0 && (
          <div className="mt-3 h-1 bg-[#0d1829] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${totalPnl >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(100, Math.max(2, Math.abs(totalPnl / accountSize) * 100 * 5))}%` }}
            />
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        <StatCard label="Open" value={String(openTrades.length)} color="text-amber-400" />
        <StatCard label="Win Rate" value={closedTrades.length > 0 ? `${winRate.toFixed(0)}%` : '\u2014'} color="text-cyan-400" />
        <StatCard label="W / L" value={closedTrades.length > 0 ? `${winCount}/${lossCount}` : '\u2014'} color="text-slate-300" />
        <StatCard label="Avg Win" value={avgWin > 0 ? `$${avgWin.toFixed(0)}` : '\u2014'} color="text-emerald-400" />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-2">
        <Link href="/markets" className="bg-[#0a1628] border border-[#1e3a5f] rounded-lg p-3 hover:border-cyan-700 transition-colors">
          <span className="text-lg">📈</span>
          <p className="text-sm font-mono font-bold text-slate-300 mt-1">Markets</p>
          <p className="text-[10px] font-mono text-slate-600">Charts, indicators, signals</p>
        </Link>
        <Link href="/calc" className="bg-[#0a1628] border border-[#1e3a5f] rounded-lg p-3 hover:border-cyan-700 transition-colors">
          <span className="text-lg">🧮</span>
          <p className="text-sm font-mono font-bold text-slate-300 mt-1">Calculators</p>
          <p className="text-[10px] font-mono text-slate-600">Position, P&L, R:R, liq</p>
        </Link>
        <Link href="/trades" className="bg-[#0a1628] border border-[#1e3a5f] rounded-lg p-3 hover:border-cyan-700 transition-colors">
          <span className="text-lg">📋</span>
          <p className="text-sm font-mono font-bold text-slate-300 mt-1">Trade Log</p>
          <p className="text-[10px] font-mono text-slate-600">{trades.length} entries logged</p>
        </Link>
        <Link href="/settings" className="bg-[#0a1628] border border-[#1e3a5f] rounded-lg p-3 hover:border-cyan-700 transition-colors">
          <span className="text-lg">⚙️</span>
          <p className="text-sm font-mono font-bold text-slate-300 mt-1">Settings</p>
          <p className="text-[10px] font-mono text-slate-600">Account & preferences</p>
        </Link>
      </div>

      {/* Watchlist */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Watchlist</span>
          <Link href="/markets" className="text-[10px] font-mono text-cyan-600 hover:text-cyan-400">View All →</Link>
        </div>
        <div className="bg-[#0a1628] rounded-lg border border-[#1e3a5f] overflow-hidden divide-y divide-[#1e3a5f]/50">
          {watchlistItems.length === 0 && (
            <p className="text-xs font-mono text-slate-600 text-center py-6">Loading watchlist...</p>
          )}
          {watchlistItems.slice(0, 8).map(item => (
            <Link
              key={item.asset}
              href="/markets"
              className="flex items-center justify-between px-3 py-2.5 hover:bg-[#0d1829] transition-colors"
            >
              <div>
                <span className="font-mono font-bold text-sm text-slate-300">{item.asset}</span>
                <span className="text-[10px] font-mono text-slate-600 ml-2">{ASSET_REGISTRY[item.asset]?.name ?? ''}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-mono text-slate-300">
                  ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: item.price < 1 ? 6 : 2 })}
                </span>
                <span className={`text-[10px] font-mono ml-2 ${item.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Trades */}
      {trades.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Recent Trades</span>
            <Link href="/trades" className="text-[10px] font-mono text-cyan-600 hover:text-cyan-400">View All →</Link>
          </div>
          <div className="bg-[#0a1628] rounded-lg border border-[#1e3a5f] overflow-hidden divide-y divide-[#1e3a5f]/50">
            {trades.slice(0, 5).map(trade => (
              <div key={trade.id} className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    trade.side === 'long' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {trade.side.toUpperCase()}
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-300">{trade.instrument}</span>
                  {trade.status === 'open' && (
                    <span className="text-[7px] font-mono px-1 py-0.5 bg-amber-500/20 text-amber-400 rounded">OPEN</span>
                  )}
                </div>
                <div className="text-right">
                  {trade.pnl !== null ? (
                    <span className={`text-xs font-mono font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-slate-600">${trade.entry.toLocaleString()}</span>
                  )}
                  <span className="text-[9px] font-mono text-slate-700 ml-2">{trade.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open Positions */}
      {openTrades.length > 0 && (
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Open Positions</span>
          <div className="mt-2 space-y-1.5">
            {openTrades.map(trade => (
              <div key={trade.id} className="bg-[#0a1628] border border-[#1e3a5f] rounded-lg p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    trade.side === 'long' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {trade.side.toUpperCase()}
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-300">{trade.instrument}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-slate-400">${trade.entry.toLocaleString()}</span>
                  <span className="text-[10px] font-mono text-slate-600 ml-2">{trade.qty} × {trade.leverage}x</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#0a1628] border border-[#1e3a5f] rounded-lg p-2 text-center">
      <p className="text-[8px] font-mono text-slate-600 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-mono font-bold ${color}`}>{value}</p>
    </div>
  )
}
