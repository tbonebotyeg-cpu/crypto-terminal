'use client'

import { IndicatorResult, IndicatorWeights, AggregateScore, IndicatorGroup } from '../types/indicators'
import { Timeframe } from '../types/market'
import IndicatorTile from './IndicatorTile'
import ConfidenceMeter from './ConfidenceMeter'
import MultiTimeframeSummary from './MultiTimeframeSummary'

interface TFScore { tf: Timeframe; score: number; loading?: boolean }

interface Props {
  results: IndicatorResult[]
  aggregate: AggregateScore
  weights: IndicatorWeights
  tfScores?: TFScore[]
}

const GROUP_LABELS: Record<IndicatorGroup, string> = {
  trend: 'Trend',
  momentum: 'Momentum',
  volatility: 'Volatility',
  volume: 'Volume',
  statistical: 'Statistical',
  structure: 'Structure',
}

const GROUP_ORDER: IndicatorGroup[] = ['trend', 'momentum', 'volatility', 'volume', 'statistical', 'structure']

export default function IndicatorHeatmap({ results, aggregate, weights, tfScores }: Props) {
  const grouped = GROUP_ORDER.reduce((acc, g) => {
    acc[g] = results.filter(r => r.group === g)
    return acc
  }, {} as Record<IndicatorGroup, IndicatorResult[]>)

  return (
    <div className="bg-[#0a1628] border border-[#1e3a5f] rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-1">Indicator Confluence</h2>
          <div className="flex gap-3 text-xs font-mono">
            <span className="text-emerald-400">{aggregate.bullCount} BULL</span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-400">{aggregate.neutralCount} NEUT</span>
            <span className="text-slate-500">|</span>
            <span className="text-red-400">{aggregate.bearCount} BEAR</span>
          </div>
          {tfScores && <div className="mt-2"><MultiTimeframeSummary scores={tfScores} /></div>}
        </div>
        <ConfidenceMeter score={aggregate.score} />
      </div>

      <div className="space-y-3">
        {GROUP_ORDER.map(group => {
          const tiles = grouped[group]
          if (!tiles?.length) return null
          return (
            <div key={group}>
              <div className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                {GROUP_LABELS[group]}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5">
                {tiles.map(r => <IndicatorTile key={r.id} result={r} />)}
              </div>
            </div>
          )
        })}
      </div>

      {results.length === 0 && (
        <div className="text-center text-slate-500 font-mono text-sm py-8">
          Loading indicators...
        </div>
      )}
    </div>
  )
}
