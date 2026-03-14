"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  FileText, Search, Loader2, CheckSquare, Eye,
  SlidersHorizontal, X, ChevronDown, ChevronLeft, ChevronRight,
} from "lucide-react";
import MathText, { stripTikz } from "@/components/math/MathText";

function safeTruncate(text: string, max = 160): string {
  const stripped = stripTikz(text);
  if (stripped.length <= max) return stripped;
  let depth = 0, lastSafe = max;
  for (let i = 0; i < Math.min(stripped.length, max); i++) {
    if (stripped[i] === "$") depth = depth === 0 ? 1 : 0;
    if (depth === 0) lastSafe = i;
  }
  return stripped.slice(0, lastSafe + 1) + "…";
}
import PaperFormatPanel, { PaperFormat, DEFAULT_FORMAT } from "./components/PaperFormatPanel";
import SelectedQuestions from "./components/SelectedQuestions";
import PaperPreview from "./components/PaperPreview";

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
  exam_year:      string | null;
  exam_institute: string | null;
  problem_type:   string;
  source:         string | null;
  tags:           string[] | null;
  subjects:       { name: string };
  topics:         { name: string };
  subtopics:      { name: string } | null;
}

export interface SelectedProblem extends Problem {
  customMarks: number;
  showAnswer:  boolean;
  optionCols:  "auto" | "1" | "2";
}

interface Subject { id: string; name: string; }
interface Topic   { id: string; name: string; subject_id: string; }

const DIFFICULTY_COLORS: Record<string, string> = {
  easy:   "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  medium: "text-amber-400   border-amber-400/30   bg-amber-400/10",
  hard:   "text-red-400     border-red-400/30     bg-red-400/10",
};
const DIFF_BN: Record<string, string> = { easy: "সহজ", medium: "মাঝারি", hard: "কঠিন" };

const TYPE_INFO: Record<string, { label: string; color: string }> = {
  board_mcq:         { label: "বোর্ড MCQ",      color: "border-sky-400/30 bg-sky-400/10 text-sky-400" },
  admission_mcq:     { label: "ভর্তি MCQ",       color: "border-cyan-400/30 bg-cyan-400/10 text-cyan-400" },
  board_cq:          { label: "বোর্ড CQ",        color: "border-amber-400/30 bg-amber-400/10 text-amber-400" },
  board_written:     { label: "রচনামূলক",        color: "border-orange-400/30 bg-orange-400/10 text-orange-400" },
  admission_written: { label: "ভর্তি রচনামূলক", color: "border-rose-400/30 bg-rose-400/10 text-rose-400" },
  practice:          { label: "অনুশীলন",         color: "border-violet-400/30 bg-violet-400/10 text-violet-400" },
};

type Tab = "browse" | "selected" | "format";

function FilterSelect({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-7 py-1.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-violet-500/50 transition-colors cursor-pointer">
        {children}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
    </div>
  );
}


function BrowseList({ filtered, page, pageSize, setPage, isSelected, toggleSelect }: {
  filtered:     ReturnType<typeof Array.prototype.filter> extends never[] ? never : any[];
  page:         number;
  pageSize:     number;
  setPage:      (p: number) => void;
  isSelected:   (id: string) => boolean;
  toggleSelect: (p: any) => void;
}) {
  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageItems  = filtered.slice((page - 1) * pageSize, page * pageSize);
  const goTo = (p: number) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="space-y-3">
      {/* Top pagination */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-700 font-mono">
          {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} / {filtered.length}
        </span>
        <Pagination page={page} totalPages={totalPages} onChange={goTo} />
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {pageItems.map((p: any, idx: number) => (
          <BrowseCard key={p.id} problem={p}
            index={(page - 1) * pageSize + idx + 1}
            selected={isSelected(p.id)}
            onToggle={() => toggleSelect(p)} />
        ))}
      </div>

      {/* Bottom pagination */}
      {totalPages > 1 && (
        <div className="pt-2 pb-4">
          <Pagination page={page} totalPages={totalPages} onChange={goTo} />
        </div>
      )}
    </div>
  );
}

const PAGES_SHOWN = 5;

function Pagination({ page, totalPages, onChange }: {
  page: number; totalPages: number; onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const half  = Math.floor(PAGES_SHOWN / 2);
  let start   = Math.max(1, page - half);
  const end   = Math.min(totalPages, start + PAGES_SHOWN - 1);
  if (end - start < PAGES_SHOWN - 1) start = Math.max(1, end - PAGES_SHOWN + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex items-center justify-center gap-1">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="p-2 rounded-xl border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 disabled:opacity-25 disabled:cursor-not-allowed transition-all text-zinc-500 hover:text-zinc-300">
        <ChevronLeft className="w-4 h-4" />
      </button>

      {start > 1 && (
        <>
          <button onClick={() => onChange(1)}
            className="w-9 h-9 rounded-xl border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 transition-all text-xs font-mono text-zinc-500 hover:text-zinc-300">
            1
          </button>
          {start > 2 && <span className="w-9 h-9 flex items-center justify-center text-zinc-700 text-xs">…</span>}
        </>
      )}

      {pages.map(p => (
        <button key={p} onClick={() => onChange(p)}
          className={`w-9 h-9 rounded-xl border text-xs font-mono font-medium transition-all ${
            p === page
              ? "border-violet-500/50 bg-violet-500/15 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.2)]"
              : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
          }`}>
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="w-9 h-9 flex items-center justify-center text-zinc-700 text-xs">…</span>}
          <button onClick={() => onChange(totalPages)}
            className="w-9 h-9 rounded-xl border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 transition-all text-xs font-mono text-zinc-500 hover:text-zinc-300">
            {totalPages}
          </button>
        </>
      )}

      <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
        className="p-2 rounded-xl border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 disabled:opacity-25 disabled:cursor-not-allowed transition-all text-zinc-500 hover:text-zinc-300">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ── Browse card ── */
function BrowseCard({ problem: p, index, selected, onToggle }: {
  problem: Problem; index: number; selected: boolean; onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const typeInfo = TYPE_INFO[p.problem_type] ?? { label: p.problem_type, color: "border-zinc-700 bg-zinc-800 text-zinc-400" };
  const isMcq    = p.problem_type?.includes("mcq");

  return (
    <div className={`bg-zinc-900 border rounded-2xl overflow-hidden transition-all ${
      selected ? "border-violet-500/40 shadow-[0_0_0_1px_rgba(139,92,246,0.15)]" : "border-zinc-800 hover:border-zinc-700"
    }`}>
      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Checkbox */}
        <button onClick={onToggle}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
            selected ? "bg-violet-500 border-violet-500" : "border-zinc-700 hover:border-zinc-500"
          }`}>
          {selected && <span className="text-white text-[10px] font-black leading-none">✓</span>}
        </button>

        {/* Number badge */}
        <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-xs font-mono font-bold text-zinc-500 mt-0.5">
          {index}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(e => !e)}>
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            {p.subjects?.name && <span className="text-xs text-zinc-600 font-mono">{p.subjects.name}</span>}
            {p.topics?.name   && <><span className="text-zinc-700">›</span><span className="text-xs text-zinc-600">{p.topics.name}</span></>}
            <span className={`text-xs border rounded-full px-2 py-0.5 font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
            {p.difficulty && (
              <span className={`text-xs border rounded-full px-2 py-0.5 font-mono ${DIFFICULTY_COLORS[p.difficulty] ?? ""}`}>
                {DIFF_BN[p.difficulty] ?? p.difficulty}
              </span>
            )}
            {p.exam_year && (
              <span className="text-xs text-zinc-600 border border-zinc-800 rounded-full px-2 py-0.5 font-mono">{p.exam_year}</span>
            )}
          </div>

          {/* Question */}
          <div className="text-sm text-zinc-200 leading-relaxed">
            {expanded
              ? <MathText text={p.question} />
              : <MathText text={safeTruncate(p.question, 200)} />
            }
          </div>

          {/* MCQ options — inline */}
          {expanded && isMcq && (
            <div className="mt-3 grid grid-cols-2 gap-1.5">
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
          )}

          {/* CQ sub-parts — inline */}
          {expanded && !isMcq && (
            <div className="mt-3 space-y-1.5">
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
        </div>

        {/* Chevron */}
        <button onClick={() => setExpanded(e => !e)}
          className="flex-shrink-0 p-1.5 rounded-lg text-zinc-700 hover:text-zinc-400 hover:bg-zinc-800 transition-all">
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {selected && <div className="h-0.5 bg-gradient-to-r from-violet-500/60 via-violet-400/30 to-transparent" />}
    </div>
  );
}

/* ── Main page ── */
export default function PaperBuilderPage() {
  const [problems,    setProblems]    = useState<Problem[]>([]);
  const [subjects,    setSubjects]    = useState<Subject[]>([]);
  const [topics,      setTopics]      = useState<Topic[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const [search,      setSearch]      = useState("");
  const [filterSubj,  setFilterSubj]  = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [filterDiff,  setFilterDiff]  = useState("");
  const [filterType,  setFilterType]  = useState("");

  const [selected, setSelected] = useState<SelectedProblem[]>([]);
  const [page,     setPage]     = useState(1);
  const PAGE_SIZE = 20;
  const [tab,      setTab]      = useState<Tab>("browse");
  const [format,   setFormat]   = useState<PaperFormat>(DEFAULT_FORMAT);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: probs }, { data: subjs }, { data: tops }] = await Promise.all([
        supabase.from("problems")
          .select(`id, question, option_a, option_b, option_c, option_d,
                   correct_answer, explanation, difficulty, marks, source, tags,
                   exam_year, exam_institute, problem_type,
                   subjects(name), topics(name), subtopics(name)`)
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

  const filteredTopics = filterSubj
    ? topics.filter(t => subjects.find(s => s.name === filterSubj && s.id === t.subject_id))
    : topics;

  const filtered = problems.filter(p => {
    if (search      && !p.question.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSubj  && p.subjects?.name !== filterSubj)  return false;
    if (filterTopic && p.topics?.name   !== filterTopic)  return false;
    if (filterDiff  && p.difficulty     !== filterDiff)   return false;
    if (filterType  && p.problem_type   !== filterType)   return false;
    return true;
  });

  const isSelected   = (id: string) => selected.some(s => s.id === id);
  const toggleSelect = (p: Problem) => {
    if (isSelected(p.id)) setSelected(sel => sel.filter(s => s.id !== p.id));
    else setSelected(sel => [...sel, { ...p, customMarks: p.marks ?? 1, showAnswer: false, optionCols: "auto" }]);
  };
  const selectAll  = () => {
    const toAdd = filtered.filter(p => !isSelected(p.id));
    setSelected(sel => [...sel, ...toAdd.map(p => ({ ...p, customMarks: p.marks ?? 1, showAnswer: false, optionCols: "auto" }))]);
  };
  const clearFilters = () => { setSearch(""); setFilterSubj(""); setFilterTopic(""); setFilterDiff(""); setFilterType(""); setPage(1); };
  const hasFilters   = !!(filterSubj || filterTopic || filterDiff || filterType || search);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, filterSubj, filterTopic, filterDiff, filterType]);

  return (
    <>
      {showPreview && (
        <PaperPreview selected={selected} format={format} onClose={() => setShowPreview(false)} />
      )}

      <div className="min-h-screen bg-zinc-950 text-zinc-100">

        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800/80 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <FileText className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h1 className="font-semibold text-zinc-100">প্রশ্নপত্র তৈরি</h1>
                <p className="text-xs text-zinc-600">Question Paper Builder</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selected.length > 0 && (
                <span className="text-xs bg-violet-500/15 text-violet-300 border border-violet-500/25 rounded-full px-3 py-1 font-mono">
                  {selected.length} প্রশ্ন
                </span>
              )}
              <button onClick={() => setShowPreview(true)} disabled={selected.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-400 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all">
                <Eye className="w-4 h-4" /> প্রিভিউ
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="max-w-5xl mx-auto mt-3 flex gap-0.5">
            {(["browse","selected","format"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`relative px-4 py-2 text-sm rounded-lg transition-all font-medium ${
                  tab === t ? "text-violet-300 bg-violet-500/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                }`}>
                {t === "browse" ? "প্রশ্ন খুঁজুন" : t === "selected" ? "নির্বাচিত" : "ফরম্যাট"}
                {t === "selected" && selected.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-violet-500 text-white text-[11px] font-bold">
                    {selected.length}
                  </span>
                )}
                {tab === t && <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-violet-500 rounded-full" />}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto p-4">

          {/* BROWSE */}
          {tab === "browse" && (
            <div className="space-y-3">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="প্রশ্নে খুঁজুন…"
                      className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-violet-500/50 transition-colors" />
                  </div>
                  <button onClick={selectAll}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs border border-zinc-800 hover:border-violet-500/40 hover:text-violet-400 rounded-xl transition-colors text-zinc-500 font-medium">
                    <CheckSquare className="w-3.5 h-3.5" /> সব নির্বাচন
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-700 flex-shrink-0" />
                  <FilterSelect value={filterSubj} onChange={v => { setFilterSubj(v); setFilterTopic(""); }}>
                    <option value="">সব বিষয়</option>
                    {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </FilterSelect>
                  <FilterSelect value={filterTopic} onChange={setFilterTopic}>
                    <option value="">সব অধ্যায়</option>
                    {filteredTopics.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </FilterSelect>
                  <FilterSelect value={filterType} onChange={setFilterType}>
                    <option value="">সব ধরন</option>
                    {Object.entries(TYPE_INFO).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
                  </FilterSelect>
                  <FilterSelect value={filterDiff} onChange={setFilterDiff}>
                    <option value="">সব কঠিনতা</option>
                    <option value="easy">সহজ</option>
                    <option value="medium">মাঝারি</option>
                    <option value="hard">কঠিন</option>
                  </FilterSelect>
                  {hasFilters && (
                    <button onClick={clearFilters}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-400 border border-red-400/20 rounded-lg hover:bg-red-400/10 transition-colors">
                      <X className="w-3 h-3" /> মুছুন
                    </button>
                  )}
                  <span className="ml-auto text-xs font-mono text-zinc-700">{filtered.length} / {problems.length}</span>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-violet-400" /></div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                  <Search className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">কোনো প্রশ্ন পাওয়া যায়নি</p>
                </div>
              ) : (
                <BrowseList
                  filtered={filtered}
                  page={page}
                  pageSize={PAGE_SIZE}
                  setPage={setPage}
                  isSelected={isSelected}
                  toggleSelect={toggleSelect}
                />
              )}
            </div>
          )}

          {tab === "selected" && (
            <SelectedQuestions selected={selected} setSelected={setSelected} />
          )}

          {tab === "format" && (
            <PaperFormatPanel
              format={format} setFormat={setFormat}
              totalQuestions={selected.length}
              totalMarks={selected.reduce((s, p) => s + (p.customMarks ?? 1), 0)}
            />
          )}
        </div>
      </div>
    </>
  );
}
