import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

function getSnippet(content, query) {
  if (!content) return ''
  const idx = content.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return content.slice(0, 60)
  const start = Math.max(0, idx - 30)
  const end = Math.min(content.length, idx + query.length + 30)
  let snippet = (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '')
  return snippet
}

export function SearchNotesDialog({ open, onOpenChange, notes, onSelectNote }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return notes
      .map(n => ({
        ...n,
        score: (n.title.toLowerCase().includes(q) ? 2 : 0) + (n.content?.toLowerCase().includes(q) ? 1 : 0),
      }))
      .filter(n => n.score > 0)
      .sort((a, b) => b.score - a.score || (b.updatedAt - a.updatedAt))
  }, [notes, query])

  const handleSelect = (id) => {
    onSelectNote(id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setQuery(''); onOpenChange(v) } else onOpenChange(v) }}>
      <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 sm:max-w-lg rounded-lg top-[15%]">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-white flex items-center gap-2 text-base">
            <Search className="w-4 h-4 text-zinc-500" />
            <span>Search All Notes</span>
          </DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search across all notes..."
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md pl-9 pr-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>
        <div className="max-h-80 overflow-y-auto space-y-0.5 -mx-1">
          {query && results.length === 0 && (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-8 select-none">
              No notes match your search.
            </p>
          )}
          {results.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => handleSelect(note.id)}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-zinc-400"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                  {note.title.replace(/\.md$/i, '') || 'Untitled'}
                </span>
              </div>
              {note.content && (
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate pl-6">
                  {getSnippet(note.content, query)}
                </p>
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
