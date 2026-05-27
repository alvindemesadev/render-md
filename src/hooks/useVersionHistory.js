// Feature #25: Version History
// Keeps up to MAX_SNAPSHOTS snapshots per note in localStorage.
// Auto-snapshots every SNAPSHOT_INTERVAL ms when content changes.

import { useEffect, useRef } from 'react'

const MAX_SNAPSHOTS = 10
const SNAPSHOT_INTERVAL = 5 * 60 * 1000 // 5 minutes

function getStorageKey(noteId) {
  return `rendermd_history_${noteId}`
}

function takeSnapshot(noteId, content) {
  if (!noteId || !content) return
  try {
    const key = getStorageKey(noteId)
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    const snapshot = { content, savedAt: Date.now() }
    const updated = [snapshot, ...existing].slice(0, MAX_SNAPSHOTS)
    localStorage.setItem(key, JSON.stringify(updated))
  } catch {
    // Quota exceeded or storage error — silently skip snapshot
  }
}

export function useVersionHistory(noteId, currentContent) {
  const lastSnapshotRef = useRef(0)
  const lastContentRef = useRef(currentContent)

  // Auto-snapshot on interval when content changes
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

  const getSnapshots = (id) => {
    try {
      return JSON.parse(localStorage.getItem(getStorageKey(id)) || '[]')
    } catch {
      return []
    }
  }

  // Fix #7: expose clearSnapshots so deleted notes clean up their history
  const clearSnapshots = (id) => {
    try { localStorage.removeItem(getStorageKey(id)) } catch { /* ignore */ }
  }

  const saveSnapshot = (id, content) => takeSnapshot(id, content)

  return { getSnapshots, saveSnapshot, clearSnapshots }
}
