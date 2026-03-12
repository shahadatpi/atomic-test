"use client"

import { useState } from "react"
import { ChevronDown, Pencil, Trash2 } from "lucide-react"
import MathText, { stripTikz } from "@/components/math/MathText"
import { OptionsGrid } from "@/components/shared/OptionsGrid"
import { DiffBadge }  from "./DiffBadge"
import { EditModal }  from "./EditModal"
import { parseInstTag, instColorClass } from "./constants"
import type { Problem } from "@/types"

interface ProblemCardProps {
  problem:  Problem
  number:   number
  onDelete: (id: string) => void
}

export function ProblemCard({ problem: init, number, onDelete }: ProblemCardProps) {
  const [problem,  setProblem]  = useState(init)
  const [expanded, setExpanded] = useState(false)
  const [explOpen, setExplOpen] = useState(false)
  const [editing,  setEditing]  = useState(false)

  return (
    <>
      {editing && (
        <EditModal
          problem={problem}
          onClose={() => setEditing(false)}
          onSave={updated => setProblem(p => ({ ...p, ...updated }))}
        />
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors">

        {/* ── Collapsed header (always visible) ── */}
        <div className="px-5 py-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
          <div className="flex items-start gap-4">

            {/* Number badge */}
            <div className="shrink-0 w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700
                            flex items-center justify-center mt-0.5">
              <span className="text-xs font-mono font-bold text-zinc-500">{number}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Meta row */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-xs text-zinc-600 font-mono">
                  {problem.subjects?.name} · {problem.topics?.name}
                  {problem.subtopics?.name && (
                    <> · <span className="text-zinc-500">{problem.subtopics.name}</span></>
                  )}
                </span>
                <DiffBadge level={problem.difficulty} />
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-mono ${
                  problem.is_free
                    ? "text-sky-400 border-sky-400/30 bg-sky-400/10"
                    : "text-violet-400 border-violet-400/30 bg-violet-400/10"
                }`}>
                  {problem.is_free ? "Free" : "Pro"}
                </span>
                {problem.source && (
                  <span className="text-xs text-zinc-600">{problem.source}</span>
                )}
              </div>

              {/* Question (TikZ stripped when collapsed) */}
              <div className="text-sm text-zinc-200 leading-relaxed">
                {expanded
                  ? <MathText text={problem.question} />
                  : <MathText text={stripTikz(problem.question)} />}
              </div>

              {/* Tags */}
              {problem.tags && problem.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {problem.tags.map(tag => {
                    const parsed = parseInstTag(tag)
                    const colorCls = parsed ? instColorClass(parsed.inst) : ""
                    return (
                      <span key={tag} className={`text-xs px-2 py-0.5 rounded-full border font-mono ${
                        colorCls || "bg-zinc-800 border-zinc-700 text-zinc-500"
                      }`}>
                        {tag}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
              <button onClick={() => setEditing(true)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-600
                           hover:text-violet-400 hover:bg-violet-400/10 transition-colors"
                title="Edit problem">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onDelete(problem.id)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-600
                           hover:text-red-400 hover:bg-red-400/10 transition-colors"
                title="Delete problem">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <ChevronDown className={`w-4 h-4 text-zinc-600 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
            </div>
          </div>
        </div>

        {/* ── Expanded body ── */}
        {expanded && (
          <div className="border-t border-zinc-800 px-5 py-4 space-y-3">

            {/* Options grid — only for MCQ types */}
            {(problem.problem_type?.includes("mcq") && !!problem.option_a) && (
              <OptionsGrid
                variant="admin"
                options={[
                  { key: "a", value: problem.option_a },
                  { key: "b", value: problem.option_b },
                  { key: "c", value: problem.option_c },
                  { key: "d", value: problem.option_d },
                ]}
                revealed={true}
                correctKey={problem.correct_answer}
                disabled={true}
              />
            )}

            {/* Explanation toggle */}
            {problem.explanation && (
              <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <button onClick={() => setExplOpen(e => !e)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-mono
                             text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors">
                  <span className="text-violet-400">EXPLANATION</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${explOpen ? "rotate-180" : ""}`} />
                </button>
                {explOpen && (
                  <div className="px-4 pb-3 pt-1 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800 bg-zinc-950">
                    <MathText text={problem.explanation} />
                  </div>
                )}
              </div>
            )}

            {/* Footer metadata */}
            <p className="text-xs text-zinc-700 font-mono">
              ID: {problem.id} · Added {new Date(problem.created_at ?? "").toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </>
  )
}
