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
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkGemoji from 'remark-gemoji'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { MermaidDiagram } from './MermaidDiagram'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useDarkMode } from '../lib/utils'

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
  tagNames: [...(defaultSchema.tagNames ?? [])],
}

const GITHUB_LINK = 'text-[#0969da] dark:text-[#58a6ff]'
const GITHUB_CODE_BG = 'bg-[rgba(175,184,193,0.2)] dark:bg-[rgba(110,118,129,0.4)]'

export function TemplatesDialog({ open, onOpenChange, onCreateFromTemplate }) {
  const [selectedTemplate, setSelectedTemplate] = useState(NOTE_TEMPLATES[0])
  const isDark = useDarkMode()

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
      <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 sm:max-w-5xl h-[680px] flex flex-col rounded-lg p-5">
        <DialogHeader className="shrink-0 mb-3">
          <DialogTitle className="text-zinc-900 dark:text-white">New from Template</DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400">
            Select a pre-configured template layout to initialize a new note.
          </DialogDescription>
        </DialogHeader>

        {/* Split View Content */}
        <div className="flex-1 flex min-h-0 divide-zinc-200 dark:divide-zinc-800 gap-4 mb-4 overflow-hidden sm:divide-x">
          
          {/* Left Panel: Templates List */}
          <div className="w-full sm:w-1/4 flex flex-col gap-1 sm:pr-2 overflow-y-auto custom-scrollbar select-none">
            {NOTE_TEMPLATES.map((tpl) => {
              const isSelected = selectedTemplate?.name === tpl.name
              return (
                <button
                  key={tpl.name}
                  type="button"
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-xs font-semibold focus-visible:outline-2 focus-visible:outline-zinc-400 ${
                    isSelected
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
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
            <div className="flex-1 overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 text-zinc-800 dark:text-zinc-300 select-text custom-scrollbar markdown-preview text-left">
              <article className="max-w-none space-y-4 text-xs leading-relaxed">
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
                      <div className="overflow-x-auto my-4 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900/40">
                        <table {...props} className="w-full text-xs text-left border-collapse" />
                      </div>
                    ),
                    thead: (props) => <thead {...props} className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-semibold" />,
                    th: (props) => <th {...props} className="px-3 py-2 font-semibold border-r border-zinc-200 dark:border-zinc-800 last:border-r-0" />,
                    td: (props) => <td {...props} className="px-3 py-1.5 border-t border-zinc-200 dark:border-zinc-800 border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 text-zinc-600 dark:text-zinc-400" />,
                    tr: (props) => <tr {...props} className="hover:bg-zinc-100/40 dark:hover:bg-zinc-900/40 odd:bg-white dark:odd:bg-zinc-950 even:bg-zinc-50/50 dark:even:bg-zinc-900/20 transition-colors" />,
                    pre: (props) => <pre {...props} className="my-4" />,
                    code: ({ className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || '')
                      const language = match ? match[1] : null

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
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              lineHeight: '1.5',
                              border: isDark ? '1px solid #27272a' : '1px solid #e4e4e7',
                            }}
                            codeTagProps={{ style: { fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace' } }}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        )
                      }
                      return (
                        <code className={`${GITHUB_CODE_BG} px-1.5 py-0.5 rounded font-mono text-[85%] break-words`} {...props}>{children}</code>
                      )
                    },
                    input: (props) => {
                      if (props.type === 'checkbox') {
                        return <input type="checkbox" checked={props.checked} readOnly aria-label={props.checked ? 'Completed' : 'Incomplete'}
                          className="w-3.5 h-3.5 rounded accent-zinc-800 dark:accent-zinc-200 border border-zinc-300 dark:border-zinc-600 cursor-default inline-block align-middle mr-2" />
                      }
                      return <input {...props} />
                    },
                    li: ({ children, ...props }) => <li {...props} className="my-0.5">{children}</li>,
                    ul: (props) => <ul {...props} className="list-disc pl-5 space-y-1 my-3" />,
                    ol: (props) => <ol {...props} className="list-decimal pl-5 space-y-1 my-3" />,
                    h1: (props) => <h1 {...props} className="text-xl font-semibold mt-6 mb-3 border-b border-zinc-200 dark:border-zinc-800 pb-1.5 tracking-tight leading-snug" />,
                    h2: (props) => <h2 {...props} className="text-lg font-semibold mt-5 mb-2.5 tracking-tight border-b border-zinc-200/50 dark:border-zinc-800 pb-1 leading-snug" />,
                    h3: (props) => <h3 {...props} className="text-base font-semibold mt-4 mb-2 tracking-tight leading-snug" />,
                    h4: (props) => <h4 {...props} className="text-sm font-semibold mt-3 mb-1.5 tracking-tight" />,
                    h5: (props) => <h5 {...props} className="text-xs font-semibold mt-3 mb-1 tracking-tight" />,
                    h6: (props) => <h6 {...props} className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-2 mb-1 tracking-tight" />,
                    blockquote: (props) => <blockquote {...props} className="border-l-4 border-zinc-300 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-900/30 italic px-3.5 py-2 my-3 rounded-r-md text-zinc-600 dark:text-zinc-400 font-light leading-relaxed text-xs" />,
                    p: (props) => <p {...props} className="my-2 leading-relaxed" />,
                    hr: (props) => <hr {...props} className="border-zinc-200 dark:border-zinc-800 my-6" />,
                    strong: (props) => <strong {...props} className="font-semibold" />,
                  }}
                >
                  {selectedTemplate?.content || ''}
                </ReactMarkdown>
              </article>
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
