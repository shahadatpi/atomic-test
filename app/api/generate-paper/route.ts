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

  // 1. Decode custom app tokens
  r = r.replace(/%%TIKZ:([^%]+)%%/gs, (_, e) => { try { return decodeURIComponent(e); } catch { return ""; } });
  r = r.replace(/%%DM:([^%]+)%%/gs,   (_, e) => { try { return `\\[${decodeURIComponent(e)}\\]`; } catch { return ""; } });
  r = r.replace(/%%IM:([^%]+)%%/gs,   (_, e) => { try { return `\\(${decodeURIComponent(e)}\\)`; } catch { return ""; } });
  r = r.replace(/%%BOX:([^%]*)%%/g,   (_, t) => `\\fbox{${t}}`);
  r = r.replace(/%%LIST:[^%]*%%/g, "");

  // 2. Already-LaTeX math delimiters — pass through unchanged
  // \[ ... \] and \( ... \) are already valid LaTeX, leave them

  // 3. $$ → \[ \] (display math)
  r = r.replace(/\$\$([\s\S]*?)\$\$/g, (_, m) => `\\[${m}\\]`);

  // 4. $ → \( \) (inline math) — skip already-escaped dollars
  r = r.replace(/(?<!\\)(?<!\$)\$(?!\$)((?:[^$\\]|\\[\s\S])*?)\$(?!\$)/g, (_, m) => `\\(${m}\\)`);

  // 5. Literal \n → paragraph break, but ONLY outside TikZ environments.
  //    Inside tikz/circuitikz blocks, \n is a valid variable name (\foreach \n in {...})
  //    and blank lines break \pgffor. So we extract tikz blocks, process outside, restore.
  {
    const TIKZ_RE = /\\begin\{(tikzpicture|circuitikz)[^}]*\}[\s\S]*?\\end\{\1\}/g;
    const tikzBlocks: string[] = [];
    // Stash tikz blocks as placeholders
    r = r.replace(TIKZ_RE, (match) => {
      tikzBlocks.push(match);
      return `%%TIKZBLOCK_${tikzBlocks.length - 1}%%`;
    });
    // Now safe to replace \n outside tikz
    r = r.replace(/\\n(?![a-zA-Z{])/g, "\n\n");
    // Restore tikz blocks verbatim (no newline changes inside)
    r = r.replace(/%%TIKZBLOCK_(\d+)%%/g, (_, i) => tikzBlocks[parseInt(i)]);
  }

  // 6. Bold/italic markdown → LaTeX
  r = r.replace(/\*\*([^*]+)\*\*/g, "\\textbf{$1}");
  r = r.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "\\textit{$1}");

  return r.trim();
}

function isMCQ(p: Problem): boolean {
  if (p.problem_type) return p.problem_type.toLowerCase().includes("mcq");
  return !!(p.option_a || p.option_b);
}

function isCQ(p: Problem): boolean {
  return p.problem_type === "board_cq";
}

function cqBlock(problems: Problem[]): string {
  return problems.map((p, i) => {
    const qnum = i + 1;
    const lines: string[] = [];

    if (isCQ(p)) {
      // CQ format: numbered, uddharan (context) then ক খ গ ঘ with marks on right
      lines.push(`\\question[10] ${tex(p.question)}`);
      const subs = [
        { label: "ক", mark: 1, val: p.option_a },
        { label: "খ", mark: 2, val: p.option_b },
        { label: "গ", mark: 3, val: p.option_c },
        { label: "ঘ", mark: 4, val: p.option_d },
      ].filter(s => s.val?.trim());

      if (subs.length > 0) {
        lines.push("\\begin{cqparts}");
        for (const s of subs) {
          lines.push(`  \\cqpart{${s.label}}{${s.mark}}{${tex(s.val!)}}`);
        }
        lines.push("\\end{cqparts}");
      }
    } else {
      lines.push(`\\question ${tex(p.question)}`);
    }

    return lines.join("\n") + "\n";
  }).join("\n");
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

  const cqTotalMarks = cqList.reduce((s, p) => s + (p.customMarks ?? 10), 0);
  const cqSection = cqList.length > 0 ? `
%% ── Creative Questions ──────────────────────────────────────────────────────
\\begin{center}
{\\large\\bfseries সৃজনশীল প্রশ্ন}
\\end{center}
\\vspace{2pt}
\\begin{tabular*}{\\textwidth}{@{\\extracolsep{\\fill}}lr}
{\\small যেকোনো ${Math.min(cqList.length, 7)}টি প্রশ্নের উত্তর দাও।} & {\\small প্রতিটি প্রশ্নের মান ১০}
\\end{tabular*}
\\vspace{4pt}
\\hrule
\\vspace{6pt}
\\begin{questions}
\\qformat{\\textbf{প্রশ্ন \\thequestion.}\\hfill}
${cqBlock(cqList)}
\\end{questions}

\\pagebreak
` : "";

  const mcqSection = mcqList.length > 0 ? `
%% ── MCQ Section ─────────────────────────────────────────────────────────────
\\begin{center}
{\\large\\bfseries নৈর্ব্যক্তিক প্রশ্ন}
\\end{center}
\\vspace{2pt}
\\begin{tabular*}{\\textwidth}{@{\\extracolsep{\\fill}}lr}
{\\small প্রতিটি প্রশ্নের মান ১} & {\\small মোট নম্বর: ${mcqList.length}}
\\end{tabular*}
\\vspace{4pt}
\\hrule
\\vspace{6pt}
\\begin{multicols}{2}
\\setlength{\\columnseprule}{0.4pt}
\\setlength{\\columnsep}{1.5em}
\\begin{questions}
\\qformat{\\textbf{\\thequestion.}\\hfill}
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
\\usepackage{enumitem}
\\usepackage[top=0.6in,left=0.65in,right=0.65in,bottom=0.75in]{geometry}

%% ── TikZ ─────────────────────────────────────────────────────────────────────
\\usepackage{tikz,pgfplots}
\\pgfplotsset{compat=1.18}
\\usetikzlibrary{angles,quotes,positioning,calc,decorations.markings,arrows.meta}
\\usepackage[americanvoltages,fulldiodes,siunitx,nooldvoltagedirection,RPvoltages]{circuitikz}
\\ctikzset{resistors/scale=0.8,capacitors/scale=0.7,diodes/scale=0.7,transistors/scale=1.3,voltage=american}

%% ── Custom TikZ commands ─────────────────────────────────────────────────────
%% \arrowIn — used as node content on TikZ paths to show arrow direction
\\tikzset{
  arrowInStyle/.style={
    decoration={markings,mark=at position 0.5 with {\\arrow[scale=1.5]{>}}},
    postaction={decorate}
  }
}
\\newcommand{\\arrowIn}{$\\rightarrow$}

%% ── Bengali fonts ───────────────────────────────────────────────────────────
\\usepackage{fontspec}
\\usepackage{polyglossia}
\\setmainlanguage{bengali}
\\setotherlanguage{english}
%% Try Kalpurush first, fall back to any available Bengali-capable font
\\IfFontExistsTF{Kalpurush}{
  \\setmainfont[Script=Bengali]{Kalpurush}
  \\newfontfamily\\bengalifont[Script=Bengali]{Kalpurush}
}{
  \\IfFontExistsTF{Noto Serif Bengali}{
    \\setmainfont[Script=Bengali]{Noto Serif Bengali}
    \\newfontfamily\\bengalifont[Script=Bengali]{Noto Serif Bengali}
  }{
    \\IfFontExistsTF{SolaimanLipi}{
      \\setmainfont[Script=Bengali]{SolaimanLipi}
      \\newfontfamily\\bengalifont[Script=Bengali]{SolaimanLipi}
    }{
      \\newfontfamily\\bengalifont{FreeSerif}
    }
  }
}
\\IfFontExistsTF{Siyam Rupali}{
  \\newfontfamily\\bengalitermfont[Script=Bengali]{Siyam Rupali}
}{\\let\\bengalitermfont\\bengalifont}

%% ── Tasks & Watermark ────────────────────────────────────────────────────────
\\newcommand*\\tasklabelformat[1]{#1.}
\\settasks{label=\\Alph*,label-format=\\tasklabelformat,label-width=12pt}

%% ── CQ sub-question parts: ক খ গ ঘ with mark on right ──────────────────────
%% Override exam class \part to suppress (a)/(b) and point display entirely
\\renewcommand{\\partlabel}{\\relax}
\\pointsinrightmargin
\\bracketedpoints
\\noprintanswers
%% \cqpart{label}{mark}{text} — renders as:  ক.  <text>  \hfill  mark
\\newcommand{\\cqpart}[3]{%
  \\item[\\textbf{#1.}] #3 \\hfill \\textbf{#2}%
}
%% Use a list environment instead of exam's parts for full control
\\newenvironment{cqparts}{%
  \\begin{list}{}{\\setlength{\\leftmargin}{1.2em}\\setlength{\\itemsep}{4pt}\\setlength{\\topsep}{6pt}}%
}{%
  \\end{list}%
}
\\SetWatermarkText{${wm}}
\\SetWatermarkScale{.5}
\\SetWatermarkLightness{0.9}
\\setlength{\\parindent}{0pt}

\\begin{document}

%% ── Header ───────────────────────────────────────────────────────────────────
\\begin{center}
${institutionLine}{\\LARGE\\bfseries ${fmt.examTitle?.trim() || "পরীক্ষার প্রশ্নপত্র"}}\\\\[3pt]
{\\large ${fmt.subject?.trim() || ""}}\\\\[6pt]
\\end{center}
\\noindent\\begin{tabular*}{\\textwidth}{@{}l@{\\extracolsep{\\fill}}r@{}}
সময়ঃ ${fmt.time?.trim() || "৩ ঘন্টা"} & পূর্ণমানঃ ${marks}${dateLine}
\\end{tabular*}
\\vspace{2pt}
\\hrule\\hrule
\\vspace{8pt}
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
