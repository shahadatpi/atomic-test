"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Upload, CheckCircle, XCircle, Loader2, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Result {
  question: string;
  status: "success" | "error";
  error?: string;
}

export default function BulkImportPage() {
  const [text, setText]       = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [done, setDone]       = useState(false);

  // Split textarea into individual questions
  // Supports: blank-line separator OR numbered list (1. 2. 3.) OR one-per-line
  const parseQuestions = (raw: string): string[] => {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    // Try numbered list: lines starting with 1. 2. 3) etc.
    const numbered = trimmed
      .split(/\n(?=\s*\d+[\.\)]\s)/)
      .map(q => q.replace(/^\s*\d+[\.\)]\s*/, "").trim())
      .filter(Boolean);
    if (numbered.length > 1) return numbered;

    // Try blank-line separator
    const byBlankLine = trimmed
      .split(/\n\s*\n/)
      .map(q => q.trim())
      .filter(Boolean);
    if (byBlankLine.length > 1) return byBlankLine;

    // Fallback: one per line
    return trimmed.split("\n").map(q => q.trim()).filter(Boolean);
  };

  const handleImport = async () => {
    const questions = parseQuestions(text);
    if (questions.length === 0) return;

    setLoading(true);
    setDone(false);
    setResults([]);

    const out: Result[] = [];

    for (const question of questions) {
      const { error } = await supabase.from("problems").insert({
        question,
        // All other fields left null / DB default
        subject_id:     null,
        topic_id:       null,
        subtopic_id:    null,
        option_a:       null,
        option_b:       null,
        option_c:       null,
        option_d:       null,
        correct_answer: null,
        difficulty:     "easy",
        is_free:        true,
      });

      out.push({
        question: question.slice(0, 80) + (question.length > 80 ? "…" : ""),
        status: error ? "error" : "success",
        error: error?.message,
      });
    }

    setResults(out);
    setLoading(false);
    setDone(true);
  };

  const questions = parseQuestions(text);
  const successCount = results.filter(r => r.status === "success").length;
  const errorCount   = results.filter(r => r.status === "error").length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/problems"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
            <ArrowLeft className="w-4 h-4 text-zinc-400" />
          </Link>
          <div>
            <p className="text-xs text-violet-400 font-mono tracking-widest">ADMIN · BULK IMPORT</p>
            <h1 className="text-2xl font-bold text-white">Import Questions</h1>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 space-y-2">
          <p className="text-xs text-zinc-400 font-mono uppercase tracking-wider mb-3">How to use</p>
          <div className="space-y-1.5 text-sm text-zinc-400">
            <p>• Paste questions — one per line, or separated by blank lines, or numbered (1. 2. 3.)</p>
            <p>• Only the <span className="text-zinc-200">question text</span> is saved — all other fields (topic, options, answer) are left empty</p>
            <p>• You can fill in the details later from the <Link href="/admin/problems" className="text-violet-400 hover:underline">Problems page</Link></p>
          </div>
          <div className="mt-3 bg-zinc-800/60 rounded-xl px-4 py-3 text-xs text-zinc-500 font-mono leading-relaxed">
            Example:<br />
            1. বস্তুর ভর ও ওজনের পার্থক্য কী?<br />
            2. নিউটনের দ্বিতীয় সূত্রটি লেখো।<br />
            3. তরঙ্গদৈর্ঘ্য বলতে কী বোঝো?
          </div>
        </div>

        {/* Textarea */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Questions</span>
            {text && (
              <span className="text-xs text-violet-400 font-mono">
                {questions.length} question{questions.length !== 1 ? "s" : ""} detected
              </span>
            )}
          </div>
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setDone(false); setResults([]); }}
            placeholder={"Paste your questions here...\n\n1. বস্তুর ভর ও ওজনের পার্থক্য কী?\n2. নিউটনের দ্বিতীয় সূত্রটি লেখো।"}
            className="w-full bg-transparent px-5 py-4 text-sm text-zinc-200 placeholder-zinc-700
                       outline-none resize-none min-h-[280px] leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleImport}
            disabled={loading || questions.length === 0}
            className="flex items-center gap-2 bg-violet-500 hover:bg-violet-400
                       disabled:opacity-40 disabled:cursor-not-allowed
                       text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</>
              : <><Upload className="w-4 h-4" /> Import {questions.length > 0 ? `${questions.length} Question${questions.length !== 1 ? "s" : ""}` : "Questions"}</>
            }
          </button>

          {text && (
            <button
              onClick={() => { setText(""); setResults([]); setDone(false); }}
              className="flex items-center gap-2 text-zinc-600 hover:text-red-400 text-sm transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Results */}
        {done && results.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Results</span>
              <div className="flex items-center gap-3">
                {successCount > 0 && (
                  <span className="text-xs text-emerald-400 font-mono">{successCount} imported</span>
                )}
                {errorCount > 0 && (
                  <span className="text-xs text-red-400 font-mono">{errorCount} failed</span>
                )}
              </div>
            </div>
            <div className="divide-y divide-zinc-800/60 max-h-[400px] overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3">
                  {r.status === "success"
                    ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    : <XCircle    className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300 truncate">{r.question}</p>
                    {r.error && (
                      <p className="text-xs text-red-400 mt-0.5">{r.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {successCount > 0 && (
              <div className="px-5 py-3 border-t border-zinc-800 flex items-center gap-3">
                <Link href="/admin/problems"
                  className="text-sm text-violet-400 hover:underline">
                  Fill in details on Problems page →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
