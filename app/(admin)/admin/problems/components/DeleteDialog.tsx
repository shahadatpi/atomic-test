/**
 * DeleteDialog — reusable slide-up confirmation modal.
 * Strips LaTeX from the question preview so it renders as plain text.
 */
"use client";

import { Loader2, Trash2, AlertTriangle } from "lucide-react";

interface Props {
  question:  string;
  problemId: string;
  deleting:  boolean;
  onConfirm: () => void;
  onCancel:  () => void;
}

function stripLatex(text: string): string {
  return text
    .replace(/\$[^$]*\$/g, "…")
    .replace(/\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}/g, "…")
    .slice(0, 120);
}

export default function DeleteDialog({
  question, problemId, deleting, onConfirm, onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !deleting && onCancel()}
      />

      {/* Card */}
      <div className="relative w-full max-w-md bg-zinc-900 border border-red-500/30
                      rounded-2xl shadow-2xl shadow-red-500/10 p-5 space-y-4">

        {/* Icon + title */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30
                          flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100">প্রশ্নটি মুছে ফেলবেন?</p>
            <p className="text-xs text-zinc-500 mt-0.5">এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।</p>
          </div>
        </div>

        {/* Question preview */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3">
          <p className="text-[11px] text-zinc-600 font-mono mb-1">
            ID: {problemId.slice(0, 20)}…
          </p>
          <p className="text-sm text-zinc-300 line-clamp-2 leading-relaxed">
            {stripLatex(question)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-sm text-zinc-400
                       hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-40
                       transition-colors font-medium"
          >
            বাতিল
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400
                       disabled:opacity-50 disabled:cursor-not-allowed
                       text-white text-sm font-semibold transition-colors
                       flex items-center justify-center gap-2"
          >
            {deleting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> মুছছে…</>
              : <><Trash2 className="w-4 h-4" /> হ্যাঁ, মুছুন</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
