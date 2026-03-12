"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  FileText, Search, Loader2, CheckSquare, Eye, EyeOff, ChevronDown,
  Trash2, ArrowUp, ArrowDown, Pencil, X, Save, CheckCircle,
  BookOpen, AlertTriangle, Download, RefreshCw, Code, Bug
} from "lucide-react";
import MathText from "@/components/math/MathText";
import PaperFormatPanel, { PaperFormat, DEFAULT_FORMAT } from "./components/PaperFormatPanel";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface Problem {
  id:             string;
  question:       string;
  option_a:       string;
  option_b:       string;
  option_c:       string;
  option_d:       string;
  correct_answer: string;
  explanation:    string | null;
  difficulty:     string;
  marks:          number | null;
  problem_type:   string;
  subjects:       { name: string };
  topics:         { name: string };
  subtopics:      { name: string } | null;
}

export interface SelectedProblem extends Problem {
  customMarks: number;
  showAnswer:  boolean;
}

interface Subject { id: string; name: string; }
interface Topic   { id: string; name: string; subject_id: string; }

const DIFFICULTY_COLORS: Record<string, string> = {
  easy:   "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  medium: "text-amber-400   border-amber-400/30   bg-amber-400/10",
  hard:   "text-red-400     border-red-400/30     bg-red-400/10",
};

const TYPE_COLORS: Record<string, string> = {
  board_mcq:         "border-sky-400/40 bg-sky-400/10 text-sky-400",
  admission_mcq:     "border-violet-400/40 bg-violet-400/10 text-violet-400",
  board_cq:          "border-emerald-400/40 bg-emerald-400/10 text-emerald-400",
  board_written:     "border-teal-400/40 bg-teal-400/10 text-teal-400",
  admission_written: "border-amber-400/40 bg-amber-400/10 text-amber-400",
  practice:          "border-zinc-400/40 bg-zinc-400/10 text-zinc-400",
};

const TYPE_LABELS: Record<string, string> = {
  board_mcq: "Board MCQ", admission_mcq: "Admission MCQ",
  board_cq: "Board CQ", board_written: "Board Written",
  admission_written: "Adm. Written", practice: "Practice",
};

type Tab = "browse" | "selected" | "format";

/* ─── LaTeX field with preview toggle ───────────────────────────────────── */
function LaTeXField({
  label, value, onChange, rows = 3, placeholder, isCorrect, autoGrow = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  rows?: number; placeholder?: string; isCorrect?: boolean; autoGrow?: boolean;
}) {
  const [preview, setPreview] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!autoGrow || !taRef.current) return;
    const ta = taRef.current;
    ta.style.height = "auto";
    ta.style.height = Math.max(ta.scrollHeight, rows * 24) + "px";
  }, [value, autoGrow, rows]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-xs font-mono ${isCorrect ? "text-violet-400" : "text-muted-foreground"}`}>{label}</span>
        <button type="button" onClick={() => setPreview(p => !p)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-violet-400 transition-colors">
          {preview ? <><EyeOff className="w-3 h-3" /> Edit</> : <><Eye className="w-3 h-3" /> Preview</>}
        </button>
      </div>
      {preview ? (
        <div className={`min-h-[80px] rounded-xl px-4 py-3 text-sm leading-relaxed border ${
          isCorrect ? "border-emerald-400/30 bg-emerald-400/5 text-emerald-300" : "border-border bg-background text-foreground"
        }`}>
          {value.trim() ? <MathText text={value} /> : <span className="text-muted-foreground/40 italic text-xs">empty</span>}
        </div>
      ) : (
        <textarea ref={taRef} value={value} onChange={e => onChange(e.target.value)}
          rows={rows} placeholder={placeholder}
          style={autoGrow ? { resize: "none", overflow: "hidden" } : { minHeight: `${rows * 24}px` }}
          className="w-full bg-background border border-border focus:border-violet-500/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all font-mono resize-y"
        />
      )}
    </div>
  );
}

/* ─── Full edit modal — local only, no DB write ──────────────────────────── */
function EditSelectedModal({
  problem, onSave, onClose,
}: {
  problem: SelectedProblem;
  onSave: (updated: SelectedProblem) => void;
  onClose: () => void;
}) {
  const isMCQ = problem.problem_type?.includes("mcq");
  const isCQ  = problem.problem_type === "board_cq";

  const [question,  setQuestion]  = useState(problem.question);
  const [options,   setOptions]   = useState({
    a: problem.option_a ?? "", b: problem.option_b ?? "",
    c: problem.option_c ?? "", d: problem.option_d ?? "",
  });
  const [correct,   setCorrect]   = useState(problem.correct_answer ?? "a");
  const [explanation, setExpl]    = useState(problem.explanation ?? "");
  const [difficulty,  setDiff]    = useState(problem.difficulty ?? "medium");
  const [marks,       setMarks]   = useState(problem.customMarks);
  const [showAns,     setShowAns] = useState(problem.showAnswer);
  const [error,       setError]   = useState("");

  const handleSave = () => {
    if (!question.trim()) { setError("প্রশ্ন খালি রাখা যাবে না"); return; }
    if (isMCQ && (!options.a.trim() || !options.b.trim() || !options.c.trim() || !options.d.trim())) {
      setError("চারটি অপশন পূরণ করুন"); return;
    }
    onSave({
      ...problem,
      question: question.trim(),
      option_a: options.a, option_b: options.b,
      option_c: options.c, option_d: options.d,
      correct_answer: correct,
      explanation: explanation.trim() || null,
      difficulty,
      customMarks: marks,
      showAnswer: showAns,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[95vh] h-[95vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <p className="text-xs text-violet-400 font-mono tracking-widest">প্রশ্ন সম্পাদনা — LOCAL ONLY</p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate max-w-md">{problem.id}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* Question */}
          <LaTeXField label="QUESTION" value={question} onChange={setQuestion}
            rows={isMCQ ? 4 : 8}
            placeholder="LaTeX supported — $math$, $$display$$, \begin{tikzpicture}...\end{tikzpicture}" />

          {/* MCQ options */}
          {isMCQ && (
            <div className="space-y-1">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Options</p>
                <p className="text-xs text-amber-400/70">Click letter to set correct answer</p>
              </div>
              <div className="space-y-4">
                {(["a","b","c","d"] as const).map(key => (
                  <div key={key} className="flex items-start gap-3">
                    <button type="button" onClick={() => setCorrect(key)}
                      className={`mt-6 w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-sm font-bold font-mono transition-all ${
                        correct === key
                          ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20 ring-2 ring-violet-500/40"
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}>{key.toUpperCase()}</button>
                    <div className="flex-1">
                      <LaTeXField
                        label={`OPTION ${key.toUpperCase()}${correct === key ? " — ✓ correct" : ""}`}
                        value={options[key]} onChange={v => setOptions(o => ({ ...o, [key]: v }))}
                        rows={2} placeholder={`Option ${key.toUpperCase()}`}
                        isCorrect={correct === key}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CQ ক খ গ ঘ */}
          {isCQ && (
            <div className="space-y-1">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">সৃজনশীল প্রশ্ন</p>
                <span className="text-xs text-emerald-400/70">ক · খ · গ · ঘ</span>
              </div>
              <div className="space-y-4">
                {([
                  { key: "a" as const, label: "ক", mark: "১" },
                  { key: "b" as const, label: "খ", mark: "২" },
                  { key: "c" as const, label: "গ", mark: "৩" },
                  { key: "d" as const, label: "ঘ", mark: "৪" },
                ]).map(({ key, label, mark }) => (
                  <div key={key} className="flex items-start gap-3">
                    <div className="mt-6 w-8 h-8 shrink-0 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-emerald-400">{label}</span>
                    </div>
                    <div className="flex-1">
                      <LaTeXField label={label} value={options[key]}
                        onChange={v => setOptions(o => ({ ...o, [key]: v }))}
                        rows={3} placeholder={`${label} — LaTeX সাপোর্টেড`} />
                    </div>
                    <span className="mt-6 text-xs font-mono text-muted-foreground pt-2">{mark} নম্বর</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation */}
          <LaTeXField label="EXPLANATION (optional)" value={explanation} onChange={setExpl}
            rows={isMCQ ? 6 : 4} autoGrow
            placeholder="Step-by-step solution..." />

          {/* Marks + Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">নম্বর (প্রশ্নপত্রে)</p>
              <div className="flex items-center gap-2 flex-wrap">
                {[1,2,3,4,5,10].map(n => (
                  <button key={n} onClick={() => setMarks(n)}
                    className={`w-9 h-9 rounded-lg text-sm font-semibold border transition-all ${marks === n ? "bg-violet-500 border-violet-500 text-white" : "border-border text-muted-foreground hover:bg-accent/50"}`}>{n}</button>
                ))}
                <input type="number" min={0} step={0.5} value={marks}
                  onChange={e => setMarks(parseFloat(e.target.value) || 0)}
                  className="w-14 px-2 py-1.5 text-sm text-center bg-background border border-border rounded-lg focus:outline-none focus:border-violet-500/50" />
              </div>
            </div>
            <div>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">কঠিনতা</p>
              <div className="flex gap-2">
                {(["easy","medium","hard"] as const).map(d => (
                  <button key={d} onClick={() => setDiff(d)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-semibold capitalize transition-all ${
                      difficulty === d
                        ? d === "easy"   ? "border-emerald-400 bg-emerald-400/10 text-emerald-400"
                        : d === "medium" ? "border-amber-400 bg-amber-400/10 text-amber-400"
                        :                  "border-red-400 bg-red-400/10 text-red-400"
                        : "border-border text-muted-foreground hover:border-muted-foreground"
                    }`}>{d}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Show answer for MCQ */}
          {isMCQ && (
            <div>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">উত্তর দেখানো</p>
              <button onClick={() => setShowAns(v => !v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all ${
                  showAns ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-400" : "border-border text-muted-foreground hover:bg-accent/50"
                }`}>
                {showAns ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                {showAns ? "উত্তর দেখাবে" : "উত্তর লুকানো"}
              </button>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-4 py-3 rounded-xl">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card/80 shrink-0">
          <div className="flex items-center gap-2 text-xs text-amber-400/80">
            <AlertTriangle className="w-3.5 h-3.5" />
            পরিবর্তন শুধু এই প্রশ্নপত্রে প্রযোজ্য — ডেটাবেজে সংরক্ষণ হবে না
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="px-4 py-2 text-sm border border-border rounded-xl text-muted-foreground hover:bg-accent/50 transition-colors">
              বাতিল
            </button>
            <button onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors">
              <Save className="w-4 h-4" /> প্রয়োগ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Confirm render dialog ──────────────────────────────────────────────── */
function ConfirmRenderDialog({
  selected, format, onConfirm, onClose,
}: {
  selected: SelectedProblem[];
  format: PaperFormat;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const cqCount  = selected.filter(p => !p.problem_type?.includes("mcq")).length;
  const mcqCount = selected.filter(p =>  p.problem_type?.includes("mcq")).length;
  const totalMarks = selected.reduce((s, p) => s + (p.customMarks ?? 1), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl">
        <div className="p-5 border-b border-border">
          <p className="text-sm font-semibold">প্রশ্নপত্র তৈরি করবেন?</p>
          <p className="text-xs text-muted-foreground mt-1">XeLaTeX দিয়ে PDF কম্পাইল হবে — ৩০ সেকেন্ড পর্যন্ত লাগতে পারে।</p>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "পরীক্ষার নাম", val: format.examTitle || "—" },
              { label: "বিষয়",         val: format.subject   || "—" },
              { label: "সময়",          val: format.time      || "—" },
              { label: "পূর্ণমান",     val: format.fullMarks || String(totalMarks) },
            ].map(({ label, val }) => (
              <div key={label} className="bg-background border border-border rounded-xl px-3 py-2">
                <p className="text-[10px] text-muted-foreground font-mono">{label}</p>
                <p className="text-sm font-medium text-foreground mt-0.5 truncate">{val}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 px-3 py-2 bg-background border border-border rounded-xl">
            <div className="text-center flex-1">
              <p className="text-lg font-bold text-emerald-400">{cqCount}</p>
              <p className="text-[10px] text-muted-foreground">CQ প্রশ্ন</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center flex-1">
              <p className="text-lg font-bold text-sky-400">{mcqCount}</p>
              <p className="text-[10px] text-muted-foreground">MCQ প্রশ্ন</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center flex-1">
              <p className="text-lg font-bold text-violet-400">{totalMarks}</p>
              <p className="text-[10px] text-muted-foreground">মোট নম্বর</p>
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2 text-sm border border-border rounded-xl text-muted-foreground hover:bg-accent/50 transition-colors">
            বাতিল
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors">
            তৈরি করুন →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── PDF Preview fullscreen ─────────────────────────────────────────────── */
function PaperPreview({
  selected, format, onClose,
}: {
  selected: SelectedProblem[];
  format: PaperFormat;
  onClose: () => void;
}) {
  const [status,   setStatus]   = useState<"loading"|"ready"|"error">("loading");
  const [pdfUrl,   setPdfUrl]   = useState<string | null>(null);
  const [error,    setError]    = useState("");
  const [slow,     setSlow]     = useState(false);
  const [sideTab,  setSideTab]  = useState<"none"|"latex"|"debug">("none");
  const [sideText, setSideText] = useState("");
  const blobRef = useRef<Blob | null>(null);

  const body = () => JSON.stringify({ problems: selected, format });

  const generate = async () => {
    setStatus("loading"); setError(""); setSlow(false); setSideTab("none");
    if (pdfUrl) { URL.revokeObjectURL(pdfUrl); setPdfUrl(null); }
    const t = setTimeout(() => setSlow(true), 8000);
    try {
      const res = await fetch("/api/generate-paper", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: body(), signal: AbortSignal.timeout(180_000),
      });
      clearTimeout(t); setSlow(false);
      if (!res.ok) { setError(await res.text()); setStatus("error"); return; }
      const blob = await res.blob();
      blobRef.current = blob;
      setPdfUrl(URL.createObjectURL(blob));
      setStatus("ready");
    } catch (e) { clearTimeout(t); setSlow(false); setError(String(e)); setStatus("error"); }
  };

  const openSide = async (tab: "latex"|"debug") => {
    if (sideTab === tab) { setSideTab("none"); return; }
    setSideTab(tab); setSideText("লোড হচ্ছে…");
    try {
      const res = await fetch(`/api/generate-paper?${tab === "latex" ? "latex=1" : "debug=1"}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: body(),
      });
      const text = await res.text();
      setSideText(tab === "debug" ? JSON.stringify(JSON.parse(text), null, 2) : text);
    } catch (e) { setSideText(String(e)); }
  };

  const download = () => {
    if (!blobRef.current) return;
    const url = URL.createObjectURL(blobRef.current);
    const a = document.createElement("a");
    a.href = url; a.download = `${format.examTitle || "question-paper"}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => { generate(); }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
          <div>
            <p className="text-sm font-semibold">{format.examTitle || "প্রশ্নপত্র"}</p>
            <p className="text-xs text-muted-foreground">
              {selected.length} প্রশ্ন · {format.subject} · {format.time}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => openSide("debug")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg transition-colors ${sideTab === "debug" ? "border-amber-400/50 text-amber-400 bg-amber-400/10" : "border-border text-muted-foreground hover:bg-accent/50"}`}>
            <Bug className="w-3.5 h-3.5" /> ডিবাগ
          </button>
          <button onClick={() => openSide("latex")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg transition-colors ${sideTab === "latex" ? "border-emerald-400/50 text-emerald-400 bg-emerald-400/10" : "border-border text-muted-foreground hover:bg-accent/50"}`}>
            <Code className="w-3.5 h-3.5" /> LaTeX
          </button>
          {status === "error" && (
            <button onClick={generate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent/50 text-muted-foreground">
              <RefreshCw className="w-3.5 h-3.5" /> আবার চেষ্টা
            </button>
          )}
          <button onClick={download} disabled={status !== "ready"}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors">
            <Download className="w-4 h-4" /> ডাউনলোড
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 relative overflow-hidden">
          {status === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-violet-400 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{slow ? "XeLaTeX কম্পাইল হচ্ছে…" : "প্রশ্নপত্র তৈরি হচ্ছে…"}</p>
                <p className="text-xs text-muted-foreground mt-1">{slow ? "একটু অপেক্ষা করুন" : `${selected.length}টি প্রশ্ন`}</p>
              </div>
            </div>
          )}
          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 overflow-auto">
              <div className="w-full max-w-2xl space-y-4">
                <div className="flex items-center gap-3 text-red-400">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p className="font-medium">PDF তৈরি করতে সমস্যা হয়েছে</p>
                </div>
                <pre className="bg-card border border-red-400/20 rounded-xl p-4 text-xs text-muted-foreground whitespace-pre-wrap overflow-x-auto max-h-72 font-mono">
                  {error}
                </pre>
                <p className="text-xs text-muted-foreground">→ "ডিবাগ" বাটনে ক্লিক করুন</p>
              </div>
            </div>
          )}
          {status === "ready" && pdfUrl && (
            <iframe src={`${pdfUrl}#toolbar=1&view=FitH`} className="w-full h-full border-0" title="PDF" />
          )}
        </div>
        {sideTab !== "none" && (
          <div className="w-[480px] shrink-0 border-l border-border bg-zinc-950 overflow-auto">
            <div className="sticky top-0 bg-zinc-900 border-b border-border px-3 py-2 flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">
                {sideTab === "debug" ? "Server receives (JSON)" : "Generated LaTeX"}
              </span>
              <button onClick={() => setSideTab("none")} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-emerald-300 whitespace-pre leading-relaxed overflow-x-auto">
              {sideText}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function Page() {
  const [problems,    setProblems]    = useState<Problem[]>([]);
  const [subjects,    setSubjects]    = useState<Subject[]>([]);
  const [topics,      setTopics]      = useState<Topic[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editTarget,  setEditTarget]  = useState<SelectedProblem | null>(null);

  const [search,      setSearch]      = useState("");
  const [filterSubj,  setFilterSubj]  = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [filterDiff,  setFilterDiff]  = useState("");
  const [filterType,  setFilterType]  = useState("");
  const [page,        setPage]        = useState(1);

  const [selected, setSelected] = useState<SelectedProblem[]>([]);
  const [tab,      setTab]      = useState<Tab>("browse");
  const [format,   setFormat]   = useState<PaperFormat>(DEFAULT_FORMAT);

  // Expanded cards in selected tab
  const [expandedSel, setExpandedSel] = useState<string | null>(null);
  // Expanded cards in browse tab
  const [expandedBrowse, setExpandedBrowse] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: probs }, { data: subjs }, { data: tops }] = await Promise.all([
        supabase.from("problems")
          .select(`id, question, option_a, option_b, option_c, option_d,
                   correct_answer, explanation, difficulty, marks,
                   problem_type, subjects(name), topics(name), subtopics(name)`)
          .order("created_at", { ascending: false }).limit(500),
        supabase.from("subjects").select("id, name").order("sort_order"),
        supabase.from("topics").select("id, name, subject_id").order("sort_order"),
      ]);
      setProblems((probs as any[]) ?? []);
      setSubjects(subjs ?? []);
      setTopics(tops ?? []);
      setLoading(false);
    })();
  }, []);

  const PAGE_SIZE = 20;
  const filtered = problems.filter(p => {
    if (search      && !p.question.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSubj  && p.subjects?.name !== filterSubj)  return false;
    if (filterTopic && p.topics?.name   !== filterTopic)  return false;
    if (filterDiff  && p.difficulty     !== filterDiff)   return false;
    if (filterType  && p.problem_type   !== filterType)   return false;
    return true;
  });
  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const filtTopics  = filterSubj
    ? topics.filter(t => subjects.find(s => s.name === filterSubj && s.id === t.subject_id))
    : topics;

  const isSelected   = (id: string) => selected.some(s => s.id === id);
  const toggleSelect = (p: Problem) => {
    if (isSelected(p.id)) setSelected(sel => sel.filter(s => s.id !== p.id));
    else setSelected(sel => [...sel, { ...p, customMarks: p.marks ?? 1, showAnswer: false }]);
  };
  const move = (idx: number, dir: -1 | 1) => {
    const arr = [...selected]; const tmp = arr[idx];
    arr[idx] = arr[idx + dir]; arr[idx + dir] = tmp; setSelected(arr);
  };
  const clearFilters = () => { setSearch(""); setFilterSubj(""); setFilterTopic(""); setFilterDiff(""); setFilterType(""); setPage(1); };

  const totalMarks = selected.reduce((s, p) => s + (p.customMarks ?? 1), 0);

  return (
    <>
      {showPreview && (
        <PaperPreview selected={selected} format={format} onClose={() => setShowPreview(false)} />
      )}
      {showConfirm && (
        <ConfirmRenderDialog
          selected={selected} format={format}
          onConfirm={() => { setShowConfirm(false); setShowPreview(true); }}
          onClose={() => setShowConfirm(false)}
        />
      )}
      {editTarget && (
        <EditSelectedModal
          problem={editTarget}
          onSave={updated => setSelected(sel => sel.map(s => s.id === updated.id ? updated : s))}
          onClose={() => setEditTarget(null)}
        />
      )}

      <div className="min-h-screen bg-background text-foreground">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <FileText className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground">প্রশ্নপত্র তৈরি</h1>
                <p className="text-xs text-muted-foreground">Question Paper Builder</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selected.length > 0 && (
                <span className="text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-full px-3 py-1">
                  {selected.length} প্রশ্ন
                </span>
              )}
              <button
                onClick={() => setShowConfirm(true)}
                disabled={selected.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
              >
                <Eye className="w-4 h-4" /> প্রিভিউ ও তৈরি করুন
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="max-w-5xl mx-auto mt-3 flex gap-1">
            {(["browse", "selected", "format"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                  tab === t
                    ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                {t === "browse"   ? "প্রশ্ন খুঁজুন" :
                 t === "selected" ? `নির্বাচিত (${selected.length})` :
                 "ফরম্যাট ও টেমপ্লেট"}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto p-4">

          {/* ── BROWSE ── */}
          {tab === "browse" && (
            <div className="space-y-3">
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                      placeholder="প্রশ্ন খুঁজুন…"
                      className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" />
                  </div>
                  <button onClick={() => {
                    const toAdd = filtered.filter(p => !isSelected(p.id));
                    setSelected(sel => [...sel, ...toAdd.map(p => ({ ...p, customMarks: p.marks ?? 1, showAnswer: false }))]);
                  }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs border border-border rounded-lg hover:bg-accent/50 transition-colors text-muted-foreground">
                    <CheckSquare className="w-3.5 h-3.5" /> সব নির্বাচন
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { val: filterSubj,  opts: subjects.map(s => s.name), onChange: (v: string) => { setFilterSubj(v); setFilterTopic(""); setPage(1); }, placeholder: "সব বিষয়" },
                    { val: filterTopic, opts: filtTopics.map(t => t.name), onChange: (v: string) => { setFilterTopic(v); setPage(1); }, placeholder: "সব অধ্যায়" },
                  ].map(({ val, opts, onChange, placeholder }) => (
                    <select key={placeholder} value={val} onChange={e => onChange(e.target.value)}
                      className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-violet-500">
                      <option value="">{placeholder}</option>
                      {opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ))}
                  <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
                    className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-violet-500">
                    <option value="">সব ধরন</option>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <select value={filterDiff} onChange={e => { setFilterDiff(e.target.value); setPage(1); }}
                    className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-violet-500">
                    <option value="">সব কঠিনতা</option>
                    <option value="easy">সহজ</option>
                    <option value="medium">মাঝারি</option>
                    <option value="hard">কঠিন</option>
                  </select>
                  {(filterSubj || filterTopic || filterDiff || filterType || search) && (
                    <button onClick={clearFilters}
                      className="px-3 py-1.5 text-xs text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-colors">
                      ফিল্টার মুছুন
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{filtered.length} প্রশ্ন</p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                </div>
              ) : (
                <div className="space-y-2">
                  {paginated.map((p, idx) => {
                    const globalIdx = (page - 1) * PAGE_SIZE + idx;
                    const sel = isSelected(p.id);
                    const isCQ = p.problem_type === "board_cq";
                    const isExpanded = expandedBrowse === p.id;
                    return (
                      <div key={p.id}
                        className={`bg-card border rounded-xl overflow-hidden transition-all ${sel ? "border-violet-500/50 bg-violet-500/5" : "border-border"}`}>
                        <div className="flex items-start gap-3 px-4 py-3 cursor-pointer"
                          onClick={() => toggleSelect(p)}>
                          <div className={`mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${sel ? "bg-violet-500 border-violet-500" : "border-border"}`}>
                            {sel && <span className="text-white text-xs font-bold">✓</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                              {p.subjects?.name && <span className="text-xs text-muted-foreground">{p.subjects.name}</span>}
                              {p.topics?.name && <><span className="text-muted-foreground/40 text-xs">·</span><span className="text-xs text-muted-foreground">{p.topics.name}</span></>}
                              <span className={`text-xs border rounded-full px-2 py-0.5 ${TYPE_COLORS[p.problem_type] ?? ""}`}>
                                {TYPE_LABELS[p.problem_type] ?? p.problem_type}
                              </span>
                              {p.difficulty && <span className={`text-xs border rounded-full px-2 py-0.5 ${DIFFICULTY_COLORS[p.difficulty] ?? ""}`}>{p.difficulty}</span>}
                            </div>
                            <div className="text-sm text-foreground line-clamp-2">
                              <MathText text={`${globalIdx + 1}. ${p.question.slice(0, 160)}`} />
                            </div>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); setExpandedBrowse(isExpanded ? null : p.id); }}
                            className="p-1 hover:bg-accent/50 rounded transition-colors shrink-0 mt-0.5">
                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-border px-4 py-3 space-y-2">
                            <div className="text-sm text-foreground leading-relaxed">
                              <MathText text={p.question} />
                            </div>
                            {p.problem_type?.includes("mcq") && (
                              <div className="grid grid-cols-2 gap-1.5">
                                {(["a","b","c","d"] as const).map(opt => (
                                  <div key={opt} className={`text-xs px-3 py-2 rounded-lg border ${p.correct_answer === opt ? "border-emerald-400/40 bg-emerald-400/5 text-emerald-300" : "border-border text-muted-foreground"}`}>
                                    <span className="font-bold mr-1">{opt.toUpperCase()}.</span>
                                    <MathText text={(p as any)[`option_${opt}`]} />
                                  </div>
                                ))}
                              </div>
                            )}
                            {isCQ && (
                              <div className="space-y-1">
                                {([["ক","option_a",1],["খ","option_b",2],["গ","option_c",3],["ঘ","option_d",4]] as const).map(([label, key, mark]) => {
                                  const text = (p as any)[key];
                                  if (!text) return null;
                                  return (
                                    <div key={label} className="flex items-baseline gap-2 py-1">
                                      <span className="text-sm font-semibold text-foreground w-4 shrink-0">{label}.</span>
                                      <div className="flex-1 text-sm text-foreground"><MathText text={text} /></div>
                                      <span className="text-xs text-muted-foreground shrink-0">{mark}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="px-3 py-1.5 text-xs border border-border rounded-lg disabled:opacity-30 hover:bg-accent/50 text-muted-foreground">← আগে</button>
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                          let pg = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                          return (
                            <button key={pg} onClick={() => setPage(pg)}
                              className={`w-8 h-8 text-xs rounded-lg border transition-colors ${page === pg ? "bg-violet-500/20 border-violet-500/50 text-violet-300" : "border-border text-muted-foreground hover:bg-accent/50"}`}>
                              {pg}
                            </button>
                          );
                        })}
                      </div>
                      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="px-3 py-1.5 text-xs border border-border rounded-lg disabled:opacity-30 hover:bg-accent/50 text-muted-foreground">পরে →</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── SELECTED ── */}
          {tab === "selected" && (
            <div className="space-y-3">
              {selected.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <BookOpen className="w-10 h-10 text-muted-foreground/20 mb-4" />
                  <p className="text-sm">কোনো প্রশ্ন নির্বাচিত নয়</p>
                  <p className="text-xs mt-1 text-muted-foreground/60">Browse ট্যাব থেকে প্রশ্ন বেছে নিন</p>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
                    <div className="flex gap-6">
                      <div>
                        <p className="text-xs text-muted-foreground">মোট প্রশ্ন</p>
                        <p className="text-lg font-bold">{selected.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">মোট নম্বর</p>
                        <p className="text-lg font-bold text-violet-400">{totalMarks}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelected([])}
                      className="text-xs text-red-400 border border-red-400/30 px-3 py-1.5 rounded-lg hover:bg-red-400/10 transition-colors">
                      সব মুছুন
                    </button>
                  </div>

                  {selected.map((p, idx) => {
                    const isCQ = p.problem_type === "board_cq";
                    const isExp = expandedSel === p.id;
                    return (
                      <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2.5">
                          <span className="text-xs font-mono text-muted-foreground w-5 text-center shrink-0">{idx + 1}</span>

                          {/* Question preview */}
                          <div className="flex-1 text-sm text-foreground truncate cursor-pointer min-w-0"
                            onClick={() => setExpandedSel(isExp ? null : p.id)}>
                            <MathText text={p.question.slice(0, 100)} />
                          </div>

                          {/* Type badge */}
                          <span className={`text-[10px] border rounded-full px-2 py-0.5 shrink-0 ${TYPE_COLORS[p.problem_type] ?? ""}`}>
                            {TYPE_LABELS[p.problem_type] ?? p.problem_type}
                          </span>

                          {/* Marks */}
                          <div className="flex items-center gap-1 shrink-0">
                            <input type="number" min={0} step={0.25} value={p.customMarks ?? 1}
                              onChange={e => setSelected(sel => sel.map(s => s.id === p.id ? { ...s, customMarks: parseFloat(e.target.value) || 0 } : s))}
                              className="w-12 px-1.5 py-1 text-xs text-center bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500" />
                            <span className="text-xs text-muted-foreground">নম্বর</span>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button onClick={() => idx > 0 && move(idx, -1)} disabled={idx === 0}
                              className="p-1 hover:bg-accent/50 rounded disabled:opacity-30 transition-colors">
                              <ArrowUp className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                            <button onClick={() => idx < selected.length - 1 && move(idx, 1)} disabled={idx === selected.length - 1}
                              className="p-1 hover:bg-accent/50 rounded disabled:opacity-30 transition-colors">
                              <ArrowDown className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                            <button onClick={() => setEditTarget(p)}
                              className="p-1 hover:bg-violet-400/10 rounded transition-colors" title="সম্পাদনা">
                              <Pencil className="w-3.5 h-3.5 text-muted-foreground hover:text-violet-400" />
                            </button>
                            <button onClick={() => setExpandedSel(isExp ? null : p.id)}
                              className="p-1 hover:bg-accent/50 rounded transition-colors">
                              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isExp ? "rotate-180" : ""}`} />
                            </button>
                            <button onClick={() => setSelected(sel => sel.filter(s => s.id !== p.id))}
                              className="p-1 hover:bg-red-400/10 rounded transition-colors">
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                        </div>

                        {isExp && (
                          <div className="border-t border-border px-4 py-3 space-y-2">
                            <div className="text-sm text-foreground leading-relaxed">
                              <MathText text={p.question} />
                            </div>
                            {p.problem_type?.includes("mcq") && (
                              <div className="grid grid-cols-2 gap-1.5">
                                {(["a","b","c","d"] as const).map(opt => (
                                  <div key={opt} className={`text-xs px-3 py-2 rounded-lg border ${p.correct_answer === opt ? "border-emerald-400/40 bg-emerald-400/5 text-emerald-300" : "border-border text-muted-foreground"}`}>
                                    <span className="font-bold mr-1">{opt.toUpperCase()}.</span>
                                    <MathText text={(p as any)[`option_${opt}`]} />
                                  </div>
                                ))}
                              </div>
                            )}
                            {isCQ && (
                              <div className="space-y-1">
                                {([["ক","option_a",1],["খ","option_b",2],["গ","option_c",3],["ঘ","option_d",4]] as const).map(([label, key, mark]) => {
                                  const text = (p as any)[key];
                                  if (!text) return null;
                                  return (
                                    <div key={label} className="flex items-baseline gap-2 py-1">
                                      <span className="text-sm font-semibold text-foreground w-4 shrink-0">{label}.</span>
                                      <div className="flex-1 text-sm text-foreground"><MathText text={text} /></div>
                                      <span className="text-xs text-muted-foreground shrink-0">{mark}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* ── FORMAT ── */}
          {tab === "format" && (
            <PaperFormatPanel
              format={format} setFormat={setFormat}
              totalQuestions={selected.length}
              totalMarks={totalMarks}
            />
          )}
        </div>
      </div>
    </>
  );
}
