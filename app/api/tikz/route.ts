import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

// ── In-process cache: hash(code) → { buf, mime, ts } ─────────────────────────
// Persists across requests within the same server process.
// TTL: 10 minutes per entry.
const TTL_MS = 10 * 60 * 1000;

interface CacheEntry {
  buf:  ArrayBuffer;
  mime: string;
  ts:   number;        // Date.now() when cached
}

const cache = new Map<string, CacheEntry>();

function cacheKey(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function getCache(key: string): CacheEntry | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL_MS) { cache.delete(key); return null; }
  return entry;
}

function setCache(key: string, buf: ArrayBuffer, mime: string) {
  // Evict entries older than TTL to avoid unbounded growth
  for (const [k, v] of cache) {
    if (Date.now() - v.ts > TTL_MS) cache.delete(k);
  }
  cache.set(key, { buf, mime, ts: Date.now() });
}

// ── Route handler ─────────────────────────────────────────────────────────────
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

  // ── Cache hit ────────────────────────────────────────────────────────────────
  const key   = cacheKey(code);
  const hit   = getCache(key);
  if (hit) {
    console.log("[tikz/route] cache hit:", key.slice(0, 8));
    return new NextResponse(hit.buf, {
      headers: {
        "Content-Type":  hit.mime,
        "Cache-Control": "public, max-age=600",
        "X-Cache":       "HIT",
      },
    });
  }

  // ── Build LaTeX document ─────────────────────────────────────────────────────
  let latexDoc: string;

  if (code.trimStart().startsWith("\\documentclass")) {
    latexDoc = code
      .replace(/\\usetikzlibrary\{([^}]*)\}/g, (match, libs: string) => {
        const fixed = libs.split(",").map((l: string) => l.trim())
          .map((l: string) => l === "snakes" ? "decorations.pathmorphing" : l).join(",");
        return `\\usetikzlibrary{${fixed}}`;
      })
      .replace(/snake=coil,\s*segment amplitude=([^,]+),\s*segment length=([^,\]]+)/g,
        (_: string, amp: string, len: string) =>
          `decoration={coil,aspect=0.3,amplitude=${amp.trim()},segment length=${len.trim()}},decorate`
      );
  } else {
    let tikz = code;

    tikz = tikz
      .replace(/\\begin\{center\}/g, "")
      .replace(/\\end\{center\}/g,   "")
      .replace(/\\centering\b/g,     "")
      .trim();

    const isCircuit  = tikz.includes("\\begin{circuitikz}") || tikz.includes("\\ctikzset");
    const hasBengali = /[\u0980-\u09FF]/.test(tikz);

    const fontPreamble = hasBengali
      ? `\\usepackage{fontspec}
\\usepackage{polyglossia}
\\setmainlanguage{bengali}
\\setotherlanguage{english}
\\IfFontExistsTF{Kalpurush}{%
  \\setmainfont[Script=Bengali]{Kalpurush}%
}{%
  \\setmainfont[Script=Bengali]{Noto Sans Bengali}%
}`
      : "";

    latexDoc = `\\documentclass[12pt,border=4pt]{standalone}
${fontPreamble}
\\usepackage{tikz}
${isCircuit
  ? "\\usepackage[americanvoltages,fulldiodes,siunitx,RPvoltages]{circuitikz}"
  : "\\usetikzlibrary{arrows,arrows.meta,shapes,positioning,calc,patterns,decorations.pathmorphing,decorations.markings,angles,quotes}"
}
\\usepackage[dvipsnames,svgnames,x11names]{xcolor}
\\tikzset{>=latex}
\\tikzset{
  directed/.style={postaction={decorate,decoration={markings,
    mark=at position .65 with {\\arrow{stealth}}}}},
  mid arrow/.style={postaction={decorate,decoration={markings,
    mark=at position .5 with {\\arrow{stealth}}}}},
}
\\newcommand{\\arrowIn}{\\tikz \\draw[-stealth,line width=0.4pt] (-2pt,0) -- (2pt,0);}
\\begin{document}
${tikz}
\\end{document}`;
  }

  // ── Compile ──────────────────────────────────────────────────────────────────
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
      const errText = await compileRes.text().catch(() => `HTTP ${compileRes.status}`);
      console.error("[tikz/route] compile failed:", compileRes.status, errText.slice(0, 500));
      return NextResponse.json({ error: errText }, { status: 422 });
    }

    const contentType = compileRes.headers.get("Content-Type") ?? "";
    console.log("[tikz/route] compile ok, content-type:", contentType);

    // PNG
    if (contentType.includes("image/png")) {
      const buf = await compileRes.arrayBuffer();
      setCache(key, buf, "image/png");
      return new NextResponse(buf, {
        headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=600", "X-Cache": "MISS" },
      });
    }

    // PDF
    if (contentType.includes("application/pdf")) {
      const buf = await compileRes.arrayBuffer();
      setCache(key, buf, "application/pdf");
      return new NextResponse(buf, {
        headers: { "Content-Type": "application/pdf", "Cache-Control": "public, max-age=600", "X-Cache": "MISS" },
      });
    }

    // JSON fallback { pdf / png base64 }
    const json = await compileRes.json().catch(() => null);
    console.log("[tikz/route] json keys:", json ? Object.keys(json) : "null");

    if (json?.pdf) {
      const buf = Buffer.from(json.pdf, "base64").buffer;
      setCache(key, buf, "application/pdf");
      return new NextResponse(buf, {
        headers: { "Content-Type": "application/pdf", "Cache-Control": "public, max-age=600", "X-Cache": "MISS" },
      });
    }

    if (json?.png) {
      const buf = Buffer.from(json.png, "base64").buffer;
      setCache(key, buf, "image/png");
      return new NextResponse(buf, {
        headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=600", "X-Cache": "MISS" },
      });
    }

    console.error("[tikz/route] unexpected response body:", JSON.stringify(json).slice(0, 200));
    return NextResponse.json({ error: "Unexpected response from compile service" }, { status: 502 });

  } catch (err) {
    console.error("[tikz/route] service unreachable:", err);
    return NextResponse.json({ error: "TikZ compiler service is unreachable." }, { status: 503 });
  }
}
