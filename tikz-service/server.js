const express = require("express");
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

const app = express();
app.use(express.json({ limit: "1mb" }));

// Find magick executable at startup
function findMagick() {
  // Try common Windows installation paths
  const candidates = [
    "magick",
    "C:\\Program Files\\ImageMagick-7.1.2-Q16-HDRI\\magick.exe",
    "C:\\Program Files\\ImageMagick-7.1.2-Q16\\magick.exe",
    "C:\\Program Files\\ImageMagick-7.1.1-Q16-HDRI\\magick.exe",
    "C:\\Program Files\\ImageMagick-7.1.1-Q16\\magick.exe",
    "C:\\Program Files\\ImageMagick-7.1.0-Q16-HDRI\\magick.exe",
  ];

  // Also search Program Files dynamically
  try {
    const pf = "C:\\Program Files";
    const dirs = fs.readdirSync(pf).filter(d => d.startsWith("ImageMagick"));
    for (const d of dirs) {
      candidates.push(path.join(pf, d, "magick.exe"));
    }
  } catch {}

  for (const candidate of candidates) {
    try {
      const result = spawnSync(candidate, ["--version"], { encoding: "utf8", timeout: 3000 });
      if (result.status === 0) {
        console.log("✓ Found magick at:", candidate);
        return candidate;
      }
    } catch {}
  }
  console.log("✗ magick not found in any known location");
  return null;
}

const MAGICK = findMagick();

app.post("/compile", (req, res) => {
  const { latex } = req.body;
  if (!latex) return res.status(400).json({ error: "No latex provided" });

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tikz-"));
  const texFile = path.join(dir, "doc.tex");
  const pdfFile = path.join(dir, "doc.pdf");
  const pngFile = path.join(dir, "doc.png");

  try {
    fs.writeFileSync(texFile, latex);

    // Step 1: Compile tex → pdf
    try {
      execSync(`pdflatex -interaction=nonstopmode -output-directory="${dir}" "${texFile}"`, {
        timeout: 30000,
        stdio: "pipe",
      });
    } catch (e) {
      const logFile = path.join(dir, "doc.log");
      const log = fs.existsSync(logFile)
        ? fs.readFileSync(logFile, "utf8").slice(-2000)
        : String(e);
      if (!fs.existsSync(pdfFile)) {
        return res.status(422).json({ error: log });
      }
    }

    if (!fs.existsSync(pdfFile)) {
      return res.status(422).json({ error: "PDF was not created" });
    }

    console.log("✓ PDF compiled successfully");

    // Step 2: Convert PDF → PNG using full magick path
    if (MAGICK) {
      const result = spawnSync(MAGICK, [
        "-density", "150",
        pdfFile,
        "-background", "white",
        "-flatten",
        pngFile,
      ], { timeout: 15000, encoding: "utf8" });

      if (result.status === 0 && fs.existsSync(pngFile)) {
        console.log("✓ PNG created successfully");
        const png = fs.readFileSync(pngFile);
        res.set("Content-Type", "image/png");
        return res.send(png);
      } else {
        console.log("✗ magick failed:", result.stderr || result.error);
      }
    }

    // Step 3: Fall back to PDF
    console.log("⚠ Returning PDF as fallback");
    const pdf = fs.readFileSync(pdfFile);
    return res.json({ pdf: pdf.toString("base64") });

  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`TikZ compiler running on :${PORT}`));

