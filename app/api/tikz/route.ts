import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createHash } from "crypto"

// ── Supabase Storage cache ────────────────────────────────────────────────────
// One-time setup: Supabase dashboard → Storage → New bucket → "tikz-cache" → Public
const BUCKET = "tikz-cache"

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/** SHA-256 of the compiled LaTeX doc → stable, collision-free filename */
function cacheKey(doc: string): string {
  return createHash("sha256").update(doc).digest("hex").slice(0, 32) + ".png"
}

/** Check if PNG already exists in Supabase Storage — returns public URL or null */
async function getCached(filename: string): Promise<string | null> {
  const { data } = supabase().storage.from(BUCKET).getPublicUrl(filename)
  try {
    const res = await fetch(data.publicUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(3000),
    })
    return res.ok ? data.publicUrl : null
  } catch {
    return null
  }
}

/** Upload compiled PNG to Supabase Storage — returns public URL or null */
async function storeCache(filename: string, png: ArrayBuffer): Promise<string | null> {
  const { error } = await supabase().storage
    .from(BUCKET)
    .upload(filename, png, {
      contentType:  "image/png",
      cacheControl: "31536000", // 1 year browser cache
      upsert:       false,      // same hash = same image, never overwrite
    })
  if (error) {
    console.error("TikZ cache store failed:", error.message)
    return null
  }
  const { data } = supabase().storage.from(BUCKET).getPublicUrl(filename)
  return data.publicUrl
}

// ── Detection helpers ─────────────────────────────────────────────────────────

/** Any non-ASCII character → needs xelatex for Unicode/Bangla rendering */
function hasUnicode(s: string): boolean {
  return /[^\x00-\x7F]/.test(s)
}

function isCircuit(code: string): boolean {
  return code.includes("\\begin{circuitikz}") || code.includes("\\ctikzset")
}

// ── Shared TikZ library list ──────────────────────────────────────────────────
const TIKZ_LIBS = [
  "shapes.geometric", "shapes.arrows", "shapes.misc", "shapes",
  "arrows", "arrows.meta",
  "positioning", "calc", "fit", "matrix",
  "decorations.markings", "decorations.pathmorphing",
  "decorations.pathreplacing", "decorations.shapes",
  "patterns", "patterns.meta",
  "angles", "quotes",
  "through", "backgrounds", "intersections",
].join(",")

// ── Shared global TikZ styles ─────────────────────────────────────────────────
const TIKZ_STYLES = String.raw`
\tikzstyle{arrowstyle}=[scale=1]
\tikzstyle{directed}=[postaction={decorate,decoration={markings,
    mark=at position .65 with {\arrow[arrowstyle]{stealth}}}}]
\tikzstyle{reverse directed}=[postaction={decorate,decoration={markings,
    mark=at position .65 with {\arrowreversed[arrowstyle]{stealth}}}}]
\tikzstyle{dot}=[circle,fill,inner sep=1.5pt]
% \arrowIn — mid-path forward arrow (used on sloped segments)
\tikzset{
  arrowIn/.style={
    postaction={decorate,decoration={markings,
      mark=at position 0.5 with {\arrow{stealth}}}}
  }
}
\newcommand{\arrowIn}{\begin{tikzpicture}[baseline=-0.5ex]\draw[-stealth,thick](0,0)--(0.35,0);\end{tikzpicture}}
`

// ── Preambles ─────────────────────────────────────────────────────────────────

function pdflatexPreamble(tikz: string): string {
  const libs = isCircuit(tikz) ? "\\usepackage{circuitikz}" : `\\usetikzlibrary{${TIKZ_LIBS}}`
  return `\\documentclass[12pt,border=4pt]{standalone}
\\usepackage{tikz}
${libs}
\\usepackage[dvipsnames,svgnames,x11names]{xcolor}
\\usepackage{amsmath,amssymb}
\\definecolor{circuitblue}{RGB}{30,100,200}
\\definecolor{circuitred}{RGB}{200,50,50}
\\definecolor{circuitgreen}{RGB}{30,150,80}
${TIKZ_STYLES}
\\begin{document}
${tikz}
\\end{document}`
}

function xelatexPreamble(tikz: string): string {
  const libs = isCircuit(tikz) ? "\\usepackage{circuitikz}" : `\\usetikzlibrary{${TIKZ_LIBS}}`
  return `\\documentclass[12pt,border=4pt]{standalone}
\\usepackage{fontspec}
\\newfontfamily\\bengalifont{Kalpurush}[Script=Bengali,BoldFont=Kalpurush,ItalicFont=Kalpurush]
\\newcommand{\\bn}[1]{{\\bengalifont #1}}
\\usepackage{tikz}
${libs}
\\usepackage[dvipsnames,svgnames,x11names]{xcolor}
\\usepackage{amsmath,amssymb}
${TIKZ_STYLES}
\\begin{document}
${tikz}
\\end{document}`
}

// Fix angle=A--O--O (TikZ requires 3 distinct points)
// Finds the vertex coordinate value and creates a nearby point on the Y-axis
function fixDuplicateAngles(tikz: string): string {
  // Find all angle=X--Y--Y patterns
  return tikz.replace(
    /\{angle=([A-Za-z][A-Za-z0-9]*)--([A-Za-z][A-Za-z0-9]*)--\}/g,
    (_match: string, from: string, vertex: string) => {
      // Look for \coordinate(vertex) at (x,y) to find its position
      const coordRe = new RegExp(`\\\\coordinate\\s*\\(${vertex}\\)\\s*at\\s*\\(([^)]+)\\)`)
      const coordMatch = tikz.match(coordRe)
      if (coordMatch) {
        const parts = coordMatch[1].split(',')
        const x = parseFloat(parts[0]) || 0
        const y = parseFloat(parts[1]) || 0
        // Create a helper point 1 unit above the vertex
        const helperName = `_${vertex}h`
        const helperCoord = `\\coordinate(${helperName}) at (${x},${y+1});`
        // We'll inject this before the first \begin{tikzpicture} or \begin{scope}
        tikz = tikz.replace(
          /(\\begin\{(?:tikzpicture|scope)[^}]*\})/,
          `$1
  ${helperCoord}`
        )
        return `{angle=${from}--${vertex}--${helperName}}`
      }
      // Fallback: use (0,1) offset — works for axis at origin
      const helperName = `_${vertex}h`
      tikz = tikz.replace(
        /(\\begin\{(?:tikzpicture|scope)[^}]*\})/,
        `$1
  \\coordinate(${helperName}) at (0,1);`
      )
      return `{angle=${from}--${vertex}--${helperName}}`
    }
  )
}

function fixLegacySyntax(doc: string): string {
  return doc
    .replace(/\\usetikzlibrary\{([^}]*)\}/g, (_, libs: string) => {
      const fixed = libs.split(",")
        .map((l: string) => l.trim())
        .map((l: string) => l === "snakes" ? "decorations.pathmorphing" : l)
        .filter(Boolean).join(",")
      return `\\usetikzlibrary{${fixed}}`
    })
    .replace(
      /snake=coil,\s*segment amplitude=([^,]+),\s*segment length=([^,\]]+)/g,
      (_: string, amp: string, len: string) =>
        `decoration={coil,aspect=0.3,amplitude=${amp.trim()},segment length=${len.trim()}},decorate`
    )

}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let code: string
  try {
    const body = await req.json()
    code = body?.code ?? body?.tikz
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!code) {
    return NextResponse.json({ error: "No TikZ code provided" }, { status: 400 })
  }

  // ── Build final LaTeX document ──────────────────────────────────────────────
  let latexDoc: string

  if (code.trimStart().startsWith("\\documentclass")) {
    latexDoc = fixLegacySyntax(code)
  } else {
    let tikz = code
      .replace(/\\begin\{center\}/g, "")
      .replace(/\\end\{center\}/g,   "")
      .replace(/\\centering\b/g,     "")
      .trim()

    // Auto-wrap Bengali/Unicode runs inside \node{...} with \bengalifont
    if (hasUnicode(tikz)) {
      tikz = tikz.replace(
        /\\node(\s*(?:\[[^\]]*\])?\s*(?:at\s*\([^)]*\))?\s*(?:\[[^\]]*\])?\s*)\{([^}]*)\}/g,
        (match, opts, content) => {
          // If content has non-ASCII, wrap it
          if (/[^\x00-\x7F]/.test(content)) {
            const wrapped = content.replace(
              /([^\x00-\x7F]+)/g,
              (_: string, bn: string) => `{\\bengalifont ${bn}}`
            )
            return `\\node${opts}{${wrapped}}`
          }
          return match
        }
      )
    }

    tikz = fixDuplicateAngles(tikz)
    latexDoc = fixLegacySyntax(
      hasUnicode(tikz) ? xelatexPreamble(tikz) : pdflatexPreamble(tikz)
    )
  }

  // ── Cache check ─────────────────────────────────────────────────────────────
  const filename   = cacheKey(latexDoc)
  const cachedUrl  = await getCached(filename)

  if (cachedUrl) {
    // Redirect browser directly to Supabase CDN — zero processing cost
    return NextResponse.redirect(cachedUrl, { status: 302 })
  }

  // ── Cache miss — compile ────────────────────────────────────────────────────
  const serviceUrl = (process.env.TIKZ_SERVICE_URL ?? "https://atomic-test.onrender.com")
    .replace(/\/$/, "")

  // Retry up to 3 times — handles Render cold-start ECONNRESET
  const MAX_RETRIES = 3;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const compileRes = await fetch(`${serviceUrl}/compile`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          "Connection":   "keep-alive",
        },
        body:    JSON.stringify({ latex: latexDoc }),
        signal:  AbortSignal.timeout(90_000),
      });

      if (!compileRes.ok) {
        const errBody = await compileRes.text().catch(() => `HTTP ${compileRes.status}`);
        let errMsg = errBody;
        try { const j = JSON.parse(errBody); if (j.error) errMsg = j.error; } catch {}
        return NextResponse.json({ error: errMsg }, { status: 422 });
      }

      const png = await compileRes.arrayBuffer();

      // Store in Supabase Storage (fire and forget)
      storeCache(filename, png).catch(e => console.error("Cache store error:", e));

      return new NextResponse(png, {
        status: 200,
        headers: {
          "Content-Type":  "image/png",
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Cache":       "MISS",
        },
      });

    } catch (err: unknown) {
      lastErr = err;
      const isReset = err instanceof Error &&
        (err.message.includes("aborted") || (err as any).code === "ECONNRESET");
      if (isReset && attempt < MAX_RETRIES) {
        console.warn(`TikZ ECONNRESET attempt ${attempt}/${MAX_RETRIES} — retrying…`);
        await new Promise(r => setTimeout(r, 1000 * attempt)); // back-off
        continue;
      }
      break;
    }
  }

  console.error("TikZ service unreachable after retries:", lastErr);
  return NextResponse.json(
    { error: "TikZ compiler service is unreachable. Try again in a moment." },
    { status: 503 }
  );
}
