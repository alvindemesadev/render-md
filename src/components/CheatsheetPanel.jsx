import { useState } from 'react'
import { BookOpen, X } from 'lucide-react'
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

export function CheatsheetPanel({ onClose }) {
  const [tab, setTab] = useState('headings')

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
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Tabs */}
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar text-[11px]">
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/20">
          <div className="grid grid-cols-3 bg-zinc-100 dark:bg-zinc-800 p-2 font-semibold text-zinc-750 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800">
            <div>Element</div>
            <div>Syntax</div>
            <div>Preview</div>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {CHEATSHEET_DATA[tab].map((row, idx) => (
              <div key={idx} className="grid grid-cols-3 p-2.5 items-center hover:bg-zinc-50/30 dark:hover:bg-zinc-800/5">
                <div className="font-semibold text-zinc-800 dark:text-zinc-200 pr-1 truncate" title={row.name}>
                  {row.name}
                </div>
                <div className="pr-1 font-mono text-[9px] text-zinc-500 dark:text-zinc-400 select-all overflow-x-auto whitespace-pre-wrap leading-tight break-all">
                  {row.syntax}
                </div>
                <div className="text-zinc-700 dark:text-zinc-300 leading-normal max-w-full overflow-hidden select-text">
                  {row.output}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
