import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let code: string;
  try {
    const body = await req.json();
    // Accept both "code" and "tikz" for backwards compatibility
    code = body?.code ?? body?.tikz;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "No TikZ code provided" }, { status: 400 });
  }

  let tikz = code;

  // Strip full document wrapper if present
  if (tikz.includes("\\begin{document}")) {
    const start = tikz.indexOf("\\begin{document}") + "\\begin{document}".length;
    const end   = tikz.lastIndexOf("\\end{document}");
    tikz = end > start ? tikz.slice(start, end).trim() : tikz.slice(start).trim();
  }

  // Strip centering commands — standalone handles alignment
  tikz = tikz
    .replace(/\\begin\{center\}/g, "")
    .replace(/\\end\{center\}/g,   "")
    .replace(/\\centering\b/g,     "")
    .trim();

  const isCircuit = tikz.includes("\\begin{circuitikz}") || tikz.includes("\\ctikzset");

  const latexDoc = `\\documentclass[12pt,border=4pt]{standalone}
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

  const serviceUrl = (process.env.TIKZ_SERVICE_URL ?? "https://atomic-test.onrender.com")
    .replace(/\/$/, ""); // strip trailing slash

  try {
    const compileRes = await fetch(`${serviceUrl}/compile`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ latex: latexDoc }),
      signal:  AbortSignal.timeout(60_000), // 60s for Render.com cold start
    });

    if (!compileRes.ok) {
      const err = await compileRes.json().catch(() => ({ error: `HTTP ${compileRes.status}` }));
      return NextResponse.json({ error: err.error }, { status: 422 });
    }

    // ✅ Return raw PNG bytes — TikZRenderer creates an object URL from the blob
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
