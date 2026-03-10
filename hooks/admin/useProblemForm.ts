"use client"

import { useState, useEffect } from "react"
import supabase from "@/lib/supabase"
import type { Subject, Topic, Subtopic, Difficulty, Answer } from "@/types"

export interface ProblemFormState {
  subject_id:     string
  topic_id:       string
  subtopic_id:    string
  question:       string
  option_a:       string
  option_b:       string
  option_c:       string
  option_d:       string
  correct_answer: Answer
  explanation:    string
  hint:           string
  difficulty:     Difficulty
  is_free:        boolean
  tags:           string
  source:         string
}

export const EMPTY_FORM: ProblemFormState = {
  subject_id: "", topic_id: "", subtopic_id: "", question: "",
  option_a: "", option_b: "", option_c: "", option_d: "",
  correct_answer: "a", explanation: "", hint: "",
  difficulty: "medium", is_free: true, tags: "", source: "",
}

const REQUIRED_FIELDS: (keyof ProblemFormState)[] = [
  "subject_id", "topic_id", "question",
  "option_a", "option_b", "option_c", "option_d",
]

export function useProblemForm() {
  const [form,      setForm]      = useState<ProblemFormState>(EMPTY_FORM)
  const [subjects,  setSubjects]  = useState<Subject[]>([])
  const [topics,    setTopics]    = useState<Topic[]>([])
  const [subtopics, setSubtopics] = useState<Subtopic[]>([])
  const [loading,   setLoading]   = useState(false)
  const [status,    setStatus]    = useState<"idle" | "success" | "error">("idle")
  const [errorMsg,  setErrorMsg]  = useState("")

  // ── Field setter helper ─────────────────────────────────────────────
  const setField = <K extends keyof ProblemFormState>(key: K, val: ProblemFormState[K]) =>
    setForm(f => ({ ...f, [key]: val }))

  // Generic onChange handler — accepts string or boolean
  const handleChange = (key: string, value: string | boolean) =>
    setForm(f => ({ ...f, [key]: value }))

  // ── Load subjects on mount ──────────────────────────────────────────
  useEffect(() => {
    supabase.from("subjects").select("id, name").order("sort_order")
      .then(({ data }) => setSubjects(data || []))
  }, [])

  // ── Load topics when subject changes ───────────────────────────────
  useEffect(() => {
    if (!form.subject_id) { setTopics([]); return }
    supabase.from("topics")
      .select("id, name, subject_id")
      .eq("subject_id", form.subject_id)
      .order("sort_order")
      .then(({ data }) => setTopics(data || []))
    setField("topic_id",   "")
    setField("subtopic_id", "")
  }, [form.subject_id])

  // ── Load subtopics when topic changes ──────────────────────────────
  useEffect(() => {
    if (!form.topic_id) { setSubtopics([]); return }
    supabase.from("subtopics")
      .select("id, name, topic_id")
      .eq("topic_id", form.topic_id)
      .order("sort_order")
      .then(({ data }) => setSubtopics(data || []))
    setField("subtopic_id", "")
  }, [form.topic_id])

  // ── Submit ─────────────────────────────────────────────────────────
  const handleSubmit = async (): Promise<boolean> => {
    // Validate required fields
    for (const key of REQUIRED_FIELDS) {
      if (!form[key]) {
        setStatus("error")
        setErrorMsg(`Please fill in: ${key.replace(/_/g, " ")}`)
        return false
      }
    }

    setLoading(true)
    setStatus("idle")

    const tags = form.tags
      ? form.tags.split(",").map(t => t.trim()).filter(Boolean)
      : []

    const { error } = await supabase.from("problems").insert({
      subject_id:     form.subject_id,
      topic_id:       form.topic_id,
      subtopic_id:    form.subtopic_id || null,
      question:       form.question,
      option_a:       form.option_a,
      option_b:       form.option_b,
      option_c:       form.option_c,
      option_d:       form.option_d,
      correct_answer: form.correct_answer,
      explanation:    form.explanation || null,
      hint:           form.hint        || null,
      difficulty:     form.difficulty,
      is_free:        form.is_free,
      tags:           tags.length ? tags : null,
      source:         form.source || null,
    })

    setLoading(false)

    if (error) {
      setStatus("error")
      setErrorMsg(error.message)
      return false
    }

    setStatus("success")
    setForm(EMPTY_FORM)
    setTimeout(() => setStatus("idle"), 4000)
    return true
  }

  const resetForm = () => setForm(EMPTY_FORM)

  return {
    form, setField, handleChange,
    subjects, topics, subtopics,
    loading, status, errorMsg,
    handleSubmit, resetForm,
  }
}
