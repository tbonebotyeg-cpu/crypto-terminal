'use client'

interface Props {
  score: number  // 0–100
  size?: number
}

export default function ConfidenceMeter({ score, size = 120 }: Props) {
  const r = 40
  const circumference = Math.PI * r
  const progress = (score / 100) * circumference

  let color: string
  let label: string
  let textColor: string
  if (score >= 65) {
    color = '#10b981'; label = 'BULLISH'; textColor = 'text-emerald-400'
  } else if (score <= 35) {
    color = '#ef4444'; label = 'BEARISH'; textColor = 'text-red-400'
  } else {
    color = '#f59e0b'; label = 'NEUTRAL'; textColor = 'text-amber-400'
  }

  // Needle angle: 0% = -180deg (left), 100% = 0deg (right), mapped to SVG arc
  // Arc goes from (20,60) to (100,60) — left to right is 0..100
  const needleAngle = -180 + (score / 100) * 180  // degrees from horizontal
  const rad = (needleAngle * Math.PI) / 180
  const nx = 60 + (r - 6) * Math.cos(rad)
  const ny = 60 + (r - 6) * Math.sin(rad)

  // Zone tick marks at 30%, 45%, 55%, 70%
  const ticks = [
    { pct: 30, color: '#ef4444' },
    { pct: 45, color: '#f59e0b' },
    { pct: 55, color: '#f59e0b' },
    { pct: 70, color: '#10b981' },
  ]

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.65} viewBox="0 0 120 80">
        {/* Track */}
        <path
          d={`M 20 60 A ${r} ${r} 0 0 1 100 60`}
          fill="none"
          stroke="#1e3a5f"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d={`M 20 60 A ${r} ${r} 0 0 1 100 60`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.3s ease' }}
        />
        {/* Zone tick marks */}
        {ticks.map(({ pct, color: tc }) => {
          const a = -180 + (pct / 100) * 180
          const ar = (a * Math.PI) / 180
          const x1 = 60 + (r - 13) * Math.cos(ar)
          const y1 = 60 + (r - 13) * Math.sin(ar)
          const x2 = 60 + (r + 2) * Math.cos(ar)
          const y2 = 60 + (r + 2) * Math.sin(ar)
          return <line key={pct} x1={x1} y1={y1} x2={x2} y2={y2} stroke={tc} strokeWidth="1.5" opacity="0.7" />
        })}
        {/* Zone labels */}
        <text x="22" y="74" textAnchor="middle" fontSize="6" fill="#ef4444" fontFamily="monospace" opacity="0.8">B</text>
        <text x="60" y="20" textAnchor="middle" fontSize="6" fill="#f59e0b" fontFamily="monospace" opacity="0.8">N</text>
        <text x="98" y="74" textAnchor="middle" fontSize="6" fill="#10b981" fontFamily="monospace" opacity="0.8">B</text>
        {/* Score text */}
        <text x="60" y="57" textAnchor="middle" fontSize="18" fontWeight="bold" fill="white" fontFamily="monospace">
          {Math.round(score)}
        </text>
        {/* Needle */}
        <line
          x1="60" y1="60"
          x2={nx.toFixed(1)} y2={ny.toFixed(1)}
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
          style={{ transition: 'x2 0.5s ease, y2 0.5s ease' }}
        />
        <circle cx="60" cy="60" r="3" fill="white" opacity="0.9" />
      </svg>
      <span className={`text-xs font-mono font-semibold ${textColor} -mt-1`}>{label}</span>
    </div>
  )
}
