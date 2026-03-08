"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Monitor, Check, ArrowLeft, Camera, Mail, User, Shield, Bell, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const TABS = ["Profile", "Appearance", "Notifications", "Security"] as const;
type Tab = typeof TABS[number];

const TAB_ICONS = {
    Profile: User,
    Appearance: Palette,
    Notifications: Bell,
    Security: Shield,
};

export default function ProfilePage() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>("Profile");
    const [saved, setSaved] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isPending && !session) router.push("/api/sign-in");
        if (session?.user?.name) setName(session.user.name);
    }, [session, isPending, router]);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleSignOut = async () => {
        await signOut({
            fetchOptions: {
                onSuccess: () => router.push("/"),
            },
        });
    };

    const oAuthImage = session?.user?.image?.startsWith("http")
        ? session.user.image
        : null;
    const avatarFallback = session?.user?.name?.[0]?.toUpperCase() || "U";

    if (isPending || !session) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        .profile-root { font-family: 'DM Sans', sans-serif; }
        .tab-btn { transition: all 0.15s ease; }
        .theme-card { transition: all 0.2s ease; }
        .theme-card:hover { transform: translateY(-2px); }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
      `}</style>

            <div className="profile-root max-w-4xl mx-auto px-4 py-10">

                {/* Back link */}
                <Link
                    href="/api/dashboard"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Link>

                {/* Header card */}
                <div className="relative rounded-2xl border border-border bg-card overflow-hidden mb-6">
                    {/* Cover */}
                    <div
                        className="h-28 w-full"
                        style={{
                            background: resolvedTheme === "dark"
                                ? "linear-gradient(135deg, #052e16 0%, #064e3b 50%, #065f46 100%)"
                                : "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%)",
                        }}
                    />

                    {/* Avatar + info */}
                    <div className="px-6 pb-6">
                        <div className="flex items-end justify-between -mt-10 mb-4">
                            <div className="relative">
                                {oAuthImage ? (
                                    <img
                                        src={oAuthImage}
                                        alt={session.user.name || "User"}
                                        referrerPolicy="no-referrer"
                                        className="w-20 h-20 rounded-2xl border-4 border-card object-cover"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-2xl border-4 border-card bg-emerald-400 flex items-center justify-center text-2xl font-bold text-zinc-950">
                                        {avatarFallback}
                                    </div>
                                )}
                                <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-400 border-2 border-card flex items-center justify-center hover:bg-emerald-300 transition-colors">
                                    <Camera className="h-3 w-3 text-zinc-950" />
                                </button>
                            </div>

                            <button
                                onClick={handleSignOut}
                                className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors border border-red-500/20"
                            >
                                Sign out
                            </button>
                        </div>

                        <h1 className="text-xl font-semibold text-foreground">{session.user.name}</h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Mail className="h-3.5 w-3.5" />
                            {session.user.email}
                        </p>
                    </div>
                </div>

                {/* Tab bar + content */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                    {TABS.map((tab) => {
                        const Icon = TAB_ICONS[tab];
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`tab-btn flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border ${
                                    activeTab === tab
                                        ? "bg-emerald-400 text-zinc-950 border-emerald-400"
                                        : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab}
                            </button>
                        );
                    })}
                </div>

                {/* Tab content */}
                <div className="fade-in" key={activeTab}>

                    {/* ── Profile Tab ── */}
                    {activeTab === "Profile" && (
                        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                            <h2 className="text-base font-semibold text-foreground">Personal Information</h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                        Display Name
                                    </label>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition"
                                        placeholder="Your name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                        Email Address
                                    </label>
                                    <input
                                        value={session.user.email || ""}
                                        disabled
                                        className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                    Bio
                                </label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={3}
                                    placeholder="Tell us a little about yourself..."
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-border">
                                <p className="text-xs text-muted-foreground">
                                    Member since {new Date(session.user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                </p>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
                                >
                                    {saved ? <><Check className="h-4 w-4" /> Saved!</> : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Appearance Tab ── */}
                    {activeTab === "Appearance" && (
                        <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                            <div>
                                <h2 className="text-base font-semibold text-foreground mb-1">Theme</h2>
                                <p className="text-sm text-muted-foreground">Choose how AtomicTest looks to you.</p>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {/* Light */}
                                <button
                                    onClick={() => setTheme("light")}
                                    className={`theme-card relative rounded-2xl border-2 p-4 text-left ${
                                        theme === "light" ? "border-emerald-400" : "border-border hover:border-muted-foreground"
                                    }`}
                                >
                                    {theme === "light" && (
                                        <div className="absolute top-3 right-3 w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center">
                                            <Check className="h-3 w-3 text-zinc-950" />
                                        </div>
                                    )}
                                    {/* Preview */}
                                    <div className="rounded-xl bg-white border border-zinc-200 p-3 mb-3 space-y-1.5">
                                        <div className="h-2 w-3/4 bg-zinc-200 rounded-full" />
                                        <div className="h-2 w-1/2 bg-zinc-100 rounded-full" />
                                        <div className="h-6 w-full bg-zinc-100 rounded-lg mt-2" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Sun className="h-4 w-4 text-amber-400" />
                                        <span className="text-sm font-medium text-foreground">Light</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">Clean and bright</p>
                                </button>

                                {/* Dark */}
                                <button
                                    onClick={() => setTheme("dark")}
                                    className={`theme-card relative rounded-2xl border-2 p-4 text-left ${
                                        theme === "dark" ? "border-emerald-400" : "border-border hover:border-muted-foreground"
                                    }`}
                                >
                                    {theme === "dark" && (
                                        <div className="absolute top-3 right-3 w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center">
                                            <Check className="h-3 w-3 text-zinc-950" />
                                        </div>
                                    )}
                                    <div className="rounded-xl bg-zinc-900 border border-zinc-700 p-3 mb-3 space-y-1.5">
                                        <div className="h-2 w-3/4 bg-zinc-700 rounded-full" />
                                        <div className="h-2 w-1/2 bg-zinc-800 rounded-full" />
                                        <div className="h-6 w-full bg-zinc-800 rounded-lg mt-2" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Moon className="h-4 w-4 text-sky-400" />
                                        <span className="text-sm font-medium text-foreground">Dark</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">Easy on the eyes</p>
                                </button>

                                {/* System */}
                                <button
                                    onClick={() => setTheme("system")}
                                    className={`theme-card relative rounded-2xl border-2 p-4 text-left ${
                                        theme === "system" ? "border-emerald-400" : "border-border hover:border-muted-foreground"
                                    }`}
                                >
                                    {theme === "system" && (
                                        <div className="absolute top-3 right-3 w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center">
                                            <Check className="h-3 w-3 text-zinc-950" />
                                        </div>
                                    )}
                                    <div className="rounded-xl overflow-hidden border border-zinc-300 mb-3">
                                        <div className="grid grid-cols-2 h-14">
                                            <div className="bg-white p-2 space-y-1">
                                                <div className="h-1.5 w-full bg-zinc-200 rounded-full" />
                                                <div className="h-1.5 w-2/3 bg-zinc-100 rounded-full" />
                                            </div>
                                            <div className="bg-zinc-900 p-2 space-y-1">
                                                <div className="h-1.5 w-full bg-zinc-700 rounded-full" />
                                                <div className="h-1.5 w-2/3 bg-zinc-800 rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Monitor className="h-4 w-4 text-violet-400" />
                                        <span className="text-sm font-medium text-foreground">System</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">Follows your device</p>
                                </button>
                            </div>

                            {mounted && (
                                <p className="text-xs text-muted-foreground">
                                    Currently using{" "}
                                    <span className="text-emerald-400 font-medium">
                    {resolvedTheme === "dark" ? "dark" : "light"} mode
                  </span>
                                    {theme === "system" && " (system preference)"}
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── Notifications Tab ── */}
                    {activeTab === "Notifications" && (
                        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                            <h2 className="text-base font-semibold text-foreground mb-2">Notification Preferences</h2>
                            {[
                                { label: "Daily practice reminders", desc: "Get reminded to practice every day", defaultOn: true },
                                { label: "Streak alerts", desc: "Know when your streak is at risk", defaultOn: true },
                                { label: "New problems available", desc: "When new problems are added", defaultOn: false },
                                { label: "Weekly progress report", desc: "Summary of your weekly activity", defaultOn: true },
                                { label: "Promotional emails", desc: "Updates about new features and plans", defaultOn: false },
                            ].map((item) => (
                                <NotificationRow key={item.label} {...item} />
                            ))}
                        </div>
                    )}

                    {/* ── Security Tab ── */}
                    {activeTab === "Security" && (
                        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                            <h2 className="text-base font-semibold text-foreground">Security Settings</h2>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Password</p>
                                        <p className="text-xs text-muted-foreground">Last changed never</p>
                                    </div>
                                    <button className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                                        Change →
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Two-factor authentication</p>
                                        <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                                    </div>
                                    <button className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                                        Enable →
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Active sessions</p>
                                        <p className="text-xs text-muted-foreground">Manage where you're logged in</p>
                                    </div>
                                    <button className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                                        View →
                                    </button>
                                </div>
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
        </div>
    );
}

// Notification toggle row
function NotificationRow({
                             label,
                             desc,
                             defaultOn,
                         }: {
    label: string;
    desc: string;
    defaultOn: boolean;
}) {
    const [on, setOn] = useState(defaultOn);
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
            <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <button
                onClick={() => setOn((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                    on ? "bg-emerald-400" : "bg-zinc-600"
                }`}
            >
        <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                on ? "translate-x-5" : "translate-x-0"
            }`}
        />
            </button>
        </div>
    );
}
