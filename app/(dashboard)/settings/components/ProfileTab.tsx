import { Check, Loader2, Save } from "lucide-react"
import { Section } from "../ui/Section"

interface ProfileTabProps {
    session:   any
    isAdmin:   boolean
    name:      string
    bio:       string
    saving:    boolean
    saved:     boolean
    onName:    (v: string) => void
    onBio:     (v: string) => void
    onSave:    () => void
}

export function ProfileTab({ session, isAdmin, name, bio, saving, saved, onName, onBio, onSave }: ProfileTabProps) {
    return (
        <Section title="Personal Information" description="Update your display name and bio.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Display Name</label>
                    <input value={name} onChange={e => onName(e.target.value)}
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
                <textarea value={bio} onChange={e => onBio(e.target.value)} rows={3}
                          placeholder="Tell us about yourself..."
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all resize-none"
                />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <p className="text-xs text-zinc-600">
                    Member since {new Date(session.user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </p>
                <button onClick={onSave} disabled={saving}
                        className={`flex items-center gap-2 text-zinc-950 text-sm font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-60 ${isAdmin ? "bg-violet-400 hover:bg-violet-300" : "bg-emerald-400 hover:bg-emerald-300"}`}
                >
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                            : saved  ? <><Check className="w-4 h-4" /> Saved!</>
                            : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
            </div>
        </Section>
    )
}
