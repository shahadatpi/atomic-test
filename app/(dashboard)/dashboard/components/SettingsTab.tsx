"use client"

import { useSession } from "@/lib/auth-client"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import {
  Moon, Sun, Monitor, Check, Camera, Mail,
  User, Shield, Bell, Palette,
} from "lucide-react"

const TABS = ["Profile", "Appearance", "Notifications", "Security"] as const
type Tab = typeof TABS[number]

const TAB_ICONS = { Profile: User, Appearance: Palette, Notifications: Bell, Security: Shield }

export default function SettingsTab() {
  const { data: session } = useSession()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted,    setMounted]    = useState(false)
  const [activeTab,  setActiveTab]  = useState<Tab>("Profile")
  const [saved,      setSaved]      = useState(false)
  const [name,       setName]       = useState("")
  const [bio,        setBio]        = useState("")

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    if (session?.user?.name) setName(session.user.name)
  }, [session])

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const oAuthImage    = session?.user?.image?.startsWith("http") ? session?.user?.image : null
  const avatarFallback = session?.user?.name?.[0]?.toUpperCase() || "U"

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* Header card */}
      <div className="relative rounded-2xl border border-border bg-card overflow-hidden">
        <div className="h-24 w-full" style={{
          background: "linear-gradient(135deg, #052e16 0%, #064e3b 50%, #065f46 100%)"
        }} />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              {oAuthImage ? (
                <img src={oAuthImage} alt="avatar" referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-2xl border-4 border-card object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-2xl border-4 border-card bg-emerald-400 flex items-center justify-center text-2xl font-bold text-zinc-950">
                  {avatarFallback}
                </div>
              )}
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-400 border-2 border-card flex items-center justify-center hover:bg-emerald-300 transition-colors">
                <Camera className="h-3 w-3 text-zinc-950" />
              </button>
            </div>
          </div>
          <h1 className="text-xl font-semibold text-foreground">{session?.user?.name}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Mail className="h-3.5 w-3.5" /> {session?.user?.email}
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="grid grid-cols-4 gap-2">
        {TABS.map((tab) => {
          const Icon = TAB_ICONS[tab]
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                activeTab === tab
                  ? "bg-emerald-400 text-zinc-950 border-emerald-400"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}>
              <Icon className="h-4 w-4" />{tab}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div key={activeTab}>

        {activeTab === "Profile" && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <h2 className="text-base font-semibold text-foreground">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Display Name</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                  placeholder="Your name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
                <input value={session?.user?.email || ""} disabled
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                placeholder="Tell us about yourself…"
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-400/50 resize-none" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Member since {new Date(session?.user?.createdAt ?? Date.now()).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
              <button onClick={handleSave}
                className="flex items-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
                {saved ? <><Check className="h-4 w-4" /> Saved!</> : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "Appearance" && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-foreground mb-1">Theme</h2>
              <p className="text-sm text-muted-foreground">Choose how AtomicTest looks.</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {([
                { id: "light", label: "Light", Icon: Sun,     color: "text-amber-400",  preview: "bg-white border-zinc-200",  bars: ["bg-zinc-200","bg-zinc-100"] },
                { id: "dark",  label: "Dark",  Icon: Moon,    color: "text-sky-400",    preview: "bg-card border-border",     bars: ["bg-zinc-700","bg-muted"]    },
                { id: "system",label: "System",Icon: Monitor, color: "text-violet-400", preview: "bg-white border-zinc-200",  bars: ["bg-zinc-200","bg-zinc-100"] },
              ] as const).map(({ id, label, Icon, color }) => (
                <button key={id} onClick={() => setTheme(id)}
                  className={`relative rounded-2xl border-2 p-4 text-left transition-all hover:-translate-y-0.5 ${
                    theme === id ? "border-emerald-400" : "border-border hover:border-muted-foreground"
                  }`}>
                  {theme === id && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-zinc-950" />
                    </div>
                  )}
                  <div className="rounded-xl border p-3 mb-3 space-y-1.5 h-14 bg-card border-border">
                    <div className="h-2 w-3/4 bg-zinc-700 rounded-full" />
                    <div className="h-2 w-1/2 bg-muted rounded-full" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </div>
                </button>
              ))}
            </div>
            {mounted && (
              <p className="text-xs text-muted-foreground">
                Currently using <span className="text-emerald-400 font-medium">{resolvedTheme} mode</span>
                {theme === "system" && " (system preference)"}
              </p>
            )}
          </div>
        )}

        {activeTab === "Notifications" && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground mb-2">Notification Preferences</h2>
            {[
              { label: "Daily practice reminders", desc: "Get reminded to practice every day",    defaultOn: true  },
              { label: "Streak alerts",             desc: "Know when your streak is at risk",      defaultOn: true  },
              { label: "New problems available",    desc: "When new problems are added",           defaultOn: false },
              { label: "Weekly progress report",    desc: "Summary of your weekly activity",      defaultOn: true  },
              { label: "Promotional emails",        desc: "Updates about new features and plans", defaultOn: false },
            ].map(item => <NotificationRow key={item.label} {...item} />)}
          </div>
        )}

        {activeTab === "Security" && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <h2 className="text-base font-semibold text-foreground">Security Settings</h2>
            <div className="space-y-3">
              {[
                { label: "Password",                    sub: "Last changed never",              action: "Change →"  },
                { label: "Two-factor authentication",   sub: "Add an extra layer of security",  action: "Enable →"  },
                { label: "Active sessions",             sub: "Manage where you're logged in",   action: "View →"    },
              ].map(({ label, sub, action }) => (
                <div key={label} className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                  <button className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors">{action}</button>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-xs font-medium text-red-400 mb-3">Danger Zone</p>
              <button className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function NotificationRow({ label, desc, defaultOn }: { label: string; desc: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <button onClick={() => setOn(v => !v)}
        className={`relative w-11 h-6 rounded-full transition-colors ${on ? "bg-emerald-400" : "bg-zinc-600"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  )
}
