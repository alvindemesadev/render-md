import { useEffect, useRef, useState } from 'react'
import { useDarkMode } from '../lib/utils'

let diagramCounter = 0

export function MermaidDiagram({ code }) {
  const containerRef = useRef(null)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)
  const isDark = useDarkMode()

  useEffect(() => {
    if (!code?.trim() || !containerRef.current) return
    let cancelled = false
    setError(null)
    setReady(false)

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default

        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: isDark
            ? {
                primaryColor: '#27272a',
                primaryTextColor: '#e4e4e7',
                primaryBorderColor: '#52525b',
                lineColor: '#71717a',
                background: '#09090b',
                mainBkg: '#27272a',
                nodeBorder: '#52525b',
                edgeLabelBackground: '#09090b',
                fontFamily: 'ui-sans-serif, system-ui, sans-serif',
              }
            : {
                primaryColor: '#dbeafe',
                primaryTextColor: '#1e3a5f',
                primaryBorderColor: '#93c5fd',
                lineColor: '#6b7280',
                background: '#ffffff',
                mainBkg: '#dbeafe',
                nodeBorder: '#93c5fd',
                edgeLabelBackground: '#ffffff',
                fontFamily: 'ui-sans-serif, system-ui, sans-serif',
              },
          securityLevel: 'loose',
          // htmlLabels:false = SVG <text> nodes, no foreignObject, no clipping
          flowchart: { useMaxWidth: false, htmlLabels: false, padding: 20 },
          sequence: { useMaxWidth: false },
          gantt: { useMaxWidth: false },
        })

        await document.fonts.ready

        const id = `mermaid-${++diagramCounter}`
        const { svg } = await mermaid.render(id, code.trim())
        if (cancelled || !containerRef.current) return

        const parser = new DOMParser()
        const doc = parser.parseFromString(svg, 'image/svg+xml')
        const svgEl = doc.querySelector('svg')
        if (!svgEl) throw new Error('Failed to generate diagram')

        // Remove clip paths that cut off text
        svgEl.querySelectorAll('clipPath').forEach(el => el.remove())
        svgEl.querySelectorAll('[clip-path]').forEach(el => el.removeAttribute('clip-path'))

        // Fix foreignObject widths just in case
        svgEl.querySelectorAll('foreignObject').forEach(fo => {
          const w = parseFloat(fo.getAttribute('width') || '0')
          if (w > 0) fo.setAttribute('width', String(w + 40))
          const h = parseFloat(fo.getAttribute('height') || '0')
          if (h > 0) fo.setAttribute('height', String(h + 20))
        })

        // Read the existing viewBox — Mermaid sets it correctly for the content
        // Just add padding around it so nothing gets clipped at edges
        const vb = svgEl.getAttribute('viewBox')
        if (vb) {
          const parts = vb.trim().split(/\s+/).map(Number)
          if (parts.length === 4) {
            const [x, y, w, h] = parts
            const pad = 24
            svgEl.setAttribute('viewBox', `${x - pad} ${y - pad} ${w + pad * 2} ${h + pad * 2}`)
          }
        }

        // Remove fixed pixel dimensions — let CSS control the size
        svgEl.removeAttribute('width')
        svgEl.removeAttribute('height')
        // width:100% fills the container, max-width caps it, margin:auto centers it
        svgEl.style.cssText = 'display:block;width:100%;max-width:360px;height:auto;overflow:visible;margin:0 auto;'

        containerRef.current.innerHTML = svgEl.outerHTML
        setReady(true)
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Invalid diagram syntax')
      }
    }

    render()
    return () => { cancelled = true }
  }, [code, isDark])

  if (error) {
    return (
      <div className="my-6 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-4">
        <p className="text-xs font-mono text-red-600 dark:text-red-400 font-semibold mb-1">Mermaid syntax error</p>
        <p className="text-xs text-red-500 dark:text-red-400 font-mono whitespace-pre-wrap">{error}</p>
      </div>
    )
  }

  return (
    <div className="my-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-x-auto">
      {!ready && (
        <div className="p-6 flex items-center justify-center min-h-[80px]">
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono animate-pulse">Rendering diagram...</span>
        </div>
      )}
      <div ref={containerRef} className={`p-4 ${ready ? '' : 'hidden'}`} />
    </div>
  )
}
