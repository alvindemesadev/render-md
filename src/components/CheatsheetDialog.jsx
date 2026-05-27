import { useState } from 'react'
import { BookOpen } from 'lucide-react'
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

export function CheatsheetDialog({ open, onOpenChange }) {
  const [tab, setTab] = useState('headings')

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setTab('headings'); onOpenChange(v) }}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 sm:max-w-2xl rounded-lg w-[95vw] md:w-full max-h-[85vh] flex flex-col p-6"
      >
        <DialogHeader className="shrink-0 mb-4">
          <DialogTitle className="text-zinc-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            <span>Markdown Cheatsheet</span>
          </DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400">
            Quick syntax guide for writing standard Markdown and GitHub Flavored Markdown (GFM).
          </DialogDescription>
        </DialogHeader>

        <div className="flex border-b border-zinc-200 dark:border-zinc-800 shrink-0 select-none mb-4 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-zinc-400 focus-visible:outline-offset-[-2px] ${
                tab === t.id
                  ? 'border-zinc-800 dark:border-zinc-200 text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/30'
                  : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar text-xs">
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/20">
            <div className="grid grid-cols-3 bg-zinc-100 dark:bg-zinc-800 p-2.5 font-semibold text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800 select-none">
              <div>Element</div>
              <div>Syntax</div>
              <div>Preview</div>
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {CHEATSHEET_DATA[tab].map((row, idx) => (
                <div key={idx} className="grid grid-cols-3 p-3 items-center hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 pr-2 truncate">{row.name}</div>
                  <div className="pr-2 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 select-all overflow-x-auto whitespace-pre-wrap leading-tight break-all">
                    {row.syntax}
                  </div>
                  <div className="text-zinc-800 dark:text-zinc-200 leading-normal max-w-full overflow-hidden select-text">
                    {row.output}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="shrink-0 flex justify-end pt-4">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-zinc-900 text-zinc-100 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer font-medium px-4 py-2 text-xs rounded-md"
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
