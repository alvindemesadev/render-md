import { useState, useEffect } from 'react'
import { BookOpen, X, Search } from 'lucide-react'
import { CHEATSHEET_DATA } from '../lib/cheatsheet'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

const TABS = [
  { id: 'headings',     label: 'Headings' },
  { id: 'emphasis',     label: 'Emphasis' },
  { id: 'lists',        label: 'Lists' },
  { id: 'links_images', label: 'Links & Images' },
  { id: 'code',         label: 'Code' },
  { id: 'tables',       label: 'Tables' },
  { id: 'extras',       label: 'Extras' },
]

export function CheatsheetDialog({ open, onOpenChange, onInsertText }) {
  const [tab, setTab] = useState('headings')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (open) {
      setSearchQuery('')
      setTab('headings')
    }
  }, [open])

  const handleRowClick = (row) => {
    if (onInsertText) {
      const snippet = row.insert || row.syntax.split(' or ')[0]
      onInsertText(snippet)
    }
    onOpenChange(false)
  }

  // Filter search results across all categories
  const searchResults = searchQuery
    ? Object.entries(CHEATSHEET_DATA).flatMap(([catId, items]) => {
        const category = TABS.find(t => t.id === catId)?.label || catId
        return items
          .filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.syntax.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(item => ({ ...item, category, catId }))
      })
    : []

  const displayItems = searchQuery ? searchResults : CHEATSHEET_DATA[tab]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 sm:max-w-5xl h-[680px] flex flex-col rounded-lg p-5">
        <DialogHeader className="shrink-0 mb-3">
          <DialogTitle className="text-zinc-900 dark:text-white flex items-center gap-1.5">
            <BookOpen className="w-5 h-5" />
            <span>Markdown Cheatsheet</span>
          </DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400">
            Quick syntax reference. Click any row to insert it directly into your note.
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="mb-3 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search syntax (e.g. table, bold, list)..."
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md pl-9 pr-8 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3 p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Split View Content */}
        <div className="flex-1 flex min-h-0 divide-zinc-200 dark:divide-zinc-800 gap-4 overflow-hidden sm:divide-x">
          
          {/* Left Panel: Tabs list (Hidden during search) */}
          {!searchQuery ? (
            <div className="w-full sm:w-1/5 flex flex-col gap-1 sm:pr-2 overflow-y-auto custom-scrollbar select-none shrink-0">
              {TABS.map((t) => {
                const isSelected = tab === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-xs font-semibold focus-visible:outline-2 focus-visible:outline-zinc-400 ${
                      isSelected
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{t.label}</span>
                  </button>
                )
              })}
            </div>
          ) : null}

          {/* Right Panel: Content Grid */}
          <div className={`flex-1 flex flex-col min-w-0 h-full overflow-hidden ${!searchQuery ? 'pl-4' : ''}`}>
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden flex-1 flex flex-col bg-zinc-50/50 dark:bg-zinc-950/20">
              {/* Table Header */}
              <div className="grid grid-cols-3 bg-zinc-100 dark:bg-zinc-800 p-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800 select-none">
                <div>Element</div>
                <div>Syntax</div>
                <div>Preview</div>
              </div>
              {/* Table Rows */}
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 overflow-y-auto custom-scrollbar flex-1">
                {displayItems.length > 0 ? (
                  displayItems.map((row, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleRowClick(row)}
                      title="Click to insert at cursor"
                      className="grid grid-cols-3 p-2.5 items-center hover:bg-zinc-100 dark:hover:bg-zinc-800/40 active:bg-zinc-200 dark:active:bg-zinc-700/50 cursor-pointer transition-colors"
                    >
                      <div className="pr-1 flex flex-col min-w-0">
                        <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 truncate" title={row.name}>
                          {row.name}
                        </span>
                        {searchQuery && (
                          <span className="inline-block self-start mt-1 text-[8px] font-bold font-mono px-1 py-0.2 bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-sm uppercase tracking-wider scale-90 origin-left">
                            {row.category}
                          </span>
                        )}
                      </div>
                      <div className="pr-1 font-mono text-[9px] text-zinc-500 dark:text-zinc-400 select-all overflow-x-auto whitespace-pre-wrap leading-tight break-all pointer-events-none">
                        {row.syntax}
                      </div>
                      <div className="text-zinc-700 dark:text-zinc-300 leading-normal max-w-full overflow-hidden select-text pointer-events-none">
                        {row.output}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-zinc-400 dark:text-zinc-500 select-none text-xs">
                    No matching syntax found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium cursor-pointer"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
