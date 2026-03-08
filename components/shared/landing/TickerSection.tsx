import { TICKER_TOPICS } from "./landing.constants";

export default function TickerSection() {
  return (
    <div className="border-y border-zinc-800 py-3 overflow-hidden bg-zinc-900/50">
      <div className="ticker-inner flex gap-12 whitespace-nowrap">
        {[...Array(2)].map((_, rep) => (
          <div key={rep} className="flex gap-12">
            {TICKER_TOPICS.map((t) => (
              <span
                key={t}
                className="text-sm text-zinc-600 font-mono flex items-center gap-3"
              >
                <span className="text-emerald-400 text-xs">✦</span> {t}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
