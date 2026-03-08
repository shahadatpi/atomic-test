"use client"

import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { Check, Sun, Moon, Monitor } from "lucide-react"
import { Section } from "../ui/Section"

const THEMES = [
    { value: "light",  icon: Sun,     label: "Light",  sub: "Clean and bright",    preview: "bg-white border-zinc-200" },
    { value: "dark",   icon: Moon,    label: "Dark",   sub: "Easy on the eyes",    preview: "bg-zinc-900 border-zinc-700" },
    { value: "system", icon: Monitor, label: "System", sub: "Follows your device", preview: "bg-zinc-500 border-zinc-400" },
] as const

export function AppearanceTab({ isAdmin }: { isAdmin: boolean }) {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    useEffect(() => { setMounted(true) }, [])

    return (
        <Section title="Theme" description="Choose how AtomicTest looks to you.">
            <div className="grid grid-cols-3 gap-4">
                {THEMES.map(({ value, icon: Icon, label, sub, preview }) => (
                    <button key={value} onClick={() => setTheme(value)}
                            className={`relative rounded-2xl border-2 p-4 text-left transition-all hover:-translate-y-0.5 ${
                                theme === value
                                    ? isAdmin ? "border-violet-400" : "border-emerald-400"
                                    : "border-zinc-800 hover:border-zinc-600"
                            }`}
                    >
                        {theme === value && (
                            <div className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center ${isAdmin ? "bg-violet-400" : "bg-emerald-400"}`}>
                                <Check className="w-3 h-3 text-zinc-950" />
                            </div>
                        )}
                        <div className={`rounded-xl border ${preview} p-3 mb-3 space-y-1.5`}>
                            <div className="h-2 w-3/4 bg-current opacity-20 rounded-full" />
                            <div className="h-2 w-1/2 bg-current opacity-10 rounded-full" />
                            <div className="h-5 w-full bg-current opacity-10 rounded-lg mt-2" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-zinc-400" />
                            <span className="text-sm font-medium text-white">{label}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>
                    </button>
                ))}
            </div>
            {mounted && (
                <p className="text-xs text-zinc-600">
                    Currently using{" "}
                    <span className={isAdmin ? "text-violet-400" : "text-emerald-400"}>
                        {resolvedTheme} mode
                    </span>
                    {theme === "system" && " (system preference)"}
                </p>
            )}
        </Section>
    )
}
