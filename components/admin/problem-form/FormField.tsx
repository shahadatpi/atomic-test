import React from "react"

interface FormFieldProps {
  label:    string
  hint?:    string
  children: React.ReactNode
}

export function FormField({ label, hint, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono text-zinc-500 tracking-wider uppercase">
          {label}
        </label>
        {hint && <span className="text-xs text-zinc-700">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
