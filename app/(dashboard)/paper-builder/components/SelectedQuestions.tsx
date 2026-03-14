"use client";

import { useEffect, useRef, useState } from "react";
import {
  Trash2, ArrowUp, ArrowDown, GripVertical, ChevronDown,
  Eye, EyeOff, Pencil, X, Save, BookOpen,
} from "lucide-react";
import MathText, { stripTikz } from "@/components/math/MathText";

// Truncate outside math delimiters — never cut inside $...$
function safeTruncate(text: string, max = 120): string {
  const stripped = stripTikz(text);
  if (stripped.length <= max) return stripped;
  // Find last safe cut point outside any $...$ pair before max
  let depth = 0;
  let lastSafe = max;
  for (let i = 0; i < Math.min(stripped.length, max); i++) {
    if (stripped[i] === "$") depth = depth === 0 ? 1 : 0;
    if (depth === 0) lastSafe = i;
  }
  return stripped.slice(0, lastSafe + 1) + "…";
}
import type { SelectedProblem } from "../types";


interface Props {
  selected:    SelectedProblem[];
  setSelected: React.Dispatch<React.SetStateAction<SelectedProblem[]>>;
}

const TYPE_INFO: Record<string, { label: string; color: string }> = {
  board_mcq:         { label: "বোর্ড MCQ",      color: "border-sky-400/30 bg-sky-400/10 text-sky-400" },
  admission_mcq:     { label: "ভর্তি MCQ",       color: "border-cyan-400/30 bg-cyan-400/10 text-cyan-400" },
  board_cq:          { label: "বোর্ড CQ",        color: "border-amber-400/30 bg-amber-400/10 text-amber-400" },
  board_written:     { label: "রচনামূলক",        color: "border-orange-400/30 bg-orange-400/10 text-orange-400" },
  admission_written: { label: "ভর্তি রচনামূলক", color: "border-rose-400/30 bg-rose-400/10 text-rose-400" },
  practice:          { label: "অনুশীলন",         color: "border-violet-400/30 bg-violet-400/10 text-violet-400" },
};

/* ── LaTeX field with edit/preview toggle (identical to problems page) ── */
function LaTeXField({ label, value, onChange, rows = 3, placeholder, isCorrect }: {
  label: string; value: string; onChange: (v: string) => void;
  rows?: number; placeholder?: string; isCorrect?: boolean;
}) {
  const [preview, setPreview] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!taRef.current) return;
    const ta = taRef.current;
    ta.style.height = "auto";
    ta.style.height = Math.max(ta.scrollHeight, rows * 24) + "px";
  }, [value, rows]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-xs font-mono ${isCorrect ? "text-violet-400" : "text-zinc-500"}`}>{label}</span>
        <button type="button" onClick={() => setPreview(p => !p)}
          className="flex items-center gap-1 text-xs text-zinc-600 hover:text-violet-400 transition-colors">
          {preview ? <><EyeOff className="w-3 h-3" /> Edit</> : <><Eye className="w-3 h-3" /> Preview</>}
        </button>
      </div>
      {preview ? (
        <div className={`min-h-[60px] rounded-xl px-4 py-3 text-sm leading-relaxed border ${
          isCorrect ? "border-emerald-400/30 bg-emerald-400/5 text-emerald-200" : "border-zinc-800 bg-zinc-950 text-zinc-300"
        }`}>
          {value.trim() ? <MathText text={value} /> : <span className="text-zinc-700 italic text-xs">empty</span>}
        </div>
      ) : (
        <textarea ref={taRef} value={value} onChange={e => onChange(e.target.value)}
          rows={rows} placeholder={placeholder}
          style={{ resize: "none", overflow: "hidden" }}
          className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500/50 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-700 outline-none transition-all font-mono min-h-[60px]"
        />
      )}
    </div>
  );
}

/* ── Inline edit panel ── */
function EditPanel({ problem, onClose, onSave }: {
  problem: SelectedProblem;
  onClose: () => void;
  onSave:  (updated: Partial<SelectedProblem>) => void;
}) {
  const isMcq  = problem.problem_type?.includes("mcq");
  const labels = isMcq ? ["A","B","C","D"] : ["ক","খ","গ","ঘ"];

  const [question,      setQuestion]      = useState(problem.question);
  const [options,       setOptions]       = useState({
    a: problem.option_a, b: problem.option_b, c: problem.option_c, d: problem.option_d,
  });
  const [correctAnswer, setCorrectAnswer] = useState(problem.correct_answer);
  const [explanation,   setExplanation]   = useState(problem.explanation ?? "");
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!question.trim()) { setError("প্রশ্ন খালি রাখা যাবে না"); return; }
    onSave({
      question:       question.trim(),
      option_a:       options.a, option_b: options.b,
      option_c:       options.c, option_d: options.d,
      correct_answer: correctAnswer,
      explanation:    explanation.trim() || null,
    });
    onClose();
  };

  return (
    <div className="border-t border-zinc-800 bg-zinc-950/60">
      {/* Edit header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <Pencil className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-mono text-violet-400 uppercase tracking-wider">Edit for PDF only</span>
          <span className="text-xs text-zinc-700 italic">ডেটাবেজে সংরক্ষিত হবে না</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-600 hover:text-zinc-400 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Question */}
        <LaTeXField label="QUESTION" value={question} onChange={setQuestion} rows={3}
          placeholder="LaTeX supported — $math$, $$display$$, \begin{tikzpicture}…\end{tikzpicture}" />

        {/* Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
              {isMcq ? "Options" : "Sub-questions ক খ গ ঘ"}
            </p>
            {isMcq && <p className="text-xs text-zinc-700">অক্ষরে ক্লিক করে সঠিক উত্তর বেছে নিন</p>}
          </div>
          <div className="space-y-3">
            {(["a","b","c","d"] as const).map((key, i) => (
              <div key={key} className="flex items-start gap-3">
                <button type="button"
                  onClick={() => isMcq && setCorrectAnswer(key)}
                  className={`mt-5 w-8 h-8 shrink-0 rounded-xl flex items-center justify-center text-sm font-bold font-mono transition-all ${
                    isMcq
                      ? correctAnswer === key
                        ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20 ring-2 ring-violet-500/40"
                        : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300 cursor-pointer"
                      : "bg-zinc-800/50 text-zinc-600 cursor-default"
                  }`}>
                  {labels[i]}
                </button>
                <div className="flex-1">
                  <LaTeXField
                    label={isMcq
                      ? `OPTION ${key.toUpperCase()}${correctAnswer === key ? " — ✓ correct" : ""}`
                      : `${labels[i]} sub-question`}
                    value={options[key]}
                    onChange={v => setOptions(o => ({ ...o, [key]: v }))}
                    rows={2}
                    isCorrect={isMcq && correctAnswer === key}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Explanation */}
        <LaTeXField label="EXPLANATION (optional)" value={explanation} onChange={setExplanation} rows={2}
          placeholder="ব্যাখ্যা / step-by-step solution…" />

        {error && (
          <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-2 rounded-xl">{error}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          <button onClick={onClose} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">বাতিল</button>
          <button onClick={handleSave}
            className="flex items-center gap-2 bg-violet-500 hover:bg-violet-400 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors">
            <Save className="w-3.5 h-3.5" /> প্রয়োগ করুন
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function SelectedQuestions({ selected, setSelected }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing,  setEditing]  = useState<string | null>(null);

  const move = (idx: number, dir: -1 | 1) => {
    const arr = [...selected];
    [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];
    setSelected(arr);
  };
  const remove      = (id: string) => setSelected(sel => sel.filter(s => s.id !== id));
  const updateMarks = (id: string, val: number) =>
    setSelected(sel => sel.map(s => s.id === id ? { ...s, customMarks: val } : s));
  const toggleAns   = (id: string) =>
    setSelected(sel => sel.map(s => s.id === id ? { ...s, showAnswer: !s.showAnswer } : s));
  const applyEdit   = (id: string, patch: Partial<SelectedProblem>) =>
    setSelected(sel => sel.map(s => s.id === id ? { ...s, ...patch } : s));
  const toggleCols  = (id: string) =>
    setSelected(sel => sel.map(s => s.id === id
      ? { ...s, optionCols: s.optionCols === "auto" ? "1" : s.optionCols === "1" ? "2" : "auto" }
      : s));

  if (selected.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
      <BookOpen className="w-12 h-12 mb-4 opacity-20" />
      <p className="text-sm font-medium text-zinc-500">কোনো প্রশ্ন নির্বাচিত নয়</p>
      <p className="text-xs mt-1 text-zinc-700">Browse ট্যাব থেকে প্রশ্ন বেছে নিন</p>
    </div>
  );

  const totalMarks = selected.reduce((sum, p) => sum + (p.customMarks ?? 1), 0);
  const cqCount    = selected.filter(p => !p.problem_type?.includes("mcq")).length;
  const mcqCount   = selected.length - cqCount;

  return (
    <div className="space-y-3">

      {/* Summary bar */}
      <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3.5">
        <div className="flex gap-6">
          <div>
            <p className="text-xs text-zinc-600">মোট প্রশ্ন</p>
            <p className="text-xl font-bold text-zinc-100 font-mono">{selected.length}</p>
          </div>
          {cqCount > 0 && (
            <div>
              <p className="text-xs text-zinc-600">CQ</p>
              <p className="text-xl font-bold text-amber-400 font-mono">{cqCount}</p>
            </div>
          )}
          {mcqCount > 0 && (
            <div>
              <p className="text-xs text-zinc-600">MCQ</p>
              <p className="text-xl font-bold text-sky-400 font-mono">{mcqCount}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-zinc-600">মোট নম্বর</p>
            <p className="text-xl font-bold text-violet-400 font-mono">{totalMarks}</p>
          </div>
        </div>
        <button onClick={() => setSelected([])}
          className="text-xs text-red-400 border border-red-400/20 px-3 py-1.5 rounded-lg hover:bg-red-400/10 transition-colors">
          সব মুছুন
        </button>
      </div>

      {/* Question list */}
      {selected.map((p, idx) => {
        const isOpen    = expanded === p.id;
        const isEditing = editing === p.id;
        const typeInfo  = TYPE_INFO[p.problem_type] ?? { label: p.problem_type, color: "border-zinc-700 bg-zinc-800 text-zinc-400" };
        const isMcq     = p.problem_type?.includes("mcq");

        return (
          <div key={p.id} className={`bg-zinc-900 border rounded-2xl overflow-hidden transition-all ${
            isEditing ? "border-violet-500/40 shadow-[0_0_0_1px_rgba(139,92,246,0.12)]" : "border-zinc-800"
          }`}>

            {/* Row */}
            <div className="flex items-center gap-2 px-3 py-2.5">

              {/* Number */}
              <span className="flex-shrink-0 w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-[11px] font-mono font-bold text-zinc-600">
                {idx + 1}
              </span>

              <GripVertical className="w-4 h-4 text-zinc-800 flex-shrink-0" />

              {/* Type badge */}
              <span className={`hidden sm:inline-flex flex-shrink-0 text-[11px] border rounded-full px-2 py-0.5 font-medium ${typeInfo.color}`}>
                {typeInfo.label}
              </span>

              {/* Question preview — click to expand */}
              <div className="flex-1 min-w-0 cursor-pointer text-sm text-zinc-300 line-clamp-1"
                onClick={() => { setExpanded(isOpen ? null : p.id); setEditing(null); }}>
                <MathText text={safeTruncate(p.question, 140)} />
              </div>

              {/* Marks */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <input type="number" min={0} step={0.5} value={p.customMarks ?? 1}
                  onChange={e => updateMarks(p.id, parseFloat(e.target.value) || 0)}
                  className="w-12 px-1.5 py-1 text-xs text-center bg-zinc-950 border border-zinc-800 focus:border-violet-500/50 rounded-lg outline-none font-mono" />
                <span className="text-[11px] text-zinc-700">নম্বর</span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Reorder group */}
                <div className="flex items-center bg-zinc-800/60 rounded-lg overflow-hidden border border-zinc-800">
                  <button onClick={() => idx > 0 && move(idx, -1)} disabled={idx === 0}
                    className="p-1.5 hover:bg-zinc-700 disabled:opacity-20 transition-colors border-r border-zinc-700/50">
                    <ArrowUp className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                  <button onClick={() => idx < selected.length - 1 && move(idx, 1)} disabled={idx === selected.length - 1}
                    className="p-1.5 hover:bg-zinc-700 disabled:opacity-20 transition-colors">
                    <ArrowDown className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                </div>

                {/* Edit */}
                <button onClick={() => { setEditing(isEditing ? null : p.id); setExpanded(null); }}
                  className={`p-1.5 rounded-lg transition-all ${
                    isEditing
                      ? "bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/30"
                      : "hover:bg-zinc-800 text-zinc-600 hover:text-violet-400"
                  }`}>
                  <Pencil className="w-3.5 h-3.5" />
                </button>

                {/* Expand */}
                <button onClick={() => { setExpanded(isOpen ? null : p.id); setEditing(null); }}
                  className={`p-1.5 rounded-lg transition-all ${
                    isOpen ? "bg-zinc-800 text-zinc-300" : "hover:bg-zinc-800 text-zinc-600"
                  }`}>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Delete — separated with a gap */}
                <div className="w-px h-5 bg-zinc-800 mx-0.5" />
                <button onClick={() => remove(p.id)}
                  className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors group">
                  <Trash2 className="w-3.5 h-3.5 text-zinc-700 group-hover:text-red-400 transition-colors" />
                </button>
              </div>
            </div>

            {/* Expanded preview */}
            {isOpen && !isEditing && (
              <div className="border-t border-zinc-800/60 px-4 py-4 space-y-3">
                <div className="text-sm text-zinc-200 leading-relaxed">
                  <MathText text={p.question} />
                </div>

                {/* MCQ options — inline with col toggle */}
                {isMcq && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-zinc-600">বিকল্পসমূহ</p>
                      <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-0.5">
                        {(["auto","1","2"] as const).map(c => (
                          <button key={c} type="button"
                            onClick={() => toggleCols(p.id)}
                            className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                              p.optionCols === c
                                ? "bg-violet-500 text-white"
                                : "text-zinc-500 hover:text-zinc-300"
                            }`}
                            title={c === "auto" ? "Auto detect columns" : `${c} column`}
                          >
                            {c === "auto" ? "Auto" : c === "1" ? "১ কলাম" : "২ কলাম"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className={p.optionCols === "1" ? "space-y-1.5" : "grid grid-cols-2 gap-1.5"}>
                      {(["a","b","c","d"] as const).map(opt => (
                        <div key={opt} className={`flex items-baseline gap-1.5 text-xs px-3 py-2 rounded-xl border ${
                          p.correct_answer === opt.toUpperCase()
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                            : "border-zinc-800 text-zinc-500"
                        }`}>
                          <span className="font-bold font-mono shrink-0">{opt.toUpperCase()}.</span>
                          <span className="leading-snug"><MathText text={(p as any)[`option_${opt}`]} /></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CQ sub-parts — inline */}
                {!isMcq && (p.option_a || p.option_b || p.option_c || p.option_d) && (
                  <div className="space-y-1.5">
                    {["ক","খ","গ","ঘ"].map((label, i) => {
                      const val = (p as any)[`option_${["a","b","c","d"][i]}`];
                      return val ? (
                        <div key={label} className="flex items-baseline gap-2 text-xs border border-zinc-800 rounded-xl px-3 py-2">
                          <span className="font-bold text-violet-400 shrink-0">{label}.</span>
                          <span className="text-zinc-300 leading-snug"><MathText text={val} /></span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                {p.explanation && (
                  <div className="text-xs text-zinc-600 bg-zinc-950/60 border border-zinc-800 px-3 py-2 rounded-xl">
                    <span className="font-semibold text-zinc-500 mr-1">ব্যাখ্যা:</span>
                    <MathText text={p.explanation} />
                  </div>
                )}

                {/* Show answer toggle */}
                <button type="button" onClick={() => toggleAns(p.id)}
                  className="flex items-center gap-3 select-none group mt-3 pt-3 border-t border-zinc-800/60 w-full">
                  <span style={{
                    position: "relative", display: "inline-flex", width: 40, height: 22,
                    borderRadius: 999, transition: "background 0.2s",
                    background: p.showAnswer ? "#8b5cf6" : "#3f3f46",
                    flexShrink: 0,
                  }}>
                    <span style={{
                      position: "absolute", top: 3, left: 3, width: 16, height: 16,
                      borderRadius: "50%", background: "white",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
                      transition: "transform 0.2s cubic-bezier(.4,0,.2,1)",
                      transform: p.showAnswer ? "translateX(18px)" : "translateX(0px)",
                    }} />
                  </span>
                  <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                    এই প্রশ্নের উত্তর PDF-এ দেখাও
                  </span>
                </button>
              </div>
            )}

            {/* Inline edit panel */}
            {isEditing && (
              <EditPanel
                problem={p}
                onClose={() => setEditing(null)}
                onSave={patch => applyEdit(p.id, patch)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
