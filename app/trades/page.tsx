'use client'

import { useState, useEffect } from 'react'

interface Trade {
  id: string
  instrument: string
  side: 'long' | 'short'
  entry: number
  exit: number | null
  qty: number
  leverage: number
  pnl: number | null
  status: 'open' | 'closed'
  stopLoss: number | null
  takeProfit: number | null
  notes: string
  date: string
}

function loadTrades(): Trade[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem('tt_trades') || '[]') } catch { return [] }
}

function saveTrades(trades: Trade[]) {
  localStorage.setItem('tt_trades', JSON.stringify(trades))
}

type Filter = 'all' | 'open' | 'closed'

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { setTrades(loadTrades()) }, [])

  const filtered = trades.filter(t => filter === 'all' || t.status === filter)
  const closedTrades = trades.filter(t => t.status === 'closed')
  const totalPnl = closedTrades.reduce((s, t) => s + (t.pnl ?? 0), 0)
  const winCount = closedTrades.filter(t => (t.pnl ?? 0) > 0).length
  const bestTrade = closedTrades.length > 0 ? Math.max(...closedTrades.map(t => t.pnl ?? 0)) : 0
  const worstTrade = closedTrades.length > 0 ? Math.min(...closedTrades.map(t => t.pnl ?? 0)) : 0

  function addTrade(trade: Trade) {
    const updated = [trade, ...trades]
    setTrades(updated)
    saveTrades(updated)
    setShowForm(false)
  }

  function closeTrade(id: string, exitPrice: number) {
    const updated = trades.map(t => {
      if (t.id !== id) return t
      const diff = t.side === 'long' ? exitPrice - t.entry : t.entry - exitPrice
      const pnl = diff * t.qty * t.leverage
      return { ...t, exit: exitPrice, pnl, status: 'closed' as const }
    })
    setTrades(updated)
    saveTrades(updated)
  }

  function deleteTrade(id: string) {
    const updated = trades.filter(t => t.id !== id)
    setTrades(updated)
    saveTrades(updated)
    if (expanded === id) setExpanded(null)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-mono font-bold text-cyan-400 tracking-wider uppercase">Trade Log</h1>
          <p className="text-[10px] font-mono text-slate-600 mt-0.5">
            {trades.length} trades · P&L: <span className={totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>${totalPnl.toFixed(2)}</span>
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 bg-cyan-500/20 border border-cyan-500 text-cyan-400 rounded text-xs font-mono font-bold hover:bg-cyan-500/30 transition-colors"
        >
          {showForm ? '✕ Cancel' : '+ New'}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-[#1e3a5f] px-3">
        {(['all', 'open', 'closed'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 text-[10px] font-mono tracking-wider uppercase transition-colors ${
              filter === f ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-600'
            }`}
          >
            {f} ({f === 'all' ? trades.length : trades.filter(t => t.status === f).length})
          </button>
        ))}
      </div>

      {/* Stats Bar */}
      {closedTrades.length > 0 && (
        <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-[#0a1628]/50 border-b border-[#1e3a5f]">
          <div className="text-center">
            <p className="text-[7px] font-mono text-slate-600 uppercase">P&L</p>
            <p className={`text-[11px] font-mono font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[7px] font-mono text-slate-600 uppercase">Win Rate</p>
            <p className="text-[11px] font-mono font-bold text-cyan-400">
              {((winCount / closedTrades.length) * 100).toFixed(0)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-[7px] font-mono text-slate-600 uppercase">Best</p>
            <p className="text-[11px] font-mono font-bold text-emerald-400">+${bestTrade.toFixed(0)}</p>
          </div>
          <div className="text-center">
            <p className="text-[7px] font-mono text-slate-600 uppercase">Worst</p>
            <p className={`text-[11px] font-mono font-bold ${worstTrade >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {worstTrade >= 0 ? '+' : ''}${worstTrade.toFixed(0)}
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 pb-20 space-y-2">
        {showForm && <NewTradeForm onSave={addTrade} />}

        {filtered.length === 0 && !showForm && (
          <p className="text-xs font-mono text-slate-600 text-center py-8">No trades logged yet. Tap "+ New" to add one.</p>
        )}

        {filtered.map(trade => (
          <div key={trade.id} className="bg-[#0a1628] border border-[#1e3a5f] rounded-lg overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === trade.id ? null : trade.id)}
              className="w-full px-3 py-2.5 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  trade.side === 'long' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {trade.side.toUpperCase()}
                </span>
                <span className="text-sm font-mono font-bold text-slate-300">{trade.instrument}</span>
                {trade.status === 'open' && (
                  <span className="text-[8px] font-mono px-1 py-0.5 bg-amber-500/20 text-amber-400 rounded">OPEN</span>
                )}
              </div>
              <div className="text-right">
                {trade.pnl !== null ? (
                  <span className={`text-sm font-mono font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-xs font-mono text-slate-600">—</span>
                )}
              </div>
            </button>

            {expanded === trade.id && (
              <div className="px-3 pb-3 border-t border-[#1e3a5f] pt-2 space-y-1.5">
                <Row label="Entry" value={`$${trade.entry}`} />
                {trade.exit && <Row label="Exit" value={`$${trade.exit}`} />}
                <Row label="Quantity" value={String(trade.qty)} />
                <Row label="Leverage" value={`${trade.leverage}x`} />
                {trade.stopLoss && <Row label="Stop Loss" value={`$${trade.stopLoss}`} />}
                {trade.takeProfit && <Row label="Take Profit" value={`$${trade.takeProfit}`} />}
                {trade.notes && <Row label="Notes" value={trade.notes} />}
                <Row label="Date" value={trade.date} />

                <div className="flex gap-2 mt-2">
                  {trade.status === 'open' && (
                    <CloseTradeButton onClose={(price) => closeTrade(trade.id, price)} />
                  )}
                  <button
                    onClick={() => deleteTrade(trade.id)}
                    className="flex-1 py-1.5 bg-red-500/10 border border-red-500/50 text-red-400 rounded text-[10px] font-mono hover:bg-red-500/20 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[11px] font-mono">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-300">{value}</span>
    </div>
  )
}

function CloseTradeButton({ onClose }: { onClose: (price: number) => void }) {
  const [price, setPrice] = useState('')
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex-1 py-1.5 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 rounded text-[10px] font-mono hover:bg-emerald-500/20 transition-colors"
      >
        Close Trade
      </button>
    )
  }

  return (
    <div className="flex-1 flex gap-1">
      <input
        type="number"
        value={price}
        onChange={e => setPrice(e.target.value)}
        placeholder="Exit price"
        className="flex-1 bg-[#0d1829] border border-[#1e3a5f] rounded px-2 py-1 text-[10px] font-mono text-slate-200 placeholder:text-slate-700 focus:border-cyan-700 outline-none"
        autoFocus
      />
      <button
        onClick={() => { if (parseFloat(price)) onClose(parseFloat(price)) }}
        className="px-2 py-1 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded text-[10px] font-mono"
      >
        Close
      </button>
    </div>
  )
}

function NewTradeForm({ onSave }: { onSave: (trade: Trade) => void }) {
  const [instrument, setInstrument] = useState('BTC')
  const [side, setSide] = useState<'long' | 'short'>('long')
  const [entry, setEntry] = useState('')
  const [qty, setQty] = useState('')
  const [leverage, setLeverage] = useState('1')
  const [stopLoss, setStopLoss] = useState('')
  const [takeProfit, setTakeProfit] = useState('')
  const [notes, setNotes] = useState('')

  function handleSave() {
    if (!parseFloat(entry) || !parseFloat(qty)) return
    onSave({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      instrument,
      side,
      entry: parseFloat(entry),
      exit: null,
      qty: parseFloat(qty),
      leverage: parseFloat(leverage) || 1,
      pnl: null,
      status: 'open',
      stopLoss: parseFloat(stopLoss) || null,
      takeProfit: parseFloat(takeProfit) || null,
      notes,
      date: new Date().toISOString().split('T')[0],
    })
  }

  return (
    <div className="bg-[#0a1628] border border-cyan-500/30 rounded-lg p-3 space-y-2.5">
      <p className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">New Trade</p>

      <div className="flex gap-2">
        <button
          onClick={() => setSide('long')}
          className={`flex-1 py-2 rounded text-xs font-mono font-bold transition-colors ${
            side === 'long' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500' : 'bg-[#0d1829] text-slate-600 border border-[#1e3a5f]'
          }`}
        >
          LONG
        </button>
        <button
          onClick={() => setSide('short')}
          className={`flex-1 py-2 rounded text-xs font-mono font-bold transition-colors ${
            side === 'short' ? 'bg-red-500/20 text-red-400 border border-red-500' : 'bg-[#0d1829] text-slate-600 border border-[#1e3a5f]'
          }`}
        >
          SHORT
        </button>
      </div>

      <div>
        <label className="text-[9px] font-mono text-slate-600 uppercase block mb-1">Instrument</label>
        <select
          value={instrument}
          onChange={e => setInstrument(e.target.value)}
          className="w-full bg-[#0d1829] border border-[#1e3a5f] rounded px-2 py-2 text-xs font-mono text-slate-200 focus:border-cyan-700 outline-none"
        >
          {['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK', 'DOT', 'PAXG'].map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[9px] font-mono text-slate-600 uppercase block mb-1">Entry</label>
          <input type="number" value={entry} onChange={e => setEntry(e.target.value)} placeholder="0.00"
            className="w-full bg-[#0d1829] border border-[#1e3a5f] rounded px-2 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-700 focus:border-cyan-700 outline-none" />
        </div>
        <div>
          <label className="text-[9px] font-mono text-slate-600 uppercase block mb-1">Qty</label>
          <input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="0.00"
            className="w-full bg-[#0d1829] border border-[#1e3a5f] rounded px-2 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-700 focus:border-cyan-700 outline-none" />
        </div>
        <div>
          <label className="text-[9px] font-mono text-slate-600 uppercase block mb-1">Leverage</label>
          <input type="number" value={leverage} onChange={e => setLeverage(e.target.value)}
            className="w-full bg-[#0d1829] border border-[#1e3a5f] rounded px-2 py-2 text-xs font-mono text-slate-200 focus:border-cyan-700 outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] font-mono text-slate-600 uppercase block mb-1">Stop Loss</label>
          <input type="number" value={stopLoss} onChange={e => setStopLoss(e.target.value)} placeholder="optional"
            className="w-full bg-[#0d1829] border border-[#1e3a5f] rounded px-2 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-700 focus:border-cyan-700 outline-none" />
        </div>
        <div>
          <label className="text-[9px] font-mono text-slate-600 uppercase block mb-1">Take Profit</label>
          <input type="number" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} placeholder="optional"
            className="w-full bg-[#0d1829] border border-[#1e3a5f] rounded px-2 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-700 focus:border-cyan-700 outline-none" />
        </div>
      </div>

      <div>
        <label className="text-[9px] font-mono text-slate-600 uppercase block mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Trade thesis..."
          className="w-full bg-[#0d1829] border border-[#1e3a5f] rounded px-2 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-700 focus:border-cyan-700 outline-none min-h-[50px] resize-none"
        />
      </div>

      <button
        onClick={handleSave}
        className="w-full py-2 bg-cyan-500/20 border border-cyan-500 text-cyan-400 rounded text-xs font-mono font-bold hover:bg-cyan-500/30 transition-colors"
      >
        Log Trade
      </button>
    </div>
  )
}
