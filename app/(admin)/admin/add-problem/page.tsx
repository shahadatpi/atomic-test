"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import katex from "katex";
import TikZRenderer from "@/components/math/TikZRenderer";
import {
  CheckCircle, AlertCircle, Eye, EyeOff,
  Loader2, Plus, Trash2, Tag, ChevronDown,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Difficulty   = "easy" | "medium" | "hard";
type Answer       = "a" | "b" | "c" | "d";
type ProblemType  = "board_mcq" | "admission_mcq" | "board_cq" | "admission_written" | "board_written" | "practice";

const PROBLEM_TYPES: { value: ProblemType; label: string; short: string; color: string }[] = [
  { value: "board_mcq",          label: "Board MCQ",          short: "Board MCQ",    color: "border-sky-400     bg-sky-400/10     text-sky-400"     },
  { value: "admission_mcq",      label: "Admission MCQ",      short: "Adm. MCQ",    color: "border-violet-400  bg-violet-400/10  text-violet-400"  },
  { value: "board_cq",           label: "Board CQ",           short: "Board CQ",     color: "border-emerald-400 bg-emerald-400/10 text-emerald-400" },
  { value: "board_written",      label: "Board Written",      short: "Board WR",     color: "border-teal-400    bg-teal-400/10    text-teal-400"    },
  { value: "admission_written",  label: "Admission Written",  short: "Adm. Written", color: "border-amber-400   bg-amber-400/10   text-amber-400"   },
  { value: "practice",           label: "Practice",           short: "Practice",     color: "border-zinc-400    bg-zinc-400/10    text-zinc-400"    },
];

interface Subject  { id: string; name: string; }
interface Topic    { id: string; name: string; subject_id: string; }
interface Subtopic { id: string; name: string; topic_id: string; }

interface FormState {
  subject_id: string; topic_id: string; subtopic_id: string;
  question: string; option_a: string; option_b: string; option_c: string; option_d: string;
  correct_answer: Answer; explanation: string; hint: string;
  difficulty: Difficulty; is_free: boolean; tags: string; source: string;
  problem_type: ProblemType;
}

const EMPTY: FormState = {
  subject_id: "", topic_id: "", subtopic_id: "", question: "",
  option_a: "", option_b: "", option_c: "", option_d: "",
  correct_answer: "a", explanation: "", hint: "",
  difficulty: "medium", is_free: true, tags: "", source: "",
  problem_type: "board_mcq",
};

function extractTikz(text: string): string {
  return text
    .replace(/\\begin\{center\}([\s\S]*?)\\end\{center\}/g, (_, inner) => inner.trim())
    .replace(/\\centering\b/g, "")
    .replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g, m => `%%TIKZ:${encodeURIComponent(m)}%%`)
    .replace(/\\begin\{circuitikz\}[\s\S]*?\\end\{circuitikz\}/g,   m => `%%TIKZ:${encodeURIComponent(m)}%%`);
}

function normaliseMath(text: string): string {
  return text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => `$$${m}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => `$${m}$`)
    .replace(/\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}/g, (_, env, body) => `$$\\begin{${env}}${body}\\end{${env}}$$`);
}

function preprocessText(text: string): string {
  return text
    .replace(/\\boxed\{([^}]*)\}/g,   (_, m) => /^[0-9+\-*/=^_.,() \\]+$/.test(m) ? `$\\boxed{${m}}$` : `%%BOX:${m}%%`)
    .replace(/\\textbf\{([^}]*)\}/g,   (_, m) => `**${m}**`)
    .replace(/\\textit\{([^}]*)\}/g,   (_, m) => `_${m}_`)
    .replace(/\\texttt\{([^}]*)\}/g,   (_, m) => `\`${m}\``)
    .replace(/\\underline\{([^}]*)\}/g,(_, m) => m)
    .replace(/\\emph\{([^}]*)\}/g,     (_, m) => `_${m}_`);
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`|%%BOX:[^%]+%%)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return <strong key={i} className="text-foreground font-semibold">{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`"))
      return <code key={i} className="font-mono text-violet-400 bg-muted px-1 rounded">{p.slice(1, -1)}</code>;
    if (p.startsWith("%%BOX:") && p.endsWith("%%"))
      return <span key={i} className="inline-block border border-violet-400/60 text-emerald-400 rounded px-2 py-0.5 text-xs font-semibold mx-0.5 align-middle">{p.slice(6, -2)}</span>;
    return <span key={i}>{p}</span>;
  });
}

function MathText({ text, className = "" }: { text: string; className?: string }) {
  if (!text) return <span className={`text-muted-foreground italic ${className}`}>empty</span>;
  const processed = extractTikz(normaliseMath(preprocessText(text)));
  const parts = processed.split(/(%%TIKZ:[^%]+%%|\$\$[\s\S]*?\$\$|\$[^$]*?\$)/g);
  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (p.startsWith("%%TIKZ:") && p.endsWith("%%"))
          return <TikZRenderer key={i} code={decodeURIComponent(p.slice(7, -2))} />;
        try {
          if (p.startsWith("$$") && p.endsWith("$$")) { const h = katex.renderToString(p.slice(2,-2),{throwOnError:false,displayMode:true}); return <span key={i} dangerouslySetInnerHTML={{__html:h}} style={{display:"block"}} />; }
          if (p.startsWith("$")  && p.endsWith("$"))  { const h = katex.renderToString(p.slice(1,-1),{throwOnError:false,displayMode:false}); return <span key={i} dangerouslySetInnerHTML={{__html:h}} />; }
        } catch { return <span key={i} className="text-red-400">{p}</span>; }
        return <span key={i}>{renderInlineMarkdown(p)}</span>;
      })}
    </span>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono text-muted-foreground tracking-wider uppercase">{label}</label>
        {hint && <span className="text-xs text-muted-foreground/50">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function LaTeXField({ label, value, onChange, placeholder, rows = 3, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; hint?: string;
}) {
  const [preview, setPreview] = useState(false);
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <textarea
          rows={rows} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-background border border-border focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 resize-none outline-none transition-all font-mono"
        />
        <button type="button" onClick={() => setPreview(p => !p)}
          className="absolute top-2.5 right-3 text-muted-foreground hover:text-violet-400 transition-colors" title="Toggle preview">
          {preview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
      {preview && value && (
        <div className="bg-muted/40 border border-border rounded-xl px-4 py-3 text-sm text-foreground leading-relaxed">
          <MathText text={value} />
        </div>
      )}
    </Field>
  );
}

function Select({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full appearance-none bg-background border border-border focus:border-violet-500/60 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none transition-all pr-9">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    </div>
  );
}

/* ── ComboBox: search existing OR create new inline ─────────────────────── */
interface ComboItem { id: string; name: string; }

function ComboBox({ value, items, placeholder, disabled, creating, onSelect, onCreate }: {
  value:       string;
  items:       ComboItem[];
  placeholder: string;
  disabled?:   boolean;
  creating?:   boolean;
  onSelect:    (id: string) => void;
  onCreate:    (name: string) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [open,  setOpen]  = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const selected   = items.find(i => i.id === value);
  const filtered   = query.trim() ? items.filter(i => i.name.toLowerCase().includes(query.toLowerCase())) : items;
  const exactMatch = items.some(i => i.name.toLowerCase() === query.trim().toLowerCase());
  const canCreate  = query.trim().length > 0 && !exactMatch;

  const handleSelect = (id: string) => { onSelect(id); setQuery(""); setOpen(false); };
  const handleCreate = async () => { if (!query.trim()) return; await onCreate(query.trim()); setQuery(""); setOpen(false); };

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => { if (!disabled) setOpen(o => !o); }}
        className={`flex items-center gap-2 w-full bg-background border rounded-xl px-3 py-2.5 text-sm transition-all cursor-pointer ${
          disabled ? "opacity-40 cursor-not-allowed border-border"
          : open    ? "border-violet-500/60"
          :           "border-border hover:border-muted-foreground"
        }`}
      >
        {creating
          ? <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin shrink-0" />
          : <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        }
        <span className={`flex-1 truncate ${selected ? "text-foreground" : "text-muted-foreground/50"}`}>
          {selected ? selected.name : placeholder}
        </span>
        {selected && (
          <button type="button" onClick={e => { e.stopPropagation(); onSelect(""); setQuery(""); }}
            className="text-muted-foreground hover:text-red-400 transition-colors text-base leading-none shrink-0">×</button>
        )}
      </div>

      {open && !disabled && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && canCreate) handleCreate(); if (e.key === "Escape") setOpen(false); }}
              placeholder="Search or type to create…"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-violet-500/50"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && !canCreate && (
              <p className="px-4 py-3 text-xs text-muted-foreground italic">No matches</p>
            )}
            {filtered.map(item => (
              <button key={item.id} type="button" onClick={() => handleSelect(item.id)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-accent/50 ${
                  item.id === value ? "text-violet-400 bg-violet-400/5" : "text-foreground"
                }`}>
                {item.name}{item.id === value && <span className="ml-2 text-xs">✓</span>}
              </button>
            ))}
          </div>
          {canCreate && (
            <div className="border-t border-border p-2">
              <button type="button" onClick={handleCreate}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-sm font-medium transition-colors">
                <Plus className="w-3.5 h-3.5" /> Create &ldquo;{query.trim()}&rdquo;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProblemEditor() {
  const [form,      setForm]      = useState<FormState>(EMPTY);
  const [subjects,  setSubjects]  = useState<Subject[]>([]);
  const [topics,    setTopics]    = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [status,    setStatus]    = useState<"idle"|"success"|"error">("idle");
  const [errMsg,    setErrMsg]    = useState("");
  const [preview,   setPreview]   = useState(false);

  // inline-create loading indicators
  const [creatingSubject,  setCreatingSubject]  = useState(false);
  const [creatingTopic,    setCreatingTopic]    = useState(false);
  const [creatingSubtopic, setCreatingSubtopic] = useState(false);

  useEffect(() => {
    supabase.from("subjects").select("id, name").order("sort_order").then(({ data }) => setSubjects(data || []));
  }, []);

  useEffect(() => {
    if (!form.subject_id) { setTopics([]); return; }
    supabase.from("topics").select("id, name, subject_id").eq("subject_id", form.subject_id).order("sort_order").then(({ data }) => setTopics(data || []));
    set("topic_id", ""); set("subtopic_id", "");
  }, [form.subject_id]);

  useEffect(() => {
    if (!form.topic_id) { setSubtopics([]); return; }
    supabase.from("subtopics").select("id, name, topic_id").eq("topic_id", form.topic_id).order("sort_order").then(({ data }) => setSubtopics(data || []));
    set("subtopic_id", "");
  }, [form.topic_id]);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => setForm(f => ({ ...f, [key]: val }));

  const createSubject = async (name: string) => {
    setCreatingSubject(true);
    const { error: insErr } = await supabase.from("subjects").insert({ name, sort_order: 0 });
    if (insErr) { setCreatingSubject(false); setStatus("error"); setErrMsg(`Could not create subject: ${insErr.message}`); return; }
    const { data } = await supabase.from("subjects").select("id, name").eq("name", name).order("sort_order", { ascending: false }).limit(1).single();
    setCreatingSubject(false);
    if (data) { setSubjects(s => [...s, data]); set("subject_id", data.id); }
  };

  const createTopic = async (name: string) => {
    if (!form.subject_id) { setStatus("error"); setErrMsg("Select a subject first"); return; }
    setCreatingTopic(true);
    const { error: insErr } = await supabase.from("topics").insert({ name, subject_id: form.subject_id, sort_order: 0 });
    if (insErr) { setCreatingTopic(false); setStatus("error"); setErrMsg(`Could not create topic: ${insErr.message}`); return; }
    const { data } = await supabase.from("topics").select("id, name, subject_id").eq("name", name).eq("subject_id", form.subject_id).order("sort_order", { ascending: false }).limit(1).single();
    setCreatingTopic(false);
    if (data) { setTopics(t => [...t, data]); set("topic_id", data.id); }
  };

  const createSubtopic = async (name: string) => {
    if (!form.topic_id) { setStatus("error"); setErrMsg("Select a topic first"); return; }
    setCreatingSubtopic(true);
    const { error: insErr } = await supabase.from("subtopics").insert({ name, topic_id: form.topic_id, sort_order: 0 });
    if (insErr) { setCreatingSubtopic(false); setStatus("error"); setErrMsg(`Could not create subtopic: ${insErr.message}`); return; }
    const { data } = await supabase.from("subtopics").select("id, name, topic_id").eq("name", name).eq("topic_id", form.topic_id).order("sort_order", { ascending: false }).limit(1).single();
    setCreatingSubtopic(false);
    if (data) { setSubtopics(s => [...s, data]); set("subtopic_id", data.id); }
  };

  const handleSubmit = async () => {
    const required: (keyof FormState)[] = ["subject_id","topic_id","question","option_a","option_b","option_c","option_d"];
    for (const key of required) {
      if (!form[key]) { setStatus("error"); setErrMsg(`Please fill in: ${key.replace("_"," ")}`); return; }
    }
    setLoading(true); setStatus("idle");
    const tags = form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
    const { error } = await supabase.from("problems").insert({
      subject_id: form.subject_id, topic_id: form.topic_id, subtopic_id: form.subtopic_id || null,
      question: form.question, option_a: form.option_a, option_b: form.option_b,
      option_c: form.option_c, option_d: form.option_d, correct_answer: form.correct_answer,
      explanation: form.explanation || null, hint: form.hint || null,
      difficulty: form.difficulty, is_free: form.is_free,
      problem_type: form.problem_type,
      tags: tags.length ? tags : null, source: form.source || null,
    });
    setLoading(false);
    if (error) { setStatus("error"); setErrMsg(error.message); }
    else { setStatus("success"); setForm(EMPTY); setTimeout(() => setStatus("idle"), 4000); }
  };

  const OPTIONS: { key: "option_a"|"option_b"|"option_c"|"option_d"; label: string }[] = [
    { key: "option_a", label: "A" }, { key: "option_b", label: "B" },
    { key: "option_c", label: "C" }, { key: "option_d", label: "D" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-violet-400 font-mono tracking-widest mb-1">ADMIN</p>
            <h1 className="text-2xl font-bold text-foreground">Add Problem</h1>
          </div>
          <button onClick={() => setPreview(p => !p)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all ${
              preview ? "border-violet-400/50 bg-violet-500/10 text-violet-400" : "border-border text-muted-foreground hover:border-muted-foreground"
            }`}>
            {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {preview ? "Hide Preview" : "Full Preview"}
          </button>
        </div>

        {status === "success" && (
          <div className="flex items-center gap-3 bg-violet-500/10 border border-violet-400/30 rounded-xl px-4 py-3 text-violet-400 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" /> Problem saved successfully!
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-3 bg-red-400/10 border border-red-400/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {errMsg}
          </div>
        )}

        {/* Classification */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <p className="text-xs text-muted-foreground font-mono tracking-widest">CLASSIFICATION</p>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Subject">
              <ComboBox
                value={form.subject_id}
                items={subjects}
                placeholder="Select or create…"
                creating={creatingSubject}
                onSelect={v => set("subject_id", v)}
                onCreate={createSubject}
              />
            </Field>
            <Field label="Topic">
              <ComboBox
                value={form.topic_id}
                items={topics}
                placeholder={form.subject_id ? "Select or create…" : "Pick subject first"}
                disabled={!form.subject_id}
                creating={creatingTopic}
                onSelect={v => set("topic_id", v)}
                onCreate={createTopic}
              />
            </Field>
            <Field label="Subtopic" hint="optional">
              <ComboBox
                value={form.subtopic_id}
                items={subtopics}
                placeholder={form.topic_id ? "Select or create…" : "Pick topic first"}
                disabled={!form.topic_id}
                creating={creatingSubtopic}
                onSelect={v => set("subtopic_id", v)}
                onCreate={createSubtopic}
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Difficulty">
              <Select value={form.difficulty} onChange={v => set("difficulty", v as Difficulty)}
                options={[{value:"easy",label:"Easy"},{value:"medium",label:"Medium"},{value:"hard",label:"Hard"}]} />
            </Field>
            <Field label="Access">
              <Select value={form.is_free ? "free" : "pro"} onChange={v => set("is_free", v === "free")}
                options={[{value:"free",label:"Free"},{value:"pro",label:"Pro"}]} />
            </Field>
            <Field label="Source" hint="optional">
              <input value={form.source} onChange={e => set("source", e.target.value)} placeholder="e.g. HSC 2023"
                className="w-full bg-background border border-border focus:border-violet-500/60 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all" />
            </Field>
          </div>
          <Field label="Problem Type">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {PROBLEM_TYPES.map(pt => (
                <button key={pt.value} type="button" onClick={() => set("problem_type", pt.value)}
                  className={`py-2 px-1 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center gap-0.5 ${
                    form.problem_type === pt.value
                      ? pt.color + " scale-[1.03]"
                      : "border-border text-muted-foreground hover:border-muted-foreground hover:bg-accent/50"
                  }`}>
                  {pt.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Tags" hint="comma separated">
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={form.tags} onChange={e => set("tags", e.target.value)}
                placeholder="calculus, differentiation, chain-rule"
                className="w-full bg-background border border-border focus:border-violet-500/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all" />
            </div>
            {form.tags && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.split(",").map(t => t.trim()).filter(Boolean).map(tag => (
                  <span key={tag} className="text-xs bg-muted border border-border text-muted-foreground px-2.5 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            )}
          </Field>
        </div>

        {/* Question */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <p className="text-xs text-muted-foreground font-mono tracking-widest">QUESTION</p>
          <LaTeXField label="Question text" value={form.question} onChange={v => set("question", v)}
            placeholder="Use $...$ for inline math, $$...$$ for block math" rows={4} hint="LaTeX supported" />
        </div>

        {/* Options */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <p className="text-xs text-muted-foreground font-mono tracking-widest">OPTIONS</p>
          <div className="space-y-3">
            {OPTIONS.map(({ key, label }) => {
              const answerKey = label.toLowerCase() as Answer;
              const isCorrect = form.correct_answer === answerKey;
              return (
                <div key={key} className="flex items-start gap-3">
                  <button type="button" onClick={() => set("correct_answer", answerKey)}
                    className={`mt-3 w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold font-mono transition-all ${
                      isCorrect ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20" : "bg-muted text-muted-foreground hover:bg-accent"
                    }`} title={`Mark ${label} as correct`}>
                    {label}
                  </button>
                  <div className="flex-1">
                    <LaTeXField label={`Option ${label}${isCorrect ? " ✓ correct" : ""}`}
                      value={form[key]} onChange={v => set(key, v)} placeholder={`Option ${label}`} rows={2} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground/50">Click the letter button to mark as correct answer</p>
        </div>

        {/* Solution */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <p className="text-xs text-muted-foreground font-mono tracking-widest">SOLUTION</p>
          <LaTeXField label="Explanation" value={form.explanation} onChange={v => set("explanation", v)}
            placeholder="Step-by-step working shown after answering..." rows={4} hint="optional" />
          <LaTeXField label="Hint" value={form.hint} onChange={v => set("hint", v)}
            placeholder="A nudge shown on request (Pro feature)..." rows={2} hint="optional · Pro only" />
        </div>

        {/* Preview */}
        {preview && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <p className="text-xs text-muted-foreground font-mono tracking-widest">PREVIEW</p>
            <div className="flex items-center gap-2 flex-wrap">
              {(() => {
                const pt = PROBLEM_TYPES.find(p => p.value === form.problem_type);
                return pt ? <span className={`text-xs px-3 py-1 rounded-full border font-mono ${pt.color}`}>{pt.label}</span> : null;
              })()}
              {form.difficulty && (
                <span className={`text-xs px-3 py-1 rounded-full border font-mono ${
                  form.difficulty === "easy"   ? "text-emerald-400 border-emerald-400/30 bg-emerald-500/10" :
                  form.difficulty === "medium" ? "text-amber-400 border-amber-400/30 bg-amber-400/10" :
                                                 "text-red-400 border-red-400/30 bg-red-400/10"
                }`}>{form.difficulty}</span>
              )}
              <span className={`text-xs px-3 py-1 rounded-full border font-mono ${
                form.is_free ? "text-sky-400 border-sky-400/30 bg-sky-400/10" : "text-violet-400 border-violet-400/30 bg-violet-400/10"
              }`}>{form.is_free ? "Free" : "Pro"}</span>
            </div>
            <div className="text-foreground text-base leading-relaxed"><MathText text={form.question} /></div>
            <div className="space-y-2">
              {OPTIONS.map(({ key, label }) => {
                const answerKey = label.toLowerCase() as Answer;
                const isCorrect = form.correct_answer === answerKey;
                return (
                  <div key={key} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
                    isCorrect ? "border-violet-400/50 bg-violet-500/10 text-violet-300" : "border-border text-muted-foreground"
                  }`}>
                    <span className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center text-xs font-bold font-mono ${
                      isCorrect ? "bg-violet-500 text-white" : "bg-muted text-muted-foreground"
                    }`}>{label}</span>
                    <MathText text={form[key]} />
                    {isCorrect && <span className="ml-auto text-violet-400 text-xs">✓ correct</span>}
                  </div>
                );
              })}
            </div>
            {form.explanation && (
              <div className="border-t border-border pt-4 space-y-2">
                <p className="text-xs text-violet-400 font-mono">EXPLANATION</p>
                <div className="text-muted-foreground text-sm leading-relaxed"><MathText text={form.explanation} /></div>
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-between pb-10">
          <button type="button" onClick={() => setForm(EMPTY)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Trash2 className="w-4 h-4" /> Clear form
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex items-center gap-2 bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-400 text-white font-semibold text-sm px-8 py-3 rounded-xl transition-colors shadow-lg shadow-violet-500/20">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Plus className="w-4 h-4" /> Save Problem</>}
          </button>
        </div>
      </div>
    </div>
  );
}
