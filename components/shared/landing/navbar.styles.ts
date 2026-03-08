export const navbarStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

  .navbar { font-family: 'DM Sans', sans-serif; }

  @keyframes dropDown {
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
  .dropdown-anim { animation: dropDown 0.18s ease forwards; }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  .mobile-anim { animation: slideDown 0.2s ease forwards; }

  .nav-pill { transition: color 0.15s ease, background 0.15s ease; }
  .nav-pill:hover { background: rgba(52,211,153,0.08); color: #34d399; }
  .nav-pill.active { color: #34d399; }

  .drop-item { transition: background 0.12s ease, color 0.12s ease; }
  .drop-item:hover { background: rgba(52,211,153,0.07); }

  .theme-btn { transition: background 0.12s ease, border-color 0.12s ease; }
  .theme-btn:hover { background: rgba(52,211,153,0.08); border-color: rgba(52,211,153,0.3); }
  .theme-btn.selected { background: rgba(52,211,153,0.12); border-color: rgba(52,211,153,0.5); color: #34d399; }

  .avatar-ring { transition: box-shadow 0.15s ease; }
  .avatar-ring:hover { box-shadow: 0 0 0 2px #34d399; }

  .sign-out-item { transition: background 0.12s ease; }
  .sign-out-item:hover { background: rgba(239,68,68,0.08); }

  .cta-btn { transition: background 0.15s ease, transform 0.15s ease; }
  .cta-btn:hover { background: #6ee7b7; transform: translateY(-1px); }

  .hamburger { transition: color 0.15s ease; }
  .hamburger:hover { color: white; }
`;
