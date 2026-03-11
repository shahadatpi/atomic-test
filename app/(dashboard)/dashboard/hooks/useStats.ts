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

    // ── Streak: consecutive days ending today ─────────────────────────
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

    // ── Last 7 days activity ──────────────────────────────────────────
    const weekActivity = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return attempts.filter(
        a => new Date(a.created_at).toDateString() === d.toDateString()
      ).length
    })

    // Day labels aligned to today (rolling 7-day window)
    const allDays = ["S", "M", "T", "W", "T", "F", "S"]
    const today   = new Date().getDay() // 0=Sun
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const dayIndex = (today - 6 + i + 7) % 7
      return allDays[dayIndex]
    })

    // ── Topic progress — only topics the user actually attempted ──────
    // Build a map: topicName → { solved, total attempted }
    const topicMap = new Map<string, { solved: number; total: number }>()

    for (const attempt of attempts) {
      // Supabase join: attempt.problems.topics.name
      const topicName = (attempt.problems as any)?.topics?.name
      if (!topicName) continue

      const entry = topicMap.get(topicName) ?? { solved: 0, total: 0 }
      entry.total++
      if (attempt.is_correct) entry.solved++
      topicMap.set(topicName, entry)
    }

    // Sort by most attempted, take top 6
    const topicProgress = Array.from(topicMap.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 6)
      .map(([name, { solved, total }]) => ({ name, solved, total }))

    return {
      totalAttempts,
      correctAttempts,
      accuracy,
      streak,
      weekActivity,
      weekDays,
      topicProgress,
    }
  }, [attempts, topics])
}
