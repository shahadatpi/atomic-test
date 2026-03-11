interface WeeklyActivityProps {
  weekActivity: number[]
  weekDays:     string[]
}

export default function WeeklyActivity({ weekActivity, weekDays }: WeeklyActivityProps) {
  const maxVal   = Math.max(...weekActivity, 1)
  const total    = weekActivity.reduce((a, b) => a + b, 0)
  const todayVal = weekActivity[weekActivity.length - 1]

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-foreground">Weekly Activity</h2>
        <span className="text-xs text-muted-foreground font-mono">{total} this week</span>
      </div>

      <div className="flex items-end gap-1.5 h-20">
        {weekActivity.map((val, i) => {
          const isToday   = i === weekActivity.length - 1
          const heightPct = Math.max((val / maxVal) * 100, val > 0 ? 8 : 2)
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
              <div className="relative w-full flex items-end justify-center">
                {val > 0 && (
                  <span className="absolute -top-5 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                    {val}
                  </span>
                )}
                <div
                  className={`w-full rounded-sm transition-all ${
                    isToday
                      ? "bg-emerald-400"
                      : val > 0
                        ? "bg-emerald-400/50 hover:bg-emerald-400/70"
                        : "bg-muted"
                  }`}
                  style={{ height: `${heightPct}%`, minHeight: "3px" }}
                />
              </div>
              <span className={`text-[10px] font-mono ${
                isToday ? "text-emerald-400" : "text-muted-foreground"
              }`}>
                {weekDays[i]}
              </span>
            </div>
          )
        })}
      </div>

      {todayVal > 0 && (
        <p className="text-xs text-muted-foreground mt-3">
          <span className="text-emerald-400 font-medium">{todayVal}</span> problems today
        </p>
      )}
    </div>
  )
}
