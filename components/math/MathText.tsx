"use client"

import React from "react"
import katex from "katex"
import TikZRenderer from "./TikZRenderer"

// ── Strip TikZ for preview/collapsed contexts ─────────────────────────────
export function stripTikz(text: string): string {
  if (text.trimStart().startsWith("\\documentclass"))
    return "📊 [Diagram — expand to view]"
  return text
    .replace(/\\begin\{center\}[\s\S]*?\\end\{center\}/g,           "📊 [Diagram — expand to view]")
    .replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g, "📊 [Diagram — expand to view]")
    .replace(/\\begin\{circuitikz\}[\s\S]*?\\end\{circuitikz\}/g,   "📊 [Diagram — expand to view]")
}

// ── Step 1: Extract TikZ blocks into %%TIKZ:…%% tokens ───────────────────
function extractTikz(text: string): string {
  if (text.trimStart().startsWith("\\documentclass"))
    return `%%TIKZ:${encodeURIComponent(text.trim())}%%`

  return text
    .replace(/\\begin\{center\}([\s\S]*?)\\end\{center\}/g, (_, inner) => inner.trim())
    .replace(/\\centering\b/g, "")
    .replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g,
      match => `%%TIKZ:${encodeURIComponent(match)}%%`)
    .replace(/\\begin\{circuitikz\}[\s\S]*?\\end\{circuitikz\}/g,
      match => `%%TIKZ:${encodeURIComponent(match)}%%`)
}

// ── Step 2: Normalise math delimiters ────────────────────────────────────
function normaliseMath(text: string): string {
  return text
    .replace(/\\mathlarger\{([^}]*)\}/g, (_, m) => m)
    .replace(/\\\[([\s\S]*?)\\\]/g,      (_, m) => `$$${m}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g,      (_, m) => `$${m}$`)
    .replace(
      /\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}/g,
      (_, env, body) => `$$\\begin{${env}}${body}\\end{${env}}$$`
    )
}

// ── Step 3: Preprocess LaTeX text commands into markdown ─────────────────
function preprocessText(text: string): string {
  return text
    .replace(/\\section\*?\{([^}]*)\}/g,    (_, m) => `\n**${m}**\n`)
    .replace(/\\subsection\*?\{([^}]*)\}/g, (_, m) => `\n**${m}**\n`)
    .replace(/\\boxed\{([^}]*)\}/g, (_, m) =>
      /^[0-9+\-*/=^_.,() \\]+$/.test(m) ? `$\\boxed{${m}}$` : `%%BOX:${m}%%`)
    .replace(/\\textbf\{([^}]*)\}/g,    (_, m) => `**${m}**`)
    .replace(/\\textit\{([^}]*)\}/g,    (_, m) => `_${m}_`)
    .replace(/\\texttt\{([^}]*)\}/g,    (_, m) => `\`${m}\``)
    .replace(/\\underline\{([^}]*)\}/g, (_, m) => m)
    .replace(/\\emph\{([^}]*)\}/g,      (_, m) => `_${m}_`)
}

// ── Step 4: Render inline markdown tokens ────────────────────────────────
function renderMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`|%%BOX:[^%]+%%)/g)
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return <strong key={i} className="text-zinc-100 font-semibold">{p.slice(2, -2)}</strong>
    if (p.startsWith("_") && p.endsWith("_"))
      return <em key={i}>{p.slice(1, -1)}</em>
    if (p.startsWith("`") && p.endsWith("`"))
      return <code key={i} className="font-mono text-emerald-400 bg-zinc-800 px-1 rounded">{p.slice(1, -1)}</code>
    if (p.startsWith("%%BOX:") && p.endsWith("%%"))
      return (
        <span key={i} className="inline-block border border-emerald-400/60 text-emerald-300 rounded px-2 py-0.5 text-xs font-semibold mx-0.5 align-middle">
          {p.slice(6, -2)}
        </span>
      )
    return <span key={i}>{p}</span>
  })
}

// ── Main component ────────────────────────────────────────────────────────
export default function MathText({ text, className = "" }: { text: string; className?: string }) {
  if (!text) return null

  // Pipeline: TikZ extraction → text preprocessing → math normalisation → tokenise → render
  const processed = normaliseMath(preprocessText(extractTikz(text)))
  const parts = processed.split(/(%%TIKZ:[\s\S]*?%%|\$\$[\s\S]*?\$\$|\$[^$]*?\$)/g)

  return (
    <span className={className}>
      {parts.map((p, i) => {
        // TikZ diagram
        if (p.startsWith("%%TIKZ:") && p.endsWith("%%")) {
          const code = decodeURIComponent(p.slice(7, -2))
          return <TikZRenderer key={i} code={code} />
        }
        // Display math $$...$$
        if (p.startsWith("$$") && p.endsWith("$$")) {
          try {
            const html = katex.renderToString(p.slice(2, -2), { throwOnError: false, displayMode: true })
            return <span key={i} dangerouslySetInnerHTML={{ __html: html }} style={{ display: "block" }} />
          } catch {
            return <span key={i} className="text-red-400 text-xs">[LaTeX error]</span>
          }
        }
        // Inline math $...$
        if (p.startsWith("$") && p.endsWith("$")) {
          try {
            const html = katex.renderToString(p.slice(1, -1), { throwOnError: false, displayMode: false })
            return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
          } catch {
            return <span key={i} className="text-red-400 text-xs">[LaTeX error]</span>
          }
        }
        // Plain text with markdown
        return <span key={i}>{renderMarkdown(p)}</span>
      })}
    </span>
  )
}
