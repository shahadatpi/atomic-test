"use client"

import { useState, useCallback } from "react"
import {
  BookOpen, Hash, ChevronDown, Shuffle, CheckCircle,
  XCircle, Loader2, RotateCcw, ChevronLeft, ChevronRight,
  Lock, Clock, Target, Layers
} from "lucide-react"
import MathText from "@/components/math/MathText"
import supabase from "@/lib/supabase"
import type { Problem, Attempt, Subject, Topic } from "../types"
import DifficultyBadge from "./DifficultyBadge"

// ── Types ─────────────────────────────────────────────────────────────────
type PracticePhase = "setup" | "practice"

interface PracticeConfig {
  subjectId:     string
  subjectName:   string
  topicId:       string   // "" = all topics
  topicName:     string
  questionCount: number
  difficulty:    "any" | "easy" | "medium" | "hard"
}

interface PracticeTabProps {
  subjects:        Subject[]
  topics:          Topic[]
  attempts:        Attempt[]
  isPremium:       boolean
  onSaveAttempt:   (problem: Problem, answer: string, correct: boolean) => Promise<void>
}

// ── Constants ─────────────────────────────────────────────────────────────
const DIFFICULTIES = [
  { value: "any",    label: "Any",    color: "border-zinc-700 text-zinc-300"          },
  { value: "easy",   label: "Easy",   color: "border-emerald-400/50 text-emerald-400" },
  { value: "medium", label: "Medium", color: "border-amber-400/50 text-amber-400"     },
  { value: "hard",   label: "Hard",   color: "border-red-400/50 text-red-400"         },
]

const QUICK_COUNTS = [5, 10, 20, 30, 50]

// ── Lock banner ───────────────────────────────────────────────────────────
function ExplanationLocked() {
  return (
    <div className="mt-2 border border-violet-400/20 bg-violet-400/5 rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="shrink-0 w-7 h-7 rounded-lg bg-violet-400/10 border border-violet-400/20 flex items-center justify-center">
        <Lock className="w-3.5 h-3.5 text-violet-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-violet-300">ব্যাখ্যা দেখতে Pro প্রয়োজন</p>
        <p className="text-xs text-zinc-500 mt-0.5">Upgrade to Pro to unlock explanations.</p>
      </div>
    </div>
  )
}

// ── Setup Screen ──────────────────────────────────────────────────────────
function PracticeSetup({
  subjects, topics, onStart,
}: {
  subjects: Subject[]
  topics:   Topic[]
  onStart:  (cfg: PracticeConfig) => void
}) {
  const [subjectId,     setSubjectId]     = useState("")
  const [topicId,       setTopicId]       = useState("")
  const [questionCount, setQuestionCount] = useState(10)
  const [difficulty,    setDifficulty]    = useState<"any"|"easy"|"medium"|"hard">("any")
  const [countError,    setCountError]    = useState("")

  const filteredTopics  = topics.filter(t => t.subject_id === subjectId)
  const selectedSubject = subjects.find(s => s.id === subjectId)
  const selectedTopic   = topics.find(t => t.id === topicId)

  const canStart = !!subjectId && questionCount >= 1 && questionCount <= 100

  const handleCount = (v: number) => {
    setQuestionCount(v)
    setCountError(v < 1 ? "Min 1" : v > 100 ? "Max 100" : "")
  }

  const handleStart = () => {
    if (!canStart || !selectedSubject) return
    onStart({
      subjectId,
      subjectName:   selectedSubject.name,
      topicId,
      topicName:     selectedTopic?.name ?? "All Topics",
      questionCount,
      difficulty,
    })
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg space-y-5">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-violet-500 rounded-2xl flex items-center justify-center mx-auto">
            <Target className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Practice Session</h1>
          <p className="text-sm text-zinc-500">Self-paced, no timer — just focus</p>
        </div>

        {/* Config card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">

          {/* Subject */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Subject
            </label>
            <div className="relative">
              <select value={subjectId} onChange={e => { setSubjectId(e.target.value); setTopicId("") }}
                className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition-all cursor-pointer">
                <option value="">Select a subject…</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          {/* Topic — optional */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Topic
              <span className="text-zinc-600 font-normal">(optional — leave blank for all)</span>
            </label>
            <div className="relative">
              <select value={topicId} onChange={e => setTopicId(e.target.value)} disabled={!subjectId}
                className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                <option value="">All topics (random)</option>
                {filteredTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          {/* Question count */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" /> Number of Questions
              <span className="text-zinc-600 font-normal">(1–100)</span>
            </label>
            {/* Quick picks */}
            <div className="flex gap-2 mb-2 flex-wrap">
              {QUICK_COUNTS.map(n => (
                <button key={n} onClick={() => handleCount(n)} type="button"
                  className={`px-3 py-1 rounded-lg border text-xs font-mono transition-all ${
                    questionCount === n
                      ? "border-violet-400 bg-violet-400/10 text-violet-300"
                      : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                  }`}>
                  {n}
                </button>
              ))}
            </div>
            <input type="number" min={1} max={100} value={questionCount}
              onChange={e => handleCount(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all"
            />
            {countError && <p className="text-xs text-red-400 mt-1">{countError}</p>}
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Difficulty</label>
            <div className="grid grid-cols-4 gap-2">
              {DIFFICULTIES.map(opt => (
                <button key={opt.value} type="button" onClick={() => setDifficulty(opt.value as any)}
                  className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                    difficulty === opt.value
                      ? opt.color + " bg-zinc-800 scale-[1.02]"
                      : "border-zinc-800 text-zinc-500 hover:bg-zinc-800/40"
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          {subjectId && questionCount >= 1 && (
            <div className="bg-violet-400/5 border border-violet-400/20 rounded-xl px-4 py-3 text-xs text-violet-300 space-y-1">
              <p>📚 {selectedSubject?.name} → {selectedTopic?.name ?? "All Topics"}</p>
              <p>📝 {questionCount} questions · No time limit</p>
              <p>🎯 {difficulty === "any" ? "Any difficulty" : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</p>
            </div>
          )}

          <button onClick={handleStart} disabled={!canStart}
            className="w-full bg-violet-500 hover:bg-violet-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            <Shuffle className="w-4 h-4" /> Start Practice →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Practice Screen ───────────────────────────────────────────────────────
function PracticeScreen({
  problems, isPremium, onSaveAttempt, onFinish,
}: {
  problems:      Problem[]
  isPremium:     boolean
  onSaveAttempt: (problem: Problem, answer: string, correct: boolean) => Promise<void>
  onFinish:      () => void
}) {
  const [idx,       setIdx]       = useState(0)
  const [answers,   setAnswers]   = useState<Record<string, string>>({})
  const [revealed,  setRevealed]  = useState<Record<string, boolean>>({})
  const [saving,    setSaving]    = useState(false)
  const [explOpen,  setExplOpen]  = useState<Record<string, boolean>>({})

  const problem    = problems[idx]
  const selected   = answers[problem.id]   ?? null
  const isRevealed = revealed[problem.id]  ?? false
  const answered   = Object.keys(answers).length
  const progress   = Math.round((answered / problems.length) * 100)

  const handleSelect = (key: string) => {
    if (isRevealed) return
    setAnswers(a => ({ ...a, [problem.id]: key }))
  }

  const handleSubmit = async () => {
    if (!selected || isRevealed) return
    setRevealed(r => ({ ...r, [problem.id]: true }))
    setSaving(true)
    await onSaveAttempt(problem, selected, selected === problem.correct_answer)
    setSaving(false)
  }

  const opts = (["a","b","c","d"] as const).filter(k => !!problem[`option_${k}`])

  const hasTikz  = opts.some(k => problem[`option_${k}`]?.includes("\\begin{tikzpicture}"))
  const plainLen = (t: string) => t.replace(/\$[^$]*\$/g, "X").replace(/\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}/g, "").trim().length
  const hasLong  = !hasTikz && opts.some(k => plainLen(problem[`option_${k}`] ?? "") > 55)

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <button onClick={onFinish}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Setup
        </button>
        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-violet-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-xs text-zinc-500 font-mono shrink-0">{answered}/{problems.length}</span>
      </div>

      {/* Question counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-600">{idx + 1} / {problems.length}</span>
          <DifficultyBadge difficulty={problem.difficulty} />
          <span className="text-xs text-zinc-600">{problem.subjects?.name} · {problem.topics?.name}</span>
        </div>
        {/* Nav arrows */}
        <div className="flex items-center gap-1">
          <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setIdx(i => Math.min(problems.length - 1, i + 1))} disabled={idx === problems.length - 1}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Question card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">

        {/* Question text */}
        <div className="text-sm text-zinc-100 leading-relaxed">
          <MathText text={problem.question} />
        </div>

        {/* Options */}
        <div className="grid gap-2" style={{ gridTemplateColumns: hasLong ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
          {opts.map(key => {
            const value     = problem[`option_${key}`]!
            const isCorrect = isRevealed && key === problem.correct_answer
            const isWrong   = isRevealed && key === selected && key !== problem.correct_answer
            const isSel     = selected === key
            return (
              <button key={key} onClick={() => handleSelect(key)}
                className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border text-left text-sm transition-all ${
                  isCorrect ? "border-emerald-400 bg-emerald-400/10 text-emerald-300"
                  : isWrong ? "border-red-400 bg-red-400/10 text-red-300"
                  : isSel   ? "border-zinc-500 bg-zinc-800 text-zinc-100"
                  :           "border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/40 text-zinc-300"
                }`}>
                <span className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center text-xs font-bold font-mono mt-0.5 ${
                  isCorrect ? "bg-emerald-400 text-zinc-950"
                  : isWrong ? "bg-red-400 text-white"
                  : isSel   ? "bg-zinc-600 text-white"
                  :           "bg-zinc-800 text-zinc-500"
                }`}>{key.toUpperCase()}</span>
                <span className="flex-1 text-xs leading-relaxed"><MathText text={value} /></span>
                {isCorrect && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                {isWrong   && <XCircle    className="w-4 h-4 text-red-400    shrink-0 mt-0.5" />}
              </button>
            )
          })}
        </div>

        {/* Explanation */}
        {isRevealed && problem.explanation && (
          isPremium ? (
            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <button onClick={() => setExplOpen(e => ({ ...e, [problem.id]: !e[problem.id] }))}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors">
                <span className="text-violet-400">EXPLANATION</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${explOpen[problem.id] ? "rotate-180" : ""}`} />
              </button>
              {explOpen[problem.id] && (
                <div className="px-4 pb-3 pt-1 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800 bg-zinc-950">
                  <MathText text={problem.explanation} />
                </div>
              )}
            </div>
          ) : <ExplanationLocked />
        )}

        {/* Submit / next */}
        {!isRevealed ? (
          <button onClick={handleSubmit} disabled={!selected || saving}
            className="w-full bg-violet-500 hover:bg-violet-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Submit Answer"}
          </button>
        ) : (
          idx < problems.length - 1 ? (
            <button onClick={() => setIdx(i => i + 1)}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              Next Question <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-xl px-4 py-3 text-center">
                <p className="text-emerald-400 font-semibold text-sm">Session Complete! 🎉</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {Object.values(answers).filter((a, i) => a === problems[i]?.correct_answer).length} / {problems.length} correct
                </p>
              </div>
              <button onClick={onFinish}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" /> New Session
              </button>
            </div>
          )
        )}
      </div>

      {/* Question dots navigator */}
      <div className="flex flex-wrap gap-1.5 justify-center pb-4">
        {problems.map((p, i) => {
          const ans = answers[p.id]
          const rev = revealed[p.id]
          const correct = rev && ans === p.correct_answer
          const wrong   = rev && ans !== p.correct_answer
          return (
            <button key={p.id} onClick={() => setIdx(i)}
              className={`w-7 h-7 rounded-lg text-[10px] font-mono font-bold transition-all border ${
                i === idx
                  ? "border-violet-400 bg-violet-400/20 text-violet-300 scale-110"
                  : correct
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-400"
                    : wrong
                      ? "border-red-400/40 bg-red-400/10 text-red-400"
                      : ans
                        ? "border-zinc-500 bg-zinc-800 text-zinc-300"
                        : "border-zinc-800 text-zinc-600 hover:border-zinc-600"
              }`}>
              {i + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main PracticeTab ──────────────────────────────────────────────────────
export default function PracticeTab({
  subjects, topics, attempts, isPremium, onSaveAttempt,
}: PracticeTabProps) {
  const [phase,    setPhase]    = useState<PracticePhase>("setup")
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const handleStart = useCallback(async (cfg: PracticeConfig) => {
    setLoading(true)
    setError(null)

    // Get count first for random offset
    let countQ = supabase.from("problems").select("id", { count: "exact", head: true })
      .eq("subject_id", cfg.subjectId)
      .or("problem_type.is.null,and(problem_type.not.ilike.%25cq%25,problem_type.not.ilike.%25written%25)")
    if (cfg.topicId)                      countQ = countQ.eq("topic_id",  cfg.topicId)
    if (cfg.difficulty !== "any")         countQ = countQ.eq("difficulty", cfg.difficulty)
    const { count } = await countQ

    const total  = count ?? 0
    const limit  = cfg.questionCount * 3  // fetch extra to shuffle
    const offset = total > limit ? Math.floor(Math.random() * (total - limit)) : 0

    let q = supabase.from("problems")
      .select(`id, question, option_a, option_b, option_c, option_d,
               correct_answer, explanation, explanation_a, explanation_b,
               explanation_c, explanation_d, hint, difficulty, is_free,
               tags, problem_type, subjects(name), topics(name), subtopics(name)`)
      .eq("subject_id", cfg.subjectId)
      .or("problem_type.is.null,and(problem_type.not.ilike.%25cq%25,problem_type.not.ilike.%25written%25)")
      .range(offset, offset + limit - 1)
    if (cfg.topicId)              q = q.eq("topic_id",  cfg.topicId)
    if (cfg.difficulty !== "any") q = q.eq("difficulty", cfg.difficulty)

    const { data, error: err } = await q
    setLoading(false)

    if (err || !data || data.length === 0) {
      setError(`No problems found. Try different filters.`)
      return
    }
    if (data.length < cfg.questionCount) {
      setError(`Only ${data.length} problems available. Reduce question count to ${data.length}.`)
      return
    }

    const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, cfg.questionCount)
    setProblems(shuffled as unknown as Problem[])
    setPhase("practice")
  }, [])

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      <p className="text-zinc-500 text-sm font-mono">Loading problems…</p>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
      <p className="text-red-400 text-sm text-center">{error}</p>
      <button onClick={() => { setError(null); setPhase("setup") }}
        className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-6 py-2.5 rounded-xl transition-colors">
        ← Back to Setup
      </button>
    </div>
  )

  if (phase === "setup") return (
    <PracticeSetup subjects={subjects} topics={topics} onStart={handleStart} />
  )

  return (
    <PracticeScreen
      problems={problems}
      isPremium={isPremium}
      onSaveAttempt={onSaveAttempt}
      onFinish={() => setPhase("setup")}
    />
  )
}
