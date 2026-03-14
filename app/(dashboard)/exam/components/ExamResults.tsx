"use client"

import { CheckCircle, XCircle, Clock, Trophy, RotateCcw, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import MathText from "@/components/math/MathText"
import type { ExamAnswer, ExamConfig, ExamProblem } from "../types"

interface ExamResultsProps {
  config:        ExamConfig
  problems:      ExamProblem[]
  answers:       ExamAnswer[]
  timeTakenSec:  number
  onRetry:       () => void
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m ${s}s`
}

function ScoreRing({ score, total }: { score: number; total: number }) {
  const pct  = Math.round((score / total) * 100)
  const color = pct >= 80 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400"
  const borderColor = pct >= 80 ? "border-emerald-400" : pct >= 50 ? "border-amber-400" : "border-red-400"

  return (
    <div className={`w-32 h-32 rounded-full border-4 ${borderColor} flex flex-col items-center justify-center mx-auto`}>
      <span className={`text-3xl font-bold ${color}`}>{pct}%</span>
      <span className="text-xs text-zinc-500">{score}/{total}</span>
    </div>
  )
}

export function ExamResults({ config, problems, answers, timeTakenSec, onRetry }: ExamResultsProps) {
  const score    = answers.filter(a => a.isCorrect).length
  const total    = answers.length
  const pct      = Math.round((score / total) * 100)
  const grade    = pct >= 80 ? "Excellent! 🎉" : pct >= 60 ? "Good job! 👍" : pct >= 40 ? "Keep practicing 💪" : "Needs improvement 📚"

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4" style={{ fontFamily: "'Kalpurush', 'Roboto', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>

      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Score card ─────────────────────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-4">
          <ScoreRing score={score} total={total} />
          <div>
            <h1 className="text-xl font-semibold text-white">{grade}</h1>
            <p className="text-sm text-zinc-500 mt-1">{config.subjectName} · {config.topicName}</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
              <Trophy className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{score}</p>
              <p className="text-xs text-zinc-500">Correct</p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
              <XCircle className="w-4 h-4 text-red-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{total - score}</p>
              <p className="text-xs text-zinc-500">Wrong</p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
              <Clock className="w-4 h-4 text-sky-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{formatTime(timeTakenSec)}</p>
              <p className="text-xs text-zinc-500">Time taken</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onRetry}
              className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
            <Link href="/dashboard"
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          </div>
        </div>

        {/* ── Per-question breakdown ──────────────────────────────────── */}
        <h2 className="text-xs font-mono text-zinc-500 tracking-widest">QUESTION REVIEW</h2>

        {problems.map((problem, idx) => {
          const answer    = answers.find(a => a.problemId === problem.id)
          const isCorrect = answer?.isCorrect ?? false
          const selected  = answer?.selected
          const correct   = problem.correct_answer

          return (
            <div key={problem.id} className={`bg-zinc-900 border rounded-2xl p-5 space-y-4 ${isCorrect ? "border-emerald-400/30" : "border-red-400/30"}`}>

              {/* Question */}
              <div className="flex items-start gap-3">
                <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono mt-0.5 ${isCorrect ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>
                  {idx + 1}
                </span>
                <div className="flex-1 text-sm text-zinc-200 leading-relaxed">
                  <MathText text={problem.question} />
                </div>
                {isCorrect
                  ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  : <XCircle    className="w-5 h-5 text-red-400    shrink-0 mt-0.5" />
                }
              </div>

              {/* Options */}
              <div className="space-y-1.5 pl-10">
                {(["a", "b", "c", "d"] as const).map(key => {
                  const value      = problem[`option_${key}` as keyof ExamProblem] as string
                  const isSelected = selected === key
                  const isCorrectOpt = correct === key

                  return (
                    <div key={key} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm ${
                      isCorrectOpt                       ? "border-emerald-400 bg-emerald-400/10 text-emerald-300"
                      : isSelected && !isCorrectOpt ? "border-red-400 bg-red-400/10 text-red-300"
                      :                               "border-zinc-800 text-zinc-500"
                    }`}>
                      <span className={`w-5 h-5 shrink-0 rounded flex items-center justify-center text-xs font-mono font-bold ${
                        isCorrectOpt                       ? "bg-emerald-400 text-zinc-950"
                        : isSelected && !isCorrectOpt ? "bg-red-400 text-white"
                        :                               "bg-zinc-800 text-zinc-600"
                      }`}>
                        {key}
                      </span>
                      <span className="flex-1"><MathText text={value} /></span>
                      {isCorrectOpt    && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      {isSelected && !isCorrectOpt && <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                    </div>
                  )
                })}
              </div>

              {/* Your answer vs correct */}
              {!isCorrect && (
                <div className="pl-10 text-xs text-zinc-500 space-y-0.5">
                  <p>Your answer: <span className="text-red-400 font-mono uppercase">{selected ?? "unanswered"}</span></p>
                  <p>Correct answer: <span className="text-emerald-400 font-mono uppercase">{correct}</span></p>
                </div>
              )}

              {/* Explanation */}
              {problem.explanation && (
                <div className="pl-10 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 space-y-1">
                  <p className="text-xs text-emerald-400 font-mono">EXPLANATION</p>
                  <div className="text-xs text-zinc-400 leading-relaxed">
                    <MathText text={problem.explanation} />
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <div className="h-10" />
      </div>
    </div>
  )
}
