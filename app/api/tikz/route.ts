import { NextRequest, NextResponse } from "next/server";

// Detect Bengali Unicode or XeLaTeX-specific commands
function needsXelatex(code: string): boolean {
  return /[\u0980-\u09FF]/.test(code) ||
         /\\usepackage\{(polyglossia|fontspec)\}/.test(code) ||
         /\\setmainlanguage/.test(code);
}

// Bengali XeLaTeX preamble packages
const BENGALI_PACKAGES = `\\usepackage{fontspec}
\\usepackage{polyglossia}
\\setmainlanguage{english}
\\setotherlanguage{bengali}
\\newfontfamily\\bengalifont{Noto Sans Bengali}[Script=Bengali]
\\newcommand{\\bn}[1]{{\\bengalifont #1}}`;

export async function POST(req: NextRequest) {
  let code: string;
  try {
    const body = await req.json();
    code = body?.code ?? body?.tikz;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "No TikZ code provided" }, { status: 400 });
  }

  const hasBengali = needsXelatex(code);
  let latexDoc: string;

  if (code.trimStart().startsWith("\\documentclass")) {
    // Full document — fix snakes lib, inject Bengali packages if needed
    latexDoc = code
      .replace(/\\usetikzlibrary\{([^}]*)\}/g, (match, libs: string) => {
        const fixed = libs
          .split(",")
          .map((l: string) => l.trim())
          .map((l: string) => l === "snakes" ? "decorations.pathmorphing" : l)
          .join(",");
        return `\\usetikzlibrary{${fixed}}`;
      })
      .replace(
        /snake=coil,\s*segment amplitude=([^,]+),\s*segment length=([^,\]]+)/g,
        (_: string, amp: string, len: string) =>
          `decoration={coil,aspect=0.3,amplitude=${amp.trim()},segment length=${len.trim()}},decorate`
      );

    // Inject Bengali packages into existing full document if needed
    if (hasBengali && !latexDoc.includes("\\usepackage{fontspec}")) {
      latexDoc = latexDoc.replace(
        /(\\documentclass[^\n]*\n)/,
        `$1${BENGALI_PACKAGES}\n`
      );
    }

  } else {
    // Bare tikzpicture — wrap with preamble
    let tikz = code
      .replace(/\\begin\{center\}/g, "")
      .replace(/\\end\{center\}/g,   "")
      .replace(/\\centering\b/g,     "")
      .trim();

    const isCircuit = tikz.includes("\\begin{circuitikz}") || tikz.includes("\\ctikzset");

    if (hasBengali) {
      // XeLaTeX standalone document with Bengali support
      latexDoc = `\\documentclass[12pt,border=4pt]{standalone}
\\usepackage{tikz}
${isCircuit
  ? "\\usepackage{circuitikz}"
  : "\\usetikzlibrary{arrows,arrows.meta,shapes,positioning,calc,patterns,decorations.pathmorphing,angles,quotes}"
}
\\usepackage[dvipsnames,svgnames,x11names]{xcolor}
${BENGALI_PACKAGES}
\\definecolor{circuitblue}{RGB}{30,100,200}
\\definecolor{circuitred}{RGB}{200,50,50}
\\definecolor{circuitgreen}{RGB}{30,150,80}
\\tikzset{>=latex}
\\begin{document}
${tikz}
\\end{document}`;
    } else {
      // Standard pdflatex document
      latexDoc = `\\documentclass[12pt,border=4pt]{standalone}
\\usepackage{tikz}
${isCircuit
  ? "\\usepackage{circuitikz}"
  : "\\usetikzlibrary{arrows,arrows.meta,shapes,positioning,calc,patterns,decorations.pathmorphing,angles,quotes}"
}
\\usepackage[dvipsnames,svgnames,x11names]{xcolor}
\\definecolor{circuitblue}{RGB}{30,100,200}
\\definecolor{circuitred}{RGB}{200,50,50}
\\definecolor{circuitgreen}{RGB}{30,150,80}
\\tikzset{>=latex}
\\begin{document}
${tikz}
\\end{document}`;
    }
  }

  const serviceUrl = (process.env.TIKZ_SERVICE_URL ?? "https://atomic-test.onrender.com")
    .replace(/\/$/, "");

  try {
    const compileRes = await fetch(`${serviceUrl}/compile`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ latex: latexDoc }),
      signal:  AbortSignal.timeout(60_000),
    });

    if (!compileRes.ok) {
      const err = await compileRes.json().catch(() => ({ error: `HTTP ${compileRes.status}` }));
      return NextResponse.json({ error: err.error }, { status: 422 });
    }

    const png = await compileRes.arrayBuffer();
    return new NextResponse(png, {
      status: 200,
      headers: {
        "Content-Type":  "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });

  } catch (err) {
    console.error("TikZ service unreachable:", err);
    return NextResponse.json(
      { error: "TikZ compiler service is unreachable." },
      { status: 503 }
    );
  }
}
