"use client"

import { useRef, useEffect, useState } from "react"
import { X, Save, Loader2, Eye, EyeOff } from "lucide-react"
import supabase from "@/lib/supabase"
import MathText from "@/components/math/MathText"
import { InstTagPicker } from "./InstTagPicker"
import type { Problem } from "@/types"

/* ── LaTeX textarea with preview toggle (edit modal variant) ─────────────── */
function LaTeXField({
  label, value, onChange, rows = 3, placeholder, isCorrect, autoGrow = false,
}: {
  label:        string
  value:        string
  onChange:     (v: string) => void
  rows?:        number
  placeholder?: string
  isCorrect?:   boolean
  autoGrow?:    boolean
}) {
  const [preview, setPreview] = useState(false)
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!autoGrow || !taRef.current) return
    const ta = taRef.current
    ta.style.height = "auto"
    ta.style.height = Math.max(ta.scrollHeight, rows * 24) + "px"
  }, [value, autoGrow, rows])

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-xs font-mono ${isCorrect ? "text-violet-400" : "text-zinc-500"}`}>
          {label}
        </span>
        <button type="button" onClick={() => setPreview(p => !p)}
          className="flex items-center gap-1 text-xs text-zinc-600 hover:text-violet-400 transition-colors">
          {preview ? <><EyeOff className="w-3 h-3" /> Edit</> : <><Eye className="w-3 h-3" /> Preview</>}
        </button>
      </div>

      {preview ? (
        <div className={`min-h-[100px] rounded-xl px-4 py-3 text-sm leading-relaxed border ${
          isCorrect
            ? "border-emerald-400/30 bg-emerald-400/5 text-emerald-200"
            : "border-zinc-800 bg-zinc-950 text-zinc-300"
        }`}>
          {value.trim()
            ? <MathText text={value} />
            : <span className="text-zinc-700 italic text-xs">empty</span>}
        </div>
      ) : (
        <textarea ref={taRef} value={value} onChange={e => onChange(e.target.value)}
          rows={rows} placeholder={placeholder}
          style={autoGrow ? { resize: "none", overflow: "hidden" } : undefined}
          className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500/50 rounded-xl
                     px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-700 outline-none transition-all
                     font-mono min-h-[80px] resize-y"
        />
      )}
    </div>
  )
}

/* ── Props ───────────────────────────────────────────────────────────────── */
interface EditModalProps {
  problem:  Problem
  onClose:  () => void
  onSave:   (updated: Partial<Problem>) => void
}

export function EditModal({ problem, onClose, onSave }: EditModalProps) {
  const [question,      setQuestion]      = useState(problem.question)
  const [options,       setOptions]       = useState({
    a: problem.option_a,
    b: problem.option_b,
    c: problem.option_c,
    d: problem.option_d,
  })
  const [correctAnswer, setCorrectAnswer] = useState(problem.correct_answer)
  const [explanation,   setExplanation]   = useState(problem.explanation ?? "")
  const [difficulty,    setDifficulty]    = useState(problem.difficulty)
  const [tags,          setTags]          = useState(problem.tags?.join(", ") ?? "")
  const [source,        setSource]        = useState(problem.source ?? "")
  const [isFree,        setIsFree]        = useState(problem.is_free)
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState("")

  const handleSave = async () => {
    if (!question.trim()) { setError("Question cannot be empty"); return }
    if (!options.a.trim() || !options.b.trim() || !options.c.trim() || !options.d.trim()) {
      setError("All four options must be filled in"); return
    }

    setSaving(true)
    setError("")

    const tagsArr = tags.split(",").map(t => t.trim()).filter(Boolean)

    const { error: dbErr } = await supabase.from("problems").update({
      question:       question.trim(),
      option_a:       options.a.trim(),
      option_b:       options.b.trim(),
      option_c:       options.c.trim(),
      option_d:       options.d.trim(),
      correct_answer: correctAnswer,
      explanation:    explanation.trim() || null,
      difficulty,
      tags:           tagsArr.length ? tagsArr : null,
      source:         source.trim() || null,
      is_free:        isFree,
      updated_at:     new Date().toISOString(),
    }).eq("id", problem.id)

    setSaving(false)

    if (dbErr) { setError(dbErr.message); return }

    onSave({
      question, explanation: explanation || null, source: source || null,
      option_a: options.a, option_b: options.b, option_c: options.c, option_d: options.d,
      correct_answer: correctAnswer, difficulty, is_free: isFree,
      tags: tagsArr.length ? tagsArr : null,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-5xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl
                      flex flex-col max-h-[95vh] h-[95vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <div>
            <p className="text-xs text-violet-400 font-mono tracking-widest">ADMIN · EDIT PROBLEM</p>
            <p className="text-xs text-zinc-600 font-mono mt-0.5 truncate max-w-sm">{problem.id}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* Question */}
          <LaTeXField label="QUESTION" value={question} onChange={setQuestion} rows={4}
            placeholder="LaTeX supported — $math$, $$display$$, \begin{tikzpicture}...\end{tikzpicture}" />

          {/* Options */}
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Options</p>
              <p className="text-xs text-amber-400/70">Click letter button to set correct answer</p>
            </div>
            <div className="space-y-4">
              {(["a", "b", "c", "d"] as const).map(key => (
                <div key={key} className="flex items-start gap-3">
                  <button type="button" onClick={() => setCorrectAnswer(key)}
                    title={`Mark ${key.toUpperCase()} as correct`}
                    className={`mt-6 w-9 h-9 shrink-0 rounded-xl flex items-center justify-center
                                text-sm font-bold font-mono transition-all ${
                      correctAnswer === key
                        ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20 ring-2 ring-violet-500/40"
                        : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
                    }`}>
                    {key.toUpperCase()}
                  </button>
                  <div className="flex-1">
                    <LaTeXField
                      label={`OPTION ${key.toUpperCase()}${correctAnswer === key ? " — ✓ correct answer" : ""}`}
                      value={options[key]} onChange={v => setOptions(o => ({ ...o, [key]: v }))}
                      rows={2} placeholder={`Option ${key.toUpperCase()}`}
                      isCorrect={correctAnswer === key}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <LaTeXField label="EXPLANATION (optional)" value={explanation} onChange={setExplanation}
            rows={8} autoGrow placeholder="Step-by-step solution shown after student answers..." />

          {/* Difficulty + Access */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">Difficulty</p>
              <div className="flex gap-2">
                {(["easy", "medium", "hard"] as const).map(d => (
                  <button key={d} type="button" onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all capitalize ${
                      difficulty === d
                        ? d === "easy"   ? "border-emerald-400 bg-emerald-400/10 text-emerald-400"
                        : d === "medium" ? "border-amber-400   bg-amber-400/10   text-amber-400"
                        :                  "border-red-400     bg-red-400/10     text-red-400"
                        : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
                    }`}>{d}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">Access</p>
              <div className="flex gap-2">
                {([["free", true], ["pro", false]] as const).map(([label, val]) => (
                  <button key={label} type="button" onClick={() => setIsFree(val)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all capitalize ${
                      isFree === val
                        ? val ? "border-sky-400    bg-sky-400/10    text-sky-400"
                              : "border-violet-400 bg-violet-400/10 text-violet-400"
                        : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
                    }`}>{label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Tag picker */}
          <InstTagPicker tags={tags} onChange={setTags} />

          {/* Source */}
          <div>
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
              Source <span className="normal-case text-zinc-700">(optional)</span>
            </p>
            <input value={source} onChange={e => setSource(e.target.value)}
              placeholder="e.g. BUET 2024, HSC Board 2023"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500/50
                         rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-700
                         outline-none transition-all"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-4 py-3 rounded-xl">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/60 shrink-0">
          <button onClick={onClose} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-violet-500 hover:bg-violet-400 disabled:opacity-50
                       text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors">
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  )
}
