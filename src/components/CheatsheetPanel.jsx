import { useState } from 'react'
import { BookOpen, X, Search } from 'lucide-react'
import { CHEATSHEET_DATA } from '../lib/cheatsheet'

const TABS = [
  { id: 'headings',     label: 'Headings' },
  { id: 'emphasis',     label: 'Emphasis' },
  { id: 'lists',        label: 'Lists' },
  { id: 'links_images', label: 'Links & Images' },
  { id: 'code',         label: 'Code' },
  { id: 'tables',       label: 'Tables' },
  { id: 'extras',       label: 'Extras' },
]

export function CheatsheetPanel({ onClose, onInsertText }) {
  const [tab, setTab] = useState('headings')
  const [searchQuery, setSearchQuery] = useState('')

  const handleRowClick = (row) => {
    if (!onInsertText) return
    const snippet = row.insert || row.syntax.split(' or ')[0]
    onInsertText(snippet)
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
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 w-80 shrink-0 select-none">
      {/* Header */}
      <div className="h-10 px-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
          <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Cheatsheet</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close cheatsheet"
          className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search syntax (e.g. table, bold)..."
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md pl-8 pr-7 py-1.5 text-[11px] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs - Only shown when not searching */}
      {!searchQuery && (
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 shrink-0 overflow-x-auto no-scrollbar scroll-smooth">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-[10px] font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                tab === t.id
                  ? 'border-zinc-850 dark:border-zinc-200 text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/30'
                  : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar text-[11px]">
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/20">
          <div className="grid grid-cols-3 bg-zinc-100 dark:bg-zinc-800 p-2 font-semibold text-zinc-750 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800 select-none">
            <div>Element</div>
            <div>Syntax</div>
            <div>Preview</div>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {displayItems.length > 0 ? (
              displayItems.map((row, idx) => (
                <div
                  key={idx}
                  onClick={() => handleRowClick(row)}
                  title="Click to insert at cursor"
                  className="grid grid-cols-3 p-2.5 items-center hover:bg-zinc-100 dark:hover:bg-zinc-800/40 active:bg-zinc-200 dark:active:bg-zinc-700/50 cursor-pointer transition-colors"
                >
                  <div className="pr-1 flex flex-col min-w-0">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate" title={row.name}>
                      {row.name}
                    </span>
                    {searchQuery && (
                      <span className="inline-block self-start mt-0.5 text-[8px] font-bold font-mono px-1 py-0.2 bg-zinc-200 dark:bg-zinc-850 text-zinc-500 dark:text-zinc-400 rounded-sm uppercase tracking-wider scale-90 origin-left">
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
              <div className="p-4 text-center text-zinc-400 dark:text-zinc-500 select-none">
                No matching syntax found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

