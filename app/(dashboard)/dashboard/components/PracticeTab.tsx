"use client"

import { useState } from "react"
import ProblemFilters from "./ProblemFilters"
import ProblemList    from "./ProblemList"
import ProblemCard    from "./ProblemCard"
import type { Problem, Attempt, Subject, Topic } from "../types"

interface PracticeTabProps {
  subjects: Subject[]
  topics: Topic[]
  problems: Problem[]
  attempts: Attempt[]
  loadingProblems: boolean
  subjectFilter: string
  topicFilter: string
  diffFilter: string
  isPremium: boolean
  onSubjectChange: (id: string) => void
  onTopicChange:   (id: string) => void
  onDiffChange:    (d: string) => void
  onRefresh:       () => void
  onSaveAttempt:   (problem: Problem, answer: string, correct: boolean) => Promise<void>
}

export default function PracticeTab({
  subjects, topics, problems, attempts, loadingProblems,
  subjectFilter, topicFilter, diffFilter, isPremium,
  onSubjectChange, onTopicChange, onDiffChange, onRefresh, onSaveAttempt,
}: PracticeTabProps) {
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null)

  return (
    <div className="flex gap-5 flex-1 min-h-0">

      {/* Left: filters + list */}
      <div className="w-72 shrink-0 overflow-y-auto pb-4">
        <div className="space-y-3">
          <ProblemFilters
            subjects={subjects} topics={topics}
            subjectFilter={subjectFilter} topicFilter={topicFilter} diffFilter={diffFilter}
            onSubjectChange={onSubjectChange} onTopicChange={onTopicChange} onDiffChange={onDiffChange}
          />
          <ProblemList
            problems={problems} attempts={attempts}
            activeProblemId={activeProblem?.id} loading={loadingProblems}
            onSelect={setActiveProblem} onRefresh={onRefresh}
          />
        </div>
      </div>

      {/* Right: problem card */}
      <div className="flex-1 min-w-0 overflow-y-auto pb-4">
        <ProblemCard
          problem={activeProblem}
          firstProblem={problems[0]}
          onSubmit={onSaveAttempt}
          onSelectFirst={setActiveProblem}
          isPremium={isPremium}
        />
      </div>

    </div>
  )
}
