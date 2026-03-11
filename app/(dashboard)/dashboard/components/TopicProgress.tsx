const COLORS = [
  "bg-emerald-400",
  "bg-sky-400",
  "bg-violet-400",
  "bg-amber-400",
  "bg-rose-400",
  "bg-teal-400",
]

interface TopicEntry {
  name:   string
  solved: number
  total:  number
}

interface TopicProgressProps {
  topicProgress:   TopicEntry[]
  onPracticeClick: () => void
}

export default function TopicProgress({ topicProgress, onPracticeClick }: TopicProgressProps) {
  return (
    <div className="md:col-span-2 bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-foreground">Topic Progress</h2>
        <button
          onClick={onPracticeClick}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Practice →
        </button>
      </div>

      {topicProgress.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-muted-foreground text-sm">No attempts yet.</p>
          <button
            onClick={onPracticeClick}
            className="mt-2 text-xs text-emerald-400 hover:underline"
          >
            Start practicing →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {topicProgress.map((topic, i) => {
            const pct = topic.total > 0
              ? Math.round((topic.solved / topic.total) * 100)
              : 0
            return (
              <div key={topic.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-foreground truncate max-w-[70%]">
                    {topic.name}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono shrink-0 ml-2">
                    {topic.solved}/{topic.total}
                    <span className="ml-1.5 text-muted-foreground/50">({pct}%)</span>
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${COLORS[i % COLORS.length]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
