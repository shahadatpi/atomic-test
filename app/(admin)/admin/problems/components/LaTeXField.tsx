"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Eye, EyeOff } from "lucide-react";
import MathText from "@/components/math/MathText";

function autoSize(el: HTMLTextAreaElement, minRows: number) {
  el.style.height = "auto";
  el.style.height = Math.max(el.scrollHeight, minRows * 24) + "px";
}

export default function LaTeXField({
  label, value, onChange, rows = 3, placeholder, isCorrect, autoGrow = true,
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
  const internalRef = useRef<HTMLTextAreaElement | null>(null);

  // Callback ref — fires when textarea mounts into DOM.
  // Uses setTimeout so the browser paints any parent accordion open
  // before we measure scrollHeight (avoids getting 0 height).
  const setRef = useCallback((el: HTMLTextAreaElement | null) => {
    internalRef.current = el;
    if (!el || !autoGrow) return;
    // Immediate attempt (works when already visible)
    autoSize(el, rows);
    // Delayed attempt (works when inside a just-opened accordion)
    const t = setTimeout(() => autoSize(el, rows), 50);
    return () => clearTimeout(t);
  }, [autoGrow, rows]);

  // Re-measure whenever value changes programmatically
  useEffect(() => {
    if (!autoGrow || !internalRef.current) return;
    autoSize(internalRef.current, rows);
  }, [value, autoGrow, rows]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-xs font-mono ${isCorrect ? "text-violet-400" : "text-zinc-500"}`}>
          {label}
        </span>
        <button
          type="button"
          onClick={() => setPreview(p => !p)}
          className="flex items-center gap-1 text-xs text-zinc-600 hover:text-violet-400 transition-colors"
        >
          {preview
            ? <><EyeOff className="w-3 h-3" /> Edit</>
            : <><Eye   className="w-3 h-3" /> Preview</>
          }
        </button>
      </div>

      {preview ? (
        <div className={`min-h-[80px] rounded-xl px-4 py-3 text-sm leading-relaxed border ${
          isCorrect
            ? "border-emerald-400/30 bg-emerald-400/5 text-emerald-200"
            : "border-zinc-800 bg-zinc-950 text-zinc-300"
        }`}>
          {value.trim()
            ? <MathText text={value} />
            : <span className="text-zinc-700 italic text-xs">empty</span>
          }
        </div>
      ) : (
        <textarea
          ref={setRef}
          value={value}
          rows={rows}
          placeholder={placeholder}
          onChange={e => {
            onChange(e.target.value);
            if (autoGrow) autoSize(e.target, rows);
          }}
          style={autoGrow ? { resize: "none", overflow: "hidden" } : undefined}
          className={`w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500/50
                      rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-700
                      outline-none transition-colors font-mono min-h-[80px]
                      ${autoGrow ? "" : "resize-y"}`}
        />
      )}
    </div>
  );
}
