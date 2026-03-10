export const INSTITUTES = [
  { key: "DU",      label: "DU",      color: "violet"  },
  { key: "BUET",    label: "BUET",    color: "sky"     },
  { key: "CUET",    label: "CUET",    color: "amber"   },
  { key: "RUET",    label: "RUET",    color: "emerald" },
  { key: "KUET",    label: "KUET",    color: "rose"    },
  { key: "SUST",    label: "SUST",    color: "indigo"  },
  { key: "CKRUET",  label: "CKRUET",  color: "teal"    },
  { key: "Medical", label: "Medical", color: "pink"    },
  { key: "Board",   label: "Board",   color: "orange"  },
  { key: "DB",      label: "DB",      color: "cyan"    },
]

export const INST_COLORS: Record<string, string> = {
  violet:  "border-violet-400  bg-violet-400/10  text-violet-300",
  sky:     "border-sky-400     bg-sky-400/10     text-sky-300",
  amber:   "border-amber-400   bg-amber-400/10   text-amber-300",
  emerald: "border-emerald-400 bg-emerald-400/10 text-emerald-300",
  rose:    "border-rose-400    bg-rose-400/10    text-rose-300",
  indigo:  "border-indigo-400  bg-indigo-400/10  text-indigo-300",
  teal:    "border-teal-400    bg-teal-400/10    text-teal-300",
  pink:    "border-pink-400    bg-pink-400/10    text-pink-300",
  orange:  "border-orange-400  bg-orange-400/10  text-orange-300",
  cyan:    "border-cyan-400    bg-cyan-400/10    text-cyan-300",
}

/** Generate academic years: 5 years back → 25 years forward */
export function getYears(): string[] {
  const y = new Date().getFullYear()
  return Array.from({ length: 30 }, (_, i) => {
    const start = y - 5 + i
    return `${start}-${String(start + 1).slice(-2)}`
  }).reverse()
}

export const YEARS = getYears()

/** Parse "INST: YEAR" tag format */
export function parseInstTag(tag: string): { inst: string; year: string } | null {
  const m = tag.match(/^([^:]+):\s*(.+)$/)
  return m ? { inst: m[1].trim(), year: m[2].trim() } : null
}

/** Get Tailwind color classes for an institute key */
export function instColorClass(instKey: string): string {
  const color = INSTITUTES.find(i => i.key === instKey)?.color ?? ""
  return INST_COLORS[color] ?? ""
}
