"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
import { ChevronDown, CheckCircle, Trash2, Pencil } from "lucide-react";
import MathText, { stripTikz } from "@/components/math/MathText";
import DiffBadge from "./DiffBadge";
import EditModal from "./EditModal";
import { Problem, INSTITUTES, INST_COLORS, parseInstTag, isCQ } from "../types";

/* ── Adaptive MCQ grid: 2-col by default, 1-col if any option is long ── */
function McqOptions({ problem }: { problem: Problem }) {
  const opts = (["a","b","c","d"] as const).map(
    o => ({ key: o, text: (problem[`option_${o}` as keyof Problem] as string) ?? "" })
  ).filter(o => o.text);

  // Use inline style — never purged by Tailwind JIT
  // TikZ options (images) are always 2-col
  // For text options, strip LaTeX and check plain text length
  const hasTikz = opts.some(o => o.text.includes("\\begin{tikzpicture}"));
  const plainLen = (t: string) => t.replace(/\$[^$]*\$/g, "X").replace(/\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}/g, "").trim().length;
  const hasLong = !hasTikz && opts.some(o => plainLen(o.text) > 55);

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: hasLong ? "1fr" : "repeat(2, minmax(0, 1fr))" }}
    >
      {opts.map(({ key, text }) => {
        const isCorrect = problem.correct_answer === key;
        return (
          <div
            key={key}
            className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border text-sm ${
              isCorrect
                ? "border-emerald-400/40 bg-emerald-400/5 text-emerald-300"
                : "border-zinc-800 text-zinc-400"
            }`}
          >
            <span className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center
                              text-xs font-bold font-mono mt-0.5 ${
              isCorrect ? "bg-violet-500 text-white" : "bg-zinc-800 text-zinc-500"
            }`}>
              {key.toUpperCase()}
            </span>
            <span className="flex-1 text-xs leading-relaxed">
              <MathText text={text} />
            </span>
            {isCorrect && <CheckCircle className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />}
          </div>
        );
      })}
    </div>
  );
}

/* ── CQ sub-questions: matches paper-builder style ── */
/**
 * Split a single explanation string into per-subquestion parts.
 * Supports formats like:
 *   "ক) answer ক  খ) answer খ  গ) answer গ  ঘ) answer ঘ"
 *   "ক. answer  খ. answer"
 *   Plain text → shown under ক only
 */
// Read CQ explanations — prefer dedicated columns, fall back to parsing old explanation field
function getCqExplanations(problem: Problem, count: number): (string | null)[] {
  const fromCols = [
    problem.explanation_a ?? null,
    problem.explanation_b ?? null,
    problem.explanation_c ?? null,
    problem.explanation_d ?? null,
  ].slice(0, count);

  // If any dedicated column has data, use them
  if (fromCols.some(Boolean)) return fromCols;

  // Fallback: parse old explanation field with ক) খ) গ) ঘ) markers
  const result: (string | null)[] = Array(count).fill(null);
  const expl = problem.explanation;
  if (!expl) return result;

  const LABELS = ["ক","খ","গ","ঘ"];
  const pattern = new RegExp(`(${LABELS.slice(0, count).map(l => `${l}[).]`).join("|")})`, "g");
  const tokens  = expl.split(pattern).map(s => s.trim()).filter(Boolean);

  if (tokens.length <= 1) { result[0] = expl.trim(); return result; }

  let current = -1;
  for (const token of tokens) {
    const idx = LABELS.findIndex(l => token === `${l})` || token === `${l}.`);
    if (idx !== -1 && idx < count) { current = idx; continue; }
    if (current >= 0) result[current] = (result[current] ? result[current] + "\n" : "") + token;
  }
  return result;
}

/**
 * Converts LaTeX document-level commands into MathText-renderable format.
 * - \subsection*{title} → bold title line
 * - \begin{equation*}...\end{equation*} → $$...$$
 * - \begin{align*}...\end{align*} → $$\begin{aligned}...\end{aligned}$$
 * - \\ line breaks → newlines
 */
function preprocessExplanation(text: string): string {
  let t = text;
  // Section headings → plain bold text (strip the command, keep content)
  t = t.replace(/\\(?:sub)*section\*?\{([^}]*)\}/g, "**$1**");
  // equation* / align* → $$ display math $$
  t = t.replace(/\\begin\{equation\*?\}([\s\S]*?)\\end\{equation\*?\}/g,
    (_, body) => `$$${body.trim()}$$`);
  t = t.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g,
    (_, body) => `$$\\begin{aligned}${body.trim()}\\end{aligned}$$`);
  // \ line breaks inside math-free zones → newline
  t = t.replace(/\\\\/g, "\n");
  return t;
}

function CqOptions({ problem }: { problem: Problem }) {
  // Keep original index (0-3) so explanations[i] always maps to the right slot
  const allParts = (["a","b","c","d"] as const).map((o, i) => ({
    key:   o,
    idx:   i,
    label: ["ক","খ","গ","ঘ"][i],
    marks: ["১","২","৩","৪"][i],
    text:  (problem[`option_${o}` as keyof Problem] as string) ?? "",
  }));
  // Show a part if it has text OR if it has an explanation (don't hide slots that have solutions)
  const explanations = getCqExplanations(problem, 4);
  const parts = allParts.filter(p => p.text || explanations[p.idx]);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (parts.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
      {parts.map(({ label, marks, text, idx }) => {
        const expl   = explanations[idx];
        const isOpen = openIdx === idx;
        return (
          <div key={label}>
            {/* ── Row: label | text | marks | সমাধান ── */}
            <div className="flex items-center min-h-[40px]">

              {/* Bengali label */}
              <span className="shrink-0 w-9 flex items-center justify-center
                               self-stretch border-r border-zinc-800/60
                               font-bold text-sm text-violet-400">
                {label}
              </span>

              {/* Question text */}
              <span className="flex-1 text-zinc-300 leading-snug px-3 py-2 text-xs">
                <MathText text={text} />
              </span>

              {/* Marks */}
              <span className="shrink-0 w-8 flex items-center justify-center
                               self-stretch border-l border-zinc-800/60
                               text-xs font-mono text-zinc-500">
                {marks}
              </span>

              {/* সমাধান toggle — always shown, dimmed if no explanation */}
              <button
                onClick={() => expl && setOpenIdx(isOpen ? null : idx)}
                className={`shrink-0 flex items-center gap-1 self-stretch
                            px-3 border-l border-zinc-800/60 text-[11px] font-mono
                            transition-colors whitespace-nowrap ${
                  expl
                    ? isOpen
                      ? "text-amber-400 bg-zinc-800/50 cursor-pointer"
                      : "text-amber-400/70 hover:text-amber-400 hover:bg-zinc-800/40 cursor-pointer"
                    : "text-zinc-700 cursor-default"
                }`}
              >
                সমাধান
                {expl
                  ? <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  : <ChevronDown className="w-3 h-3 ml-0.5 opacity-30" />
                }
              </button>
            </div>

            {/* Collapsible explanation */}
            {expl && isOpen && (
              <div className="px-4 py-3 text-sm text-zinc-300 leading-relaxed bg-zinc-950/60
                              border-t border-zinc-800/60">
                <MathText text={preprocessExplanation(expl)} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ProblemCard({ problem: init, onDelete, number }: {
  key?:     React.Key;
  problem:  Problem;
  onDelete: (id: string) => void | Promise<void>;
  number:   number;
}) {
  const [problem,  setProblem]  = useState(init);
  const [expanded, setExpanded] = useState(false);
  const [explOpen, setExplOpen] = useState(false);
  const [editing,  setEditing]  = useState(false);
  const [saveKey,  setSaveKey]  = useState(0);

  const cq = isCQ(problem);

  return (
    <>
      {editing && (
        <EditModal
          problem={problem}
          onClose={() => setEditing(false)}
          onSave={async updated => {
            // Merge optimistically first for instant UI feedback
            setProblem(p => ({ ...p, ...updated }));
            setSaveKey(k => k + 1);
            // Then re-fetch from DB to get all columns including explanation_a/b/c/d
            const { data } = await supabase
              .from("problems")
              .select(`id, question, option_a, option_b, option_c, option_d,
                       correct_answer, explanation, explanation_a, explanation_b,
                       explanation_c, explanation_d, difficulty, is_free, tags,
                       source, created_at, subject_id, topic_id, subtopic_id,
                       problem_type, subjects(name), topics(name), subtopics(name)`)
              .eq("id", updated.id ?? problem.id)
              .single();
            if (data) { setProblem(data as any); setSaveKey(k => k + 1); }
          }}
        />
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors">

        {/* ── Header (always visible) ── */}
        <div className="px-5 py-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
          <div className="flex items-start gap-4">

            {/* Number badge */}
            <div className="shrink-0 w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mt-0.5">
              <span className="text-xs font-mono font-bold text-zinc-500">{number}</span>
            </div>

            <div className="flex-1 min-w-0">
              {/* Meta row */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-xs text-zinc-600 font-mono">
                  {problem.subjects?.name} · {problem.topics?.name}
                  {problem.subtopics?.name && <> · <span className="text-zinc-500">{problem.subtopics.name}</span></>}
                </span>
                <DiffBadge level={problem.difficulty} />
                {/* CQ / MCQ type badge */}
                {cq ? (
                  <span className="text-xs font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">CQ</span>
                ) : (
                  <span className="text-xs font-mono text-sky-400 bg-sky-400/10 border border-sky-400/20 px-2 py-0.5 rounded-full">MCQ</span>
                )}
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-mono ${
                  problem.is_free
                    ? "text-sky-400 border-sky-400/30 bg-sky-400/10"
                    : "text-violet-400 border-violet-400/30 bg-violet-400/10"
                }`}>{problem.is_free ? "Free" : "Pro"}</span>
                {problem.source && <span className="text-xs text-zinc-600">{problem.source}</span>}
              </div>

              {/* Question text */}
              <div className="text-sm text-zinc-200 leading-relaxed">
                {expanded
                  ? <MathText text={problem.question} />
                  : <MathText text={stripTikz(problem.question)} />}
              </div>

              {/* Tags */}
              {problem.tags?.length ? (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {problem.tags.map(tag => {
                    const parsed = parseInstTag(tag);
                    const instColor = parsed
                      ? INST_COLORS[INSTITUTES.find(i => i.key === parsed.inst)?.color ?? ""] ?? ""
                      : "";
                    return (
                      <span key={tag} className={`text-xs px-2 py-0.5 rounded-full border font-mono ${
                        instColor || "bg-zinc-800 border-zinc-700 text-zinc-500"
                      }`}>{tag}</span>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
              <button onClick={() => setEditing(true)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-600 hover:text-violet-400 hover:bg-violet-400/10 transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onDelete(problem.id)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <ChevronDown className={`w-4 h-4 text-zinc-600 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
            </div>
          </div>
        </div>

        {/* ── Expanded body ── */}
        {expanded && (
          <div className="border-t border-zinc-800 px-5 py-4 space-y-3">

            {cq ? <CqOptions key={saveKey} problem={problem} /> : <McqOptions problem={problem} />}

            {/* Explanation — only shown globally for MCQ; CQ shows per-subquestion */}
            {!cq && problem.explanation && (
              <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <button onClick={() => setExplOpen(e => !e)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors">
                  <span className="text-violet-400">EXPLANATION</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${explOpen ? "rotate-180" : ""}`} />
                </button>
                {explOpen && (
                  <div className="px-4 pb-3 pt-1 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800 bg-zinc-950">
                    <MathText text={problem.explanation} />
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-zinc-700 font-mono">
              ID: {problem.id} · Added {new Date(problem.created_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
