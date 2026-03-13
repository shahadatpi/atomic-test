// app/api/generate-paper/route.ts
// Fully self-contained — builds complete LaTeX document inline, no external template file.
import { NextRequest, NextResponse } from "next/server";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Problem {
  id:             string;
  question:       string;
  option_a?:      string | null;
  option_b?:      string | null;
  option_c?:      string | null;
  option_d?:      string | null;
  correct_answer?: string;
  customMarks?:   number;
  showAnswer?:    boolean;
  problem_type?:  string;
}

interface PaperFormat {
  templateId?:    string;
  institution?:   string;
  examTitle?:     string;
  subject?:       string;
  time?:          string;
  fullMarks?:     string;
  examDate?:      string;
  watermarkText?: string;
  showAnswers?:   boolean;
}

// ── Convert DB mixed format → LaTeX ──────────────────────────────────────────
function tex(text: string | null | undefined): string {
  if (!text) return "";
  let r = text;
  // Decode app tokens
  r = r.replace(/%%TIKZ:([^%]+)%%/gs, (_, e) => { try { return decodeURIComponent(e); } catch { return ""; } });
  r = r.replace(/%%DM:([^%]+)%%/gs,   (_, e) => { try { return `\\[${decodeURIComponent(e)}\\]`; } catch { return ""; } });
  r = r.replace(/%%IM:([^%]+)%%/gs,   (_, e) => { try { return `\\(${decodeURIComponent(e)}\\)`; } catch { return ""; } });
  r = r.replace(/%%BOX:([^%]*)%%/g,   (_, t) => t);
  r = r.replace(/%%LIST:[^%]*%%/g, "");
  // $$ → \[ \]
  r = r.replace(/\$\$([\s\S]*?)\$\$/g, (_, m) => `\\[${m}\\]`);
  // $ → \( \)
  r = r.replace(/(?<!\$)\$(?!\$)((?:[^$\\]|\\[\s\S])*?)\$(?!\$)/g, (_, m) => `\\(${m}\\)`);
  // Literal \n → real newlines
  r = r.replace(/\\n(?![a-zA-Z{])/g, "\n");
  return r.trim();
}

function isMCQ(p: Problem): boolean {
  if (p.problem_type) return p.problem_type.toLowerCase().includes("mcq");
  return !!(p.option_a || p.option_b);
}

function cqBlock(problems: Problem[]): string {
  return problems.map(p => `\\question ${tex(p.question)}\n`).join("\n");
}

function mcqBlock(problems: Problem[], showAns: boolean): string {
  return problems.map(p => {
    const q = tex(p.question);
    const a = tex(p.option_a); const b = tex(p.option_b);
    const c = tex(p.option_c); const d = tex(p.option_d);
    const bare = (s: string) => s.replace(/\\\([\s\S]*?\\\)/g, "X").replace(/\\[a-zA-Z]+(?:\{[^}]*\})?/g, "X");
    const cols = Math.max(bare(a).length, bare(b).length, bare(c).length, bare(d).length) < 30 ? "(2)" : "(1)";
    const ans  = (showAns || p.showAnswer) && p.correct_answer
      ? `\n    {\\small\\bfseries উত্তর: ${p.correct_answer.toUpperCase()}}` : "";
    return `\\question ${q}\n    \\begin{tasks}${cols}\n        \\task ${a}\n        \\task ${b}\n        \\task ${c}\n        \\task ${d}\n    \\end{tasks}${ans}\n`;
  }).join("\n");
}

// ── Build complete LaTeX document ─────────────────────────────────────────────
function buildDocument(problems: Problem[], fmt: PaperFormat): string {
  const cqList  = problems.filter(p => !isMCQ(p));
  const mcqList = problems.filter(p =>  isMCQ(p));
  const showAns = fmt.showAnswers ?? false;
  const marks   = fmt.fullMarks?.trim() || String(problems.reduce((s, p) => s + (p.customMarks ?? 1), 0));
  const wm      = fmt.watermarkText?.trim() || fmt.subject?.trim() || "AtomicTest";

  const institutionLine = fmt.institution?.trim()
    ? `{\\large\\bfseries ${fmt.institution.trim()}}\\\\[2pt]\n` : "";
  const dateLine = fmt.examDate?.trim()
    ? `\\\\\n{\\small ${fmt.examDate.trim()}}` : "";

  const cqSection = cqList.length > 0 ? `
%% ── Creative Questions ──────────────────────────────────────────────────────
\\begin{questions}
${cqBlock(cqList)}
\\end{questions}

\\pagebreak
` : "";

  const mcqSection = mcqList.length > 0 ? `
%% ── MCQ Section ─────────────────────────────────────────────────────────────
\\begin{center}
{\\Large নৈর্ব্যক্তিক প্রশ্ন}
\\end{center}

\\begin{multicols}{2}
\\setlength{\\columnseprule}{1pt}
\\setlength{\\columnsep}{2em}
\\begin{questions}
${mcqBlock(mcqList, showAns)}
\\end{questions}
\\end{multicols}
` : "";

  return `\\documentclass[addpoints,legalpaper]{exam}

%% ── Packages ─────────────────────────────────────────────────────────────────
\\usepackage{multicol}
\\usepackage{nicematrix}
\\usepackage{mathtools,array,amsmath,amssymb}
\\usepackage{graphicx,adjustbox}
\\usepackage{tasks}[newest]
\\usepackage{draftwatermark}
\\usepackage[top=.5in,left=0.5in,right=0.5in,bottom=0.75in]{geometry}

%% ── TikZ ─────────────────────────────────────────────────────────────────────
\\usepackage{tikz,pgfplots}
\\pgfplotsset{compat=1.18}
\\usetikzlibrary{angles,quotes,positioning,calc,decorations.markings}
\\usepackage[americanvoltages,fulldiodes,siunitx,nooldvoltagedirection,RPvoltages]{circuitikz}
\\usepackage{dirtytalk}
\\usetikzlibrary{shapes,arrows.meta,patterns,decorations.pathmorphing,decorations.markings}
\\ctikzset{resistors/scale=0.8,capacitors/scale=0.7,diodes/scale=0.7,transistors/scale=1.3,voltage=american}

%% ── Bengali fonts ────────────────────────────────────────────────────────────
%% Kalpurush if available (local + Render with fonts/), else Noto Sans Bengali
\\usepackage{fontspec}
\\usepackage{polyglossia}
\\setmainlanguage{bengali}
\\setotherlanguage{english}
\\IfFontExistsTF{Kalpurush}{
  \\setmainfont[Script=Bengali]{Kalpurush}
}{
  \\setmainfont[Script=Bengali]{Noto Sans Bengali}
}

%% ── TikZ helpers ────────────────────────────────────────────────────────────
\\tikzset{
  directed/.style={postaction={decorate,decoration={markings,
    mark=at position .65 with {\\arrow{stealth}}}}},
  mid arrow/.style={postaction={decorate,decoration={markings,
    mark=at position .5 with {\\arrow[#1]{stealth}}}}},
}
\\newcommand{\\arrowIn}{%
  \\tikz \\draw[-stealth] (-1pt,0) -- (1pt,0);%
}

%% ── CircuiTikZ rbulb bipole ──────────────────────────────────────────────────
\\makeatletter
\\pgfcircdeclarebipolescaled{misc}
  {}{}
  {rbulb}
  {\\ctikzvalof{bipoles/bulb/height}}{\\ctikzvalof{bipoles/bulb/width}}
{%
  \\pgf@circ@setlinewidth{bipoles}{\\pgfstartlinewidth}
  \\pgfpathellipse{\\pgfpointorigin}
    {\\pgfpoint{0}{0.8\\pgf@circ@res@up}}
    {\\pgfpoint{0.8\\pgf@circ@res@left}{0}}
  \\pgf@circ@draworfill
  \\pgfpathmoveto{\\pgfpoint{\\pgf@circ@res@left}{\\pgf@circ@res@zero}}
  \\pgfpathlineto{\\pgfpoint{0.8\\pgf@circ@res@left}{\\pgf@circ@res@zero}}
  \\pgfpathcurveto
    {\\pgfpoint{0.5\\pgf@circ@res@left}{+0pt}}
    {\\pgfpoint{0.4\\pgf@circ@res@left}{0.6\\pgf@circ@res@left}}
    {\\pgfpoint{+0pt}{+0pt}}
  \\pgfpathcurveto
    {\\pgfpoint{.2\\pgf@circ@res@right}{.2\\pgf@circ@res@right}}
    {\\pgfpoint{.2\\pgf@circ@res@right}{0.6\\pgf@circ@res@right}}
    {\\pgfpoint{+0pt}{0.6\\pgf@circ@res@right}}
  \\pgfpathcurveto
    {\\pgfpoint{.2\\pgf@circ@res@left}{0.6\\pgf@circ@res@right}}
    {\\pgfpoint{.2\\pgf@circ@res@left}{.2\\pgf@circ@res@right}}
    {\\pgfpoint{+0pt}{+0pt}}
  \\pgfpathcurveto
    {\\pgfpoint{0.4\\pgf@circ@res@right}{0.6\\pgf@circ@res@left}}
    {\\pgfpoint{0.5\\pgf@circ@res@right}{+0pt}}
    {\\pgfpoint{0.8\\pgf@circ@res@right}{\\pgf@circ@res@zero}}
  \\pgfpathlineto{\\pgfpoint{\\pgf@circ@res@right}{\\pgf@circ@res@zero}}
  \\pgfusepath{draw}
}%
\\pgfcirc@activate@bipole@simple{l}{rbulb}
\\makeatother

%% ── Tasks & Watermark ────────────────────────────────────────────────────────
\\newcommand*\\tasklabelformat[1]{#1.}
\\settasks{label=\\Alph*,label-format=\\tasklabelformat,label-width=12pt}
\\SetWatermarkText{${wm}}
\\SetWatermarkScale{.5}
\\SetWatermarkLightness{0.9}
\\setlength{\\parindent}{0pt}

\\begin{document}

%% ── Header ───────────────────────────────────────────────────────────────────
\\begin{center}
${institutionLine}{\\Large ${fmt.examTitle?.trim() || "পরীক্ষার প্রশ্নপত্র"}}\\\\[2pt]
{\\large ${fmt.subject?.trim() || ""}}\\\\[4pt]
সময়ঃ ${fmt.time?.trim() || "৩ ঘন্টা"} \\hfill পূর্ণমানঃ ${marks}${dateLine}
\\end{center}
\\rule{\\textwidth}{0.4pt}
\\vspace{4pt}
${cqSection}${mcqSection}
\\end{document}`;
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: { problems?: Problem[]; format?: PaperFormat };
  try { body = await req.json(); }
  catch { return new NextResponse("Invalid JSON", { status: 400 }); }

  const { problems = [], format = {} } = body;
  const params = req.nextUrl.searchParams;

  // ?debug=1 → show what server received
  if (params.get("debug") === "1") {
    return NextResponse.json({
      problemCount: problems.length,
      firstProblem: problems[0] ?? null,
      mcqCount: problems.filter(isMCQ).length,
      cqCount:  problems.filter(p => !isMCQ(p)).length,
      format,
    });
  }

  if (!problems.length) return new NextResponse("No problems", { status: 400 });

  const latex = buildDocument(problems, format);

  // ?latex=1 → return raw LaTeX for inspection
  if (params.get("latex") === "1") {
    return new NextResponse(latex, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  const tikzUrl = process.env.TIKZ_SERVICE_URL ?? "http://localhost:3001";
  let res: Response;
  try {
    res = await fetch(`${tikzUrl}/compile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latex, engine: "xelatex", format: "pdf" }),
      signal: AbortSignal.timeout(180_000),
    });
  } catch (e) {
    return new NextResponse(`tikz-service unreachable: ${e}`, { status: 502 });
  }

  if (!res.ok) {
    const err = await res.text();
    return new NextResponse(`LaTeX error:\n\n${err.slice(-4000)}`, { status: 500 });
  }

  const pdf      = await res.arrayBuffer();
  const filename = encodeURIComponent(`${format.examTitle || "question-paper"}.pdf`);
  return new NextResponse(pdf, {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
