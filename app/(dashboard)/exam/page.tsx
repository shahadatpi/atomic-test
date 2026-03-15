"use client"

import { useState, useEffect }    from "react"
import { useSession }             from "@/lib/auth-client"
import { useRouter }              from "next/navigation"
import supabase                   from "@/lib/supabase"

import { ExamSetup }    from "./components/ExamSetup"
import { ExamScreen }   from "./components/ExamScreen"
import { ExamResults }  from "./components/ExamResults"

import type { ExamConfig, ExamAnswer, ExamPhase, ExamProblem } from "./types"

interface Subject { id: string; name: string }
interface Topic   { id: string; name: string; subject_id: string }

export default function Page() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  const [phase,    setPhase]    = useState<ExamPhase>("setup")
  const [config,   setConfig]   = useState<ExamConfig | null>(null)
  const [problems, setProblems] = useState<ExamProblem[]>([])
  const [answers,  setAnswers]  = useState<ExamAnswer[]>([])
  const [timeTaken, setTimeTaken] = useState(0)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics,   setTopics]   = useState<Topic[]>([])

  // ── Auth guard ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPending && !session) router.push("/login")
  }, [session, isPending, router])

  // ── Load subjects & topics ────────────────────────────────────────────
  useEffect(() => {
    supabase.from("subjects").select("id, name").order("name")
      .then(({ data }) => setSubjects(data || []))
    supabase.from("topics").select("id, name, subject_id").order("name")
      .then(({ data }) => setTopics(data || []))
  }, [])

  // ── Check if user is paid ─────────────────────────────────────────────
  // For now: admins are always paid, students need a subscription
  // TODO: replace with real subscription check when payment is built
  const isAdmin = (session?.user as any)?.role === "admin"
  const isPaid  = true  // expand this when SSLCommerz is integrated

  // ── Start exam — fetch problems ───────────────────────────────────────
  const handleStart = async (cfg: ExamConfig) => {
    setConfig(cfg)
    setLoading(true)
    setError(null)

    let query = supabase
      .from("problems")
      .select(`
        id, question, option_a, option_b, option_c, option_d,
        correct_answer, explanation, hint, difficulty, is_free,
        subjects(name), topics(name)
      `)
      .eq("topic_id",  cfg.topicId)
      .or("problem_type.is.null,and(problem_type.not.ilike.%25cq%25,problem_type.not.ilike.%25written%25)")
      .limit(cfg.questionCount * 2) // fetch extra, then shuffle + trim

    if (cfg.difficulty !== "any") {
      query = query.eq("difficulty", cfg.difficulty)
    }

    if (cfg.standard !== "any") {
      query = query.contains("tags", [cfg.standard])
    }

    const { data, error: fetchError } = await query

    setLoading(false)

    if (fetchError || !data || data.length === 0) {
      setError(`No problems found for ${cfg.topicName}. Please try another topic.`)
      return
    }

    if (data.length < cfg.questionCount) {
      setError(`Only ${data.length} problems available for ${cfg.topicName}. Please reduce the question count.`)
      return
    }

    // Shuffle and take exactly questionCount
    const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, cfg.questionCount)
    setProblems(shuffled as unknown as ExamProblem[])
    setPhase("exam")
  }

  // ── Submit exam — save to DB ──────────────────────────────────────────
  const handleSubmit = async (examAnswers: ExamAnswer[], timeTakenSec: number) => {
    setAnswers(examAnswers)
    setTimeTaken(timeTakenSec)
    setPhase("results")

    if (!session?.user?.id || !config) return

    const score = examAnswers.filter(a => a.isCorrect).length

    // 1. Save exam summary to exam_attempts
    await supabase.from("exam_attempts").insert({
      id:             crypto.randomUUID(),
      user_id:        session.user.id,
      subject_id:     config.subjectId,
      topic_id:       config.topicId,
      score,
      total:          examAnswers.length,
      duration_sec:   config.durationMin * 60,
      time_taken_sec: timeTakenSec,
      answers:        examAnswers,
    })

    // 2. Save each answer to user_attempts so dashboard stats update
    const attemptRows = examAnswers.map(a => ({
      id:              crypto.randomUUID(),
      user_id:         session.user.id,
      problem_id:      a.problemId,
      selected_answer: a.selected ?? "",
      is_correct:      a.isCorrect,
      time_taken_sec:  Math.round(timeTakenSec / examAnswers.length), // avg per question
      hint_used:       false,
    }))
    await supabase.from("user_attempts").insert(attemptRows)
  }

  // ── Retry — go back to setup ──────────────────────────────────────────
  const handleRetry = () => {
    setPhase("setup")
    setConfig(null)
    setProblems([])
    setAnswers([])
    setTimeTaken(0)
    setError(null)
  }

  // ── Loading states ────────────────────────────────────────────────────
  if (isPending || !session) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center" style={{ fontFamily: "'Kalpurush', 'Roboto', sans-serif" }}>
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-sm font-mono">Loading {config?.questionCount} questions…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-400 text-sm text-center">{error}</p>
        <button onClick={handleRetry}
                className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-6 py-2.5 rounded-xl transition-colors">
          ← Back to Setup
        </button>
      </div>
    )
  }

  // ── Render phase ──────────────────────────────────────────────────────
  if (phase === "setup") return (
    <ExamSetup
      subjects={subjects}
      topics={topics}
      isPaid={isPaid}
      onStart={handleStart}
    />
  )

  if (phase === "exam" && config) return (
    <ExamScreen
      config={config}
      problems={problems}
      onSubmit={handleSubmit}
    />
  )

  if (phase === "results" && config) return (
    <ExamResults
      config={config}
      problems={problems}
      answers={answers}
      timeTakenSec={timeTaken}
      onRetry={handleRetry}
    />
  )

  return null
}
