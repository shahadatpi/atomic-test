"use client"

import { useEffect, useRef, useState } from "react"

/* ─── Types ─────────────────────────────────────────────────────────────── */
type Status = "idle" | "loading" | "success" | "error" | "cold-start"

interface TikZFigureProps {
  /** Raw TikZ source — may or may not include \begin{tikzpicture} wrapper */
  source: string
  /** Optional extra LaTeX preamble (e.g. \usetikzlibrary{...}) */
  preamble?: string
  className?: string
  /** Caption shown below the figure */
  caption?: string
}

/* ─── Module-level cache  key → data-URL ────────────────────────────────── */
const cache = new Map<string, string>()

function cacheKey(source: string, preamble = "") {
  return `${preamble}||${source}`
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function wrapSource(raw: string, preamble = "") {
  const trimmed = raw.trim()
  const body = trimmed.startsWith("\\begin{tikzpicture}")
    ? trimmed
    : `\\begin{tikzpicture}\n${trimmed}\n\\end{tikzpicture}`

  return `\\documentclass[crop,tikz]{standalone}
\\usepackage{tikz}
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.18}
${preamble}
\\begin{document}
${body}
\\end{document}`
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function TikZFigure({
  source,
  preamble = "",
  className = "",
  caption,
}: TikZFigureProps) {
  const [status,   setStatus]   = useState<Status>("idle")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>("")
  const [attempt,  setAttempt]  = useState(0)          // increment to retry
  const abortRef = useRef<AbortController | null>(null)

  const key = cacheKey(source, preamble)

  useEffect(() => {
    if (!source.trim()) return

    // Serve from cache instantly
    if (cache.has(key)) {
      setImageUrl(cache.get(key)!)
      setStatus("success")
      return
    }

    // Cancel any previous in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    let coldStartTimer: ReturnType<typeof setTimeout>

    ;(async () => {
      setStatus("loading")
      setErrorMsg("")

      // After 4 s assume Render free tier cold-start
      coldStartTimer = setTimeout(() => {
        if (!controller.signal.aborted) setStatus("cold-start")
      }, 4_000)

      try {
        const res = await fetch("/api/tikz", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ latex: wrapSource(source, preamble) }),
          signal:  controller.signal,
        })

        clearTimeout(coldStartTimer)

        if (!res.ok) {
          const body = await res.text().catch(() => "")
          throw new Error(`Service returned ${res.status}${body ? `: ${body}` : ""}`)
        }

        const blob = await res.blob()
        const url  = URL.createObjectURL(blob)
        cache.set(key, url)
        setImageUrl(url)
        setStatus("success")
      } catch (err: any) {
        clearTimeout(coldStartTimer)
        if (err.name === "AbortError") return
        setErrorMsg(err.message ?? "Unknown error")
        setStatus("error")
      }
    })()

    return () => {
      clearTimeout(coldStartTimer)
      controller.abort()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt])

  /* ── Render ──────────────────────────────────────────────────────────── */
  if (status === "idle") return null

  if (status === "loading" || status === "cold-start") {
    return (
      <span className={`flex flex-col items-center gap-2 py-4 ${className}`}>
        <span className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
          <span className="w-4 h-4 border-2 border-emerald-400/60 border-t-emerald-400 rounded-full animate-spin inline-block" />
          {status === "cold-start"
            ? "Waking up render service… (free tier cold start)"
            : "Rendering TikZ…"}
        </span>
        {status === "cold-start" && (
          <span className="text-xs text-zinc-600">This may take up to 30 s on first load.</span>
        )}
      </span>
    )
  }

  if (status === "error") {
    return (
      <span className={`flex flex-col items-center gap-2 py-3 ${className}`}>
        <span className="text-xs text-rose-400 font-mono">TikZ render failed</span>
        <span className="text-xs text-zinc-600 max-w-xs text-center">{errorMsg}</span>
        <button
          onClick={() => setAttempt(n => n + 1)}
          className="text-xs text-emerald-400 hover:underline mt-1"
        >
          Retry ↺
        </button>
        {/* Fallback: show raw source so content isn't lost */}
        <details className="mt-2 w-full max-w-sm">
          <summary className="text-xs text-zinc-600 cursor-pointer hover:text-zinc-400">
            Show source
          </summary>
          <pre className="mt-1 text-xs text-zinc-500 bg-zinc-900 border border-zinc-800
                          rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
            {source}
          </pre>
        </details>
      </span>
    )
  }

  return (
    <span className={`flex flex-col items-center gap-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl!}
        alt={caption ?? "TikZ figure"}
        className="max-w-full h-auto rounded"
        style={{ imageRendering: "crisp-edges" }}
      />
      {caption && (
        <span className="text-xs text-zinc-500 font-mono italic">{caption}</span>
      )}
    </span>
  )
}
