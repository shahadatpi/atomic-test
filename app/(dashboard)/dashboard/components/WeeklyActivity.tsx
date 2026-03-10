interface WeeklyActivityProps {
  weekActivity: number[]
  weekDays: string[]
}

export default function WeeklyActivity({ weekActivity, weekDays }: WeeklyActivityProps) {
  const maxVal = Math.max(...weekActivity) || 1

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-foreground">Weekly Activity</h2>
        <span className="text-xs text-muted-foreground font-mono">problems/day</span>
      </div>
      <div className="flex items-end gap-1.5 h-20">
        {weekActivity.map((val, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className="w-full rounded-sm bg-emerald-400/70 hover:bg-emerald-400 transition-colors min-h-[2px]"
              style={{ height: `${Math.max((val / maxVal) * 80, 2)}%` }}
            />
            <span className="text-muted-foreground text-xs font-mono">{weekDays[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
