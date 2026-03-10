import { LaTeXField } from "./LaTeXField"
import type { Answer } from "@/types"

interface OptionsSectionProps {
  options: {
    option_a: string
    option_b: string
    option_c: string
    option_d: string
  }
  correctAnswer: Answer
  onOptionChange:  (key: "option_a" | "option_b" | "option_c" | "option_d", val: string) => void
  onCorrectChange: (answer: Answer) => void
}

const OPTION_LIST = [
  { key: "option_a" as const, label: "A" },
  { key: "option_b" as const, label: "B" },
  { key: "option_c" as const, label: "C" },
  { key: "option_d" as const, label: "D" },
]

export function OptionsSection({
  options, correctAnswer, onOptionChange, onCorrectChange,
}: OptionsSectionProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
      <p className="text-xs text-zinc-600 font-mono tracking-widest">OPTIONS</p>

      <div className="space-y-3">
        {OPTION_LIST.map(({ key, label }) => {
          const answerKey = label.toLowerCase() as Answer
          const isCorrect = correctAnswer === answerKey

          return (
            <div key={key} className="flex items-start gap-3">
              {/* Correct answer selector */}
              <button
                type="button"
                onClick={() => onCorrectChange(answerKey)}
                title={`Mark ${label} as correct answer`}
                className={`mt-3 w-8 h-8 shrink-0 rounded-lg flex items-center justify-center
                            text-xs font-bold font-mono transition-all ${
                  isCorrect
                    ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20"
                    : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                }`}
              >
                {label}
              </button>

              <div className="flex-1">
                <LaTeXField
                  label={`Option ${label}${isCorrect ? " ✓ correct" : ""}`}
                  value={options[key]}
                  onChange={v => onOptionChange(key, v)}
                  placeholder={`Option ${label}`}
                  rows={2}
                />
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-zinc-700">Click the letter button to mark as correct answer</p>
    </div>
  )
}
