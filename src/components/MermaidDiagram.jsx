import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDarkMode } from '../lib/utils'
import {
  Maximize2,
  Copy,
  Download,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  X,
  AlertTriangle,
  Check
} from 'lucide-react'

let diagramCounter = 0

// Global in-memory cache for rendered SVG strings
const renderCache = new Map()

export function MermaidDiagram({ code }) {
  const [debouncedCode, setDebouncedCode] = useState(code)
  const [svgHtml, setSvgHtml] = useState(null)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)
  
  // Fullscreen Modal Zoom & Pan States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })

  const [copied, setCopied] = useState(false)
  const isDark = useDarkMode()

  // Debounce diagram updates by 300ms to avoid typing performance lag
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCode(code)
    }, 300)
    return () => clearTimeout(timer)
  }, [code])

  // Core Mermaid rendering and DOM processing hook
  useEffect(() => {
    if (!debouncedCode?.trim()) return
    let cancelled = false

    const cacheKey = `${isDark ? 'dark' : 'light'}-${debouncedCode}`
    if (renderCache.has(cacheKey)) {
      setSvgHtml(renderCache.get(cacheKey))
      setError(null)
      setReady(true)
      return
    }

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
          flowchart: { useMaxWidth: false, htmlLabels: false, padding: 20 },
          sequence: { useMaxWidth: false },
          gantt: { useMaxWidth: false },
        })

        await document.fonts.ready

        const id = `mermaid-${++diagramCounter}`
        const { svg } = await mermaid.render(id, debouncedCode.trim())
        if (cancelled) return

        const parser = new DOMParser()
        const doc = parser.parseFromString(svg, 'image/svg+xml')
        const svgEl = doc.querySelector('svg')
        if (!svgEl) throw new Error('Failed to generate diagram')

        // Pre-process SVGs: remove text-clipping clipPaths
        svgEl.querySelectorAll('clipPath').forEach(el => el.remove())
        svgEl.querySelectorAll('[clip-path]').forEach(el => el.removeAttribute('clip-path'))

        // Fix foreignObject dimensions to prevent text clipping
        svgEl.querySelectorAll('foreignObject').forEach(fo => {
          const w = parseFloat(fo.getAttribute('width') || '0')
          if (w > 0) fo.setAttribute('width', String(w + 40))
          const h = parseFloat(fo.getAttribute('height') || '0')
          if (h > 0) fo.setAttribute('height', String(h + 20))
        })

        // Pad viewBox to avoid cutting off edge labels
        const vb = svgEl.getAttribute('viewBox')
        if (vb) {
          const parts = vb.trim().split(/\s+/).map(Number)
          if (parts.length === 4) {
            const [x, y, w, h] = parts
            const pad = 24
            svgEl.setAttribute('viewBox', `${x - pad} ${y - pad} ${w + pad * 2} ${h + pad * 2}`)
          }
        }

        // Remove explicit sizing to allow standard responsive layouts
        svgEl.removeAttribute('width')
        svgEl.removeAttribute('height')

        const processedSvg = svgEl.outerHTML
        renderCache.set(cacheKey, processedSvg)

        if (!cancelled) {
          setSvgHtml(processedSvg)
          setError(null)
          setReady(true)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Invalid diagram syntax')
          setReady(true)
        }
      }
    }

    render()
    return () => { cancelled = true }
  }, [debouncedCode, isDark])

  // Escape key handler to close fullscreen modal
  useEffect(() => {
    if (!isModalOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false)
        setZoom(1)
        setPan({ x: 0, y: 0 })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

  const handleCopySvg = async () => {
    if (!svgHtml) return
    try {
      await navigator.clipboard.writeText(svgHtml)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy SVG:', err)
    }
  }

  const handleDownloadSvg = () => {
    if (!svgHtml) return
    const blob = new Blob([svgHtml], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'mermaid-diagram.svg'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleDownloadPng = () => {
    if (!svgHtml) return
    const img = new Image()
    const svgBlob = new Blob([svgHtml], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const parser = new DOMParser()
      const doc = parser.parseFromString(svgHtml, 'image/svg+xml')
      const svgEl = doc.querySelector('svg')
      const viewBox = svgEl?.getAttribute('viewBox')
      
      let width = 1200
      let height = 800

      if (viewBox) {
        const parts = viewBox.split(/\s+/).map(Number)
        if (parts.length === 4) {
          const aspect = parts[2] / parts[3]
          width = Math.max(1200, parts[2] * 2)
          height = width / aspect
        }
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = isDark ? '#09090b' : '#ffffff'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob((blob) => {
          if (!blob) return
          const pngUrl = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = pngUrl
          link.download = 'mermaid-diagram.png'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(pngUrl)
        }, 'image/png')
      }
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  // Fullscreen Pan & Zoom Events
  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsDragging(true)
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e) => {
    e.preventDefault()
    const delta = -e.deltaY
    const factor = delta > 0 ? 1.1 : 0.9
    setZoom(z => Math.min(5, Math.max(0.2, z * factor)))
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Dynamically extract the SVG's natural width from its viewBox
  const getNaturalSvgWidth = () => {
    if (!svgHtml) return '800px'
    const match = svgHtml.match(/viewBox=["']\s*([-\d.]+)\s+([-\d.]+)\s+([\d.]+)\s+([\d.]+)/)
    if (match && match[3]) {
      const widthVal = parseFloat(match[3])
      // Return pixel width but cap it if it is ridiculously small/large for a base scale
      return `${Math.min(3000, Math.max(200, widthVal))}px`
    }
    return '800px'
  }

  const naturalWidth = getNaturalSvgWidth()

  // Render Fullscreen Modal Portal
  const modalPortal = isModalOpen && svgHtml && createPortal(
    <div 
      className="fixed inset-0 z-[9999] bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none"
      onClick={handleCloseModal}
    >
      <div 
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl w-[90vw] h-[85vh] flex flex-col relative shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex flex-col">
            <h3 className="text-zinc-900 dark:text-zinc-100 font-semibold text-sm">Mermaid Diagram Viewer</h3>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Scroll to zoom, drag to pan the diagram</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopySvg}
              title="Copy SVG code"
              className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer bg-white dark:bg-zinc-900 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handleDownloadSvg}
              title="Download SVG"
              className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer bg-white dark:bg-zinc-900 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleDownloadPng}
              title="Download PNG"
              className="px-2.5 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer bg-white dark:bg-zinc-900 transition-colors font-medium"
            >
              PNG
            </button>
            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
            <button
              type="button"
              onClick={handleCloseModal}
              title="Close"
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Controls Bar */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-3 py-2 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-lg backdrop-blur-xs">
          <button
            type="button"
            onClick={() => setZoom(z => Math.min(5, z + 0.2))}
            title="Zoom In"
            className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono text-zinc-500 px-1 select-none min-w-[36px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom(z => Math.max(0.2, z - 0.2))}
            title="Zoom Out"
            className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
          <button
            type="button"
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
            title="Reset Zoom & Pan"
            className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Main Viewport */}
        <div 
          className={`flex-1 overflow-hidden relative bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-8 ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div 
            style={{ 
              width: naturalWidth,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
            dangerouslySetInnerHTML={{ __html: svgHtml }}
            className="flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:block [&>svg]:select-none"
          />
        </div>
      </div>
    </div>,
    document.body
  )

  return (
    <div className="relative group my-6 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 rounded-lg overflow-hidden transition-all duration-200">
      
      {/* Error Badge for Graceful Syntax Recovery */}
      {error && svgHtml && (
        <div 
          title={error}
          className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[10px] font-semibold cursor-help shadow-xs font-sans select-none no-export"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>Syntax Warning (showing last valid render)</span>
        </div>
      )}

      {/* Inline Toolbar Controls (Reveals on Hover) */}
      {svgHtml && (
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 no-export">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            title="Fullscreen View"
            className="p-1.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCopySvg}
            title="Copy SVG code"
            className="p-1.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleDownloadSvg}
            title="Download SVG"
            className="p-1.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Loading Spinner */}
      {!ready && !svgHtml && (
        <div className="p-8 flex items-center justify-center min-h-[120px] no-export">
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono animate-pulse">Rendering diagram...</span>
        </div>
      )}

      {/* Full syntax error block (fallback if there is no previous valid render) */}
      {error && !svgHtml && (
        <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400">
          <p className="text-xs font-mono font-semibold mb-1 flex items-center gap-1.5 select-none">
            <AlertTriangle className="w-4 h-4 text-red-500" /> Mermaid Syntax Error
          </p>
          <pre className="text-[11px] font-mono whitespace-pre-wrap overflow-x-auto bg-red-100/50 dark:bg-red-950/40 p-2.5 rounded mt-1.5 max-h-48 select-text">{error}</pre>
        </div>
      )}

      {/* Rendered SVG Element */}
      {svgHtml && (
        <div 
          dangerouslySetInnerHTML={{ __html: svgHtml }} 
          className={`p-6 flex items-center justify-center transition-opacity duration-200 overflow-hidden [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[500px] [&>svg]:block [&>svg]:mx-auto ${
            error ? 'opacity-50' : 'opacity-100'
          }`}
        />
      )}

      {/* Fullscreen Lightbox Modal Portal */}
      {modalPortal}
    </div>
  )
}
