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

export function RenameNoteDialog({ noteId, currentTitle, onOpenChange, onRename }) {
  const [title, setTitle] = useState(currentTitle || '')

  const handleRename = () => {
    if (noteId) onRename(noteId, title)
  }

  return (
    <Dialog open={noteId !== null} onOpenChange={(open) => { if (!open) onOpenChange(null) }}>
      <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 max-w-sm rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-white">Rename Note</DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400">
            Enter a new title for this Markdown document.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Renamed Document"
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-transparent placeholder-zinc-400 dark:placeholder-zinc-600 font-sans"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
            }}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(null)}
            className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleRename}
            className="bg-zinc-900 text-zinc-100 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer font-medium"
          >
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
