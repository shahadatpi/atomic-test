"use client"

import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { Check, Sun, Moon, Monitor } from "lucide-react"
import { Section } from "../ui/Section"

const THEMES = [
  {
    value: "light",
    icon: Sun,
    label: "Light",
    sub: "Clean and bright",
    // explicit light preview — always white regardless of current theme
    previewBg: "bg-white",
    previewBorder: "border-zinc-200",
    bar1: "bg-zinc-300",
    bar2: "bg-zinc-200",
    block: "bg-zinc-100",
  },
  {
    value: "dark",
    icon: Moon,
    label: "Dark",
    sub: "Easy on the eyes",
    // explicit dark preview
    previewBg: "bg-zinc-900",
    previewBorder: "border-zinc-700",
    bar1: "bg-zinc-600",
    bar2: "bg-zinc-700",
    block: "bg-zinc-800",
  },
  {
    value: "system",
    icon: Monitor,
    label: "System",
    sub: "Follows your device",
    previewBg: "bg-gradient-to-br from-white to-zinc-900",
    previewBorder: "border-zinc-400",
    bar1: "bg-zinc-400",
    bar2: "bg-zinc-500",
    block: "bg-zinc-500",
  },
] as const

export function AppearanceTab({ isAdmin }: { isAdmin: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const accent = isAdmin ? "border-violet-400" : "border-emerald-400"
  const accentBg = isAdmin ? "bg-violet-400" : "bg-emerald-400"
  const accentText = isAdmin ? "text-violet-400" : "text-emerald-400"

  return (
    <Section title="Theme" description="Choose how AtomicTest looks to you.">
      <div className="grid grid-cols-3 gap-4">
        {THEMES.map(({ value, icon: Icon, label, sub, previewBg, previewBorder, bar1, bar2, block }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`relative rounded-2xl border-2 p-4 text-left transition-all hover:-translate-y-0.5 ${
              mounted && theme === value
                ? accent
                : "border-border hover:border-muted-foreground"
            }`}
          >
            {mounted && theme === value && (
              <div className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center ${accentBg}`}>
                <Check className="w-3 h-3 text-zinc-950" />
              </div>
            )}

            {/* Preview thumbnail — hardcoded colors so it always looks correct */}
            <div className={`rounded-xl border ${previewBg} ${previewBorder} p-3 mb-3 space-y-1.5`}>
              <div className={`h-2 w-3/4 ${bar1} rounded-full`} />
              <div className={`h-2 w-1/2 ${bar2} rounded-full`} />
              <div className={`h-5 w-full ${block} rounded-lg mt-2`} />
            </div>

            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{label}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </button>
        ))}
      </div>

      {mounted && (
        <p className="text-xs text-muted-foreground">
          Currently using{" "}
          <span className={accentText}>{resolvedTheme} mode</span>
          {theme === "system" && " (system preference)"}
        </p>
      )}
    </Section>
  )
}
