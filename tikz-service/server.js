const express             = require("express");
const { spawnSync, execFileSync } = require("child_process");
const fs                  = require("fs");
const path                = require("path");
const os                  = require("os");

const app = express();
app.use(express.json({ limit: "8mb" }));

// ── Detect available LaTeX engines at startup ─────────────────────────────────
function probe(cmd, args = ["--version"]) {
  try {
    const r = spawnSync(cmd, args, { timeout: 8000, encoding: "utf8" });
    return r.status === 0;
  } catch { return false; }
}

const HAS_XELATEX  = probe("xelatex");
const HAS_PDFLATEX = probe("pdflatex");
const HAS_MAGICK   = probe("magick") ? "magick" : probe("convert") ? "convert" : null;

console.log(`\n🚀  LaTeX compiler service`);
console.log(`   xelatex  : ${HAS_XELATEX  ? "✓" : "✗ NOT FOUND"}`);
console.log(`   pdflatex : ${HAS_PDFLATEX ? "✓" : "✗ NOT FOUND"}`);
console.log(`   magick   : ${HAS_MAGICK   ? `✓ (${HAS_MAGICK})` : "✗ NOT FOUND"}\n`);

// ── Choose engine ─────────────────────────────────────────────────────────────
function pickEngine(latex, requested) {
  // Bengali Unicode or fontspec/polyglossia/latexbangla → must use xelatex
  const needsXe = /[\u0980-\u09FF]/.test(latex)
    || /\\usepackage\s*(?:\[[^\]]*\])?\s*\{(?:fontspec|polyglossia|latexbangla)\}/.test(latex);

  if (needsXe) {
    if (!HAS_XELATEX) throw new Error("xelatex required for Bengali but not found in PATH");
    return "xelatex";
  }
  if (requested === "xelatex" && HAS_XELATEX) return "xelatex";
  if (HAS_PDFLATEX) return "pdflatex";
  if (HAS_XELATEX)  return "xelatex";
  throw new Error("No LaTeX engine found");
}

// ── Compile LaTeX → PDF ───────────────────────────────────────────────────────
function compilePDF(latex, engine, dir) {
  const texFile = path.join(dir, "doc.tex");
  const pdfFile = path.join(dir, "doc.pdf");
  const logFile = path.join(dir, "doc.log");

  fs.writeFileSync(texFile, latex, "utf8");

  // exam class needs 2 passes for correct \totalpoints etc.
  const passes = /\\documentclass.*\{exam\}/.test(latex) ? 2 : 1;

  for (let i = 0; i < passes; i++) {
    try {
      execFileSync(engine, [
        "-interaction=nonstopmode",
        "-halt-on-error",
        `-output-directory=${dir}`,
        texFile,
      ], { timeout: 120_000, stdio: "pipe" });
    } catch (e) {
      // On last pass, check if PDF was still produced (warnings-only compile)
      if (i === passes - 1 && !fs.existsSync(pdfFile)) {
        const log = fs.existsSync(logFile)
          ? fs.readFileSync(logFile, "utf8")
          : String(e);
        // Extract the actual error lines from the log
        const errorLines = log.split("\n")
          .filter(l => l.startsWith("!") || l.startsWith("l.") || l.includes("Error"))
          .slice(0, 20).join("\n");
        throw new Error(errorLines || log.slice(-3000));
      }
    }
  }

  if (!fs.existsSync(pdfFile)) {
    const log = fs.existsSync(logFile) ? fs.readFileSync(logFile, "utf8") : "No log";
    throw new Error(log.slice(-3000));
  }

  return pdfFile;
}

// ── /compile ──────────────────────────────────────────────────────────────────
app.post("/compile", (req, res) => {
  const { latex, engine: reqEngine, format: outFormat } = req.body;
  if (!latex) return res.status(400).send("No latex provided");

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "latex-"));

  try {
    let engine;
    try {
      engine = pickEngine(latex, reqEngine);
    } catch (e) {
      return res.status(500).send(String(e));
    }

    let pdfFile;
    try {
      pdfFile = compilePDF(latex, engine, dir);
    } catch (e) {
      console.error(`[compile] ${engine} failed:\n`, String(e).slice(0, 500));
      return res.status(422).send(`LaTeX error (${engine}):\n\n${String(e)}`);
    }

    const pdfBuffer = fs.readFileSync(pdfFile);
    console.log(`[compile] ✓ ${engine} → ${(pdfBuffer.length/1024).toFixed(0)} KB PDF`);

    // Return raw PDF if requested (generate-paper uses this)
    if (outFormat === "pdf") {
      res.set("Content-Type", "application/pdf");
      return res.send(pdfBuffer);
    }

    // Otherwise convert to PNG for TikZ diagram rendering
    if (HAS_MAGICK) {
      const pngFile = path.join(dir, "doc.png");
      const r = spawnSync(HAS_MAGICK, [
        "-density", "150",
        pdfFile,
        "-background", "white",
        "-flatten",
        pngFile,
      ], { timeout: 30_000 });

      if (r.status === 0 && fs.existsSync(pngFile)) {
        res.set("Content-Type", "image/png");
        return res.send(fs.readFileSync(pngFile));
      }
      console.warn("[compile] magick failed:", r.stderr?.toString()?.slice(0, 200));
    }

    // Fallback: PNG not available — return PDF as base64 JSON
    // (TikZRenderer can handle this format too)
    res.json({ pdf: pdfBuffer.toString("base64") });

  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
  }
});

// ── /health ───────────────────────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({
  status:   "ok",
  xelatex:  HAS_XELATEX,
  pdflatex: HAS_PDFLATEX,
  magick:   HAS_MAGICK,
}));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Listening on :${PORT}`));
