/**
 * FiltersBar — search + filter controls for the problems list.
 */
"use client";

import { Search, ChevronDown } from "lucide-react";

interface Subject  { id: string; name: string; }
interface Topic    { id: string; name: string; subject_id: string; }
interface Subtopic { id: string; name: string; topic_id: string; }

interface Props {
  search:         string;
  subjectFilter:  string;
  topicFilter:    string;
  subtopicFilter: string;
  diffFilter:     string;
  freeFilter:     string;
  subjects:       Subject[];
  topics:         Topic[];
  subtopics:      Subtopic[];
  onSearch:         (v: string) => void;
  onSubjectFilter:  (v: string) => void;
  onTopicFilter:    (v: string) => void;
  onSubtopicFilter: (v: string) => void;
  onDiffFilter:     (v: string) => void;
  onFreeFilter:     (v: string) => void;
  onClearAll:       () => void;
}

const SEL = "appearance-none bg-zinc-950 border border-zinc-800 rounded-xl pl-3 pr-8 py-2 text-xs text-zinc-400 outline-none focus:border-violet-500/50 transition-all";

export default function FiltersBar({
  search, subjectFilter, topicFilter, subtopicFilter, diffFilter, freeFilter,
  subjects, topics, subtopics,
  onSearch, onSubjectFilter, onTopicFilter, onSubtopicFilter, onDiffFilter, onFreeFilter, onClearAll,
}: Props) {
  const filteredTopics = subjectFilter
    ? topics.filter(t => t.subject_id === subjectFilter)
    : topics;

  const hasFilters = !!(subjectFilter || topicFilter || subtopicFilter || diffFilter || freeFilter || search);

  const selects = [
    { val: subjectFilter,  set: onSubjectFilter,  opts: subjects.map(s => [s.id, s.name] as [string,string]),                            placeholder: "All subjects"     },
    { val: topicFilter,    set: onTopicFilter,    opts: filteredTopics.map(t => [t.id, t.name] as [string,string]),                      placeholder: "All topics"       },
    { val: diffFilter,     set: onDiffFilter,     opts: [["easy","Easy"],["medium","Medium"],["hard","Hard"]] as [string,string][],       placeholder: "All difficulties" },
    { val: freeFilter,     set: onFreeFilter,     opts: [["free","Free only"],["pro","Pro only"]] as [string,string][],                  placeholder: "Free + Pro"       },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search questions…"
          className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500/50
                     rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200
                     placeholder-zinc-700 outline-none transition-all"
        />
      </div>

      {/* Filter dropdowns */}
      <div className="flex flex-wrap gap-2">
        {selects.map((sel, i) => (
          <div key={i} className="relative">
            <select value={sel.val} onChange={e => sel.set(e.target.value)} className={SEL}>
              <option value="">{sel.placeholder}</option>
              {sel.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
          </div>
        ))}

        {subtopics.length > 0 && (
          <div className="relative">
            <select value={subtopicFilter} onChange={e => onSubtopicFilter(e.target.value)} className={SEL}>
              <option value="">All subtopics</option>
              {subtopics.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
          </div>
        )}

        {hasFilters && (
          <button
            onClick={onClearAll}
            className="text-xs text-zinc-600 hover:text-zinc-400 px-3 py-2
                       rounded-xl hover:bg-zinc-800 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
