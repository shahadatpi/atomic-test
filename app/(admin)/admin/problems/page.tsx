"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import katex from "katex";
import TikZRenderer from "@/components/math/TikZRenderer";
import {
  Search, ChevronDown, Loader2,
  BookOpen, CheckCircle, Trash2,
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

/* ── Strip TikZ for collapsed preview ───────────────────────────────────── */
function stripTikz(text: string): string {
  if (text.trimStart().startsWith("\\documentclass")) {
    return "📊 [Diagram — expand to view]";
  }
  return text
      .replace(/\\begin\{center\}[\s\S]*?\\end\{center\}/g,       "📊 [Diagram — expand to view]")
      .replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g, "📊 [Diagram — expand to view]")
      .replace(/\\begin\{circuitikz\}[\s\S]*?\\end\{circuitikz\}/g,   "📊 [Diagram — expand to view]");
}

/* ── TikZ extraction ─────────────────────────────────────────────────────── */
function extractTikz(text: string): string {
  // Case 0: entire field is a standalone LaTeX document
  if (text.trimStart().startsWith("\\documentclass")) {
    return `%%TIKZ:${encodeURIComponent(text.trim())}%%`;
  }

  // Case 1: bare tikz/circuitikz blocks (possibly inside \begin{center})
  return text
      .replace(/\\begin\{center\}([\s\S]*?)\\end\{center\}/g, (_, inner) => inner.trim())
      .replace(/\\centering\b/g, "")
      .replace(
          /\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g,
          (match) => `%%TIKZ:${encodeURIComponent(match)}%%`
      )
      .replace(
          /\\begin\{circuitikz\}[\s\S]*?\\end\{circuitikz\}/g,
          (match) => `%%TIKZ:${encodeURIComponent(match)}%%`
      );
}

/* ── MathText helpers ────────────────────────────────────────────────────── */
function normaliseMath(text: string): string {
  return text
      .replace(/\\mathlarger\{([^}]*)\}/g, (_, m) => m)
      .replace(/\\\[([\s\S]*?)\\\]/g,  (_, m) => `$$${m}$$`)
      .replace(/\\\(([\s\S]*?)\\\)/g,  (_, m) => `$${m}$`)
      .replace(/\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}/g,
          (_, env, body) => `$$\\begin{${env}}${body}\\end{${env}}$$`);
}

function preprocessText(text: string): string {
  return text
      .replace(/\\section\*\{([^}]*)\}/g,    (_, m) => `\n**${m}**\n`)
      .replace(/\\section\{([^}]*)\}/g,       (_, m) => `\n**${m}**\n`)
      .replace(/\\subsection\*\{([^}]*)\}/g,  (_, m) => `\n**${m}**\n`)
      .replace(/\\subsection\{([^}]*)\}/g,    (_, m) => `\n**${m}**\n`)
      .replace(/\\boxed\{([^}]*)\}/g, (_, m) =>
          /^[0-9+\-*/=^_.,() \\]+$/.test(m) ? `$\\boxed{${m}}$` : `%%BOX:${m}%%`
      )
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
      return <strong key={i} className="text-zinc-100 font-semibold">{p.slice(2, -2)}</strong>;
    if (p.startsWith("_") && p.endsWith("_"))
      return <em key={i}>{p.slice(1, -1)}</em>;
    if (p.startsWith("`") && p.endsWith("`"))
      return <code key={i} className="font-mono text-emerald-400 bg-zinc-800 px-1 rounded">{p.slice(1, -1)}</code>;
    if (p.startsWith("%%BOX:") && p.endsWith("%%"))
      return (
          <span key={i} className="inline-block border border-emerald-400/60 text-emerald-300 rounded px-2 py-0.5 text-xs font-semibold mx-0.5 align-middle">
          {p.slice(6, -2)}
        </span>
      );
    return <span key={i}>{p}</span>;
  });
}

function MathText({ text }: { text: string }) {
  if (!text) return null;
  // extractTikz FIRST — handles both full documents and bare tikz blocks
  const processed = normaliseMath(preprocessText(extractTikz(text)));
  const parts = processed.split(/(%%TIKZ:[\s\S]*?%%|\$\$[\s\S]*?\$\$|\$[^$]*?\$)/g);
  return (
      <>
        {parts.map((p, i) => {
          if (p.startsWith("%%TIKZ:") && p.endsWith("%%")) {
            const code = decodeURIComponent(p.slice(7, -2));
            return <TikZRenderer key={i} code={code} />;
          }
          try {
            if (p.startsWith("$$") && p.endsWith("$$"))
            { const h = katex.renderToString(p.slice(2,-2),{throwOnError:false,displayMode:true}); return <span key={i} dangerouslySetInnerHTML={{__html:h}} style={{display:"block"}} />; }
            if (p.startsWith("$") && p.endsWith("$"))
            { const h = katex.renderToString(p.slice(1,-1),{throwOnError:false,displayMode:false}); return <span key={i} dangerouslySetInnerHTML={{__html:h}} />; }
          } catch {
            return <span key={i} className="text-red-400 text-xs">[LaTeX error]</span>;
          }
          return <span key={i}>{renderInlineMarkdown(p)}</span>;
        })}
      </>
  );
}

/* ── Difficulty badge ────────────────────────────────────────────────────── */
function DiffBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    easy:   "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
    medium: "text-amber-400   border-amber-400/30   bg-amber-400/10",
    hard:   "text-red-400     border-red-400/30     bg-red-400/10",
  };
  return (
      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-mono ${styles[level] ?? "text-zinc-400 border-zinc-700"}`}>
      {level}
    </span>
  );
}

/* ── Problem card ────────────────────────────────────────────────────────── */
function ProblemCard({ problem, onDelete, number }: {
  problem: Problem;
  onDelete: (id: string) => void;
  number: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [explOpen, setExplOpen] = useState(false);
  const OPTIONS = ["a", "b", "c", "d"] as const;

  return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors">
        <div className="px-5 py-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mt-0.5">
              <span className="text-xs font-mono font-bold text-zinc-500">{number}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs text-zinc-600 font-mono">
                {problem.subjects?.name} · {problem.topics?.name}
                {problem.subtopics?.name && (
                    <> · <span className="text-zinc-500">{problem.subtopics.name}</span></>
                )}
              </span>
                <DiffBadge level={problem.difficulty} />
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-mono ${
                    problem.is_free
                        ? "text-sky-400 border-sky-400/30 bg-sky-400/10"
                        : "text-violet-400 border-violet-400/30 bg-violet-400/10"
                }`}>
                {problem.is_free ? "Free" : "Pro"}
              </span>
                {problem.source && (
                    <span className="text-xs text-zinc-600">{problem.source}</span>
                )}
              </div>

              {/* Lazy: strip diagrams when collapsed, full render when expanded */}
              <div className="text-sm text-zinc-200 leading-relaxed">
                {expanded
                    ? <MathText text={problem.question} />
                    : <MathText text={stripTikz(problem.question)} />
                }
              </div>

              {problem.tags?.length ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {problem.tags.map(tag => (
                        <span key={tag} className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                    ))}
                  </div>
              ) : null}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                  onClick={(e) => { e.stopPropagation(); onDelete(problem.id); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <ChevronDown className={`w-4 h-4 text-zinc-600 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
            </div>
          </div>
        </div>

        {expanded && (
            <div className="border-t border-zinc-800 px-5 py-4 space-y-3">
              <div className="space-y-2">
                {OPTIONS.map((opt) => {
                  const text      = problem[`option_${opt}` as keyof Problem] as string;
                  const isCorrect = problem.correct_answer === opt;
                  return (
                      <div key={opt} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm ${
                          isCorrect
                              ? "border-emerald-400/40 bg-emerald-400/8 text-emerald-300"
                              : "border-zinc-800 text-zinc-400"
                      }`}>
                  <span className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center text-xs font-bold font-mono ${
                      isCorrect ? "bg-emerald-400 text-zinc-950" : "bg-zinc-800 text-zinc-500"
                  }`}>
                    {opt.toUpperCase()}
                  </span>
                        <MathText text={text} />
                        {isCorrect && <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />}
                      </div>
                  );
                })}
              </div>

              {problem.explanation && (
                  <div className="border border-zinc-800 rounded-xl overflow-hidden">
                    <button
                        onClick={() => setExplOpen(e => !e)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
                    >
                      <span className="text-emerald-400">EXPLANATION</span>
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
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function ProblemsListPage() {
  const [problems,       setProblems]       = useState<Problem[]>([]);
  const [subjects,       setSubjects]       = useState<Subject[]>([]);
  const [topics,         setTopics]         = useState<Topic[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState("");
  const [subjectFilter,  setSubjectFilter]  = useState("");
  const [topicFilter,    setTopicFilter]    = useState("");
  const [subtopicFilter, setSubtopicFilter] = useState("");
  const [subtopics,      setSubtopics]      = useState<Subtopic[]>([]);
  const [diffFilter,     setDiffFilter]     = useState("");
  const [freeFilter,     setFreeFilter]     = useState("");
  const [total,          setTotal]          = useState(0);
  const [page,           setPage]           = useState(0);

  const PAGE_SIZE = 20;

  useEffect(() => {
    supabase.from("subjects").select("id, name").order("sort_order")
        .then(({ data }) => setSubjects(data || []));
    supabase.from("topics").select("id, name, subject_id").order("name")
        .then(({ data }) => setTopics(data || []));
  }, []);

  useEffect(() => {
    if (!topicFilter) { setSubtopics([]); setSubtopicFilter(""); return; }
    supabase.from("subtopics").select("id, name, topic_id")
        .eq("topic_id", topicFilter).order("sort_order")
        .then(({ data }) => setSubtopics(data || []));
    setSubtopicFilter("");
  }, [topicFilter]);

  useEffect(() => {
    fetchProblems();
  }, [search, subjectFilter, topicFilter, subtopicFilter, diffFilter, freeFilter, page]);

  const fetchProblems = async () => {
    setLoading(true);
    let query = supabase
        .from("problems")
        .select(`
          id, question, option_a, option_b, option_c, option_d,
          correct_answer, explanation, difficulty, is_free,
          tags, source, created_at, subtopic_id,
          subjects  ( name ),
          topics    ( name ),
          subtopics ( name )
        `, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (subjectFilter)  query = query.eq("subject_id",  subjectFilter);
    if (topicFilter)    query = query.eq("topic_id",    topicFilter);
    if (subtopicFilter) query = query.eq("subtopic_id", subtopicFilter);
    if (diffFilter)     query = query.eq("difficulty",  diffFilter);
    if (freeFilter)     query = query.eq("is_free",     freeFilter === "free");
    if (search)         query = query.ilike("question", `%${search}%`);

    const { data, count, error } = await query;
    if (!error) {
      setProblems((data as unknown as Problem[]) || []);
      setTotal(count || 0);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this problem?")) return;
    const { error } = await supabase.from("problems").delete().eq("id", id);
    if (!error) setProblems(ps => ps.filter(p => p.id !== id));
  };

  const filteredTopics = subjectFilter
      ? topics.filter(t => t.subject_id === subjectFilter)
      : topics;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4"
           style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-4xl mx-auto space-y-6">

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-400 font-mono tracking-widest mb-1">ADMIN</p>
              <h1 className="text-2xl font-bold text-white">
                Problems
                <span className="ml-3 text-base font-normal text-zinc-600">({total})</span>
              </h1>
            </div>
            <a
                href="/admin/add-problem"
                className="flex items-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-emerald-400/20"
            >
              <BookOpen className="w-4 h-4" /> Add Problem
            </a>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(0); }}
                  placeholder="Search questions..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-700 outline-none transition-all"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <select
                    value={subjectFilter}
                    onChange={e => { setSubjectFilter(e.target.value); setTopicFilter(""); setPage(0); }}
                    className="appearance-none bg-zinc-950 border border-zinc-800 rounded-xl pl-3 pr-8 py-2 text-xs text-zinc-400 outline-none"
                >
                  <option value="">All subjects</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                    value={topicFilter}
                    onChange={e => { setTopicFilter(e.target.value); setPage(0); }}
                    className="appearance-none bg-zinc-950 border border-zinc-800 rounded-xl pl-3 pr-8 py-2 text-xs text-zinc-400 outline-none"
                >
                  <option value="">All topics</option>
                  {filteredTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
              </div>

              {subtopics.length > 0 && (
                  <div className="relative">
                    <select
                        value={subtopicFilter}
                        onChange={e => { setSubtopicFilter(e.target.value); setPage(0); }}
                        className="appearance-none bg-zinc-950 border border-zinc-800 rounded-xl pl-3 pr-8 py-2 text-xs text-zinc-400 outline-none"
                    >
                      <option value="">All subtopics</option>
                      {subtopics.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
                  </div>
              )}

              <div className="relative">
                <select
                    value={diffFilter}
                    onChange={e => { setDiffFilter(e.target.value); setPage(0); }}
                    className="appearance-none bg-zinc-950 border border-zinc-800 rounded-xl pl-3 pr-8 py-2 text-xs text-zinc-400 outline-none"
                >
                  <option value="">All difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                    value={freeFilter}
                    onChange={e => { setFreeFilter(e.target.value); setPage(0); }}
                    className="appearance-none bg-zinc-950 border border-zinc-800 rounded-xl pl-3 pr-8 py-2 text-xs text-zinc-400 outline-none"
                >
                  <option value="">Free + Pro</option>
                  <option value="free">Free only</option>
                  <option value="pro">Pro only</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
              </div>

              {(subjectFilter || topicFilter || subtopicFilter || diffFilter || freeFilter || search) && (
                  <button
                      onClick={() => {
                        setSearch(""); setSubjectFilter(""); setTopicFilter("");
                        setSubtopicFilter(""); setDiffFilter(""); setFreeFilter(""); setPage(0);
                      }}
                      className="text-xs text-zinc-600 hover:text-zinc-400 px-3 py-2 rounded-xl hover:bg-zinc-800 transition-colors"
                  >
                    Clear filters
                  </button>
              )}
            </div>
          </div>

          {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              </div>
          ) : problems.length === 0 ? (
              <div className="text-center py-20 space-y-2">
                <BookOpen className="w-10 h-10 text-zinc-800 mx-auto" />
                <p className="text-zinc-600">No problems found</p>
                <a href="/admin/add-problem" className="text-sm text-emerald-400 hover:underline">
                  Add your first problem →
                </a>
              </div>
          ) : (
              <div className="space-y-3">
                {problems.map((p, i) => (
                    <ProblemCard
                        key={p.id}
                        problem={p}
                        onDelete={handleDelete}
                        number={page * PAGE_SIZE + i + 1}
                    />
                ))}
              </div>
          )}

          {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-zinc-600">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                      onClick={() => setPage(p => p - 1)}
                      disabled={page === 0}
                      className="px-4 py-2 rounded-xl border border-zinc-800 text-sm text-zinc-400 disabled:opacity-40 hover:border-zinc-600 transition-colors"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs text-zinc-600 px-2">{page + 1} / {totalPages}</span>
                  <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= totalPages - 1}
                      className="px-4 py-2 rounded-xl border border-zinc-800 text-sm text-zinc-400 disabled:opacity-40 hover:border-zinc-600 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
          )}
        </div>
      </div>
  );
}
