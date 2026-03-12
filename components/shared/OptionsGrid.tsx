"use client"

import { CheckCircle, XCircle } from "lucide-react"
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

// Commands that make an option visually wide/tall → force 1-col
const WIDE_COMMANDS = [
  "\\vec", "\\hat", "\\bar", "\\tilde", "\\dot", "\\ddot",
  "\\overline", "\\underline", "\\frac", "\\dfrac", "\\tfrac",
  "\\sqrt", "\\sum", "\\int", "\\oint", "\\prod",
  "\\begin", "\\matrix", "\\pmatrix", "\\bmatrix",
]

function needsOneCol(options: OptionItem[]): boolean {
  return options.some(({ value }) => {
    // Contains wide math construct
    if (WIDE_COMMANDS.some(cmd => value.includes(cmd))) return true
    // Non-ASCII (Bangla etc) — each char is visually much wider
    if (/[^\x00-\x7F]/.test(value) && value.length > 8) return true
    // Plain long ASCII string
    if (value.length > 25) return true
    return false
  })
}

export function OptionsGrid({
  options, selected, revealed, correctKey,
  disabled, onSelect, variant = "exam",
}: OptionsGridProps) {
  const oneCol = needsOneCol(options)
  if (typeof window !== "undefined") {
    console.log("[OptionsGrid]", { oneCol, values: options.map(o => o.value) })
  }

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
    <div className={`grid gap-2 ${oneCol ? "grid-cols-1" : "grid-cols-2"}`}>
      {options.map(({ key, value }) => {
        const isCorrect = revealed && key === correctKey
        const isWrong   = revealed && key === selected && key !== correctKey
        return (
          <button
            key={key}
            onClick={() => !disabled && !revealed && onSelect?.(key)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border
                        text-left text-sm transition-all ${buttonClass(key)}`}
          >
            <span className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center
                              text-xs font-mono font-bold uppercase ${badgeClass(key)}`}>
              {key}
            </span>
            <span className="flex-1 text-xs leading-snug min-w-0">
              <MathText text={value} />
            </span>
            {isCorrect && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            {isWrong   && <XCircle    className="w-3.5 h-3.5 text-red-400 shrink-0" />}
          </button>
        )
      })}
    </div>
  )
}
