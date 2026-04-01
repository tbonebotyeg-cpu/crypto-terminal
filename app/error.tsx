'use client'

import { useEffect } from 'react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    console.error('[Route Error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#060e1a] p-8 text-center">
      <div className="bg-[#0a1628] border border-red-500/20 rounded-xl p-8 max-w-md w-full">
        <h1 className="text-sm font-mono font-bold text-red-400 mb-2 uppercase tracking-wider">
          Something went wrong
        </h1>
        <p className="text-xs font-mono text-slate-500 mb-6 break-all">
          {error.message || 'An unexpected error occurred'}
          {error.digest && <span className="block mt-1 text-slate-700">ID: {error.digest}</span>}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-cyan-500/20 border border-cyan-500 text-cyan-400 rounded text-xs font-mono font-bold hover:bg-cyan-500/30 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
