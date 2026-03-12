const express    = require("express");
const { spawnSync, execSync } = require("child_process");
const fs         = require("fs");
const path       = require("path");
const os         = require("os");

const app = express();
app.use(express.json({ limit: "4mb" }));

// ── Find ImageMagick ──────────────────────────────────────────────────────────
function findMagick() {
  const candidates = ["magick", "convert"];
  try {
    const pf   = "C:\\Program Files";
    const dirs = fs.readdirSync(pf).filter(d => d.startsWith("ImageMagick"));
    for (const d of dirs) candidates.push(path.join(pf, d, "magick.exe"));
  } catch {}
  for (const c of candidates) {
    try {
      if (spawnSync(c, ["--version"], { timeout: 3000 }).status === 0) {
        console.log("✓ magick:", c);
        return c;
      }
    } catch {}
  }
  console.log("✗ magick not found");
  return null;
}

// ── Find LaTeX engines ────────────────────────────────────────────────────────
function findEngine(name) {
  try {
    if (spawnSync(name, ["--version"], { timeout: 5000 }).status === 0) {
      console.log(`✓ ${name} found`);
      return name;
    }
  } catch {}
  console.log(`✗ ${name} not found`);
  return null;
}

const MAGICK  = findMagick();
const XELATEX = findEngine("xelatex");
const PDFLATEX= findEngine("pdflatex");

// ── Ensure Bengali fonts are installed (MiKTeX) ───────────────────────────────
function ensureBengaliFonts() {
  const fonts = ["kalpurush", "bengali"];
  for (const pkg of fonts) {
    try {
      const r = spawnSync("miktex", ["packages", "install", pkg], { timeout: 60_000, stdio: "pipe" });
      if (r.status === 0) console.log(`✓ MiKTeX package installed: ${pkg}`);
    } catch {}
  }
  // Refresh font cache
  try { execSync("fc-cache -fv", { timeout: 30_000, stdio: "pipe" }); } catch {}
  try { execSync("initexmf --update-fndb", { timeout: 30_000, stdio: "pipe" }); } catch {}
}
try { ensureBengaliFonts(); } catch (e) { console.warn("Font setup skipped:", e.message); }

// ── Compile LaTeX ──────────────────────────────────────────────────────────────
function compile(latex, engine, dir, passes = 1) {
  const texFile = path.join(dir, "doc.tex");
  const pdfFile = path.join(dir, "doc.pdf");
  const logFile = path.join(dir, "doc.log");

  fs.writeFileSync(texFile, latex, "utf8");

  for (let i = 0; i < passes; i++) {
    try {
      const cmd = `"${engine}" -interaction=nonstopmode -halt-on-error -output-directory="${dir}" "${texFile}"`;
      execSync(cmd, { timeout: 120_000, stdio: "pipe" });
    } catch {}
  }

  if (!fs.existsSync(pdfFile)) {
    const log = fs.existsSync(logFile)
      ? fs.readFileSync(logFile, "utf8").slice(-4000)
      : "No log file";
    throw new Error(log);
  }
  return pdfFile;
}

// ── /compile endpoint ──────────────────────────────────────────────────────────
app.post("/compile", (req, res) => {
  const { latex, engine: requestedEngine, format: outputFormat } = req.body;
  if (!latex) return res.status(400).send("No latex provided");

  // Decide engine:
  // - if latexbangla / fontspec / Bengali present → must use xelatex
  // - otherwise use requested engine or pdflatex fallback
  const needsXelatex = /\\usepackage\s*(\[[^\]]*\])?\s*\{(latexbangla|fontspec)\}/.test(latex)
    || /[\u0980-\u09FF]/.test(latex);

  let enginePath;
  if (needsXelatex) {
    enginePath = XELATEX;
    if (!enginePath) return res.status(500).send("xelatex not found but required for Bengali/fontspec");
  } else {
    enginePath = requestedEngine === "xelatex" ? XELATEX : (PDFLATEX || XELATEX);
    if (!enginePath) return res.status(500).send("No LaTeX engine found");
  }

  // exam class needs 2 passes for correct point totals
  const passes = /\\documentclass.*\{exam\}/.test(latex) ? 2 : 1;

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "paper-"));
  try {
    let pdfFile;
    try {
      pdfFile = compile(latex, enginePath, dir, passes);
    } catch (e) {
      console.error("Compile failed:\n", String(e).slice(-1500));
      return res.status(422).send(`LaTeX error:\n${String(e).slice(-4000)}`);
    }

    const pdfBuffer = fs.readFileSync(pdfFile);

    // Return PDF directly if requested
    if (outputFormat === "pdf") {
      res.set("Content-Type", "application/pdf");
      return res.send(pdfBuffer);
    }

    // Otherwise try to convert to PNG
    if (MAGICK) {
      const pngFile = path.join(dir, "doc.png");
      const r = spawnSync(MAGICK, [
        "-density", "150", pdfFile,
        "-background", "white", "-flatten", pngFile,
      ], { timeout: 30_000 });

      if (r.status === 0 && fs.existsSync(pngFile)) {
        res.set("Content-Type", "image/png");
        return res.send(fs.readFileSync(pngFile));
      }
      console.warn("magick failed:", r.stderr?.toString());
    }

    // Fallback: return PDF as base64 JSON (for TikZ diagrams)
    res.json({ pdf: pdfBuffer.toString("base64") });

  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ── /health ────────────────────────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({
  xelatex:  !!XELATEX,
  pdflatex: !!PDFLATEX,
  magick:   !!MAGICK,
}));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 TikZ/Paper compiler on :${PORT}`);
  console.log(`   xelatex  : ${XELATEX  || "NOT FOUND"}`);
  console.log(`   pdflatex : ${PDFLATEX || "NOT FOUND"}`);
  console.log(`   magick   : ${MAGICK   || "NOT FOUND"}`);
});
