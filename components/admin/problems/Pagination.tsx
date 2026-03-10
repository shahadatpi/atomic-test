interface PaginationProps {
  page:       number
  totalPages: number
  total:      number
  pageSize:   number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const from = page * pageSize + 1
  const to   = Math.min((page + 1) * pageSize, total)

  // Build page list with ellipsis
  const pages = Array.from({ length: totalPages }, (_, i) => i)
    .filter(i => i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 2)
    .reduce<(number | "…")[]>((acc, i, idx, arr) => {
      if (idx > 0 && (arr[idx - 1] as number) < i - 1) acc.push("…")
      acc.push(i)
      return acc
    }, [])

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 space-y-3">

      {/* Summary + jump-to */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          <span className="text-zinc-300 font-medium">{from}–{to}</span>
          <span className="text-zinc-600"> of </span>
          <span className="text-zinc-300 font-medium">{total}</span>
          <span className="text-zinc-600"> problems</span>
        </p>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>Go to</span>
          <input
            type="number" min={1} max={totalPages} value={page + 1}
            onChange={e => {
              const v = parseInt(e.target.value) - 1
              if (v >= 0 && v < totalPages) onPageChange(v)
            }}
            className="w-14 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1
                       text-center text-zinc-200 outline-none focus:border-violet-500/50
                       [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                       [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-zinc-600">/ {totalPages}</span>
        </div>
      </div>

      {/* Page buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 0}
          className="px-3 py-1.5 rounded-lg border border-zinc-800 text-xs text-zinc-400
                     disabled:opacity-30 hover:border-zinc-600 hover:text-zinc-200 transition-colors">
          ← Prev
        </button>

        {pages.map((item, idx) =>
          item === "…" ? (
            <span key={`e-${idx}`} className="px-1 text-zinc-600 text-xs">…</span>
          ) : (
            <button key={item} onClick={() => onPageChange(item as number)}
              className={`min-w-[32px] px-2 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                page === item
                  ? "border-violet-500 bg-violet-500/10 text-violet-400 font-semibold"
                  : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              }`}>
              {(item as number) + 1}
            </button>
          )
        )}

        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1}
          className="px-3 py-1.5 rounded-lg border border-zinc-800 text-xs text-zinc-400
                     disabled:opacity-30 hover:border-zinc-600 hover:text-zinc-200 transition-colors">
          Next →
        </button>
      </div>
    </div>
  )
}
