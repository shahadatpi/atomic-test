import Link from "next/link";
import { FREE_FEATURES, PRO_FEATURES } from "./landing.constants";

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-6 max-w-4xl mx-auto">
      {/* Heading */}
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

        {/* Free plan */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6">
          <div>
            <p className="text-xs text-zinc-600 font-mono mb-2">FREE PLAN</p>
            <p className="text-4xl font-bold text-white">$0</p>
            <p className="text-zinc-500 text-sm mt-1">Forever free. No credit card.</p>
          </div>
          <ul className="space-y-3">
            {FREE_FEATURES.map((f) => (
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

        {/* Pro plan */}
        <div className="relative bg-zinc-900 border border-emerald-400/50 rounded-2xl p-8 space-y-6 overflow-hidden">
          {/* Glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at 80% 20%, rgba(52,211,153,0.08) 0%, transparent 60%)",
            }}
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-emerald-400 font-mono">PRO PLAN</p>
              <span className="text-xs bg-emerald-400 text-zinc-950 font-bold px-2 py-0.5 rounded-full">
                POPULAR
              </span>
            </div>
            <p className="text-4xl font-bold text-white">
              $9<span className="text-lg text-zinc-500 font-normal">/mo</span>
            </p>
            <p className="text-zinc-500 text-sm mt-1">Everything you need to ace exams.</p>
          </div>

          <ul className="space-y-3">
            {PRO_FEATURES.map((f) => (
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
  );
}
