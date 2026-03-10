"use client"

import { useState } from "react"
import { BookOpen, Clock, Hash, ChevronDown, Lock, Zap, GraduationCap } from "lucide-react"
import type { ExamConfig } from "../types"

interface Subject { id: string; name: string }
interface Topic   { id: string; name: string; subject_id: string }

interface ExamSetupProps {
  subjects: Subject[]
  topics:   Topic[]
  isPaid:   boolean
  onStart:  (config: ExamConfig) => void
}

const DURATIONS = [15, 20, 25, 30, 45, 60, 90]

const STANDARDS = [
  { value: "any",     label: "Any",     desc: "No filter"            },
  { value: "Board",   label: "Board",   desc: "HSC Board Standard"   },
  { value: "DU",      label: "DU",      desc: "Dhaka University"     },
  { value: "BUET",    label: "BUET",    desc: "Engineering Standard" },
  { value: "CKRUET",  label: "CKRUET",  desc: "Engineering Standard" },
  { value: "SUST",    label: "SUST",    desc: "Shahjalal University" },
  { value: "Medical", label: "Medical", desc: "MBBS Admission"       },
]

const DIFFICULTIES = [
  { value: "any",    label: "Any",    color: "border-border text-foreground"              },
  { value: "easy",   label: "Easy",   color: "border-emerald-400/50 text-emerald-400"     },
  { value: "medium", label: "Medium", color: "border-amber-400/50 text-amber-400"         },
  { value: "hard",   label: "Hard",   color: "border-red-400/50 text-red-400"             },
]

export function ExamSetup({ subjects, topics, isPaid, onStart }: ExamSetupProps) {
  const [subjectId,     setSubjectId]     = useState("")
  const [topicId,       setTopicId]       = useState("")
  const [questionCount, setQuestionCount] = useState(25)
  const [durationMin,   setDurationMin]   = useState(30)
  const [difficulty,    setDifficulty]    = useState<"any"|"easy"|"medium"|"hard">("any")
  const [standard,      setStandard]      = useState("any")
  const [countError,    setCountError]    = useState("")

  const filteredTopics  = topics.filter(t => t.subject_id === subjectId)
  const selectedSubject = subjects.find(s => s.id === subjectId)
  const selectedTopic   = topics.find(t => t.id === topicId)

  const handleCountChange = (v: number) => {
    setQuestionCount(v)
    setCountError(v < 25 ? "Minimum 25 questions required" : "")
  }

  const canStart = subjectId && topicId && questionCount >= 25 && durationMin > 0

  const handleStart = () => {
    if (!canStart || !selectedSubject || !selectedTopic) return
    onStart({
      subjectId,
      subjectName:  selectedSubject.name,
      topicId,
      topicName:    selectedTopic.name,
      questionCount,
      durationMin,
      difficulty,
      standard,
    })
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6 text-zinc-950" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Start an Exam</h1>
          <p className="text-sm text-muted-foreground">Choose your topic and preferences</p>
        </div>

        {/* Paid-only notice */}
        {!isPaid && (
          <div className="flex items-center gap-3 bg-violet-400/10 border border-violet-400/20 rounded-2xl px-5 py-4">
            <Lock className="w-4 h-4 text-violet-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-violet-400">Pro feature</p>
              <p className="text-xs text-muted-foreground mt-0.5">Upgrade to take timed exams</p>
            </div>
            <button className="bg-violet-400 hover:bg-violet-300 text-zinc-950 text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Upgrade
            </button>
          </div>
        )}

        {/* Config card */}
        <div className={`bg-card border border-border rounded-2xl p-6 space-y-5 ${!isPaid ? "opacity-50 pointer-events-none select-none" : ""}`}>

          {/* Subject */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Subject</label>
            <div className="relative">
              <select value={subjectId} onChange={e => { setSubjectId(e.target.value); setTopicId("") }}
                className="w-full appearance-none bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-emerald-500/50 transition-all cursor-pointer">
                <option value="">Select a subject…</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Topic</label>
            <div className="relative">
              <select value={topicId} onChange={e => setTopicId(e.target.value)} disabled={!subjectId}
                className="w-full appearance-none bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-emerald-500/50 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                <option value="">Select a topic…</option>
                {filteredTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Question count + Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" /> Questions
              </label>
              <input type="number" min={25} max={100} value={questionCount}
                onChange={e => handleCountChange(Number(e.target.value))}
                className="w-full bg-background border border-border focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none transition-all"
              />
              {countError
                ? <p className="text-xs text-red-400 mt-1">{countError}</p>
                : <p className="text-xs text-muted-foreground mt-1">Minimum 25</p>
              }
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Duration
              </label>
              <div className="relative">
                <select value={durationMin} onChange={e => setDurationMin(Number(e.target.value))}
                  className="w-full appearance-none bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-emerald-500/50 transition-all cursor-pointer">
                  {DURATIONS.map(d => <option key={d} value={d}>{d} minutes</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Difficulty</label>
            <div className="grid grid-cols-4 gap-2">
              {DIFFICULTIES.map(opt => (
                <button key={opt.value} type="button" onClick={() => setDifficulty(opt.value as any)}
                  className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                    difficulty === opt.value
                      ? opt.color + " bg-accent scale-[1.02]"
                      : "border-border text-muted-foreground hover:bg-accent/50"
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Standard */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" /> Exam Standard
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {STANDARDS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setStandard(opt.value)}
                  className={`py-2.5 px-1 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center gap-0.5 ${
                    standard === opt.value
                      ? "border-emerald-400 bg-emerald-400/10 text-emerald-400 scale-[1.02]"
                      : "border-border text-muted-foreground hover:border-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  }`}>
                  <span>{opt.label}</span>
                  {opt.value !== "any" && (
                    <span className="text-[9px] font-normal opacity-60 leading-tight text-center">{opt.desc}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          {subjectId && topicId && questionCount >= 25 && (
            <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-xl px-4 py-3 text-xs text-emerald-400 space-y-1">
              <p>📚 {selectedSubject?.name} → {selectedTopic?.name}</p>
              <p>⏱ {questionCount} questions · {durationMin} min · {(durationMin / questionCount).toFixed(1)} min/q</p>
              <p>🎯 {difficulty === "any" ? "Any difficulty" : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                {standard !== "any" ? ` · ${standard} Standard` : ""}</p>
            </div>
          )}

          {/* Start button */}
          <button onClick={handleStart} disabled={!canStart}
            className="w-full bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-semibold text-sm py-3 rounded-xl transition-colors">
            Start Exam →
          </button>
        </div>
      </div>
    </div>
  )
}
