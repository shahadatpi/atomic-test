const COLORS = [
  "bg-emerald-400",
  "bg-sky-400",
  "bg-violet-400",
  "bg-amber-400",
  "bg-rose-400",
]

interface TopicEntry {
  name: string
  solved: number
  total: number
}

interface TopicProgressProps {
  topicProgress: TopicEntry[]
  onPracticeClick: () => void
}

export default function TopicProgress({ topicProgress, onPracticeClick }: TopicProgressProps) {
  return (
    <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-white">Topics Progress</h2>
        <button
          onClick={onPracticeClick}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Practice →
        </button>
      </div>

      {topicProgress.length === 0 ? (
        <p className="text-zinc-600 text-sm">No attempts yet. Start practicing!</p>
      ) : (
        <div className="space-y-3">
          {topicProgress.map((topic, i) => (
            <div key={topic.name}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-zinc-400">{topic.name}</span>
                <span className="text-xs text-zinc-600 font-mono">
                  {topic.solved}/{topic.total}
                </span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${COLORS[i % COLORS.length]}`}
                  style={{ width: `${(topic.solved / topic.total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
