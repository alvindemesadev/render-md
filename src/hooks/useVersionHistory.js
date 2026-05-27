// Feature #25: Version History
import { useEffect, useRef } from 'react'

const MAX_SNAPSHOTS = 10
const SNAPSHOT_INTERVAL = 5 * 60 * 1000 // 5 minutes

function getStorageKey(noteId) {
  return `rendermd_history_${noteId}`
}

// Standalone — can be called without the hook
export function takeSnapshot(noteId, content) {
  if (!noteId || !content) return
  try {
    const key = getStorageKey(noteId)
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    const snapshot = { content, savedAt: Date.now() }
    const updated = [snapshot, ...existing].slice(0, MAX_SNAPSHOTS)
    localStorage.setItem(key, JSON.stringify(updated))
  } catch {
    // Quota exceeded — silently skip
  }
}

// Standalone — can be called without the hook
export function clearSnapshots(noteId) {
  try { localStorage.removeItem(getStorageKey(noteId)) } catch { /* ignore */ }
}

export function getSnapshots(noteId) {
  try {
    return JSON.parse(localStorage.getItem(getStorageKey(noteId)) || '[]')
  } catch {
    return []
  }
}

export function useVersionHistory(noteId, currentContent) {
  // Initialize to Date.now() so the first edit doesn't immediately snapshot
  const lastSnapshotRef = useRef(Date.now())
  const lastContentRef = useRef(currentContent)

  useEffect(() => {
    if (!noteId) return
    const now = Date.now()
    const contentChanged = currentContent !== lastContentRef.current
    const intervalElapsed = now - lastSnapshotRef.current >= SNAPSHOT_INTERVAL

    if (contentChanged && intervalElapsed) {
      takeSnapshot(noteId, currentContent)
      lastSnapshotRef.current = now
      lastContentRef.current = currentContent
    }
  }, [noteId, currentContent])

  return {
    getSnapshots: (id) => getSnapshots(id),
    saveSnapshot: (id, content) => takeSnapshot(id, content),
    clearSnapshots: (id) => clearSnapshots(id),
  }
}
