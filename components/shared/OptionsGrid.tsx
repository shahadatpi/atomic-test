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

export function OptionsGrid({
  options, selected, revealed, correctKey,
  disabled, onSelect, variant = "exam",
}: OptionsGridProps) {
  const probeRef = useRef<HTMLDivElement>(null)
  const [oneCol, setOneCol] = useState(false)

  // Start in 2-col, measure after KaTeX renders, switch to 1-col if any cell overflows
  useEffect(() => {
    const el = probeRef.current
    if (!el) return

    const check = () => {
      const cells = el.querySelectorAll<HTMLElement>("[data-option-cell]")
      let overflow = false
      cells.forEach(cell => {
        if (cell.scrollWidth > cell.clientWidth + 2) overflow = true
      })
      setOneCol(overflow)
    }

    // Wait for KaTeX to finish rendering (~2 frames)
    let raf1 = requestAnimationFrame(() => {
      let raf2 = requestAnimationFrame(check)
      return () => cancelAnimationFrame(raf2)
    })

    const ro = new ResizeObserver(check)
    ro.observe(el)

    return () => {
      cancelAnimationFrame(raf1)
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
    <div ref={probeRef} className={`grid gap-2 ${oneCol ? "grid-cols-1" : "grid-cols-2"}`}>
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
            <span data-option-cell className="flex-1 text-xs leading-relaxed min-w-0 overflow-hidden">
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
