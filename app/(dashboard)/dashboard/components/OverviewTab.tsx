import StatsGrid    from "./StatsGrid"
import WeeklyActivity from "./WeeklyActivity"
import TopicProgress  from "./TopicProgress"
import AttemptsTable  from "./AttemptsTable"
import UpgradeBanner  from "./UpgradeBanner"
import type { Attempt, Topic } from "../types"

interface OverviewTabProps {
  correctAttempts: number
  totalAttempts: number
  streak: number
  accuracy: number
  weekActivity: number[]
  weekDays: string[]
  topicProgress: { name: string; solved: number; total: number }[]
  attempts: Attempt[]
  onPracticeClick: () => void
  onProgressClick: () => void
}

export default function OverviewTab({
  correctAttempts,
  totalAttempts,
  streak,
  accuracy,
  weekActivity,
  weekDays,
  topicProgress,
  attempts,
  onPracticeClick,
  onProgressClick,
}: OverviewTabProps) {
  return (
    <div className="space-y-5">
      <StatsGrid
        correctAttempts={correctAttempts}
        totalAttempts={totalAttempts}
        streak={streak}
        accuracy={accuracy}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <WeeklyActivity weekActivity={weekActivity} weekDays={weekDays} />
        <TopicProgress topicProgress={topicProgress} onPracticeClick={onPracticeClick} />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-medium text-white">Recent Attempts</h2>
          <button
            onClick={onProgressClick}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            View all →
          </button>
        </div>
        <AttemptsTable
          attempts={attempts}
          limit={8}
          onPracticeClick={onPracticeClick}
        />
      </div>

      <UpgradeBanner />
    </div>
  )
}
