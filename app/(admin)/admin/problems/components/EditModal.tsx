"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ChevronDown, Loader2, Save, Tag, X,
  BookOpen, Settings, AlignLeft, CheckSquare,
} from "lucide-react";
import LaTeXField from "./LaTeXField";
import {
  Problem, Subject, Topic, Subtopic,
  INSTITUTES, INST_COLORS, getYears, parseInstTag,
} from "../types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const YEARS     = getYears();
const CQ_LABELS = ["ক", "খ", "গ", "ঘ"];
const CQ_MARKS  = ["১", "২", "৩", "৪"];
type  TabId     = "content" | "classification" | "meta";
type  ExplKey   = "explanation_a" | "explanation_b" | "explanation_c" | "explanation_d";
const EXPL_KEYS: ExplKey[] = ["explanation_a", "explanation_b", "explanation_c", "explanation_d"];

// ── Tiny reusables ────────────────────────────────────────────────────────────

const SEL = "w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500/50 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none transition-all appearance-none";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">{children}</p>;
}

function Tab({ active, icon: Icon, label, onClick }: {
  active: boolean; icon: React.ElementType; label: string; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold
                  transition-all whitespace-nowrap border ${
        active
          ? "bg-violet-500/15 text-violet-400 border-violet-500/30"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 border-transparent"
      }`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

function InlineCreate({ mode, value, onChange, onSave, onCancel, saving, error, placeholder }: {
  mode: "create"|"rename"; value: string; onChange: (v: string) => void;
  onSave: () => void; onCancel: () => void; saving: boolean;
  error: string; placeholder: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input autoFocus value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onKeyDown={e => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }}
          className="flex-1 bg-zinc-950 border border-violet-500/50 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none" />
        <button type="button" disabled={saving} onClick={onSave}
          className="px-4 py-2 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white text-xs rounded-xl font-semibold transition-colors whitespace-nowrap">
          {saving ? "…" : mode === "create" ? "Create" : "Save"}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ── CQ explanation textarea — simple controlled input ─────────────────────────
// No clever tricks needed since we now store explanation_a/b/c/d directly.
function CqExplField({ value, placeholder, onChange }: {
  value: string; placeholder: string; onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Set height from content on mount and on value change
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.max(el.scrollHeight, 80) + "px";
  });  // run every render — cheap and reliable

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => {
        onChange(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = Math.max(e.target.scrollHeight, 80) + "px";
      }}
      placeholder={placeholder}
      rows={3}
      style={{ resize: "none", overflow: "hidden" }}
      className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500/50
                 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-700
                 outline-none font-mono transition-colors"
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EditModal({ problem, onClose, onSave }: {
  problem: Problem;
  onClose: () => void;
  onSave:  (updated: Partial<Problem>) => void;
}) {
  const [activeTab,     setActiveTab]     = useState<TabId>("content");
  const [question,      setQuestion]      = useState(problem.question ?? "");
  const [options,       setOptions]       = useState({
    a: problem.option_a ?? "", b: problem.option_b ?? "",
    c: problem.option_c ?? "", d: problem.option_d ?? "",
  });
  const [correctAnswer, setCorrectAnswer] = useState(problem.correct_answer ?? "");
  const [explanation,   setExplanation]   = useState(problem.explanation ?? "");

  // Per-subquestion explanations — read directly from DB columns
  const [cqExpls, setCqExpls] = useState({
    a: problem.explanation_a ?? "",
    b: problem.explanation_b ?? "",
    c: problem.explanation_c ?? "",
    d: problem.explanation_d ?? "",
  });

  const [cqExplOpen,    setCqExplOpen]    = useState<number | null>(null);
  const [difficulty,    setDifficulty]    = useState(problem.difficulty);
  const [isFree,        setIsFree]        = useState(problem.is_free);
  const [tags,          setTags]          = useState(problem.tags?.join(", ") ?? "");
  const [source,        setSource]        = useState(problem.source ?? "");
  const [pickerInst,    setPickerInst]    = useState("");
  const [pickerYear,    setPickerYear]    = useState(YEARS[1]);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState("");

  const [allSubjects,  setAllSubjects]  = useState<Subject[]>([]);
  const [allTopics,    setAllTopics]    = useState<Topic[]>([]);
  const [allSubtopics, setAllSubtopics] = useState<Subtopic[]>([]);
  const [subjectId,    setSubjectId]    = useState(problem.subject_id ?? "");
  const [topicId,      setTopicId]      = useState(problem.topic_id ?? "");
  const [subtopicId,   setSubtopicId]   = useState(problem.subtopic_id ?? "");
  const [problemType,  setProblemType]  = useState(problem.problem_type ?? "board_mcq");

  const [topicMode,       setTopicMode]       = useState<"select"|"rename"|"create">("select");
  const [topicNameVal,    setTopicNameVal]     = useState("");
  const [topicSaving,     setTopicSaving]      = useState(false);
  const [topicErr,        setTopicErr]         = useState("");
  const [subtopicMode,    setSubtopicMode]     = useState<"select"|"rename"|"create">("select");
  const [subtopicNameVal, setSubtopicNameVal]  = useState("");
  const [subtopicSaving,  setSubtopicSaving]   = useState(false);
  const [subtopicErr,     setSubtopicErr]      = useState("");

  const isMcqType      = problemType.includes("mcq");
  const filteredTopics = subjectId ? allTopics.filter(t => t.subject_id === subjectId) : allTopics;
  const tagList        = tags.split(",").map(t => t.trim()).filter(Boolean);

  useEffect(() => {
    Promise.all([
      supabase.from("subjects").select("id, name").order("sort_order"),
      supabase.from("topics").select("id, name, subject_id").order("name"),
    ]).then(([{ data: subs }, { data: tops }]) => {
      setAllSubjects(subs || []);
      setAllTopics(tops || []);
    });
    if (problem.topic_id) {
      supabase.from("subtopics").select("id, name, topic_id")
        .eq("topic_id", problem.topic_id).order("sort_order")
        .then(({ data }) => setAllSubtopics(data || []));
    }
  }, []);

  useEffect(() => {
    if (!topicId) { setAllSubtopics([]); return; }
    supabase.from("subtopics").select("id, name, topic_id")
      .eq("topic_id", topicId).order("sort_order")
      .then(({ data }) => setAllSubtopics(data || []));
  }, [topicId]);

  const saveTopicName = async () => {
    if (!topicId || !topicNameVal.trim()) return;
    setTopicSaving(true);
    const { error } = await supabase.from("topics").update({ name: topicNameVal.trim() }).eq("id", topicId);
    if (error) { setTopicErr(error.message); setTopicSaving(false); return; }
    setAllTopics(p => p.map(t => t.id === topicId ? { ...t, name: topicNameVal.trim() } : t));
    setTopicMode("select"); setTopicSaving(false);
  };

  const createTopic = async () => {
    if (!subjectId || !topicNameVal.trim()) { setTopicErr("Select a subject first"); return; }
    setTopicSaving(true);
    const slug = (topicNameVal.trim().toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/^-+|-+$/g, "") || "topic")
               + "-" + Math.random().toString(36).slice(2, 9);
    const { data, error } = await supabase.from("topics")
      .insert({ name: topicNameVal.trim(), subject_id: subjectId, slug }).select().single();
    if (error) { setTopicErr(error.message); setTopicSaving(false); return; }
    setAllTopics(p => [...p, data]);
    setTopicId(data.id);
    setTopicMode("select"); setTopicSaving(false); setTopicNameVal("");
  };

  const saveSubtopicName = async () => {
    if (!subtopicId || !subtopicNameVal.trim()) return;
    setSubtopicSaving(true);
    const { error } = await supabase.from("subtopics").update({ name: subtopicNameVal.trim() }).eq("id", subtopicId);
    if (error) { setSubtopicErr(error.message); setSubtopicSaving(false); return; }
    setAllSubtopics(p => p.map(s => s.id === subtopicId ? { ...s, name: subtopicNameVal.trim() } : s));
    setSubtopicMode("select"); setSubtopicSaving(false);
  };

  const createSubtopic = async () => {
    if (!topicId || !subtopicNameVal.trim()) { setSubtopicErr("Select a topic first"); return; }
    setSubtopicSaving(true);
    const slug = (subtopicNameVal.trim().toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/^-+|-+$/g, "") || "subtopic")
               + "-" + Math.random().toString(36).slice(2, 9);
    const { data, error } = await supabase.from("subtopics")
      .insert({ name: subtopicNameVal.trim(), topic_id: topicId, slug }).select().single();
    if (error) { setSubtopicErr(error.message); setSubtopicSaving(false); return; }
    setAllSubtopics(p => [...p, data]);
    setSubtopicId(data.id);
    setSubtopicMode("select"); setSubtopicSaving(false); setSubtopicNameVal("");
  };

  const handleSave = async () => {
    if (!question.trim()) { setError("Question cannot be empty"); setActiveTab("content"); return; }
    if (isMcqType && (!options.a.trim() || !options.b.trim() || !options.c.trim() || !options.d.trim())) {
      setError("All four options required for MCQ"); setActiveTab("content"); return;
    }
    setSaving(true); setError("");
    const tagsArr = tags.split(",").map(t => t.trim()).filter(Boolean);

    const { error: dbErr } = await supabase.from("problems").update({
      question:       question.trim(),
      option_a:       options.a.trim() || null,
      option_b:       options.b.trim() || null,
      option_c:       options.c.trim() || null,
      option_d:       options.d.trim() || null,
      correct_answer: correctAnswer    || null,
      explanation:    isMcqType ? (explanation.trim() || null) : null,
      explanation_a:  !isMcqType ? (cqExpls.a.trim() || null) : null,
      explanation_b:  !isMcqType ? (cqExpls.b.trim() || null) : null,
      explanation_c:  !isMcqType ? (cqExpls.c.trim() || null) : null,
      explanation_d:  !isMcqType ? (cqExpls.d.trim() || null) : null,
      difficulty,
      tags:           tagsArr.length ? tagsArr : null,
      source:         source.trim()  || null,
      is_free:        isFree,
      subject_id:     subjectId  || null,
      topic_id:       topicId    || null,
      subtopic_id:    subtopicId || null,
      problem_type:   problemType,
      updated_at:     new Date().toISOString(),
    }).eq("id", problem.id);

    setSaving(false);
    if (dbErr) { setError("DB error: " + dbErr.message); return; }

    onSave({
      question,
      option_a: options.a || null, option_b: options.b || null,
      option_c: options.c || null, option_d: options.d || null,
      correct_answer: correctAnswer || null,
      explanation:    isMcqType ? (explanation || null) : null,
      explanation_a:  !isMcqType ? (cqExpls.a || null) : null,
      explanation_b:  !isMcqType ? (cqExpls.b || null) : null,
      explanation_c:  !isMcqType ? (cqExpls.c || null) : null,
      explanation_d:  !isMcqType ? (cqExpls.d || null) : null,
      difficulty, is_free: isFree,
      tags:        tagsArr.length ? tagsArr : null,
      source:      source || null,
      subject_id:  subjectId  || null,
      topic_id:    topicId    || null,
      subtopic_id: subtopicId || null,
      problem_type: problemType,
    } as any);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-5xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl
                      flex flex-col max-h-[95vh] h-[95vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30
                            flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-100">Edit Problem</p>
              <p className="text-[11px] text-zinc-600 font-mono">{problem.id}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg
                       text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 px-6 py-3 border-b border-zinc-800 shrink-0 overflow-x-auto">
          <Tab active={activeTab === "content"}        icon={AlignLeft}   label="Content"        onClick={() => setActiveTab("content")} />
          <Tab active={activeTab === "classification"} icon={CheckSquare} label="Classification" onClick={() => setActiveTab("classification")} />
          <Tab active={activeTab === "meta"}           icon={Settings}    label="Meta & Tags"    onClick={() => setActiveTab("meta")} />
          <div className="ml-auto shrink-0">
            <span className={`text-[11px] font-mono px-2.5 py-1 rounded-full border ${
              isMcqType
                ? "text-sky-400 border-sky-400/30 bg-sky-400/10"
                : "text-amber-400 border-amber-400/30 bg-amber-400/10"
            }`}>{isMcqType ? "MCQ" : "CQ"}</span>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* ── CONTENT ── */}
          {activeTab === "content" && (
            <div className="space-y-5">

              {/* Type selector */}
              <div>
                <SectionLabel>Question Type</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "board_mcq",         label: "Board MCQ",         color: "sky"    },
                    { value: "admission_mcq",      label: "Admission MCQ",     color: "cyan"   },
                    { value: "board_cq",           label: "Board CQ",          color: "amber"  },
                    { value: "board_written",      label: "Board Written",     color: "orange" },
                    { value: "admission_written",  label: "Admission Written", color: "rose"   },
                    { value: "practice",           label: "Practice",          color: "violet" },
                  ].map(({ value, label, color }) => (
                    <button key={value} type="button" onClick={() => setProblemType(value)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        problemType === value
                          ? `border-${color}-400/50 bg-${color}-400/10 text-${color}-400`
                          : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                      }`}>{label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question stem */}
              <div>
                <SectionLabel>Question Stem</SectionLabel>
                <LaTeXField label="" value={question} onChange={setQuestion} rows={4}
                  placeholder="LaTeX supported — $math$, $$display$$, \begin{tikzpicture}..." />
              </div>

              {/* MCQ options */}
              {isMcqType && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <SectionLabel>Options</SectionLabel>
                    <p className="text-[11px] text-amber-400/70 font-mono">Click letter → correct answer</p>
                  </div>
                  <div className="space-y-3">
                    {(["a","b","c","d"] as const).map(key => (
                      <div key={key} className="flex items-start gap-3">
                        <button type="button" onClick={() => setCorrectAnswer(key)}
                          className={`mt-6 w-9 h-9 shrink-0 rounded-xl flex items-center justify-center
                                      text-sm font-bold font-mono transition-all ${
                            correctAnswer === key
                              ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20 ring-2 ring-violet-500/40"
                              : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
                          }`}>{key.toUpperCase()}
                        </button>
                        <div className="flex-1">
                          <LaTeXField
                            label={`Option ${key.toUpperCase()}${correctAnswer === key ? " — ✓ correct" : ""}`}
                            value={options[key] ?? ""} rows={2}
                            isCorrect={correctAnswer === key}
                            onChange={v => setOptions(o => ({ ...o, [key]: v }))}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CQ sub-questions */}
              {!isMcqType && (
                <div>
                  <SectionLabel>Sub-questions</SectionLabel>
                  <div className="space-y-3">
                    {(["a","b","c","d"] as const).map((key, i) => {
                      const isOpen = cqExplOpen === i;
                      return (
                        <div key={key} className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/30">

                          {/* Label row */}
                          <div className="flex items-center gap-3 px-4 pt-3 pb-2">
                            <div className="w-9 h-9 shrink-0 rounded-xl bg-zinc-800 border border-zinc-700
                                            flex flex-col items-center justify-center">
                              <span className="text-sm font-semibold text-zinc-200">{CQ_LABELS[i]}</span>
                              <span className="text-[10px] text-zinc-600 font-mono">{CQ_MARKS[i]}</span>
                            </div>
                            <span className="text-xs font-mono text-zinc-400 flex-1">Sub-question {CQ_LABELS[i]}</span>
                          </div>

                          {/* Sub-question text */}
                          <div className="px-4 pb-3">
                            <LaTeXField label="" value={options[key] ?? ""} rows={2}
                              placeholder={`${CQ_LABELS[i]} প্রশ্ন লিখুন…`}
                              onChange={v => setOptions(o => ({ ...o, [key]: v }))} />
                          </div>

                          {/* Explanation accordion */}
                          <div className="border-t border-zinc-800/60">
                            <button type="button"
                              onClick={() => setCqExplOpen(isOpen ? null : i)}
                              className="w-full flex items-center justify-between px-4 py-2.5
                                         text-xs font-mono hover:bg-zinc-800/40 transition-colors">
                              <span className={cqExpls[key] ? "text-emerald-400" : "text-amber-400/70"}>
                                {CQ_LABELS[i]} — সমাধান {cqExpls[key] && "✓"}
                              </span>
                              <ChevronDown className={`w-3.5 h-3.5 text-zinc-600 transition-transform
                                                        duration-200 ${isOpen ? "rotate-180" : ""}`} />
                            </button>
                            {isOpen && (
                              <div className="px-4 pb-4 pt-2 bg-zinc-950/50">
                                <CqExplField
                                  value={cqExpls[key]}
                                  placeholder={`${CQ_LABELS[i]} সমাধান লিখুন…`}
                                  onChange={v => setCqExpls(p => ({ ...p, [key]: v }))}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MCQ explanation */}
              {isMcqType && (
                <div>
                  <SectionLabel>Explanation (optional)</SectionLabel>
                  <LaTeXField label="" value={explanation} onChange={setExplanation}
                    rows={4} placeholder="Step-by-step solution…" />
                </div>
              )}
            </div>
          )}

          {/* ── CLASSIFICATION ── */}
          {activeTab === "classification" && (
            <div className="space-y-5">

              <div>
                <SectionLabel>Subject</SectionLabel>
                <select value={subjectId}
                  onChange={e => { setSubjectId(e.target.value); setTopicId(""); setSubtopicId(""); }}
                  className={SEL}>
                  <option value="">— select subject —</option>
                  {allSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <SectionLabel>Topic</SectionLabel>
                  <div className="flex gap-2">
                    {topicId && topicMode === "select" && (
                      <button type="button" onClick={() => { setTopicNameVal(allTopics.find(t => t.id === topicId)?.name ?? ""); setTopicMode("rename"); setTopicErr(""); }}
                        className="text-[11px] text-zinc-500 hover:text-violet-400 font-mono transition-colors">✎ rename</button>
                    )}
                    {topicMode === "select" && (
                      <button type="button" onClick={() => { setTopicNameVal(""); setTopicMode("create"); setTopicErr(""); }}
                        className="text-[11px] text-emerald-500 hover:text-emerald-400 font-mono transition-colors">+ new</button>
                    )}
                    {topicMode !== "select" && (
                      <button type="button" onClick={() => { setTopicMode("select"); setTopicErr(""); }}
                        className="text-[11px] text-zinc-600 hover:text-zinc-400 font-mono transition-colors">✕ cancel</button>
                    )}
                  </div>
                </div>
                {topicMode !== "select" ? (
                  <InlineCreate mode={topicMode} value={topicNameVal} onChange={setTopicNameVal}
                    onSave={topicMode === "create" ? createTopic : saveTopicName}
                    onCancel={() => { setTopicMode("select"); setTopicErr(""); }}
                    saving={topicSaving} error={topicErr}
                    placeholder={topicMode === "create" ? "New topic name…" : "Rename topic…"} />
                ) : (
                  <select value={topicId}
                    onChange={e => { setTopicId(e.target.value); setSubtopicId(""); setSubtopicMode("select"); }}
                    disabled={!subjectId} className={SEL + " disabled:opacity-40"}>
                    <option value="">— select topic —</option>
                    {filteredTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <SectionLabel>Subtopic</SectionLabel>
                  <div className="flex gap-2">
                    {subtopicId && subtopicMode === "select" && (
                      <button type="button" onClick={() => { setSubtopicNameVal(allSubtopics.find(s => s.id === subtopicId)?.name ?? ""); setSubtopicMode("rename"); setSubtopicErr(""); }}
                        className="text-[11px] text-zinc-500 hover:text-violet-400 font-mono transition-colors">✎ rename</button>
                    )}
                    {subtopicMode === "select" && (
                      <button type="button" disabled={!topicId} onClick={() => { setSubtopicNameVal(""); setSubtopicMode("create"); setSubtopicErr(""); }}
                        className="text-[11px] text-emerald-500 hover:text-emerald-400 disabled:opacity-30 font-mono transition-colors">+ new</button>
                    )}
                    {subtopicMode !== "select" && (
                      <button type="button" onClick={() => { setSubtopicMode("select"); setSubtopicErr(""); }}
                        className="text-[11px] text-zinc-600 hover:text-zinc-400 font-mono transition-colors">✕ cancel</button>
                    )}
                  </div>
                </div>
                {subtopicMode !== "select" ? (
                  <InlineCreate mode={subtopicMode} value={subtopicNameVal} onChange={setSubtopicNameVal}
                    onSave={subtopicMode === "create" ? createSubtopic : saveSubtopicName}
                    onCancel={() => { setSubtopicMode("select"); setSubtopicErr(""); }}
                    saving={subtopicSaving} error={subtopicErr}
                    placeholder={subtopicMode === "create" ? "New subtopic name…" : "Rename subtopic…"} />
                ) : (
                  <select value={subtopicId} onChange={e => setSubtopicId(e.target.value)}
                    disabled={!topicId} className={SEL + " disabled:opacity-40"}>
                    <option value="">— none —</option>
                    {allSubtopics.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <SectionLabel>Difficulty</SectionLabel>
                  <div className="flex gap-2">
                    {(["easy","medium","hard"] as const).map(d => (
                      <button key={d} type="button" onClick={() => setDifficulty(d)}
                        className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all capitalize ${
                          difficulty === d
                            ? d === "easy"   ? "border-emerald-400 bg-emerald-400/10 text-emerald-400"
                            : d === "medium" ? "border-amber-400   bg-amber-400/10   text-amber-400"
                            :                  "border-red-400     bg-red-400/10     text-red-400"
                            : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
                        }`}>{d}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <SectionLabel>Access</SectionLabel>
                  <div className="flex gap-2">
                    {([["Free", true], ["Pro", false]] as const).map(([label, val]) => (
                      <button key={label} type="button" onClick={() => setIsFree(val)}
                        className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          isFree === val
                            ? val ? "border-sky-400 bg-sky-400/10 text-sky-400" : "border-violet-400 bg-violet-400/10 text-violet-400"
                            : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
                        }`}>{label}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── META & TAGS ── */}
          {activeTab === "meta" && (
            <div className="space-y-5">
              <div>
                <SectionLabel>Previous Year Tags</SectionLabel>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {INSTITUTES.map(({ key, label, color }) => (
                    <button key={key} type="button" onClick={() => setPickerInst(pickerInst === key ? "" : key)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        pickerInst === key ? INST_COLORS[color] : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 bg-zinc-900"
                      }`}>{label}
                    </button>
                  ))}
                </div>
                {pickerInst && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3 mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {YEARS.map(yr => (
                        <button key={yr} type="button" onClick={() => setPickerYear(yr)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition-all ${
                            pickerYear === yr ? "border-violet-400 bg-violet-400/10 text-violet-300" : "border-zinc-800 text-zinc-500 hover:border-zinc-600 bg-zinc-900"
                          }`}>{yr}</button>
                      ))}
                    </div>
                    <button type="button"
                      onClick={() => { setTags([...tagList, `${pickerInst}: ${pickerYear}`].join(", ")); setPickerInst(""); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-xs font-semibold transition-all">
                      <Tag className="w-3 h-3" /> Add {pickerInst}: {pickerYear}
                    </button>
                  </div>
                )}
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                  <input value={tags} onChange={e => setTags(e.target.value)}
                    placeholder="Custom tags, comma-separated…"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-700 outline-none transition-all" />
                </div>
                {tagList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tagList.map(tag => {
                      const parsed    = parseInstTag(tag);
                      const instColor = parsed ? INST_COLORS[INSTITUTES.find(i => i.key === parsed.inst)?.color ?? ""] ?? "" : "";
                      return (
                        <span key={tag} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-mono ${instColor || "bg-zinc-800 border-zinc-700 text-zinc-400"}`}>
                          {tag}
                          <button type="button" onClick={() => setTags(tagList.filter(t => t !== tag).join(", "))}
                            className="text-zinc-500 hover:text-red-400 transition-colors leading-none">×</button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <SectionLabel>Source (optional)</SectionLabel>
                <input value={source} onChange={e => setSource(e.target.value)}
                  placeholder="e.g. BUET 2024, Hossain Sir Book Ch-3"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500/50 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-700 outline-none transition-all" />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/60 shrink-0">
          <button onClick={onClose} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-violet-500 hover:bg-violet-400 disabled:opacity-50
                       text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}
