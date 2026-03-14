"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import MathText from "@/components/math/MathText";

export default function LaTeXField({
  label, value, onChange, rows = 3, placeholder, isCorrect, autoGrow = false,
}: {
  label:        string;
  value:        string;
  onChange:     (v: string) => void;
  rows?:        number;
  placeholder?: string;
  isCorrect?:   boolean;
  autoGrow?:    boolean;
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
        <span className={`text-xs font-mono ${isCorrect ? "text-violet-400" : "text-zinc-500"}`}>{label}</span>
        <button type="button" onClick={() => setPreview(p => !p)}
          className="flex items-center gap-1 text-xs text-zinc-600 hover:text-violet-400 transition-colors">
          {preview ? <><EyeOff className="w-3 h-3" /> Edit</> : <><Eye className="w-3 h-3" /> Preview</>}
        </button>
      </div>
      {preview ? (
        <div className={`min-h-[100px] rounded-xl px-4 py-3 text-sm leading-relaxed border ${
          isCorrect ? "border-emerald-400/30 bg-emerald-400/5 text-emerald-200" : "border-zinc-800 bg-zinc-950 text-zinc-300"
        }`}>
          {value.trim() ? <MathText text={value} /> : <span className="text-zinc-700 italic text-xs">empty</span>}
        </div>
      ) : (
        <textarea ref={taRef} value={value} onChange={e => onChange(e.target.value)}
          rows={rows} placeholder={placeholder}
          style={autoGrow ? { resize: "none", overflow: "hidden" } : undefined}
          className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500/50 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-700 outline-none transition-all font-mono min-h-[80px] resize-y"
        />
      )}
    </div>
  );
}
