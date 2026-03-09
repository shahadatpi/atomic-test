import Link from "next/link";

export default function CtaSection() {
  return (
    <section className="py-24 px-6 flex flex-col items-center text-center relative overflow-hidden">
      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(52,211,153,0.07) 0%, transparent 70%)",
        }}
      />

      <p className="relative z-10 text-xs text-emerald-400 font-mono tracking-widest mb-4">
        START TODAY
      </p>

      <h2
        className="relative z-10 text-4xl sm:text-5xl font-bold text-white max-w-2xl leading-tight mb-6"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Your next exam starts
        <br />
        <span className="grad-text">right here.</span>
      </h2>

      <p className="relative z-10 text-zinc-500 text-base max-w-md mb-10 leading-relaxed">
        Join students who are already practicing smarter with AtomicTest.
        Free to start. No credit card needed.
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
  );
}
