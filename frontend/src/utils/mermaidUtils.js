/**
 * Preprocesses Mermaid code to fix common parsing issues
 * Wraps labels with special characters in quotes to prevent parser ambiguity
 */
export function preprocessMermaidCode(code) {
  if (!code) return code

  // FAIL FAST: Detect dangerous single-line sequence diagrams that cause OOM/Hang
  // If it's a sequence diagram, longer than 100 chars, has no newlines, and no semicolons
  if (code.match(/^\s*sequenceDiagram/) && !code.includes('\n') && code.length > 100 && !code.includes(';')) {
      // Return a special error string or throw?
      // Since this function is for preprocessing, let's return a safe version or throw.
      // Throwing is better so MermaidBlock catches it.
      throw new Error("Invalid Sequence Diagram: Missing newlines or semicolons. Please format your code.");
  }

  let processed = String(code)

  // Fix 0a: Remove HTML entities that can break Mermaid parsing
  // Replace <br/> and <br> tags with newlines
  processed = processed.replace(/<br\s*\/?>/gi, '\n')
  
  // Fix 0b: Decode common HTML entities
  processed = processed.replace(/&nbsp;/gi, ' ')
  processed = processed.replace(/&amp;/gi, '&')
  processed = processed.replace(/&lt;/gi, '<')
  processed = processed.replace(/&gt;/gi, '>')
  processed = processed.replace(/&quot;/gi, '"')
  processed = processed.replace(/&#39;/gi, "'")
  
  // Fix 0c: Remove zero-width characters and other invisible Unicode
  processed = processed.replace(/[\u200B\u200C\u200D\uFEFF]/g, '')
  
  // Fix 0d: Normalize various dash types to regular dashes
  processed = processed.replace(/[–—]/g, '-') // en-dash and em-dash to hyphen
  
  // Fix 0e: Normalize smart quotes to regular quotes
  processed = processed.replace(/[""]/g, '"')
  processed = processed.replace(/['']/g, "'")

  // Split into lines to process each line individually
  const lines = processed.split('\n')
  
  // Detect diagram type to apply appropriate fixes
  // ER diagrams use syntax like ||--o{ which shouldn't have spaces added
  const firstContentLine = lines.find(l => l.trim() && !l.trim().startsWith('%%') && !l.trim().startsWith('---'))
  const isErDiagram = firstContentLine && /^\s*erDiagram/i.test(firstContentLine)
  const isSequenceDiagram = firstContentLine && /^\s*sequenceDiagram/i.test(firstContentLine)
  const isClassDiagram = firstContentLine && /^\s*classDiagram/i.test(firstContentLine)
  const isStateDiagram = firstContentLine && /^\s*stateDiagram/i.test(firstContentLine)
  const isRequirementDiagram = firstContentLine && /^\s*requirementDiagram/i.test(firstContentLine)
  const isGitGraph = firstContentLine && /^\s*gitGraph/i.test(firstContentLine)
  const isGantt = firstContentLine && /^\s*gantt/i.test(firstContentLine)
  const isPie = firstContentLine && /^\s*pie/i.test(firstContentLine)
  
  // Some diagram types should not have flowchart-specific fixes applied
  const skipFlowchartFixes = isErDiagram || isSequenceDiagram || isGitGraph || isGantt || isPie || isClassDiagram || isStateDiagram || isRequirementDiagram
  
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

    // Fix 1b: Wrap rhombus labels {} containing special characters
    // Handles cases like: "B{Is it working?}" -> "B{\"Is it working?\"}"
    processedLine = processedLine.replace(
      /([A-Za-z0-9_]+)\{([^\}"]*[?/@#$%^&*()=].*?)\}/g,
      (match, nodeId, label) => {
        // If label already has quotes, leave it alone
        if (label.trim().startsWith('"') && label.trim().endsWith('"')) {
          return match
        }
        // Wrap the label in quotes
        return `${nodeId}{"${label}"}`
      }
    )

    // Fix 1c: Wrap round labels () containing special characters
    // Handles cases like: "B(Is it working?)" -> "B(\"Is it working?\")"
    // Also handles one level of nested parentheses: "A(Func(x))" -> "A(\"Func(x)\")"
    processedLine = processedLine.replace(
      /([A-Za-z0-9_]+)\(((?:[^()]|\([^()]*\))+)\)/g,
      (match, nodeId, label) => {
        // If already quoted, ignore
        if (label.trim().startsWith('"') && label.trim().endsWith('"')) {
            return match
        }
        if (/[!@#$%^&*={}\[\]?]/.test(label) || /[()]/.test(label)) {
             return `${nodeId}("${label}")`
        }
        return match
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

    // Fixes 3-7 are flowchart/graph specific and can break other diagram types
    if (!skipFlowchartFixes) {
      // Fix 3: Add space before arrows when preceded by text without space
      // Handles cases like: "A-->B" -> "A --> B"
      processedLine = processedLine.replace(/([a-zA-Z0-9\]}\)])(-+>|=+>|\.-+>)/g, '$1 $2')

      // Fix 4: Add space after arrows when followed by text without space
      // Handles cases like: "-->B" -> "--> B"
      processedLine = processedLine.replace(/(-+>|=+>|\.-+>)([a-zA-Z0-9\[{(])/g, '$1 $2')

      // Fix 5: Add space around link text delimiters |text|
      // Handles cases like: "A-->|text|B" -> "A --> |text| B"
      // NOTE: This breaks ER diagram syntax like ||--o{ so we skip it for those
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
    }

    // Fix 8: Clean up multiple consecutive spaces (but preserve indentation)
    const leadingSpaces = processedLine.match(/^\s*/)[0]
    const content = processedLine.trim().replace(/\s+/g, ' ')
    processedLine = leadingSpaces + content

    return processedLine
  })

  return processedLines.join('\n')
}
