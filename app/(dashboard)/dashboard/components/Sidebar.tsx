"use client"

import { useRouter } from "next/navigation"
import { signOut } from "@/lib/auth-client"
import {
  X, LayoutDashboard, BookOpen, BarChart2,
  Settings, LogOut, GraduationCap, Upload, FileText,
} from "lucide-react"
import type { DashboardTab } from "../types"

interface SidebarProps {
  session:     any
  tab:         DashboardTab
  isAdmin:     boolean
  onTabChange: (tab: DashboardTab) => void
  onClose:     () => void
}

const NAV = [
  { label: "Overview",  icon: LayoutDashboard, t: "overview"  as DashboardTab },
  { label: "Practice",  icon: BookOpen,         t: "practice"  as DashboardTab },
  { label: "Progress",  icon: BarChart2,        t: "progress"  as DashboardTab },
  { label: "Exam",      icon: GraduationCap,    t: "exam"      as DashboardTab },
]

export default function Sidebar({ session, tab, isAdmin, onTabChange, onClose }: SidebarProps) {
  const router = useRouter()

  const navItem = (label: string, icon: any, t: DashboardTab) => {
    const Icon = icon
    return (
      <button
        key={label}
        onClick={() => { onTabChange(t); onClose() }}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
          tab === t
            ? "bg-muted text-foreground font-medium"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        }`}
      >
        <Icon className="w-4 h-4" />
        {label}
      </button>
    )
  }

  return (
    <>
      {/* Logo */}
      <div style={{ fontFamily: "\'Kalpurush\', \'Roboto\', sans-serif" }} className="px-6 py-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-400 rounded-md flex items-center justify-center">
            <span className="text-zinc-950 text-xs font-bold">A</span>
          </div>
          <button
            onClick={() => { onTabChange("overview"); onClose() }}
            className="font-semibold text-foreground tracking-tight hover:text-emerald-400 transition-colors"
          >
            AtomicTest
          </button>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ label, icon, t }) => navItem(label, icon, t))}

        <div className="pt-2 mt-2 border-t border-border/60 space-y-0.5">
          {navItem("Settings", Settings, "settings")}
        </div>

        {/* Admin links */}
        {isAdmin && (
          <div className="pt-2 mt-2 border-t border-border/60 space-y-0.5">
            <p className="px-3 py-1 text-xs text-muted-foreground/40 font-mono uppercase tracking-wider">Admin</p>
            <button
              onClick={() => { router.push("/admin/problems"); onClose() }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-amber-400/80 hover:bg-amber-400/10 hover:text-amber-300 transition-all"
            >
              <BookOpen className="w-4 h-4" /> Problems
            </button>
            <button
              onClick={() => { router.push("/admin/add-problem"); onClose() }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-amber-400/80 hover:bg-amber-400/10 hover:text-amber-300 transition-all"
            >
              <LayoutDashboard className="w-4 h-4" /> Add Problem
            </button>
            <button
              onClick={() => { router.push("/paper-builder"); onClose() }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-amber-400/80 hover:bg-amber-400/10 hover:text-amber-300 transition-all"
            >
              <FileText className="w-4 h-4" /> Make Questions
            </button>
            <button
              onClick={() => { router.push("/admin/bulk-import"); onClose() }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-amber-400/80 hover:bg-amber-400/10 hover:text-amber-300 transition-all"
            >
              <Upload className="w-4 h-4" /> Bulk Import
            </button>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center text-zinc-950 text-sm font-semibold shrink-0">
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{session?.user?.name}</p>
            <p className="text-xs text-muted-foreground/70 truncate">{session?.user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ fetchOptions: { onSuccess: () => router.push("/") } })}
          className="mt-1 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                     text-muted-foreground hover:bg-red-400/10 hover:text-red-300 transition-all text-left"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </>
  )
}
