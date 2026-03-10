"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { SYMBOLS, STATS } from "./landing.constants";

export default function HeroSection() {
  const { data: session } = useSession();
  const [symbols, setSymbols] = useState<
    { s: string; x: number; y: number; size: number; dur: number; delay: number; op: number }[]
  >([]);
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setSymbols(
      Array.from({ length: 24 }, (_, i) => ({
        s:     SYMBOLS[i % SYMBOLS.length],
        x:     Math.random() * 100,
        y:     Math.random() * 100,
        size:  Math.random() * 12 + 9,
        dur:   Math.random() * 10 + 8,
        delay: Math.random() * 6,
        op:    Math.random() * 0.06 + 0.025,
      }))
    );
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 overflow-hidden"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');

        /* ── Grid drift ── */
        @keyframes gridDrift {
          from { background-position: 0 0; }
          to   { background-position: 48px 48px; }
        }
        .hero-grid { animation: gridDrift 14s linear infinite; }

        /* ── Orb pulse ── */
        @keyframes orbPulse {
          0%,100% { opacity: 0.5; transform: translate(-50%,-50%) scale(1); }
          50%     { opacity: 0.8; transform: translate(-50%,-50%) scale(1.06); }
        }
        .hero-orb { animation: orbPulse 7s ease-in-out infinite; }

        /* ── Symbol float ── */
        @keyframes drift {
          0%   { transform: translateY(0px)   rotate(0deg);  }
          33%  { transform: translateY(-18px) rotate(4deg);  }
          66%  { transform: translateY(9px)   rotate(-3deg); }
          100% { transform: translateY(0px)   rotate(0deg);  }
        }
        .hero-symbol { animation: drift var(--dur) ease-in-out infinite; animation-delay: var(--delay); }

        /* ── Scanline sweep ── */
        @keyframes scan {
          from { transform: translateY(-100%); }
          to   { transform: translateY(100vh); }
        }
        .hero-scan::after {
          content: '';
          position: absolute;
          left: 0; right: 0; height: 1px;
          background: linear-gradient(transparent, rgba(52,211,153,0.07), transparent);
          animation: scan 9s linear infinite;
          pointer-events: none;
        }

        /* ── Stagger reveal — THE FIX: .fu rule MUST be here ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fu          { animation: fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) both; }
        .fu.d1       { animation-delay: 0.05s; }
        .fu.d2       { animation-delay: 0.15s; }
        .fu.d3       { animation-delay: 0.25s; }
        .fu.d4       { animation-delay: 0.38s; }
        .fu.d5       { animation-delay: 0.52s; }

        /* ── Gradient text ── */
        .hero-grad {
          background: linear-gradient(135deg, #ffffff 0%, #34d399 45%, #6ee7b7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── CTA button ── */
        @keyframes ctaPulse {
          0%,100% { box-shadow: 0 0 0 0   rgba(52,211,153,0.45); }
          50%     { box-shadow: 0 0 0 14px rgba(52,211,153,0);   }
        }
        .hero-cta {
          animation: ctaPulse 2.8s ease-out infinite;
          transition: background 0.15s ease, transform 0.15s ease;
        }
        .hero-cta:hover { background: #6ee7b7 !important; transform: translateY(-2px); }

        /* ── Scroll bounce ── */
        @keyframes scrollBounce {
          0%,100% { transform: translateY(0);  }
          50%     { transform: translateY(7px); }
        }
        .hero-scroll { animation: scrollBounce 2s ease-in-out infinite; }

        /* ── Stat counter shimmer ── */
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .stat-val {
          background: linear-gradient(90deg, #fff 30%, #34d399 50%, #fff 70%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        /* ── Badge pulse dot ── */
        @keyframes ping {
          0%    { transform: scale(1);   opacity: 1; }
          75%,100% { transform: scale(2); opacity: 0; }
        }
        .badge-dot::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #34d399;
          animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
        }
      `}</style>

      {/* ── Animated grid ── */}
      <div
        className="hero-grid absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(52,211,153,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(52,211,153,0.035) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* ── Radial glow orb ── */}
      <div
        className="hero-orb absolute pointer-events-none"
        style={{
          width: 760, height: 760, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(52,211,153,0.11) 0%, rgba(52,211,153,0.04) 40%, transparent 68%)",
          top: "50%", left: "50%",
        }}
      />

      {/* ── Secondary accent orb (top-right) ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)",
          top: "10%", right: "5%",
          filter: "blur(40px)",
        }}
      />

      {/* ── Scanline ── */}
      <div className="hero-scan absolute inset-0 pointer-events-none overflow-hidden" />

      {/* ── Floating math symbols ── */}
      {mounted && symbols.map((sym, i) => (
        <span
          key={i}
          className="hero-symbol absolute select-none pointer-events-none font-mono"
          style={{
            left: `${sym.x}%`,
            top:  `${sym.y}%`,
            fontSize: sym.size,
            opacity: sym.op,
            color: "#34d399",
            ["--dur"   as string]: `${sym.dur}s`,
            ["--delay" as string]: `${sym.delay}s`,
            transform: `translateY(${scrollY * 0.018 * (i % 3 - 1)}px)`,
          }}
        >
          {sym.s}
        </span>
      ))}

      {/* ── Hero content ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">

        {/* Badge */}
        <div className="fu d1 inline-flex items-center gap-2.5 bg-emerald-400/8 border border-emerald-400/25 rounded-full px-4 py-1.5 mb-10">
          <span className="badge-dot relative w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-[11px] text-emerald-400 font-mono tracking-[0.18em] uppercase">
            Maths &amp; Physics MCQ Platform
          </span>
        </div>

        {/* Headline */}
        <h1
          className="fu d2 text-5xl sm:text-6xl md:text-[76px] font-black leading-[1.02] mb-5 tracking-tight"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Master Science.
          <br />
          <span className="hero-grad italic">Atom by Atom.</span>
        </h1>

        {/* Eyebrow line */}
        <div className="fu d2 flex items-center gap-3 mb-6">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-zinc-700" />
          <span className="text-xs text-zinc-600 font-mono tracking-widest uppercase">est. 2024 · Dhaka, BD</span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-zinc-700" />
        </div>

        {/* Subheading */}
        <p
          className="fu d3 text-zinc-400 text-lg sm:text-xl leading-relaxed max-w-lg mb-10"
          style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
        >
          500+ LaTeX-rendered MCQs in Mathematics and Physics.
          Track progress, ace your admissions — free to start.
        </p>

        {/* CTAs */}
        <div className="fu d4 flex flex-col sm:flex-row items-center gap-3 mb-16">
          <Link href={session ? "/dashboard" : "/sign-up"}>
            <button
              className="hero-cta bg-emerald-400 text-zinc-950 font-semibold px-8 py-3.5 rounded-2xl text-[15px] tracking-tight"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {session ? "Go to Dashboard →" : "Start Practicing Free →"}
            </button>
          </Link>
          <a href="#demo">
            <button
              className="border border-zinc-700/80 text-zinc-400 hover:border-zinc-500 hover:text-white px-8 py-3.5 rounded-2xl text-[15px] tracking-tight transition-all"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              See Demo Problem ↓
            </button>
          </a>
        </div>

        {/* Stats */}
        <div className="fu d5 w-full max-w-2xl">
          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
            <span className="text-[10px] text-zinc-700 font-mono tracking-widest">PLATFORM STATS</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {STATS.map((s, i) => (
              <div key={s.label} className="flex flex-col items-center gap-1.5 group">
                <span
                  className="stat-val text-3xl font-black tabular-nums"
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    animationDelay: `${i * 0.4}s`,
                  }}
                >
                  {s.value}
                </span>
                <span className="text-[11px] text-zinc-600 text-center tracking-wide font-mono uppercase">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Institute tags strip ── */}
      <div className="fu d5 relative z-10 mt-8 flex flex-wrap items-center justify-center gap-2 px-6 max-w-2xl mx-auto">
        {["DU", "BUET", "CUET", "RUET", "KUET", "SUST", "Medical", "Board"].map((inst) => (
          <span
            key={inst}
            className="text-[11px] font-mono text-zinc-600 border border-zinc-800 bg-zinc-900/60 px-3 py-1 rounded-full hover:border-emerald-400/30 hover:text-emerald-400/70 transition-all cursor-default"
          >
            {inst}
          </span>
        ))}
      </div>

      {/* ── Scroll indicator — flows in layout, never overlaps ── */}
      <div className="hero-scroll relative z-10 mt-10 flex flex-col items-center gap-2">
        <span className="text-[10px] text-zinc-700 font-mono tracking-widest">SCROLL</span>
        <div className="w-px h-7 bg-gradient-to-b from-zinc-700 to-transparent" />
      </div>
    </section>
  );
}
