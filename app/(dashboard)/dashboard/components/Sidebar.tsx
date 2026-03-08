"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/auth-client"
import {
  X, LayoutDashboard, BookOpen, BarChart2, Settings, LogOut,
} from "lucide-react"
import type { DashboardTab } from "../types"

interface SidebarProps {
  session: any
  tab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
  onClose: () => void
}

const NAV = [
  { label: "Overview", icon: LayoutDashboard, t: "overview" as DashboardTab },
  { label: "Practice",  icon: BookOpen,        t: "practice"  as DashboardTab },
  { label: "Progress",  icon: BarChart2,       t: "progress"  as DashboardTab },
]

export default function Sidebar({ session, tab, onTabChange, onClose }: SidebarProps) {
  const router = useRouter()

  return (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-400 rounded-md flex items-center justify-center">
            <span className="text-zinc-950 text-xs font-bold">A</span>
          </div>
          <Link href="/atomic-test/public" className="font-semibold text-white tracking-tight">
            AtomicTest
          </Link>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ label, icon: Icon, t }) => (
          <button
            key={label}
            onClick={() => { onTabChange(t); onClose() }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
              tab === t
                ? "bg-zinc-800 text-white font-medium"
                : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}

        <div className="pt-2 mt-2 border-t border-zinc-800/60">
          <Link href="/settings">
            <span className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/60 hover:text-white transition-all">
              <Settings className="w-4 h-4" /> Settings
            </span>
          </Link>
        </div>
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center text-zinc-950 text-sm font-semibold shrink-0">
            {session.user.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{session.user.name}</p>
            <p className="text-xs text-zinc-500 truncate">{session.user.email}</p>
          </div>
        </div>
        <button
          onClick={() =>
            signOut({ fetchOptions: { onSuccess: () => router.push("/") } })
          }
          className="mt-1 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                     text-zinc-400 hover:bg-red-400/10 hover:text-red-300 transition-all text-left"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </>
  )
}
