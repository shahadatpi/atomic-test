"use client";

export interface PaperFormat {
  templateId:    string;
  institution:   string;
  examTitle:     string;
  subject:       string;
  time:          string;
  fullMarks:     string;
  examDate:      string;
  watermarkText: string;
  showAnswers:   boolean;
}

export const DEFAULT_FORMAT: PaperFormat = {
  templateId:    "board-cq-mcq",
  institution:   "",
  examTitle:     "মডেল টেস্ট − ২০২৫",
  subject:       "পদার্থবিজ্ঞান − ২য় পত্র",
  time:          "৩ ঘন্টা",
  fullMarks:     "75",
  examDate:      "",
  watermarkText: "",
  showAnswers:   false,
};

const TEMPLATES = [
  {
    id:          "board-cq-mcq",
    name:        "বোর্ড স্ট্যান্ডার্ড",
    description: "সৃজনশীল + নৈর্ব্যক্তিক, লিগ্যাল পেপার, ওয়াটারমার্ক",
    badge:       "CQ + MCQ",
    badgeColor:  "bg-violet-500/20 text-violet-300 border-violet-500/30",
  },
  // Add more templates here as you create them
];

interface Props {
  format:         PaperFormat;
  setFormat:      React.Dispatch<React.SetStateAction<PaperFormat>>;
  totalQuestions: number;
  totalMarks:     number;
}

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <div className="flex items-baseline gap-2">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {hint && <span className="text-xs text-muted-foreground/50">{hint}</span>}
    </div>
    {children}
  </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
  />
);

const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
  <label className="flex items-center gap-3 cursor-pointer">
    <div onClick={onChange}
      className={`w-9 h-5 rounded-full transition-colors relative ${checked ? "bg-violet-500" : "bg-muted"}`}>
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
    </div>
    <span className="text-sm text-foreground">{label}</span>
  </label>
);

export default function PaperFormatPanel({ format, setFormat, totalQuestions, totalMarks }: Props) {
  const set = (key: keyof PaperFormat, val: any) =>
    setFormat(f => ({ ...f, [key]: val }));

  return (
    <div className="space-y-4 max-w-2xl">

      {/* Stats */}
      <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3 flex gap-6 text-sm">
        <div><span className="text-muted-foreground">প্রশ্ন: </span><span className="font-semibold text-foreground">{totalQuestions}</span></div>
        <div><span className="text-muted-foreground">নম্বর: </span><span className="font-semibold text-violet-400">{totalMarks}</span></div>
      </div>

      {/* Template selector */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">টেমপ্লেট বেছে নিন</h3>
        <div className="grid gap-2">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => set("templateId", t.id)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                format.templateId === t.id
                  ? "border-violet-500 bg-violet-500/10"
                  : "border-border hover:border-border/80 hover:bg-accent/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  format.templateId === t.id ? "border-violet-500 bg-violet-500" : "border-muted-foreground"
                }`}>
                  {format.templateId === t.id && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{t.name}</span>
                    <span className={`text-xs border rounded-full px-2 py-0.5 ${t.badgeColor}`}>{t.badge}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Paper details */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">প্রশ্নপত্রের তথ্য</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="প্রতিষ্ঠানের নাম" hint="(ঐচ্ছিক)">
            <Input
              value={format.institution}
              onChange={e => set("institution", e.target.value)}
              placeholder="স্কুল / কলেজের নাম"
            />
          </Field>
          <Field label="পরীক্ষার শিরোনাম">
            <Input
              value={format.examTitle}
              onChange={e => set("examTitle", e.target.value)}
              placeholder="মডেল টেস্ট − ২০২৫"
            />
          </Field>
          <Field label="বিষয়">
            <Input
              value={format.subject}
              onChange={e => set("subject", e.target.value)}
              placeholder="পদার্থবিজ্ঞান − ২য় পত্র"
            />
          </Field>
          <Field label="সময়">
            <Input
              value={format.time}
              onChange={e => set("time", e.target.value)}
              placeholder="৩ ঘন্টা"
            />
          </Field>
          <Field label="পূর্ণমান">
            <Input
              value={format.fullMarks}
              onChange={e => set("fullMarks", e.target.value)}
              placeholder={String(totalMarks)}
            />
          </Field>
          <Field label="তারিখ" hint="(ঐচ্ছিক)">
            <Input
              value={format.examDate}
              onChange={e => set("examDate", e.target.value)}
              placeholder="১ জানুয়ারি ২০২৫"
            />
          </Field>
          <Field label="ওয়াটারমার্ক টেক্সট" hint="(খালি রাখলে বিষয় ব্যবহার হবে)">
            <Input
              value={format.watermarkText}
              onChange={e => set("watermarkText", e.target.value)}
              placeholder={format.subject || "পদার্থবিজ্ঞান − ২য় পত্র"}
            />
          </Field>
        </div>
      </div>

      {/* Display options */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">প্রদর্শন সেটিংস</h3>
        <Toggle
          checked={format.showAnswers}
          onChange={() => set("showAnswers", !format.showAnswers)}
          label="MCQ উত্তর দেখাও (Answer Key)"
        />
      </div>
    </div>
  );
}
