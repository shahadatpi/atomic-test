"use client"

import { Loader2, BookOpen } from "lucide-react"
import { useProblemsFilter }   from "@/hooks/admin/useProblemsFilter"
import { ProblemsFiltersBar }  from "@/components/admin/problems/ProblemsFiltersBar"
import { ProblemCard }         from "@/components/admin/problems/ProblemCard"
import { Pagination }          from "@/components/admin/problems/Pagination"

export default function ProblemsListPage() {
  const {
    problems, subjects, topics, subtopics,
    loading, total, page, PAGE_SIZE, totalPages,
    search, subjectFilter, topicFilter, subtopicFilter, diffFilter, freeFilter,
    setPage, handleDelete, clearAll,
    onSearchChange, onSubjectChange, onTopicChange,
    onSubtopicChange, onDiffChange, onFreeChange,
  } = useProblemsFilter()

  return (
    <div
      className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-violet-400 font-mono tracking-widest mb-1">ADMIN</p>
            <h1 className="text-2xl font-bold text-white">
              Problems{" "}
              <span className="ml-3 text-base font-normal text-zinc-600">({total})</span>
            </h1>
          </div>
          <a
            href="/admin/add-problem"
            className="flex items-center gap-2 bg-violet-500 hover:bg-violet-400 text-white
                       font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors
                       shadow-lg shadow-violet-500/20"
          >
            <BookOpen className="w-4 h-4" /> Add Problem
          </a>
        </div>

        {/* ── Filters ── */}
        <ProblemsFiltersBar
          search={search}
          subjectFilter={subjectFilter}
          topicFilter={topicFilter}
          subtopicFilter={subtopicFilter}
          diffFilter={diffFilter}
          freeFilter={freeFilter}
          subjects={subjects}
          topics={topics}
          subtopics={subtopics}
          onSearchChange={onSearchChange}
          onSubjectChange={onSubjectChange}
          onTopicChange={onTopicChange}
          onSubtopicChange={onSubtopicChange}
          onDiffChange={onDiffChange}
          onFreeChange={onFreeChange}
          onClearAll={clearAll}
        />

        {/* ── Pagination top ── */}
        <Pagination
          page={page} totalPages={totalPages}
          total={total} pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />

        {/* ── Problems list ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          </div>
        ) : problems.length === 0 ? (
          <div className="text-center py-20 space-y-2">
            <BookOpen className="w-10 h-10 text-zinc-800 mx-auto" />
            <p className="text-zinc-600">No problems found</p>
            <a href="/admin/add-problem" className="text-sm text-violet-400 hover:underline">
              Add your first problem →
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {problems.map((p, i) => (
              <ProblemCard
                key={p.id}
                problem={p}
                number={page * PAGE_SIZE + i + 1}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* ── Pagination bottom ── */}
        <Pagination
          page={page} totalPages={totalPages}
          total={total} pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />

      </div>
    </div>
  )
}
