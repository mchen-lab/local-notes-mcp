import React, { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

// Initialize mermaid once globally
let isInitialized = false
if (!isInitialized) {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis'
    },
    securityLevel: 'loose'
  })
  isInitialized = true
}

import { preprocessMermaidCode } from '../utils/mermaidUtils'

export default function MermaidBlock({ chart }) {
  const ref = useRef(null)
  const [error, setError] = useState(null)
  const [svgContent, setSvgContent] = useState(null)
  const [debouncedChart, setDebouncedChart] = useState(chart)

  // Debounce the chart input 
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedChart(chart)
    }, 500) // 500ms delay

    return () => {
      clearTimeout(handler)
    }
  }, [chart])

  useEffect(() => {
    // Reset state when content changes
    setError(null)
    setSvgContent(null)

    const renderDiagram = async () => {
      const id = 'mermaid-' + Math.random().toString(36).slice(2)

      // 1. Preprocess & Validate (Main Thread Heuristic)
      let processedCode;
      try {
        processedCode = preprocessMermaidCode(debouncedChart)
      } catch (err) {
        setError(err.message)
        return
      }

      try {
        // 2. Validate syntax with mermaid.parse (Main Thread)
        // This is reasonably safe IF we passed the heuristic check
        await mermaid.parse(processedCode)

        // 3. Render (Main Thread)
        const { svg } = await mermaid.render(id, processedCode)
        setSvgContent(svg)
        
      } catch (err) {
        console.error('Mermaid rendering error:', err)
        setError(`${err.name}: ${err.message}` || 'Failed to render diagram')
      }
    }

    if (debouncedChart) {
        renderDiagram()
    }
  }, [debouncedChart])

  // Insert SVG into DOM when content is available
  useEffect(() => {
    if (ref.current && svgContent) {
      ref.current.innerHTML = svgContent
    }
  }, [svgContent])

  if (error) {
    return (
      <div className="mermaid-card border-destructive/50 bg-destructive/10 text-destructive p-4 rounded-lg my-4">
        <div className="flex items-center gap-2 font-semibold mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          Mermaid Diagram Error
        </div>
        <div className="text-sm font-mono whitespace-pre-wrap opacity-90 break-words bg-background/50 p-3 rounded border border-destructive/20 mb-3">
          {error}
        </div>
        <details className="text-xs opacity-70">
          <summary className="cursor-pointer hover:underline mb-1 font-medium select-none">View Source</summary>
          <pre className="font-mono bg-background/50 p-2 rounded overflow-auto max-h-32 text-foreground">
            {chart}
          </pre>
        </details>
      </div>
    )
  }

  return (
      <div className="relative min-h-[50px]">
         <div className="mermaid-card overflow-auto" ref={ref} />
      </div>
  )
}