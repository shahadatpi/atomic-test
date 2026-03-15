"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronDown, Lock, Search, Loader2, ChevronRight, ChevronLeft } from "lucide-react"
import MathText from "@/components/math/MathText"
import supabase from "@/lib/supabase"
import DifficultyBadge from "./DifficultyBadge"
import type { Subject, Topic } from "../types"

interface Problem {
  id:           string
  question:     string
  option_a:     string | null
  option_b:     string | null
  option_c:     string | null
  option_d:     string | null
  correct_answer: string | null
  explanation:  string | null
  difficulty:   string
  is_free:      boolean
  problem_type: string | null
  subjects:     { name: string }
  topics:       { name: string }
  subtopics:    { name: string } | null
}

interface ProblemsTabProps {
  isPremium: boolean
}

const PAGE_SIZE = 15

function isCQ(p: Problem) {
  if (p.correct_answer) return false
  if (p.problem_type && /cq|written/i.test(p.problem_type)) return true
  return false
}


// Safe page button generator — never produces negative values
function pageButtons(page: number, total: number): number[] {
  if (total <= 0) return []
  const count = Math.min(5, total)
  let start = page - Math.floor(count / 2)
  if (start < 1) start = 1
  if (start + count - 1 > total) start = total - count + 1
  if (start < 1) start = 1
  return Array.from({ length: count }, (_, i) => start + i)
}

export default function ProblemsTab({ isPremium }: ProblemsTabProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics,   setTopics]   = useState<Topic[]>([])

  useEffect(() => {
    supabase.from("subjects").select("id, name").order("sort_order")
      .then(({ data }) => setSubjects(data || []))
    supabase.from("topics").select("id, name, subject_id").order("name")
      .then(({ data }) => setTopics(data || []))
  }, [])

  const [problems,       setProblems]       = useState<Problem[]>([])
  const [total,          setTotal]          = useState(0)
  const [page,           setPage]           = useState(1)
  const [loading,        setLoading]        = useState(false)
  const [search,         setSearch]         = useState("")
  const [subjectFilter,  setSubjectFilter]  = useState("")
  const [topicFilter,    setTopicFilter]    = useState("")
  const [diffFilter,     setDiffFilter]     = useState("")
  const [typeFilter,     setTypeFilter]     = useState("")
  const [expandedId,     setExpandedId]     = useState<string | null>(null)
  const [explOpen,       setExplOpen]       = useState<Record<string, boolean>>({})

  const filteredTopics = topics.filter(t => t.subject_id === subjectFilter)
  const totalPages     = Math.ceil(total / PAGE_SIZE)

  const fetchProblems = useCallback(async () => {
    setLoading(true)
    const from = (page - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    let q = supabase.from("problems")
      .select(`id, question, option_a, option_b, option_c, option_d,
               correct_answer, explanation, difficulty, is_free, problem_type,
               subjects(name), topics(name), subtopics(name)`,
               { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to)

    if (search)        q = q.ilike("question", `%${search}%`)
    if (subjectFilter) q = q.eq("subject_id",  subjectFilter)
    if (topicFilter)   q = q.eq("topic_id",    topicFilter)
    if (diffFilter)    q = q.eq("difficulty",   diffFilter)
    if (typeFilter)    q = q.ilike("problem_type", `%${typeFilter}%`)

    const { data, count } = await q
    setProblems((data as unknown as Problem[]) || [])
    setTotal(count || 0)
    setLoading(false)
    setExpandedId(null)
  }, [page, search, subjectFilter, topicFilter, diffFilter, typeFilter])

  useEffect(() => { fetchProblems() }, [fetchProblems])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [search, subjectFilter, topicFilter, diffFilter, typeFilter])

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">প্রশ্ন ব্যাংক</h2>
        <p className="text-xs text-zinc-500 mt-0.5">{total} problems · read-only</p>
      </div>

      {/* Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions…"
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-700 outline-none transition-all"
          />
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* Subject */}
          <div className="relative">
            <select value={subjectFilter} onChange={e => { setSubjectFilter(e.target.value); setTopicFilter("") }}
              className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none focus:border-violet-500/50 cursor-pointer">
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
          </div>
          {/* Topic */}
          <div className="relative">
            <select value={topicFilter} onChange={e => setTopicFilter(e.target.value)} disabled={!subjectFilter}
              className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none focus:border-violet-500/50 cursor-pointer disabled:opacity-40">
              <option value="">All Topics</option>
              {filteredTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
          </div>
          {/* Difficulty */}
          <div className="relative">
            <select value={diffFilter} onChange={e => setDiffFilter(e.target.value)}
              className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none focus:border-violet-500/50 cursor-pointer">
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
          </div>
          {/* Type */}
          <div className="relative">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none focus:border-violet-500/50 cursor-pointer">
              <option value="">All Types</option>
              <option value="board_mcq">Board MCQ</option>
              <option value="admission_mcq">Admission MCQ</option>
              <option value="board_cq">Board CQ</option>
              <option value="board_written">Board Written</option>
              <option value="admission_written">Admission Written</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Problems list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        </div>
      ) : problems.length === 0 ? (
        <div className="text-center py-16 text-zinc-600 text-sm">No problems found</div>
      ) : (
        <div className="space-y-2">
          {problems.map((p, i) => {
            const cq       = isCQ(p)
            const expanded = expandedId === p.id
            const opts     = (["a","b","c","d"] as const).filter(k => !!p[`option_${k}`])
            const hasTikz  = opts.some(k => p[`option_${k}`]?.includes("\\begin{tikzpicture}"))
            const plainLen = (t: string) => t.replace(/\$[^$]*\$/g,"X").replace(/\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}/g,"").trim().length
            const hasLong  = !hasTikz && opts.some(k => plainLen(p[`option_${k}`] ?? "") > 55)

            return (
              <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors">

                {/* Header row — click to expand */}
                <button
                  onClick={() => setExpandedId(expanded ? null : p.id)}
                  className="w-full px-5 py-4 text-left"
                >
                  <div className="flex items-start gap-3">
                    {/* Number */}
                    <span className="shrink-0 w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-mono text-zinc-500 mt-0.5">
                      {Math.max(1, (page - 1) * PAGE_SIZE + i + 1)}
                    </span>

                    <div className="flex-1 min-w-0">
                      {/* Meta */}
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-xs text-zinc-600 font-mono">
                          {p.subjects?.name} · {p.topics?.name}
                        </span>
                        <DifficultyBadge difficulty={p.difficulty} />
                        {cq ? (
                          <span className="text-xs font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">CQ</span>
                        ) : (
                          <span className="text-xs font-mono text-sky-400 bg-sky-400/10 border border-sky-400/20 px-2 py-0.5 rounded-full">MCQ</span>
                        )}
                        <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                          p.is_free
                            ? "text-sky-400 border-sky-400/20 bg-sky-400/10"
                            : "text-violet-400 border-violet-400/20 bg-violet-400/10"
                        }`}>{p.is_free ? "Free" : "Pro"}</span>
                      </div>
                      {/* Question preview — hidden when expanded */}
                      {!expanded && (
                        <div className="text-sm text-zinc-200 leading-relaxed line-clamp-2">
                          <MathText text={p.question} />
                        </div>
                      )}
                    </div>

                    <ChevronDown className={`w-4 h-4 text-zinc-600 shrink-0 mt-1 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {/* Expanded body */}
                {expanded && (
                  <div className="border-t border-zinc-800 px-5 py-4 space-y-3">

                    {/* Full question */}
                    <div className="text-sm text-zinc-200 leading-relaxed">
                      <MathText text={p.question} />
                    </div>

                    {/* MCQ options — read only */}
                    {!cq && opts.length > 0 && (
                      <div className="grid gap-2" style={{ gridTemplateColumns: hasLong ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
                        {opts.map(key => {
                          const value     = p[`option_${key}`]!
                          const isCorrect = p.correct_answer === key
                          return (
                            <div key={key}
                              className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border text-sm ${
                                isCorrect
                                  ? "border-emerald-400/40 bg-emerald-400/5 text-emerald-300"
                                  : "border-zinc-800 text-zinc-400"
                              }`}>
                              <span className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center text-xs font-bold font-mono mt-0.5 ${
                                isCorrect ? "bg-violet-500 text-white" : "bg-zinc-800 text-zinc-500"
                              }`}>{key.toUpperCase()}</span>
                              <span className="flex-1 text-xs leading-relaxed"><MathText text={value} /></span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* CQ parts */}
                    {cq && opts.length > 0 && (
                      <div className="rounded-xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
                        {opts.map((key, ki) => {
                          const labels = ["ক","খ","গ","ঘ"]
                          const marks  = ["২","৩","৩","৪"]
                          return (
                            <div key={key} className="flex items-center min-h-[40px]">
                              <span className="shrink-0 w-9 flex items-center justify-center self-stretch border-r border-zinc-800/60 font-bold text-sm text-violet-400">{labels[ki]}</span>
                              <span className="flex-1 text-zinc-300 leading-snug px-3 py-2 text-xs"><MathText text={p[`option_${key}`]!} /></span>
                              <span className="shrink-0 w-8 flex items-center justify-center self-stretch border-l border-zinc-800/60 text-xs font-mono text-zinc-500">{marks[ki]}</span>
                              {/* সমাধান — lock for free, toggle for premium */}
                              {isPremium ? (
                                <button
                                  onClick={() => setExplOpen(e => ({ ...e, [`${p.id}-${ki}`]: !e[`${p.id}-${ki}`] }))}
                                  className="shrink-0 flex items-center gap-1 self-stretch px-3 border-l border-zinc-800/60 text-[11px] font-mono text-amber-400/70 hover:text-amber-400 hover:bg-zinc-800/40 cursor-pointer transition-colors whitespace-nowrap"
                                >
                                  সমাধান<ChevronDown className={`w-3 h-3 ml-0.5 transition-transform duration-200 ${explOpen[`${p.id}-${ki}`] ? "rotate-180" : ""}`} />
                                </button>
                              ) : (
                                <div className="shrink-0 flex items-center justify-center self-stretch px-3 border-l border-zinc-800/60">
                                  <Lock className="w-3.5 h-3.5 text-violet-400/60" />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Explanation — locked for free users */}
                    {p.explanation && (
                      isPremium ? (
                        <div className="border border-zinc-800 rounded-xl overflow-hidden">
                          <button onClick={() => setExplOpen(e => ({ ...e, [p.id]: !e[p.id] }))}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors">
                            <span className="text-violet-400">EXPLANATION</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${explOpen[p.id] ? "rotate-180" : ""}`} />
                          </button>
                          {explOpen[p.id] && (
                            <div className="px-4 pb-3 pt-1 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800 bg-zinc-950">
                              <MathText text={p.explanation} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="border border-violet-400/20 bg-violet-400/5 rounded-xl px-4 py-3 flex items-center gap-3">
                          <div className="shrink-0 w-7 h-7 rounded-lg bg-violet-400/10 border border-violet-400/20 flex items-center justify-center">
                            <Lock className="w-3.5 h-3.5 text-violet-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-violet-300">ব্যাখ্যা দেখতে Pro প্রয়োজন</p>
                            <p className="text-xs text-zinc-500 mt-0.5">Upgrade to Pro to unlock explanations.</p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && total > 0 && (
        <div className="flex items-center justify-center gap-2 pt-2 pb-6">
          <button onClick={() => setPage(p => p > 1 ? p - 1 : 1)} disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {pageButtons(page, totalPages).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg border text-xs font-mono transition-colors ${
                page === p
                  ? "border-violet-400 bg-violet-400/10 text-violet-300"
                  : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              }`}>{p}</button>
          ))}
          <button onClick={() => setPage(p => p < totalPages ? p + 1 : totalPages)} disabled={page === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
