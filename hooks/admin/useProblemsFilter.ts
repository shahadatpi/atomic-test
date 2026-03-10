"use client"

import { useState, useEffect, useCallback } from "react"
import supabase from "@/lib/supabase"
import type { Subject, Topic, Subtopic, Problem } from "@/types"

const PAGE_SIZE = 20

export function useProblemsFilter() {
  const [problems,       setProblems]       = useState<Problem[]>([])
  const [subjects,       setSubjects]       = useState<Subject[]>([])
  const [topics,         setTopics]         = useState<Topic[]>([])
  const [subtopics,      setSubtopics]      = useState<Subtopic[]>([])
  const [loading,        setLoading]        = useState(true)
  const [total,          setTotal]          = useState(0)
  const [page,           setPage]           = useState(0)

  // Filters
  const [search,         setSearch]         = useState("")
  const [subjectFilter,  setSubjectFilter]  = useState("")
  const [topicFilter,    setTopicFilter]    = useState("")
  const [subtopicFilter, setSubtopicFilter] = useState("")
  const [diffFilter,     setDiffFilter]     = useState("")
  const [freeFilter,     setFreeFilter]     = useState("")

  // ── Load taxonomy on mount ──────────────────────────────────────────
  useEffect(() => {
    supabase.from("subjects").select("id, name").order("sort_order")
      .then(({ data }) => setSubjects(data || []))
    supabase.from("topics").select("id, name, subject_id").order("name")
      .then(({ data }) => setTopics(data || []))
  }, [])

  // ── Load subtopics when topic changes ──────────────────────────────
  useEffect(() => {
    if (!topicFilter) { setSubtopics([]); setSubtopicFilter(""); return }
    supabase.from("subtopics").select("id, name, topic_id")
      .eq("topic_id", topicFilter).order("sort_order")
      .then(({ data }) => setSubtopics(data || []))
    setSubtopicFilter("")
  }, [topicFilter])

  // ── Fetch problems ─────────────────────────────────────────────────
  const fetchProblems = useCallback(async () => {
    setLoading(true)

    let q = supabase
      .from("problems")
      .select(
        `id, question, option_a, option_b, option_c, option_d, correct_answer, explanation,
         difficulty, is_free, tags, source, created_at, subtopic_id,
         subjects(name), topics(name), subtopics(name)`,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (subjectFilter)  q = q.eq("subject_id",  subjectFilter)
    if (topicFilter)    q = q.eq("topic_id",    topicFilter)
    if (subtopicFilter) q = q.eq("subtopic_id", subtopicFilter)
    if (diffFilter)     q = q.eq("difficulty",  diffFilter)
    if (freeFilter)     q = q.eq("is_free",     freeFilter === "free")
    if (search)         q = q.ilike("question", `%${search}%`)

    const { data, count, error } = await q

    if (!error) {
      setProblems((data as unknown as Problem[]) || [])
      setTotal(count || 0)
    }
    setLoading(false)
  }, [search, subjectFilter, topicFilter, subtopicFilter, diffFilter, freeFilter, page])

  useEffect(() => { fetchProblems() }, [fetchProblems])

  // ── Delete ─────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this problem? This cannot be undone.")) return
    const { error } = await supabase.from("problems").delete().eq("id", id)
    if (!error) setProblems(ps => ps.filter(p => p.id !== id))
  }

  // ── Filter helpers with page reset ─────────────────────────────────
  const updateFilter = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v); setPage(0)
  }

  const clearAll = () => {
    setSearch(""); setSubjectFilter(""); setTopicFilter("")
    setSubtopicFilter(""); setDiffFilter(""); setFreeFilter(""); setPage(0)
  }

  return {
    // Data
    problems, subjects, topics, subtopics,
    loading, total, page, PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
    // Filters
    search, subjectFilter, topicFilter, subtopicFilter, diffFilter, freeFilter,
    // Handlers
    setPage,
    handleDelete,
    clearAll,
    onSearchChange:   updateFilter(setSearch),
    onSubjectChange:  updateFilter(setSubjectFilter),
    onTopicChange:    updateFilter(setTopicFilter),
    onSubtopicChange: updateFilter(setSubtopicFilter),
    onDiffChange:     updateFilter(setDiffFilter),
    onFreeChange:     updateFilter(setFreeFilter),
  }
}
