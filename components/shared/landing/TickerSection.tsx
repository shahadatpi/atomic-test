import { TICKER_TOPICS } from "./landing.constants";

export default function TickerSection() {
  // Duplicate enough times so the loop is seamless
  const items = [...TICKER_TOPICS, ...TICKER_TOPICS];

  return (
    <div className="border-y border-zinc-800 py-3 overflow-hidden bg-zinc-900/50">
      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .ticker-track {
          animation: ticker 22s linear infinite;
          will-change: transform;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="ticker-track flex gap-12 whitespace-nowrap w-max">
        {items.map((t, i) => (
          <span
            key={i}
            className="text-sm text-zinc-600 font-mono flex items-center gap-3"
          >
            <span className="text-emerald-400 text-xs">✦</span> {t}
          </span>
        ))}
      </div>
    </div>
  );
}
