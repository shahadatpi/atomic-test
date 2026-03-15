"use client"

import { useEffect, useState, Suspense } from "react"
import dynamic from "next/dynamic"
import { useSession } from "@/lib/auth-client"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

import Sidebar     from "./components/Sidebar"
import Topbar      from "./components/Topbar"
const OverviewTab = dynamic(() => import("./components/OverviewTab"), { ssr: false })
const PracticeTab = dynamic(() => import("./components/PracticeTab"), { ssr: false })
const ProgressTab = dynamic(() => import("./components/ProgressTab"), { ssr: false })

import { useDashboardData } from "./hooks/useDashboardData"
import { useStats }         from "./hooks/useStats"
import type { DashboardTab } from "./types"

// ExamPage is rendered inline (no page navigation) — import its root component
const ExamRoot = dynamic(() => import("../exam/page"), { ssr: false })
const SettingsTab = dynamic(() => import("./components/SettingsTab"), { ssr: false })
const ProblemsTab = dynamic(() => import("./components/ProblemsTab"), { ssr: false })

function DashboardInner() {
  const { data: session, isPending } = useSession()
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  const [tab,         setTab]         = useState<DashboardTab>(
    (searchParams.get("tab") as DashboardTab) || "overview"
  )
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

  const isAdmin   = (session?.user as any)?.role === "admin"
  const isPremium = isAdmin || (session?.user as any)?.plan === "pro"

  const {
    subjects, topics, problems, attempts,
    loadingProblems, fetchProblems, saveAttempt,
  } = useDashboardData({ userId: session?.user?.id, subjectFilter, topicFilter, diffFilter })

  const {
    totalAttempts, correctAttempts, accuracy,
    streak, weekActivity, weekDays, topicProgress,
  } = useStats(attempts, topics)

  if (isPending || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" >
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground/70 text-sm font-mono">Loading…</p>
        </div>
      </div>
    )
  }

  const firstName = session?.user?.name?.split(" ")[0] || "there"

  const sidebarProps = {
    session,
    tab,
    isAdmin,
    onTabChange: setTab,
    onClose:     () => setSidebarOpen(false),
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background text-foreground" style={{ fontFamily: "'Kalpurush', 'Roboto', sans-serif" }}>
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-60 shrink-0 border-r border-border flex-col bg-background">
          <Sidebar {...sidebarProps} />
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <aside className="relative z-50 w-64 flex flex-col bg-background border-r border-border h-full">
              <Sidebar {...sidebarProps} />
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {/* Topbar hidden for exam/settings — they have their own headers */}
          {tab !== "exam" && tab !== "settings" && (
            <Topbar
              greeting={greeting}
              firstName={firstName}
              tab={tab}
              isAdmin={isAdmin}
              onTabChange={setTab}
              onMenuOpen={() => setSidebarOpen(true)}
            />
          )}

          {/* Tab content */}
          {tab === "overview" && (
            <div className="px-4 md:px-8 py-6">
              <OverviewTab
                userId={session?.user?.id ?? ""}
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
            </div>
          )}

          {tab === "practice" && (
            <div className="px-4 md:px-8 py-6">
              <PracticeTab
                subjects={subjects}
                topics={topics}
                attempts={attempts}
                isPremium={isPremium}
                onSaveAttempt={saveAttempt}
              />
            </div>
          )}

          {tab === "problems" && (
            <div className="px-4 md:px-8 py-6">
              <ProblemsTab isPremium={isPremium} />
            </div>
          )}

          {tab === "progress" && (
            <div className="px-4 md:px-8 py-6">
              <ProgressTab
                attempts={attempts}
                totalAttempts={totalAttempts}
                correctAttempts={correctAttempts}
                accuracy={accuracy}
                onPracticeClick={() => setTab("practice")}
              />
            </div>
          )}

          {/* Exam and Settings rendered inline — no page navigation */}
          {tab === "exam"     && <ExamRoot />}
          {tab === "settings" && <SettingsTab />}
        </main>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DashboardInner />
    </Suspense>
  )
}
