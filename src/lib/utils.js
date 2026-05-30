// Shared utilities — used across multiple components
export function getRelativeTime(timestamp) {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  if (seconds < 10) return 'Just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function getWordCount(text) {
  if (!text?.trim()) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Shared hook — reactive dark mode detection via MutationObserver
import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  )
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return isDark
}

export function exportToHTML(title, previewEl) {
  if (!previewEl) return

  const clone = previewEl.cloneNode(true)
  
  // 1. Remove elements marked with .no-export
  clone.querySelectorAll('.no-export').forEach(el => el.remove())

  // 2. Adjust SVGs to prevent collapse and ensure they are responsive
  clone.querySelectorAll('svg').forEach(svg => {
    const viewBox = svg.getAttribute('viewBox')
    if (viewBox) {
      const parts = viewBox.split(/\s+/).map(Number)
      if (parts.length >= 4) {
        const w = parts[2]
        const h = parts[3]
        if (!isNaN(w) && w > 0) {
          svg.style.width = '100%'
          svg.style.maxWidth = `${w}px`
          svg.style.height = 'auto'
          svg.style.display = 'block'
          svg.style.margin = '24px auto'
        }
      }
    }
  })

  // 3. Obtain HTML string
  let contentHtml = clone.innerHTML

  // 4. Force light mode styles on Mermaid SVGs by replacing dark-mode colors with light-mode equivalents
  const colorMap = [
    { dark: /#27272[aA]/g, light: '#dbeafe' }, // primaryColor/mainBkg
    { dark: /#e4e4e7/g, light: '#1e3a5f' }, // primaryTextColor
    { dark: /#52525[bB]/g, light: '#93c5fd' }, // primaryBorderColor/nodeBorder
    { dark: /#71717[aA]/g, light: '#6b7280' }, // lineColor
    { dark: /#09090[bB]/g, light: '#ffffff' }, // background/edgeLabelBackground
  ]

  colorMap.forEach(({ dark, light }) => {
    contentHtml = contentHtml.replace(dark, light)
  })

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title || 'Exported Note'}</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
    max-width: 800px;
    margin: 40px auto;
    padding: 0 20px;
    line-height: 1.6;
    color: #24292f;
    background-color: #ffffff;
  }
  h1,h2,h3,h4,h5,h6 { font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; color: #09090b; }
  h1,h2 { border-bottom: 1px solid #d0d7de; padding-bottom: 0.3em; }
  code { background: rgba(175,184,193,0.2); padding: 0.2em 0.4em; border-radius: 4px; font-family: ui-monospace, monospace; font-size: 85%; }
  pre { background: #f6f8fa; color: #24292f; border: 1px solid #d0d7de; padding: 16px; border-radius: 8px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 4px solid #d0d7de; margin: 0; padding: 0 1em; color: #57606a; background-color: #f6f8fa; border-radius: 0 4px 4px 0; }
  table { border-collapse: collapse; width: 100%; margin: 24px 0; }
  th,td { border: 1px solid #d0d7de; padding: 8px 12px; }
  th { background: #f6f8fa; color: #24292f; }
  tr:nth-child(even) { background-color: #fafafa; }
  a { color: #0969da; text-decoration: none; }
  a:hover { text-decoration: underline; }
  img { max-width: 100%; }
  svg { display: block; max-width: 100%; height: auto; margin: 24px auto; }
</style>
</head>
<body>
${contentHtml}
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${(title || 'note').replace(/\.md$/i, '')}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function diffLines(oldText, newText) {
  const oldLines = oldText ? oldText.split('\n') : []
  const newLines = newText ? newText.split('\n') : []
  const M = oldLines.length
  const N = newLines.length

  const dp = Array.from({ length: M + 1 }, () => new Int32Array(N + 1))
  for (let i = 1; i <= M; i++) {
    for (let j = 1; j <= N; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  let i = M
  let j = N
  const diff = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      diff.unshift({ type: 'unchanged', text: oldLines[i - 1] })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.unshift({ type: 'added', text: newLines[j - 1] })
      j--
    } else {
      diff.unshift({ type: 'removed', text: oldLines[i - 1] })
      i--
    }
  }

  return diff
}

export function getUnifiedDiff(oldText, newText) {
  const diff = diffLines(oldText, newText)
  const contextSize = 1
  const result = []
  
  for (let idx = 0; idx < diff.length; idx++) {
    const item = diff[idx]
    if (item.type !== 'unchanged') {
      result.push({ ...item, index: idx })
    } else {
      let nearChange = false
      for (let offset = -contextSize; offset <= contextSize; offset++) {
        const neighbor = diff[idx + offset]
        if (neighbor && neighbor.type !== 'unchanged') {
          nearChange = true
          break
        }
      }
      if (nearChange) {
        result.push({ ...item, index: idx })
      } else if (result.length > 0 && result[result.length - 1].type !== 'ellipsis') {
        result.push({ type: 'ellipsis', text: '...' })
      }
    }
  }
  return result
}

