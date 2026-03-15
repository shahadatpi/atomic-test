"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2, BookOpen, Plus } from "lucide-react";
import ProblemCard  from "./components/ProblemCard";
import AdminNav     from "./components/AdminNav";
import FiltersBar   from "./components/FiltersBar";
import Pagination   from "./components/Pagination";
import DeleteDialog from "./components/DeleteDialog";
import { Problem, Subject, Topic, Subtopic } from "./types";

const supabase  = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const PAGE_SIZE = 20;

export default function ProblemsListPage() {
  // ── Data ──
  const [problems,  setProblems]  = useState<Problem[]>([]);
  const [subjects,  setSubjects]  = useState<Subject[]>([]);
  const [topics,    setTopics]    = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);

  // ── Filters ──
  const [search,         setSearch]         = useState("");
  const [subjectFilter,  setSubjectFilter]  = useState("");
  const [topicFilter,    setTopicFilter]    = useState("");
  const [subtopicFilter, setSubtopicFilter] = useState("");
  const [diffFilter,     setDiffFilter]     = useState("");
  const [freeFilter,     setFreeFilter]     = useState("");
  const [page,           setPage]           = useState(0);

  // ── Delete ──
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; question: string } | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  // ── Load subjects / topics once ──
  useEffect(() => {
    supabase.from("subjects").select("id, name").order("sort_order")
      .then(({ data }) => setSubjects(data || []));
    supabase.from("topics").select("id, name, subject_id").order("name")
      .then(({ data }) => setTopics(data || []));
  }, []);

  // ── Load subtopics when topic filter changes ──
  useEffect(() => {
    if (!topicFilter) { setSubtopics([]); setSubtopicFilter(""); return; }
    supabase.from("subtopics").select("id, name, topic_id")
      .eq("topic_id", topicFilter).order("sort_order")
      .then(({ data }) => setSubtopics(data || []));
    setSubtopicFilter("");
  }, [topicFilter]);

  // ── Fetch problems when filters / page change ──
  useEffect(() => { fetchProblems(); },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [search, subjectFilter, topicFilter, subtopicFilter, diffFilter, freeFilter, page]);

  async function fetchProblems() {
    setLoading(true);
    let q = supabase.from("problems")
      .select(
        `id, question, option_a, option_b, option_c, option_d,
         correct_answer, explanation, difficulty, is_free, tags, source, created_at,
         subject_id, topic_id, subtopic_id, problem_type,
         subjects(name), topics(name), subtopics(name)`,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (subjectFilter)  q = q.eq("subject_id",  subjectFilter);
    if (topicFilter)    q = q.eq("topic_id",    topicFilter);
    if (subtopicFilter) q = q.eq("subtopic_id", subtopicFilter);
    if (diffFilter)     q = q.eq("difficulty",  diffFilter);
    if (freeFilter)     q = q.eq("is_free",     freeFilter === "free");
    if (search)         q = q.ilike("question", `%${search}%`);

    const { data, count, error } = await q;
    if (!error) {
      setProblems((data as unknown as Problem[]) || []);
      setTotal(count || 0);
    }
    setLoading(false);
  }

  // ── Delete handlers ──
  const handleDelete = (id: string) => {
    const p = problems.find(p => p.id === id);
    setDeleteTarget({ id, question: p?.question ?? "" });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("problems").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (!error) setProblems(ps => ps.filter(p => p.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  // ── Filter helpers ──
  const clearAll = () => {
    setSearch(""); setSubjectFilter(""); setTopicFilter("");
    setSubtopicFilter(""); setDiffFilter(""); setFreeFilter(""); setPage(0);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div
      className="min-h-screen bg-zinc-950 text-zinc-100 py-8 px-4"
      style={{ fontFamily: "'Kalpurush', 'Roboto', sans-serif" }}
    >
      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <DeleteDialog
          question={deleteTarget.question}
          problemId={deleteTarget.id}
          deleting={deleting}
          onConfirm={confirmDelete}
          onCancel={() => !deleting && setDeleteTarget(null)}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-5">

        {/* Navigation */}
        <AdminNav current="problems" />

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-violet-400 font-mono tracking-widest mb-1">ADMIN</p>
            <h1 className="text-2xl font-bold text-white">
              Problems
              <span className="ml-3 text-base font-normal text-zinc-600">({total})</span>
            </h1>
          </div>
          <Link href="/admin/add-problem"
            className="flex items-center gap-2 bg-violet-500 hover:bg-violet-400
                       text-white font-semibold text-sm px-5 py-2.5 rounded-xl
                       transition-colors shadow-lg shadow-violet-500/20"
          >
            <Plus className="w-4 h-4" /> Add Problem
          </Link>
        </div>

        {/* Filters */}
        <FiltersBar
          search={search}           subjectFilter={subjectFilter}
          topicFilter={topicFilter} subtopicFilter={subtopicFilter}
          diffFilter={diffFilter}   freeFilter={freeFilter}
          subjects={subjects}       topics={topics}  subtopics={subtopics}
          onSearch={v         => { setSearch(v);         setPage(0); }}
          onSubjectFilter={v  => { setSubjectFilter(v);  setTopicFilter(""); setPage(0); }}
          onTopicFilter={v    => { setTopicFilter(v);    setPage(0); }}
          onSubtopicFilter={v => { setSubtopicFilter(v); setPage(0); }}
          onDiffFilter={v     => { setDiffFilter(v);     setPage(0); }}
          onFreeFilter={v     => { setFreeFilter(v);     setPage(0); }}
          onClearAll={clearAll}
        />

        {/* Pagination (top) */}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />

        {/* Problem list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          </div>
        ) : problems.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <BookOpen className="w-10 h-10 text-zinc-800 mx-auto" />
            <p className="text-zinc-600">No problems found</p>
            <Link href="/admin/add-problem" className="text-sm text-violet-400 hover:underline">
              Add your first problem →
            </Link>
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

        {/* Pagination (bottom) */}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}
