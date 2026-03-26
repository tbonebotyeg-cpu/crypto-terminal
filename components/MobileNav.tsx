'use client'

type Tab = 'chart' | 'indicators' | 'trades' | 'alerts'

interface Props {
  activeTab: Tab
  onTabChange: (t: Tab) => void
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'chart', label: 'Chart', icon: '📈' },
  { id: 'indicators', label: 'Signals', icon: '⚡' },
  { id: 'trades', label: 'Trades', icon: '🎯' },
  { id: 'alerts', label: 'Alerts', icon: '🔔' },
]

export default function MobileNav({ activeTab, onTabChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a1628] border-t border-[#1e3a5f] flex lg:hidden z-30">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 flex flex-col items-center py-3 text-xs font-mono transition-colors ${
            activeTab === tab.id ? 'text-cyan-400' : 'text-slate-500'
          }`}
        >
          <span className="text-lg leading-none mb-1">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
