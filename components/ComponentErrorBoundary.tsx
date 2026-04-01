'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  name?: string
}

interface State {
  hasError: boolean
  message: string
}

export default class ComponentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error(`[${this.props.name ?? 'Component'}] error:`, error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#0a1628] border border-red-500/20 rounded-lg p-4 text-center">
          <p className="text-xs font-mono text-red-400 font-bold mb-1">
            {this.props.name ?? 'Component'} failed to render
          </p>
          <p className="text-[10px] font-mono text-slate-600 mb-3 break-all">{this.state.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="text-[10px] font-mono text-cyan-500 hover:text-cyan-400 underline"
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
