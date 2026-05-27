import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-8">
          <div className="max-w-md text-center space-y-4">
            <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 stroke-[1.5]" />
            <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              RenderMD encountered an unexpected error. Please reload the app.
            </p>
            {this.state.error && (
              <details className="text-xs text-left bg-zinc-100 dark:bg-zinc-900 rounded-lg p-3 max-h-32 overflow-auto border border-zinc-200 dark:border-zinc-800">
                <summary className="cursor-pointer font-mono text-zinc-500 mb-1">Error details</summary>
                <pre className="text-red-600 dark:text-red-400 whitespace-pre-wrap break-all font-mono">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reload App
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
