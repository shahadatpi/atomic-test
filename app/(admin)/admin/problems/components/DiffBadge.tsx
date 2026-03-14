export default function DiffBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    easy:   "text-violet-400 border-emerald-400/30 bg-emerald-400/10",
    medium: "text-amber-400  border-amber-400/30   bg-amber-400/10",
    hard:   "text-red-400    border-red-400/30     bg-red-400/10",
  };
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-mono ${styles[level] ?? "text-zinc-400 border-zinc-700"}`}>
      {level}
    </span>
  );
}
