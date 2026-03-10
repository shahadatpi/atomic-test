"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import MathText from "@/components/math/MathText"
import { FormField } from "./FormField"

interface LaTeXFieldProps {
  label:        string
  value:        string
  onChange:     (v: string) => void
  placeholder?: string
  rows?:        number
  hint?:        string
}

export function LaTeXField({
  label, value, onChange, placeholder, rows = 3, hint,
}: LaTeXFieldProps) {
  const [preview, setPreview] = useState(false)

  return (
    <FormField label={label} hint={hint}>
      <div className="relative">
        <textarea
          rows={rows}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-zinc-900 border border-zinc-800 focus:border-violet-500/60
                     focus:ring-1 focus:ring-emerald-500/20 rounded-xl px-4 py-3 text-sm
                     text-zinc-200 placeholder-zinc-700 resize-none outline-none transition-all font-mono"
        />
        <button
          type="button"
          onClick={() => setPreview(p => !p)}
          className="absolute top-2.5 right-3 text-zinc-600 hover:text-violet-400 transition-colors"
          title={preview ? "Hide preview" : "Show preview"}
          aria-label={preview ? "Hide LaTeX preview" : "Show LaTeX preview"}
        >
          {preview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>

      {preview && value && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-300 leading-relaxed">
          <MathText text={value} />
        </div>
      )}
    </FormField>
  )
}
