'use client'

import { useState, useEffect, useCallback } from 'react'
import { Asset, ASSET_REGISTRY } from '../types/market'

const STORAGE_KEY = 'crypto-terminal-watchlist'
const DEFAULT_WATCHLIST: Asset[] = ['BTC', 'ETH', 'SOL', 'PAXG', 'SPX']
const POLL_MS = 30_000

export interface WatchlistItem {
  asset: Asset
  price: number
  change24h: number
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Asset[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_WATCHLIST
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Asset[]
        return parsed.filter(a => a in ASSET_REGISTRY)
      }
    } catch {}
    return DEFAULT_WATCHLIST
  })

  const [items, setItems] = useState<WatchlistItem[]>([])

  // Persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist))
  }, [watchlist])

  // Poll prices
  useEffect(() => {
    if (!watchlist.length) { setItems([]); return }

    const fetchAll = async () => {
      try {
        const res = await fetch(`/api/watchlist?assets=${watchlist.join(',')}`)
        if (!res.ok) return
        const data = await res.json()
        setItems(data.items ?? [])
      } catch {}
    }
    fetchAll()
    const timer = setInterval(fetchAll, POLL_MS)
    return () => clearInterval(timer)
  }, [watchlist])

  const addAsset = useCallback((a: Asset) => {
    setWatchlist(prev => prev.includes(a) ? prev : [...prev, a])
  }, [])

  const removeAsset = useCallback((a: Asset) => {
    setWatchlist(prev => prev.filter(x => x !== a))
  }, [])

  return { watchlist, items, addAsset, removeAsset }
}
