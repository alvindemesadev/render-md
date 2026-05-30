import { useState } from 'react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

export function CreateNoteDialog({ open, onOpenChange, onCreateNote }) {
  const [title, setTitle] = useState('Untitled')
  const [error, setError] = useState(false)

  const handleCreate = () => {
    if (!title.trim()) {
      setError(true)
      return
    }
    onCreateNote(title)
    setTitle('Untitled')
    setError(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setTitle('Untitled'); setError(false); } onOpenChange(v) }}>
      <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 max-w-sm rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-white">Create New Note</DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400">
            Enter a title for your new Markdown document.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (e.target.value.trim()) setError(false)
            }}
            placeholder="Project Goals"
            className={`w-full bg-zinc-50 dark:bg-zinc-950 border rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-transparent placeholder-zinc-400 dark:placeholder-zinc-600 font-sans ${
              error ? 'border-red-500 dark:border-red-500 ring-2 ring-red-500/20' : 'border-zinc-200 dark:border-zinc-800'
            }`}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
            }}
          />
          {error && (
            <p className="text-[11px] text-red-500 dark:text-red-400 mt-1.5 font-medium select-none">
              Note title cannot be empty or pure whitespace.
            </p>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => { setTitle('Untitled'); setError(false); onOpenChange(false) }}
            className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!title.trim()}
            className="bg-zinc-900 text-zinc-100 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

