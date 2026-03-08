/* ── Floating math symbols ── */
export const SYMBOLS = [
  "∫", "∑", "∂", "√", "π", "∞", "Δ", "λ", "θ", "φ",
  "α", "β", "γ", "ω", "∇", "≈", "≠", "∈", "∀", "∃",
  "F=ma", "E=mc²", "∇²φ", "∮", "⊗", "ℏ",
];

/* ── Demo MCQ ── */
export const DEMO_PROBLEM = {
  question: "A particle moves with velocity $v = 3t^2 - 2t$ m/s. What is the acceleration at $t = 2$ s?",
  options: ["$8 \\ \\text{m/s}^2$", "$10 \\ \\text{m/s}^2$", "$12 \\ \\text{m/s}^2$", "$14 \\ \\text{m/s}^2$"],
  correct: 1,
  explanation:
    "Acceleration is the derivative of velocity: $a = \\dfrac{dv}{dt} = 6t - 2$. At $t = 2$ s: $a = 6(2) - 2 = \\mathbf{10 \\ \\text{m/s}^2}$",
};

/* ── Stats ── */
export const STATS = [
  { value: "500+", label: "MCQ Problems"          },
  { value: "2",    label: "Subjects"               },
  { value: "98%",  label: "Student Satisfaction"   },
  { value: "10k+", label: "Problems Solved"        },
];

/* ── Features ── */
export const FEATURES = [
  { icon: "∫",  title: "LaTeX Rendering",   desc: "Every equation renders beautifully with full LaTeX support — just like a textbook.",           color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
  { icon: "⚡", title: "Instant Feedback",  desc: "Submit your answer and get a detailed explanation with step-by-step working immediately.",     color: "text-sky-400",     bg: "bg-sky-400/10 border-sky-400/20"         },
  { icon: "📈", title: "Progress Tracking", desc: "Track accuracy, streaks, and weak topics. Know exactly what to practice next.",               color: "text-violet-400",  bg: "bg-violet-400/10 border-violet-400/20"   },
  { icon: "🎯", title: "Adaptive Practice", desc: "Problems ranked by difficulty. Graduate from easy to hard at your own pace.",                 color: "text-amber-400",   bg: "bg-amber-400/10 border-amber-400/20"     },
  { icon: "🔒", title: "Free & Pro Plans",  desc: "Start free with 50+ problems. Upgrade to unlock everything including AI hints.",              color: "text-rose-400",    bg: "bg-rose-400/10 border-rose-400/20"       },
  { icon: "🏆", title: "Leaderboard",       desc: "Compete with peers globally. See where you rank and push your limits.",                       color: "text-orange-400",  bg: "bg-orange-400/10 border-orange-400/20"   },
];

/* ── Subjects ── */
export const SUBJECTS = [
  {
    name: "Mathematics",
    icon: "∑",
    color: "emerald",
    rgbColor: "52,211,153",
    topics: ["Calculus", "Algebra", "Trigonometry", "Statistics", "Vectors", "Complex Numbers"],
    count: 280,
  },
  {
    name: "Physics",
    icon: "⚛",
    color: "sky",
    rgbColor: "56,189,248",
    topics: ["Mechanics", "Thermodynamics", "Electromagnetism", "Optics", "Quantum", "Relativity"],
    count: 220,
  },
];

/* ── Ticker topics ── */
export const TICKER_TOPICS = [
  "Calculus", "Mechanics", "Algebra", "Thermodynamics",
  "Vectors", "Optics", "Statistics", "Quantum Physics",
  "Trigonometry", "Electromagnetism",
];

/* ── Pricing ── */
export const FREE_FEATURES = [
  "50+ free MCQ problems",
  "Basic progress tracking",
  "LaTeX rendering",
  "Community leaderboard",
];

export const PRO_FEATURES = [
  "All 500+ MCQ problems",
  "Step-by-step explanations",
  "AI-powered hints",
  "Advanced analytics",
  "Priority support",
  "New problems weekly",
];
