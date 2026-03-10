"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import MathText, { stripTikz } from "@/components/math/MathText";
import {
  Search, ChevronDown, Loader2,
  BookOpen, CheckCircle, Trash2, Pencil, X, Save, Tag, Eye, EyeOff,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Problem {
  id:             string;
  question:       string;
  option_a:       string;
  option_b:       string;
  option_c:       string;
  option_d:       string;
  correct_answer: string;
  explanation:    string | null;
  difficulty:     string;
  is_free:        boolean;
  tags:           string[] | null;
  source:         string | null;
  created_at:     string;
  subtopic_id:    string | null;
  subjects:       { name: string };
  topics:         { name: string };
  subtopics:      { name: string } | null;
}

interface Subject  { id: string; name: string; }
interface Topic    { id: string; name: string; subject_id: string; }
interface Subtopic { id: string; name: string; topic_id: string; }

const INSTITUTES = [
  { key: "DU",     label: "DU",     color: "violet" },
  { key: "BUET",   label: "BUET",   color: "sky"    },
  { key: "CUET",   label: "CUET",   color: "amber"  },
  { key: "RUET",   label: "RUET",   color: "emerald"},
  { key: "KUET",   label: "KUET",   color: "rose"   },
  { key: "SUST",   label: "SUST",   color: "indigo" },
  { key: "CKRUET", label: "CKRUET", color: "teal"   },
  { key: "Medical",label: "Medical",color: "pink"   },
  { key: "Board",  label: "Board",  color: "orange" },
  { key: "DB",     label: "DB",     color: "cyan"   },
];

const INST_COLORS: Record<string, string> = {
  violet:  "border-violet-400  bg-violet-400/10  text-violet-300",
  sky:     "border-sky-400     bg-sky-400/10     text-sky-300",
  amber:   "border-amber-400   bg-amber-400/10   text-amber-300",
  emerald: "border-emerald-400 bg-emerald-400/10 text-emerald-300",
  rose:    "border-rose-400    bg-rose-400/10    text-rose-300",
  indigo:  "border-indigo-400  bg-indigo-400/10  text-indigo-300",
  teal:    "border-teal-400    bg-teal-400/10    text-teal-300",
  pink:    "border-pink-400    bg-pink-400/10    text-pink-300",
  orange:  "border-orange-400  bg-orange-400/10  text-orange-300",
  cyan:    "border-cyan-400    bg-cyan-400/10    text-cyan-300",
};

// Generate academic years: current-4 to current+1
function getYears(): string[] {
  const y = new Date().getFullYear();
  return Array.from({ length: 30 }, (_, i) => {
    const start = y - 5 + i;
    return `${start}-${String(start + 1).slice(-2)}`;
  }).reverse();
}
const YEARS = getYears();

// Parse / build "INST: YEAR" tag format
function parseInstTag(tag: string): { inst: string; year: string } | null {
  const m = tag.match(/^([^:]+):\s*(.+)$/);
  return m ? { inst: m[1].trim(), year: m[2].trim() } : null;
}

/* ─────────────────────── LaTeX field with preview toggle ───────────────── */

function LaTeXField({
  label, value, onChange, rows = 3, placeholder, isCorrect, autoGrow = false,
}: {
  label:       string;
  value:       string;
  onChange:    (v: string) => void;
  rows?:       number;
  placeholder?: string;
  isCorrect?:  boolean;
  autoGrow?:   boolean;
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
        <button
          type="button"
          onClick={() => setPreview(p => !p)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-violet-400 transition-colors"
        >
          {preview ? <><EyeOff className="w-3 h-3" /> Edit</> : <><Eye className="w-3 h-3" /> Preview</>}
        </button>
      </div>
      {preview ? (
        <div className={`min-h-[100px] rounded-xl px-4 py-3 text-sm leading-relaxed border ${
          isCorrect ? "border-emerald-400/30 bg-emerald-400/5 text-emerald-400" : "border-border bg-background text-foreground"
        }`}>
          {value.trim() ? <MathText text={value} /> : <span className="text-zinc-700 italic text-xs">empty</span>}
        </div>
      ) : (
        <textarea
          ref={taRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          style={autoGrow ? { resize: "none", overflow: "hidden" } : undefined}
          className="w-full bg-background border border-border focus:border-violet-500/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all font-mono min-h-[80px] resize-y"
        />
      )}
    </div>
  );
}

/* ──────────────────────────────── Edit Modal ────────────────────────────── */

function EditModal({ problem, onClose, onSave }: {
  problem: Problem;
  onClose: () => void;
  onSave:  (updated: Partial<Problem>) => void;
}) {
  const [question,      setQuestion]      = useState(problem.question);
  const [options,       setOptions]       = useState({
    a: problem.option_a,
    b: problem.option_b,
    c: problem.option_c,
    d: problem.option_d,
  });
  const [correctAnswer, setCorrectAnswer] = useState(problem.correct_answer);
  const [explanation,   setExplanation]   = useState(problem.explanation ?? "");
  const [difficulty,    setDifficulty]    = useState(problem.difficulty);
  const [tags,          setTags]          = useState(problem.tags?.join(", ") ?? "");
  const [source,        setSource]        = useState(problem.source ?? "");
  const [isFree,        setIsFree]        = useState(problem.is_free);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState("");
  const [pickerInst,    setPickerInst]    = useState("");
  const [pickerYear,    setPickerYear]    = useState(YEARS[1]);

  const tagList = tags.split(",").map(t => t.trim()).filter(Boolean);

  const removeTag = (tag: string) => {
    setTags(tagList.filter(t => t !== tag).join(", "));
  };

  const addInstTag = (inst: string, year: string) => {
    const newTag = `${inst}: ${year}`;
    if (!tagList.includes(newTag)) {
      setTags([...tagList, newTag].join(", "));
    }
  };

  const handleSave = async () => {
    if (!question.trim()) { setError("Question cannot be empty"); return; }
    if (!options.a.trim() || !options.b.trim() || !options.c.trim() || !options.d.trim()) {
      setError("All four options must be filled in"); return;
    }
    setSaving(true);
    setError("");
    const tagsArr = tags.split(",").map(t => t.trim()).filter(Boolean);
    const { error: dbErr } = await supabase.from("problems").update({
      question:       question.trim(),
      option_a:       options.a.trim(),
      option_b:       options.b.trim(),
      option_c:       options.c.trim(),
      option_d:       options.d.trim(),
      correct_answer: correctAnswer,
      explanation:    explanation.trim() || null,
      difficulty,
      tags:           tagsArr.length ? tagsArr : null,
      source:         source.trim() || null,
      is_free:        isFree,
      updated_at:     new Date().toISOString(),
    }).eq("id", problem.id);
    setSaving(false);
    if (dbErr) { setError(dbErr.message); return; }
    onSave({
      question, explanation: explanation || null, source: source || null,
      option_a: options.a, option_b: options.b, option_c: options.c, option_d: options.d,
      correct_answer: correctAnswer, difficulty, is_free: isFree,
      tags: tagsArr.length ? tagsArr : null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-5xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[95vh] h-[95vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <p className="text-xs text-violet-400 font-mono tracking-widest">ADMIN · EDIT PROBLEM</p>
            <p className="text-xs text-muted-foreground/50 font-mono mt-0.5 truncate max-w-sm">{problem.id}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* Question */}
          <LaTeXField
            label="QUESTION"
            value={question}
            onChange={setQuestion}
            rows={4}
            placeholder="LaTeX supported — $math$, $$display$$, \begin{tikzpicture}...\end{tikzpicture}"
          />

          {/* Options */}
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Options</p>
              <p className="text-xs text-amber-400/70">Click letter button to set correct answer</p>
            </div>
            <div className="space-y-4">
              {(["a", "b", "c", "d"] as const).map(key => (
                <div key={key} className="flex items-start gap-3">
                  {/* Correct answer selector button */}
                  <button
                    type="button"
                    onClick={() => setCorrectAnswer(key)}
                    title={`Mark ${key.toUpperCase()} as correct answer`}
                    className={`mt-6 w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-sm font-bold font-mono transition-all ${
                      correctAnswer === key
                        ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20 ring-2 ring-violet-500/40"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {key.toUpperCase()}
                  </button>
                  <div className="flex-1">
                    <LaTeXField
                      label={`OPTION ${key.toUpperCase()}${correctAnswer === key ? " — ✓ correct answer" : ""}`}
                      value={options[key]}
                      onChange={v => setOptions(o => ({ ...o, [key]: v }))}
                      rows={2}
                      placeholder={`Option ${key.toUpperCase()} — supports $math$ and TikZ diagrams`}
                      isCorrect={correctAnswer === key}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <LaTeXField
            label="EXPLANATION (optional)"
            value={explanation}
            onChange={setExplanation}
            rows={8}
            autoGrow
            placeholder="Step-by-step solution shown after student answers..."
          />

          {/* Difficulty + Access */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Difficulty</p>
              <div className="flex gap-2">
                {(["easy", "medium", "hard"] as const).map(d => (
                  <button key={d} type="button" onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all capitalize ${
                      difficulty === d
                        ? d === "easy"   ? "border-emerald-400 bg-emerald-400/10 text-violet-400"
                        : d === "medium" ? "border-amber-400 bg-amber-400/10 text-amber-400"
                        :                  "border-red-400 bg-red-400/10 text-red-400"
                        : "border-border text-muted-foreground hover:border-muted-foreground"
                    }`}>{d}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Access</p>
              <div className="flex gap-2">
                {([["free", true], ["pro", false]] as const).map(([label, val]) => (
                  <button key={label} type="button" onClick={() => setIsFree(val)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all capitalize ${
                      isFree === val
                        ? val ? "border-sky-400 bg-sky-400/10 text-sky-400" : "border-violet-400 bg-violet-400/10 text-violet-400"
                        : "border-border text-muted-foreground hover:border-muted-foreground"
                    }`}>{label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Previous Year Tags */}
          <div className="space-y-3">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Previous Year Tags</p>

            {/* Institute row */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Select Institute</p>
              <div className="flex flex-wrap gap-1.5">
                {INSTITUTES.map(({ key, label, color }) => {
                  const isSelected = pickerInst === key;
                  return (
                    <button key={key} type="button"
                      onClick={() => setPickerInst(isSelected ? "" : key)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        isSelected
                          ? INST_COLORS[color]
                          : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground bg-background"
                      }`}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Year row + Add button — only shown when institute selected */}
            {pickerInst && (
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-muted-foreground">Year:</p>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {YEARS.map(yr => (
                    <button key={yr} type="button"
                      onClick={() => setPickerYear(yr)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition-all ${
                        pickerYear === yr
                          ? "border-violet-400 bg-violet-400/10 text-violet-300"
                          : "border-border text-muted-foreground hover:border-muted-foreground bg-background"
                      }`}>
                      {yr}
                    </button>
                  ))}
                </div>
                <button type="button"
                  onClick={() => { addInstTag(pickerInst, pickerYear); setPickerInst(""); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-xs font-semibold transition-all shrink-0">
                  <Tag className="w-3 h-3" /> Add {pickerInst}: {pickerYear}
                </button>
              </div>
            )}

            {/* Custom tag input */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Custom tags (comma-separated)</p>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input value={tags} onChange={e => setTags(e.target.value)}
                  placeholder="e.g. oscillation, chain-rule, thermodynamics…"
                  className="w-full bg-background border border-border focus:border-violet-500/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all"
                />
              </div>
            </div>

            {/* Applied tags */}
            {tagList.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Applied tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {tagList.map(tag => {
                    const parsed = parseInstTag(tag);
                    const instColor = parsed
                      ? INST_COLORS[INSTITUTES.find(i => i.key === parsed.inst)?.color ?? ""] ?? ""
                      : "";
                    return (
                      <span key={tag} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-mono ${
                        instColor || "bg-muted border-border text-muted-foreground"
                      }`}>
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)}
                          className="text-zinc-500 hover:text-red-400 transition-colors leading-none">
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Source */}
          <div>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1.5">Source <span className="normal-case text-muted-foreground/50">(optional)</span></p>
            <input value={source} onChange={e => setSource(e.target.value)}
              placeholder="e.g. BUET 2024, HSC Board 2023"
              className="w-full bg-background border border-border focus:border-violet-500/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-4 py-3 rounded-xl">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-background/60 shrink-0">
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors">
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────── Problem card ────────────────────────────── */

function DiffBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    easy:   "text-violet-400 border-emerald-400/30 bg-emerald-400/10",
    medium: "text-amber-400   border-amber-400/30   bg-amber-400/10",
    hard:   "text-red-400     border-red-400/30     bg-red-400/10",
  };
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-mono ${styles[level] ?? "text-zinc-400 border-zinc-700"}`}>
      {level}
    </span>
  );
}

function ProblemCard({ problem: init, onDelete, number }: {
  problem:  Problem;
  onDelete: (id: string) => void;
  number:   number;
}) {
  const [problem,  setProblem]  = useState(init);
  const [expanded, setExpanded] = useState(false);
  const [explOpen, setExplOpen] = useState(false);
  const [editing,  setEditing]  = useState(false);

  return (
    <>
      {editing && (
        <EditModal
          problem={problem}
          onClose={() => setEditing(false)}
          onSave={updated => setProblem(p => ({ ...p, ...updated }))}
        />
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors">
        <div className="px-5 py-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-9 h-9 rounded-xl bg-muted border border-border flex items-center justify-center mt-0.5">
              <span className="text-xs font-mono font-bold text-muted-foreground">{number}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-xs text-muted-foreground font-mono">
                  {problem.subjects?.name} · {problem.topics?.name}
                  {problem.subtopics?.name && <> · <span className="text-muted-foreground/70">{problem.subtopics.name}</span></>}
                </span>
                <DiffBadge level={problem.difficulty} />
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-mono ${
                  problem.is_free
                    ? "text-sky-400 border-sky-400/30 bg-sky-400/10"
                    : "text-violet-400 border-violet-400/30 bg-violet-400/10"
                }`}>{problem.is_free ? "Free" : "Pro"}</span>
                {problem.source && <span className="text-xs text-muted-foreground/60">{problem.source}</span>}
              </div>

              <div className="text-sm text-foreground leading-relaxed">
                {expanded
                  ? <MathText text={problem.question} />
                  : <MathText text={stripTikz(problem.question)} />}
              </div>

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

            <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
              <button onClick={() => setEditing(true)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-violet-400 hover:bg-violet-400/10 transition-colors"
                title="Edit problem">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onDelete(problem.id)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                title="Delete problem">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
            </div>
          </div>
        </div>

        {expanded && (
          <div className="border-t border-border px-5 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {(["a", "b", "c", "d"] as const).map(opt => {
                const text      = problem[`option_${opt}` as keyof Problem] as string;
                const isCorrect = problem.correct_answer === opt;
                return (
                  <div key={opt} className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border text-sm ${
                    isCorrect
                      ? "border-emerald-400/40 bg-emerald-400/5 text-emerald-300"
                      : "border-border text-muted-foreground"
                  }`}>
                    <span className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center text-xs font-bold font-mono mt-0.5 ${
                      isCorrect ? "bg-violet-500 text-white" : "bg-muted text-muted-foreground"
                    }`}>{opt.toUpperCase()}</span>
                    <span className="flex-1 text-xs leading-relaxed"><MathText text={text} /></span>
                    {isCorrect && <CheckCircle className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />}
                  </div>
                );
              })}
            </div>

            {problem.explanation && (
              <div className="border border-border rounded-xl overflow-hidden">
                <button onClick={() => setExplOpen(e => !e)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
                  <span className="text-violet-400">EXPLANATION</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${explOpen ? "rotate-180" : ""}`} />
                </button>
                {explOpen && (
                  <div className="px-4 pb-3 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border bg-background">
                    <MathText text={problem.explanation} />
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground/50 font-mono">
              ID: {problem.id} · Added {new Date(problem.created_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

/* ───────────────────────────────── Main page ────────────────────────────── */

export default function ProblemsListPage() {
  const [problems,       setProblems]       = useState<Problem[]>([]);
  const [subjects,       setSubjects]       = useState<Subject[]>([]);
  const [topics,         setTopics]         = useState<Topic[]>([]);
  const [subtopics,      setSubtopics]      = useState<Subtopic[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState("");
  const [subjectFilter,  setSubjectFilter]  = useState("");
  const [topicFilter,    setTopicFilter]    = useState("");
  const [subtopicFilter, setSubtopicFilter] = useState("");
  const [diffFilter,     setDiffFilter]     = useState("");
  const [freeFilter,     setFreeFilter]     = useState("");
  const [total,          setTotal]          = useState(0);
  const [page,           setPage]           = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    supabase.from("subjects").select("id, name").order("sort_order").then(({ data }) => setSubjects(data || []));
    supabase.from("topics").select("id, name, subject_id").order("name").then(({ data }) => setTopics(data || []));
  }, []);

  useEffect(() => {
    if (!topicFilter) { setSubtopics([]); setSubtopicFilter(""); return; }
    supabase.from("subtopics").select("id, name, topic_id").eq("topic_id", topicFilter).order("sort_order")
      .then(({ data }) => setSubtopics(data || []));
    setSubtopicFilter("");
  }, [topicFilter]);

  useEffect(() => { fetchProblems(); }, [search, subjectFilter, topicFilter, subtopicFilter, diffFilter, freeFilter, page]);

  const fetchProblems = async () => {
    setLoading(true);
    let q = supabase
      .from("problems")
      .select(`id, question, option_a, option_b, option_c, option_d, correct_answer, explanation,
               difficulty, is_free, tags, source, created_at, subtopic_id,
               subjects(name), topics(name), subtopics(name)`, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (subjectFilter)  q = q.eq("subject_id",  subjectFilter);
    if (topicFilter)    q = q.eq("topic_id",    topicFilter);
    if (subtopicFilter) q = q.eq("subtopic_id", subtopicFilter);
    if (diffFilter)     q = q.eq("difficulty",  diffFilter);
    if (freeFilter)     q = q.eq("is_free",     freeFilter === "free");
    if (search)         q = q.ilike("question", `%${search}%`);

    const { data, count, error } = await q;
    if (!error) { setProblems((data as unknown as Problem[]) || []); setTotal(count || 0); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this problem? This cannot be undone.")) return;
    const { error } = await supabase.from("problems").delete().eq("id", id);
    if (!error) setProblems(ps => ps.filter(p => p.id !== id));
  };

  const filteredTopics = subjectFilter ? topics.filter(t => t.subject_id === subjectFilter) : topics;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  /* ── Shared pagination component ── */
  const Pagination = () => totalPages <= 1 ? null : (
    <div className="bg-card border border-border rounded-2xl px-5 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          <span className="text-foreground font-medium">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)}</span>
          <span className="text-muted-foreground"> of </span>
          <span className="text-foreground font-medium">{total}</span>
          <span className="text-muted-foreground"> problems</span>
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Go to</span>
          <input
            type="number" min={1} max={totalPages} value={page + 1}
            onChange={e => { const v = parseInt(e.target.value) - 1; if (v >= 0 && v < totalPages) setPage(v); }}
            className="w-14 bg-background border border-border rounded-lg px-2 py-1 text-center text-foreground outline-none focus:border-violet-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-muted-foreground/60">/ {totalPages}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
          className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground disabled:opacity-30 hover:border-muted-foreground hover:text-foreground transition-colors">← Prev</button>

        {Array.from({ length: totalPages }, (_, i) => i)
          .filter(i => i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 2)
          .reduce((acc: (number | string)[], i, idx, arr) => {
            if (idx > 0 && (arr[idx - 1] as number) < i - 1) acc.push("…");
            acc.push(i);
            return acc;
          }, [])
          .map((item, idx) => item === "…" ? (
            <span key={`e-${idx}`} className="px-1 text-muted-foreground/40 text-xs">…</span>
          ) : (
            <button key={item} onClick={() => setPage(item as number)}
              className={`min-w-[32px] px-2 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                page === item
                  ? "border-violet-500 bg-violet-500/10 text-violet-400 font-semibold"
                  : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
              }`}>{(item as number) + 1}</button>
          ))}

        <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
          className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground disabled:opacity-30 hover:border-muted-foreground hover:text-foreground transition-colors">Next →</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-violet-400 font-mono tracking-widest mb-1">ADMIN</p>
            <h1 className="text-2xl font-bold text-foreground">
              Problems <span className="ml-3 text-base font-normal text-muted-foreground">({total})</span>
            </h1>
          </div>
          <a href="/admin/add-problem"
            className="flex items-center gap-2 bg-violet-500 hover:bg-violet-400 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-violet-500/20">
            <BookOpen className="w-4 h-4" /> Add Problem
          </a>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search questions..."
              className="w-full bg-background border border-border focus:border-violet-500/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { val: subjectFilter, set: (v: string) => { setSubjectFilter(v); setTopicFilter(""); setPage(0); }, opts: subjects.map(s => [s.id, s.name] as [string,string]), placeholder: "All subjects" },
              { val: topicFilter,   set: (v: string) => { setTopicFilter(v);   setPage(0); },                    opts: filteredTopics.map(t => [t.id, t.name] as [string,string]), placeholder: "All topics" },
            ].map((sel, i) => (
              <div key={i} className="relative">
                <select value={sel.val} onChange={e => sel.set(e.target.value)}
                  className="appearance-none bg-background border border-border rounded-xl pl-3 pr-8 py-2 text-xs text-muted-foreground outline-none">
                  <option value="">{sel.placeholder}</option>
                  {sel.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              </div>
            ))}

            {subtopics.length > 0 && (
              <div className="relative">
                <select value={subtopicFilter} onChange={e => { setSubtopicFilter(e.target.value); setPage(0); }}
                  className="appearance-none bg-background border border-border rounded-xl pl-3 pr-8 py-2 text-xs text-muted-foreground outline-none">
                  <option value="">All subtopics</option>
                  {subtopics.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              </div>
            )}

            {[
              { val: diffFilter, set: (v: string) => { setDiffFilter(v); setPage(0); }, opts: [["easy","Easy"],["medium","Medium"],["hard","Hard"]] as [string,string][], placeholder: "All difficulties" },
              { val: freeFilter, set: (v: string) => { setFreeFilter(v); setPage(0); }, opts: [["free","Free only"],["pro","Pro only"]] as [string,string][],               placeholder: "Free + Pro" },
            ].map((sel, i) => (
              <div key={i} className="relative">
                <select value={sel.val} onChange={e => sel.set(e.target.value)}
                  className="appearance-none bg-background border border-border rounded-xl pl-3 pr-8 py-2 text-xs text-muted-foreground outline-none">
                  <option value="">{sel.placeholder}</option>
                  {sel.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              </div>
            ))}

            {(subjectFilter || topicFilter || subtopicFilter || diffFilter || freeFilter || search) && (
              <button onClick={() => {
                setSearch(""); setSubjectFilter(""); setTopicFilter("");
                setSubtopicFilter(""); setDiffFilter(""); setFreeFilter(""); setPage(0);
              }} className="text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-xl hover:bg-accent transition-colors">
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* ── Pagination TOP ── */}
        <Pagination />

        {/* Problems list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          </div>
        ) : problems.length === 0 ? (
          <div className="text-center py-20 space-y-2">
            <BookOpen className="w-10 h-10 text-muted-foreground/20 mx-auto" />
            <p className="text-muted-foreground">No problems found</p>
            <a href="/admin/add-problem" className="text-sm text-violet-400 hover:underline">Add your first problem →</a>
          </div>
        ) : (
          <div className="space-y-3">
            {problems.map((p, i) => (
              <ProblemCard key={p.id} problem={p} onDelete={handleDelete} number={page * PAGE_SIZE + i + 1} />
            ))}
          </div>
        )}

        {/* ── Pagination BOTTOM ── */}
        <Pagination />

      </div>
    </div>
  );
}
