interface DifficultyBadgeProps {
  difficulty: string
  className?: string
}

export default function DifficultyBadge({ difficulty, className = "" }: DifficultyBadgeProps) {
  const styles =
    difficulty === "easy"   ? "text-emerald-400 bg-emerald-400/10" :
    difficulty === "medium" ? "text-amber-400  bg-amber-400/10"   :
                              "text-rose-400   bg-rose-400/10"

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-md capitalize ${styles} ${className}`}>
      {difficulty}
    </span>
  )
}
