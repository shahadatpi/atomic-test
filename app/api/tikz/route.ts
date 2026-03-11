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
`

// ── Preambles ─────────────────────────────────────────────────────────────────

function pdflatexPreamble(tikz: string): string {
  return String.raw`\documentclass[12pt,border=4pt]{standalone}
\usepackage{tikz}
${isCircuit(tikz) ? "\\usepackage{circuitikz}" : `\\usetikzlibrary{${TIKZ_LIBS}}`}
\usepackage[dvipsnames,svgnames,x11names]{xcolor}
\usepackage{amsmath,amssymb}
\definecolor{circuitblue}{RGB}{30,100,200}
\definecolor{circuitred}{RGB}{200,50,50}
\definecolor{circuitgreen}{RGB}{30,150,80}
${TIKZ_STYLES}
\begin{document}
${tikz}
\end{document}`
}

function xelatexPreamble(tikz: string): string {
  return String.raw`\documentclass[12pt,border=4pt]{standalone}
\usepackage{fontspec}
\usepackage{polyglossia}
\setmainlanguage{bengali}
\setmainfont{Kalpurush}[Script=Bengali,BoldFont=Kalpurush,ItalicFont=Kalpurush]
\usepackage{tikz}
${isCircuit(tikz) ? "\\usepackage{circuitikz}" : `\\usetikzlibrary{${TIKZ_LIBS}}`}
\usepackage[dvipsnames,svgnames,x11names]{xcolor}
\usepackage{amsmath,amssymb}
${TIKZ_STYLES}
\begin{document}
${tikz}
\end{document}`
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
    const tikz = code
      .replace(/\\begin\{center\}/g, "")
      .replace(/\\end\{center\}/g,   "")
      .replace(/\\centering\b/g,     "")
      .trim()
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

  try {
    const compileRes = await fetch(`${serviceUrl}/compile`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ latex: latexDoc }),
      signal:  AbortSignal.timeout(60_000),
    })

    if (!compileRes.ok) {
      const err = await compileRes.json().catch(() => ({ error: `HTTP ${compileRes.status}` }))
      return NextResponse.json({ error: err.error }, { status: 422 })
    }

    const png = await compileRes.arrayBuffer()

    // Store in Supabase Storage (fire and forget — don't block the response)
    storeCache(filename, png).catch(e => console.error("Cache store error:", e))

    return new NextResponse(png, {
      status: 200,
      headers: {
        "Content-Type":  "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Cache":       "MISS",
      },
    })

  } catch (err) {
    console.error("TikZ service unreachable:", err)
    return NextResponse.json(
      { error: "TikZ compiler service is unreachable." },
      { status: 503 }
    )
  }
}
