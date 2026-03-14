"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2, Save, Tag, X } from "lucide-react";
import LaTeXField from "./LaTeXField";
import { Problem, Subject, Topic, Subtopic, INSTITUTES, INST_COLORS, getYears, parseInstTag } from "../types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const YEARS = getYears();

export default function EditModal({ problem, onClose, onSave }: {
  problem: Problem;
  onClose: () => void;
  onSave:  (updated: Partial<Problem>) => void;
}) {
  const [question,      setQuestion]      = useState(problem.question ?? "");
  const [options,       setOptions]       = useState({
    a: problem.option_a ?? "", b: problem.option_b ?? "",
    c: problem.option_c ?? "", d: problem.option_d ?? "",
  });
  const [correctAnswer, setCorrectAnswer] = useState(problem.correct_answer ?? "");
  const [explanation,   setExplanation]   = useState(problem.explanation ?? "");
  const [difficulty,    setDifficulty]    = useState(problem.difficulty);
  const [tags,          setTags]          = useState(problem.tags?.join(", ") ?? "");
  const [source,        setSource]        = useState(problem.source ?? "");
  const [isFree,        setIsFree]        = useState(problem.is_free);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState("");
  const [pickerInst,    setPickerInst]    = useState("");
  const [pickerYear,    setPickerYear]    = useState(YEARS[1]);

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

  const isMcqType = problemType.includes("mcq");

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
    supabase.from("subtopics").select("id, name, topic_id").eq("topic_id", topicId).order("sort_order")
      .then(({ data }) => setAllSubtopics(data || []));
  }, [topicId]);

  const filteredTopics = subjectId ? allTopics.filter(t => t.subject_id === subjectId) : allTopics;
  const tagList = tags.split(",").map(t => t.trim()).filter(Boolean);

  const saveTopicName = async () => {
    if (!topicId || !topicNameVal.trim()) return;
    setTopicSaving(true);
    const { error } = await supabase.from("topics").update({ name: topicNameVal.trim() }).eq("id", topicId);
    if (error) { setTopicErr(error.message); setTopicSaving(false); return; }
    setAllTopics(prev => prev.map(t => t.id === topicId ? { ...t, name: topicNameVal.trim() } : t));
    setTopicMode("select"); setTopicSaving(false);
  };

  const createTopic = async () => {
    if (!subjectId || !topicNameVal.trim()) { setTopicErr("Select a subject first"); return; }
    setTopicSaving(true);
    const slug = topicNameVal.trim().toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now();
    const { data, error } = await supabase.from("topics")
      .insert({ name: topicNameVal.trim(), subject_id: subjectId, slug }).select().single();
    if (error) { setTopicErr(error.message); setTopicSaving(false); return; }
    setAllTopics(prev => [...prev, data]);
    setTopicId(data.id);
    setTopicMode("select"); setTopicSaving(false); setTopicNameVal("");
  };

  const saveSubtopicName = async () => {
    if (!subtopicId || !subtopicNameVal.trim()) return;
    setSubtopicSaving(true);
    const { error } = await supabase.from("subtopics").update({ name: subtopicNameVal.trim() }).eq("id", subtopicId);
    if (error) { setSubtopicErr(error.message); setSubtopicSaving(false); return; }
    setAllSubtopics(prev => prev.map(s => s.id === subtopicId ? { ...s, name: subtopicNameVal.trim() } : s));
    setSubtopicMode("select"); setSubtopicSaving(false);
  };

  const createSubtopic = async () => {
    if (!topicId || !subtopicNameVal.trim()) { setSubtopicErr("Select a topic first"); return; }
    setSubtopicSaving(true);
    const slug = subtopicNameVal.trim().toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now();
    const { data, error } = await supabase.from("subtopics")
      .insert({ name: subtopicNameVal.trim(), topic_id: topicId, slug }).select().single();
    if (error) { setSubtopicErr(error.message); setSubtopicSaving(false); return; }
    setAllSubtopics(prev => [...prev, data]);
    setSubtopicId(data.id);
    setSubtopicMode("select"); setSubtopicSaving(false); setSubtopicNameVal("");
  };

  const handleSave = async () => {
    if (!question.trim()) { setError("Question cannot be empty"); return; }
    if (isMcqType && (!options.a.trim() || !options.b.trim() || !options.c.trim() || !options.d.trim())) {
      setError("All four options required for MCQ"); return;
    }
    setSaving(true); setError("");
    const tagsArr = tags.split(",").map(t => t.trim()).filter(Boolean);
    const { error: dbErr } = await supabase.from("problems").update({
      question: question.trim(),
      option_a: options.a.trim() || null, option_b: options.b.trim() || null,
      option_c: options.c.trim() || null, option_d: options.d.trim() || null,
      correct_answer: correctAnswer || null,
      explanation: explanation.trim() || null,
      difficulty, tags: tagsArr.length ? tagsArr : null,
      source: source.trim() || null, is_free: isFree,
      subject_id: subjectId || null, topic_id: topicId || null,
      subtopic_id: subtopicId || null, problem_type: problemType,
      updated_at: new Date().toISOString(),
    }).eq("id", problem.id);
    setSaving(false);
    if (dbErr) { setError("DB error: " + dbErr.message); return; }
    onSave({
      question, explanation: explanation || null, source: source || null,
      option_a: options.a || null, option_b: options.b || null,
      option_c: options.c || null, option_d: options.d || null,
      correct_answer: correctAnswer || null, difficulty, is_free: isFree,
      tags: tagsArr.length ? tagsArr : null,
      subject_id: subjectId || null, topic_id: topicId || null,
      subtopic_id: subtopicId || null, problem_type: problemType,
    } as any);
    onClose();
  };

  const sel = "w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500/50 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none transition-all appearance-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-5xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col max-h-[95vh] h-[95vh]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <div>
            <p className="text-xs text-violet-400 font-mono tracking-widest">ADMIN · EDIT PROBLEM</p>
            <p className="text-xs text-zinc-600 font-mono mt-0.5 truncate max-w-sm">{problem.id}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* Subject / Topic / Subtopic / Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">Subject</p>
              <select value={subjectId} onChange={e => { setSubjectId(e.target.value); setTopicId(""); setSubtopicId(""); }} className={sel}>
                <option value="">— select subject —</option>
                {allSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Topic</p>
                <div className="flex gap-2">
                  {topicId && topicMode === "select" && (
                    <button type="button" onClick={() => { setTopicNameVal(allTopics.find(t => t.id === topicId)?.name ?? ""); setTopicMode("rename"); setTopicErr(""); }}
                      className="text-xs text-zinc-500 hover:text-violet-400 transition-colors">✎ rename</button>
                  )}
                  {topicMode === "select" && (
                    <button type="button" onClick={() => { setTopicNameVal(""); setTopicMode("create"); setTopicErr(""); }}
                      className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors">+ new</button>
                  )}
                  {topicMode !== "select" && (
                    <button type="button" onClick={() => { setTopicMode("select"); setTopicErr(""); }}
                      className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">✕ cancel</button>
                  )}
                </div>
              </div>
              {topicMode !== "select" ? (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <input autoFocus value={topicNameVal} onChange={e => setTopicNameVal(e.target.value)}
                      placeholder={topicMode === "create" ? "New topic name…" : "Rename topic…"}
                      onKeyDown={e => { if (e.key === "Enter") topicMode === "create" ? createTopic() : saveTopicName(); if (e.key === "Escape") setTopicMode("select"); }}
                      className="flex-1 bg-zinc-950 border border-violet-500/50 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none" />
                    <button type="button" disabled={topicSaving} onClick={topicMode === "create" ? createTopic : saveTopicName}
                      className="px-4 py-2 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white text-xs rounded-xl font-semibold transition-colors whitespace-nowrap">
                      {topicSaving ? "…" : topicMode === "create" ? "Create" : "Save"}
                    </button>
                  </div>
                  {topicErr && <p className="text-xs text-red-400">{topicErr}</p>}
                </div>
              ) : (
                <select value={topicId} onChange={e => { setTopicId(e.target.value); setSubtopicId(""); setSubtopicMode("select"); }}
                  disabled={!subjectId} className={sel + " disabled:opacity-40"}>
                  <option value="">— select topic —</option>
                  {filteredTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Subtopic</p>
                <div className="flex gap-2">
                  {subtopicId && subtopicMode === "select" && (
                    <button type="button" onClick={() => { setSubtopicNameVal(allSubtopics.find(s => s.id === subtopicId)?.name ?? ""); setSubtopicMode("rename"); setSubtopicErr(""); }}
                      className="text-xs text-zinc-500 hover:text-violet-400 transition-colors">✎ rename</button>
                  )}
                  {subtopicMode === "select" && (
                    <button type="button" onClick={() => { setSubtopicNameVal(""); setSubtopicMode("create"); setSubtopicErr(""); }}
                      disabled={!topicId} className="text-xs text-emerald-500 hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">+ new</button>
                  )}
                  {subtopicMode !== "select" && (
                    <button type="button" onClick={() => { setSubtopicMode("select"); setSubtopicErr(""); }}
                      className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">✕ cancel</button>
                  )}
                </div>
              </div>
              {subtopicMode !== "select" ? (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <input autoFocus value={subtopicNameVal} onChange={e => setSubtopicNameVal(e.target.value)}
                      placeholder={subtopicMode === "create" ? "New subtopic name…" : "Rename subtopic…"}
                      onKeyDown={e => { if (e.key === "Enter") subtopicMode === "create" ? createSubtopic() : saveSubtopicName(); if (e.key === "Escape") setSubtopicMode("select"); }}
                      className="flex-1 bg-zinc-950 border border-violet-500/50 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none" />
                    <button type="button" disabled={subtopicSaving} onClick={subtopicMode === "create" ? createSubtopic : saveSubtopicName}
                      className="px-4 py-2 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white text-xs rounded-xl font-semibold transition-colors whitespace-nowrap">
                      {subtopicSaving ? "…" : subtopicMode === "create" ? "Create" : "Save"}
                    </button>
                  </div>
                  {subtopicErr && <p className="text-xs text-red-400">{subtopicErr}</p>}
                </div>
              ) : (
                <select value={subtopicId} onChange={e => setSubtopicId(e.target.value)}
                  disabled={!topicId} className={sel + " disabled:opacity-40"}>
                  <option value="">— none —</option>
                  {allSubtopics.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>

            <div>
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">Question Type</p>
              <select value={problemType} onChange={e => setProblemType(e.target.value)} className={sel}>
                <option value="board_mcq">Board MCQ</option>
                <option value="admission_mcq">Admission MCQ</option>
                <option value="board_cq">Board CQ</option>
                <option value="board_written">Board Written</option>
                <option value="admission_written">Admission Written</option>
                <option value="practice">Practice</option>
              </select>
            </div>
          </div>

          <LaTeXField label="QUESTION" value={question} onChange={setQuestion} rows={4}
            placeholder="LaTeX supported — $math$, $$display$$, \begin{tikzpicture}...\end{tikzpicture}" />

          {/* Options — CQ or MCQ */}
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                {isMcqType ? "Options" : "Sub-questions ক খ গ ঘ"}
              </p>
              {isMcqType && <p className="text-xs text-amber-400/70">Click letter to set correct answer</p>}
            </div>
            <div className="space-y-4">
              {(["a","b","c","d"] as const).map((key, i) => (
                <div key={key} className="flex items-start gap-3">
                  {isMcqType ? (
                    <button type="button" onClick={() => setCorrectAnswer(key)}
                      className={`mt-6 w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-sm font-bold font-mono transition-all ${
                        correctAnswer === key
                          ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20 ring-2 ring-violet-500/40"
                          : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
                      }`}>{key.toUpperCase()}</button>
                  ) : (
                    <div className="mt-6 w-9 h-9 shrink-0 rounded-xl bg-zinc-800 border border-zinc-700 flex flex-col items-center justify-center">
                      <span className="text-sm font-semibold text-zinc-200">{["ক","খ","গ","ঘ"][i]}</span>
                      <span className="text-[10px] text-zinc-600 font-mono">{["১","২","৩","৪"][i]}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <LaTeXField
                      label={isMcqType
                        ? `OPTION ${key.toUpperCase()}${correctAnswer === key ? " — ✓ correct" : ""}`
                        : `Sub-question ${["ক","খ","গ","ঘ"][i]}`}
                      value={options[key] ?? ""}
                      onChange={v => setOptions(o => ({ ...o, [key]: v }))}
                      rows={2}
                      isCorrect={isMcqType && correctAnswer === key}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <LaTeXField label="EXPLANATION (optional)" value={explanation} onChange={setExplanation} rows={8} autoGrow
            placeholder="Step-by-step solution..." />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">Difficulty</p>
              <div className="flex gap-2">
                {(["easy","medium","hard"] as const).map(d => (
                  <button key={d} type="button" onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all capitalize ${
                      difficulty === d
                        ? d === "easy" ? "border-emerald-400 bg-emerald-400/10 text-violet-400"
                        : d === "medium" ? "border-amber-400 bg-amber-400/10 text-amber-400"
                        : "border-red-400 bg-red-400/10 text-red-400"
                        : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
                    }`}>{d}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">Access</p>
              <div className="flex gap-2">
                {([["free", true], ["pro", false]] as const).map(([label, val]) => (
                  <button key={label} type="button" onClick={() => setIsFree(val)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all capitalize ${
                      isFree === val
                        ? val ? "border-sky-400 bg-sky-400/10 text-sky-400" : "border-violet-400 bg-violet-400/10 text-violet-400"
                        : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
                    }`}>{label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Previous Year Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {INSTITUTES.map(({ key, label, color }) => {
                const isSelected = pickerInst === key;
                return (
                  <button key={key} type="button" onClick={() => setPickerInst(isSelected ? "" : key)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                      isSelected ? INST_COLORS[color] : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 bg-zinc-900"
                    }`}>{label}</button>
                );
              })}
            </div>
            {pickerInst && (
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-zinc-600">Year:</p>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {YEARS.map(yr => (
                    <button key={yr} type="button" onClick={() => setPickerYear(yr)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition-all ${
                        pickerYear === yr ? "border-violet-400 bg-violet-400/10 text-violet-300" : "border-zinc-800 text-zinc-500 hover:border-zinc-600 bg-zinc-900"
                      }`}>{yr}</button>
                  ))}
                </div>
                <button type="button" onClick={() => { setTags([...tagList, `${pickerInst}: ${pickerYear}`].join(", ")); setPickerInst(""); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-xs font-semibold transition-all shrink-0">
                  <Tag className="w-3 h-3" /> Add {pickerInst}: {pickerYear}
                </button>
              </div>
            )}
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
              <input value={tags} onChange={e => setTags(e.target.value)}
                placeholder="Custom tags comma-separated…"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-700 outline-none transition-all" />
            </div>
            {tagList.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tagList.map(tag => {
                  const parsed = parseInstTag(tag);
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
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1.5">Source <span className="normal-case text-zinc-700">(optional)</span></p>
            <input value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. BUET 2024"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500/50 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-700 outline-none transition-all" />
          </div>

          {error && <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-4 py-3 rounded-xl">{error}</p>}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Cancel</button>
            {error && <p className="text-xs text-red-400 max-w-sm truncate">{error}</p>}
          </div>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}
