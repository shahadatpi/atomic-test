"use client"

import { useState } from "react"
import { Tag } from "lucide-react"
import { INSTITUTES, INST_COLORS, YEARS, parseInstTag, instColorClass } from "./constants"

interface InstTagPickerProps {
  tags:      string   // comma-separated tag string
  onChange:  (tags: string) => void
}

export function InstTagPicker({ tags, onChange }: InstTagPickerProps) {
  const [pickerInst, setPickerInst] = useState("")
  const [pickerYear, setPickerYear] = useState(YEARS[1])

  const tagList = tags.split(",").map(t => t.trim()).filter(Boolean)

  const removeTag = (tag: string) =>
    onChange(tagList.filter(t => t !== tag).join(", "))

  const addInstTag = (inst: string, year: string) => {
    const newTag = `${inst}: ${year}`
    if (!tagList.includes(newTag)) onChange([...tagList, newTag].join(", "))
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
        Previous Year Tags
      </p>

      {/* Institute selector */}
      <div>
        <p className="text-xs text-zinc-600 mb-1.5">Select Institute</p>
        <div className="flex flex-wrap gap-1.5">
          {INSTITUTES.map(({ key, label, color }) => {
            const isSelected = pickerInst === key
            return (
              <button key={key} type="button"
                onClick={() => setPickerInst(isSelected ? "" : key)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                  isSelected
                    ? INST_COLORS[color]
                    : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 bg-zinc-900"
                }`}>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Year row — only shown when institute is selected */}
      {pickerInst && (
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs text-zinc-600">Year:</p>
          <div className="flex flex-wrap gap-1.5 flex-1">
            {YEARS.map(yr => (
              <button key={yr} type="button" onClick={() => setPickerYear(yr)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition-all ${
                  pickerYear === yr
                    ? "border-violet-400 bg-violet-400/10 text-violet-300"
                    : "border-zinc-800 text-zinc-500 hover:border-zinc-600 bg-zinc-900"
                }`}>
                {yr}
              </button>
            ))}
          </div>
          <button type="button"
            onClick={() => { addInstTag(pickerInst, pickerYear); setPickerInst("") }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-xs font-semibold transition-all shrink-0">
            <Tag className="w-3 h-3" /> Add {pickerInst}: {pickerYear}
          </button>
        </div>
      )}

      {/* Custom tag input */}
      <div>
        <p className="text-xs text-zinc-600 mb-1.5">Custom tags (comma-separated)</p>
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
          <input value={tags} onChange={e => onChange(e.target.value)}
            placeholder="e.g. oscillation, chain-rule, thermodynamics…"
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500/50
                       rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-700
                       outline-none transition-all"
          />
        </div>
      </div>

      {/* Applied tags */}
      {tagList.length > 0 && (
        <div>
          <p className="text-xs text-zinc-600 mb-1.5">Applied tags</p>
          <div className="flex flex-wrap gap-1.5">
            {tagList.map(tag => {
              const parsed = parseInstTag(tag)
              const colorCls = parsed ? instColorClass(parsed.inst) : ""
              return (
                <span key={tag} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-mono ${
                  colorCls || "bg-zinc-800 border-zinc-700 text-zinc-400"
                }`}>
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}
                    className="text-zinc-500 hover:text-red-400 transition-colors leading-none">
                    ×
                  </button>
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
