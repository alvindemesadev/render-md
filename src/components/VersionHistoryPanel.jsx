// Feature #25: Version History Panel
import { useState } from 'react'
import { History, RotateCcw, X } from 'lucide-react'
import { Button } from './ui/button'
import { getUnifiedDiff } from '../lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

export function VersionHistoryPanel({ noteId, currentContent, getSnapshots, onRestore, onClose }) {
  const [restoreConfirm, setRestoreConfirm] = useState(null)
  const [expandedSnapTs, setExpandedSnapTs] = useState(null)
  const snapshots = getSnapshots(noteId)

  const formatDate = (ts) =>
    new Date(ts).toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })

  const handleRestore = (snap) => {
    setRestoreConfirm(snap)
  }

  const confirmRestore = () => {
    if (restoreConfirm) {
      onRestore(restoreConfirm.content)
      setRestoreConfirm(null)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 w-64 shrink-0">
      {/* Header */}
      <div className="h-10 px-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
          <History className="w-3.5 h-3.5" aria-hidden="true" />
          <span>History</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close version history"
          className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Snapshot list */}
      <div className="flex-1 overflow-y-auto py-2 px-2.5 space-y-2">
        {snapshots.length === 0 ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 px-3 py-4 text-center select-none">
            No snapshots yet. Auto-saved every 5 minutes while editing.
          </p>
        ) : (
          snapshots.map((snap, i) => {
            const isExpanded = expandedSnapTs === snap.savedAt
            return (
              <div
                key={snap.savedAt}
                onClick={() => setExpandedSnapTs(isExpanded ? null : snap.savedAt)}
                className={`flex flex-col gap-1.5 p-2.5 rounded-lg border hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-all cursor-pointer ${
                  isExpanded 
                    ? 'border-zinc-300 dark:border-zinc-700 bg-zinc-50/20 dark:bg-zinc-800/5 shadow-xs' 
                    : 'border-zinc-200/50 dark:border-zinc-800/50 border-transparent hover:border-zinc-200 dark:hover:border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {i === 0 ? 'Latest snapshot' : `Snapshot ${snapshots.length - i}`}
                    </div>
                    <div className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">
                      {formatDate(snap.savedAt)}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => { e.stopPropagation(); handleRestore(snap); }}
                    aria-label={`Restore snapshot from ${formatDate(snap.savedAt)}`}
                    title="Restore this version"
                    className="shrink-0 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-zinc-400"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                </div>
                
                {!isExpanded && (
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                    {snap.content.slice(0, 45) || '(empty)'}
                  </div>
                )}

                {isExpanded && (
                  <div 
                    className="mt-1 p-1.5 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[10px] font-mono overflow-x-auto max-h-48 select-text cursor-text leading-relaxed divide-y divide-zinc-100/30 dark:divide-zinc-900/30 no-export"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(() => {
                      const diff = getUnifiedDiff(snap.content, currentContent)
                      const isUnchanged = diff.length === 0 || (diff.length === 1 && diff[0].type === 'unchanged' && diff[0].text === '')
                      if (isUnchanged) {
                        return (
                          <div className="text-zinc-400 dark:text-zinc-650 text-center py-2 select-none italic">
                            No differences with current text
                          </div>
                        )
                      }
                      return diff.map((line, idx) => {
                        if (line.type === 'ellipsis') {
                          return (
                            <div key={idx} className="diff-line diff-line-ellipsis">
                              {line.text}
                            </div>
                          )
                        }
                        const prefix = line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '
                        const diffClass = line.type === 'added' 
                          ? 'diff-line-added' 
                          : line.type === 'removed' 
                          ? 'diff-line-removed' 
                          : 'diff-line-unchanged'
                        return (
                          <div key={idx} className={`diff-line ${diffClass}`}>
                            <span>{prefix} </span>
                            <span>{line.text}</span>
                          </div>
                        )
                      })
                    })()}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
          Click snapshot to view details. Up to 10 snapshots per note.
        </p>
      </div>

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreConfirm !== null} onOpenChange={(open) => !open && setRestoreConfirm(null)}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-zinc-900 dark:text-white">Restore Snapshot</DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400">
              This will replace the current content with the selected snapshot. A backup of the current content will be saved automatically.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRestoreConfirm(null)}
              className="border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmRestore}
              className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer font-medium"
            >
              Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

