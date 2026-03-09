"use client"

import { Menu } from "lucide-react"
import type { DashboardTab } from "../types"

interface TopbarProps {
  greeting:    string
  firstName:   string
  tab:         DashboardTab
  isAdmin:     boolean
  onTabChange: (tab: DashboardTab) => void
  onMenuOpen:  () => void
}

const TABS: { label: string; t: DashboardTab }[] = [
  { label: "Overview",  t: "overview"  },
  { label: "Practice",  t: "practice"  },
  { label: "Progress",  t: "progress"  },
  { label: "Exam",      t: "exam"      },
  { label: "Settings",  t: "settings"  },
]

export default function Topbar({ greeting, firstName, tab, isAdmin, onTabChange, onMenuOpen }: TopbarProps) {
  return (
    <div className="sticky top-0 z-10 px-4 md:px-8 py-4 border-b border-border
                    bg-background/80 backdrop-blur-sm flex items-center justify-between gap-3">
      {/* Left: hamburger + greeting */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuOpen}
          className="lg:hidden text-muted-foreground hover:text-foreground transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <p className="text-muted-foreground/70 text-xs md:text-sm font-mono">{greeting},</p>
          <h1 className="text-lg md:text-xl font-semibold text-foreground">{firstName} 👋</h1>
        </div>
      </div>

      {/* Centre: tab switcher */}
      <div className="hidden md:flex items-center bg-card border border-border rounded-lg p-1 gap-1">
        {TABS.map(({ label, t }) => (
          <button key={t} onClick={() => onTabChange(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              tab === t
                ? "bg-zinc-700 text-foreground"
                : "text-muted-foreground/70 hover:text-foreground/80"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Right: plan / admin badge */}
      <div className="flex items-center gap-2">
        {isAdmin ? (
          <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-lg px-3 py-1.5">
            <span className="text-violet-400 text-xs">⬡</span>
            <span className="text-xs text-violet-300 font-mono font-semibold tracking-wide">Admin</span>
          </div>
        ) : (
          <>
            <div className="hidden sm:flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5">
              <span className="text-emerald-400 text-xs">●</span>
              <span className="text-xs text-muted-foreground font-mono">Free Plan</span>
            </div>
            <button className="bg-emerald-400 hover:bg-emerald-300 text-zinc-950 text-xs font-semibold
                               px-3 md:px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
              Upgrade ↗
            </button>
          </>
        )}
      </div>
    </div>
  )
}
