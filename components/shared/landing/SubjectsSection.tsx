import Link from "next/link";
import { SUBJECTS } from "./landing.constants";

export default function SubjectsSection() {
    return (
        <section id="subjects" className="py-24 px-6 max-w-5xl mx-auto">
            {/* Heading */}
            <div className="text-center mb-16">
                <p className="text-xs text-emerald-400 font-mono tracking-widest mb-3">WHAT WE COVER</p>
                <h2
                    className="text-3xl sm:text-4xl font-bold text-white"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                >
                    Two Subjects. Infinite Depth.
                </h2>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SUBJECTS.map((subj) => (
                    <div
                        key={subj.name}
                        className="subj-card relative overflow-hidden bg-zinc-900 border border-zinc-800 rounded-2xl p-8"
                    >
                        {/* Corner glow */}
                        <div
                            className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
                            style={{
                                background: `radial-gradient(circle, rgba(${subj.rgbColor},0.1) 0%, transparent 70%)`,
                            }}
                        />

                        <div className="relative z-10">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border"
                                        style={{
                                            background: `rgba(${subj.rgbColor},0.1)`,
                                            borderColor: `rgba(${subj.rgbColor},0.2)`,
                                        }}
                                    >
                                        <span style={{ color: `rgb(${subj.rgbColor})` }}>{subj.icon}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold text-lg">{subj.name}</h3>
                                        <p className="text-xs text-zinc-600 font-mono">{subj.count} problems</p>
                                    </div>
                                </div>
                                <Link href="/sign-up">
                                    <button
                                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                                            subj.color === "emerald"
                                                ? "text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/10"
                                                : "text-sky-400 border-sky-400/30 hover:bg-sky-400/10"
                                        }`}
                                    >
                                        Practice →
                                    </button>
                                </Link>
                            </div>

                            {/* Topic pills */}
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
    );
}
