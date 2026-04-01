'use client'

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Asset, Timeframe, ALL_ASSETS } from '../../types/market'
import { DEFAULT_WEIGHTS, IndicatorWeights } from '../../types/indicators'
import { useMarketData } from '../../hooks/useMarketData'
import { useIndicators } from '../../hooks/useIndicators'
import { useTradeSignals } from '../../hooks/useTradeSignals'
import { useWatchlist } from '../../hooks/useWatchlist'
import AssetSelector from '../../components/AssetSelector'
import TimeframeSelector from '../../components/TimeframeSelector'
import StatusBar from '../../components/StatusBar'
import MarketStats from '../../components/MarketStats'
import IndicatorHeatmap from '../../components/IndicatorHeatmap'
import TradeSignalPanel from '../../components/TradeSignalPanel'
import PriceAlerts from '../../components/PriceAlerts'
import SettingsDrawer from '../../components/SettingsDrawer'
import Watchlist from '../../components/Watchlist'
import OrderBook from '../../components/OrderBook'
import RecentTrades from '../../components/RecentTrades'
import PositionCalc from '../../components/PositionCalc'
import ComponentErrorBoundary from '../../components/ComponentErrorBoundary'

const Chart = dynamic(() => import('../../components/Chart'), { ssr: false })

type MobileTab = 'chart' | 'indicators' | 'signals' | 'alerts' | 'watchlist'

export default function MarketsPage() {
  const [asset, setAsset] = useState<Asset>('BTC')
  const [timeframe, setTimeframe] = useState<Timeframe>('1H')
  const [weights, setWeights] = useState<IndicatorWeights>(DEFAULT_WEIGHTS)
  const [accountSize, setAccountSize] = useState(10000)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mobileTab, setMobileTab] = useState<MobileTab>('chart')
  const [alertPrices, setAlertPrices] = useState<number[]>([])
  const [watchlistCollapsed, setWatchlistCollapsed] = useState(false)
  const [chartFullscreen, setChartFullscreen] = useState(false)

  const market = useMarketData(asset, timeframe)
  const { results, aggregate } = useIndicators(market.candles, weights)
  const setups = useTradeSignals(market.candles, results, asset, timeframe, weights, accountSize)
  const { watchlist, items: watchlistItems, addAsset, removeAsset } = useWatchlist()

  const handleAlertsChange = useCallback((prices: number[]) => {
    setAlertPrices(prices)
  }, [])

  const handleWatchlistSelect = useCallback((a: Asset) => {
    setAsset(a)
  }, [])

  const currentPrice = market.stats?.price ?? 0

  // Keyboard shortcuts
  const TIMEFRAMES: Timeframe[] = ['15m', '1H', '4H', '1D', '1W', '1M']
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'Escape') {
        if (settingsOpen) { setSettingsOpen(false); return }
        if (chartFullscreen) { setChartFullscreen(false); return }
      }
      if (e.key === 'f' || e.key === 'F') { setChartFullscreen(prev => !prev); return }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        const idx = ALL_ASSETS.indexOf(asset)
        const next = e.key === 'ArrowUp' ? Math.max(0, idx - 1) : Math.min(ALL_ASSETS.length - 1, idx + 1)
        setAsset(ALL_ASSETS[next])
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        const idx = TIMEFRAMES.indexOf(timeframe)
        const next = e.key === 'ArrowLeft' ? Math.max(0, idx - 1) : Math.min(TIMEFRAMES.length - 1, idx + 1)
        setTimeframe(TIMEFRAMES[next])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [asset, timeframe, chartFullscreen, settingsOpen])

  const MOBILE_TABS: { id: MobileTab; label: string; icon: string }[] = [
    { id: 'watchlist', label: 'Watch', icon: '👁' },
    { id: 'chart', label: 'Chart', icon: '📈' },
    { id: 'indicators', label: 'Signals', icon: '⚡' },
    { id: 'signals', label: 'Setups', icon: '🎯' },
    { id: 'alerts', label: 'Alerts', icon: '🔔' },
  ]

  return (
    <div className="flex flex-col bg-[#060e1a]" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>
      {/* Top bar */}
      <header className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-[#0a1628] border-b border-[#1e3a5f] gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <AssetSelector
            selected={asset}
            onSelect={setAsset}
            stats={market.stats ? { [asset]: { price: market.stats.price, change24h: market.stats.change24h } } as Partial<Record<Asset, { price: number; change24h: number }>> : undefined}
          />
        </div>
        <div className="flex items-center gap-3">
          <StatusBar source={market.source} lastFetch={market.lastFetch} isLoading={market.isLoading} />
          <button
            onClick={() => setSettingsOpen(true)}
            className="px-3 py-1.5 bg-[#0d1829] border border-[#1e3a5f] text-slate-400 hover:text-slate-200 hover:border-cyan-700 rounded text-xs font-mono transition-colors"
          >
            Weights
          </button>
        </div>
      </header>

      {/* Price + timeframe bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-[#0a1628] border-b border-[#1e3a5f] gap-3 flex-wrap">
        <MarketStats stats={market.stats} asset={asset} />
        <TimeframeSelector selected={timeframe} onSelect={setTimeframe} />
      </div>

      {/* Main content */}
      <div className="flex-1 lg:overflow-hidden">
        {/* Desktop layout */}
        <div className="hidden lg:flex" style={{ height: 'calc(100vh - 10rem)' }}>
          <ComponentErrorBoundary name="Watchlist">
            <Watchlist
              items={watchlistItems}
              watchlist={watchlist}
              selected={asset}
              onSelect={handleWatchlistSelect}
              onAdd={addAsset}
              onRemove={removeAsset}
              collapsed={watchlistCollapsed}
              onToggle={() => setWatchlistCollapsed(prev => !prev)}
            />
          </ComponentErrorBoundary>

          <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${chartFullscreen ? 'absolute inset-0 z-40 bg-[#060e1a]' : ''}`}>
            <div className="relative flex-shrink-0 p-3" style={{ height: chartFullscreen ? '100%' : '55%' }}>
              <button
                onClick={() => setChartFullscreen(prev => !prev)}
                data-testid="chart-fullscreen-toggle"
                className="absolute top-5 right-5 z-10 px-2 py-1 bg-[#0d1829]/80 border border-[#1e3a5f] text-slate-400 hover:text-cyan-400 hover:border-cyan-700 rounded text-[10px] font-mono transition-colors backdrop-blur-sm"
                title={chartFullscreen ? 'Exit fullscreen' : 'Fullscreen chart'}
              >
                {chartFullscreen ? '✕ EXIT' : '⛶ FULL'}
              </button>
              <ComponentErrorBoundary name="Chart">
                <Chart candles={market.candles} results={results} setups={setups} alertPrices={alertPrices} currentPrice={currentPrice} asset={asset} />
              </ComponentErrorBoundary>
            </div>
            {!chartFullscreen && (
              <div className="flex-1 overflow-y-auto p-3 pt-0">
                <IndicatorHeatmap results={results} aggregate={aggregate} weights={weights} />
              </div>
            )}
          </div>

          <div className="w-80 flex-shrink-0 flex flex-col gap-3 p-3 overflow-y-auto border-l border-[#1e3a5f]">
            <ComponentErrorBoundary name="TradeSignalPanel">
              <TradeSignalPanel setups={setups} />
            </ComponentErrorBoundary>
            <ComponentErrorBoundary name="OrderBook">
              <OrderBook asset={asset} currentPrice={currentPrice} />
            </ComponentErrorBoundary>
            <RecentTrades asset={asset} />
            <PositionCalc currentPrice={currentPrice} accountSize={accountSize} />
            <PriceAlerts asset={asset} currentPrice={currentPrice} onAlertsChange={handleAlertsChange} />
          </div>
        </div>

        {/* Mobile layout */}
        <div className="lg:hidden h-full overflow-y-auto pb-24">
          {/* Mobile sub-tabs */}
          <div className="flex border-b border-[#1e3a5f] bg-[#0a1628] sticky top-0 z-10">
            {MOBILE_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setMobileTab(tab.id)}
                className={`flex-1 py-2.5 text-[10px] font-mono tracking-wider uppercase transition-colors ${
                  mobileTab === tab.id ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-600'
                }`}
              >
                <span className="text-sm leading-none">{tab.icon}</span>
                <span className="ml-1">{tab.label}</span>
              </button>
            ))}
          </div>

          {mobileTab === 'watchlist' && (
            <div className="p-3">
              <div className="bg-[#0a1628] rounded-lg border border-[#1e3a5f] overflow-hidden">
                {watchlistItems.map(item => (
                  <div
                    key={item.asset}
                    onClick={() => { setAsset(item.asset); setMobileTab('chart') }}
                    className={`flex items-center justify-between px-3 py-3 border-b border-[#1e3a5f]/50 cursor-pointer transition-colors ${
                      item.asset === asset ? 'bg-cyan-500/10' : 'hover:bg-[#0d1829]'
                    }`}
                  >
                    <span className="font-mono font-bold text-sm text-slate-300">{item.asset}</span>
                    <div className="text-right">
                      <div className="text-sm font-mono text-slate-300">${item.price.toLocaleString()}</div>
                      <div className={`text-xs font-mono ${item.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {mobileTab === 'chart' && (
            <div className="p-3" style={{ height: '60vw', minHeight: '260px' }}>
              <Chart candles={market.candles} results={results} setups={setups} alertPrices={alertPrices} currentPrice={currentPrice} />
            </div>
          )}
          {mobileTab === 'indicators' && (
            <div className="p-3">
              <IndicatorHeatmap results={results} aggregate={aggregate} weights={weights} />
            </div>
          )}
          {mobileTab === 'signals' && (
            <div className="p-3">
              <TradeSignalPanel setups={setups} />
            </div>
          )}
          {mobileTab === 'alerts' && (
            <div className="p-3">
              <PriceAlerts asset={asset} currentPrice={currentPrice} onAlertsChange={handleAlertsChange} />
            </div>
          )}
        </div>
      </div>

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
