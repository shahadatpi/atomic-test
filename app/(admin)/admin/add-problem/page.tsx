"use client"

import { useState } from "react"
import { Eye, EyeOff, Loader2, Plus, Trash2 } from "lucide-react"

import { useProblemForm }         from "@/hooks/admin/useProblemForm"
import { FormStatusBanner }       from "@/components/admin/problem-form/FormStatusBanner"
import { ClassificationSection }  from "@/components/admin/problem-form/ClassificationSection"
import { LaTeXField }             from "@/components/admin/problem-form/LaTeXField"
import { OptionsSection }         from "@/components/admin/problem-form/OptionsSection"
import { SolutionSection }        from "@/components/admin/problem-form/SolutionSection"
import { ProblemPreview }         from "@/components/admin/problem-form/ProblemPreview"
import type { Answer }            from "@/types"

export default function AddProblemPage() {
  const [showPreview, setShowPreview] = useState(false)

  const {
    form, setField, handleChange,
    subjects, topics, subtopics,
    loading, status, errorMsg,
    handleSubmit, resetForm,
  } = useProblemForm()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-violet-400 font-mono tracking-widest mb-1">ADMIN</p>
            <h1 className="text-2xl font-bold text-white">Add Problem</h1>
          </div>
          <button
            onClick={() => setShowPreview(p => !p)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all ${
              showPreview
                ? "border-violet-400/50 bg-violet-500/10 text-violet-400"
                : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? "Hide Preview" : "Full Preview"}
          </button>
        </div>

        <FormStatusBanner status={status} errorMessage={errorMsg} />

        <ClassificationSection
          subjects={subjects} topics={topics} subtopics={subtopics}
          subjectId={form.subject_id} topicId={form.topic_id} subtopicId={form.subtopic_id}
          difficulty={form.difficulty} isFree={form.is_free} source={form.source} tags={form.tags}
          onChange={handleChange}
        />

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <p className="text-xs text-zinc-600 font-mono tracking-widest">QUESTION</p>
          <LaTeXField
            label="Question text" value={form.question} onChange={v => setField("question", v)}
            placeholder="Use $...$ for inline math, $$...$$ for block math" rows={4} hint="LaTeX supported"
          />
        </div>

        <OptionsSection
          options={{ option_a: form.option_a, option_b: form.option_b, option_c: form.option_c, option_d: form.option_d }}
          correctAnswer={form.correct_answer}
          onOptionChange={(key, val) => setField(key, val)}
          onCorrectChange={(answer: Answer) => setField("correct_answer", answer)}
        />

        <SolutionSection
          explanation={form.explanation} hint={form.hint}
          onExplanationChange={v => setField("explanation", v)}
          onHintChange={v => setField("hint", v)}
        />

        {showPreview && (
          <ProblemPreview
            question={form.question}
            options={{ option_a: form.option_a, option_b: form.option_b, option_c: form.option_c, option_d: form.option_d }}
            correctAnswer={form.correct_answer} difficulty={form.difficulty}
            isFree={form.is_free} explanation={form.explanation}
          />
        )}

        <div className="flex items-center justify-between pb-10">
          <button type="button" onClick={resetForm}
            className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-400 transition-colors">
            <Trash2 className="w-4 h-4" /> Clear form
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex items-center gap-2 bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-400 text-white font-semibold text-sm px-8 py-3 rounded-xl transition-colors shadow-lg shadow-violet-500/20">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Plus className="w-4 h-4" /> Save Problem</>}
          </button>
        </div>
      </div>
    </div>
  )
}
