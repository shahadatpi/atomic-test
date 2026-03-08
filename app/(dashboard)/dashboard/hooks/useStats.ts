"use client"

import { useMemo } from "react"
import type { Attempt, Topic } from "../types"

export function useStats(attempts: Attempt[], topics: Topic[]) {
  return useMemo(() => {
    const totalAttempts   = attempts.length
    const correctAttempts = attempts.filter(a => a.is_correct).length
    const accuracy        = totalAttempts > 0
      ? Math.round((correctAttempts / totalAttempts) * 100)
      : 0

    // Streak: consecutive days ending today
    const streak = (() => {
      if (!attempts.length) return 0
      const days  = new Set(attempts.map(a => new Date(a.created_at).toDateString()))
      let   count = 0
      const d     = new Date()
      while (days.has(d.toDateString())) {
        count++
        d.setDate(d.getDate() - 1)
      }
      return count
    })()

    // Last 7 days activity
    const weekActivity = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return attempts.filter(
        a => new Date(a.created_at).toDateString() === d.toDateString()
      ).length
    })

    // Mon-Sun labels aligned to today
    const allDays  = ["M", "T", "W", "T", "F", "S", "S"]
    const weekDays = [
      ...allDays.slice(new Date().getDay()),
      ...allDays.slice(0, new Date().getDay()),
    ].slice(-7)

    // Per-topic progress (first 5 topics)
    const topicProgress = topics.slice(0, 5).map(t => {
      const ta     = attempts.filter(a => (a.problems as any)?.topics?.name === t.name)
      const solved = ta.filter(a => a.is_correct).length
      return { name: t.name, solved, total: Math.max(solved + 5, 10) }
    })

    return { totalAttempts, correctAttempts, accuracy, streak, weekActivity, weekDays, topicProgress }
  }, [attempts, topics])
}
