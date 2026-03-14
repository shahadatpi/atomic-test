"use client"

import { CheckCircle, XCircle } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import MathText from "@/components/math/MathText"

export interface OptionItem {
  key:   "a" | "b" | "c" | "d"
  value: string
}

interface OptionsGridProps {
  options:     OptionItem[]
  selected?:   string | null
  revealed?:   boolean
  correctKey?: string
  disabled?:   boolean
  onSelect?:   (key: string) => void
  variant?:    "exam" | "practice" | "admin"
}

// If any option raw text exceeds this many chars → 1-col immediately
const CHAR_THRESHOLD = 55

function hasLongOption(options: OptionItem[]) {
  return options.some(o => (o.value ?? "").replace(/\$[^$]*\$/g, "XX").length > CHAR_THRESHOLD)
}

export function OptionsGrid({
  options, selected, revealed, correctKey,
  disabled, onSelect, variant = "exam",
}: OptionsGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)

  // Default to 2-col; only go 1-col if we detect long content
  const [oneCol, setOneCol] = useState(false)

  useEffect(() => {
    // Fast path: long raw text → 1-col immediately
    if (hasLongOption(options)) {
      setOneCol(true)
      return
    }

    setOneCol(false) // reset to 2-col first

    const el = gridRef.current
    if (!el) return

    const check = () => {
      if (!el) return

      // Force 2-col layout temporarily so we can measure accurately
      el.classList.remove("grid-cols-1")
      el.classList.add("grid-cols-2")

      let needsOneCol = false

      // Check each cell: clone it without overflow-hidden to measure natural width
      const cells = el.querySelectorAll<HTMLElement>("[data-option-cell]")
      cells.forEach(cell => {
        // The cell's natural scrollWidth vs its constrained clientWidth
        // Remove overflow-hidden temporarily
        cell.style.overflow = "visible"
        if (cell.scrollWidth > cell.clientWidth + 2) {
          needsOneCol = true
        }
        cell.style.overflow = ""
      })

      // Also: if any button height > 72px, content is wrapping heavily
      const buttons = el.querySelectorAll<HTMLElement>("button")
      buttons.forEach(btn => {
        if (btn.offsetHeight > 72) needsOneCol = true
      })

      // Restore correct layout
      el.classList.remove("grid-cols-2")
      if (needsOneCol) {
        el.classList.add("grid-cols-1")
      }
      setOneCol(needsOneCol)
    }

    // Wait 2 frames for KaTeX to finish rendering
    let raf = requestAnimationFrame(() => requestAnimationFrame(check))

    const ro = new ResizeObserver(() => requestAnimationFrame(check))
    ro.observe(el)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [options])

  const buttonClass = (key: string) => {
    const isCorrect = revealed && key === correctKey
    const isWrong   = revealed && key === selected && key !== correctKey
    const isSel     = selected === key

    if (variant === "exam") {
      return isCorrect ? "border-emerald-400 bg-emerald-400/10 text-emerald-300"
           : isWrong   ? "border-red-400 bg-red-400/10 text-red-300"
           : isSel     ? "border-zinc-500 bg-zinc-800 text-zinc-100"
           :             "border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/40 text-zinc-300"
    }
    if (variant === "practice") {
      return isCorrect ? "border-emerald-400 bg-emerald-400/10 text-emerald-300"
           : isWrong   ? "border-red-400 bg-red-400/10 text-red-300"
           : isSel     ? "border-zinc-500 bg-muted text-foreground"
           :             "border-border hover:border-muted-foreground/40 hover:bg-muted/40 text-foreground/80"
    }
    // admin
    return isCorrect ? "border-emerald-400/40 bg-emerald-400/5 text-emerald-300"
         :             "border-zinc-800 text-zinc-400"
  }

  const badgeClass = (key: string) => {
    const isCorrect = revealed && key === correctKey
    const isWrong   = revealed && key === selected && key !== correctKey
    const isSel     = selected === key
    return isCorrect ? "bg-emerald-400 text-zinc-950"
         : isWrong   ? "bg-red-400 text-white"
         : isSel     ? "bg-zinc-600 text-white"
         :             "bg-zinc-800 text-zinc-500"
  }

  return (
    <div
      ref={gridRef}
      className={`grid gap-2 ${oneCol ? "grid-cols-1" : "grid-cols-2"}`}
    >
      {options.map(({ key, value }) => {
        const isCorrect = revealed && key === correctKey
        const isWrong   = revealed && key === selected && key !== correctKey
        return (
          <button
            key={key}
            onClick={() => !disabled && !revealed && onSelect?.(key)}
            className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border
                        text-left text-sm transition-all ${buttonClass(key)}`}
          >
            <span className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center
                              text-xs font-mono font-bold uppercase mt-0.5 ${badgeClass(key)}`}>
              {key}
            </span>
            <span
              data-option-cell
              className="flex-1 text-xs leading-relaxed min-w-0 overflow-hidden"
            >
              <MathText text={value} />
            </span>
            {isCorrect && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />}
            {isWrong   && <XCircle    className="w-3.5 h-3.5 text-red-400    shrink-0 mt-0.5" />}
          </button>
        )
      })}
    </div>
  )
}
