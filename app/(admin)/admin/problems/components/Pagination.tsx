/**
 * Pagination — reusable paginator with Go-to-page input.
 * Shows compact "page / total" on mobile, full buttons on desktop.
 */
"use client";

interface Props {
  page:       number;   // 0-based
  totalPages: number;
  onChange:   (page: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  const btn = "w-9 h-9 flex items-center justify-center rounded-xl border border-zinc-800 \
text-zinc-400 disabled:opacity-20 hover:border-zinc-600 hover:text-white \
active:scale-95 transition-all text-sm";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-1">
        <button onClick={() => onChange(0)} disabled={page === 0} className={btn}>«</button>
        <button onClick={() => onChange(page - 1)} disabled={page === 0} className={btn}>‹</button>

        {/* Mobile: compact */}
        <span className="sm:hidden flex-1 text-center text-xs font-mono text-zinc-400">
          {page + 1} / {totalPages}
        </span>

        {/* Desktop: surrounding pages */}
        <div className="hidden sm:flex items-center gap-1 flex-1 justify-center">
          {page > 0 && (
            <button onClick={() => onChange(page - 1)}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-zinc-800
                         text-zinc-500 text-xs font-mono hover:border-violet-400/50 hover:text-violet-400 transition-all">
              {page}
            </button>
          )}
          <button className="w-9 h-9 flex items-center justify-center rounded-xl border
                             border-violet-500 bg-violet-500 text-white text-xs font-mono
                             font-semibold shadow-md shadow-violet-500/30">
            {page + 1}
          </button>
          {page < totalPages - 1 && (
            <button onClick={() => onChange(page + 1)}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-zinc-800
                         text-zinc-500 text-xs font-mono hover:border-violet-400/50 hover:text-violet-400 transition-all">
              {page + 2}
            </button>
          )}
        </div>

        <button onClick={() => onChange(page + 1)} disabled={page >= totalPages - 1} className={btn}>›</button>
        <button onClick={() => onChange(totalPages - 1)} disabled={page >= totalPages - 1} className={btn}>»</button>
      </div>

      {/* Range + go-to */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-xs text-zinc-500 font-mono">
          Page <span className="text-zinc-200 font-medium">{page + 1}</span>
          <span className="text-zinc-600"> / {totalPages}</span>
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-600">Go</span>
          <input
            key={page}
            type="number" min={1} max={totalPages} defaultValue={page + 1}
            onBlur={e => { const v = +e.target.value - 1; if (v >= 0 && v < totalPages) onChange(v); }}
            onKeyDown={e => { if (e.key === "Enter") { const v = +(e.target as HTMLInputElement).value - 1; if (v >= 0 && v < totalPages) onChange(v); }}}
            className="w-10 h-8 bg-zinc-950 border border-zinc-800 focus:border-violet-500/50
                       rounded-lg text-center text-xs text-zinc-200 outline-none
                       [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                       [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-xs text-zinc-700">/{totalPages}</span>
        </div>
      </div>
    </div>
  );
}
