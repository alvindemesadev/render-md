import { FileText } from 'lucide-react'
import { NOTE_TEMPLATES } from '../lib/templates'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

export function TemplatesDialog({ open, onOpenChange, onCreateFromTemplate }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 sm:max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-white">New from Template</DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400">
            Choose a template to start a new note with pre-filled content.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1 py-1">
          {NOTE_TEMPLATES.map((tpl) => (
            <button
              key={tpl.name}
              type="button"
              onClick={() => {
                onCreateFromTemplate(tpl.name, tpl.content)
                onOpenChange(false)
              }}
              className="w-full text-left px-3 py-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-zinc-400"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{tpl.name}</span>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
