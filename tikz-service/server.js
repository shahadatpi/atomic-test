const express    = require("express");
const { spawnSync, execSync } = require("child_process");
const fs         = require("fs");
const path       = require("path");
const os         = require("os");

const app = express();
app.use(express.json({ limit: "1mb" }));

// ── Find ImageMagick ──────────────────────────────────────────────────────
function findMagick() {
  const candidates = ["convert", "magick"];
  for (const candidate of candidates) {
    try {
      const result = spawnSync(candidate, ["--version"], { encoding: "utf8", timeout: 3000 });
      if (result.status === 0) {
        console.log("✓ Found magick at:", candidate);
        return candidate;
      }
    } catch {}
  }
  console.log("✗ magick not found");
  return null;
}

const MAGICK = findMagick();

// ── Detect if LaTeX source contains Unicode/Bengali characters ────────────
function needsXelatex(latex) {
  // Bengali Unicode range: U+0980–U+09FF
  // Also trigger for any non-ASCII that isn't a LaTeX command
  return /[\u0980-\u09FF]/.test(latex) ||
         /\\usepackage\{(polyglossia|fontspec|xecyr)\}/.test(latex) ||
         /\\setmainlanguage\{bengali\}/.test(latex) ||
         /xelatex/.test(latex);
}

// ── Inject Bengali/XeLaTeX preamble into bare tikzpicture docs ────────────
function injectBengaliPreamble(latex) {
  // If it's already a full document, inject fontspec before \begin{document}
  if (latex.trimStart().startsWith("\\documentclass")) {
    // Add fontspec + polyglossia after \documentclass line if not present
    if (!latex.includes("\\usepackage{fontspec}")) {
      latex = latex.replace(
        /(\\documentclass[^\n]*\n)/,
        `$1\\usepackage{fontspec}\n\\usepackage{polyglossia}\n\\setmainlanguage{english}\n\\setotherlanguage{bengali}\n\\newfontfamily\\bengalifont{Noto Sans Bengali}[Script=Bengali]\n`
      );
    }
    return latex;
  }
  return latex; // bare tikzpicture — route.ts handles wrapping
}

app.post("/compile", (req, res) => {
  const { latex } = req.body;
  if (!latex) return res.status(400).json({ error: "No latex provided" });

  const dir     = fs.mkdtempSync(path.join(os.tmpdir(), "tikz-"));
  const texFile = path.join(dir, "doc.tex");
  const pdfFile = path.join(dir, "doc.pdf");
  const pngFile = path.join(dir, "doc.png");

  try {
    const useXelatex = needsXelatex(latex);
    const compiler   = useXelatex ? "xelatex" : "pdflatex";
    const source     = useXelatex ? injectBengaliPreamble(latex) : latex;

    fs.writeFileSync(texFile, source, "utf8");

    console.log(`Compiling with ${compiler}...`);

    // Step 1: Compile tex → pdf
    try {
      execSync(
        `${compiler} -interaction=nonstopmode -output-directory="${dir}" "${texFile}"`,
        { timeout: 45000, stdio: "pipe" }
      );
    } catch (e) {
      const logFile = path.join(dir, "doc.log");
      const log = fs.existsSync(logFile)
        ? fs.readFileSync(logFile, "utf8").slice(-3000)
        : String(e);
      if (!fs.existsSync(pdfFile)) {
        return res.status(422).json({ error: log });
      }
    }

    if (!fs.existsSync(pdfFile)) {
      return res.status(422).json({ error: "PDF was not created" });
    }

    console.log(`✓ PDF compiled with ${compiler}`);

    // Step 2: Convert PDF → PNG
    if (MAGICK) {
      const result = spawnSync(MAGICK, [
        "-density", "180",
        pdfFile,
        "-background", "white",
        "-flatten",
        "-quality", "95",
        pngFile,
      ], { timeout: 20000, encoding: "utf8" });

      if (result.status === 0 && fs.existsSync(pngFile)) {
        console.log("✓ PNG created");
        const png = fs.readFileSync(pngFile);
        res.set("Content-Type", "image/png");
        return res.send(png);
      } else {
        console.log("✗ magick failed:", result.stderr || result.error);
      }
    }

    // Step 3: Fallback — return PDF
    console.log("⚠ Returning PDF as fallback");
    const pdf = fs.readFileSync(pdfFile);
    return res.json({ pdf: pdf.toString("base64") });

  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`TikZ compiler running on :${PORT} (pdflatex + xelatex)`));
