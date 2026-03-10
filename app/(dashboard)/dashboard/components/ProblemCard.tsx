"use client"

import { useEffect, useState } from "react"
import { CheckCircle, XCircle, Loader2, BookOpen } from "lucide-react"
import MathText from "../../../../components/math/MathText"
import DifficultyBadge from "./DifficultyBadge"
import type { Problem } from "../types"

interface ProblemCardProps {
  problem: Problem | null
  firstProblem: Problem | undefined
  onSubmit: (problem: Problem, answer: string, correct: boolean) => Promise<void>
  onSelectFirst: (p: Problem) => void
}

export default function ProblemCard({
                                      problem,
                                      firstProblem,
                                      onSubmit,
                                      onSelectFirst,
                                    }: ProblemCardProps) {
  const [selected,  setSelected]  = useState<string | null>(null)
  const [revealed,  setRevealed]  = useState(false)
  const [showHint,  setShowHint]  = useState(false)
  const [saving,    setSaving]    = useState(false)

  // ✅ Reset state when the problems changes
  useEffect(() => {
    setSelected(null)
    setRevealed(false)
    setShowHint(false)
  }, [problem?.id])

  if (!problem) {
    return (
        <div className="bg-card border border-border rounded-xl p-12
                      flex flex-col items-center justify-center text-center space-y-3">
          <BookOpen className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-muted-foreground/70">Select a problem to start practicing</p>
          {firstProblem && (
              <button
                  onClick={() => onSelectFirst(firstProblem)}
                  className="text-emerald-400 text-sm hover:underline"
              >
                Start with first problem →
              </button>
          )}
        </div>
    )
  }

  const handleSubmit = async () => {
    if (!selected) return
    const correct = selected === problem.correct_answer
    setRevealed(true)
    setSaving(true)
    await onSubmit(problem, selected, correct)
    setSaving(false)
  }

  return (
      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DifficultyBadge difficulty={problem.difficulty} className="rounded-full border" />
            <span className="text-xs text-muted-foreground/50">
            {problem.subjects?.name} · {problem.topics?.name}
          </span>
          </div>
          {!problem.is_free && (
              <span className="text-xs text-violet-400 border border-violet-400/30
                           bg-violet-400/10 px-2.5 py-1 rounded-full font-mono">
            Pro
          </span>
          )}
        </div>

        {/* Standard/board tags */}
        {problem.tags && problem.tags.length > 0 && (() => {
          const STANDARD_TAGS = ["Board", "DU", "BUET", "CKRUET", "SUST", "Medical"]
          const standardTags = problem.tags.filter((t: string) => STANDARD_TAGS.includes(t))
          if (standardTags.length === 0) return null
          return (
            <div className="flex flex-wrap gap-1.5">
              {standardTags.map((tag: string) => (
                <span key={tag} className="text-[11px] font-mono font-medium text-violet-300 bg-violet-400/10 border border-violet-400/20 px-2.5 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )
        })()}

        {/* Question */}
        <div className="text-foreground text-base leading-relaxed">
          <MathText text={problem.question} />
        </div>

        {/* Options — 2×2 grid */}
        <div className="grid grid-cols-2 gap-2">
          {(["a", "b", "c", "d"] as const).map(key => {
            const value     = problem[`option_${key}`]
            const isCorrect = revealed && key === problem.correct_answer
            const isWrong   = revealed && key === selected && key !== problem.correct_answer

            return (
                <button
                    key={key}
                    onClick={() => { if (!revealed) setSelected(key) }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border
                          text-left text-sm transition-all ${
                        isCorrect       ? "border-emerald-400 bg-emerald-400/10 text-emerald-300"
                            : isWrong       ? "border-red-400    bg-red-400/10    text-red-300"
                                : selected===key? "border-zinc-500   bg-muted      text-foreground"
                                    :                 "border-border hover:border-muted-foreground/40 hover:bg-muted/40 text-foreground/80"
                    }`}
                >
              <span className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center
                                text-xs font-mono font-bold uppercase ${
                  isCorrect       ? "bg-emerald-400 text-zinc-950"
                      : isWrong       ? "bg-red-400    text-foreground"
                          : selected===key? "bg-zinc-600   text-foreground"
                              :                 "bg-muted   text-muted-foreground/70"
              }`}>
                {key}
              </span>
                  <span className="flex-1 text-xs leading-snug">
                <MathText text={value} />
              </span>
                  {isCorrect && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  {isWrong   && <XCircle    className="w-3.5 h-3.5 text-red-400    shrink-0" />}
                </button>
            )
          })}
        </div>

        {/* Hint toggle */}
        {!revealed && problem.hint && (
            <button
                onClick={() => setShowHint(h => !h)}
                className="text-xs text-muted-foreground/70 hover:text-foreground/80 transition-colors"
            >
              {showHint ? "Hide hint ↑" : "Show hint ↓"}
            </button>
        )}
        {showHint && problem.hint && (
            <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl px-4 py-3 text-sm text-amber-300/80">
              <p className="text-xs text-amber-400 font-mono mb-1">HINT</p>
              <MathText text={problem.hint} />
            </div>
        )}

        {/* Explanation */}
        {revealed && problem.explanation && (
            <div className="border-t border-border pt-4 space-y-2">
              <p className="text-xs text-emerald-400 font-mono">EXPLANATION</p>
              <div className="text-muted-foreground text-sm leading-relaxed">
                <MathText text={problem.explanation} />
              </div>
            </div>
        )}

        {/* Action */}
        <div className="pt-1">
          {!revealed ? (
              <button
                  onClick={handleSubmit}
                  disabled={!selected || saving}
                  className="w-full bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed
                       hover:bg-emerald-300 text-zinc-950 font-semibold text-sm py-3 rounded-xl
                       transition-colors flex items-center justify-center gap-2"
              >
                {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    : "Submit Answer"}
              </button>
          ) : (
              <p className="text-center text-xs text-muted-foreground/50 font-mono pt-1">
                ← Pick the next problem from the list
              </p>
          )}
        </div>
      </div>
  )
}
