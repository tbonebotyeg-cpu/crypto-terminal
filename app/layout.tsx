import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '../components/BottomNav'

export const metadata: Metadata = {
  title: 'Trading Terminal',
  description: 'Professional trading terminal with live indicators, calculators, and trade signals',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Trading Terminal',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#060e1a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-[#060e1a] text-slate-200">
        <main className="pb-14 h-full overflow-y-auto">{children}</main>
        <BottomNav />
      </body>
    </html>
  )
}
