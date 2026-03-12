// lib/paper-templates/toLatex.ts
// Converts the app's mixed storage format → clean LaTeX for xelatex.
//
// DB storage format:
//   $...$        inline math
//   $$...$$      display math  
//   \(...\)      inline math (already LaTeX)
//   \[...\]      display math (already LaTeX)
//   \begin{tikzpicture}...\end{tikzpicture}   raw TikZ
//   \begin{circuitikz}...                     raw circuitikz
//   %%TIKZ:encoded%%    tokenized TikZ (rare)
//   %%DM:encoded%%      tokenized display math (rare)
//   %%IM:encoded%%      tokenized inline math (rare)
//   Plain Bengali + English text

export function toLatex(text: string): string {
  if (!text) return "";
  let r = text;

  // 1. Decode %%TOKEN:%% forms back to LaTeX
  r = r.replace(/%%TIKZ:([^%]+)%%/gs, (_, e) => { try { return decodeURIComponent(e); } catch { return ""; } });
  r = r.replace(/%%DM:([^%]+)%%/gs,   (_, e) => { try { return `\\[${decodeURIComponent(e)}\\]`; } catch { return ""; } });
  r = r.replace(/%%IM:([^%]+)%%/gs,   (_, e) => { try { return `\\(${decodeURIComponent(e)}\\)`; } catch { return ""; } });
  r = r.replace(/%%BOX:([^%]*)%%/g,   (_, t) => t);
  r = r.replace(/%%LIST:[^%]*%%/g,     "");

  // 2. $$ → \[ \]  (must be before single $ conversion)
  r = r.replace(/\$\$([\s\S]*?)\$\$/g, (_, m) => `\\[${m}\\]`);

  // 3. $...$ → \(...\)  — skip escaped \$, skip already-converted
  // Handles: $text$, $\cmd{arg}$, $a + b$, etc.
  r = r.replace(/(?<!\$)\$(?!\$)((?:[^$\\]|\\[\s\S])*?)\$(?!\$)/g, (_, m) => `\\(${m}\\)`);

  // 4. Normalize \n escape sequences to real newlines (stored as literal \n in DB)
  r = r.replace(/\\n(?![a-zA-Z{])/g, "\n");

  // 5. Normalize Windows line endings
  r = r.replace(/\r\n/g, "\n");

  // NOTE: Do NOT escape % — the DB questions may contain \% already,
  // and LaTeX math commands like \percent are valid. The template preamble
  // already handles this. Bare % in Bengali text is extremely rare.

  return r.trim();
}

// CQ question block — question field contains full text with ক খ গ ঘ sub-parts
export function buildCQBlock(p: { question: string }): string {
  return `\\question ${toLatex(p.question)}`;
}

// MCQ question block with \begin{tasks}
export function buildMCQBlock(p: {
  question:       string;
  option_a:       string;
  option_b:       string;
  option_c:       string;
  option_d:       string;
  correct_answer: string;
  showAnswer?:    boolean;
}): string {
  const q = toLatex(p.question);
  const a = toLatex(p.option_a || "");
  const b = toLatex(p.option_b || "");
  const c = toLatex(p.option_c || "");
  const d = toLatex(p.option_d || "");

  // Use 2-column tasks if options are short (strip math to measure)
  const bare = (s: string) => s
    .replace(/\\\(.*?\\\)/gs, "X")
    .replace(/\\\[.*?\\\]/gs, "X")
    .replace(/\\[a-zA-Z]+(\{[^}]*\})?/g, "X");
  const maxLen = Math.max(bare(a).length, bare(b).length, bare(c).length, bare(d).length);
  const cols   = maxLen < 30 ? "(2)" : "(1)";

  const answerLine = p.showAnswer
    ? `\n    {\\small\\bfseries উত্তর: ${p.correct_answer.toUpperCase()}}` : "";

  return `\\question ${q}
    \\begin{tasks}${cols}
        \\task ${a}
        \\task ${b}
        \\task ${c}
        \\task ${d}
    \\end{tasks}${answerLine}`;
}
