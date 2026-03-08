"use client"

import { Menu } from "lucide-react"
import type { DashboardTab } from "../types"

interface TopbarProps {
  greeting: string
  firstName: string
  tab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
  onMenuOpen: () => void
}

const TABS: DashboardTab[] = ["overview", "practice", "progress"]

export default function Topbar({
  greeting,
  firstName,
  tab,
  onTabChange,
  onMenuOpen,
}: TopbarProps) {
  return (
    <div className="sticky top-0 z-10 px-4 md:px-8 py-4 border-b border-zinc-800
                    bg-zinc-950/80 backdrop-blur-sm flex items-center justify-between gap-3">
      {/* Left: hamburger + greeting */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuOpen}
          className="lg:hidden text-zinc-400 hover:text-white transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <p className="text-zinc-500 text-xs md:text-sm font-mono">{greeting},</p>
          <h1 className="text-lg md:text-xl font-semibold text-white">{firstName} 👋</h1>
        </div>
      </div>

      {/* Centre: tab switcher (desktop only) */}
      <div className="hidden md:flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1 gap-1">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => onTabChange(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
              tab === t
                ? "bg-zinc-700 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Right: plan badge + upgrade */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
          <span className="text-emerald-400 text-xs">●</span>
          <span className="text-xs text-zinc-400 font-mono">Free Plan</span>
        </div>
        <button className="bg-emerald-400 hover:bg-emerald-300 text-zinc-950 text-xs font-semibold
                           px-3 md:px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
          Upgrade ↗
        </button>
      </div>
    </div>
  )
}
