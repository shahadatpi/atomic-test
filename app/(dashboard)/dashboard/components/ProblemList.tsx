"use client"

import { CheckCircle, XCircle, ChevronRight, RefreshCw, Loader2 } from "lucide-react"
import DifficultyBadge from "./DifficultyBadge"
import type { Problem, Attempt } from "../types"

interface ProblemListProps {
  problems: Problem[]
  attempts: Attempt[]
  activeProblemId: string | undefined
  loading: boolean
  onSelect: (p: Problem) => void
  onRefresh: () => void
}

export default function ProblemList({
  problems,
  attempts,
  activeProblemId,
  loading,
  onSelect,
  onRefresh,
}: ProblemListProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
          Problems
        </span>
        <button
          onClick={onRefresh}
          className="text-zinc-600 hover:text-zinc-300 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
        </div>
      ) : problems.length === 0 ? (
        <div className="px-4 py-8 text-center text-zinc-600 text-sm">No problems found</div>
      ) : (
        <div className="divide-y divide-zinc-800/60 max-h-[500px] overflow-y-auto">
          {problems.map((p, i) => {
            const attemptForProblem = attempts.find(a => a.problem_id === p.id)
            const attempted = !!attemptForProblem
            const correct   = attemptForProblem?.is_correct

            return (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className={`w-full px-4 py-3 text-left hover:bg-zinc-800/50 transition-colors ${
                  activeProblemId === p.id
                    ? "bg-zinc-800 border-l-2 border-emerald-400"
                    : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs font-mono text-zinc-700 mt-0.5 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                      {p.question.replace(/\$[^$]*\$/g, "[math]").slice(0, 80)}…
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <DifficultyBadge difficulty={p.difficulty} />
                      {attempted && (
                        correct
                          ? <CheckCircle className="w-3 h-3 text-emerald-400" />
                          : <XCircle    className="w-3 h-3 text-rose-400"    />
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-700 shrink-0 mt-0.5" />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
