const express    = require("express");
const { spawnSync, execSync } = require("child_process");
const fs         = require("fs");
const path       = require("path");
const os         = require("os");

const app = express();
app.use(express.json({ limit: "1mb" }));

// Find ImageMagick convert
function findMagick() {
  for (const cmd of ["convert", "magick"]) {
    try {
      const r = spawnSync(cmd, ["--version"], { encoding: "utf8", timeout: 3000 });
      if (r.status === 0) { console.log("✓ magick:", cmd); return cmd; }
    } catch {}
  }
  console.log("✗ magick not found"); return null;
}
const MAGICK = findMagick();

// Detect if latex source needs xelatex:
// 1. Caller passes engine:"xelatex"
// 2. Contains \usepackage{fontspec}
// 3. Contains Bengali Unicode
function needsXelatex(latex, engineHint) {
  if (engineHint === "xelatex") return true;
  if (/\\usepackage\{fontspec\}/.test(latex)) return true;
  if (/[\u0980-\u09FF]/.test(latex)) return true;
  return false;
}

app.post("/compile", (req, res) => {
  const { latex, engine } = req.body;
  if (!latex) return res.status(400).json({ error: "No latex provided" });

  const dir     = fs.mkdtempSync(path.join(os.tmpdir(), "tikz-"));
  const texFile = path.join(dir, "doc.tex");
  const pdfFile = path.join(dir, "doc.pdf");
  const pngFile = path.join(dir, "doc.png");

  try {
    const useXelatex = needsXelatex(latex, engine);
    const compiler   = useXelatex ? "xelatex" : "pdflatex";

    fs.writeFileSync(texFile, latex, "utf8");
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
        "-density", "180", pdfFile,
        "-background", "white", "-flatten",
        "-quality", "95", pngFile,
      ], { timeout: 20000, encoding: "utf8" });

      if (result.status === 0 && fs.existsSync(pngFile)) {
        console.log("✓ PNG created");
        const png = fs.readFileSync(pngFile);
        res.set("Content-Type", "image/png");
        return res.send(png);
      }
      console.log("✗ magick failed:", result.stderr || result.error);
    }

    // Step 3: Fallback PDF
    console.log("⚠ Returning PDF as fallback");
    const pdf = fs.readFileSync(pdfFile);
    return res.json({ pdf: pdf.toString("base64") });

  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`TikZ compiler running on :${PORT} (pdflatex + xelatex)`));
