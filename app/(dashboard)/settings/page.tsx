"use client"

import { useSession, signOut } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import supabase from "@/lib/supabase"
import Link from "next/link"
import {
    ArrowLeft, Camera, Mail, User, Shield, Bell, Palette,
    Check, Sun, Moon, Monitor, LogOut, Trash2, Key,
    Zap, Crown, Users, LayoutDashboard, ChevronRight,
    AlertTriangle, ExternalLink, Save, Loader2
} from "lucide-react"

// ── Tab definitions per role ──────────────────────────────────────────────
const STUDENT_TABS = ["Profile", "Appearance", "Notifications", "Subscription", "Security"] as const
const ADMIN_TABS   = ["Profile", "Appearance", "Notifications", "Admin",        "Security"] as const

type StudentTab = typeof STUDENT_TABS[number]
type AdminTab   = typeof ADMIN_TABS[number]
type AnyTab     = StudentTab | AdminTab

const TAB_ICONS: Record<AnyTab, any> = {
    Profile:      User,
    Appearance:   Palette,
    Notifications: Bell,
    Subscription: Crown,
    Admin:        Shield,
    Security:     Key,
}

// ── Toggle component ──────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!on)}
            className={`relative w-11 h-6 rounded-full transition-colors ${on ? "bg-emerald-400" : "bg-zinc-600"}`}
        >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0"}`} />
        </button>
    )
}

// ── Section wrapper ───────────────────────────────────────────────────────
function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
            <div>
                <h2 className="text-base font-semibold text-white">{title}</h2>
                {description && <p className="text-sm text-zinc-500 mt-0.5">{description}</p>}
            </div>
            {children}
        </div>
    )
}

// ── Row component ─────────────────────────────────────────────────────────
function Row({ label, description, action }: { label: string; description: string; action: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
            </div>
            <div className="shrink-0 ml-4">{action}</div>
        </div>
    )
}

// ── Main settings page ────────────────────────────────────────────────────
export default function SettingsPage() {
    const { data: session, isPending } = useSession()
    const router = useRouter()
    const { theme, setTheme, resolvedTheme } = useTheme()

    const [mounted,    setMounted]    = useState(false)
    const [activeTab,  setActiveTab]  = useState<AnyTab>("Profile")
    const [saving,     setSaving]     = useState(false)
    const [saved,      setSaved]      = useState(false)

    // Profile form
    const [name, setName] = useState("")
    const [bio,  setBio]  = useState("")

    // Notification prefs
    const [notifPrefs, setNotifPrefs] = useState({
        dailyReminder:   true,
        streakAlert:     true,
        newProblems:     false,
        weeklyReport:    true,
        promotional:     false,
    })

    // Stats for admin tab
    const [adminStats, setAdminStats] = useState({ totalUsers: 0, totalProblems: 0 })

    useEffect(() => { setMounted(true) }, [])

    useEffect(() => {
        if (!isPending && !session) router.push("/login")
        if (session?.user?.name) setName(session.user.name)
    }, [session, isPending, router])

    // Load admin stats if admin
    useEffect(() => {
        if (session?.user?.role !== "admin") return
        Promise.all([
            supabase.from("user").select("*",     { count: "exact", head: true }),
            supabase.from("problems").select("*", { count: "exact", head: true }),
        ]).then(([{ count: users }, { count: problems }]) => {
            setAdminStats({ totalUsers: users ?? 0, totalProblems: problems ?? 0 })
        })
    }, [session])

    const handleSave = async () => {
        setSaving(true)
        // TODO: wire up to Better Auth's updateUser when needed
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

    const isAdmin  = session.user.role === "admin"
    const TABS     = isAdmin ? ADMIN_TABS : STUDENT_TABS
    const accentColor = isAdmin ? "violet" : "emerald"

    const avatarUrl = session.user.image?.startsWith("http") ? session.user.image : null
    const initial   = session.user.name?.[0]?.toUpperCase() || "U"
    const backHref  = "/dashboard"

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fadeIn 0.25s ease forwards; }
      `}</style>

            <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

                {/* Back */}
                <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>

                {/* Header card */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                    {/* Cover gradient — green for student, violet for admin */}
                    <div className="h-24 w-full" style={{
                        background: isAdmin
                            ? "linear-gradient(135deg, #2e1065 0%, #4c1d95 50%, #5b21b6 100%)"
                            : "linear-gradient(135deg, #052e16 0%, #064e3b 50%, #065f46 100%)"
                    }} />

                    <div className="px-6 pb-6">
                        <div className="flex items-end justify-between -mt-9 mb-4">
                            <div className="relative">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt={session.user.name || "User"} referrerPolicy="no-referrer"
                                         className="w-18 h-18 rounded-2xl border-4 border-zinc-900 object-cover w-[72px] h-[72px]"
                                    />
                                ) : (
                                    <div className={`w-[72px] h-[72px] rounded-2xl border-4 border-zinc-900 flex items-center justify-center text-2xl font-bold text-zinc-950 ${isAdmin ? "bg-violet-400" : "bg-emerald-400"}`}>
                                        {initial}
                                    </div>
                                )}
                                <button className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-zinc-900 flex items-center justify-center transition-colors ${isAdmin ? "bg-violet-400 hover:bg-violet-300" : "bg-emerald-400 hover:bg-emerald-300"}`}>
                                    <Camera className="w-3 h-3 text-zinc-950" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Role badge */}
                                {isAdmin ? (
                                    <span className="text-xs font-mono text-violet-400 bg-violet-400/10 border border-violet-400/20 px-3 py-1.5 rounded-full">
                    ⚡ Admin
                  </span>
                                ) : (
                                    <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-full">
                    Free Plan
                  </span>
                                )}
                                <button onClick={handleSignOut}
                                        className="text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 border border-red-400/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                                >
                                    <LogOut className="w-3.5 h-3.5" /> Sign out
                                </button>
                            </div>
                        </div>

                        <h1 className="text-xl font-semibold text-white">{session.user.name}</h1>
                        <p className="text-sm text-zinc-500 flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3.5 h-3.5" /> {session.user.email}
                        </p>
                    </div>
                </div>

                {/* Tab bar */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {TABS.map(tab => {
                        const Icon = TAB_ICONS[tab]
                        const active = activeTab === tab
                        return (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border whitespace-nowrap transition-all ${
                                        active
                                            ? isAdmin
                                                ? "bg-violet-400 text-zinc-950 border-violet-400"
                                                : "bg-emerald-400 text-zinc-950 border-emerald-400"
                                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600"
                                    }`}
                            >
                                <Icon className="w-4 h-4" /> {tab}
                            </button>
                        )
                    })}
                </div>

                {/* Tab content */}
                <div className="fade-in space-y-4" key={activeTab}>

                    {/* ── PROFILE ────────────────────────────────────────────── */}
                    {activeTab === "Profile" && (
                        <Section title="Personal Information" description="Update your display name and bio.">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Display Name</label>
                                    <input value={name} onChange={e => setName(e.target.value)}
                                           className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all"
                                           placeholder="Your name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email Address</label>
                                    <input value={session.user.email || ""} disabled
                                           className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-500 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-zinc-600 mt-1">Email cannot be changed</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Bio</label>
                                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                                          placeholder="Tell us about yourself..."
                                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all resize-none"
                                />
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                                <p className="text-xs text-zinc-600">
                                    Member since {new Date(session.user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                </p>
                                <button onClick={handleSave} disabled={saving}
                                        className={`flex items-center gap-2 text-zinc-950 text-sm font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-60 ${isAdmin ? "bg-violet-400 hover:bg-violet-300" : "bg-emerald-400 hover:bg-emerald-300"}`}
                                >
                                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                                        : saved  ? <><Check className="w-4 h-4" /> Saved!</>
                                            : <><Save className="w-4 h-4" /> Save Changes</>}
                                </button>
                            </div>
                        </Section>
                    )}

                    {/* ── APPEARANCE ─────────────────────────────────────────── */}
                    {activeTab === "Appearance" && (
                        <Section title="Theme" description="Choose how AtomicTest looks to you.">
                            <div className="grid grid-cols-3 gap-4">
                                {([
                                    { value: "light",  icon: Sun,     label: "Light",  sub: "Clean and bright",    preview: "bg-white border-zinc-200" },
                                    { value: "dark",   icon: Moon,    label: "Dark",   sub: "Easy on the eyes",    preview: "bg-zinc-900 border-zinc-700" },
                                    { value: "system", icon: Monitor, label: "System", sub: "Follows your device", preview: "bg-zinc-500 border-zinc-400" },
                                ] as const).map(({ value, icon: Icon, label, sub, preview }) => (
                                    <button key={value} onClick={() => setTheme(value)}
                                            className={`relative rounded-2xl border-2 p-4 text-left transition-all hover:-translate-y-0.5 ${theme === value
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
                                    Currently using <span className={isAdmin ? "text-violet-400" : "text-emerald-400"}>{resolvedTheme} mode</span>
                                    {theme === "system" && " (system preference)"}
                                </p>
                            )}
                        </Section>
                    )}

                    {/* ── NOTIFICATIONS ──────────────────────────────────────── */}
                    {activeTab === "Notifications" && (
                        <Section title="Notification Preferences" description="Control what emails and alerts you receive.">
                            <div className="space-y-3">
                                {(isAdmin ? [
                                    // Admin-specific notifications
                                    { key: "dailyReminder",  label: "New user signups",      desc: "Get notified when new users register" },
                                    { key: "newProblems",    label: "Problem import alerts",  desc: "When bulk problem imports complete" },
                                    { key: "streakAlert",    label: "Platform error alerts",  desc: "Critical errors on the platform" },
                                    { key: "weeklyReport",   label: "Weekly platform report", desc: "Summary of platform activity" },
                                    { key: "promotional",    label: "Promotional emails",     desc: "Updates about new features" },
                                ] : [
                                    // Student notifications
                                    { key: "dailyReminder",  label: "Daily practice reminders", desc: "Get reminded to practice every day" },
                                    { key: "streakAlert",    label: "Streak alerts",            desc: "Know when your streak is at risk" },
                                    { key: "newProblems",    label: "New problems available",   desc: "When new problems are added" },
                                    { key: "weeklyReport",   label: "Weekly progress report",   desc: "Summary of your weekly activity" },
                                    { key: "promotional",    label: "Promotional emails",       desc: "Updates about new features and plans" },
                                ] as { key: keyof typeof notifPrefs; label: string; desc: string }[]).map(item => (
                                    <Row key={item.key} label={item.label} description={item.desc}
                                         action={
                                             <Toggle
                                                 on={notifPrefs[item.key]}
                                                 onChange={v => setNotifPrefs(p => ({ ...p, [item.key]: v }))}
                                             />
                                         }
                                    />
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* ── SUBSCRIPTION (students only) ───────────────────────── */}
                    {activeTab === "Subscription" && !isAdmin && (
                        <>
                            <Section title="Current Plan" description="You are on the Free plan.">
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-white">Free Plan</p>
                                        <p className="text-xs text-zinc-500">Access to free problems only</p>
                                    </div>
                                    <button className="bg-emerald-400 hover:bg-emerald-300 text-zinc-950 text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                                        Upgrade to Pro ↗
                                    </button>
                                </div>
                            </Section>

                            <Section title="Pro Plan" description="Unlock everything with a Pro subscription.">
                                <div className="space-y-3">
                                    {[
                                        "Access to all 500+ problems",
                                        "Detailed explanations for every answer",
                                        "Advanced progress analytics",
                                        "Priority support",
                                    ].map(feature => (
                                        <div key={feature} className="flex items-center gap-3 text-sm text-zinc-300">
                                            <Check className="w-4 h-4 text-emerald-400 shrink-0" /> {feature}
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full mt-2 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-semibold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                                    <Crown className="w-4 h-4" /> Upgrade Now
                                </button>
                            </Section>
                        </>
                    )}

                    {/* ── ADMIN (admins only) ─────────────────────────────────── */}
                    {activeTab === "Admin" && isAdmin && (
                        <>
                            <Section title="Platform Overview" description="Quick stats about your platform.">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                                        <p className="text-2xl font-bold text-white">{adminStats.totalUsers}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">Registered users</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                                        <p className="text-2xl font-bold text-white">{adminStats.totalProblems}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">Total problems</p>
                                    </div>
                                </div>
                            </Section>

                            <Section title="Admin Tools" description="Quick access to admin features.">
                                <div className="space-y-2">
                                    {[
                                        { href: "/admin/problems",    icon: LayoutDashboard, label: "Manage Problems",  desc: "Edit, delete, filter problems" },
                                        { href: "/admin/add-problem", icon: Zap,             label: "Add New Problem",  desc: "Create a new MCQ problem" },
                                        { href: "/admin/users",       icon: Users,           label: "Manage Users",     desc: "View users, change roles" },
                                    ].map(({ href, icon: Icon, label, desc }) => (
                                        <Link key={href} href={href}
                                              className="flex items-center gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-600 transition-colors group"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-violet-400/10 flex items-center justify-center shrink-0">
                                                <Icon className="w-4 h-4 text-violet-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white">{label}</p>
                                                <p className="text-xs text-zinc-500">{desc}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                        </Link>
                                    ))}
                                </div>
                            </Section>

                            <Section title="Your Admin Role">
                                <Row
                                    label="Role"
                                    description="You have full admin access to this platform"
                                    action={
                                        <span className="text-xs font-mono text-violet-400 bg-violet-400/10 border border-violet-400/20 px-2.5 py-1 rounded-full">
                      admin
                    </span>
                                    }
                                />
                                <p className="text-xs text-zinc-600">
                                    To change user roles, go to{" "}
                                    <Link href="/admin/users" className="text-violet-400 hover:underline">Manage Users</Link>
                                    {" "}or run an SQL update in Supabase.
                                </p>
                            </Section>
                        </>
                    )}

                    {/* ── SECURITY (both roles) ──────────────────────────────── */}
                    {activeTab === "Security" && (
                        <>
                            <Section title="Security Settings">
                                <div className="space-y-3">
                                    <Row label="Password" description="Last changed: never"
                                         action={<button className={`text-xs font-medium transition-colors ${isAdmin ? "text-violet-400 hover:text-violet-300" : "text-emerald-400 hover:text-emerald-300"}`}>Change →</button>}
                                    />
                                    <Row label="Two-factor authentication" description="Add an extra layer of security"
                                         action={<button className={`text-xs font-medium transition-colors ${isAdmin ? "text-violet-400 hover:text-violet-300" : "text-emerald-400 hover:text-emerald-300"}`}>Enable →</button>}
                                    />
                                    <Row label="Active sessions" description="Manage where you're logged in"
                                         action={<button className={`text-xs font-medium transition-colors ${isAdmin ? "text-violet-400 hover:text-violet-300" : "text-emerald-400 hover:text-emerald-300"}`}>View →</button>}
                                    />
                                    <Row label="Sign out everywhere" description="Log out of all devices"
                                         action={
                                             <button onClick={handleSignOut}
                                                     className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                                             >
                                                 Sign out →
                                             </button>
                                         }
                                    />
                                </div>
                            </Section>

                            {/* Danger zone — different warning for admins */}
                            <Section title="Danger Zone">
                                <div className="p-4 rounded-xl bg-red-400/5 border border-red-400/20 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-red-300">Delete Account</p>
                                            <p className="text-xs text-zinc-500 mt-0.5">
                                                {isAdmin
                                                    ? "As an admin, deleting your account will remove all your data. Make sure another admin exists before proceeding."
                                                    : "This will permanently delete your account, progress, and all attempt history. This cannot be undone."
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <button className="text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 border border-red-400/20 px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
                                        <Trash2 className="w-3.5 h-3.5" />
                                        {isAdmin ? "Delete Admin Account" : "Delete My Account"}
                                    </button>
                                </div>
                            </Section>
                        </>
                    )}

                </div>
            </div>
        </div>
    )
}
