/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
}

const STYLES = {
  success: 'bg-emerald-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-zinc-800 dark:bg-zinc-700 text-zinc-100',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++idRef.current
    setToasts(prev => [...prev, { id, message, type }])
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map(t => {
          const Icon = ICONS[t.type] || Info
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium animate-in slide-in-from-right-2 fade-in-0 duration-200 ${STYLES[t.type] || STYLES.info}`}
              role="alert"
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{t.message}</span>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="shrink-0 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}
