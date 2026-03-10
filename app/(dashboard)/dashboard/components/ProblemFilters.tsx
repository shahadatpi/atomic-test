"use client"

import { ChevronDown, Filter } from "lucide-react"
import type { Subject, Topic } from "../types"

interface ProblemFiltersProps {
  subjects: Subject[]
  topics: Topic[]
  subjectFilter: string
  topicFilter: string
  diffFilter: string
  onSubjectChange: (id: string) => void
  onTopicChange: (id: string) => void
  onDiffChange: (d: string) => void
}

function SelectField({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none bg-background border border-border rounded-lg
                   px-3 pr-8 py-2 text-xs text-foreground outline-none
                   focus:ring-2 focus:ring-emerald-400/40"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3
                              text-muted-foreground pointer-events-none" />
    </div>
  )
}

export default function ProblemFilters({
  subjects,
  topics,
  subjectFilter,
  topicFilter,
  diffFilter,
  onSubjectChange,
  onTopicChange,
  onDiffChange,
}: ProblemFiltersProps) {
  const filteredTopics = subjectFilter
    ? topics.filter(t => t.subject_id === subjectFilter)
    : topics

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Filters</span>
      </div>

      <SelectField value={subjectFilter} onChange={v => { onSubjectChange(v); onTopicChange("") }}>
        <option value="">All subjects</option>
        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </SelectField>

      <SelectField value={topicFilter} onChange={onTopicChange}>
        <option value="">All topics</option>
        {filteredTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </SelectField>

      <SelectField value={diffFilter} onChange={onDiffChange}>
        <option value="">All difficulties</option>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </SelectField>
    </div>
  )
}
