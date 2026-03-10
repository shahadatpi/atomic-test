import { LaTeXField } from "./LaTeXField"

interface SolutionSectionProps {
  explanation: string
  hint:        string
  onExplanationChange: (v: string) => void
  onHintChange:        (v: string) => void
}

export function SolutionSection({
  explanation, hint, onExplanationChange, onHintChange,
}: SolutionSectionProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
      <p className="text-xs text-zinc-600 font-mono tracking-widest">SOLUTION</p>

      <LaTeXField
        label="Explanation"
        value={explanation}
        onChange={onExplanationChange}
        placeholder="Step-by-step working shown after answering..."
        rows={4}
        hint="optional"
      />

      <LaTeXField
        label="Hint"
        value={hint}
        onChange={onHintChange}
        placeholder="A nudge shown on request..."
        rows={2}
        hint="optional · Pro only"
      />
    </div>
  )
}
