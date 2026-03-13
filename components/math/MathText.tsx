"use client"

import React from "react"
import katex from "katex"
import TikZRenderer from "./TikZRenderer"

// ── Strip TikZ for collapsed preview ─────────────────────────────────────
export function stripTikz(text: string): string {
  if (text.trimStart().startsWith("\\documentclass"))
    return "📊 [Diagram — expand to view]"
  return text
    .replace(/\\begin\{center\}[\s\S]*?\\end\{center\}/g,           "📊 [Diagram — expand to view]")
    .replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g, "📊 [Diagram — expand to view]")
    .replace(/\\begin\{circuitikz\}[\s\S]*?\\end\{circuitikz\}/g,   "📊 [Diagram — expand to view]")
}

// ── Tokenise: convert all multi-line-safe blocks into %%TOKEN:%% ──────────
// Order matters: TikZ first, then display math, then inline math.
// After this step, every token is a single logical unit with no newlines inside.
function tokenise(text: string): string {
  // Full standalone LaTeX document — but text may continue AFTER \end{document}
  // Split it: tikz part → %%TIKZ:%%, remainder → rendered normally
  if (text.trimStart().startsWith("\\documentclass")) {
    const endDoc = "\\end{document}"
    const endIdx = text.indexOf(endDoc)
    if (endIdx !== -1) {
      const tikzPart      = text.slice(0, endIdx + endDoc.length).trim()
      const remainderPart = text.slice(endIdx + endDoc.length).trim()
      const token = `%%TIKZ:${encodeURIComponent(tikzPart)}%%`
      return remainderPart ? token + "\n" + remainderPart : token
    }
    return `%%TIKZ:${encodeURIComponent(text.trim())}%%`
  }

  return text
    // Unwrap \begin{center}...\end{center} (keep inner content)
    .replace(/\\begin\{center\}([\s\S]*?)\\end\{center\}/g, (_, inner) => inner.trim())
    .replace(/\\centering\b/g, "")
    // TikZ diagrams → %%TIKZ:%%
    .replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g,
      m => `%%TIKZ:${encodeURIComponent(m)}%%`)
    .replace(/\\begin\{circuitikz\}[\s\S]*?\\end\{circuitikz\}/g,
      m => `%%TIKZ:${encodeURIComponent(m)}%%`)
    // Lists: \begin{itemize} and \begin{enumerate} → %%LIST:%%
    .replace(/\\begin\{(itemize|enumerate)\}([\s\S]*?)\\end\{\1\}/g,
      (_, env, body) => {
        const ordered = env === "enumerate"
        const items = body
          .split(/\\item/)
          .map((s: string) => s.trim())
          .filter(Boolean)
        return `%%LIST:${encodeURIComponent(JSON.stringify({ ordered, items }))}%%`
      })
    // Display math \[...\] → %%DM:%% (may span multiple lines)
    .replace(/\\\[([\s\S]*?)\\\]/g,
      (_, inner) => `%%DM:${encodeURIComponent(inner)}%%`)
    // Inline math \(...\) → %%IM:%%
    .replace(/\\\(([\s\S]*?)\\\)/g,
      (_, inner) => `%%IM:${encodeURIComponent(inner)}%%`)
    // LaTeX environments \begin{align}...\end{align} etc → %%DM:%%
    .replace(/\\begin\{(align\*?|equation\*?|gather\*?|multline\*?|array)\}([\s\S]*?)\\end\{\1\}/g,
      (_, env, body) => `%%DM:${encodeURIComponent(`\\begin{${env}}${body}\\end{${env}}`)}%%`)
    // Lists: \begin{itemize} and \begin{enumerate}
    .replace(/\\begin\{(itemize|enumerate)\}([\s\S]*?)\\end\{\1\}/g,
      (_, env, body) => `%%LIST:${env}:${encodeURIComponent(body)}%%`)
}

// ── Preprocess LaTeX text commands into markdown ──────────────────────────
function preprocessText(text: string): string {
  return text
    .replace(/\\section\*?\{([^}]*)\}/g,    (_, m) => `**${m}**`)
    .replace(/\\subsection\*?\{([^}]*)\}/g, (_, m) => `**${m}**`)
    .replace(/\\mathlarger\{([^}]*)\}/g,    (_, m) => m)
    .replace(/\\boxed\{([^}]*)\}/g, (_, m) =>
      /^[0-9+\-*/=^_.,() \\]+$/.test(m) ? `%%DM:${encodeURIComponent(`\\boxed{${m}}`)}%%` : `%%BOX:${m}%%`)
    .replace(/\\say\{([^}]*)\}/g,       (_, m) => `\u201c${m}\u201d`)  // "text"
    .replace(/\\textbf\{([^}]*)\}/g,    (_, m) => `**${m}**`)
    .replace(/\\textit\{([^}]*)\}/g,    (_, m) => `_${m}_`)
    .replace(/\\texttt\{([^}]*)\}/g,    (_, m) => `\`${m}\``)
    .replace(/\\underline\{([^}]*)\}/g, (_, m) => m)
    .replace(/\\emph\{([^}]*)\}/g,      (_, m) => `_${m}_`)
}

// ── Render inline markdown ────────────────────────────────────────────────
function renderMarkdown(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`|%%BOX:[^%]+%%)/g).map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return <strong key={i} className="text-zinc-100 font-semibold">{p.slice(2, -2)}</strong>
    if (p.startsWith("_") && p.endsWith("_"))
      return <em key={i}>{p.slice(1, -1)}</em>
    if (p.startsWith("`") && p.endsWith("`"))
      return <code key={i} className="font-mono text-emerald-400 bg-zinc-800 px-1 rounded">{p.slice(1, -1)}</code>
    if (p.startsWith("%%BOX:") && p.endsWith("%%"))
      return <span key={i} className="inline-block border border-emerald-400/60 text-emerald-300 rounded px-2 py-0.5 text-xs font-semibold mx-0.5 align-middle">{p.slice(6, -2)}</span>
    return <span key={i}>{p}</span>
  })
}

// ── KaTeX render helpers ──────────────────────────────────────────────────
function renderDisplay(latex: string, key: string): React.ReactNode {
  try {
    const html = katex.renderToString(latex, { throwOnError: false, displayMode: true })
    return <span key={key} dangerouslySetInnerHTML={{ __html: html }} style={{ display: "block" }} />
  } catch { return <span key={key} className="text-red-400 text-xs">[LaTeX error]</span> }
}

function renderInline(latex: string, key: string): React.ReactNode {
  try {
    const html = katex.renderToString(latex, { throwOnError: false, displayMode: false })
    return <span key={key} dangerouslySetInnerHTML={{ __html: html }} />
  } catch { return <span key={key} className="text-red-400 text-xs">[LaTeX error]</span> }
}

// ── Render a single segment (tokens already extracted) ───────────────────
function renderSegment(seg: string, keyPrefix: number): React.ReactNode[] {
  // Split on ALL token types first
  const parts = seg.split(/(%%TIKZ:.*?%%|%%DM:.*?%%|%%IM:.*?%%|%%LIST:.*?%%)/gs)

  return parts.flatMap((p, i) => {
    const key = `${keyPrefix}-${i}`

    if (p.startsWith("%%TIKZ:") && p.endsWith("%%"))
      return [<TikZRenderer key={key} code={decodeURIComponent(p.slice(7, -2))} />]

    if (p.startsWith("%%DM:") && p.endsWith("%%"))
      return [renderDisplay(decodeURIComponent(p.slice(5, -2)), key)]

    if (p.startsWith("%%IM:") && p.endsWith("%%"))
      return [renderInline(decodeURIComponent(p.slice(5, -2)), key)]

    if (p.startsWith("%%LIST:") && p.endsWith("%%")) {
      try {
        const { ordered, items } = JSON.parse(decodeURIComponent(p.slice(7, -2)))
        const Tag = ordered ? "ol" : "ul"
        return [(
          <Tag key={key} className={ordered ? "list-decimal list-inside space-y-1.5 my-2 pl-2" : "list-disc list-inside space-y-1.5 my-2 pl-2"}>
            {(items as string[]).map((item: string, idx: number) => (
              <li key={idx} className="text-sm leading-relaxed">
                {renderSegment(item.trim(), keyPrefix * 1000 + idx)}
              </li>
            ))}
          </Tag>
        )]
      } catch {
        return [<span key={key} className="text-red-400 text-xs">[list error]</span>]
      }
    }

    // Plain text: preprocess then handle $$ and $ inline math
    const processed = preprocessText(p)

    const mathParts = processed.split(/(%%DM:.*?%%|%%IM:.*?%%|\$\$[\s\S]*?\$\$|\$[^$\n]*?\$)/g)

    return mathParts.map((mp, j) => {
      const mkey = `${key}-${j}`
      if (mp.startsWith("%%DM:") && mp.endsWith("%%"))
        return renderDisplay(decodeURIComponent(mp.slice(5, -2)), mkey)
      if (mp.startsWith("%%IM:") && mp.endsWith("%%"))
        return renderInline(decodeURIComponent(mp.slice(5, -2)), mkey)
      if (mp.startsWith("$$") && mp.endsWith("$$"))
        return renderDisplay(mp.slice(2, -2), mkey)
      if (mp.startsWith("$") && mp.endsWith("$"))
        return renderInline(mp.slice(1, -1), mkey)
      return <span key={mkey}>{renderMarkdown(mp)}</span>
    })
  })
}

// ── Main component ────────────────────────────────────────────────────────
export default function MathText({ text, className = "" }: { text: string; className?: string }) {
  if (!text) return null

  // Step 1: tokenise all multi-line blocks (TikZ, \[...\], \(...\), environments)
  const tokenised = tokenise(text)

  // Step 2: split on newlines — tokens are single-line so they survive intact
  // Split on literal \\n (not followed by a letter — would break \\nabla, \\newline etc)
  // or on a real newline character
  const segments = tokenised.split(/\\n(?![a-zA-Z])|\n/)

  return (
    <span className={className} style={{ display: "block" }}>
      {segments.map((seg, i) => {
        const hasTikz = seg.includes("%%TIKZ:")
        return (
          <span key={i} style={{ display: "block", textAlign: hasTikz ? "center" : undefined }}>
            {seg.trim() === "" ? <br /> : renderSegment(seg, i)}
          </span>
        )
      })}
    </span>
  )
}
