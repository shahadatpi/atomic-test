"use client"

import { useState, useEffect, useCallback } from "react"
import  supabase  from "@/lib/supabase"
import type { Problem, Attempt, Subject, Topic } from "../types"

interface UseDashboardDataProps {
  userId: string | undefined
  subjectFilter: string
  topicFilter: string
  diffFilter: string
}

export function useDashboardData({
  userId,
  subjectFilter,
  topicFilter,
  diffFilter,
}: UseDashboardDataProps) {
  const [subjects, setSubjects]               = useState<Subject[]>([])
  const [topics, setTopics]                   = useState<Topic[]>([])
  const [problems, setProblems]               = useState<Problem[]>([])
  const [attempts, setAttempts]               = useState<Attempt[]>([])
  const [loadingProblems, setLoadingProblems] = useState(false)

  // Load subjects & topics once
  useEffect(() => {
    supabase.from("subjects").select("id, name").order("sort_order")
      .then(({ data }) => setSubjects(data || []))
    supabase.from("topics").select("id, name, subject_id").order("name")
      .then(({ data }) => setTopics(data || []))
  }, [])

  // Load attempts for the signed-in user
  const refreshAttempts = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from("attempts")
      .select(
        "id, problem_id, selected_answer, is_correct, created_at, " +
        "problems(question, difficulty, subjects(name), topics(name))"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)
    setAttempts((data as unknown as Attempt[]) || [])
  }, [userId])

  useEffect(() => { refreshAttempts() }, [refreshAttempts])

  // Load problems (re-runs when filters change)
  const fetchProblems = useCallback(async () => {
    setLoadingProblems(true)
    let query = supabase
      .from("problems")
      .select(
        `id, question, option_a, option_b, option_c, option_d,
         correct_answer, explanation, hint, difficulty, is_free, tags,
         subjects(name), topics(name), subtopics(name)`
      )
      .order("created_at", { ascending: false })
      .limit(20)

    if (subjectFilter) query = query.eq("subject_id", subjectFilter)
    if (topicFilter)   query = query.eq("topic_id",   topicFilter)
    if (diffFilter)    query = query.eq("difficulty",  diffFilter)

    const { data } = await query
    setProblems((data as unknown as Problem[]) || [])
    setLoadingProblems(false)
  }, [subjectFilter, topicFilter, diffFilter])

  useEffect(() => { fetchProblems() }, [fetchProblems])

  // Save an attempt then refresh the list
  const saveAttempt = useCallback(
    async (problem: Problem, answer: string, isCorrect: boolean) => {
      if (!userId) return
      await supabase.from("attempts").insert({
        user_id:         userId,
        problem_id:      problem.id,
        selected_answer: answer,
        is_correct:      isCorrect,
      })
      await refreshAttempts()
    },
    [userId, refreshAttempts]
  )

  return {
    subjects,
    topics,
    problems,
    attempts,
    loadingProblems,
    fetchProblems,
    saveAttempt,
  }
}
