const express         = require("express");
const { spawnSync, execSync } = require("child_process");
const fs              = require("fs");
const path            = require("path");
const os              = require("os");

const app = express();
app.use(express.json({ limit: "4mb" }));

const IS_WINDOWS = process.platform === "win32";
const IS_LINUX   = process.platform === "linux";

// ── Find tools ────────────────────────────────────────────────────────────────
function findMagick() {
  const candidates = ["magick", "convert"];
  if (IS_WINDOWS) {
    try {
      const dirs = fs.readdirSync("C:\\Program Files").filter(d => d.startsWith("ImageMagick"));
      for (const d of dirs) candidates.push(path.join("C:\\Program Files", d, "magick.exe"));
    } catch {}
  }
  for (const c of candidates) {
    try { if (spawnSync(c, ["--version"], { timeout: 3000 }).status === 0) return c; } catch {}
  }
  return null;
}

function findEngine(name) {
  try {
    if (spawnSync(name, ["--version"], { timeout: 5000 }).status === 0) {
      console.log(`✓ ${name}`); return name;
    }
  } catch {}
  console.log(`✗ ${name} not found`); return null;
}

const MAGICK   = findMagick();
const XELATEX  = findEngine("xelatex");
const PDFLATEX = findEngine("pdflatex");

// ── Extract real errors from LaTeX log ───────────────────────────────────────
function extractErrors(log) {
  const lines = log.split("\n"), out = [];
  lines.forEach((line, i) => {
    if (line.startsWith("!") || /^l\.\d+/.test(line) || line.includes("Error:")
        || line.includes("Undefined control sequence") || line.includes("Missing")
        || (line.includes("Font") && line.includes("not found"))) {
      out.push(...lines.slice(Math.max(0, i-2), Math.min(lines.length, i+6)), "---");
    }
  });
  return out.length ? out.slice(0, 100).join("\n")
    : log.slice(0, 2000) + "\n...\n" + log.slice(-2000);
}

// ── Compile LaTeX ─────────────────────────────────────────────────────────────
function compile(latex, engine, dir, passes = 1) {
  const texFile = path.join(dir, "doc.tex");
  const pdfFile = path.join(dir, "doc.pdf");
  const logFile = path.join(dir, "doc.log");
  fs.writeFileSync(texFile, latex, "utf8");
  for (let i = 0; i < passes; i++) {
    spawnSync(engine, ["-interaction=nonstopmode", "-halt-on-error",
      `-output-directory=${dir}`, texFile], { timeout: 120_000, cwd: dir });
  }
  if (!fs.existsSync(pdfFile)) {
    const rawLog = fs.existsSync(logFile) ? fs.readFileSync(logFile, "utf8") : "No log file";
    throw new Error(extractErrors(rawLog));
  }
  return pdfFile;
}

// ── /compile ──────────────────────────────────────────────────────────────────
app.post("/compile", (req, res) => {
  const { latex, engine: reqEngine, format: outFmt } = req.body;
  if (!latex) return res.status(400).send("No latex provided");

  const needsXe = /\\usepackage\s*(\[[^\]]*\])?\s*\{(latexbangla|fontspec)\}/.test(latex)
    || /[\u0980-\u09FF]/.test(latex);
  const engine = needsXe ? XELATEX
    : (reqEngine === "xelatex" ? XELATEX : (PDFLATEX || XELATEX));
  if (!engine) return res.status(500).send(needsXe
    ? "xelatex not found (required for Bengali)" : "No LaTeX engine found");

  const passes = /\\documentclass.*\{exam\}/.test(latex) ? 2 : 1;
  const dir    = fs.mkdtempSync(path.join(os.tmpdir(), "paper-"));
  let pdfFile;
  try {
    pdfFile = compile(latex, engine, dir, passes);
  } catch (e) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.error("Compile failed:", String(e.message).slice(0, 500));
    return res.status(422).json({ error: String(e.message) });
  }

  const pdfBuf  = fs.readFileSync(pdfFile);
  const cleanup = () => fs.rmSync(dir, { recursive: true, force: true });

  if (outFmt === "pdf") {
    res.set("Content-Type", "application/pdf");
    res.on("finish", cleanup); return res.send(pdfBuf);
  }
  if (MAGICK) {
    const pngFile = path.join(dir, "doc.png");
    const r = spawnSync(MAGICK,
      ["-density","150",pdfFile,"-background","white","-flatten",pngFile],
      { timeout: 30_000 });
    if (r.status === 0 && fs.existsSync(pngFile)) {
      const pngBuf = fs.readFileSync(pngFile);
      res.set("Content-Type", "image/png");
      res.on("finish", cleanup); return res.send(pngBuf);
    }
  }
  res.on("finish", cleanup);
  res.json({ pdf: pdfBuf.toString("base64") });
});

// ── /health ───────────────────────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({
  ok: true, platform: process.platform,
  xelatex: !!XELATEX, pdflatex: !!PDFLATEX, magick: !!MAGICK,
}));

// ── Start immediately ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 TikZ/Paper compiler on :${PORT}`);
  console.log(`   platform : ${process.platform}`);
  console.log(`   xelatex  : ${XELATEX  || "NOT FOUND"}`);
  console.log(`   pdflatex : ${PDFLATEX || "NOT FOUND"}`);
  console.log(`   magick   : ${MAGICK   || "NOT FOUND"}`);
});

// ── Font setup in background (non-blocking) ───────────────────────────────────
setupFonts().catch(e => console.error("Font setup error:", e));

// ── Self-ping every 10 min to prevent Render free tier sleep ─────────────────
if (IS_LINUX) {
  setInterval(async () => {
    try {
      await fetch(`http://localhost:${PORT}/health`);
    } catch {}
  }, 10 * 60 * 1000); // every 10 minutes
}

async function setupFonts() {
  if (IS_WINDOWS) {
    try {
      execSync("mpm --install=kalpurush 2>nul", { timeout: 60_000, stdio: "pipe" });
      execSync("mpm --install=bengali   2>nul", { timeout: 60_000, stdio: "pipe" });
      execSync("initexmf --update-fndb",         { timeout: 30_000, stdio: "pipe" });
      execSync("fc-cache -fv",                   { timeout: 30_000, stdio: "pipe" });
      console.log("✓ MiKTeX fonts ready");
    } catch {}
    return;
  }
  if (!IS_LINUX) return;
  console.log("🐧 Setting up Bengali fonts for Linux…");

  const fontDir = path.join(__dirname, "fonts");
  fs.mkdirSync(fontDir, { recursive: true });

  const FONTS = [
    { file: "Kalpurush.ttf", urls: [
        "https://github.com/nv-h/latexbangla/raw/master/Kalpurush.ttf",
        "https://raw.githubusercontent.com/lipi/kalpurush/master/Kalpurush.ttf",
    ]},
    { file: "NotoSerifBengali-Regular.ttf", urls: [
        "https://github.com/notofonts/noto-fonts/raw/main/hinted/ttf/NotoSerifBengali/NotoSerifBengali-Regular.ttf",
    ]},
  ];

  for (const font of FONTS) {
    const dest = path.join(fontDir, font.file);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 10_000) {
      console.log(`✓ cached: ${font.file}`); continue;
    }
    for (const url of font.urls) {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(30_000) });
        if (!r.ok) continue;
        fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
        console.log(`✓ downloaded: ${font.file}`); break;
      } catch (e) { console.log(`  ✗ ${font.file}: ${e.message}`); }
    }
  }

  // Register with fontconfig
  for (const dir of ["/usr/local/share/fonts/atomictest", `${os.homedir()}/.fonts`]) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      for (const f of fs.readdirSync(fontDir).filter(n => /\.(ttf|otf)$/i.test(n)))
        fs.copyFileSync(path.join(fontDir, f), path.join(dir, f));
      execSync(`fc-cache -f "${dir}"`, { timeout: 15_000, stdio: "pipe" });
      console.log(`✓ fonts registered: ${dir}`); break;
    } catch {}
  }

  try { execSync("mktexlsr", { timeout: 20_000, stdio: "pipe" }); } catch {}
  try {
    const list = execSync("fc-list :lang=bn 2>/dev/null | head -5", { timeout: 5_000 }).toString().trim();
    console.log("Bengali fonts:", list || "(none — FreeSerif fallback will be used)");
  } catch {}
}
