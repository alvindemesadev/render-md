import { useState, useMemo } from 'react'
import { Download, FileText, Search, CheckSquare, Square, X } from 'lucide-react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog'
import JSZip from 'jszip'
import { getRelativeTime, getWordCount } from '../lib/utils'

export function ExportNotesDialog({ open, onOpenChange, notes, onToast }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(() => new Set(notes.map(n => n.id)))
  const [exporting, setExporting] = useState(false)

  // Reset selection when dialog opens
  const handleOpenChange = (val) => {
    if (val) {
      setSelected(new Set(notes.map(n => n.id)))
      setSearch('')
    }
    onOpenChange(val)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return notes
    return notes.filter(n =>
      (n.title || '').toLowerCase().includes(q) ||
      (n.content || '').toLowerCase().includes(q)
    )
  }, [notes, search])

  const allFilteredSelected = filtered.length > 0 && filtered.every(n => selected.has(n.id))
  const someFilteredSelected = filtered.some(n => selected.has(n.id))

  const toggleNote = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(n => next.delete(n.id))
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(n => next.add(n.id))
        return next
      })
    }
  }

  const selectedNotes = notes.filter(n => selected.has(n.id))

  const handleExport = async () => {
    if (selectedNotes.length === 0) return
    setExporting(true)
    try {
      const zip = new JSZip()
      const usedFilenames = new Set()

      selectedNotes.forEach(note => {
        let base = (note.title || 'untitled').replace(/[^a-zA-Z0-9._\- ]/g, '_').trim() || 'untitled'
        let filename = `${base}.md`
        let counter = 1
        while (usedFilenames.has(filename)) {
          filename = `${base}_${counter}.md`
          counter++
        }
        usedFilenames.add(filename)
        zip.file(filename, note.content || '')
      })

      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rendermd-export-${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      onToast?.(`Exported ${selectedNotes.length} note${selectedNotes.length !== 1 ? 's' : ''} as ZIP`, 'success')
      handleOpenChange(false)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 sm:max-w-lg w-[95vw] max-h-[85vh] flex flex-col p-0 gap-0 rounded-xl overflow-hidden"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-zinc-900 dark:text-white text-base font-semibold flex items-center gap-2">
                <Download className="w-4 h-4 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
                Export Notes
              </DialogTitle>
              <DialogDescription className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
                Select notes to export as a ZIP of <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded">.md</code> files.
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              aria-label="Close"
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors shrink-0 mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter notes..."
              aria-label="Filter notes"
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear filter"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Select all row */}
          <div className="flex items-center justify-between mt-3">
            <button
              type="button"
              onClick={toggleAll}
              className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors"
            >
              {allFilteredSelected
                ? <CheckSquare className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />
                : someFilteredSelected
                  ? <div className="w-4 h-4 rounded border-2 border-zinc-400 dark:border-zinc-500 bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center"><div className="w-2 h-0.5 bg-zinc-600 dark:bg-zinc-300 rounded" /></div>
                  : <Square className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              }
              {allFilteredSelected ? 'Deselect all' : 'Select all'}
              {search && ` (${filtered.length} shown)`}
            </button>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
              {selected.size} / {notes.length} selected
            </span>
          </div>
        </div>

        {/* Note list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-zinc-400 dark:text-zinc-500 text-sm select-none">
              No notes match your filter.
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filtered.map(note => {
                const isChecked = selected.has(note.id)
                const words = getWordCount(note.content)
                return (
                  <li key={note.id}>
                    <button
                      type="button"
                      onClick={() => toggleNote(note.id)}
                      className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors cursor-pointer group ${
                        isChecked
                          ? 'bg-zinc-50 dark:bg-zinc-800/40'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/20'
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="shrink-0 mt-0.5">
                        {isChecked
                          ? <CheckSquare className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />
                          : <Square className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-400 dark:group-hover:text-zinc-500 transition-colors" />
                        }
                      </div>

                      {/* Note info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden="true" />
                          <span className={`text-sm font-medium truncate ${isChecked ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}`}>
                            {(note.title || '').replace(/\.md$/i, '') || 'Untitled'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 pl-5">
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
                            {words > 0 ? `${words} words` : 'Empty'}
                          </span>
                          <span className="text-[11px] text-zinc-300 dark:text-zinc-600">·</span>
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                            {getRelativeTime(note.updatedAt)}
                          </span>
                          {note.pinned && (
                            <>
                              <span className="text-[11px] text-zinc-300 dark:text-zinc-600">·</span>
                              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">📌 Pinned</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* File size estimate */}
                      <span className="text-[10px] text-zinc-300 dark:text-zinc-600 font-mono shrink-0">
                        {note.content ? `${(note.content.length / 1024).toFixed(1)} KB` : '0 KB'}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 shrink-0 flex items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-950/30">
          <div className="text-xs text-zinc-400 dark:text-zinc-500">
            {selected.size === 0
              ? 'No notes selected'
              : `${selected.size} note${selected.size !== 1 ? 's' : ''} → ZIP`
            }
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer text-xs h-8 px-3"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleExport}
              disabled={selected.size === 0 || exporting}
              className="bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 cursor-pointer text-xs h-8 px-4 font-medium disabled:opacity-50 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              {exporting ? 'Exporting...' : `Export ${selected.size > 0 ? selected.size : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
