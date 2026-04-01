'use client'

import { useState, useMemo } from 'react'

type CalcTab = 'position' | 'pnl' | 'rr' | 'liquidation'

const TABS: { id: CalcTab; label: string }[] = [
  { id: 'position', label: 'Position' },
  { id: 'pnl', label: 'P&L' },
  { id: 'rr', label: 'R:R' },
  { id: 'liquidation', label: 'Liq' },
]

export default function CalcPage() {
  const [tab, setTab] = useState<CalcTab>('position')

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2">
        <h1 className="text-sm font-mono font-bold text-cyan-400 tracking-wider uppercase">Calculators</h1>
      </div>

      <div className="flex border-b border-[#1e3a5f]">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-xs font-mono tracking-wider uppercase transition-colors ${
              tab === t.id ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-600 hover:text-slate-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 pb-20">
        {tab === 'position' && <PositionSizeCalc />}
        {tab === 'pnl' && <PnLCalc />}
        {tab === 'rr' && <RiskRewardCalc />}
        {tab === 'liquidation' && <LiquidationCalc />}
      </div>
    </div>
  )
}

// ──────────────── Position Size Calculator ────────────────
function PositionSizeCalc() {
  const [account, setAccount] = useState('10000')
  const [riskPct, setRiskPct] = useState('1.5')
  const [entry, setEntry] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [leverage, setLeverage] = useState('1')

  const result = useMemo(() => {
    const acc = parseFloat(account) || 0
    const risk = parseFloat(riskPct) || 0
    const e = parseFloat(entry) || 0
    const sl = parseFloat(stopLoss) || 0
    const lev = parseFloat(leverage) || 1
    if (!e || !sl || e === sl) return null

    const riskAmount = acc * (risk / 100)
    const priceDiff = Math.abs(e - sl)
    const riskPerUnit = priceDiff / e
    const posSize = riskPerUnit > 0 ? (riskAmount / riskPerUnit) * lev : 0
    const qty = e > 0 ? posSize / e : 0
    const direction = sl < e ? 'LONG' : 'SHORT'

    return { riskAmount, posSize, qty, direction }
  }, [account, riskPct, entry, stopLoss, leverage])

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Account Size ($)" value={account} onChange={setAccount} />
        <Field label="Risk %" value={riskPct} onChange={setRiskPct} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Entry Price" value={entry} onChange={setEntry} placeholder="0.00" />
        <Field label="Stop Loss" value={stopLoss} onChange={setStopLoss} placeholder="0.00" />
      </div>
      <Field label="Leverage" value={leverage} onChange={setLeverage} />

      <div className="flex gap-1">
        {['0.5', '1', '1.5', '2', '3'].map(v => (
          <button
            key={v}
            onClick={() => setRiskPct(v)}
            className={`flex-1 py-1.5 rounded text-[10px] font-mono transition-colors ${
              riskPct === v
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500'
                : 'bg-[#0d1829] text-slate-600 border border-[#1e3a5f] hover:border-cyan-700'
            }`}
          >
            {v}%
          </button>
        ))}
      </div>

      {result && (
        <ResultBox>
          <ResultRow label="Direction" value={result.direction} color={result.direction === 'LONG' ? 'text-emerald-400' : 'text-red-400'} />
          <ResultRow label="Risk Amount" value={`$${result.riskAmount.toFixed(2)}`} color="text-amber-400" />
          <ResultRow label="Position Size" value={`$${result.posSize.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
          <ResultRow label="Quantity" value={result.qty.toFixed(6)} />
        </ResultBox>
      )}
    </div>
  )
}

// ──────────────── P&L Calculator ────────────────
function PnLCalc() {
  const [side, setSide] = useState<'long' | 'short'>('long')
  const [entry, setEntry] = useState('')
  const [exit, setExit] = useState('')
  const [qty, setQty] = useState('')
  const [leverage, setLeverage] = useState('1')

  const result = useMemo(() => {
    const e = parseFloat(entry) || 0
    const ex = parseFloat(exit) || 0
    const q = parseFloat(qty) || 0
    const lev = parseFloat(leverage) || 1
    if (!e || !ex || !q) return null

    const diff = side === 'long' ? ex - e : e - ex
    const pnl = diff * q * lev
    const pnlPct = e > 0 ? (diff / e) * 100 * lev : 0
    const margin = (e * q) / lev
    const roi = margin > 0 ? (pnl / margin) * 100 : 0

    return { pnl, pnlPct, roi }
  }, [side, entry, exit, qty, leverage])

  return (
    <div className="space-y-3">
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
      <div className="grid grid-cols-2 gap-2">
        <Field label="Entry Price" value={entry} onChange={setEntry} placeholder="0.00" />
        <Field label="Exit Price" value={exit} onChange={setExit} placeholder="0.00" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Quantity" value={qty} onChange={setQty} placeholder="0.00" />
        <Field label="Leverage" value={leverage} onChange={setLeverage} />
      </div>

      {result && (
        <ResultBox>
          <ResultRow label="P&L" value={`${result.pnl >= 0 ? '+' : ''}$${result.pnl.toFixed(2)}`} color={result.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'} bold />
          <ResultRow label="P&L %" value={`${result.pnlPct >= 0 ? '+' : ''}${result.pnlPct.toFixed(2)}%`} color={result.pnlPct >= 0 ? 'text-emerald-400' : 'text-red-400'} />
          <ResultRow label="ROI" value={`${result.roi >= 0 ? '+' : ''}${result.roi.toFixed(2)}%`} color={result.roi >= 0 ? 'text-emerald-400' : 'text-red-400'} />
        </ResultBox>
      )}
    </div>
  )
}

// ──────────────── Risk:Reward Calculator ────────────────
function RiskRewardCalc() {
  const [side, setSide] = useState<'long' | 'short'>('long')
  const [entry, setEntry] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [takeProfit, setTakeProfit] = useState('')

  const result = useMemo(() => {
    const e = parseFloat(entry) || 0
    const sl = parseFloat(stopLoss) || 0
    const tp = parseFloat(takeProfit) || 0
    if (!e || !sl || !tp) return null

    const risk = side === 'long' ? e - sl : sl - e
    const reward = side === 'long' ? tp - e : e - tp
    if (risk <= 0) return null

    const ratio = reward / risk
    const breakEven = ratio > 0 ? (1 / (1 + ratio)) * 100 : 100

    return { risk: Math.abs(risk), reward: Math.abs(reward), ratio, breakEven, riskPct: (Math.abs(risk) / e) * 100, rewardPct: (Math.abs(reward) / e) * 100 }
  }, [side, entry, stopLoss, takeProfit])

  return (
    <div className="space-y-3">
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
      <Field label="Entry Price" value={entry} onChange={setEntry} placeholder="0.00" />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Stop Loss" value={stopLoss} onChange={setStopLoss} placeholder="0.00" />
        <Field label="Take Profit" value={takeProfit} onChange={setTakeProfit} placeholder="0.00" />
      </div>

      {result && (
        <ResultBox>
          <ResultRow label="R:R Ratio" value={`1 : ${result.ratio.toFixed(2)}`} color="text-cyan-400" bold />
          <ResultRow label="Risk" value={`$${result.risk.toFixed(2)} (${result.riskPct.toFixed(2)}%)`} color="text-red-400" />
          <ResultRow label="Reward" value={`$${result.reward.toFixed(2)} (${result.rewardPct.toFixed(2)}%)`} color="text-emerald-400" />
          <ResultRow label="Break-Even Win Rate" value={`${result.breakEven.toFixed(1)}%`} color="text-amber-400" />
          {/* Visual ratio bar */}
          <div className="mt-2 flex h-2 rounded overflow-hidden">
            <div className="bg-red-500/60" style={{ width: `${(1 / (1 + result.ratio)) * 100}%` }} />
            <div className="bg-emerald-500/60" style={{ width: `${(result.ratio / (1 + result.ratio)) * 100}%` }} />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-slate-600 mt-1">
            <span>Risk</span>
            <span>Reward</span>
          </div>
        </ResultBox>
      )}
    </div>
  )
}

// ──────────────── Liquidation Calculator ────────────────
function LiquidationCalc() {
  const [side, setSide] = useState<'long' | 'short'>('long')
  const [entry, setEntry] = useState('')
  const [leverage, setLeverage] = useState('10')
  const [mmr, setMmr] = useState('0.5')

  const result = useMemo(() => {
    const e = parseFloat(entry) || 0
    const lev = parseFloat(leverage) || 1
    const mr = parseFloat(mmr) || 0.5
    if (!e) return null

    const mrPct = mr / 100
    let liqPrice: number
    if (side === 'long') {
      liqPrice = e * (1 - (1 / lev) + mrPct)
    } else {
      liqPrice = e * (1 + (1 / lev) - mrPct)
    }
    const dist = Math.abs((liqPrice - e) / e) * 100

    return { liqPrice: Math.max(0, liqPrice), dist }
  }, [side, entry, leverage, mmr])

  return (
    <div className="space-y-3">
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
      <Field label="Entry Price" value={entry} onChange={setEntry} placeholder="0.00" />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Leverage" value={leverage} onChange={setLeverage} />
        <Field label="Maint. Margin %" value={mmr} onChange={setMmr} />
      </div>

      <div className="flex gap-1">
        {['3', '5', '10', '20', '50', '100'].map(v => (
          <button
            key={v}
            onClick={() => setLeverage(v)}
            className={`flex-1 py-1.5 rounded text-[10px] font-mono transition-colors ${
              leverage === v
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500'
                : 'bg-[#0d1829] text-slate-600 border border-[#1e3a5f] hover:border-cyan-700'
            }`}
          >
            {v}x
          </button>
        ))}
      </div>

      {result && (
        <ResultBox>
          <ResultRow label="Liquidation Price" value={`$${result.liqPrice.toFixed(2)}`} color="text-red-400" bold />
          <ResultRow label="Distance from Entry" value={`${result.dist.toFixed(2)}%`} color={result.dist > 10 ? 'text-emerald-400' : result.dist > 5 ? 'text-amber-400' : 'text-red-400'} />
          {/* Risk indicator */}
          <div className="mt-2 bg-[#0d1829] rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${result.dist > 10 ? 'bg-emerald-500' : result.dist > 5 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(100, result.dist * 2)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-slate-600 mt-1">
            <span>High Risk</span>
            <span>Low Risk</span>
          </div>
        </ResultBox>
      )}
    </div>
  )
}

// ──────────────── Shared UI Components ────────────────
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-[9px] font-mono text-slate-600 uppercase tracking-wider block mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0d1829] border border-[#1e3a5f] rounded px-2.5 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-700 focus:border-cyan-700 outline-none transition-colors"
      />
    </div>
  )
}

function ResultBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#0a1628] border border-[#1e3a5f] rounded-lg p-3 space-y-1.5 animate-in fade-in duration-200">
      {children}
    </div>
  )
}

function ResultRow({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-[11px] font-mono">
      <span className="text-slate-500">{label}</span>
      <span className={`${color ?? 'text-slate-200'} ${bold ? 'font-bold text-sm' : ''}`}>{value}</span>
    </div>
  )
}
