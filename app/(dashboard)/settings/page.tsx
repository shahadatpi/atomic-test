"use client"

import { useEffect, useState }    from "react"
import { useSession, signOut }    from "@/lib/auth-client"
import { useRouter }              from "next/navigation"
import Link                       from "next/link"
import { ArrowLeft }              from "lucide-react"
import supabase                   from "@/lib/supabase"

import { STUDENT_TABS, ADMIN_TABS } from "./types"
import type { AnyTab, NotifPrefs }  from "./types"

import { SettingsHeader }    from "./components/SettingsHeader"
import { SettingsTabBar }    from "./components/SettingsTabBar"
import { ProfileTab }        from "./components/ProfileTab"
import { AppearanceTab }     from "./components/AppearanceTab"
import { NotificationsTab }  from "./components/NotificationsTab"
import { SubscriptionTab }   from "./components/SubscriptionTab"
import { AdminTab }          from "./components/AdminTab"
import { SecurityTab }       from "./components/SecurityTab"

export default function SettingsPage() {
    const { data: session, isPending } = useSession()
    const router = useRouter()

    const [activeTab, setActiveTab] = useState<AnyTab>("Profile")
    const [saving,    setSaving]    = useState(false)
    const [saved,     setSaved]     = useState(false)
    const [name,      setName]      = useState("")
    const [bio,       setBio]       = useState("")

    const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({
        dailyReminder: true,
        streakAlert:   true,
        newProblems:   false,
        weeklyReport:  true,
        promotional:   false,
    })

    const [adminStats, setAdminStats] = useState({ totalUsers: 0, totalProblems: 0 })

    useEffect(() => {
        if (!isPending && !session) router.push("/login")
        if (session?.user?.name)   setName(session.user.name)
    }, [session, isPending, router])

    useEffect(() => {
        if ((session?.user as any)?.role !== "admin") return
        Promise.all([
            supabase.from("user").select("*",     { count: "exact", head: true }),
            supabase.from("problems").select("*", { count: "exact", head: true }),
        ]).then(([{ count: users }, { count: problems }]) => {
            setAdminStats({ totalUsers: users ?? 0, totalProblems: problems ?? 0 })
        })
    }, [session])

    const handleSave = async () => {
        setSaving(true)
        await new Promise(r => setTimeout(r, 800))
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const handleSignOut = async () => {
        await signOut({ fetchOptions: { onSuccess: () => router.push("/") } })
    }

    if (isPending || !session) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    const isAdmin = (session.user as any).role === "admin"
    const TABS    = isAdmin ? ADMIN_TABS : STUDENT_TABS

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
                @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
                .fade-in { animation: fadeIn 0.25s ease forwards; }
            `}</style>

            <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

                <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>

                <SettingsHeader session={session} isAdmin={isAdmin} onSignOut={handleSignOut} />

                <SettingsTabBar tabs={TABS} activeTab={activeTab} isAdmin={isAdmin} onChange={setActiveTab} />

                <div className="fade-in space-y-4" key={activeTab}>
                    {activeTab === "Profile" && (
                        <ProfileTab
                            session={session} isAdmin={isAdmin}
                            name={name} bio={bio} saving={saving} saved={saved}
                            onName={setName} onBio={setBio} onSave={handleSave}
                        />
                    )}
                    {activeTab === "Appearance" && (
                        <AppearanceTab isAdmin={isAdmin} />
                    )}
                    {activeTab === "Notifications" && (
                        <NotificationsTab
                            isAdmin={isAdmin}
                            notifPrefs={notifPrefs}
                            onPrefChange={(key, value) => setNotifPrefs(p => ({ ...p, [key]: value }))}
                        />
                    )}
                    {activeTab === "Subscription" && !isAdmin && (
                        <SubscriptionTab />
                    )}
                    {activeTab === "Admin" && isAdmin && (
                        <AdminTab totalUsers={adminStats.totalUsers} totalProblems={adminStats.totalProblems} />
                    )}
                    {activeTab === "Security" && (
                        <SecurityTab isAdmin={isAdmin} onSignOut={handleSignOut} />
                    )}
                </div>

            </div>
        </div>
    )
}
