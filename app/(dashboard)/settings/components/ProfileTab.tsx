import { useState, useEffect } from "react"
import { Check, Loader2, Save, AlertCircle } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Section } from "../ui/Section"

interface ProfileTabProps {
    session:  any
    isAdmin:  boolean
}

export function ProfileTab({ session, isAdmin }: ProfileTabProps) {
    const [name,   setName]   = useState(session.user.name || "")
    const [bio,    setBio]    = useState((session.user as any).bio || "")
    const [saving, setSaving] = useState(false)
    const [saved,  setSaved]  = useState(false)
    const [error,  setError]  = useState<string | null>(null)

    // Stay in sync if session refreshes externally
    useEffect(() => {
        setName(session.user.name || "")
        setBio((session.user as any).bio || "")
    }, [session.user.name, (session.user as any).bio])

    const isDirty =
        name.trim() !== (session.user.name || "").trim() ||
        bio.trim()  !== ((session.user as any).bio || "").trim()

    const handleSave = async () => {
        if (!isDirty || saving) return
        setError(null)
        setSaving(true)

        try {
            const result = await authClient.updateUser({
                name: name.trim(),
                bio:  bio.trim(),
            } as any)
            if (result.error) {
                setError(result.error.message ?? "Failed to save")
            } else {
                setSaved(true)
                setTimeout(() => setSaved(false), 2500)
            }
        } catch (e: any) {
            setError(e?.message ?? "Something went wrong")
        } finally {
            setSaving(false)
        }
    }

    const accent = isAdmin ? "bg-violet-400 hover:bg-violet-300" : "bg-emerald-400 hover:bg-emerald-300"

    return (
        <Section title="Personal Information" description="Update your display name and bio.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Display Name</label>
                    <input
                        value={name}
                        onChange={e => { setName(e.target.value); setSaved(false); setError(null) }}
                        onKeyDown={e => e.key === "Enter" && handleSave()}
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
                <textarea value={bio} onChange={e => { setBio(e.target.value); setSaved(false); setError(null) }} rows={3}
                          placeholder="Tell us about yourself..."
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all resize-none"
                />
            </div>

            {error && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-4 py-3 rounded-xl">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
                </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <p className="text-xs text-zinc-600">
                    Member since {new Date(session.user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </p>
                <button onClick={handleSave} disabled={saving || !isDirty}
                        className={`flex items-center gap-2 text-zinc-950 text-sm font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${accent}`}
                >
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                            : saved  ? <><Check className="w-4 h-4" /> Saved!</>
                            : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
            </div>
        </Section>
    )
}
