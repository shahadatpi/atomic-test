import MathText from "@/components/math/MathText"
import type { Difficulty, Answer } from "@/types"

interface ProblemPreviewProps {
  question:      string
  options: {
    option_a: string
    option_b: string
    option_c: string
    option_d: string
  }
  correctAnswer: Answer
  difficulty:    Difficulty
  isFree:        boolean
  explanation?:  string
}

const OPTION_LIST = [
  { key: "option_a" as const, label: "A" },
  { key: "option_b" as const, label: "B" },
  { key: "option_c" as const, label: "C" },
  { key: "option_d" as const, label: "D" },
]

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  easy:   "text-violet-400 border-violet-400/30 bg-violet-500/10",
  medium: "text-amber-400  border-amber-400/30  bg-amber-400/10",
  hard:   "text-red-400    border-red-400/30    bg-red-400/10",
}

export function ProblemPreview({
  question, options, correctAnswer, difficulty, isFree, explanation,
}: ProblemPreviewProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
      <p className="text-xs text-zinc-600 font-mono tracking-widest">PREVIEW</p>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-3 py-1 rounded-full border font-mono ${DIFFICULTY_STYLES[difficulty]}`}>
          {difficulty}
        </span>
        <span className={`text-xs px-3 py-1 rounded-full border font-mono ${
          isFree
            ? "text-sky-400 border-sky-400/30 bg-sky-400/10"
            : "text-violet-400 border-violet-400/30 bg-violet-400/10"
        }`}>
          {isFree ? "Free" : "Pro"}
        </span>
      </div>

      {/* Question */}
      <div className="text-zinc-100 text-base leading-relaxed">
        <MathText text={question || "No question text yet…"} />
      </div>

      {/* Options */}
      <div className="space-y-2">
        {OPTION_LIST.map(({ key, label }) => {
          const answerKey = label.toLowerCase() as Answer
          const isCorrect = correctAnswer === answerKey
          return (
            <div
              key={key}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
                isCorrect
                  ? "border-violet-400/50 bg-violet-500/10 text-emerald-300"
                  : "border-zinc-800 text-zinc-400"
              }`}
            >
              <span className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center
                                text-xs font-bold font-mono ${
                isCorrect ? "bg-violet-500 text-white" : "bg-zinc-800 text-zinc-500"
              }`}>
                {label}
              </span>
              <MathText text={options[key] || `Option ${label}`} />
              {isCorrect && <span className="ml-auto text-violet-400 text-xs">✓ correct</span>}
            </div>
          )
        })}
      </div>

      {/* Explanation */}
      {explanation && (
        <div className="border-t border-zinc-800 pt-4 space-y-1">
          <p className="text-xs text-violet-400 font-mono">EXPLANATION</p>
          <div className="text-zinc-400 text-sm leading-relaxed">
            <MathText text={explanation} />
          </div>
        </div>
      )}
    </div>
  )
}
