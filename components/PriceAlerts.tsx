'use client'

import { useState, useEffect } from 'react'
import { Asset } from '../types/market'

interface Alert {
  id: string
  asset: Asset
  price: number
  direction: 'above' | 'below'
  triggered: boolean
}

interface Props {
  asset: Asset
  currentPrice: number
  onAlertsChange?: (prices: number[]) => void
}

const STORAGE_KEY = 'crypto-terminal-alerts'

export default function PriceAlerts({ asset, currentPrice, onAlertsChange }: Props) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [input, setInput] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setAlerts(JSON.parse(stored))
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts)) } catch {}
    onAlertsChange?.(alerts.filter(a => a.asset === asset && !a.triggered).map(a => a.price))
  }, [alerts, asset, onAlertsChange])

  useEffect(() => {
    if (!currentPrice) return
    setAlerts(prev => prev.map(a => {
      if (a.asset !== asset || a.triggered) return a
      if (a.direction === 'above' && currentPrice >= a.price) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`${asset} Alert`, { body: `Price crossed above $${a.price.toFixed(2)}` })
        }
        return { ...a, triggered: true }
      }
      if (a.direction === 'below' && currentPrice <= a.price) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`${asset} Alert`, { body: `Price dropped below $${a.price.toFixed(2)}` })
        }
        return { ...a, triggered: true }
      }
      return a
    }))
  }, [currentPrice, asset])

  function addAlert() {
    const price = parseFloat(input)
    if (!price || isNaN(price)) return
    const direction = price > currentPrice ? 'above' : 'below'
    setAlerts(prev => [...prev, { id: `${Date.now()}`, asset, price, direction, triggered: false }])
    setInput('')
  }

  const assetAlerts = alerts.filter(a => a.asset === asset)

  return (
    <div className="bg-[#0a1628] border border-[#1e3a5f] rounded-lg p-4">
      <h2 className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-3">Price Alerts</h2>

      <div className="flex gap-2 mb-3">
        <input
          type="number"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addAlert()}
          placeholder={`Alert price${currentPrice ? ` (now $${currentPrice.toFixed(0)})` : ''}`}
          className="flex-1 bg-[#0d1829] border border-[#1e3a5f] text-slate-200 placeholder-slate-600 font-mono text-xs px-3 py-2 rounded focus:outline-none focus:border-cyan-500"
        />
        <button
          onClick={addAlert}
          className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/40 rounded text-xs font-mono transition-colors"
        >
          Add
        </button>
      </div>

      {assetAlerts.length === 0 ? (
        <p className="text-slate-500 font-mono text-xs text-center py-3">No alerts set for {asset}</p>
      ) : (
        <div className="space-y-1.5">
          {assetAlerts.map(alert => (
            <div key={alert.id} className={`flex items-center justify-between px-3 py-2 rounded border text-xs font-mono ${
              alert.triggered
                ? 'bg-slate-700/30 border-slate-600 text-slate-500'
                : alert.direction === 'above'
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/5 border-red-500/20 text-red-400'
            }`}>
              <span>
                {alert.direction === 'above' ? '↑' : '↓'} ${alert.price.toFixed(2)}
                {alert.triggered && ' (triggered)'}
              </span>
              <button onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))} className="text-slate-500 hover:text-red-400 ml-2">×</button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => 'Notification' in window && Notification.requestPermission()}
        className="mt-3 text-[10px] font-mono text-slate-500 hover:text-slate-300 underline"
      >
        Enable browser notifications
      </button>
    </div>
  )
}
