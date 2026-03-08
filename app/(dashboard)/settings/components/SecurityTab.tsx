import { AlertTriangle, Trash2 } from "lucide-react"
import { Section } from "../ui/Section"
import { Row }     from "../ui/Row"

interface SecurityTabProps {
    isAdmin:   boolean
    onSignOut: () => void
}

export function SecurityTab({ isAdmin, onSignOut }: SecurityTabProps) {
    const accent = isAdmin
        ? "text-violet-400 hover:text-violet-300"
        : "text-emerald-400 hover:text-emerald-300"

    return (
        <>
            <Section title="Security Settings">
                <div className="space-y-3">
                    <Row label="Password" description="Last changed: never"
                         action={<button className={`text-xs font-medium transition-colors ${accent}`}>Change →</button>}
                    />
                    <Row label="Two-factor authentication" description="Add an extra layer of security"
                         action={<button className={`text-xs font-medium transition-colors ${accent}`}>Enable →</button>}
                    />
                    <Row label="Active sessions" description="Manage where you're logged in"
                         action={<button className={`text-xs font-medium transition-colors ${accent}`}>View →</button>}
                    />
                    <Row label="Sign out everywhere" description="Log out of all devices"
                         action={
                             <button onClick={onSignOut}
                                     className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                             >
                                 Sign out →
                             </button>
                         }
                    />
                </div>
            </Section>

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
    )
}
