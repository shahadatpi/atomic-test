"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useSession, signOut } from "@/lib/auth-client";
import {
  Sun, Moon, Monitor, ChevronDown,
  Menu, X, LayoutDashboard, User, Settings, LogOut,
} from "lucide-react";

import { navbarStyles } from "./navbar.styles";
import { PRACTICE_LINKS, SIMPLE_LINKS, USER_LINKS, THEME_OPTIONS } from "./navbar.constants";

/* ─────────────────────────────────────────────
   Hook: close on outside click
───────────────────────────────────────────── */
function useOutsideClick(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, cb]);
}

/* ─────────────────────────────────────────────
   Theme picker (shared by desktop + mobile)
───────────────────────────────────────────── */
function ThemePicker({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  return (
    <div className={compact ? "flex gap-1.5" : "grid grid-cols-3 gap-2"}>
      {THEME_OPTIONS.map(({ label, value, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={label}
          className={`flex flex-col items-center gap-1.5 ${compact ? "flex-1 py-2" : "py-3"} rounded-xl border text-xs transition-all ${
            theme === value
              ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-400"
              : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
          }`}
        >
          <Icon className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Practice dropdown panel
───────────────────────────────────────────── */
function PracticeDropdown({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  return (
    <div className="dropdown-anim absolute top-full left-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
      <div className="p-2">
        {PRACTICE_LINKS.map((link) => {
          const Icon     = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} onClick={onClose}>
              <div className={`drop-item flex items-start gap-3 px-3 py-3 rounded-xl cursor-pointer ${isActive ? "bg-emerald-400/10" : ""}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-emerald-400/20" : "bg-zinc-800"}`}>
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-zinc-400"}`} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${isActive ? "text-emerald-400" : "text-zinc-200"}`}>{link.label}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{link.desc}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Theme dropdown panel
───────────────────────────────────────────── */
function ThemeDropdown({ onClose }: { onClose: () => void }) {
  const { theme, setTheme } = useTheme();
  return (
    <div className="dropdown-anim absolute top-full right-0 mt-2 w-44 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
      <div className="p-2 space-y-1">
        <p className="text-xs text-zinc-600 font-mono px-2 py-1">Appearance</p>
        {THEME_OPTIONS.map(({ label, value, icon: Icon }) => (
          <button
            key={value}
            onClick={() => { setTheme(value); onClose(); }}
            className={`theme-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm ${
              theme === value
                ? "selected text-emerald-400 border-emerald-400/50 bg-emerald-400/10"
                : "border-transparent text-zinc-400"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {theme === value && <span className="ml-auto text-emerald-400 text-xs">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   User dropdown panel
───────────────────────────────────────────── */
function UserDropdown({ name, email, onClose, onSignOut }: {
  name: string; email: string; onClose: () => void; onSignOut: () => void;
}) {
  return (
    <div className="dropdown-anim absolute top-full right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800">
        <p className="text-sm font-medium text-white truncate">{name}</p>
        <p className="text-xs text-zinc-500 truncate">{email}</p>
      </div>

      <div className="p-2 space-y-0.5">
        {[
          { href: "/dashboard",            label: "Dashboard", icon: LayoutDashboard },
          { href: "/dashboard?tab=settings", label: "Profile",   icon: User            },
          { href: "/dashboard?tab=settings", label: "Settings",  icon: Settings        },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={label} href={href} onClick={onClose}>
            <div className="drop-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-zinc-300">
              <Icon className="w-4 h-4 text-zinc-500" /> {label}
            </div>
          </Link>
        ))}
      </div>

      <div className="px-2 pb-2 border-t border-zinc-800 pt-2">
        <p className="text-xs text-zinc-600 font-mono px-2 mb-1.5">Theme</p>
        <ThemePicker compact />
      </div>

      <div className="px-2 pb-2 border-t border-zinc-800 pt-1">
        <button
          onClick={onSignOut}
          className="sign-out-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 text-left"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Mobile menu panel
───────────────────────────────────────────── */
function MobileMenu({ session, avatarLetter, userName, userEmail, onSignOut }: {
  session: boolean; avatarLetter: string;
  userName: string; userEmail: string; onSignOut: () => void;
}) {
  const pathname = usePathname();
  return (
    <div className="mobile-anim fixed top-16 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 shadow-2xl lg:hidden">
      <div className="px-5 py-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">

        <p className="text-xs text-zinc-600 font-mono px-2 py-2">Practice</p>
        {PRACTICE_LINKS.map((link) => {
          const Icon     = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <div className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${isActive ? "bg-emerald-400/10" : "hover:bg-zinc-900"}`}>
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-zinc-500"}`} />
                <span className={`text-sm ${isActive ? "text-emerald-400 font-medium" : "text-zinc-300"}`}>{link.label}</span>
              </div>
            </Link>
          );
        })}

        <p className="text-xs text-zinc-600 font-mono px-2 pt-3 pb-1">Navigate</p>
        {USER_LINKS.map(({ label, href }) => (
          <Link key={href} href={href}>
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-zinc-900 transition-colors">
              <span className="text-sm text-zinc-300">{label}</span>
            </div>
          </Link>
        ))}

        <div className="px-2 pt-3">
          <p className="text-xs text-zinc-600 font-mono mb-2">Appearance</p>
          <ThemePicker />
        </div>

        <div className="pt-3 border-t border-zinc-800 mt-3 space-y-2">
          {session ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center text-zinc-950 font-semibold text-sm shrink-0">
                  {avatarLetter}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{userName}</p>
                  <p className="text-xs text-zinc-500 truncate">{userEmail}</p>
                </div>
              </div>
              <button
                onClick={onSignOut}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Link href="/login">
                <button className="w-full border border-zinc-700 text-zinc-300 text-sm py-3 rounded-xl hover:border-zinc-500 transition-colors">
                  Sign in
                </button>
              </Link>
              <Link href="/sign-up">
                <button className="w-full bg-emerald-400 text-zinc-950 font-semibold text-sm py-3 rounded-xl">
                  Get Started →
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Navbar  (main export)
───────────────────────────────────────────── */
export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { data: session, isPending }       = useSession();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [mounted,      setMounted]      = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [themeOpen,    setThemeOpen]    = useState(false);
  const [userOpen,     setUserOpen]     = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [scrolled,     setScrolled]     = useState(false);

  const practiceRef = useRef<HTMLDivElement>(null);
  const themeRef    = useRef<HTMLDivElement>(null);
  const userRef     = useRef<HTMLDivElement>(null);

  useOutsideClick(practiceRef, () => setPracticeOpen(false));
  useOutsideClick(themeRef,    () => setThemeOpen(false));
  useOutsideClick(userRef,     () => setUserOpen(false));

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    setUserOpen(false);
    await signOut({ fetchOptions: { onSuccess: () => router.push("/") } });
  };

  const ThemeIcon    = mounted
    ? resolvedTheme === "dark" ? Moon : resolvedTheme === "light" ? Sun : Monitor
    : Monitor;
  const oAuthImage   = session?.user?.image?.startsWith("http") ? session.user.image : null;
  const avatarLetter = session?.user?.name?.[0]?.toUpperCase() || "U";
  const userName     = session?.user?.name  || "User";
  const userEmail    = session?.user?.email || "";

  return (
    <>
      <style>{navbarStyles}</style>

      <nav className={`navbar fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px-10 h-16 transition-all duration-300 ${
        scrolled
          ? "bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 shadow-xl shadow-black/20"
          : "bg-zinc-950/70 backdrop-blur-sm border-b border-zinc-800/40"
      }`}>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-emerald-400 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-400/20">
            <span className="text-zinc-950 font-bold text-sm">A</span>
          </div>
          <span className="font-semibold text-white tracking-tight text-[15px] hidden sm:block">
            AtomicTest
          </span>
        </Link>

        {/* Desktop centre */}
        <div className="hidden md:flex items-center gap-1">
          <div ref={practiceRef} className="relative">
            <button
              onClick={() => { setPracticeOpen(p => !p); setThemeOpen(false); setUserOpen(false); }}
              className={`nav-pill flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-zinc-400 ${practiceOpen ? "active" : ""}`}
            >
              Practice
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${practiceOpen ? "rotate-180" : ""}`} />
            </button>
            {practiceOpen && <PracticeDropdown onClose={() => setPracticeOpen(false)} />}
          </div>

          {SIMPLE_LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              <span className={`nav-pill px-3 py-2 rounded-lg text-sm text-zinc-400 ${pathname === l.href ? "active" : ""}`}>
                {l.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-2">
          <div ref={themeRef} className="relative">
            <button
              onClick={() => { setThemeOpen(p => !p); setPracticeOpen(false); setUserOpen(false); }}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-emerald-400 hover:border-zinc-700 transition-all"
              aria-label="Toggle theme"
            >
              {mounted && <ThemeIcon className="w-4 h-4" />}
            </button>
            {themeOpen && <ThemeDropdown onClose={() => setThemeOpen(false)} />}
          </div>

          {isPending ? (
            <div className="w-20 h-9 animate-pulse rounded-xl bg-zinc-800" />
          ) : session ? (
            <div ref={userRef} className="relative">
              <button
                onClick={() => { setUserOpen(p => !p); setPracticeOpen(false); setThemeOpen(false); }}
                className="avatar-ring relative w-9 h-9 rounded-full overflow-hidden border-2 border-zinc-700"
                aria-label="User menu"
              >
                {oAuthImage ? (
                  <img src={oAuthImage} alt={userName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-emerald-400 flex items-center justify-center text-zinc-950 font-semibold text-sm">
                    {avatarLetter}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 border border-zinc-950 rounded-full" />
              </button>
              {userOpen && (
                <UserDropdown
                  name={userName} email={userEmail}
                  onClose={() => setUserOpen(false)}
                  onSignOut={handleSignOut}
                />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <button className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-2">Sign in</button>
              </Link>
              <Link href="/sign-up">
                <button className="cta-btn bg-emerald-400 text-zinc-950 font-semibold text-sm px-4 py-2 rounded-xl shadow-lg shadow-emerald-400/20">
                  Get Started →
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile right */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark")}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400"
          >
            {mounted && <ThemeIcon className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setMobileOpen(p => !p)}
            className="hamburger lg:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <MobileMenu
          session={!!session}
          avatarLetter={avatarLetter}
          userName={userName}
          userEmail={userEmail}
          onSignOut={handleSignOut}
        />
      )}
    </>
  );
}
