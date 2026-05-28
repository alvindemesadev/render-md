import { Command } from 'lucide-react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

const SHORTCUTS = [
  { category: 'Editing', keys: [
    { combo: 'Ctrl+B', desc: 'Bold selection' },
    { combo: 'Ctrl+I', desc: 'Italic selection' },
    { combo: 'Ctrl+`', desc: 'Inline code selection' },
    { combo: 'Ctrl+K', desc: 'Insert link' },
    { combo: 'Ctrl+Shift+K', desc: 'Insert code block' },
    { combo: 'Ctrl+F', desc: 'Find & replace' },
  ]},
  { category: 'Navigation', keys: [
    { combo: 'Ctrl+Shift+F', desc: 'Search all notes' },
    { combo: 'Arrow Up/Down', desc: 'Navigate notes in sidebar' },
    { combo: 'Enter / Space', desc: 'Open selected note' },
    { combo: 'Delete / Backspace', desc: 'Delete selected note' },
    { combo: 'Escape', desc: 'Close panel / Exit focus mode' },
  ]},
  { category: 'View', keys: [
    { combo: '?', desc: 'Show keyboard shortcuts' },
  ]},
]

export function KeyboardShortcutsDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 sm:max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-white flex items-center gap-2">
            <Command className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            <span>Keyboard Shortcuts</span>
          </DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400">
            All available keyboard shortcuts for editing and navigation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {SHORTCUTS.map((group) => (
            <div key={group.category}>
              <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-2 px-1">
                {group.category}
              </h4>
              <div className="space-y-1">
                {group.keys.map((shortcut) => (
                  <div key={shortcut.combo} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">{shortcut.desc}</span>
                    <kbd className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400 ml-4 shrink-0">
                      {shortcut.combo}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2">
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
