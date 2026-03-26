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

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.6} viewBox="0 0 120 72">
        <path
          d={`M 20 60 A ${r} ${r} 0 0 1 100 60`}
          fill="none"
          stroke="#1e3a5f"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d={`M 20 60 A ${r} ${r} 0 0 1 100 60`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.3s ease' }}
        />
        <text x="60" y="55" textAnchor="middle" fontSize="18" fontWeight="bold" fill="white" fontFamily="monospace">
          {Math.round(score)}
        </text>
      </svg>
      <span className={`text-xs font-mono font-semibold ${textColor} -mt-1`}>{label}</span>
    </div>
  )
}
