"use client";

import Link from "next/link";
import { useState } from "react";
import { DEMO_PROBLEM } from "./landing.constants";
import katex from 'katex';

function MathText({ text }: { text: string }) {
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$]*?\$)/g);
  return (
      <>
        {parts.map((part, i) => {
          if (part.startsWith("$$") && part.endsWith("$$")) {
            const html = katex.renderToString(part.slice(2, -2), { throwOnError: false, displayMode: true });
            return <span key={i} dangerouslySetInnerHTML={{ __html: html }} style={{ display: 'block' }} />;
          }
          if (part.startsWith("$") && part.endsWith("$")) {
            const html = katex.renderToString(part.slice(1, -1), { throwOnError: false, displayMode: false });
            return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
          }
          return <span key={i}>{part}</span>;
        })}
      </>
  );
}

export default function DemoSection() {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (i: number) => { if (!revealed) setSelected(i); };
  const handleReveal = () => { if (selected !== null) setRevealed(true); };
  const handleReset  = () => { setSelected(null); setRevealed(false); };

  return (
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

          <div className="flex items-center justify-between">
            <span className="text-xs bg-sky-400/10 border border-sky-400/20 text-sky-400 px-3 py-1 rounded-full font-mono">
              Mechanics
            </span>
            <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
              Medium
            </span>
          </div>

          <div className="text-zinc-100 text-base leading-relaxed">
            <MathText text={DEMO_PROBLEM.question} />
          </div>

          <div className="space-y-3">
            {DEMO_PROBLEM.options.map((opt, i) => {
              const key     = ["A", "B", "C", "D"][i];
              const isCorr  = revealed && i === DEMO_PROBLEM.correct;
              const isWrong = revealed && selected === i && i !== DEMO_PROBLEM.correct;
              return (
                  <button
                      key={i}
                      onClick={() => handleSelect(i)}
                      className={`opt-btn w-full flex items-center gap-4 px-5 py-3.5 rounded-xl border text-left text-sm ${
                          isCorr      ? "border-emerald-400 bg-emerald-400/10 text-emerald-300"
                              : isWrong     ? "border-red-400 bg-red-400/10 text-red-300"
                                  : selected === i ? "border-zinc-500 bg-zinc-800 text-white"
                                      : "border-zinc-800 text-zinc-400"
                      }`}
                  >
                    <span className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                        isCorr      ? "bg-emerald-400 text-zinc-950"
                            : isWrong     ? "bg-red-400 text-white"
                                : selected === i ? "bg-zinc-600 text-white"
                                    : "bg-zinc-800 text-zinc-500"
                    }`}>
                      {key}
                    </span>
                    <span className="flex-1">
                      <MathText text={opt} />
                    </span>
                    {isCorr  && <span className="ml-auto text-emerald-400 shrink-0">✓</span>}
                    {isWrong && <span className="ml-auto text-red-400 shrink-0">✗</span>}
                  </button>
              );
            })}
          </div>

          {revealed && (
              <div className="border-t border-zinc-800 pt-4 space-y-2">
                <p className="text-xs text-emerald-400 font-mono">EXPLANATION</p>
                <div className="text-zinc-400 text-sm leading-relaxed">
                  <MathText text={DEMO_PROBLEM.explanation} />
                </div>
              </div>
          )}

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
  );
}
