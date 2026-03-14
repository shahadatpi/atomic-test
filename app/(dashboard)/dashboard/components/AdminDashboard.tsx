"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import supabase from "@/lib/supabase"
import {
  BookOpen, Users, BarChart2, Plus, Settings,
  TrendingUp, CheckCircle, Clock, ArrowRight,
  FileText, Zap, LogOut, X, Menu
} from "lucide-react"
import { signOut } from "@/lib/auth-client"

// ── Types ─────────────────────────────────────────────────────────────────
interface AdminStats {
  totalProblems:  number
  totalUsers:     number
  totalAttempts:  number
  freeProblems:   number
  proProblems:    number
  avgAccuracy:    number
}

interface RecentAttempt {
  id:         string
  created_at: string
  is_correct: boolean
  problems:   { question: string }
}

interface AdminDashboardProps {
  session: any
}

// ── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub: string
  icon: any; color: string
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color.replace("text-", "bg-").replace("400", "400/10")}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <p className="text-3xl font-bold text-white mb-0.5">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`text-xs mt-2 ${color}`}>{sub}</p>
    </div>
  )
}

// ── Quick action button ───────────────────────────────────────────────────
function QuickAction({ href, icon: Icon, label, description, color }: {
  href: string; icon: any; label: string; description: string; color: string
}) {
  return (
    <Link href={href}
      className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 flex items-center gap-4 transition-all hover:-translate-y-0.5"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color.replace("text-", "bg-").replace("400", "400/10")} group-hover:scale-110 transition-transform`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  )
}

// ── Main admin dashboard ──────────────────────────────────────────────────
export default function AdminDashboard({ session }: AdminDashboardProps) {
  const router = useRouter()
  const [stats,          setStats]          = useState<AdminStats | null>(null)
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([])
  const [loading,        setLoading]        = useState(true)
  const [sidebarOpen,    setSidebarOpen]    = useState(false)

  const firstName = session.user.name?.split(" ")[0] || "Admin"

  useEffect(() => {
    async function loadStats() {
      const [
        { count: totalProblems },
        { count: totalUsers },
        { count: totalAttempts },
        { count: freeProblems },
        { count: proProblems },
        { data: recentData },
        { data: accuracyData },
      ] = await Promise.all([
        supabase.from("problems").select("*", { count: "exact", head: true }),
        supabase.from("user").select("*", { count: "exact", head: true }),
        supabase.from("attempts").select("*", { count: "exact", head: true }),
        supabase.from("problems").select("*", { count: "exact", head: true }).eq("is_free", true),
        supabase.from("problems").select("*", { count: "exact", head: true }).eq("is_free", false),
        supabase.from("attempts")
          .select("id, created_at, is_correct, problems(question)")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase.from("attempts").select("is_correct").limit(500),
      ])

      const correct = accuracyData?.filter(a => a.is_correct).length ?? 0
      const total   = accuracyData?.length ?? 1
      const avgAccuracy = Math.round((correct / total) * 100)

      setStats({
        totalProblems:  totalProblems ?? 0,
        totalUsers:     totalUsers    ?? 0,
        totalAttempts:  totalAttempts ?? 0,
        freeProblems:   freeProblems  ?? 0,
        proProblems:    proProblems   ?? 0,
        avgAccuracy,
      })
      setRecentAttempts((recentData as unknown as RecentAttempt[]) ?? [])
      setLoading(false)
    }

    loadStats()
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "'Kalpurush', 'Roboto', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');`}</style>

      <div className="flex h-screen overflow-hidden">

        {/* ── Sidebar ────────────────────────────────────────────────── */}
        <>
          {/* Desktop */}
          <aside className="hidden lg:flex w-60 shrink-0 border-r border-zinc-800 flex-col bg-zinc-950">
            <AdminSidebar session={session} onClose={() => {}} />
          </aside>

          {/* Mobile overlay */}
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-40 flex">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
              <aside className="relative z-50 w-64 flex flex-col bg-zinc-950 border-r border-zinc-800 h-full">
                <AdminSidebar session={session} onClose={() => setSidebarOpen(false)} />
              </aside>
            </div>
          )}
        </>

        {/* ── Main ───────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">

          {/* Topbar */}
          <div className="sticky top-0 z-10 px-4 md:px-8 py-4 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-zinc-400 hover:text-white">
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <p className="text-zinc-500 text-xs font-mono">Admin Console</p>
                <h1 className="text-lg font-semibold text-white">Welcome back, {firstName} 👋</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Admin badge — visually distinct from student */}
              <span className="text-xs font-mono text-violet-400 bg-violet-400/10 border border-violet-400/20 px-3 py-1.5 rounded-full">
                ⚡ Admin
              </span>
              <Link href="/admin/add-problem"
                className="bg-emerald-400 hover:bg-emerald-300 text-zinc-950 text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Problem
              </Link>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 md:px-8 py-6 space-y-6">

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* ── Stats grid ─────────────────────────────────────── */}
                <div>
                  <h2 className="text-xs font-mono text-zinc-500 mb-3 tracking-widest">PLATFORM OVERVIEW</h2>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    <StatCard label="Total Problems"  value={stats!.totalProblems}  sub={`${stats!.freeProblems} free · ${stats!.proProblems} pro`} icon={BookOpen}   color="text-emerald-400" />
                    <StatCard label="Registered Users" value={stats!.totalUsers}    sub="all time signups"          icon={Users}      color="text-sky-400"    />
                    <StatCard label="Total Attempts"   value={stats!.totalAttempts} sub="across all users"          icon={BarChart2}  color="text-violet-400" />
                    <StatCard label="Avg Accuracy"     value={`${stats!.avgAccuracy}%`} sub="platform-wide"        icon={TrendingUp} color="text-amber-400"  />
                    <StatCard label="Free Problems"    value={stats!.freeProblems}  sub="accessible to all"        icon={CheckCircle} color="text-emerald-400" />
                    <StatCard label="Pro Problems"     value={stats!.proProblems}   sub="subscribers only"         icon={Zap}        color="text-violet-400" />
                  </div>
                </div>

                {/* ── Quick actions ───────────────────────────────────── */}
                <div>
                  <h2 className="text-xs font-mono text-zinc-500 mb-3 tracking-widest">QUICK ACTIONS</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <QuickAction href="/admin/add-problem"  icon={Plus}     label="Add New Problem"     description="Create a new MCQ problem"          color="text-emerald-400" />
                    <QuickAction href="/admin/problems"     icon={FileText} label="Manage Problems"     description="Edit, delete, filter all problems" color="text-sky-400"    />
                    <QuickAction href="/admin/users"        icon={Users}    label="Manage Users"        description="View users, change roles"          color="text-violet-400" />
                    <QuickAction href="/dashboard"          icon={BarChart2} label="Student View"       description="See the app as a student"          color="text-amber-400"  />
                  </div>
                </div>

                {/* ── Recent activity ─────────────────────────────────── */}
                <div>
                  <h2 className="text-xs font-mono text-zinc-500 mb-3 tracking-widest">RECENT ACTIVITY</h2>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    {recentAttempts.length === 0 ? (
                      <div className="py-10 text-center text-zinc-600 text-sm">No attempts yet</div>
                    ) : (
                      recentAttempts.map((attempt, i) => (
                        <div key={attempt.id}
                          className={`flex items-center gap-4 px-5 py-3.5 ${i !== recentAttempts.length - 1 ? "border-b border-zinc-800/60" : ""}`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${attempt.is_correct ? "bg-emerald-400/10" : "bg-red-400/10"}`}>
                            {attempt.is_correct
                              ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              : <X           className="w-3.5 h-3.5 text-red-400" />
                            }
                          </div>
                          <p className="flex-1 text-sm text-zinc-300 truncate">
                            {(attempt.problems as any)?.question?.slice(0, 60)}…
                          </p>
                          <span className="text-xs text-zinc-600 font-mono shrink-0">
                            {new Date(attempt.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

// ── Admin sidebar ─────────────────────────────────────────────────────────
function AdminSidebar({ session, onClose }: { session: any; onClose: () => void }) {
  const router = useRouter()
  const links = [
    { href: "/dashboard",         icon: BarChart2,  label: "Overview"       },
    { href: "/admin/problems",    icon: FileText,   label: "Problems"       },
    { href: "/admin/add-problem", icon: Plus,       label: "Add Problem"    },
    { href: "/admin/users",       icon: Users,      label: "Users"          },
    { href: "/settings",          icon: Settings,   label: "Settings"       },
  ]

  return (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-violet-400 rounded-md flex items-center justify-center">
            <span className="text-zinc-950 text-xs font-bold">A</span>
          </div>
          <span className="font-semibold text-white tracking-tight">AtomicTest</span>
          {/* Purple badge instead of student's green — visually distinct */}
          <span className="text-xs font-mono text-violet-400 bg-violet-400/10 border border-violet-400/20 px-1.5 py-0.5 rounded">
            admin
          </span>
        </div>
        <button onClick={onClose} className="lg:hidden text-zinc-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} onClick={onClose}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/60 hover:text-white transition-all"
          >
            <Icon className="w-4 h-4" /> {label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-violet-400 flex items-center justify-center text-zinc-950 text-sm font-semibold shrink-0">
            {session.user.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{session.user.name}</p>
            <p className="text-xs text-zinc-500 truncate">{session.user.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ fetchOptions: { onSuccess: () => router.push("/") } })}
          className="mt-1 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-red-400/10 hover:text-red-300 transition-all"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </>
  )
}
