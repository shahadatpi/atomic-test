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
  onSubjectChange: (id: string) => void
  onTopicChange:   (id: string) => void
  onDiffChange:    (d: string) => void
  onRefresh:       () => void
  onSaveAttempt:   (problem: Problem, answer: string, correct: boolean) => Promise<void>
}

export default function PracticeTab({
  subjects,
  topics,
  problems,
  attempts,
  loadingProblems,
  subjectFilter,
  topicFilter,
  diffFilter,
  onSubjectChange,
  onTopicChange,
  onDiffChange,
  onRefresh,
  onSaveAttempt,
}: PracticeTabProps) {
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Left column: filters + list */}
      <div className="lg:col-span-1 space-y-3">
        <ProblemFilters
          subjects={subjects}
          topics={topics}
          subjectFilter={subjectFilter}
          topicFilter={topicFilter}
          diffFilter={diffFilter}
          onSubjectChange={onSubjectChange}
          onTopicChange={onTopicChange}
          onDiffChange={onDiffChange}
        />
        <ProblemList
          problems={problems}
          attempts={attempts}
          activeProblemId={activeProblem?.id}
          loading={loadingProblems}
          onSelect={setActiveProblem}
          onRefresh={onRefresh}
        />
      </div>

      {/* Right column: active problem */}
      <div className="lg:col-span-2">
        <ProblemCard
          problem={activeProblem}
          firstProblem={problems[0]}
          onSubmit={onSaveAttempt}
          onSelectFirst={setActiveProblem}
        />
      </div>
    </div>
  )
}
