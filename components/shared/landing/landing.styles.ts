// Inject once in the root landing layout or page
export const LANDING_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700;800&display=swap');

  /* Floating symbol drift */
  @keyframes drift {
    0%   { transform: translateY(0px)   rotate(0deg);  }
    33%  { transform: translateY(-20px) rotate(5deg);  }
    66%  { transform: translateY(10px)  rotate(-3deg); }
    100% { transform: translateY(0px)   rotate(0deg);  }
  }
  .symbol { animation: drift var(--dur) ease-in-out infinite; animation-delay: var(--delay); }

  /* Fade up stagger */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  .fu { animation: fadeUp 0.7s ease forwards; }
  .d1 { animation-delay: 0.1s;  opacity: 0; }
  .d2 { animation-delay: 0.25s; opacity: 0; }
  .d3 { animation-delay: 0.4s;  opacity: 0; }
  .d4 { animation-delay: 0.55s; opacity: 0; }
  .d5 { animation-delay: 0.7s;  opacity: 0; }

  /* Scanline */
  @keyframes scan {
    from { transform: translateY(-100%); }
    to   { transform: translateY(100vh); }
  }
  .scanline::after {
    content: '';
    position: absolute;
    left: 0; right: 0; height: 1px;
    background: linear-gradient(transparent, rgba(52,211,153,0.08), transparent);
    animation: scan 8s linear infinite;
  }

  /* Gradient text */
  .grad-text {
    background: linear-gradient(135deg, #ffffff 0%, #34d399 50%, #6ee7b7 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* CTA pulse */
  @keyframes cta-pulse {
    0%,100% { box-shadow: 0 0 0 0  rgba(52,211,153,0.4); }
    50%     { box-shadow: 0 0 0 12px rgba(52,211,153,0); }
  }
  .cta-primary { animation: cta-pulse 2.5s ease-out infinite; transition: background 0.15s ease, transform 0.15s ease; }
  .cta-primary:hover { background: #6ee7b7; transform: translateY(-2px); }

  /* Feature card */
  .feat-card { transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; }
  .feat-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }

  /* Subject card */
  .subj-card { transition: transform 0.2s ease, border-color 0.2s ease; }
  .subj-card:hover { transform: translateY(-3px); }

  /* MCQ option */
  .opt-btn { transition: all 0.15s ease; }
  .opt-btn:hover { border-color: rgba(52,211,153,0.5); }

  /* Ticker */
  @keyframes ticker {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  .ticker-inner { animation: ticker 20s linear infinite; }

  /* Grid drift */
  @keyframes gridDrift {
    from { background-position: 0 0; }
    to   { background-position: 48px 48px; }
  }
  .grid-bg { animation: gridDrift 12s linear infinite; }

  /* Glow orb */
  @keyframes orbPulse {
    0%,100% { opacity: 0.6; transform: translate(-50%,-50%) scale(1);    }
    50%     { opacity: 0.9; transform: translate(-50%,-50%) scale(1.08); }
  }
  .orb { animation: orbPulse 6s ease-in-out infinite; }

  /* Scroll indicator bounce */
  @keyframes scrollBounce {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(6px); }
  }
  .scroll-ind { animation: scrollBounce 1.8s ease-in-out infinite; }
`;
