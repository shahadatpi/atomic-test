"use client"

import { useEffect, useState } from "react"
import { ChevronDown, CheckCircle, Loader2, BookOpen, Lock } from "lucide-react"
import MathText from "@/components/math/MathText"
import DifficultyBadge from "./DifficultyBadge"
import type { Problem } from "../types"

// ── Same isCQ logic as admin ──────────────────────────────────────────────
const isCQ = (p: Problem) => {
  if (p.correct_answer) return false
  if (p.problem_type && /cq|written/i.test(p.problem_type)) return true
  return false
}

// ── Same McqOptions as admin ──────────────────────────────────────────────
function McqOptions({
  problem, selected, revealed, onSelect, disabled,
}: {
  problem:  Problem
  selected: string | null
  revealed: boolean
  onSelect: (k: string) => void
  disabled: boolean
}) {
  const opts = (["a","b","c","d"] as const)
    .map(o => ({ key: o, text: (problem[`option_${o}` as keyof Problem] as string) ?? "" }))
    .filter(o => o.text)

  const hasTikz  = opts.some(o => o.text.includes("\\begin{tikzpicture}"))
  const plainLen = (t: string) =>
    t.replace(/\$[^$]*\$/g, "X")
     .replace(/\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}/g, "")
     .trim().length
  const hasLong = !hasTikz && opts.some(o => plainLen(o.text) > 55)

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: hasLong ? "1fr" : "repeat(2, minmax(0, 1fr))" }}
    >
      {opts.map(({ key, text }) => {
        const isCorrect = revealed && problem.correct_answer === key
        const isWrong   = revealed && selected === key && key !== problem.correct_answer
        const isSel     = selected === key
        return (
          <button
            key={key}
            onClick={() => !disabled && !revealed && onSelect(key)}
            className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border text-left text-sm transition-all ${
              isCorrect ? "border-emerald-400 bg-emerald-400/10 text-emerald-300"
              : isWrong ? "border-red-400 bg-red-400/10 text-red-300"
              : isSel   ? "border-zinc-500 bg-zinc-800 text-zinc-100"
              :           "border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/40 text-zinc-300"
            }`}
          >
            <span className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center
                              text-xs font-bold font-mono mt-0.5 ${
              isCorrect ? "bg-emerald-400 text-zinc-950"
              : isWrong ? "bg-red-400 text-white"
              : isSel   ? "bg-zinc-600 text-white"
              :           "bg-zinc-800 text-zinc-500"
            }`}>
              {key.toUpperCase()}
            </span>
            <span className="flex-1 text-xs leading-relaxed">
              <MathText text={text} />
            </span>
            {isCorrect && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
          </button>
        )
      })}
    </div>
  )
}

// ── Same CqOptions as admin ───────────────────────────────────────────────
function getCqExplanations(problem: Problem, count: number): (string | null)[] {
  const fromCols = [
    problem.explanation_a ?? null,
    problem.explanation_b ?? null,
    problem.explanation_c ?? null,
    problem.explanation_d ?? null,
  ].slice(0, count)
  if (fromCols.some(Boolean)) return fromCols

  const result: (string | null)[] = Array(count).fill(null)
  const expl = problem.explanation
  if (!expl) return result

  const LABELS = ["ক","খ","গ","ঘ"]
  const pattern = new RegExp(`(${LABELS.slice(0, count).map(l => `${l}[).]`).join("|")})`, "g")
  const tokens  = expl.split(pattern).map(s => s.trim()).filter(Boolean)
  if (tokens.length <= 1) { result[0] = expl.trim(); return result }

  let current = -1
  for (const token of tokens) {
    const idx = LABELS.findIndex(l => token === `${l})` || token === `${l}.`)
    if (idx !== -1 && idx < count) { current = idx; continue }
    if (current >= 0) result[current] = (result[current] ? result[current] + "\n" : "") + token
  }
  return result
}

function preprocessExplanation(text: string): string {
  let t = text
  t = t.replace(/\\(?:sub)*section\*?\{([^}]*)\}/g, "**$1**")
  t = t.replace(/\\begin\{equation\*?\}([\s\S]*?)\\end\{equation\*?\}/g, (_, b) => `$$${b.trim()}$$`)
  t = t.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g, (_, b) => `$$\\begin{aligned}${b.trim()}\\end{aligned}$$`)
  t = t.replace(/\\\\/g, "\n")
  return t
}

function CqOptions({ problem, isPremium }: { problem: Problem; isPremium: boolean }) {
  const allParts = (["a","b","c","d"] as const).map((o, i) => ({
    key: o, idx: i,
    label: ["ক","খ","গ","ঘ"][i],
    marks: ["১","২","৩","৪"][i],
    text: (problem[`option_${o}` as keyof Problem] as string) ?? "",
  }))
  const explanations = getCqExplanations(problem, 4)
  const parts = allParts.filter(p => p.text || explanations[p.idx])
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  if (parts.length === 0) return null

  const canSeeExpl = isPremium

  return (
    <div className="rounded-xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
      {parts.map(({ label, marks, text, idx }) => {
        const expl   = explanations[idx]
        const isOpen = openIdx === idx
        return (
          <div key={label}>
            <div className="flex items-center min-h-[40px]">
              <span className="shrink-0 w-9 flex items-center justify-center self-stretch
                               border-r border-zinc-800/60 font-bold text-sm text-violet-400">
                {label}
              </span>
              <span className="flex-1 text-zinc-300 leading-snug px-3 py-2 text-xs">
                <MathText text={text} />
              </span>
              <span className="shrink-0 w-8 flex items-center justify-center self-stretch
                               border-l border-zinc-800/60 text-xs font-mono text-zinc-500">
                {marks}
              </span>
              <button
                onClick={() => expl && canSeeExpl && setOpenIdx(isOpen ? null : idx)}
                className={`shrink-0 flex items-center gap-1 self-stretch px-3
                            border-l border-zinc-800/60 text-[11px] font-mono
                            transition-colors whitespace-nowrap ${
                  !canSeeExpl
                    ? "text-violet-400/60 cursor-pointer"
                    : expl
                      ? isOpen
                        ? "text-amber-400 bg-zinc-800/50 cursor-pointer"
                        : "text-amber-400/70 hover:text-amber-400 hover:bg-zinc-800/40 cursor-pointer"
                      : "text-zinc-700 cursor-default"
                }`}
              >
                {!canSeeExpl
                  ? <><Lock className="w-3 h-3" /></>
                  : <>সমাধান{expl
                      ? <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                      : <ChevronDown className="w-3 h-3 ml-0.5 opacity-30" />
                    }</>
                }
              </button>
            </div>
            {expl && isOpen && canSeeExpl && (
              <div className="px-4 py-3 text-sm text-zinc-300 leading-relaxed bg-zinc-950/60 border-t border-zinc-800/60">
                <MathText text={preprocessExplanation(expl)} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Lock banner for non-premium MCQ explanation ───────────────────────────
function ExplanationLocked() {
  return (
    <div className="border border-violet-400/20 bg-violet-400/5 rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="shrink-0 w-7 h-7 rounded-lg bg-violet-400/10 border border-violet-400/20 flex items-center justify-center">
        <Lock className="w-3.5 h-3.5 text-violet-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-violet-300">ব্যাখ্যা দেখতে Pro Plan নিন।</p>
        <p className="text-xs text-zinc-500 mt-0.5">Upgrade to Pro to unlock explanations.</p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────
interface ProblemCardProps {
  problem:       Problem | null
  firstProblem:  Problem | undefined
  onSubmit:      (problem: Problem, answer: string, correct: boolean) => Promise<void>
  onSelectFirst: (p: Problem) => void
  isPremium?:    boolean
}

export default function ProblemCard({
  problem, firstProblem, onSubmit, onSelectFirst, isPremium = false,
}: ProblemCardProps) {
  const [selected,  setSelected]  = useState<string | null>(null)
  const [revealed,  setRevealed]  = useState(false)
  const [explOpen,  setExplOpen]  = useState(false)
  const [saving,    setSaving]    = useState(false)

  useEffect(() => {
    setSelected(null); setRevealed(false); setExplOpen(false)
  }, [problem?.id])

  if (!problem) return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-3">
      <BookOpen className="w-10 h-10 text-zinc-600" />
      <p className="text-zinc-500">Select a problem to start practicing</p>
      {firstProblem && (
        <button onClick={() => onSelectFirst(firstProblem)} className="text-emerald-400 text-sm hover:underline">
          Start with first problem →
        </button>
      )}
    </div>
  )

  const cq = isCQ(problem)
  const canSeeExplanation = isPremium

  const handleSubmit = async () => {
    if (!selected) return
    setRevealed(true); setSaving(true)
    await onSubmit(problem, selected, selected === problem.correct_answer)
    setSaving(false)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <DifficultyBadge difficulty={problem.difficulty} className="rounded-full border" />
          <span className="text-xs text-zinc-600 font-mono">
            {problem.subjects?.name}{problem.topics?.name ? ` · ${problem.topics.name}` : ""}
          </span>
          {cq ? (
            <span className="text-xs font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">CQ</span>
          ) : (
            <span className="text-xs font-mono text-sky-400 bg-sky-400/10 border border-sky-400/20 px-2 py-0.5 rounded-full">MCQ</span>
          )}
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-mono shrink-0 ${
          problem.is_free
            ? "text-sky-400 border-sky-400/30 bg-sky-400/10"
            : "text-violet-400 border-violet-400/30 bg-violet-400/10"
        }`}>{problem.is_free ? "Free" : "Pro"}</span>
      </div>

      {/* Question */}
      <div className="text-zinc-200 text-sm leading-relaxed">
        <MathText text={problem.question} />
      </div>

      {/* CQ */}
      {cq ? (
        <CqOptions problem={problem} isPremium={isPremium} />
      ) : (
        <>
          <McqOptions
            problem={problem}
            selected={selected}
            revealed={revealed}
            onSelect={setSelected}
            disabled={revealed}
          />

          {/* MCQ explanation after reveal */}
          {revealed && problem.explanation && (
            canSeeExplanation ? (
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
            ) : <ExplanationLocked />
          )}

          {/* Submit */}
          <div className="pt-1">
            {!revealed ? (
              <button onClick={handleSubmit} disabled={!selected || saving}
                className="w-full bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed
                           hover:bg-emerald-300 text-zinc-950 font-semibold text-sm py-3 rounded-xl
                           transition-colors flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Submit Answer"}
              </button>
            ) : (
              <p className="text-center text-xs text-zinc-600 font-mono pt-1">← Pick the next problem from the list</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
