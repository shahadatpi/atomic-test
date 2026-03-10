import { Search, ChevronDown } from "lucide-react"
import type { Subject, Topic, Subtopic } from "@/types"

interface ProblemsFiltersBarProps {
  search:         string
  subjectFilter:  string
  topicFilter:    string
  subtopicFilter: string
  diffFilter:     string
  freeFilter:     string
  subjects:       Subject[]
  topics:         Topic[]
  subtopics:      Subtopic[]
  onSearchChange:         (v: string) => void
  onSubjectChange:        (v: string) => void
  onTopicChange:          (v: string) => void
  onSubtopicChange:       (v: string) => void
  onDiffChange:           (v: string) => void
  onFreeChange:           (v: string) => void
  onClearAll:             () => void
}

function FilterSelect({ value, onChange, placeholder, options }: {
  value:       string
  onChange:    (v: string) => void
  placeholder: string
  options:     { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="appearance-none bg-zinc-950 border border-zinc-800 rounded-xl pl-3 pr-8 py-2
                   text-xs text-zinc-400 outline-none focus:border-violet-500/50 transition-all">
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
    </div>
  )
}

export function ProblemsFiltersBar({
  search, subjectFilter, topicFilter, subtopicFilter, diffFilter, freeFilter,
  subjects, topics, subtopics,
  onSearchChange, onSubjectChange, onTopicChange, onSubtopicChange,
  onDiffChange, onFreeChange, onClearAll,
}: ProblemsFiltersBarProps) {
  const filteredTopics = subjectFilter
    ? topics.filter(t => t.subject_id === subjectFilter)
    : topics

  const hasActiveFilter = search || subjectFilter || topicFilter || subtopicFilter || diffFilter || freeFilter

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
        <input value={search} onChange={e => onSearchChange(e.target.value)}
          placeholder="Search questions…"
          className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500/50
                     rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-700
                     outline-none transition-all"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2 items-center">
        <FilterSelect value={subjectFilter} onChange={onSubjectChange}
          placeholder="All subjects"
          options={subjects.map(s => ({ value: s.id, label: s.name }))} />

        <FilterSelect value={topicFilter} onChange={onTopicChange}
          placeholder="All topics"
          options={filteredTopics.map(t => ({ value: t.id, label: t.name }))} />

        {subtopics.length > 0 && (
          <FilterSelect value={subtopicFilter} onChange={onSubtopicChange}
            placeholder="All subtopics"
            options={subtopics.map(s => ({ value: s.id, label: s.name }))} />
        )}

        <FilterSelect value={diffFilter} onChange={onDiffChange}
          placeholder="All difficulties"
          options={[
            { value: "easy",   label: "Easy"   },
            { value: "medium", label: "Medium" },
            { value: "hard",   label: "Hard"   },
          ]} />

        <FilterSelect value={freeFilter} onChange={onFreeChange}
          placeholder="Free + Pro"
          options={[
            { value: "free", label: "Free only" },
            { value: "pro",  label: "Pro only"  },
          ]} />

        {hasActiveFilter && (
          <button onClick={onClearAll}
            className="text-xs text-zinc-600 hover:text-zinc-400 px-3 py-2 rounded-xl
                       hover:bg-zinc-800 transition-colors">
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
