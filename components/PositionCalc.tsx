'use client'

import { useState, useMemo } from 'react'

interface Props {
  currentPrice: number
  accountSize: number
}

export default function PositionCalc({ currentPrice, accountSize }: Props) {
  const [entry, setEntry] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [riskPct, setRiskPct] = useState('1.5')

  const calc = useMemo(() => {
    const e = parseFloat(entry) || currentPrice
    const sl = parseFloat(stopLoss)
    const risk = parseFloat(riskPct) || 1.5
    if (!sl || sl === e) return null

    const direction = sl < e ? 'LONG' : 'SHORT'
    const stopDist = Math.abs(e - sl)
    const stopPct = (stopDist / e) * 100
    const riskAmount = accountSize * (risk / 100)
    const positionSize = riskAmount / stopDist
    const positionValue = positionSize * e
    const leverage = positionValue / accountSize

    // TP targets
    const tp1 = direction === 'LONG' ? e + stopDist * 1.5 : e - stopDist * 1.5
    const tp2 = direction === 'LONG' ? e + stopDist * 2.5 : e - stopDist * 2.5

    return { direction, stopDist, stopPct, riskAmount, positionSize, positionValue, leverage, tp1, tp2 }
  }, [entry, stopLoss, riskPct, currentPrice, accountSize])

  return (
    <div className="bg-[#0a1628] rounded-lg border border-[#1e3a5f] p-3">
      <h3 className="text-xs font-mono font-bold text-slate-400 tracking-wider uppercase mb-3">Position Calculator</h3>

      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[9px] font-mono text-slate-600 uppercase">Entry</label>
            <input
              type="number"
              value={entry}
              onChange={e => setEntry(e.target.value)}
              placeholder={currentPrice.toString()}
              className="w-full bg-[#0d1829] border border-[#1e3a5f] rounded px-2 py-1 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:border-cyan-700 outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="text-[9px] font-mono text-slate-600 uppercase">Stop Loss</label>
            <input
              type="number"
              value={stopLoss}
              onChange={e => setStopLoss(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#0d1829] border border-[#1e3a5f] rounded px-2 py-1 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:border-cyan-700 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="text-[9px] font-mono text-slate-600 uppercase">Risk %</label>
          <div className="flex gap-1">
            {['0.5', '1', '1.5', '2'].map(v => (
              <button
                key={v}
                onClick={() => setRiskPct(v)}
                className={`flex-1 py-1 rounded text-[10px] font-mono transition-colors ${
                  riskPct === v
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500'
                    : 'bg-[#0d1829] text-slate-500 border border-[#1e3a5f] hover:border-cyan-700'
                }`}
              >
                {v}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {calc && (
        <div className="mt-3 pt-3 border-t border-[#1e3a5f] space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-slate-500">Direction</span>
            <span className={calc.direction === 'LONG' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
              {calc.direction}
            </span>
          </div>
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-slate-500">Risk Amount</span>
            <span className="text-amber-400">${calc.riskAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-slate-500">Position Size</span>
            <span className="text-slate-200">{calc.positionSize.toFixed(4)}</span>
          </div>
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-slate-500">Position Value</span>
            <span className="text-slate-200">${calc.positionValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-slate-500">Stop Distance</span>
            <span className="text-red-400">{calc.stopPct.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-slate-500">Leverage</span>
            <span className={`${calc.leverage > 5 ? 'text-red-400' : calc.leverage > 2 ? 'text-amber-400' : 'text-slate-200'}`}>
              {calc.leverage.toFixed(1)}x
            </span>
          </div>
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-slate-500">TP1 (1.5R)</span>
            <span className="text-amber-400">${calc.tp1.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-slate-500">TP2 (2.5R)</span>
            <span className="text-emerald-400">${calc.tp2.toFixed(2)}</span>
          </div>
        </div>
      )}
      {!calc && (
        <p className="text-[10px] text-slate-600 text-center mt-3">Set entry &amp; stop loss to calculate</p>
      )}
    </div>
  )
}
