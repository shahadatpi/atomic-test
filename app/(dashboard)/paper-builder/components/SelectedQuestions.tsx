"use client";

import { useState } from "react";
import { Trash2, ArrowUp, ArrowDown, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import MathText from "@/components/math/MathText";
import type { SelectedProblem } from "../page";

interface Props {
  selected: SelectedProblem[];
  setSelected: React.Dispatch<React.SetStateAction<SelectedProblem[]>>;
}

export default function SelectedQuestions({ selected, setSelected }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const move = (idx: number, dir: -1 | 1) => {
    const arr = [...selected];
    const tmp = arr[idx];
    arr[idx]       = arr[idx + dir];
    arr[idx + dir] = tmp;
    setSelected(arr);
  };

  const remove = (id: string) =>
    setSelected(sel => sel.filter(s => s.id !== id));

  const updateMarks = (id: string, val: number) =>
    setSelected(sel => sel.map(s => s.id === id ? { ...s, customMarks: val } : s));

  const toggleAnswer = (id: string) =>
    setSelected(sel => sel.map(s => s.id === id ? { ...s, showAnswer: !s.showAnswer } : s));

  const clearAll = () => setSelected([]);

  if (selected.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <span className="text-5xl mb-4">📋</span>
      <p className="text-sm">কোনো প্রশ্ন নির্বাচিত নয়</p>
      <p className="text-xs mt-1">Browse ট্যাব থেকে প্রশ্ন বেছে নিন</p>
    </div>
  );

  const totalMarks = selected.reduce((sum, p) => sum + (p.customMarks ?? 1), 0);

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
        <div className="flex gap-6">
          <div>
            <p className="text-xs text-muted-foreground">মোট প্রশ্ন</p>
            <p className="text-lg font-bold text-foreground">{selected.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">মোট নম্বর</p>
            <p className="text-lg font-bold text-violet-400">{totalMarks}</p>
          </div>
        </div>
        <button
          onClick={clearAll}
          className="text-xs text-red-400 border border-red-400/30 px-3 py-1.5 rounded-lg hover:bg-red-400/10 transition-colors"
        >
          সব মুছুন
        </button>
      </div>

      {/* Question list */}
      {selected.map((p, idx) => (
        <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Row header */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50">
            <span className="text-xs font-mono text-muted-foreground w-6 text-center">{idx + 1}</span>
            <GripVertical className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />

            {/* Question preview */}
            <div
              className="flex-1 text-sm text-foreground truncate cursor-pointer"
              onClick={() => setExpanded(expanded === p.id ? null : p.id)}
            >
              <MathText text={p.question.slice(0, 120)} />
            </div>

            {/* Marks input */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <input
                type="number"
                min={0}
                step={0.25}
                value={p.customMarks ?? 1}
                onChange={e => updateMarks(p.id, parseFloat(e.target.value) || 0)}
                className="w-14 px-2 py-1 text-xs text-center bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <span className="text-xs text-muted-foreground">নম্বর</span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => idx > 0 && move(idx, -1)} disabled={idx === 0}
                className="p-1 hover:bg-accent/50 rounded disabled:opacity-30 transition-colors">
                <ArrowUp className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button onClick={() => idx < selected.length - 1 && move(idx, 1)} disabled={idx === selected.length - 1}
                className="p-1 hover:bg-accent/50 rounded disabled:opacity-30 transition-colors">
                <ArrowDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                className="p-1 hover:bg-accent/50 rounded transition-colors">
                {expanded === p.id
                  ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                  : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
              <button onClick={() => remove(p.id)}
                className="p-1 hover:bg-red-400/10 rounded transition-colors">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          </div>

          {/* Expanded view */}
          {expanded === p.id && (
            <div className="p-4 space-y-3">
              <div className="text-sm text-foreground">
                <MathText text={p.question} />
              </div>
              {(p.problem_type?.includes("mcq") ?? false) && (
                <div className="grid grid-cols-1 gap-2">
                  {["a","b","c","d"].map(opt => (
                    <div key={opt} className={`text-xs p-2 rounded-lg border ${
                      p.correct_answer === opt.toUpperCase()
                        ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
                        : "border-border text-muted-foreground"
                    }`}>
                      <span className="font-bold mr-1">{opt.toUpperCase()}.</span>
                      <MathText text={(p as any)[`option_${opt}`]} />
                    </div>
                  ))}
                </div>
              )}
              {p.explanation && (
                <div className="text-xs text-muted-foreground bg-background/50 p-2 rounded-lg border border-border">
                  <span className="font-semibold text-foreground">ব্যাখ্যা: </span>
                  <MathText text={p.explanation} />
                </div>
              )}

              {/* Per-question show answer toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => toggleAnswer(p.id)}
                  className={`w-8 h-4 rounded-full transition-colors ${p.showAnswer ? "bg-violet-500" : "bg-muted"}`}
                >
                  <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${p.showAnswer ? "translate-x-4 ml-0.5" : "translate-x-0.5"}`} />
                </div>
                <span className="text-xs text-muted-foreground">এই প্রশ্নের উত্তর দেখাও</span>
              </label>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
