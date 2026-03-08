"use client"

import { useEffect, useState } from "react"
import { useSession } from "@/lib/auth-client"
import { useRouter, usePathname } from "next/navigation"

import Sidebar        from "./components/Sidebar"
import Topbar         from "./components/Topbar"
import OverviewTab    from "./components/OverviewTab"
import PracticeTab    from "./components/PracticeTab"
import ProgressTab    from "./components/ProgressTab"
import AdminDashboard from "./components/AdminDashboard"  // ← new

import { useDashboardData } from "./hooks/useDashboardData"
import { useStats }         from "./hooks/useStats"
import type { DashboardTab } from "./types"

export default function Page() {
  const { data: session, isPending } = useSession()
  const router   = useRouter()
  const pathname = usePathname()

  const [tab,         setTab]         = useState<DashboardTab>("overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [greeting,    setGreeting]    = useState("Good morning")

  const [subjectFilter, setSubjectFilter] = useState("")
  const [topicFilter,   setTopicFilter]   = useState("")
  const [diffFilter,    setDiffFilter]    = useState("")

  useEffect(() => {
    const h = new Date().getHours()
    if (h >= 12 && h < 17) setGreeting("Good afternoon")
    else if (h >= 17)      setGreeting("Good evening")
  }, [])

  useEffect(() => {
    if (!isPending && !session) router.push("/login")
  }, [session, isPending, router])

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  const { subjects, topics, problems, attempts, loadingProblems, fetchProblems, saveAttempt } =
    useDashboardData({ userId: session?.user?.id, subjectFilter, topicFilter, diffFilter })

  const { totalAttempts, correctAttempts, accuracy, streak, weekActivity, weekDays, topicProgress } =
    useStats(attempts, topics)

  // ── Loading state ────────────────────────────────────────────────────
  if (isPending || !session) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm font-mono">Loading…</p>
        </div>
      </div>
    )
  }

  // ── Admin view ───────────────────────────────────────────────────────
  //
  // If the user's role is "admin", show a completely different dashboard.
  // session.user.role comes from the additionalFields we added to auth.ts
  // and the role column we added to the database.
  if (session.user.role === "admin") {
    return <AdminDashboard session={session} />
  }

  // ── Student view (unchanged) ─────────────────────────────────────────
  const firstName   = session.user.name?.split(" ")[0] || "there"
  const sidebarProps = { session, tab, onTabChange: setTab, onClose: () => setSidebarOpen(false) }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        .line-clamp-2 { display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden; }
      `}</style>

      <div className="flex h-screen overflow-hidden">
        <aside className="hidden lg:flex w-60 shrink-0 border-r border-zinc-800 flex-col bg-zinc-950">
          <Sidebar {...sidebarProps} />
        </aside>

        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <aside className="relative z-50 w-64 flex flex-col bg-zinc-950 border-r border-zinc-800 h-full">
              <Sidebar {...sidebarProps} />
            </aside>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <Topbar
            greeting={greeting}
            firstName={firstName}
            tab={tab}
            onTabChange={setTab}
            onMenuOpen={() => setSidebarOpen(true)}
          />

          <div className="px-4 md:px-8 py-6">
            {tab === "overview" && (
              <OverviewTab
                correctAttempts={correctAttempts}
                totalAttempts={totalAttempts}
                streak={streak}
                accuracy={accuracy}
                weekActivity={weekActivity}
                weekDays={weekDays}
                topicProgress={topicProgress}
                attempts={attempts}
                onPracticeClick={() => setTab("practice")}
                onProgressClick={() => setTab("progress")}
              />
            )}
            {tab === "practice" && (
              <PracticeTab
                subjects={subjects}
                topics={topics}
                problems={problems}
                attempts={attempts}
                loadingProblems={loadingProblems}
                subjectFilter={subjectFilter}
                topicFilter={topicFilter}
                diffFilter={diffFilter}
                onSubjectChange={setSubjectFilter}
                onTopicChange={setTopicFilter}
                onDiffChange={setDiffFilter}
                onRefresh={fetchProblems}
                onSaveAttempt={saveAttempt}
              />
            )}
            {tab === "progress" && (
              <ProgressTab
                attempts={attempts}
                totalAttempts={totalAttempts}
                correctAttempts={correctAttempts}
                accuracy={accuracy}
                onPracticeClick={() => setTab("practice")}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
