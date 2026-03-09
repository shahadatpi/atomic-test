"use client"

import { useEffect, useState } from "react"
import { Trophy, Clock, BookOpen } from "lucide-react"
import supabase from "@/lib/supabase"

interface ExamAttempt {
  id:            string
  subject_id:    string
  topic_id:      string
  score:         number
  total:         number
  time_taken_sec: number
  created_at:    string
  subjects?:     { name: string }
  topics?:       { name: string }
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m ${s}s`
}

export default function ExamHistory({ userId }: { userId: string }) {
  const [exams,   setExams]   = useState<ExamAttempt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    supabase
      .from("exam_attempts")
      .select("id, score, total, time_taken_sec, created_at, subject_id, topic_id, subjects(name), topics(name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setExams((data as unknown as ExamAttempt[]) || [])
        setLoading(false)
      })
  }, [userId])

  // Re-fetch when user returns to tab
  useEffect(() => {
    const handle = () => {
      if (document.visibilityState === "visible" && userId) {
        supabase
          .from("exam_attempts")
          .select("id, score, total, time_taken_sec, created_at, subject_id, topic_id, subjects(name), topics(name)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10)
          .then(({ data }) => setExams((data as unknown as ExamAttempt[]) || []))
      }
    }
    document.addEventListener("visibilitychange", handle)
    return () => document.removeEventListener("visibilitychange", handle)
  }, [userId])

  if (loading) return (
    <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (exams.length === 0) return (
    <div className="bg-card border border-border rounded-xl p-8 text-center space-y-2">
      <BookOpen className="w-8 h-8 text-muted-foreground/30 mx-auto" />
      <p className="text-sm text-muted-foreground/60">No exams taken yet</p>
      <a href="/exam" className="text-xs text-emerald-400 hover:underline">Take your first exam →</a>
    </div>
  )

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-sm font-medium text-foreground">Recent Exams</h2>
        <a href="/exam" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
          New exam →
        </a>
      </div>

      <div className="divide-y divide-border">
        {exams.map(exam => {
          const pct      = Math.round((exam.score / exam.total) * 100)
          const scoreColor = pct >= 80 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400"
          const date     = new Date(exam.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })

          return (
            <div key={exam.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
              {/* Score ring */}
              <div className={`text-lg font-bold font-mono w-12 shrink-0 ${scoreColor}`}>
                {pct}%
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {(exam.subjects as any)?.name} · {(exam.topics as any)?.name}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                    <Trophy className="w-3 h-3" /> {exam.score}/{exam.total}
                  </span>
                  {exam.time_taken_sec && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                      <Clock className="w-3 h-3" /> {formatTime(exam.time_taken_sec)}
                    </span>
                  )}
                </div>
              </div>

              {/* Date */}
              <span className="text-xs text-muted-foreground/50 shrink-0">{date}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
