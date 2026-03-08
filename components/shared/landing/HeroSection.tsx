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

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-10 overflow-hidden scanline"
    >
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

      {/* Floating math symbols */}
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

      {/* Content */}
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

        {/* Subheading */}
        <p className="fu d3 text-zinc-400 text-lg sm:text-xl leading-relaxed max-w-xl mb-10">
          500+ LaTeX-rendered MCQ problems in Mathematics and Physics.
          Practice, track progress, and ace your exams — completely free to start.
        </p>

        {/* CTAs */}
        <div className="fu d4 flex flex-col sm:flex-row items-center gap-3 mb-16">
          <Link href={session ? "/api/dashboard" : "/api/sign-up"}>
            <button className="cta-primary bg-emerald-400 text-zinc-950 font-semibold px-8 py-3.5 rounded-2xl text-base">
              {session ? "Go to Dashboard →" : "Start Practicing Free →"}
            </button>
          </Link>
          <a href="#demo">
            <button className="border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white transition-all px-8 py-3.5 rounded-2xl text-base">
              See Demo Problem ↓
            </button>
          </a>
        </div>

        {/* Stats */}
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
  );
}
