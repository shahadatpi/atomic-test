import { Camera, Mail, LogOut } from "lucide-react"

interface SettingsHeaderProps {
    session:      any
    isAdmin:      boolean
    onSignOut:    () => void
}

export function SettingsHeader({ session, isAdmin, onSignOut }: SettingsHeaderProps) {
    const avatarUrl = session.user.image?.startsWith("http") ? session.user.image : null
    const initial   = session.user.name?.[0]?.toUpperCase() || "U"

    return (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            {/* Cover */}
            <div className="h-24 w-full" style={{
                background: isAdmin
                    ? "linear-gradient(135deg, #2e1065 0%, #4c1d95 50%, #5b21b6 100%)"
                    : "linear-gradient(135deg, #052e16 0%, #064e3b 50%, #065f46 100%)"
            }} />

            <div className="px-6 pb-6">
                <div className="flex items-end justify-between -mt-9 mb-4">
                    {/* Avatar */}
                    <div className="relative">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={session.user.name || "User"}
                                 referrerPolicy="no-referrer"
                                 className="rounded-2xl border-4 border-zinc-900 object-cover w-[72px] h-[72px]"
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

                    {/* Badges + sign out */}
                    <div className="flex items-center gap-2">
                        {isAdmin ? (
                            <span className="text-xs font-mono text-violet-400 bg-violet-400/10 border border-violet-400/20 px-3 py-1.5 rounded-full">
                                ⚡ Admin
                            </span>
                        ) : (
                            <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-full">
                                Free Plan
                            </span>
                        )}
                        <button onClick={onSignOut}
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
    )
}
