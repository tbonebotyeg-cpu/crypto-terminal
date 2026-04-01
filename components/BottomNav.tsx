'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/markets', label: 'Markets', icon: '📈' },
  { href: '/calc', label: 'Calc', icon: '🧮' },
  { href: '/trades', label: 'Trades', icon: '📋' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a1628] border-t border-[#1e3a5f] flex z-30">
      {TABS.map(tab => {
        const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center py-2.5 text-[10px] font-mono tracking-wider uppercase transition-colors ${
              active ? 'text-cyan-400' : 'text-slate-600 hover:text-slate-400'
            }`}
          >
            <span className="text-base leading-none mb-1">{tab.icon}</span>
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
