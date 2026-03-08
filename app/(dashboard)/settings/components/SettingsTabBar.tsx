import { User, Palette, Bell, Crown, Shield, Key } from "lucide-react"
import type { AnyTab } from "../types"

const TAB_ICONS: Record<AnyTab, any> = {
    Profile:       User,
    Appearance:    Palette,
    Notifications: Bell,
    Subscription:  Crown,
    Admin:         Shield,
    Security:      Key,
}

interface SettingsTabBarProps {
    tabs:      readonly AnyTab[]
    activeTab: AnyTab
    isAdmin:   boolean
    onChange:  (tab: AnyTab) => void
}

export function SettingsTabBar({ tabs, activeTab, isAdmin, onChange }: SettingsTabBarProps) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map(tab => {
                const Icon   = TAB_ICONS[tab]
                const active = activeTab === tab
                return (
                    <button key={tab} onClick={() => onChange(tab)}
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
    )
}
