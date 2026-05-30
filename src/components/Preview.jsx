import { useRef, useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkGemoji from 'remark-gemoji'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import { Download, FileCode, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { Button } from './ui/button'
import { useDarkMode, exportToHTML } from '../lib/utils'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { MermaidDiagram } from './MermaidDiagram'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), 'className'],
    pre:  [...(defaultSchema.attributes?.pre  ?? []), 'className'],
    span: [...(defaultSchema.attributes?.span ?? []), 'className'],
    img:  [...(defaultSchema.attributes?.img  ?? []), 'loading'],
    input: ['type', 'checked', 'disabled', 'readOnly'],
  },
  // Allow SVG elements that Mermaid generates (rendered via dangerouslySetInnerHTML, not through rehype)
  tagNames: [...(defaultSchema.tagNames ?? [])],
}

// GitHub-style preview — fixed theme, respects app dark/light mode
const GITHUB_LINK = 'text-[#0969da] dark:text-[#58a6ff]'
const GITHUB_CODE_BG = 'bg-[rgba(175,184,193,0.2)] dark:bg-[rgba(110,118,129,0.4)]'

export function Preview({
  title, content, layout, editorTab, onChangeEditorTab, layoutSelector,
  isSidebarOpen, onToggleSidebar, hasNote, onExportMarkdown, isEditorVisible,
  previewRef, theme,
}) {
  const previewScrollRef = useRef(null)
  const [debouncedContent, setDebouncedContent] = useState(content)

  const isDark = theme ? theme === 'dark' : useDarkMode()

  const isLeftSidebarLayout = layout === 'default' || layout === 'sidebar_tabs' || layout === 'editor_only' || layout === 'preview_only'

  // Debounce preview rendering by 200ms to prevent blockages during rapid typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedContent(content)
    }, 200)
    return () => clearTimeout(timer)
  }, [content])

  // Feature #12: Export as HTML
  const handleExportHTML = () => {
    if (!debouncedContent) return
    const previewEl = previewScrollRef.current?.querySelector('article')
    if (!previewEl) return
    exportToHTML(title, previewEl)
  }


  // Feature #13: Export as PDF removed

  return (
    <section className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950 overflow-hidden transition-colors duration-150 border-zinc-200 dark:border-zinc-800">
      {/* Preview Header — hidden on mobile (mobile top bar handles navigation) */}
      <div className="hidden lg:flex h-16 px-4 border-b border-zinc-200 dark:border-zinc-800 items-center justify-between shrink-0 select-none bg-white dark:bg-zinc-950">
        <div className="flex-1 flex items-center min-w-0 gap-2">
          {isLeftSidebarLayout && !isEditorVisible && (
            <Button variant="ghost" size="icon" onClick={onToggleSidebar}
              aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              className="w-8 h-8 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 shrink-0 cursor-pointer">
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </Button>
          )}

          {(layout === 'sidebar_tabs' || layout === 'tabs_sidebar' || layout === 'zen' || layout === 'preview_only' || layout === 'zen_preview') ? (
            <div className="flex items-center gap-2 overflow-hidden min-w-0 shrink-0">
              <span className="text-zinc-500 dark:text-zinc-400 font-semibold text-xs tracking-wide uppercase font-mono hidden sm:inline shrink-0">Preview:</span>
              <span className="text-zinc-900 dark:text-white font-semibold text-base truncate">
                {(title || '').replace(/\.md$/i, '') || 'Untitled'}
              </span>
            </div>
          ) : (
            <span className="text-zinc-500 dark:text-zinc-400 font-semibold text-base tracking-wide uppercase font-mono">Live Preview</span>
          )}

          {(layout === 'sidebar_tabs' || layout === 'tabs_sidebar' || layout === 'zen') && (
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg text-xs font-semibold shrink-0 border border-zinc-200 dark:border-zinc-700">
              <button type="button" onClick={() => onChangeEditorTab('edit')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${editorTab === 'edit' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>Write</button>
              <button type="button" onClick={() => onChangeEditorTab('preview')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${editorTab === 'preview' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>Preview</button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {layoutSelector}

          {/* Feature #12: Export HTML */}
          {hasNote && !isEditorVisible && (
            <Button type="button" variant="outline" onClick={handleExportHTML}
              title="Export as HTML" aria-label="Export as HTML"
              className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1.5 px-2.5 h-8 rounded-md cursor-pointer text-xs font-medium">
              <FileCode className="w-3.5 h-3.5" />
              <span className="hidden md:inline">HTML</span>
            </Button>
          )}

          {hasNote && !isEditorVisible && (
            <Button type="button" variant="outline" onClick={onExportMarkdown}
              title="Export as Markdown (.md)" aria-label="Export as Markdown"
              className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1.5 px-2.5 h-8 rounded-md cursor-pointer text-xs font-medium">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Export</span>
            </Button>
          )}

          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 px-2 py-1 h-8 rounded-md font-mono hidden sm:flex items-center justify-center shrink-0">
            Live
          </span>

          {(layout === 'tabs_sidebar' || layout === 'split_sidebar') && !isEditorVisible && (
            <Button variant="ghost" size="icon" onClick={onToggleSidebar}
              aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              className="w-8 h-8 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 shrink-0 cursor-pointer">
              {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Rendered HTML Area */}
      <div
        ref={(el) => {
          previewScrollRef.current = el
          if (previewRef) previewRef(el)
        }}
        className="flex-1 overflow-y-auto p-6 md:p-8 markdown-preview print:p-0 text-zinc-800 dark:text-zinc-300"
      >
        {!debouncedContent ? (
          <div className="text-center text-zinc-400 dark:text-zinc-500 py-12 text-sm font-light select-none">
            Nothing to preview. Start writing in the editor.
          </div>
        ) : (
          <article className="max-w-none space-y-4">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkGemoji]}
              rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
              components={{
                a: (props) => (
                  <a {...props} target="_blank" rel="noopener noreferrer"
                    className={`${GITHUB_LINK} hover:underline underline-offset-4 transition-colors`} />
                ),
                img: (props) => (
                  <img {...props} className="inline-block max-w-full h-auto my-1 mr-1 rounded-sm align-middle" loading="lazy" alt={props.alt || ''} />
                ),
                table: (props) => (
                  <div className="overflow-x-auto my-6 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900/40">
                    <table {...props} className="w-full text-sm text-left border-collapse" />
                  </div>
                ),
                thead: (props) => <thead {...props} className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-semibold" />,
                th: (props) => <th {...props} className="px-4 py-3 font-semibold border-r border-zinc-200 dark:border-zinc-800 last:border-r-0" />,
                td: (props) => <td {...props} className="px-4 py-2.5 border-t border-zinc-200 dark:border-zinc-800 border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 text-zinc-600 dark:text-zinc-400" />,
                tr: (props) => <tr {...props} className="hover:bg-zinc-100/40 dark:hover:bg-zinc-900/40 odd:bg-white dark:odd:bg-zinc-950 even:bg-zinc-50/50 dark:even:bg-zinc-900/20 transition-colors" />,
                pre: (props) => <pre {...props} className="my-6" />,
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '')
                  const language = match ? match[1] : null

                  // Mermaid diagrams — render as SVG
                  if (language === 'mermaid') {
                    const codeString = String(children).replace(/\n$/, '')
                    return <MermaidDiagram key={`${isDark ? 'dark' : 'light'}-${codeString}`} code={codeString} isDark={isDark} />
                  }

                  if (language) {
                    return (
                      <SyntaxHighlighter
                        language={language}
                        style={isDark ? oneDark : oneLight}
                        customStyle={{
                          margin: 0,
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          lineHeight: '1.6',
                          border: isDark ? '1px solid #27272a' : '1px solid #e4e4e7',
                        }}
                        codeTagProps={{ style: { fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace' } }}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    )
                  }
                  // Inline code
                  return (
                    <code className={`${GITHUB_CODE_BG} px-1.5 py-0.5 rounded-[6px] font-mono text-[85%] break-words`} {...props}>{children}</code>
                  )
                },
                input: (props) => {
                  if (props.type === 'checkbox') {
                    return <input type="checkbox" checked={props.checked} readOnly aria-label={props.checked ? 'Completed' : 'Incomplete'}
                      className="w-4 h-4 rounded accent-zinc-800 dark:accent-zinc-200 border border-zinc-300 dark:border-zinc-600 cursor-default inline-block align-middle mr-2" />
                  }
                  return <input {...props} />
                },
                li: ({ children, ...props }) => <li {...props} className="my-1">{children}</li>,
                ul: (props) => <ul {...props} className="list-disc pl-6 space-y-1.5 my-4" />,
                ol: (props) => <ol {...props} className="list-decimal pl-6 space-y-1.5 my-4" />,
                h1: (props) => <h1 {...props} className="text-2xl md:text-[2em] font-semibold mt-8 mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2 tracking-tight leading-snug" />,
                h2: (props) => <h2 {...props} className="text-xl md:text-[1.5em] font-semibold mt-6 mb-3 tracking-tight border-b border-zinc-200/50 dark:border-zinc-800 pb-2 leading-snug" />,
                h3: (props) => <h3 {...props} className="text-lg md:text-[1.25em] font-semibold mt-4 mb-2 tracking-tight leading-snug" />,
                h4: (props) => <h4 {...props} className="text-base font-semibold mt-4 mb-2 tracking-tight" />,
                h5: (props) => <h5 {...props} className="text-sm font-semibold mt-3 mb-1 tracking-tight" />,
                h6: (props) => <h6 {...props} className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mt-3 mb-1 tracking-tight" />,
                blockquote: (props) => <blockquote {...props} className="border-l-4 border-zinc-300 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-900/40 italic px-4 py-3 my-4 rounded-r-md text-zinc-600 dark:text-zinc-400 font-light leading-relaxed" />,
                p: (props) => <p {...props} className="my-3 leading-relaxed" />,
                hr: (props) => <hr {...props} className="border-zinc-200 dark:border-zinc-800 my-8" />,
                strong: (props) => <strong {...props} className="font-semibold" />,
              }}
            >
              {debouncedContent}
            </ReactMarkdown>
          </article>
        )}
      </div>
    </section>
  )
}
