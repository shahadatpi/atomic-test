export interface Problem {
  id:             string;
  subject_id:     string | null;
  topic_id:       string | null;
  question:       string;
  option_a:       string | null;
  option_b:       string | null;
  option_c:       string | null;
  option_d:       string | null;
  correct_answer: string | null;
  explanation:    string | null;
  difficulty:     string;
  is_free:        boolean;
  tags:           string[] | null;
  source:         string | null;
  created_at:     string;
  subtopic_id:    string | null;
  subjects:       { name: string };
  topics:         { name: string };
  subtopics:      { name: string } | null;
  problem_type:   string | null;
}

export interface Subject  { id: string; name: string; }
export interface Topic    { id: string; name: string; subject_id: string; }
export interface Subtopic { id: string; name: string; topic_id: string; }

export const INSTITUTES = [
  { key: "DU",      label: "DU",      color: "violet"  },
  { key: "BUET",    label: "BUET",    color: "sky"     },
  { key: "CUET",    label: "CUET",    color: "amber"   },
  { key: "RUET",    label: "RUET",    color: "emerald" },
  { key: "KUET",    label: "KUET",    color: "rose"    },
  { key: "SUST",    label: "SUST",    color: "indigo"  },
  { key: "CKRUET",  label: "CKRUET",  color: "teal"    },
  { key: "Medical", label: "Medical", color: "pink"    },
  { key: "Board",   label: "Board",   color: "orange"  },
  { key: "DB",      label: "DB",      color: "cyan"    },
];

export const INST_COLORS: Record<string, string> = {
  violet:  "border-violet-400  bg-violet-400/10  text-violet-300",
  sky:     "border-sky-400     bg-sky-400/10     text-sky-300",
  amber:   "border-amber-400   bg-amber-400/10   text-amber-300",
  emerald: "border-emerald-400 bg-emerald-400/10 text-emerald-300",
  rose:    "border-rose-400    bg-rose-400/10    text-rose-300",
  indigo:  "border-indigo-400  bg-indigo-400/10  text-indigo-300",
  teal:    "border-teal-400    bg-teal-400/10    text-teal-300",
  pink:    "border-pink-400    bg-pink-400/10    text-pink-300",
  orange:  "border-orange-400  bg-orange-400/10  text-orange-300",
  cyan:    "border-cyan-400    bg-cyan-400/10    text-cyan-300",
};

export function getYears(): string[] {
  const y = new Date().getFullYear();
  return Array.from({ length: 30 }, (_, i) => {
    const start = y - 5 + i;
    return `${start}-${String(start + 1).slice(-2)}`;
  }).reverse();
}

export function parseInstTag(tag: string): { inst: string; year: string } | null {
  const m = tag.match(/^([^:]+):\s*(.+)$/);
  return m ? { inst: m[1].trim(), year: m[2].trim() } : null;
}

export const isCQ = (p: Problem) => {
  // If correct_answer is set, it is always MCQ regardless of problem_type label
  if (p.correct_answer) return false;
  // If problem_type explicitly says cq or written, it's CQ
  if (p.problem_type && /cq|written/i.test(p.problem_type)) return true;
  // No correct_answer and no MCQ type → treat as CQ
  return false;
};
