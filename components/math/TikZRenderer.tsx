"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react"

const cache = new Map<string, string>()

interface Props {
  code:     string
  caption?: string
}

export default function TikZRenderer({ code, caption }: Props) {
  const [url,     setUrl]     = useState<string | null>(cache.get(code) ?? null)
  const [loading, setLoading] = useState(!cache.has(code))
  const [error,   setError]   = useState<string | null>(null)
  const [slow,    setSlow]    = useState(false)
  const [showRaw, setShowRaw] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (cache.has(code)) {
      setUrl(cache.get(code)!)
      setLoading(false)
      return
    }

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)
    setUrl(null)
    setSlow(false)

    // Show "waking up server" message after 4s (Render.com cold start)
    const slowTimer = setTimeout(() => setSlow(true), 4000)

    fetch("/api/tikz", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      // ✅ FIXED: was { tikz: code } — API expects { code }
      body:    JSON.stringify({ code }),
      signal:  abortRef.current.signal,
    })
      .then(async res => {
        clearTimeout(slowTimer)
        setSlow(false)

        if (!res.ok) {
          const text = await res.text()
          throw new Error(`HTTP ${res.status}: ${text}`)
        }

        const contentType = res.headers.get("Content-Type") ?? ""
        const blob = await res.blob()
        // Tag the cached URL so we know if it's a PDF
        const objectUrl = URL.createObjectURL(blob)
        const tagged = contentType.includes("pdf") ? `__PDF__${objectUrl}` : objectUrl
        cache.set(code, tagged)
        setUrl(tagged)
        setLoading(false)
      })
      .catch(e => {
        clearTimeout(slowTimer)
        if (e.name === "AbortError") return
        setError(String(e))
        setLoading(false)
        setSlow(false)
      })

    return () => {
      abortRef.current?.abort()
      clearTimeout(slowTimer)
    }
  }, [code])

  const retry = () => {
    cache.delete(code)
    setLoading(true)
    setError(null)
    setUrl(null)
  }

  if (loading) return (
    <figure className="flex flex-col items-center justify-center my-4 w-full">
      <div className="flex items-center gap-2 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
        <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
        <span className="text-xs text-zinc-500 font-mono">
          {slow ? "Waking up render server…" : "Rendering…"}
        </span>
      </div>
    </figure>
  )

  if (error) return (
    <div className="my-4 bg-zinc-900 border border-red-400/30 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800">
        <div className="flex items-center gap-2 text-red-400 text-xs">
          <AlertTriangle className="w-3.5 h-3.5" />
          TikZ render failed
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRaw(r => !r)}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            {showRaw ? "Hide" : "Show"} error
          </button>
          <button
            onClick={retry}
            className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      </div>
      {showRaw && (
        <pre className="px-4 py-3 text-xs text-zinc-500 font-mono overflow-x-auto whitespace-pre-wrap">
          {error}
        </pre>
      )}
    </div>
  )

  // PDF fallback (ImageMagick unavailable on server)
  const isPdf = url?.startsWith("__PDF__")
  const actualUrl = isPdf ? url!.slice(7) : url
  if (isPdf) return (
    <figure className="my-4 flex flex-col items-center">
      <iframe
        src={actualUrl!}
        title={caption ?? "TikZ diagram"}
        className="w-full h-72 rounded-lg border border-zinc-800 bg-white"
      />
      {caption && <figcaption className="text-xs text-zinc-600 mt-2 italic">{caption}</figcaption>}
    </figure>
  )

  return (
    <figure className="flex flex-col items-center justify-center my-4 w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={actualUrl!}
        alt={caption ?? "TikZ diagram"}
        className="rounded-lg bg-white p-2 border border-zinc-800 max-h-64"
        style={{ imageRendering: "crisp-edges", width: "auto", maxWidth: "100%" }}
      />
      {caption && <figcaption className="text-xs text-zinc-600 mt-2 italic text-center">{caption}</figcaption>}
    </figure>
  )
}
