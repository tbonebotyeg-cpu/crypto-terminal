'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Asset, Timeframe } from '../types/market'
import { DEFAULT_WEIGHTS, IndicatorWeights } from '../types/indicators'
import { useMarketData } from '../hooks/useMarketData'
import { useIndicators } from '../hooks/useIndicators'
import { useTradeSignals } from '../hooks/useTradeSignals'
import AssetSelector from '../components/AssetSelector'
import TimeframeSelector from '../components/TimeframeSelector'
import StatusBar from '../components/StatusBar'
import MarketStats from '../components/MarketStats'
import IndicatorHeatmap from '../components/IndicatorHeatmap'
import TradeSignalPanel from '../components/TradeSignalPanel'
import PriceAlerts from '../components/PriceAlerts'
import SettingsDrawer from '../components/SettingsDrawer'
import MobileNav from '../components/MobileNav'

// Chart is client-only — never SSR
const Chart = dynamic(() => import('../components/Chart'), { ssr: false })

type Tab = 'chart' | 'indicators' | 'trades' | 'alerts'

export default function Page() {
  const [asset, setAsset] = useState<Asset>('BTC')
  const [timeframe, setTimeframe] = useState<Timeframe>('1H')
  const [weights, setWeights] = useState<IndicatorWeights>(DEFAULT_WEIGHTS)
  const [accountSize, setAccountSize] = useState(10000)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('chart')
  const [alertPrices, setAlertPrices] = useState<number[]>([])

  const market = useMarketData(asset, timeframe)
  const { results, aggregate } = useIndicators(market.candles, weights)
  const setups = useTradeSignals(market.candles, results, asset, timeframe, weights, accountSize)

  const handleAlertsChange = useCallback((prices: number[]) => {
    setAlertPrices(prices)
  }, [])

  const currentPrice = market.stats?.price ?? 0

  return (
    <div className="h-full flex flex-col bg-[#060e1a] overflow-hidden">
      {/* Top bar */}
      <header className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-[#0a1628] border-b border-[#1e3a5f] gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-mono font-bold text-cyan-400 tracking-wider hidden sm:block">CRYPTO TERMINAL</span>
          <AssetSelector
            selected={asset}
            onSelect={setAsset}
            stats={market.stats ? { [asset]: { price: market.stats.price, change24h: market.stats.change24h } } as Record<Asset, { price: number; change24h: number }> : undefined}
          />
        </div>
        <div className="flex items-center gap-3">
          <StatusBar source={market.source} lastFetch={market.lastFetch} isLoading={market.isLoading} />
          <button
            onClick={() => setSettingsOpen(true)}
            className="px-3 py-1.5 bg-[#0d1829] border border-[#1e3a5f] text-slate-400 hover:text-slate-200 hover:border-cyan-700 rounded text-xs font-mono transition-colors"
          >
            Settings
          </button>
        </div>
      </header>

      {/* Price + timeframe bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-[#0a1628] border-b border-[#1e3a5f] gap-3 flex-wrap">
        <MarketStats stats={market.stats} asset={asset} />
        <TimeframeSelector selected={timeframe} onSelect={setTimeframe} />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {/* Desktop layout */}
        <div className="hidden lg:flex h-full">
          {/* Left: Chart + Indicators */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div className="flex-shrink-0 p-3" style={{ height: '55%' }}>
              <Chart
                candles={market.candles}
                results={results}
                setups={setups}
                alertPrices={alertPrices}
                currentPrice={currentPrice}
              />
            </div>
            <div className="flex-1 overflow-y-auto p-3 pt-0">
              <IndicatorHeatmap results={results} aggregate={aggregate} weights={weights} />
            </div>
          </div>

          {/* Right sidebar */}
          <div className="w-80 flex-shrink-0 flex flex-col gap-3 p-3 overflow-y-auto border-l border-[#1e3a5f]">
            <TradeSignalPanel setups={setups} />
            <PriceAlerts asset={asset} currentPrice={currentPrice} onAlertsChange={handleAlertsChange} />
          </div>
        </div>

        {/* Mobile layout */}
        <div className="lg:hidden h-full overflow-y-auto pb-16">
          {activeTab === 'chart' && (
            <div className="p-3" style={{ height: '60vw', minHeight: '260px' }}>
              <Chart candles={market.candles} results={results} setups={setups} alertPrices={alertPrices} currentPrice={currentPrice} />
            </div>
          )}
          {activeTab === 'indicators' && (
            <div className="p-3">
              <IndicatorHeatmap results={results} aggregate={aggregate} weights={weights} />
            </div>
          )}
          {activeTab === 'trades' && (
            <div className="p-3">
              <TradeSignalPanel setups={setups} />
            </div>
          )}
          {activeTab === 'alerts' && (
            <div className="p-3">
              <PriceAlerts asset={asset} currentPrice={currentPrice} onAlertsChange={handleAlertsChange} />
            </div>
          )}
        </div>
      </div>

      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        weights={weights}
        onWeightsChange={setWeights}
        accountSize={accountSize}
        onAccountSizeChange={setAccountSize}
      />
    </div>
  )
}
