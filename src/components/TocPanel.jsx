// Feature #24: Table of Contents Panel — works with CodeMirror via cmRef
import { useMemo } from 'react'
import { List, X } from 'lucide-react'

function extractHeadings(content) {
  if (!content) return []
  const lines = content.split('\n')
  const headings = []
  let charPos = 0
  lines.forEach((line, i) => {
    const match = line.match(/^(#{1,6})\s+(.+)/)
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        lineIndex: i,
        charPos,
      })
    }
    charPos += line.length + 1 // +1 for the newline (\n); CodeMirror normalizes \r\n internally
  })
  return headings
}

export function TocPanel({ content, cmRef, onClose }) {
  const headings = useMemo(() => extractHeadings(content), [content])

  const scrollToHeading = (charPos) => {
    const view = cmRef?.current?.view
    if (!view) return
    // Move cursor to the heading line and scroll it into view
    view.dispatch({
      selection: { anchor: charPos, head: charPos },
      scrollIntoView: true,
    })
    view.focus()
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 w-64 shrink-0">
      {/* Header */}
      <div className="h-10 px-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
          <List className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Contents</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close table of contents"
          className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Heading list */}
      <div className="flex-1 overflow-y-auto py-1.5">
        {headings.length === 0 ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 px-3 py-4 text-center select-none">
            No headings found.
          </p>
        ) : (
          headings.map((h, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToHeading(h.charPos)}
              title={h.text}
              className="w-full text-left py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer truncate focus-visible:outline-2 focus-visible:outline-zinc-400 focus-visible:outline-offset-[-2px]"
              style={{ paddingLeft: `${(h.level - 1) * 10 + 12}px`, paddingRight: '12px' }}
            >
              <span className="text-zinc-300 dark:text-zinc-600 mr-1 font-mono text-[10px]">
                {'#'.repeat(h.level)}
              </span>
              {h.text}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
