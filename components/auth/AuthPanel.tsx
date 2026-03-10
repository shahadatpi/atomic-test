// components/auth/AuthPanel.tsx
// Right-side visual panel shared between Login and Signup pages.
// Extracted to eliminate 100% code duplication.

import Image from "next/image"
import Link  from "next/link"

const FEATURES = [
  "LaTeX rendering",
  "Instant feedback",
  "Progress tracking",
  "Free & Pro plans",
]

export default function AuthPanel() {
  return (
    <div className="relative hidden md:flex flex-col items-center justify-center bg-zinc-950 border-l border-zinc-800 overflow-hidden p-10 gap-8">

      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(52,211,153,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(52,211,153,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(52,211,153,0.1) 0%, transparent 70%)",
          top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        }}
      />

      {/* Logo */}
      <div className="relative z-10">
        <Link href="/">
          <Image
            src="/atomic-test-logo.png"
            width={120}
            height={120}
            alt="AtomicTest"
            className="object-contain drop-shadow-lg"
          />
        </Link>
      </div>

      {/* Copy */}
      <div className="relative z-10 text-center space-y-3">
        <h2 className="text-2xl font-semibold text-white leading-snug">
          Master Maths &<br />Physics with AI
        </h2>
        <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
          500+ MCQ problems with LaTeX rendering, instant explanations, and progress tracking.
        </p>
      </div>

      {/* Feature pills */}
      <div className="relative z-10 flex flex-wrap justify-center gap-2">
        {FEATURES.map(f => (
          <span
            key={f}
            className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full"
          >
            ✦ {f}
          </span>
        ))}
      </div>
    </div>
  )
}
