import { Trophy, Flame, Target, Clock } from "lucide-react"

interface StatsGridProps {
  correctAttempts: number
  totalAttempts: number
  streak: number
  accuracy: number
}

export default function StatsGrid({
  correctAttempts,
  totalAttempts,
  streak,
  accuracy,
}: StatsGridProps) {
  const cards = [
    {
      label: "Problems Solved",
      value: correctAttempts.toString(),
      change: `${totalAttempts} attempted`,
      icon: Trophy,
      color: "text-emerald-400",
    },
    {
      label: "Current Streak",
      value: `${streak}d`,
      change: "days in a row",
      icon: Flame,
      color: "text-amber-400",
    },
    {
      label: "Accuracy Rate",
      value: `${accuracy}%`,
      change: `${correctAttempts}/${totalAttempts} correct`,
      icon: Target,
      color: "text-sky-400",
    },
    {
      label: "Total Attempts",
      value: totalAttempts.toString(),
      change: "all time",
      icon: Clock,
      color: "text-violet-400",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {cards.map(({ label, value, change, icon: Icon, color }) => (
        <div
          key={label}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-5
                     hover:-translate-y-0.5 transition-transform"
        >
          <div className="flex items-start justify-between mb-3">
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <p className="text-2xl md:text-3xl font-semibold text-white mb-0.5">{value}</p>
          <p className="text-xs text-zinc-500">{label}</p>
          <p className={`text-xs mt-2 ${color}`}>{change}</p>
        </div>
      ))}
    </div>
  )
}
