'use client'

import { useState, useEffect } from 'react'

function loadSetting<T>(key: string, def: T): T {
  if (typeof window === 'undefined') return def
  try {
    const v = localStorage.getItem(key)
    return v !== null ? JSON.parse(v) : def
  } catch { return def }
}

function saveSetting(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export default function SettingsPage() {
  const [accountSize, setAccountSize] = useState(10000)
  const [defaultRisk, setDefaultRisk] = useState(1.5)
  const [defaultLeverage, setDefaultLeverage] = useState(1)
  const [saved, setSaved] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    setAccountSize(loadSetting('tt_account_size', 10000))
    setDefaultRisk(loadSetting('tt_default_risk', 1.5))
    setDefaultLeverage(loadSetting('tt_default_leverage', 1))
  }, [])

  function handleSave() {
    saveSetting('tt_account_size', accountSize)
    saveSetting('tt_default_risk', defaultRisk)
    saveSetting('tt_default_leverage', defaultLeverage)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    localStorage.removeItem('tt_trades')
    localStorage.removeItem('tt_account_size')
    localStorage.removeItem('tt_default_risk')
    localStorage.removeItem('tt_default_leverage')
    localStorage.removeItem('tt_alerts')
    setAccountSize(10000)
    setDefaultRisk(1.5)
    setDefaultLeverage(1)
    setConfirmReset(false)
  }

  return (
    <div className="p-3 space-y-4 pb-20">
      <div className="pt-1">
        <h1 className="text-sm font-mono font-bold text-cyan-400 tracking-wider uppercase">Settings</h1>
      </div>

      {/* Account */}
      <Section label="Account">
        <div className="space-y-3">
          <div>
            <label className="text-[9px] font-mono text-slate-600 uppercase tracking-wider block mb-1">Account Size ($)</label>
            <input
              type="number"
              value={accountSize}
              onChange={e => setAccountSize(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#0d1829] border border-[#1e3a5f] rounded px-3 py-2.5 text-sm font-mono text-slate-200 focus:border-cyan-700 outline-none transition-colors"
            />
          </div>
          <div className="flex gap-1">
            {[1000, 5000, 10000, 25000, 50000, 100000].map(v => (
              <button
                key={v}
                onClick={() => setAccountSize(v)}
                className={`flex-1 py-1.5 rounded text-[9px] font-mono transition-colors ${
                  accountSize === v
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500'
                    : 'bg-[#0d1829] text-slate-600 border border-[#1e3a5f] hover:border-cyan-700'
                }`}
              >
                ${v >= 1000 ? `${v / 1000}K` : v}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Defaults */}
      <Section label="Defaults">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[9px] font-mono text-slate-600 uppercase tracking-wider block mb-1">Default Risk %</label>
            <input
              type="number"
              value={defaultRisk}
              onChange={e => setDefaultRisk(parseFloat(e.target.value) || 0)}
              step="0.5"
              className="w-full bg-[#0d1829] border border-[#1e3a5f] rounded px-3 py-2.5 text-sm font-mono text-slate-200 focus:border-cyan-700 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-[9px] font-mono text-slate-600 uppercase tracking-wider block mb-1">Default Leverage</label>
            <input
              type="number"
              value={defaultLeverage}
              onChange={e => setDefaultLeverage(parseFloat(e.target.value) || 1)}
              className="w-full bg-[#0d1829] border border-[#1e3a5f] rounded px-3 py-2.5 text-sm font-mono text-slate-200 focus:border-cyan-700 outline-none transition-colors"
            />
          </div>
        </div>
      </Section>

      {/* Save */}
      <button
        onClick={handleSave}
        className={`w-full py-2.5 rounded text-sm font-mono font-bold transition-colors ${
          saved
            ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
            : 'bg-cyan-500/20 border border-cyan-500 text-cyan-400 hover:bg-cyan-500/30'
        }`}
      >
        {saved ? '✓ Saved!' : 'Save Settings'}
      </button>

      {/* About */}
      <Section label="About">
        <div className="space-y-1.5">
          <Row label="Version" value="1.0.0" />
          <Row label="Data" value="Crypto.com + Yahoo Finance" />
          <Row label="Storage" value="Local (browser)" />
        </div>
      </Section>

      {/* Reset */}
      <Section label="Danger Zone">
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="w-full py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded text-xs font-mono hover:bg-red-500/20 transition-colors"
          >
            Reset All Data
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] font-mono text-red-400">This will delete all trades, settings, and alerts. Cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 py-2 bg-[#0d1829] border border-[#1e3a5f] text-slate-400 rounded text-xs font-mono"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2 bg-red-500/20 border border-red-500 text-red-400 rounded text-xs font-mono font-bold"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        )}
      </Section>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0a1628] border border-[#1e3a5f] rounded-lg p-3">
      <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-3">{label}</p>
      {children}
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
