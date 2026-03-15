"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { AlertTriangle, CheckCircle, Clock } from "lucide-react"
import MathText from "@/components/math/MathText"
import type { ExamProblem, ExamAnswer, ExamConfig } from "../types"

interface ExamScreenProps {
  config:    ExamConfig
  problems:  ExamProblem[]
  onSubmit:  (answers: ExamAnswer[], timeTakenSec: number) => void
}

const OPTION_KEYS = ["a", "b", "c", "d"] as const

export function ExamScreen({ config, problems, onSubmit }: ExamScreenProps) {
  const totalSec  = config.durationMin * 60
  const [timeLeft,  setTimeLeft]  = useState(totalSec)
  const [answers,   setAnswers]   = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const startTime = useRef(Date.now())

  // ── Countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    if (submitted) return
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval)
          handleSubmit(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [submitted])

  const handleSubmit = useCallback((auto = false) => {
    if (submitted) return
    setSubmitted(true)
    const timeTaken = Math.round((Date.now() - startTime.current) / 1000)

    const examAnswers: ExamAnswer[] = problems.map(p => {
      const selected = answers[p.id] ?? null
      return {
        problemId: p.id,
        selected,
        correct:   p.correct_answer,
        isCorrect: selected === p.correct_answer,
      }
    })
    onSubmit(examAnswers, timeTaken)
  }, [submitted, answers, problems, onSubmit])

  // ── Timer display ─────────────────────────────────────────────────────
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const timeStr   = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  const isWarning = timeLeft <= 60
  const isUrgent  = timeLeft <= 30

  const answeredCount = Object.keys(answers).length
  const progress      = Math.round((answeredCount / problems.length) * 100)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "'Kalpurush', 'Roboto', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>

      {/* ── Sticky header ────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-3 md:px-8 py-2 md:py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">

          {/* Left: topic info */}
          <div>
            <p className="text-xs text-zinc-500 font-mono">{config.subjectName} · {config.topicName}</p>
            <p className="text-sm font-medium text-white">{answeredCount} / {problems.length} answered</p>
          </div>

          {/* Centre: progress bar */}
          <div className="flex-1 hidden md:block">
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Right: timer */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono text-lg font-bold transition-colors ${
            isUrgent  ? "bg-red-400/10 border-red-400/30 text-red-400 animate-pulse"
            : isWarning ? "bg-amber-400/10 border-amber-400/30 text-amber-400"
            :             "bg-zinc-900 border-zinc-800 text-white"
          }`}>
            <Clock className="w-4 h-4" />
            {timeStr}
          </div>
        </div>
      </div>

      {/* ── Questions ────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-3 md:px-8 py-4 md:py-6 space-y-4 md:space-y-6">
        {problems.map((problem, idx) => {
          const selected = answers[problem.id]
          return (
            <div key={problem.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6 space-y-4">

              {/* Question header */}
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-mono text-zinc-400 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 text-sm text-zinc-100 leading-relaxed">
                  <MathText text={problem.question} />
                </div>
              </div>

              {/* Options — 2×2 grid, no tags shown during exam */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-0 sm:pl-10">
                {OPTION_KEYS.map(key => {
                  const value     = problem[`option_${key}` as keyof ExamProblem] as string
                  const isSelected = selected === key
                  return (
                    <button
                      key={key}
                      onClick={() => setAnswers(a => ({ ...a, [problem.id]: key }))}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all ${
                        isSelected
                          ? "border-emerald-400 bg-emerald-400/10 text-emerald-300"
                          : "border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/40 text-zinc-300"
                      }`}
                    >
                      <span className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center text-xs font-mono font-bold uppercase ${
                        isSelected ? "bg-emerald-400 text-zinc-950" : "bg-zinc-800 text-zinc-500"
                      }`}>
                        {key}
                      </span>
                      <span className="flex-1 text-xs leading-snug"><MathText text={value} /></span>
                      {isSelected && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* ── Submit section ──────────────────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6 space-y-4">
          {answeredCount < problems.length && (
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-4 py-3 rounded-xl">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {problems.length - answeredCount} questions unanswered — they will be marked wrong
            </div>
          )}
          <button
            onClick={() => handleSubmit(false)}
            className="w-full bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-semibold text-sm py-3 rounded-xl transition-colors"
          >
            Submit Exam ({answeredCount}/{problems.length} answered)
          </button>
        </div>

        <div className="h-10" /> {/* bottom padding */}
      </div>
    </div>
  )
}
