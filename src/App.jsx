import { useState, useEffect, useCallback, useRef } from 'react'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { Preview } from './components/Preview'
import { useLocalStorage, setQuotaWarningHandler } from './hooks/useLocalStorage'
import { clearSnapshots } from './hooks/useVersionHistory'
import { useToast } from './hooks/useToast'
import { WELCOME_NOTE } from './lib/welcomeNote'
import { CreateNoteDialog } from './components/CreateNoteDialog'
import { RenameNoteDialog } from './components/RenameNoteDialog'
import { exportToHTML } from './lib/utils'
import { KeyboardShortcutsDialog } from './components/KeyboardShortcutsDialog'
import { SearchNotesDialog } from './components/SearchNotesDialog'
import { TemplatesDialog } from './components/TemplatesDialog'
import { Button } from './components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu'
import { ExportNotesDialog } from './components/ExportNotesDialog'
import { Layout, Columns3, Columns, Notebook, BookOpen, Maximize2, Split, Eye, SquarePen, ChevronDown } from 'lucide-react'

// Helper Layout Selector Dropdown
function LayoutSelector({ layout, onChangeLayout, variant = 'header' }) {
  // Detect mobile — only show mobile-appropriate layouts below lg (1024px)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const layoutNames = {
    default: '3-Column Left',
    split_sidebar: '3-Column Right',
    sidebar_tabs: 'Tabs Right',
    tabs_sidebar: 'Tabs Left',
    zen_split: 'Zen Split',
    zen: 'Zen Tabs',
    zen_editor: 'Zen Editor',
    zen_preview: 'Zen Preview',
    editor_only: 'Editor Focus',
    preview_only: 'Preview Focus'
  }

  const getLayoutIcon = (lay) => {
    switch (lay) {
      case 'default': return <Columns3 className="w-4 h-4" />
      case 'split_sidebar': return <Columns3 className="w-4 h-4 rotate-180" />
      case 'sidebar_tabs': return <Columns className="w-4 h-4" />
      case 'tabs_sidebar': return <Columns className="w-4 h-4 rotate-180" />
      case 'zen_split': return <Split className="w-4 h-4" />
      case 'zen': return <Maximize2 className="w-4 h-4" />
      case 'zen_editor': return <SquarePen className="w-4 h-4" />
      case 'zen_preview': return <Eye className="w-4 h-4" />
      case 'editor_only': return <Notebook className="w-4 h-4" />
      case 'preview_only': return <BookOpen className="w-4 h-4" />
      default: return <Layout className="w-4 h-4" />
    }
  }

  // Mobile: only 3 layouts that make sense — all keep the sidebar accessible
  const mobileGroups = [
    {
      label: 'Mobile Layouts',
      items: [
        { id: 'sidebar_tabs', name: 'Tabs (Write / Preview)', icon: <Columns className="w-4 h-4" /> },
        { id: 'editor_only', name: 'Editor Focus', icon: <Notebook className="w-4 h-4" /> },
        { id: 'preview_only', name: 'Preview Focus', icon: <BookOpen className="w-4 h-4" /> },
      ]
    }
  ]

  // Desktop: all layouts
  const desktopGroups = [
    {
      label: 'Standard Layouts',
      items: [
        { id: 'default', name: '3-Column Left', icon: <Columns3 className="w-4 h-4" /> },
        { id: 'split_sidebar', name: '3-Column Right', icon: <Columns3 className="w-4 h-4 rotate-180" /> }
      ]
    },
    {
      label: 'Tabbed Layouts',
      items: [
        { id: 'sidebar_tabs', name: 'Tabs Right', icon: <Columns className="w-4 h-4" /> },
        { id: 'tabs_sidebar', name: 'Tabs Left', icon: <Columns className="w-4 h-4 rotate-180" /> }
      ]
    },
    {
      label: 'Zen Modes (No Sidebar)',
      items: [
        { id: 'zen_split', name: 'Zen Split', icon: <Split className="w-4 h-4" /> },
        { id: 'zen', name: 'Zen Tabs', icon: <Maximize2 className="w-4 h-4" /> },
        { id: 'zen_editor', name: 'Zen Editor', icon: <SquarePen className="w-4 h-4" /> },
        { id: 'zen_preview', name: 'Zen Preview', icon: <Eye className="w-4 h-4" /> }
      ]
    },
    {
      label: 'Focus Modes',
      items: [
        { id: 'editor_only', name: 'Editor Focus', icon: <Notebook className="w-4 h-4" /> },
        { id: 'preview_only', name: 'Preview Focus', icon: <BookOpen className="w-4 h-4" /> }
      ]
    }
  ]

  const groups = isMobile ? mobileGroups : desktopGroups

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'sidebar' ? (
          <Button
            variant="outline"
            className="w-full border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center justify-between px-3 py-1.5 h-9 rounded-md transition-colors cursor-pointer text-xs font-medium shrink-0 bg-white dark:bg-zinc-900"
            title="Change Layout"
            aria-label="Change layout style"
          >
            <div className="flex items-center gap-1.5">
              {getLayoutIcon(layout)}
              <span>{layoutNames[layout] || 'Layout'}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
          </Button>
        ) : (
          <Button
            variant="outline"
            className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1.5 px-3 py-1.5 h-9 rounded-md transition-colors cursor-pointer text-xs font-medium shrink-0"
            title="Change Layout"
          >
            {getLayoutIcon(layout)}
            <span className="hidden md:inline">{layoutNames[layout] || 'Layout'}</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 w-52 rounded-md p-1 font-sans">
            {groups.map((group, groupIdx) => (
              <div key={group.label}>
            {groupIdx > 0 && <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800 my-1" />}
            <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
              {group.label}
            </DropdownMenuLabel>
            {group.items.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => onChangeLayout(item.id)}
                className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-md cursor-pointer transition-colors ${
                  layout === item.id
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </DropdownMenuItem>
            ))}
            </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function App() {
  const { toast } = useToast()
  const [notes, setNotes] = useLocalStorage('rendermd_notes', [WELCOME_NOTE], 500)
  const [activeNoteId, setActiveNoteId] = useLocalStorage('rendermd_active_note_id', 'welcome-note')
  
  const [theme, setTheme] = useLocalStorage('rendermd_theme', 'dark')
  const [editorFontFamily, setEditorFontFamily] = useLocalStorage('rendermd_font_family', 'monospace')
  const [isSidebarOpen, setIsSidebarOpen] = useLocalStorage('rendermd_sidebar_open', true)
  
  // Custom Layout Settings
  const [layout, setLayout] = useLocalStorage('rendermd_layout', 'default')
  const [editorTab, setEditorTab] = useLocalStorage('rendermd_editor_tab', 'edit') // 'edit' or 'preview'

  // Naming Modal State (Add New Note)
  const [isNamingModalOpen, setIsNamingModalOpen] = useState(false)

  // Renaming Modal State (Edit Note Title)
  const [renameNoteId, setRenameNoteId] = useState(null)
  const [renameTitle, setRenameTitle] = useState('')

  // Track active tab on mobile/tablets (below 1024px)
  const [mobileTab, setMobileTab] = useState('edit')

  // Feature #15: localStorage quota warning
  const [showQuotaWarning, setShowQuotaWarning] = useState(false)

  useEffect(() => {
    setQuotaWarningHandler(() => setShowQuotaWarning(true))
    return () => setQuotaWarningHandler(null)
  }, [])

  // Feature #16: editor font size
  const [editorFontSize, setEditorFontSize] = useLocalStorage('rendermd_font_size', 14)

  // Feature #17: focus mode
  const [isFocusMode, setIsFocusMode] = useState(false)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isFocusMode) setIsFocusMode(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isFocusMode])

  // State needed by global shortcuts below
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false)
  const [isCheatsheetOpen, setIsCheatsheetOpen] = useState(false)

  // Global shortcuts: Ctrl+Shift+F for search, ? for shortcuts dialog
  useEffect(() => {
    const handler = (e) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const ctrl = isMac ? e.metaKey : e.ctrlKey
      if (ctrl && e.shiftKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault()
        setIsSearchOpen(v => !v)
      }
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.target.closest('input, textarea, [contenteditable]')) {
        e.preventDefault()
        setIsShortcutsOpen(v => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Feature #18: word count goal (per note, stored in note metadata)
  // Feature #22: vim mode
  const [vimMode, setVimMode] = useLocalStorage('rendermd_vim_mode', false)

  // Feature #5: char limit (global setting)
  const [charLimit, setCharLimit] = useLocalStorage('rendermd_char_limit', 0)

  // Feature #25: version history cleanup on note delete — use standalone function, no hook needed
  // const { clearSnapshots } = useVersionHistory(null, null) — removed, using imported standalone fn

  // Feature #2: tags — stored on each note as note.tags = []
  const [tagFilter, setTagFilter] = useState(null)

  // Export notes modal
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  // Feature #21: GitHub Gist sync
  const [gistToken, setGistToken] = useLocalStorage('rendermd_gist_token', '')
  const [gistSyncStatus, setGistSyncStatus] = useState('idle') // 'idle' | 'syncing' | 'done' | 'error'
  const [showGistSettings, setShowGistSettings] = useState(false)
  const [gistTokenInput, setGistTokenInput] = useState('')

  // Synchronize theme class with document element
  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  // Find currently active note
  const activeNote = notes.find((note) => note.id === activeNoteId) || (notes.length > 0 ? notes[0] : null)

  // Ensure activeNoteId aligns with a real note, or fallback
  useEffect(() => {
    if (notes.length > 0 && !notes.some(n => n.id === activeNoteId)) {
      setActiveNoteId(notes[0].id)
    } else if (notes.length === 0) {
      setActiveNoteId(null)
    }
  }, [notes, activeNoteId, setActiveNoteId])

  const handleSelectNote = (id) => {
    setActiveNoteId(id)
    // When switching notes, reset view tabs to editor by default
    setMobileTab('edit')
    setEditorTab('edit')
  }

  const triggerNamingModal = () => {
    setIsNamingModalOpen(true)
  }

  const handleCreateNote = (name) => {
    const cleanName = name.trim().replace(/\.md$/i, '')
    const finalTitle = cleanName || 'Untitled'

    const id = Math.random().toString(36).substring(2, 10)
    const newNote = {
      id,
      title: finalTitle,
      content: '',
      updatedAt: Date.now(),
      order: Date.now(),
      tags: [],
      pinned: false,
    }
    setNotes((prevNotes) => [newNote, ...prevNotes])
    setActiveNoteId(id)
    setIsNamingModalOpen(false)
    setMobileTab('edit')
    setEditorTab('edit')
    toast(`Created "${finalTitle}"`, 'success')
  }

  const handleUpdateNote = (id, updates) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) => {
        if (note.id === id) {
          return {
            ...note,
            ...updates,
            updatedAt: Date.now()
          }
        }
        return note
      })
    )
  }

  const handleRenameNote = (id, newName) => {
    const cleanName = newName.trim().replace(/\.md$/i, '')
    const finalTitle = cleanName || 'Untitled'

    setNotes((prevNotes) =>
      prevNotes.map((note) => {
        if (note.id === id) {
          return {
            ...note,
            title: finalTitle,
            updatedAt: Date.now()
          }
        }
        return note
      })
    )
    setRenameNoteId(null)
    toast(`Renamed to "${finalTitle}"`, 'success')
  }

  // Feature #14: Duplicate note
  const handleDuplicateNote = (id) => {
    const source = notes.find(n => n.id === id)
    if (!source) return
    const newId = Math.random().toString(36).substring(2, 10)
    const copy = {
      ...source,
      id: newId,
      title: `${source.title} (Copy)`,
      updatedAt: Date.now(),
      order: Date.now(),
      tags: [...(source.tags || [])],
      pinned: false,
    }
    setNotes((prev) => [copy, ...prev])
    setActiveNoteId(newId)
    toast(`Duplicated "${source.title}"`, 'success')
  }

  // Feature #11: Import .md files
  const handleImportMarkdown = (title, content) => {
    const id = Math.random().toString(36).substring(2, 10)
    const newNote = { id, title, content, updatedAt: Date.now(), order: Date.now(), tags: [], pinned: false }
    setNotes((prev) => [newNote, ...prev])
    setActiveNoteId(id)
    toast(`Imported "${title}"`, 'success')
  }

  const handleCreateFromTemplate = (name, content) => {
    const cleanName = name.trim()
    const id = Math.random().toString(36).substring(2, 10)
    const newNote = {
      id,
      title: cleanName,
      content,
      updatedAt: Date.now(),
      order: Date.now(),
      tags: [],
      pinned: false,
    }
    setNotes((prev) => [newNote, ...prev])
    setActiveNoteId(id)
    setIsTemplatesOpen(false)
    setMobileTab('edit')
    setEditorTab('edit')
    toast(`Created "${cleanName}" from template`, 'success')
  }

  const handleTogglePin = (id) => {
    setNotes((prev) => prev.map(n =>
      n.id === id ? { ...n, pinned: !n.pinned } : n
    ))
  }

  const handleExportAllNotes = () => {
    if (notes.length === 0) {
      toast('No notes to export', 'info')
      return
    }
    setIsExportModalOpen(true)
  }

  // Feature #18: set word goal on active note — stored separately, does not bump updatedAt
  const handleSetWordGoal = (goal) => {
    if (!activeNote) return
    setNotes((prev) => prev.map(n =>
      n.id === activeNote.id ? { ...n, wordGoal: goal } : n
    ))
  }

  // Feature #21: GitHub Gist sync
  const handleGistSync = async () => {
    if (!gistToken || notes.length === 0) return
    setGistSyncStatus('syncing')
    try {
      // Build files object: one file per note (deduplicate filenames)
      const files = {}
      const usedFilenames = new Set()
      notes.forEach(note => {
        let base = (note.title || '').replace(/[^a-zA-Z0-9._-]/g, '_') || 'untitled'
        let filename = `${base}.md`
        let counter = 1
        while (usedFilenames.has(filename)) {
          filename = `${base}_${counter}.md`
          counter++
        }
        usedFilenames.add(filename)
        files[filename] = { content: note.content || ' ' }
      })
      // Check if we have an existing gist ID stored
      const existingGistId = localStorage.getItem('rendermd_gist_id')
      let response
      if (existingGistId) {
        response = await fetch(`https://api.github.com/gists/${existingGistId}`, {
          method: 'PATCH',
          headers: { Authorization: `token ${gistToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: 'RenderMD Notes', files })
        })
      } else {
        response = await fetch('https://api.github.com/gists', {
          method: 'POST',
          headers: { Authorization: `token ${gistToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: 'RenderMD Notes', public: false, files })
        })
      }
      if (!response.ok) throw new Error(`GitHub API error: ${response.status}`)
      const data = await response.json()
      localStorage.setItem('rendermd_gist_id', data.id)
      setGistSyncStatus('done')
      toast('Notes synced to GitHub Gist', 'success')
      setTimeout(() => setGistSyncStatus('idle'), 3000)
    } catch (err) {
      console.error('Gist sync failed:', err)
      setGistSyncStatus('error')
      toast('Gist sync failed', 'error')
      setTimeout(() => setGistSyncStatus('idle'), 4000)
    }
  }

  const handleDeleteNote = (id) => {
    // Fix #7: clean up version history snapshots for deleted note
    clearSnapshots(id)
    const remainingNotes = notes.filter((note) => note.id !== id)
    setNotes(remainingNotes)
    if (activeNoteId === id) {
      setActiveNoteId(remainingNotes.length > 0 ? remainingNotes[0].id : null)
    }
    toast('Note deleted', 'info')
  }

  const handleExportMarkdown = () => {
    if (!activeNote) return

    const blob = new Blob([activeNote.content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    link.href = url
    // Ensure filename ends with .md
    const filename = activeNote.title.trim().endsWith('.md')
      ? activeNote.title.trim()
      : `${activeNote.title.trim() || 'untitled'}.md`
      
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast('Exported as Markdown', 'success')
  }

  const previewContentRef = useRef(null)
  const setPreviewContentRef = useCallback((el) => { previewContentRef.current = el }, [])

  const handleExportHTML = () => {
    if (!activeNote) return
    const previewEl = previewContentRef.current?.querySelector('article')
    if (!previewEl) {
      toast('Switch to a layout that shows the Preview pane first', 'info')
      return
    }
    exportToHTML(activeNote.title, previewEl)
    toast('Exported as HTML', 'success')
  }


  // Drag-and-drop reorder: receives note IDs in new display order
  const handleReorderNotes = useCallback((reorderedIds) => {
    setNotes(prev => {
      const map = Object.fromEntries(prev.map(n => [n.id, n]))
      const now = Date.now()
      return reorderedIds.map((id, index) => ({
        ...map[id],
        order: now - index,
      }))
    })
  }, [setNotes])

  // Mobile layouts that are valid — anything else gets corrected to sidebar_tabs
  const MOBILE_VALID_LAYOUTS = ['sidebar_tabs', 'editor_only', 'preview_only']

  // Auto-correct layout on mobile: if current layout is desktop-only, switch to sidebar_tabs
  useEffect(() => {
    const isMobileScreen = window.innerWidth < 1024
    if (isMobileScreen && !MOBILE_VALID_LAYOUTS.includes(layout)) {
      setLayout('sidebar_tabs')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally runs once on mount only

  const isZenLayout = layout === 'zen' || layout === 'zen_split' || layout === 'zen_editor' || layout === 'zen_preview'
  const hasSidebar = !isZenLayout
  const isSplitLayout = layout === 'default' || layout === 'split_sidebar' || layout === 'zen_split'
  const isTabbedLayout = layout === 'sidebar_tabs' || layout === 'tabs_sidebar' || layout === 'zen'
  const isEditorOnlyLayout = layout === 'editor_only' || layout === 'zen_editor'
  const isPreviewOnlyLayout = layout === 'preview_only' || layout === 'zen_preview'
  const isSidebarRight = layout === 'tabs_sidebar' || layout === 'split_sidebar'

  // Which pane(s) are visible on desktop
  const showEditorDesktop = !isPreviewOnlyLayout && (!isTabbedLayout || editorTab === 'edit')
  const showPreviewDesktop = !isEditorOnlyLayout && (!isTabbedLayout || editorTab === 'preview')

  // Which pane is visible on mobile (single pane at a time for split layouts)
  const showEditorMobile = isSplitLayout ? mobileTab === 'edit' : showEditorDesktop
  const showPreviewMobile = isSplitLayout ? mobileTab === 'preview' : showPreviewDesktop

  const layoutSelectorSidebar = (
    <LayoutSelector layout={layout} onChangeLayout={setLayout} variant="sidebar" />
  )

  const layoutSelectorElement = isZenLayout ? (
    <LayoutSelector layout={layout} onChangeLayout={setLayout} variant="header" />
  ) : null

  const sidebarProps = {
    notes, activeNoteId,
    onSelectNote: handleSelectNote,
    onCreateNote: triggerNamingModal,
    onDeleteNote: handleDeleteNote,
    onDuplicateNote: handleDuplicateNote,
    theme, onToggleTheme: toggleTheme,
    onRenameNote: (id, title) => { setRenameNoteId(id); setRenameTitle((title || '').replace(/\.md$/i, '')) },
    isSidebarOpen,
    layoutSelector: layoutSelectorSidebar,
    onOpenCheatsheet: () => setIsCheatsheetOpen(true),
    onOpenSettings: () => setShowGistSettings(true),
    layout,
    onReorderNotes: handleReorderNotes,
    onToggleSidebar: () => setIsSidebarOpen(prev => !prev),
    onImportMarkdown: handleImportMarkdown,
    onTogglePin: handleTogglePin,
    onOpenTemplates: () => setIsTemplatesOpen(true),
    onOpenShortcuts: () => setIsShortcutsOpen(true),
    onOpenSearch: () => setIsSearchOpen(true),
    onExportAll: handleExportAllNotes,
    tagFilter, onSetTagFilter: setTagFilter,
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased">

      {/* Sidebar — left position (all layouts except right-sidebar and zen) */}
      {hasSidebar && !isSidebarRight && <Sidebar {...sidebarProps} />}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">

        {/* ── Mobile top bar (< lg) ── always visible ── */}
        <div className="lg:hidden shrink-0 h-12 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center select-none gap-1">

          {/* Sidebar toggle — only when a sidebar exists */}
          {hasSidebar ? (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(v => !v)}
              aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              className="h-full px-3 flex items-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <rect x="1" y="3" width="16" height="1.5" rx="0.75" fill="currentColor"/>
                <rect x="1" y="8.25" width="16" height="1.5" rx="0.75" fill="currentColor"/>
                <rect x="1" y="13.5" width="16" height="1.5" rx="0.75" fill="currentColor"/>
              </svg>
            </button>
          ) : (
            <div className="w-3" />
          )}

          {/* Note title */}
          <span className="flex-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate min-w-0 px-1">
            {activeNote ? (activeNote.title || '').replace(/\.md$/i, '') || 'Untitled' : 'RenderMD'}
          </span>

          {/* Edit/Preview toggle for split layouts */}
          {activeNote && isSplitLayout && (
            <div className="flex shrink-0 mr-3">
              <button type="button" onClick={() => setMobileTab('edit')}
                className={`px-3 h-8 text-xs font-medium rounded-l-md border transition-colors cursor-pointer ${mobileTab === 'edit' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100' : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'}`}
              >Edit</button>
              <button type="button" onClick={() => setMobileTab('preview')}
                className={`px-3 h-8 text-xs font-medium rounded-r-md border-t border-r border-b transition-colors cursor-pointer ${mobileTab === 'preview' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100' : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'}`}
              >Preview</button>
            </div>
          )}

          {/* Write/Preview toggle for tabbed layouts */}
          {activeNote && isTabbedLayout && (
            <div className="flex shrink-0 mr-3">
              <button type="button" onClick={() => setEditorTab('edit')}
                className={`px-3 h-8 text-xs font-medium rounded-l-md border transition-colors cursor-pointer ${editorTab === 'edit' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100' : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'}`}
              >Write</button>
              <button type="button" onClick={() => setEditorTab('preview')}
                className={`px-3 h-8 text-xs font-medium rounded-r-md border-t border-r border-b transition-colors cursor-pointer ${editorTab === 'preview' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100' : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'}`}
              >Preview</button>
            </div>
          )}
        </div>

        {/* ── Pane container ── */}
        <div className="flex-1 flex min-w-0 h-full overflow-hidden bg-white dark:bg-zinc-950">

          {/* Editor pane */}
          {showEditorDesktop && (
            <div className={`h-full min-w-0 ${
              isSplitLayout
                ? showEditorMobile ? 'flex flex-1' : 'hidden lg:flex lg:flex-1'
                : 'flex flex-1'
            }`}>
              <Editor
                note={activeNote}
                onUpdateNote={handleUpdateNote}
                onExportMarkdown={handleExportMarkdown}
                onExportHTML={handleExportHTML}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
                layout={layout}
                editorTab={editorTab}
                onChangeEditorTab={setEditorTab}
                layoutSelector={layoutSelectorElement}
                editorFontSize={editorFontSize}
                editorFontFamily={editorFontFamily}
                theme={theme}
                isFocusMode={isFocusMode}
                onToggleFocusMode={() => setIsFocusMode(v => !v)}
                wordGoal={activeNote?.wordGoal || 0}
                vimMode={vimMode}
                charLimit={charLimit}
                isCheatsheetOpen={isCheatsheetOpen}
                onCloseCheatsheet={() => setIsCheatsheetOpen(false)}
              />
            </div>
          )}

          {/* Preview pane */}
          {showPreviewDesktop && (
            <div className={`h-full min-w-0 ${
              isSplitLayout
                ? showPreviewMobile ? 'flex flex-1' : 'hidden lg:flex lg:flex-1'
                : 'flex flex-1'
            }`}>
              <Preview
                title={activeNote ? activeNote.title : ''}
                content={activeNote ? activeNote.content : ''}
                layout={layout}
                editorTab={editorTab}
                onChangeEditorTab={setEditorTab}
                layoutSelector={layoutSelectorElement}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
                hasNote={activeNote !== null}
                onExportMarkdown={handleExportMarkdown}
                previewRef={setPreviewContentRef}
                isEditorVisible={
                  showEditorDesktop &&
                  (!isSplitLayout || mobileTab === 'edit')
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Sidebar — right position */}
      {hasSidebar && isSidebarRight && <Sidebar {...sidebarProps} />}

      {/* Feature #15: localStorage quota warning toast */}
      {showQuotaWarning && (
        <div
          role="alert"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-red-600 text-white text-sm font-medium px-4 py-3 rounded-lg shadow-lg max-w-sm w-[90vw]"
        >
          <span className="flex-1">⚠️ Storage full — export your notes to avoid losing data.</span>
          <button
            type="button"
            onClick={() => { handleExportMarkdown(); setShowQuotaWarning(false) }}
            className="underline underline-offset-2 cursor-pointer shrink-0 hover:opacity-80"
          >Export</button>
          <button
            type="button"
            onClick={() => setShowQuotaWarning(false)}
            aria-label="Dismiss warning"
            className="ml-1 opacity-70 hover:opacity-100 cursor-pointer shrink-0"
          >✕</button>
        </div>
      )}

      <ExportNotesDialog
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
        notes={notes}
        onToast={toast}
      />

      <CreateNoteDialog
        open={isNamingModalOpen}
        onOpenChange={setIsNamingModalOpen}
        onCreateNote={handleCreateNote}
      />

      <RenameNoteDialog
        noteId={renameNoteId}
        currentTitle={renameTitle}
        onOpenChange={(id) => { setRenameNoteId(id); if (id === null) setRenameTitle('') }}
        onRename={handleRenameNote}
      />



      {/* Settings Dialog — Font size, char limit, word goal, vim, preview theme, gist sync */}
      <Dialog open={showGistSettings} onOpenChange={(open) => { if (!open) setGistTokenInput(''); setShowGistSettings(open) }}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-zinc-900 dark:text-white">Settings</DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400">
              Editor preferences, writing goals, and cloud sync.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Feature #16: Font size */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Editor Font Size: <span className="font-mono text-zinc-500">{editorFontSize}px</span>
              </label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setEditorFontSize(s => Math.max(10, s - 1))}
                  className="w-7 h-7 rounded border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-zinc-600 dark:text-zinc-400">−</button>
                <input type="range" min={10} max={24} value={editorFontSize}
                  onChange={e => setEditorFontSize(Number(e.target.value))}
                  className="flex-1 accent-zinc-700 dark:accent-zinc-300 cursor-pointer" />
                <button type="button" onClick={() => setEditorFontSize(s => Math.min(24, s + 1))}
                  className="w-7 h-7 rounded border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-zinc-600 dark:text-zinc-400">+</button>
              </div>
            </div>

            {/* Theme Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Theme
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['light', 'dark'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    className={`px-3 py-1.5 rounded border text-xs font-medium capitalize cursor-pointer transition-colors ${
                      theme === t
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Editor Font Family
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'monospace', name: 'Monospace' },
                  { id: 'sans-serif', name: 'Sans-Serif' },
                  { id: 'serif', name: 'Serif' }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setEditorFontFamily(f.id)}
                    className={`px-3 py-1.5 rounded border text-xs font-medium cursor-pointer transition-colors ${
                      editorFontFamily === f.id
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Feature #5: Char limit */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Character Limit <span className="font-normal text-zinc-400">(0 = disabled)</span>
              </label>
              <input type="number" min={0} max={100000} value={charLimit}
                onChange={e => setCharLimit(Math.max(0, Number(e.target.value)))}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-1.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400" />
            </div>

            {/* Feature #18: Word goal for active note */}
            {activeNote && (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Word Goal for "{activeNote.title}" <span className="font-normal text-zinc-400">(0 = disabled)</span>
                </label>
                <input type="number" min={0} max={100000} value={activeNote.wordGoal || 0}
                  onChange={e => handleSetWordGoal(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-1.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400" />
              </div>
            )}

            {/* Feature #22: Vim mode */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Vim Keybindings</label>
              <button type="button" onClick={() => setVimMode(v => !v)}
                role="switch" aria-checked={vimMode}
                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${vimMode ? 'bg-zinc-800 dark:bg-zinc-200' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white dark:bg-zinc-900 transition-transform ${vimMode ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Feature #21: GitHub Gist sync */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                GitHub Gist Sync
              </label>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-2">
                Paste a GitHub personal access token with <code className="font-mono">gist</code> scope to sync notes to a private Gist.
              </p>
              <div className="flex gap-2">
                <input type="password" value={gistTokenInput || gistToken}
                  onChange={e => setGistTokenInput(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono" />
                <Button type="button" variant="outline" onClick={() => { if (gistTokenInput) { setGistToken(gistTokenInput); setGistTokenInput('') } }}
                  className="text-xs px-3 h-8 cursor-pointer border-zinc-200 dark:border-zinc-700">Save</Button>
              </div>
              {gistToken && (
                <Button type="button" onClick={handleGistSync} disabled={gistSyncStatus === 'syncing'}
                  className="mt-2 w-full text-xs h-8 cursor-pointer bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50">
                  {gistSyncStatus === 'syncing' ? 'Syncing...' : gistSyncStatus === 'done' ? '✓ Synced!' : gistSyncStatus === 'error' ? '✗ Sync failed' : 'Sync to Gist'}
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" onClick={() => setShowGistSettings(false)}
              className="bg-zinc-900 text-zinc-100 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer text-xs px-4 h-8">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <KeyboardShortcutsDialog
        open={isShortcutsOpen}
        onOpenChange={setIsShortcutsOpen}
      />

      <SearchNotesDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        notes={notes}
        onSelectNote={handleSelectNote}
      />

      <TemplatesDialog
        open={isTemplatesOpen}
        onOpenChange={setIsTemplatesOpen}
        onCreateFromTemplate={handleCreateFromTemplate}
      />
    </div>
  )
}

