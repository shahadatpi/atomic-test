import AttemptsTable from "./AttemptsTable"
import type { Attempt } from "../types"

interface ProgressTabProps {
  attempts: Attempt[]
  totalAttempts: number
  correctAttempts: number
  accuracy: number
  onPracticeClick: () => void
}

export default function ProgressTab({
  attempts,
  totalAttempts,
  correctAttempts,
  accuracy,
  onPracticeClick,
}: ProgressTabProps) {
  const cards = [
    { label: "Total Attempts", value: totalAttempts,                      color: "text-white"       },
    { label: "Correct",        value: correctAttempts,                    color: "text-emerald-400" },
    { label: "Wrong",          value: totalAttempts - correctAttempts,    color: "text-rose-400"    },
    { label: "Accuracy",       value: `${accuracy}%`,                    color: "text-sky-400"     },
  ]

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(({ label, value, color }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-zinc-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Full table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-medium text-white">All Attempts</h2>
        </div>
        <AttemptsTable
          attempts={attempts}
          showAnswer
          onPracticeClick={onPracticeClick}
        />
      </div>
    </div>
  )
}
