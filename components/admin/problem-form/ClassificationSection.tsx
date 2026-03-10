import { Tag } from "lucide-react"
import { FormField } from "./FormField"
import { SelectField } from "./SelectField"
import type { Subject, Topic, Subtopic, Difficulty } from "@/types"

interface ClassificationSectionProps {
  subjects:    Subject[]
  topics:      Topic[]
  subtopics:   Subtopic[]
  subjectId:   string
  topicId:     string
  subtopicId:  string
  difficulty:  Difficulty
  isFree:      boolean
  source:      string
  tags:        string
  onChange: (key: string, value: string | boolean) => void
}

const DIFFICULTY_OPTIONS = [
  { value: "easy",   label: "Easy"   },
  { value: "medium", label: "Medium" },
  { value: "hard",   label: "Hard"   },
]

const ACCESS_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "pro",  label: "Pro"  },
]

export function ClassificationSection({
  subjects, topics, subtopics,
  subjectId, topicId, subtopicId,
  difficulty, isFree, source, tags,
  onChange,
}: ClassificationSectionProps) {
  const filteredTopics = topics.filter(t => t.subject_id === subjectId)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
      <p className="text-xs text-zinc-600 font-mono tracking-widest">CLASSIFICATION</p>

      {/* Subject / Topic / Subtopic */}
      <div className="grid grid-cols-3 gap-4">
        <FormField label="Subject">
          <SelectField
            value={subjectId}
            onChange={v => onChange("subject_id", v)}
            options={subjects.map(s => ({ value: s.id, label: s.name }))}
            placeholder="Select subject"
          />
        </FormField>

        <FormField label="Topic">
          <SelectField
            value={topicId}
            onChange={v => onChange("topic_id", v)}
            options={filteredTopics.map(t => ({ value: t.id, label: t.name }))}
            placeholder={subjectId ? "Select topic" : "Select subject first"}
            disabled={!subjectId}
          />
        </FormField>

        <FormField label="Subtopic" hint="optional">
          <SelectField
            value={subtopicId}
            onChange={v => onChange("subtopic_id", v)}
            options={subtopics.map(s => ({ value: s.id, label: s.name }))}
            placeholder={topicId ? "Select subtopic" : "Select topic first"}
            disabled={!topicId}
          />
        </FormField>
      </div>

      {/* Difficulty / Access / Source */}
      <div className="grid grid-cols-3 gap-4">
        <FormField label="Difficulty">
          <SelectField
            value={difficulty}
            onChange={v => onChange("difficulty", v)}
            options={DIFFICULTY_OPTIONS}
          />
        </FormField>

        <FormField label="Access">
          <SelectField
            value={isFree ? "free" : "pro"}
            onChange={v => onChange("is_free", v === "free")}
            options={ACCESS_OPTIONS}
          />
        </FormField>

        <FormField label="Source" hint="optional">
          <input
            value={source}
            onChange={e => onChange("source", e.target.value)}
            placeholder="e.g. HSC 2023"
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-violet-500/60
                       rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-700
                       outline-none transition-all"
          />
        </FormField>
      </div>

      {/* Tags */}
      <FormField label="Tags" hint="comma separated">
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
          <input
            value={tags}
            onChange={e => onChange("tags", e.target.value)}
            placeholder="calculus, differentiation, chain-rule"
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-violet-500/60
                       rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-700
                       outline-none transition-all"
          />
        </div>
        {tags && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.split(",").map(t => t.trim()).filter(Boolean).map(tag => (
              <span key={tag} className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-400 px-2.5 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </FormField>
    </div>
  )
}
