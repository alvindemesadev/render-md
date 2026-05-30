import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Plus, Trash2, FileText, Sun, Moon, Pencil, BookOpen, Copy, Search, X, Settings, GripVertical, Upload, Pin, PinOff, Command, Download, LayoutTemplate, Keyboard } from 'lucide-react'
import { Button } from './ui/button'
import { useDarkMode, getRelativeTime } from '../lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'

function RenderMDLogo({ size = 28 }) {
  const isDark = useDarkMode()

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ flexShrink: 0 }}>
      {/* Background: near-black in light mode, near-white in dark mode */}
      <rect width="32" height="32" rx="7" fill={isDark ? '#f4f4f5' : '#09090b'} />
      {/* R lettermark */}
      <text x="5" y="24" fontFamily="ui-sans-serif,system-ui,sans-serif" fontSize="22" fontWeight="700" fill={isDark ? '#09090b' : '#ffffff'}>R</text>
      {/* md pill */}
      <rect x="17" y="19" width="13" height="8" rx="2" fill={isDark ? '#a1a1aa' : '#3f3f46'} />
      <text x="19" y="26" fontFamily="ui-monospace,monospace" fontSize="7" fontWeight="600" fill={isDark ? '#27272a' : '#d4d4d8'}>md</text>
    </svg>
  )
}

function getFullDate(timestamp) {
  return new Date(timestamp).toLocaleString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function getSnippet(content) {
  if (!content) return 'Empty note'
  const clean = content
    .replace(/^#+\s+/gm, '')
    .replace(/[*_~`\-+>]/g, '')
    .replace(/\[[x ]\]/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return clean.substring(0, 60) || 'Empty note'
}

function NoteItem({ note, isActive, index, onSelect, onDuplicate, onRename, onDelete, onKeyDown, onTogglePin, onSetTagFilter }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'opacity-40 z-10' : ''}`}
    >
      <div
        {...attributes}
        role="button"
        tabIndex={0}
        data-note-id={note.id}
        onClick={() => onSelect(note.id)}
        onKeyDown={(e) => onKeyDown(e, note.id, index)}
        aria-current={isActive ? 'true' : undefined}
        aria-label={`Open note: ${note.title || 'Untitled'}`}
        className={`w-full text-left flex flex-col gap-1 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-100 select-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-400 dark:focus-visible:outline-zinc-500 ${
          isActive
            ? 'bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700'
            : 'border border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-800'
        } ${isDragging ? 'ring-2 ring-zinc-400 dark:ring-zinc-500' : ''}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1">
            <button
              type="button"
              {...listeners}
              className="p-0.5 rounded text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-grab active:cursor-grabbing transition-colors touch-none shrink-0 focus-visible:outline-2 focus-visible:outline-zinc-400"
              aria-label={`Drag to reorder ${note.title || 'Untitled'}`}
              tabIndex={-1}
            >
              <GripVertical className="w-3.5 h-3.5" />
            </button>
            <FileText
              className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-zinc-600 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-500'}`}
              aria-hidden="true"
            />
            <span className={`font-medium text-sm truncate ${isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
              {(note.title || '').replace(/\.md$/i, '') || 'Untitled'}
            </span>
            {note.pinned && <Pin className="w-3 h-3 shrink-0 text-zinc-400 dark:text-zinc-500" aria-label="Pinned" />}
          </div>

          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-100">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onTogglePin(note.id) }}
              aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
              title={note.pinned ? 'Unpin' : 'Pin'}
              className="p-1 rounded text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-zinc-400"
            >
              {note.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDuplicate(note.id) }}
              aria-label={`Duplicate note: ${note.title || 'Untitled'}`}
              title="Duplicate"
              className="p-1 rounded text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-zinc-400"
            >
              <Copy className="w-3 h-3" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRename(note.id, note.title) }}
              aria-label={`Rename note: ${note.title || 'Untitled'}`}
              title="Rename"
              className="p-1 rounded text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-zinc-400"
            >
              <Pencil className="w-3 h-3" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(e, note.id) }}
              aria-label={`Delete note: ${note.title || 'Untitled'}`}
              title="Delete"
              className="p-1 rounded text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-red-400"
            >
              <Trash2 className="w-3 h-3" aria-hidden="true" />
            </button>
          </div>
        </div>

        <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed truncate pl-11">
          {getSnippet(note.content)}
        </p>

        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pl-11 mt-0.5">
            {note.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={(e) => { e.stopPropagation(); onSetTagFilter(tag) }}
                className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-zinc-400"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 pl-11">
          <span title={getFullDate(note.updatedAt)} className="cursor-default">
            {getRelativeTime(note.updatedAt)}
          </span>
          <span className="font-mono text-[9px]">
            {note.content ? `${note.content.length} chars` : '0 chars'}
          </span>
        </div>
      </div>
    </div>
  )
}

export function Sidebar({
  notes, activeNoteId, onSelectNote, onCreateNote, onDeleteNote,
  theme, onToggleTheme, onRenameNote, onDuplicateNote,
  isSidebarOpen, onToggleSidebar, layoutSelector, onOpenCheatsheet, onOpenSettings, layout,
  onReorderNotes, onImportMarkdown,
  onTogglePin, onOpenTemplates, onOpenShortcuts, onOpenSearch,
  onExportAll, tagFilter, onSetTagFilter,
}) {
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [, setTimestamp] = useState(() => Date.now())
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef(null)
  const importInputRef = useRef(null)

  const handleImportFiles = (e) => {
    const files = Array.from(e.target.files || [])
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const content = ev.target?.result || ''
        const title = file.name.replace(/\.md$/i, '').trim() || 'Imported Note'
        onImportMarkdown(title, content)
      }
      reader.readAsText(file)
    })
    e.target.value = ''
  }

  useEffect(() => {
    let interval = null
    const start = () => { interval = setInterval(() => setTimestamp(Date.now()), 15000) }
    const stop = () => { if (interval) clearInterval(interval) }
    const onVisibility = () => document.hidden ? stop() : start()
    start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => { stop(); document.removeEventListener('visibilitychange', onVisibility) }
  }, [])

  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return (b.order || b.updatedAt) - (a.order || a.updatedAt)
    }),
    [notes]
  )

  const filteredNotes = useMemo(() => {
    let result = sortedNotes
    if (tagFilter) {
      result = result.filter(n => n.tags && n.tags.includes(tagFilter))
    }
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        (n.content && n.content.toLowerCase().includes(q))
      )
    }
    return result
  }, [sortedNotes, searchQuery, tagFilter])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = filteredNotes.findIndex(n => n.id === active.id)
    const newIdx = filteredNotes.findIndex(n => n.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    // Reorder only within filtered view, then merge back with non-filtered notes
    const reordered = [...filteredNotes]
    const [moved] = reordered.splice(oldIdx, 1)
    reordered.splice(newIdx, 0, moved)
    // Build final ID list: reordered filtered notes merged with non-filtered notes
    // preserving their relative positions in the full sorted list
    const filteredIds = new Set(filteredNotes.map(n => n.id))
    const nonFilteredIds = sortedNotes.filter(n => !filteredIds.has(n.id)).map(n => n.id)
    // Interleave: put non-filtered notes back at their original positions
    const allIds = sortedNotes.map(n => n.id)
    let filteredIdx = 0
    const mergedIds = allIds.map(id => {
      if (filteredIds.has(id)) return reordered[filteredIdx++].id
      return id
    })
    onReorderNotes(mergedIds)
  }, [filteredNotes, sortedNotes, onReorderNotes])

  const handleDeleteClick = (e, noteId) => { e.stopPropagation(); setDeleteConfirmId(noteId) }
  const handleRenameClick = (noteId, currentTitle) => { onRenameNote(noteId, currentTitle) }
  const handleDuplicateClick = (noteId) => { onDuplicateNote(noteId) }
  const confirmDelete = () => {
    if (deleteConfirmId) { onDeleteNote(deleteConfirmId); setDeleteConfirmId(null) }
  }

  const handleNoteKeyDown = (e, noteId, index) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = filteredNotes[index + 1]
      if (next) document.querySelector(`[data-note-id="${next.id}"]`)?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = filteredNotes[index - 1]
      if (prev) document.querySelector(`[data-note-id="${prev.id}"]`)?.focus()
      else searchInputRef.current?.focus()
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelectNote(noteId)
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      setDeleteConfirmId(noteId)
    }
  }

  const borderSide = layout === 'tabs_sidebar' || layout === 'split_sidebar' ? 'border-l' : 'border-r'
  const slideFrom = layout === 'tabs_sidebar' || layout === 'split_sidebar' ? 'right-0' : 'left-0'
  const slideOutClass = layout === 'tabs_sidebar' || layout === 'split_sidebar' ? 'translate-x-full' : '-translate-x-full'

  const sidebarContent = (
    <>
      {/* App Banner */}
      <div className="h-16 px-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50 dark:bg-zinc-950">
        <div className="flex items-center gap-2.5 select-none">
          <RenderMDLogo size={28} />
          <span className="font-bold text-zinc-900 dark:text-white text-base tracking-tight">RenderMD</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-8 h-8 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4" aria-hidden="true" />
            : <Moon className="w-4 h-4" aria-hidden="true" />}
        </Button>
      </div>

      {/* New Note Button */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0 flex flex-col gap-1.5">
        <div className="flex gap-1.5">
          <Button
            type="button"
            onClick={onCreateNote}
            className="flex-1 bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 transition-colors font-medium flex items-center justify-center gap-2 rounded-md h-9 cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
            <span>New Note</span>
          </Button>
          <Button
            type="button"
            onClick={onOpenTemplates}
            title="New from Template"
            aria-label="New from Template"
            className="w-9 h-9 p-0 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-650 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center justify-center rounded-md shrink-0 cursor-pointer transition-colors"
          >
            <LayoutTemplate className="w-4 h-4" />
          </Button>
        </div>
        <input ref={importInputRef} type="file" accept=".md,.markdown,text/markdown,text/plain"
          multiple className="hidden" onChange={handleImportFiles} aria-label="Import markdown files" />
        <Button
          type="button"
          variant="outline"
          onClick={() => importInputRef.current?.click()}
          className="w-full border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center gap-2 rounded-md h-9 cursor-pointer text-sm font-medium transition-colors"
        >
          <Upload className="w-4 h-4" aria-hidden="true" />
          <span>Import .md</span>
        </Button>
      </div>

      {/* Search / Filter */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            aria-label="Search notes"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' && filteredNotes.length > 0) {
                e.preventDefault()
                document.querySelector(`[data-note-id="${filteredNotes[0].id}"]`)?.focus()
              }
              if (e.key === 'Escape') setSearchQuery('')
            }}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md pl-8 pr-14 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-colors"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="text-zinc-450 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer p-0.5 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={onOpenSearch}
              title="Advanced Full-Text Search"
              aria-label="Advanced Full-Text Search"
              className="text-zinc-450 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-805 transition-colors"
            >
              <Command className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tag filter indicator */}
      {tagFilter && (
        <div className="px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-800 shrink-0 flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
            Filtered by tag: <span className="font-semibold">{tagFilter}</span>
          </span>
          <button
            type="button"
            onClick={() => onSetTagFilter(null)}
            className="ml-auto p-0.5 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
            aria-label="Clear tag filter"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Document List with Drag & Drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
        <SortableContext items={filteredNotes.map(n => n.id)} strategy={verticalListSortingStrategy}>
          <div className="flex-1 overflow-y-auto p-3 space-y-0.5" role="list" aria-label="Notes">
            {filteredNotes.length === 0 ? (
              <div className="text-center text-zinc-400 dark:text-zinc-500 py-8 px-4 text-sm font-light select-none">
                {searchQuery ? 'No notes match your search.' : 'No notes yet.'}
              </div>
            ) : (
              filteredNotes.map((note, index) => (
                <div key={note.id} role="listitem">
                  <NoteItem
                    note={note}
                    isActive={note.id === activeNoteId}
                    index={index}
                    onSelect={onSelectNote}
                    onDuplicate={handleDuplicateClick}
                    onRename={handleRenameClick}
                    onDelete={handleDeleteClick}
                    onKeyDown={handleNoteKeyDown}
                    onTogglePin={onTogglePin}
                    onSetTagFilter={onSetTagFilter}
                  />
                </div>
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Sidebar Footer */}
      <div className="h-12 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 shrink-0 flex items-center justify-between px-3 select-none">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          title="Settings"
          aria-label="Settings"
          className="w-8 h-8 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
        >
          <Settings className="w-4 h-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOpenCheatsheet}
          title="Markdown Cheatsheet"
          aria-label="Markdown Cheatsheet"
          className="w-8 h-8 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
        >
          <BookOpen className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts"
          aria-label="Keyboard Shortcuts"
          className="w-8 h-8 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
        >
          <Keyboard className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onExportAll}
          title="Export All Notes"
          aria-label="Export All Notes"
          className="w-8 h-8 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-zinc-900 dark:text-white">Delete Note</DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400">
              This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              className="border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer font-medium"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs lg:hidden"
          onClick={() => onToggleSidebar()}
          aria-hidden="true"
        />
      )}

      {/* Mobile overlay sidebar */}
      <aside
        aria-label="Document sidebar"
        aria-hidden={!isSidebarOpen}
        {...(!isSidebarOpen ? { inert: true } : {})}
        className={`lg:hidden fixed inset-y-0 ${slideFrom} z-50 transition-transform duration-300 ease-in-out bg-zinc-50 dark:bg-zinc-950 flex flex-col h-full text-zinc-700 dark:text-zinc-300 ${
          isSidebarOpen ? 'translate-x-0' : slideOutClass
        } ${borderSide} border-zinc-200 dark:border-zinc-800 w-[280px] lg:w-[320px]`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop inline sidebar */}
      <aside
        aria-label="Document sidebar"
        aria-hidden={!isSidebarOpen}
        {...(!isSidebarOpen ? { inert: true } : {})}
        className={`hidden lg:flex transition-all duration-300 ease-in-out shrink-0 bg-zinc-50 dark:bg-zinc-950 flex-col h-full text-zinc-700 dark:text-zinc-300 ${
          isSidebarOpen
            ? `w-[280px] lg:w-[320px] ${borderSide} border-zinc-200 dark:border-zinc-800`
            : 'w-0 overflow-hidden'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  )
}

