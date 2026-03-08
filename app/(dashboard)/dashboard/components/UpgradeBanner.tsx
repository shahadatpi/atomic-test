export default function UpgradeBanner() {
  return (
    <div className="relative overflow-hidden bg-zinc-900 border border-zinc-800 rounded-xl
                    p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center
                    justify-between gap-4">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 85% 50%, rgba(52,211,153,0.08) 0%, transparent 65%)",
        }}
      />
      <div>
        <p className="text-xs text-emerald-400 font-mono mb-1">PRO PLAN</p>
        <h3 className="text-white font-semibold mb-1">Unlock all 500+ problems</h3>
        <p className="text-zinc-500 text-sm">
          Get unlimited access, hints &amp; detailed explanations.
        </p>
      </div>
      <button className="shrink-0 bg-emerald-400 hover:bg-emerald-300 text-zinc-950
                         font-semibold text-sm px-6 py-3 rounded-xl transition-colors
                         w-full sm:w-auto">
        Upgrade Now →
      </button>
    </div>
  )
}
