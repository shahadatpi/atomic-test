"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Search, ChevronDown, Loader2, BookOpen } from "lucide-react";
import ProblemCard from "./components/ProblemCard";
import { Problem, Subject, Topic, Subtopic } from "./types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PAGE_SIZE = 20;

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
    let q = supabase.from("problems")
      .select(`id, question, option_a, option_b, option_c, option_d, correct_answer, explanation,
               difficulty, is_free, tags, source, created_at,
               subject_id, topic_id, subtopic_id, problem_type,
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
    if (!confirm("Delete this problem?")) return;
    const { error } = await supabase.from("problems").delete().eq("id", id);
    if (!error) setProblems(ps => ps.filter(p => p.id !== id));
  };

  const filteredTopics = subjectFilter ? topics.filter(t => t.subject_id === subjectFilter) : topics;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const Pagination = () => {
    if (totalPages <= 1) return null;
    const btn = "w-9 h-9 flex items-center justify-center rounded-xl border border-zinc-800 text-zinc-400 disabled:opacity-20 hover:border-zinc-600 hover:text-white active:scale-95 transition-all text-sm";
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-1">
          <button onClick={() => setPage(0)} disabled={page === 0} className={btn}>«</button>
          <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className={btn}>‹</button>
          <div className="flex items-center gap-1 flex-1 justify-center">
            {page > 0 && (
              <button onClick={() => setPage(page - 1)}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-zinc-800 text-zinc-500 text-xs font-mono hover:border-violet-400/50 hover:text-violet-400 transition-all">
                {page}
              </button>
            )}
            <button className="w-9 h-9 flex items-center justify-center rounded-xl border border-violet-500 bg-violet-500 text-white text-xs font-mono font-semibold shadow-md shadow-violet-500/30">
              {page + 1}
            </button>
            {page < totalPages - 1 && (
              <button onClick={() => setPage(page + 1)}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-zinc-800 text-zinc-500 text-xs font-mono hover:border-violet-400/50 hover:text-violet-400 transition-all">
                {page + 2}
              </button>
            )}
          </div>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className={btn}>›</button>
          <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} className={btn}>»</button>
        </div>
        <div className="flex items-center justify-between px-0.5">
          <span className="text-xs text-zinc-500">
            <span className="text-zinc-200 font-medium">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)}</span>
            <span className="text-zinc-600"> / {total}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-600">Go</span>
            <input key={page} type="number" min={1} max={totalPages} defaultValue={page + 1}
              onBlur={e => { const v = +e.target.value - 1; if (v >= 0 && v < totalPages) setPage(v); }}
              onKeyDown={e => { if (e.key === "Enter") { const v = +(e.target as HTMLInputElement).value - 1; if (v >= 0 && v < totalPages) setPage(v); }}}
              className="w-10 h-8 bg-zinc-950 border border-zinc-800 focus:border-violet-500/50 rounded-lg text-center text-xs text-zinc-200 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            <span className="text-xs text-zinc-700">/{totalPages}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4" style={{ fontFamily: "\'Kalpurush\', \'Roboto\', sans-serif" }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-violet-400 font-mono tracking-widest mb-1">ADMIN</p>
            <h1 className="text-2xl font-bold text-white">
              Problems <span className="ml-3 text-base font-normal text-zinc-600">({total})</span>
            </h1>
          </div>
          <a href="/admin/add-problem"
            className="flex items-center gap-2 bg-violet-500 hover:bg-violet-400 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-violet-500/20">
            <BookOpen className="w-4 h-4" /> Add Problem
          </a>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search questions..."
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-700 outline-none transition-all" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { val: subjectFilter, set: (v: string) => { setSubjectFilter(v); setTopicFilter(""); setPage(0); }, opts: subjects.map(s => [s.id, s.name] as [string,string]), placeholder: "All subjects" },
              { val: topicFilter,   set: (v: string) => { setTopicFilter(v); setPage(0); },                      opts: filteredTopics.map(t => [t.id, t.name] as [string,string]), placeholder: "All topics" },
              { val: diffFilter,    set: (v: string) => { setDiffFilter(v); setPage(0); },                       opts: [["easy","Easy"],["medium","Medium"],["hard","Hard"]] as [string,string][], placeholder: "All difficulties" },
              { val: freeFilter,    set: (v: string) => { setFreeFilter(v); setPage(0); },                       opts: [["free","Free only"],["pro","Pro only"]] as [string,string][], placeholder: "Free + Pro" },
            ].map((sel, i) => (
              <div key={i} className="relative">
                <select value={sel.val} onChange={e => sel.set(e.target.value)}
                  className="appearance-none bg-zinc-950 border border-zinc-800 rounded-xl pl-3 pr-8 py-2 text-xs text-zinc-400 outline-none">
                  <option value="">{sel.placeholder}</option>
                  {sel.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
              </div>
            ))}
            {subtopics.length > 0 && (
              <div className="relative">
                <select value={subtopicFilter} onChange={e => { setSubtopicFilter(e.target.value); setPage(0); }}
                  className="appearance-none bg-zinc-950 border border-zinc-800 rounded-xl pl-3 pr-8 py-2 text-xs text-zinc-400 outline-none">
                  <option value="">All subtopics</option>
                  {subtopics.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
              </div>
            )}
            {(subjectFilter || topicFilter || subtopicFilter || diffFilter || freeFilter || search) && (
              <button onClick={() => { setSearch(""); setSubjectFilter(""); setTopicFilter(""); setSubtopicFilter(""); setDiffFilter(""); setFreeFilter(""); setPage(0); }}
                className="text-xs text-zinc-600 hover:text-zinc-400 px-3 py-2 rounded-xl hover:bg-zinc-800 transition-colors">
                Clear filters
              </button>
            )}
          </div>
        </div>

        <Pagination />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          </div>
        ) : problems.length === 0 ? (
          <div className="text-center py-20 space-y-2">
            <BookOpen className="w-10 h-10 text-zinc-800 mx-auto" />
            <p className="text-zinc-600">No problems found</p>
            <a href="/admin/add-problem" className="text-sm text-violet-400 hover:underline">Add your first problem →</a>
          </div>
        ) : (
          <div className="space-y-3">
            {problems.map((p, i) => (
              <ProblemCard key={p.id} problem={p} onDelete={handleDelete} number={page * PAGE_SIZE + i + 1} />
            ))}
          </div>
        )}

        <Pagination />
      </div>
    </div>
  );
}
