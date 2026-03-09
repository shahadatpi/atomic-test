'use client';
import * as React from "react";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Moon, Sun, LayoutDashboard, LogOut, User } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import ModeToggler from "@/components/shared/header/ModeToggler";
import { useRouter } from "next/navigation";

export default function MenuRight() {
    const { data: session, isPending } = useSession();
    const userName = session?.user?.name || "Unknown User";
    const userEmail = session?.user?.email || "";
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [signingOut, setSigningOut] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const cycleTheme = () => {
        if (theme === "light") setTheme("dark");
        else if (theme === "dark") setTheme("system");
        else setTheme("light");
    };

    const ThemeIcon = () => {
        if (!mounted) return <Sun className="h-4 w-4" />;
        if (resolvedTheme === "dark") return <Moon className="h-4 w-4" />;
        return <Sun className="h-4 w-4" />;
    };

    const handleSignOut = async () => {
        setDropdownOpen(false);
        setSigningOut(true);
        await signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/");
                    router.refresh();
                },
                onError: () => {
                    setSigningOut(false);
                },
            },
        });
    };

    const oAuthImage = session?.user?.image?.startsWith("http")
        ? session.user.image
        : null;

    // Avatar fallback — first letter of name
    const avatarFallback = userName?.[0]?.toUpperCase() || "U";

    if (isPending || signingOut) {
        return <div className="w-20 h-9 animate-pulse rounded-md bg-muted" />;
    }

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="icon"
                onClick={cycleTheme}
                aria-label="Toggle theme"
                disabled={!mounted}
            >
                <ThemeIcon />
            </Button>

            {!session ? (
                <Link href="/sign-up" className="hidden sm:block">
                    <Button>Sign In</Button>
                </Link>
            ) : (
                <div className="relative" ref={dropdownRef}>
                    {/* Avatar button */}
                    <button
                        onClick={() => setDropdownOpen((prev) => !prev)}
                        className="relative flex items-center justify-center w-9 h-9 rounded-full ring-2 ring-transparent hover:ring-emerald-400 transition-all focus:outline-none"
                        aria-label="User menu"
                    >
                        {oAuthImage ? (
                            <img
                                src={oAuthImage}
                                className="w-9 h-9 rounded-full object-cover"
                                alt={userName}
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-emerald-400 flex items-center justify-center text-zinc-950 text-sm font-semibold">
                                {avatarFallback}
                            </div>
                        )}
                        {/* Online dot */}
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-background rounded-full" />
                    </button>

                    {/* Dropdown */}
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-popover shadow-lg z-50 overflow-hidden">
                            {/* User info */}
                            <div className="px-4 py-3 border-b border-border">
                                <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                            </div>

                            {/* Menu items */}
                            <div className="py-1">
                                <button
                                    onClick={() => { setDropdownOpen(false); router.push("/dashboard"); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors text-left"
                                >
                                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                                    Dashboard
                                </button>

                                <button
                                    onClick={() => { setDropdownOpen(false); router.push("/profile"); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors text-left"
                                >
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    Profile
                                </button>
                            </div>

                            {/* Sign out */}
                            <div className="py-1 border-t border-border">
                                <button
                                    onClick={handleSignOut}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors text-left"
                                >
                                    <LogOut className="h-4 w-4" />
                                    {signingOut ? "Signing out..." : "Sign out"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <ModeToggler />
        </div>
    );
}