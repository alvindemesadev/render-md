// Feature #6: Find & Replace panel — works with CodeMirror via cmRef
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'

export function FindReplace({ cmRef, content, onUpdateContent, onClose }) {
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [matchIndex, setMatchIndex] = useState(0)
  const findInputRef = useRef(null)

  useEffect(() => {
    findInputRef.current?.focus()
    findInputRef.current?.select()
  }, [])

  const getMatches = useCallback(() => {
    if (!findText || !content) return []
    const flags = caseSensitive ? 'g' : 'gi'
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)
    const matches = []
    let m
    while ((m = regex.exec(content)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length })
    }
    return matches
  }, [findText, content, caseSensitive])

  const matches = useMemo(() => getMatches(), [getMatches])
  const safeIndex = matches.length > 0 ? matchIndex % matches.length : 0

  // Highlight current match in CodeMirror by setting selection and scrolling into view
  // Only focus the editor when user navigates (not when typing in the find input)
  useEffect(() => {
    const view = cmRef?.current?.view
    if (!view || matches.length === 0) return
    const { start, end } = matches[safeIndex]
    view.dispatch({
      selection: { anchor: start, head: end },
      scrollIntoView: true,
    })
    if (document.activeElement !== findInputRef.current) {
      view.focus()
    }
  }, [safeIndex, matches, findText, caseSensitive, cmRef])

  const goNext = () => setMatchIndex(i => (i + 1) % Math.max(1, matches.length))
  const goPrev = () => setMatchIndex(i => (i - 1 + Math.max(1, matches.length)) % Math.max(1, matches.length))

  const handleReplace = () => {
    if (matches.length === 0) return
    const { start, end } = matches[safeIndex]
    onUpdateContent(content.slice(0, start) + replaceText + content.slice(end))
  }

  const handleReplaceAll = () => {
    if (!findText || matches.length === 0) return
    const flags = caseSensitive ? 'g' : 'gi'
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)
    onUpdateContent(content.replace(regex, replaceText))
    setMatchIndex(0)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'Enter') e.shiftKey ? goPrev() : goNext()
  }

  return (
    <div
      role="search"
      aria-label="Find and replace"
      className="absolute top-0 right-0 z-20 m-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col gap-2 w-80"
    >
      {/* Find row */}
      <div className="flex items-center gap-1.5">
        <input
          ref={findInputRef}
          type="text"
          value={findText}
          onChange={e => { setFindText(e.target.value); setMatchIndex(0) }}
          onKeyDown={handleKeyDown}
          placeholder="Find..."
          aria-label="Find text"
          className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
        />
        <button
          type="button"
          onClick={() => setCaseSensitive(v => !v)}
          title="Case sensitive"
          aria-pressed={caseSensitive}
          className={`px-1.5 py-1 rounded-md text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
            caseSensitive
              ? 'bg-zinc-800 text-white border-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:border-zinc-300'
              : 'bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
          }`}
        >Aa</button>
        <button type="button" onClick={goPrev} aria-label="Previous match"
          className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors focus-visible:outline-2 focus-visible:outline-zinc-400">
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={goNext} aria-label="Next match"
          className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors focus-visible:outline-2 focus-visible:outline-zinc-400">
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={onClose} aria-label="Close find & replace"
          className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Match count */}
      <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono px-0.5">
        {findText
          ? matches.length > 0
            ? `${safeIndex + 1} / ${matches.length} match${matches.length !== 1 ? 'es' : ''}`
            : 'No matches'
          : 'Type to search'}
      </div>

      {/* Replace row */}
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={replaceText}
          onChange={e => setReplaceText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Replace with..."
          aria-label="Replace with"
          className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
        />
        <button
          type="button"
          onClick={handleReplace}
          disabled={matches.length === 0}
          className="px-2 py-1 rounded-md text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 cursor-pointer transition-colors"
        >Replace</button>
        <button
          type="button"
          onClick={handleReplaceAll}
          disabled={matches.length === 0}
          className="px-2 py-1 rounded-md text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 cursor-pointer transition-colors"
        >All</button>
      </div>
    </div>
  )
}
