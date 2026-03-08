"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/auth-client";

/* ── Floating math symbols ── */
const SYMBOLS = [
  "∫", "∑", "∂", "√", "π", "∞", "Δ", "λ", "θ", "φ",
  "α", "β", "γ", "ω", "∇", "≈", "≠", "∈", "∀", "∃",
  "F=ma", "E=mc²", "∇²φ", "∮", "⊗", "ℏ",
];

/* ── Sample MCQ card for hero ── */
const DEMO_PROBLEM = {
  question: "A particle moves with velocity v = 3t² − 2t. What is the acceleration at t = 2s?",
  options: ["8 m/s²", "10 m/s²", "12 m/s²", "14 m/s²"],
  correct: 1,
};

/* ── Stats ── */
const STATS = [
  { value: "500+",  label: "MCQ Problems"     },
  { value: "2",     label: "Subjects"          },
  { value: "98%",   label: "Student Satisfaction" },
  { value: "10k+",  label: "Problems Solved"   },
];

/* ── Features ── */
const FEATURES = [
  {
    icon: "∫",
    title: "LaTeX Rendering",
    desc: "Every equation renders beautifully with full LaTeX support — just like a textbook.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/20",
  },
  {
    icon: "⚡",
    title: "Instant Feedback",
    desc: "Submit your answer and get a detailed explanation with step-by-step working immediately.",
    color: "text-sky-400",
    bg: "bg-sky-400/10 border-sky-400/20",
  },
  {
    icon: "📈",
    title: "Progress Tracking",
    desc: "Track accuracy, streaks, and weak topics. Know exactly what to practice next.",
    color: "text-violet-400",
    bg: "bg-violet-400/10 border-violet-400/20",
  },
  {
    icon: "🎯",
    title: "Adaptive Practice",
    desc: "Problems ranked by difficulty. Graduate from easy to hard at your own pace.",
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/20",
  },
  {
    icon: "🔒",
    title: "Free & Pro Plans",
    desc: "Start free with 50+ problems. Upgrade to unlock everything including AI hints.",
    color: "text-rose-400",
    bg: "bg-rose-400/10 border-rose-400/20",
  },
  {
    icon: "🏆",
    title: "Leaderboard",
    desc: "Compete with peers globally. See where you rank and push your limits.",
    color: "text-orange-400",
    bg: "bg-orange-400/10 border-orange-400/20",
  },
];

/* ── Subjects ── */
const SUBJECTS = [
  {
    name: "Mathematics",
    icon: "∑",
    color: "emerald",
    topics: ["Calculus", "Algebra", "Trigonometry", "Statistics", "Vectors", "Complex Numbers"],
    count: 280,
  },
  {
    name: "Physics",
    icon: "⚛",
    color: "sky",
    topics: ["Mechanics", "Thermodynamics", "Electromagnetism", "Optics", "Quantum", "Relativity"],
    count: 220,
  },
];

export default function LandingPage() {
  const { data: session } = useSession();
  const [selected, setSelected]   = useState<number | null>(null);
  const [revealed, setRevealed]   = useState(false);
  const [symbols,  setSymbols]    = useState<{ s: string; x: number; y: number; size: number; dur: number; delay: number; op: number }[]>([]);
  const [scrollY,  setScrollY]    = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSymbols(
      Array.from({ length: 30 }, (_, i) => ({
        s:     SYMBOLS[i % SYMBOLS.length],
        x:     Math.random() * 100,
        y:     Math.random() * 100,
        size:  Math.random() * 14 + 10,
        dur:   Math.random() * 10 + 8,
        delay: Math.random() * 6,
        op:    Math.random() * 0.07 + 0.03,
      }))
    );
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSelect = (i: number) => {
    if (revealed) return;
    setSelected(i);
  };
  const handleReveal = () => { if (selected !== null) setRevealed(true); };
  const handleReset  = () => { setSelected(null); setRevealed(false); };

  return (
    <div className="bg-zinc-950 text-zinc-100 overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700;800&display=swap');

        /* Floating symbol drift */
        @keyframes drift {
          0%   { transform: translateY(0px)   rotate(0deg);   }
          33%  { transform: translateY(-20px) rotate(5deg);   }
          66%  { transform: translateY(10px)  rotate(-3deg);  }
          100% { transform: translateY(0px)   rotate(0deg);   }
        }
        .symbol { animation: drift var(--dur) ease-in-out infinite; animation-delay: var(--delay); }

        /* Fade up stagger */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .fu  { animation: fadeUp 0.7s ease forwards; }
        .d1  { animation-delay: 0.1s;  opacity: 0; }
        .d2  { animation-delay: 0.25s; opacity: 0; }
        .d3  { animation-delay: 0.4s;  opacity: 0; }
        .d4  { animation-delay: 0.55s; opacity: 0; }
        .d5  { animation-delay: 0.7s;  opacity: 0; }
        .d6  { animation-delay: 0.85s; opacity: 0; }

        /* Scanline */
        @keyframes scan {
          from { transform: translateY(-100%); }
          to   { transform: translateY(100vh); }
        }
        .scanline::after {
          content: '';
          position: absolute;
          left: 0; right: 0; height: 1px;
          background: linear-gradient(transparent, rgba(52,211,153,0.08), transparent);
          animation: scan 8s linear infinite;
        }

        /* Card hover */
        .feat-card { transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; }
        .feat-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }

        /* Gradient text */
        .grad-text {
          background: linear-gradient(135deg, #ffffff 0%, #34d399 50%, #6ee7b7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Nav */
        .nav-link { transition: color 0.15s ease; }
        .nav-link:hover { color: #34d399; }

        /* CTA pulse */
        @keyframes cta-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.4); }
          50%     { box-shadow: 0 0 0 12px rgba(52,211,153,0); }
        }
        .cta-primary { animation: cta-pulse 2.5s ease-out infinite; transition: background 0.15s ease, transform 0.15s ease; }
        .cta-primary:hover { background: #6ee7b7; transform: translateY(-2px); }

        /* Subject card */
        .subj-card { transition: transform 0.2s ease, border-color 0.2s ease; }
        .subj-card:hover { transform: translateY(-3px); }

        /* Option btn */
        .opt-btn { transition: all 0.15s ease; }
        .opt-btn:hover { border-color: rgba(52,211,153,0.5); }

        /* Ticker */
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .ticker-inner { animation: ticker 20s linear infinite; }

        /* Grid drift */
        @keyframes gridDrift {
          from { background-position: 0 0; }
          to   { background-position: 48px 48px; }
        }
        .grid-bg { animation: gridDrift 12s linear infinite; }

        /* Glow orb pulse */
        @keyframes orbPulse {
          0%,100% { opacity: 0.6; transform: translate(-50%,-50%) scale(1);   }
          50%     { opacity: 0.9; transform: translate(-50%,-50%) scale(1.08); }
        }
        .orb { animation: orbPulse 6s ease-in-out infinite; }

        /* Scroll indicator */
        @keyframes scrollBounce {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(6px); }
        }
        .scroll-ind { animation: scrollBounce 1.8s ease-in-out infinite; }
      `}</style>

      {/* ══════════════════════════════════
          NAV
      ══════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-400 rounded-lg flex items-center justify-center">
            <span className="text-zinc-950 font-bold text-sm">A</span>
          </div>
          <span className="font-semibold text-white tracking-tight text-lg">AtomicTest</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {["Features", "Subjects", "Pricing", "Leaderboard"].map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} className="nav-link text-sm text-zinc-400">
              {l}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <Link href="/dashboard">
              <button className="cta-primary bg-emerald-400 text-zinc-950 font-semibold text-sm px-5 py-2 rounded-xl">
                Dashboard →
              </button>
            </Link>
          ) : (
            <>
              <Link href="/sign-in">
                <button className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">
                  Sign in
                </button>
              </Link>
              <Link href="/sign-up">
                <button className="cta-primary bg-emerald-400 text-zinc-950 font-semibold text-sm px-5 py-2 rounded-xl">
                  Get Started →
                </button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ══════════════════════════════════
          HERO
      ══════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-10 overflow-hidden scanline">

        {/* Drifting grid */}
        <div
          className="grid-bg absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(52,211,153,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(52,211,153,0.04) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Glow orb */}
        <div
          className="orb absolute pointer-events-none"
          style={{
            width: 700, height: 700, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(52,211,153,0.12) 0%, rgba(52,211,153,0.04) 40%, transparent 70%)",
            top: "50%", left: "50%",
          }}
        />

        {/* Floating symbols */}
        {symbols.map((sym, i) => (
          <span
            key={i}
            className="symbol absolute select-none pointer-events-none font-mono"
            style={{
              left: `${sym.x}%`,
              top:  `${sym.y}%`,
              fontSize: sym.size,
              opacity: sym.op,
              color: "#34d399",
              ["--dur"   as string]: `${sym.dur}s`,
              ["--delay" as string]: `${sym.delay}s`,
              transform: `translateY(${scrollY * 0.02 * (i % 3 - 1)}px)`,
            }}
          >
            {sym.s}
          </span>
        ))}

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">

          {/* Badge */}
          <div className="fu d1 inline-flex items-center gap-2 bg-emerald-400/10 border border-emerald-400/30 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-mono tracking-wider">
              MATHS & PHYSICS MCQ PLATFORM
            </span>
          </div>

          {/* Headline */}
          <h1
            className="fu d2 text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.05] mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Master Science.
            <br />
            <span className="grad-text">Atom by Atom.</span>
          </h1>

          {/* Sub */}
          <p className="fu d3 text-zinc-400 text-lg sm:text-xl leading-relaxed max-w-xl mb-10">
            500+ LaTeX-rendered MCQ problems in Mathematics and Physics.
            Practice, track progress, and ace your exams — completely free to start.
          </p>

          {/* CTAs */}
          <div className="fu d4 flex flex-col sm:flex-row items-center gap-3 mb-16">
            <Link href="/sign-up">
              <button className="cta-primary bg-emerald-400 text-zinc-950 font-semibold px-8 py-3.5 rounded-2xl text-base">
                Start Practicing Free →
              </button>
            </Link>
            <a href="#demo">
              <button className="border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white transition-all px-8 py-3.5 rounded-2xl text-base">
                See Demo Problem ↓
              </button>
            </a>
          </div>

          {/* Stats row */}
          <div className="fu d5 grid grid-cols-2 sm:grid-cols-4 gap-6 w-full max-w-2xl">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <span
                  className="text-3xl font-bold text-white"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {s.value}
                </span>
                <span className="text-xs text-zinc-600 text-center">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 scroll-ind">
          <span className="text-xs text-zinc-700 font-mono">scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-zinc-700 to-transparent" />
        </div>
      </section>

      {/* ══════════════════════════════════
          TICKER
      ══════════════════════════════════ */}
      <div className="border-y border-zinc-800 py-3 overflow-hidden bg-zinc-900/50">
        <div className="ticker-inner flex gap-12 whitespace-nowrap">
          {[...Array(2)].map((_, rep) => (
            <div key={rep} className="flex gap-12">
              {["Calculus", "Mechanics", "Algebra", "Thermodynamics", "Vectors", "Optics", "Statistics", "Quantum Physics", "Trigonometry", "Electromagnetism"].map((t) => (
                <span key={t} className="text-sm text-zinc-600 font-mono flex items-center gap-3">
                  <span className="text-emerald-400 text-xs">✦</span> {t}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════
          DEMO PROBLEM
      ══════════════════════════════════ */}
      <section id="demo" className="py-24 px-6 flex flex-col items-center">
        <div className="text-center mb-12">
          <p className="text-xs text-emerald-400 font-mono tracking-widest mb-3">INTERACTIVE DEMO</p>
          <h2
            className="text-3xl sm:text-4xl font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Try a Problem Right Now
          </h2>
          <p className="text-zinc-500 mt-3 text-sm">No account needed. Just click and learn.</p>
        </div>

        <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6">
          {/* Topic badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs bg-sky-400/10 border border-sky-400/20 text-sky-400 px-3 py-1 rounded-full font-mono">
              Mechanics
            </span>
            <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
              Medium
            </span>
          </div>

          {/* Question */}
          <p className="text-zinc-100 text-base leading-relaxed">
            {DEMO_PROBLEM.question}
          </p>

          {/* Options */}
          <div className="space-y-3">
            {DEMO_PROBLEM.options.map((opt, i) => {
              const key    = ["A", "B", "C", "D"][i];
              const isCorr = revealed && i === DEMO_PROBLEM.correct;
              const isWrong= revealed && selected === i && i !== DEMO_PROBLEM.correct;
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={`opt-btn w-full flex items-center gap-4 px-5 py-3.5 rounded-xl border text-left text-sm ${
                    isCorr  ? "border-emerald-400 bg-emerald-400/10 text-emerald-300"
                  : isWrong ? "border-red-400    bg-red-400/10    text-red-300"
                  : selected === i ? "border-zinc-500 bg-zinc-800 text-white"
                  : "border-zinc-800 text-zinc-400"
                  }`}
                >
                  <span className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                    isCorr  ? "bg-emerald-400 text-zinc-950"
                  : isWrong ? "bg-red-400    text-white"
                  : selected === i ? "bg-zinc-600 text-white"
                  : "bg-zinc-800 text-zinc-500"
                  }`}>
                    {key}
                  </span>
                  {opt}
                  {isCorr  && <span className="ml-auto text-emerald-400">✓</span>}
                  {isWrong && <span className="ml-auto text-red-400">✗</span>}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {revealed && (
            <div className="border-t border-zinc-800 pt-4 space-y-2">
              <p className="text-xs text-emerald-400 font-mono">EXPLANATION</p>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Acceleration is the derivative of velocity: a = dv/dt = 6t − 2. At t = 2s: a = 6(2) − 2 = <strong className="text-emerald-400">10 m/s²</strong>.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {!revealed ? (
              <button
                onClick={handleReveal}
                disabled={selected === null}
                className="flex-1 bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-300 text-zinc-950 font-semibold text-sm py-3 rounded-xl transition-colors"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleReset}
                className="flex-1 border border-zinc-700 text-zinc-300 hover:border-zinc-500 text-sm py-3 rounded-xl transition-colors"
              >
                Try Again ↺
              </button>
            )}
            <Link href="/sign-up" className="flex-1">
              <button className="w-full border border-emerald-400/40 text-emerald-400 hover:bg-emerald-400/10 text-sm py-3 rounded-xl transition-colors font-medium">
                Get 500+ Problems →
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          FEATURES
      ══════════════════════════════════ */}
      <section id="features" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs text-emerald-400 font-mono tracking-widest mb-3">WHY ATOMICTEST</p>
          <h2
            className="text-3xl sm:text-4xl font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Built for Serious Students
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`feat-card bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-3`}
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xl ${f.bg}`}>
                <span className={f.color}>{f.icon}</span>
              </div>
              <h3 className="text-white font-semibold">{f.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          SUBJECTS
      ══════════════════════════════════ */}
      <section id="subjects" className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs text-emerald-400 font-mono tracking-widest mb-3">WHAT WE COVER</p>
          <h2
            className="text-3xl sm:text-4xl font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Two Subjects. Infinite Depth.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SUBJECTS.map((subj) => (
            <div
              key={subj.name}
              className={`subj-card relative overflow-hidden bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-${subj.color}-400/50`}
            >
              {/* BG glow */}
              <div
                className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
                style={{
                  background: `radial-gradient(circle, rgba(${subj.color === "emerald" ? "52,211,153" : "56,189,248"},0.1) 0%, transparent 70%)`,
                }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-${subj.color}-400/10 border border-${subj.color}-400/20 flex items-center justify-center text-2xl`}>
                      <span className={`text-${subj.color}-400`}>{subj.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">{subj.name}</h3>
                      <p className="text-xs text-zinc-600 font-mono">{subj.count} problems</p>
                    </div>
                  </div>
                  <Link href="/sign-up">
                    <button className={`text-xs text-${subj.color}-400 border border-${subj.color}-400/30 hover:bg-${subj.color}-400/10 px-3 py-1.5 rounded-lg transition-colors`}>
                      Practice →
                    </button>
                  </Link>
                </div>

                <div className="flex flex-wrap gap-2">
                  {subj.topics.map((t) => (
                    <span
                      key={t}
                      className="text-xs text-zinc-400 bg-zinc-800 border border-zinc-700 px-3 py-1 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          PRICING
      ══════════════════════════════════ */}
      <section id="pricing" className="py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs text-emerald-400 font-mono tracking-widest mb-3">PRICING</p>
          <h2
            className="text-3xl sm:text-4xl font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Simple. Transparent. Fair.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6">
            <div>
              <p className="text-xs text-zinc-600 font-mono mb-2">FREE PLAN</p>
              <p className="text-4xl font-bold text-white">$0</p>
              <p className="text-zinc-500 text-sm mt-1">Forever free. No credit card.</p>
            </div>
            <ul className="space-y-3">
              {["50+ free MCQ problems", "Basic progress tracking", "LaTeX rendering", "Community leaderboard"].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-zinc-400">
                  <span className="text-emerald-400 text-base">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/sign-up">
              <button className="w-full border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white text-sm font-medium py-3 rounded-xl transition-colors">
                Start Free →
              </button>
            </Link>
          </div>

          {/* Pro */}
          <div className="relative bg-zinc-900 border border-emerald-400/50 rounded-2xl p-8 space-y-6 overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 80% 20%, rgba(52,211,153,0.08) 0%, transparent 60%)" }}
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-emerald-400 font-mono">PRO PLAN</p>
                <span className="text-xs bg-emerald-400 text-zinc-950 font-bold px-2 py-0.5 rounded-full">POPULAR</span>
              </div>
              <p className="text-4xl font-bold text-white">$9<span className="text-lg text-zinc-500 font-normal">/mo</span></p>
              <p className="text-zinc-500 text-sm mt-1">Everything you need to ace exams.</p>
            </div>
            <ul className="space-y-3">
              {[
                "All 500+ MCQ problems",
                "Step-by-step explanations",
                "AI-powered hints",
                "Advanced analytics",
                "Priority support",
                "New problems weekly",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                  <span className="text-emerald-400 text-base">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/sign-up">
              <button className="cta-primary w-full bg-emerald-400 text-zinc-950 font-semibold text-sm py-3 rounded-xl">
                Upgrade to Pro →
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          FINAL CTA
      ══════════════════════════════════ */}
      <section className="py-24 px-6 flex flex-col items-center text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(52,211,153,0.07) 0%, transparent 70%)" }}
        />
        <p className="relative z-10 text-xs text-emerald-400 font-mono tracking-widest mb-4">START TODAY</p>
        <h2
          className="relative z-10 text-4xl sm:text-5xl font-bold text-white max-w-2xl leading-tight mb-6"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Your next exam starts<br />
          <span className="grad-text">right here.</span>
        </h2>
        <p className="relative z-10 text-zinc-500 text-base max-w-md mb-10 leading-relaxed">
          Join students who are already practicing smarter with AtomicTest. Free to start. No credit card needed.
        </p>
        <div className="relative z-10 flex flex-col sm:flex-row gap-3">
          <Link href="/sign-up">
            <button className="cta-primary bg-emerald-400 text-zinc-950 font-semibold px-10 py-4 rounded-2xl text-base">
              Create Free Account →
            </button>
          </Link>
          <Link href="/problems">
            <button className="border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 px-10 py-4 rounded-2xl text-base transition-colors">
              Browse Problems
            </button>
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════
          FOOTER
      ══════════════════════════════════ */}
      <footer className="border-t border-zinc-800 px-6 md:px-12 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-400 rounded-md flex items-center justify-center">
              <span className="text-zinc-950 text-xs font-bold">A</span>
            </div>
            <span className="font-semibold text-white tracking-tight">AtomicTest</span>
          </div>
          <div className="flex items-center gap-6">
            {["Terms", "Privacy", "Contact", "Docs"].map((l) => (
              <a key={l} href="#" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                {l}
              </a>
            ))}
          </div>
          <p className="text-xs text-zinc-700 font-mono">
            © {new Date().getFullYear()} AtomicTest. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
