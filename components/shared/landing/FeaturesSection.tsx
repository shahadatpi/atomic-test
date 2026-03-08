import { FEATURES } from "./landing.constants";

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-6 max-w-6xl mx-auto">
      {/* Heading */}
      <div className="text-center mb-16">
        <p className="text-xs text-emerald-400 font-mono tracking-widest mb-3">WHY ATOMICTEST</p>
        <h2
          className="text-3xl sm:text-4xl font-bold text-white"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Built for Serious Students
        </h2>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="feat-card bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-3"
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
  );
}
