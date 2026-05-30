import { useState, useEffect } from 'react'
import { FileText } from 'lucide-react'
import { NOTE_TEMPLATES } from '../lib/templates'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

export function TemplatesDialog({ open, onOpenChange, onCreateFromTemplate }) {
  const [selectedTemplate, setSelectedTemplate] = useState(NOTE_TEMPLATES[0])

  useEffect(() => {
    if (open) {
      setSelectedTemplate(NOTE_TEMPLATES[0])
    }
  }, [open])

  const handleCreate = () => {
    if (!selectedTemplate) return
    onCreateFromTemplate(selectedTemplate.name, selectedTemplate.content)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 sm:max-w-3xl h-[520px] flex flex-col rounded-lg p-5">
        <DialogHeader className="shrink-0 mb-3">
          <DialogTitle className="text-zinc-900 dark:text-white">New from Template</DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400">
            Select a pre-configured template layout to initialize a new note.
          </DialogDescription>
        </DialogHeader>

        {/* Split View Content */}
        <div className="flex-1 flex min-h-0 divide-zinc-200 dark:divide-zinc-800 gap-4 mb-4 overflow-hidden sm:divide-x">
          
          {/* Left Panel: Templates List */}
          <div className="w-full sm:w-1/3 flex flex-col gap-1 sm:pr-2 overflow-y-auto custom-scrollbar select-none">
            {NOTE_TEMPLATES.map((tpl) => {
              const isSelected = selectedTemplate?.name === tpl.name
              return (
                <button
                  key={tpl.name}
                  type="button"
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-xs font-semibold focus-visible:outline-2 focus-visible:outline-zinc-450 ${
                    isSelected
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-350 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white dark:text-zinc-900' : 'text-zinc-400'}`} />
                    <span className="truncate">{tpl.name}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Right Panel: Template Preview (Hidden on small mobile viewports) */}
          <div className="hidden sm:flex flex-1 flex-col min-w-0 pl-4 h-full overflow-hidden">
            <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono mb-2 block select-none">
              Template Preview
            </span>
            <div className="flex-1 overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3.5 font-mono text-[11px] text-zinc-750 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap select-text custom-scrollbar">
              {selectedTemplate?.content}
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
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            className="bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold cursor-pointer"
          >
            Create Note
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
