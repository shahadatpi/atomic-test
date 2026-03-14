import { CheckCircle, XCircle } from "lucide-react"
import DifficultyBadge from "./DifficultyBadge"
import type { Attempt } from "../types"

interface AttemptsTableProps {
  attempts: Attempt[]
  limit?: number
  onPracticeClick?: () => void
  showAnswer?: boolean
}

export default function AttemptsTable({
  attempts,
  limit,
  onPracticeClick,
  showAnswer = false,
}: AttemptsTableProps) {
  const rows = limit ? attempts.slice(0, limit) : attempts

  if (attempts.length === 0) {
    return (
      <div className="px-5 py-8 text-center">
        <p className="text-muted-foreground text-sm">No attempts yet.</p>
        {onPracticeClick && (
          <button onClick={onPracticeClick} className="mt-2 text-emerald-400 text-sm hover:underline">
            Start practicing →
          </button>
        )}
      </div>
    )
  }

  const headers = showAnswer
    ? ["Problem", "Subject", "Difficulty", "Your Answer", "Result", "Date"]
    : ["Problem", "Subject", "Difficulty", "Result", "Time"]

  return (
    <div className="overflow-x-auto" style={{ fontFamily: "'Kalpurush', 'Roboto', sans-serif" }}>
      <table className="w-full min-w-[500px]">
        <thead>
          <tr className="border-b border-border">
            {headers.map(h => (
              <th key={h} className="px-5 py-3 text-left text-xs text-muted-foreground font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((a, i) => {
            const p = a.problems as any
            return (
              <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors">
                <td className="px-5 py-3.5 text-sm text-foreground max-w-[200px] truncate">
                  {p?.question?.replace(/\$[^$]*\$/g, "[math]").slice(0, 50)}…
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                    {p?.subjects?.name || "—"}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <DifficultyBadge difficulty={p?.difficulty || ""} />
                </td>
                {showAnswer && (
                  <td className="px-5 py-3.5 text-xs text-muted-foreground font-mono uppercase">
                    {a.selected_answer}
                  </td>
                )}
                <td className="px-5 py-3.5">
                  {a.is_correct ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5" /> Correct
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-rose-400">
                      <XCircle className="w-3.5 h-3.5" /> Wrong
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-xs text-muted-foreground font-mono">
                  {new Date(a.created_at).toLocaleDateString()}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
