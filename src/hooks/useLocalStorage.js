import { useState, useEffect } from 'react'

// Global quota-warning callback — set by App on mount
let _onQuotaExceeded = null
export function setQuotaWarningHandler(fn) {
  _onQuotaExceeded = fn
}

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      // Feature #15: surface quota exceeded errors to the user
      if (error instanceof DOMException && (
        error.code === 22 ||
        error.code === 1014 ||
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      )) {
        if (_onQuotaExceeded) _onQuotaExceeded()
      }
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, value])

  return [value, setValue]
}
