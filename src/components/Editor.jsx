import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import {
  Download, Type, FileSpreadsheet, Clock, NotebookPen, FileCode,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  Save, List, History, Maximize2, Minimize2, Tag, X,
} from 'lucide-react'
import { Button } from './ui/button'
import { FindReplace } from './FindReplace'
import { TocPanel } from './TocPanel'
import { VersionHistoryPanel } from './VersionHistoryPanel'
import { useVersionHistory } from '../hooks/useVersionHistory'
import CodeMirror from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { vim } from '@replit/codemirror-vim'
import { EditorView, keymap } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'

import { getWordCount } from '../lib/utils'
import { useDarkMode } from '../lib/utils'

function getReadingTime(text) {
  const words = getWordCount(text)
  if (words === 0) return '< 1 min read'
  const wpm = 200
  return `${Math.ceil(words / wpm)} min read`
}

// Feature #7: Formatting shortcuts via CodeMirror keymap
// Defined outside the component so references are stable across renders
function wrapSelection(view, before, after = before) {
  const { state, dispatch } = view
  const changes = state.changeByRange(range => {
    const selected = state.sliceDoc(range.from, range.to)
    const newText = before + selected + after
    return {
      changes: { from: range.from, to: range.to, insert: newText },
      range: { anchor: range.from, head: range.from + newText.length },
    }
  })
  dispatch(state.update(changes))
  return true
}

const formattingKeymap = keymap.of([
  { key: 'Mod-b', run: (v) => wrapSelection(v, '**') },
  { key: 'Mod-i', run: (v) => wrapSelection(v, '*') },
  { key: 'Mod-`', run: (v) => wrapSelection(v, '`') },
  { key: 'Mod-k', run: (v) => wrapSelection(v, '[', '](url)') },
  { key: 'Mod-Shift-k', run: (v) => wrapSelection(v, '```\n', '\n```') },
])

// Feature #4: Autosave indicator
function useAutosaveIndicator(content) {
  const [saveState, setSaveState] = useState('saved')
  const timerRef = useRef(null)
  const prevRef = useRef(content)

  useEffect(() => {
    if (content !== prevRef.current) {
      prevRef.current = content
      setSaveState('saving')
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setSaveState('saved'), 1200)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [content])

  return saveState
}

export function Editor({
  note, onUpdateNote, onExportMarkdown, onExportHTML,
  isSidebarOpen, onToggleSidebar, layout, editorTab, onChangeEditorTab, layoutSelector,
  editorFontSize,
  editorFontFamily = 'monospace',
  theme = 'dark',
  isFocusMode, onToggleFocusMode,
  wordGoal,
  vimMode,
  charLimit,
}) {
  const isLeftSidebarLayout = layout === 'default' || layout === 'sidebar_tabs' || layout === 'editor_only' || layout === 'preview_only'
  const isRightSidebarLayout = layout === 'tabs_sidebar' || layout === 'split_sidebar'

  // CodeMirror instance ref — used by FindReplace and TocPanel
  const cmRef = useRef(null)

  const [showFindReplace, setShowFindReplace] = useState(false)
  const [showToc, setShowToc] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  
  const [newTagInput, setNewTagInput] = useState('')

  const handleRemoveTag = useCallback((tagToRemove) => {
    if (!note) return
    const updatedTags = (note.tags || []).filter(t => t !== tagToRemove)
    onUpdateNote(note.id, { tags: updatedTags })
  }, [note, onUpdateNote])

  const handleTagInputKeyDown = useCallback((e) => {
    if (!note) return
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const cleanTag = newTagInput.trim().toLowerCase().replace(/[^a-z0-9_#-]/g, '')
      if (cleanTag && !(note.tags || []).includes(cleanTag)) {
        const updatedTags = [...(note.tags || []), cleanTag]
        onUpdateNote(note.id, { tags: updatedTags })
      }
      setNewTagInput('')
    } else if (e.key === 'Backspace' && !newTagInput && (note.tags || []).length > 0) {
      e.preventDefault()
      const updatedTags = [...(note.tags || [])]
      updatedTags.pop()
      onUpdateNote(note.id, { tags: updatedTags })
    }
  }, [note, newTagInput, onUpdateNote])
  const { getSnapshots, saveSnapshot } = useVersionHistory(note?.id, note?.content)

  const saveState = useAutosaveIndicator(note?.content ?? '')

  const isDark = useDarkMode()

  // Feature #6: Ctrl+F opens Find & Replace
  useEffect(() => {
    const handler = (e) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const ctrl = isMac ? e.metaKey : e.ctrlKey
      if (ctrl && e.key === 'f') {
        e.preventDefault()
        setShowFindReplace(v => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // CodeMirror onChange — guard against note being null during unmount
  const handleCMChange = useCallback((val) => {
    if (!note?.id) return
    onUpdateNote(note.id, { content: val })
  }, [note?.id, onUpdateNote])




  // Feature #25: restore snapshot
  const handleRestoreSnapshot = (content) => {
    if (!note) return
    saveSnapshot(note.id, note.content)
    onUpdateNote(note.id, { content })
    setShowHistory(false)
  }

  // ─── Writing-focused CodeMirror themes ──────────────────────────────────
  // Philosophy: this is a writing tool, not a code editor.
  // Markdown punctuation (##, **, -, >) should fade out so the writer
  // focuses on words. Headings stand out by weight/size, not color.
  // oneDark is NOT used — it's too noisy for prose writing.
  //
  // zinc-950=#09090b  zinc-900=#18181b  zinc-800=#27272a  zinc-700=#3f3f46
  // zinc-600=#52525b  zinc-500=#71717a  zinc-400=#a1a1aa  zinc-300=#d4d4d8
  // zinc-200=#e4e4e7  zinc-100=#f4f4f5  zinc-50=#fafafa

  const darkEditorTheme = useMemo(() => EditorView.theme({
    // Base
    '&': { backgroundColor: '#09090b', color: '#d4d4d8', height: '100%' },
    '.cm-scroller': { overflow: 'auto' },
    '.cm-content': { caretColor: '#71717a', padding: '1.5rem 0' },
    '.cm-line': { padding: '0 1.5rem' },
    // Gutter — same bg as editor, very muted line numbers
    '.cm-gutters': {
      backgroundColor: '#09090b',
      borderRight: '1px solid #1c1c1f',
      color: '#27272a',
      paddingRight: '4px',
      minWidth: '2.8rem',
      userSelect: 'none',
    },
    '.cm-lineNumbers .cm-gutterElement': { minWidth: '2.4rem', textAlign: 'right' },
    // Active line — barely visible, just a hint
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: '#3f3f46' },
    '.cm-activeLine': { backgroundColor: '#111113' },
    // Selection — semi-transparent so text remains readable underneath
    '.cm-selectionBackground': { backgroundColor: 'rgba(113,113,122,0.4)' },
    '&.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(113,113,122,0.4)' },
    '.cm-content ::selection': { backgroundColor: 'transparent' },
    // Cursor — bright white, 2px wide
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#ffffff', borderLeftWidth: '2px' },
    '&.cm-focused': { outline: 'none' },
    '.cm-placeholder': { color: '#3f3f46' },
    // Markdown-specific: mute all syntax punctuation
    '.tok-heading': { color: '#f4f4f5', fontWeight: '600' },
    '.tok-heading1': { color: '#ffffff', fontWeight: '700', fontSize: '1.05em' },
    '.tok-heading2': { color: '#f4f4f5', fontWeight: '600' },
    '.tok-heading3': { color: '#e4e4e7', fontWeight: '600' },
    '.tok-strong': { color: '#e4e4e7', fontWeight: '700' },
    '.tok-emphasis': { color: '#d4d4d8', fontStyle: 'italic' },
    '.tok-strikethrough': { color: '#52525b', textDecoration: 'line-through' },
    '.tok-link': { color: '#a1a1aa', textDecoration: 'underline' },
    '.tok-url': { color: '#71717a' },
    '.tok-quote': { color: '#71717a', fontStyle: 'italic' },
    // Punctuation fades out — the key to a clean writing experience
    '.tok-punctuation': { color: '#27272a' },
    '.tok-processingInstruction': { color: '#27272a' },
    '.tok-meta': { color: '#27272a' },
    // Inline code — subtle green tint
    '.tok-monospace': { color: '#86efac' },
    // Code block content — slightly muted
    '.tok-string': { color: '#a1a1aa' },
    '.tok-keyword': { color: '#a1a1aa' },
    '.tok-comment': { color: '#3f3f46', fontStyle: 'italic' },
    '.tok-number': { color: '#a1a1aa' },
    '.tok-operator': { color: '#71717a' },
    '.tok-variableName': { color: '#d4d4d8' },
    '.tok-typeName': { color: '#a1a1aa' },
    '.tok-propertyName': { color: '#d4d4d8' },
    '.tok-invalid': { color: '#fca5a5' },
  }, { dark: true }), [])

  const lightEditorTheme = useMemo(() => EditorView.theme({
    // Base
    '&': { backgroundColor: '#ffffff', color: '#3f3f46', height: '100%' },
    '.cm-scroller': { overflow: 'auto' },
    '.cm-content': { caretColor: '#a1a1aa', padding: '1.5rem 0' },
    '.cm-line': { padding: '0 1.5rem' },
    // Gutter
    '.cm-gutters': {
      backgroundColor: '#ffffff',
      borderRight: '1px solid #f4f4f5',
      color: '#e4e4e7',
      paddingRight: '4px',
      minWidth: '2.8rem',
      userSelect: 'none',
    },
    '.cm-lineNumbers .cm-gutterElement': { minWidth: '2.4rem', textAlign: 'right' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: '#d4d4d8' },
    '.cm-activeLine': { backgroundColor: '#fafafa' },
    // Selection — semi-transparent so text remains readable underneath
    '.cm-selectionBackground': { backgroundColor: 'rgba(161,161,170,0.3)' },
    '&.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(161,161,170,0.3)' },
    '.cm-content ::selection': { backgroundColor: 'transparent' },
    // Cursor — near black, 2px wide
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#09090b', borderLeftWidth: '2px' },
    '&.cm-focused': { outline: 'none' },
    '.cm-placeholder': { color: '#a1a1aa' },
    // Headings — darker/bolder, not colored
    '.tok-heading': { color: '#09090b', fontWeight: '600' },
    '.tok-heading1': { color: '#09090b', fontWeight: '700', fontSize: '1.05em' },
    '.tok-heading2': { color: '#18181b', fontWeight: '600' },
    '.tok-heading3': { color: '#27272a', fontWeight: '600' },
    '.tok-strong': { color: '#18181b', fontWeight: '700' },
    '.tok-emphasis': { color: '#3f3f46', fontStyle: 'italic' },
    '.tok-strikethrough': { color: '#a1a1aa', textDecoration: 'line-through' },
    '.tok-link': { color: '#71717a', textDecoration: 'underline' },
    '.tok-url': { color: '#a1a1aa' },
    '.tok-quote': { color: '#a1a1aa', fontStyle: 'italic' },
    // Punctuation fades out
    '.tok-punctuation': { color: '#e4e4e7' },
    '.tok-processingInstruction': { color: '#e4e4e7' },
    '.tok-meta': { color: '#e4e4e7' },
    // Inline code
    '.tok-monospace': { color: '#16a34a' },
    // Code block content
    '.tok-string': { color: '#71717a' },
    '.tok-keyword': { color: '#71717a' },
    '.tok-comment': { color: '#d4d4d8', fontStyle: 'italic' },
    '.tok-number': { color: '#71717a' },
    '.tok-operator': { color: '#a1a1aa' },
    '.tok-variableName': { color: '#3f3f46' },
    '.tok-typeName': { color: '#71717a' },
    '.tok-propertyName': { color: '#3f3f46' },
    '.tok-invalid': { color: '#dc2626' },
  }), [])


  // Build placeholder as a DOM element so line breaks render correctly
  const placeholderEl = useMemo(() => {
    const el = document.createElement('div')
    el.style.pointerEvents = 'none'
    el.innerHTML = '# New Note<br><br>Start typing your markdown here...'
    return el
  }, [])

  const getFontFamilyStack = (fontFamilyId) => {
    switch (fontFamilyId) {
      case 'sans-serif':
        return 'Inter, system-ui, -apple-system, sans-serif'
      case 'serif':
        return 'Lora, Georgia, Cambria, "Times New Roman", Times, serif'
      case 'monospace':
      default:
        return 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'
    }
  }

  const cmExtensions = useMemo(() => [
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    EditorView.lineWrapping,
    // Font size & Font family applied dynamically inside CodeMirror
    EditorView.theme({
      '&': { fontSize: `${editorFontSize || 14}px` },
      '.cm-scroller': {
        fontFamily: getFontFamilyStack(editorFontFamily) + ' !important',
      },
    }),
    formattingKeymap,
    keymap.of([indentWithTab]),
    ...(vimMode ? [vim()] : []),
  ], [editorFontSize, editorFontFamily, vimMode])

  if (!note) {
    return (
      <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500">
        <div className="hidden lg:flex h-16 px-4 border-b border-zinc-200 dark:border-zinc-800 items-center justify-between shrink-0 bg-white dark:bg-zinc-950">
          {isLeftSidebarLayout && (
            <Button variant="ghost" size="icon" onClick={onToggleSidebar}
              aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              className="w-8 h-8 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 shrink-0 cursor-pointer">
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </Button>
          )}
          {!isLeftSidebarLayout && <div />}
          <div className="flex items-center gap-2">
            {layoutSelector}
            {isRightSidebarLayout && (
              <Button variant="ghost" size="icon" onClick={onToggleSidebar}
                aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                className="w-8 h-8 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 shrink-0 cursor-pointer">
                {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
          <NotebookPen className="w-10 h-10 mb-4 stroke-[1.5] text-zinc-300 dark:text-zinc-600" />
          <h3 className="text-zinc-800 dark:text-zinc-300 font-semibold text-base mb-1">No Active Document</h3>
          <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
            Select an existing note from the sidebar or click "New Note" to start writing.
          </p>
        </div>
      </div>
    )
  }

  const charCount = note.content ? note.content.length : 0
  const wordCount = getWordCount(note.content)
  const readingTime = getReadingTime(note.content)

  const limitWarning = charLimit > 0 && charCount > 0
    ? charCount >= charLimit ? 'over'
    : charCount >= charLimit * 0.9 ? 'near'
    : null
    : null

  const goalProgress = wordGoal > 0
    ? Math.min(100, Math.round((wordCount / wordGoal) * 100))
    : null

  return (
    <section className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200">

      {/* Header — hidden in focus mode AND on mobile (mobile top bar handles it) */}
      {!isFocusMode && (
        <div className="hidden lg:flex h-16 px-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 items-center justify-between shrink-0 gap-2">
          <div className="flex items-center min-w-0 gap-2 flex-1">
            {isLeftSidebarLayout && (
              <Button variant="ghost" size="icon" onClick={onToggleSidebar}
                aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                className="w-8 h-8 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 shrink-0 cursor-pointer">
                {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </Button>
            )}
            <h2 className="text-zinc-900 dark:text-white font-semibold text-base truncate select-none tracking-tight max-w-[140px] md:max-w-xs">
              {(note.title || '').replace(/\.md$/i, '') || 'Untitled'}
            </h2>
            {(layout === 'sidebar_tabs' || layout === 'tabs_sidebar' || layout === 'zen') && (
              <div className="flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg text-xs font-semibold shrink-0 border border-zinc-200 dark:border-zinc-700">
                <button type="button" onClick={() => onChangeEditorTab('edit')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${editorTab === 'edit' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                  Write
                </button>
                <button type="button" onClick={() => onChangeEditorTab('preview')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${editorTab === 'preview' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                  Preview
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {layoutSelector}

            <Button type="button" variant="ghost" size="icon"
              onClick={() => { setShowToc(v => !v); setShowHistory(false) }}
              aria-label="Toggle table of contents" aria-pressed={showToc}
              title="Table of Contents"
              className={`w-8 h-8 rounded-md cursor-pointer transition-colors ${showToc ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
              <List className="w-4 h-4" />
            </Button>

            <Button type="button" variant="ghost" size="icon"
              onClick={() => { setShowHistory(v => !v); setShowToc(false) }}
              aria-label="Toggle version history" aria-pressed={showHistory}
              title="Version History"
              className={`w-8 h-8 rounded-md cursor-pointer transition-colors ${showHistory ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
              <History className="w-4 h-4" />
            </Button>

            <Button type="button" variant="ghost" size="icon"
              onClick={onToggleFocusMode}
              aria-label={isFocusMode ? 'Exit focus mode' : 'Enter focus mode'}
              title={isFocusMode ? 'Exit Focus Mode' : 'Focus Mode'}
              className="w-8 h-8 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors">
              {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            <Button type="button" variant="outline" onClick={onExportMarkdown}
              aria-label="Export note as Markdown" title="Export as Markdown (.md)"
              className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1.5 px-2.5 h-8 rounded-md cursor-pointer text-xs font-medium">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Export</span>
            </Button>

            <Button type="button" variant="outline" onClick={onExportHTML}
              aria-label="Export as HTML" title="Export as HTML"
              className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1.5 px-2.5 h-8 rounded-md cursor-pointer text-xs font-medium">
              <FileCode className="w-3.5 h-3.5" />
              <span className="hidden md:inline">HTML</span>
            </Button>

            {isRightSidebarLayout && (
              <Button variant="ghost" size="icon" onClick={onToggleSidebar}
                aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                className="w-8 h-8 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 shrink-0 cursor-pointer">
                {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Tag Manager Bar — hidden in focus mode */}
      {!isFocusMode && (
        <div className="border-b border-zinc-100 dark:border-zinc-800/60 px-6 py-2 bg-zinc-50/50 dark:bg-zinc-950/40 flex items-center gap-2 overflow-x-auto select-none no-export h-9 shrink-0">
          <Tag className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {(note.tags || []).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  title="Remove tag"
                  className="p-0.5 rounded-full hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer shrink-0"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder="+ Add tag..."
              className="bg-transparent text-[10px] font-mono text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 focus:text-zinc-800 dark:focus:text-zinc-100 focus:outline-none w-20 px-1 py-0.5 transition-colors shrink-0"
            />
          </div>
        </div>
      )}

      {/* Focus mode exit hint */}
      {isFocusMode && (
        <div className="h-8 flex items-center justify-end px-4 shrink-0 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800/50">
          <button type="button" onClick={onToggleFocusMode}
            className="text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer font-mono transition-colors">
            Press Esc or click to exit focus mode
          </button>
        </div>
      )}

      {/* Main content: editor + side panels */}
      <div className="flex-1 flex min-h-0 relative">
        <div className="flex-1 flex flex-col min-w-0 relative">

          {/* Feature #6: Find & Replace overlay */}
          {showFindReplace && (
            <FindReplace
              cmRef={cmRef}
              content={note.content}
              onUpdateContent={(newContent) => onUpdateNote(note.id, { content: newContent })}
              onClose={() => setShowFindReplace(false)}
            />
          )}

          {/* Feature #8: CodeMirror editor */}
          <div className="flex-1 overflow-hidden">
            <CodeMirror
              ref={cmRef}
              value={note.content}
              onChange={handleCMChange}
              extensions={cmExtensions}
              theme={theme === 'dark' ? darkEditorTheme : lightEditorTheme}
              basicSetup={{
                lineNumbers: true,
                foldGutter: false,
                dropCursor: false,
                drawSelection: true,
                allowMultipleSelections: false,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: false,
                autocompletion: false,
                rectangularSelection: false,
                crosshairCursor: false,
                highlightActiveLine: true,
                highlightSelectionMatches: false,
                closeBracketsKeymap: false,
                searchKeymap: false,
                foldKeymap: false,
                completionKeymap: false,
                lintKeymap: false,
              }}
              style={{ height: '100%' }}
              className="h-full overflow-auto"
              placeholder={placeholderEl}
            />
          </div>
        </div>

        {/* Feature #24: TOC side panel */}
        {showToc && (
          <TocPanel
            content={note.content}
            cmRef={cmRef}
            onClose={() => setShowToc(false)}
          />
        )}

        {/* Feature #25: Version History side panel */}
        {showHistory && (
          <VersionHistoryPanel
            noteId={note.id}
            getSnapshots={getSnapshots}
            onRestore={handleRestoreSnapshot}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>

      {/* Status Bar — hidden in focus mode */}
      {!isFocusMode && (
        <div className={`h-9 px-3 lg:px-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 font-mono text-[11px] select-none ${
          limitWarning === 'over' ? 'bg-red-50 dark:bg-red-950/20'
          : limitWarning === 'near' ? 'bg-amber-50 dark:bg-amber-950/20'
          : 'bg-zinc-50 dark:bg-zinc-950'
        }`}>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1 ${
              limitWarning === 'over' ? 'text-red-600 dark:text-red-400 font-semibold'
              : limitWarning === 'near' ? 'text-amber-600 dark:text-amber-400'
              : 'text-zinc-400 dark:text-zinc-600'
            }`}>
              <Type className="w-3 h-3" aria-hidden="true" />
              <span>
                <strong className={limitWarning ? '' : 'text-zinc-700 dark:text-zinc-400'}>{charCount}</strong>
                {charLimit > 0 && <span className="opacity-60">/{charLimit}</span>}
                {' '}chars
              </span>
            </span>

            <span className="flex items-center gap-1 text-zinc-400 dark:text-zinc-600">
              <FileSpreadsheet className="w-3 h-3" aria-hidden="true" />
              <span>
                <strong className="text-zinc-700 dark:text-zinc-400">{wordCount}</strong>
                {wordGoal > 0 && <span className="opacity-60">/{wordGoal}</span>}
                {' '}words
                {goalProgress !== null && goalProgress >= 100 && <span className="ml-1 text-emerald-500">🎉</span>}
              </span>
            </span>

            {goalProgress !== null && goalProgress < 100 && (
              <div className="w-16 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${goalProgress}%` }}
                  role="progressbar"
                  aria-valuenow={goalProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Word goal: ${goalProgress}%`}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {vimMode && (
              <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded font-mono">VIM</span>
            )}
            <span className={`flex items-center gap-1 transition-opacity duration-300 ${saveState === 'saving' ? 'opacity-100 text-zinc-500 dark:text-zinc-400' : 'opacity-60 text-zinc-400 dark:text-zinc-500'}`}>
              <Save className="w-3 h-3" aria-hidden="true" />
              <span>{saveState === 'saving' ? 'Saving...' : 'Saved'}</span>
            </span>
            <span className="flex items-center gap-1 text-zinc-400 dark:text-zinc-600">
              <Clock className="w-3 h-3" aria-hidden="true" />
              <span className="text-zinc-600 dark:text-zinc-400">{readingTime}</span>
            </span>
          </div>
        </div>
      )}
    </section>
  )
}
