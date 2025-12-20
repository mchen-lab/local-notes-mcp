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

/**
 * Preprocesses Mermaid code to fix common parsing issues
 * Wraps labels with special characters in quotes to prevent parser ambiguity
 */
function preprocessMermaidCode(code) {
  if (!code) return code

  let processed = String(code)

  // Split into lines to process each line individually
  const lines = processed.split('\n')
  const processedLines = lines.map(line => {
    // Skip comment lines
    if (line.trim().startsWith('%%')) return line

    // Skip directive lines (---, config:, etc.)
    if (line.trim().startsWith('---') || line.trim().startsWith('config:')) return line

    let processedLine = line

    // Fix 1: Wrap node labels containing parentheses in quotes
    // Handles cases like: "N[Link Only (No Update)]" -> "N[\"Link Only (No Update)\"]"
    // This works for square bracket labels [...]
    processedLine = processedLine.replace(
      /([A-Za-z0-9_]+)\[([^\]"]*[()].*?)\]/g,
      (match, nodeId, label) => {
        // If label already has quotes, leave it alone
        if (label.trim().startsWith('"') && label.trim().endsWith('"')) {
          return match
        }
        // Wrap the label in quotes
        return `${nodeId}["${label}"]`
      }
    )

    // Fix 2: Handle other special characters in square bracket labels
    // Wrap labels with slashes, colons, or other problematic chars
    processedLine = processedLine.replace(
      /([A-Za-z0-9_]+)\[([^\]"]*[/:@#$%^&*].*?)\]/g,
      (match, nodeId, label) => {
        // If label already has quotes, leave it alone
        if (label.trim().startsWith('"') && label.trim().endsWith('"')) {
          return match
        }
        // Wrap the label in quotes
        return `${nodeId}["${label}"]`
      }
    )

    // Fix 3: Add space before arrows when preceded by text without space
    // Handles cases like: "A-->B" -> "A --> B"
    processedLine = processedLine.replace(/([a-zA-Z0-9\]}\)])(-+>|=+>|\.-+>)/g, '$1 $2')

    // Fix 4: Add space after arrows when followed by text without space
    // Handles cases like: "-->B" -> "--> B"
    processedLine = processedLine.replace(/(-+>|=+>|\.-+>)([a-zA-Z0-9\[{(])/g, '$1 $2')

    // Fix 5: Add space around link text delimiters |text|
    // Handles cases like: "A-->|text|B" -> "A --> |text| B"
    processedLine = processedLine.replace(/\|([^|]+)\|/g, ' |$1| ')

    // Fix 6: Add space around link text with -- syntax
    // Handles cases like: "A--text-->B" -> "A -- text --> B"
    processedLine = processedLine.replace(/--([^->\s][^->]*[^->\s])-->/g, ' -- $1 --> ')

    // Fix 7: Ensure subgraph names with special chars are quoted
    // Handles cases like: "subgraph My-Graph" -> "subgraph \"My-Graph\""
    if (processedLine.trim().startsWith('subgraph ')) {
      processedLine = processedLine.replace(/^(\s*subgraph\s+)([^\s\["]+)(\s*)$/,
        (match, prefix, name, suffix) => {
          // If name contains special chars and isn't already quoted
          if (/[^a-zA-Z0-9_]/.test(name) && !name.startsWith('"') && !name.startsWith('[')) {
            return `${prefix}"${name}"${suffix}`
          }
          return match
        }
      )
    }

    // Fix 8: Clean up multiple consecutive spaces (but preserve indentation)
    const leadingSpaces = processedLine.match(/^\s*/)[0]
    const content = processedLine.trim().replace(/\s+/g, ' ')
    processedLine = leadingSpaces + content

    return processedLine
  })

  return processedLines.join('\n')
}

export default function MermaidBlock({ chart }) {
  const ref = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const renderDiagram = async () => {
      if (!ref.current) return

      try {
        setError(null)

        // Preprocess the chart code to fix common parsing issues
        const preprocessedChart = preprocessMermaidCode(chart)

        const id = 'mermaid-' + Math.random().toString(36).slice(2)
        const { svg } = await mermaid.render(id, preprocessedChart)
        if (ref.current) {
          ref.current.innerHTML = svg
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err)
        console.error('Original chart:', chart)
        setError(err.message || 'Failed to render diagram')
        if (ref.current) {
          ref.current.innerHTML = `<div style="color: #ff3b30; padding: 12px; border: 1px solid #ff3b30; border-radius: 8px;">
            <strong>Diagram Error:</strong> ${err.message || 'Failed to render'}
          </div>`
        }
      }
    }

    renderDiagram()
  }, [chart])

  return <div className="mermaid-card" ref={ref} />
}