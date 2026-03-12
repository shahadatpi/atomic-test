const express    = require("express");
const { spawnSync, execSync, spawn } = require("child_process");
const fs         = require("fs");
const path       = require("path");
const os         = require("os");

const app = express();
app.use(express.json({ limit: "4mb" }));

const IS_WINDOWS = process.platform === "win32";
const IS_LINUX   = process.platform === "linux";

// ── Extract meaningful errors from LaTeX log ──────────────────────────────────
function extractErrors(log) {
  const lines = log.split("\n");
  const out = [];
  lines.forEach((line, i) => {
    if (
      line.startsWith("!") ||
      line.match(/^l\.\d+/) ||
      line.includes("Error:") ||
      line.includes("Undefined control sequence") ||
      line.includes("Missing") ||
      line.includes("Runaway") ||
      line.includes("Font") && line.includes("not found")
    ) {
      const start = Math.max(0, i - 2);
      const end   = Math.min(lines.length - 1, i + 6);
      out.push(...lines.slice(start, end + 1), "---");
    }
  });
  // If nothing matched, return first 3000 chars (package loading) + last 2000 (actual error)
  if (out.length === 0) {
    return log.slice(0, 2000) + "\n...\n" + log.slice(-3000);
  }
  return out.slice(0, 120).join("\n");
}

// ── Find ImageMagick ──────────────────────────────────────────────────────────
function findMagick() {
  const candidates = ["magick", "convert"];
  if (IS_WINDOWS) {
    try {
      const pf   = "C:\\Program Files";
      const dirs = fs.readdirSync(pf).filter(d => d.startsWith("ImageMagick"));
      for (const d of dirs) candidates.push(path.join(pf, d, "magick.exe"));
    } catch {}
  }
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

// ── Install fonts on Linux (Render / Docker) ──────────────────────────────────
function setupLinuxFonts() {
  if (!IS_LINUX) return;
  console.log("🐧 Linux detected — checking Bengali fonts…");

  // 1. Install system Bengali fonts via apt (fast, no auth needed)
  try {
    execSync("apt-get install -y -q fonts-beng fonts-lohit-beng-bengali fonts-noto 2>/dev/null || true", {
      timeout: 60_000, stdio: "pipe",
    });
    console.log("✓ apt fonts installed");
  } catch (e) {
    console.log("apt fonts skipped:", e.message);
  }

  // 2. Try to install Noto Bengali via tlmgr (TexLive package manager)
  try {
    execSync("tlmgr install noto 2>/dev/null || true", { timeout: 60_000, stdio: "pipe" });
    console.log("✓ tlmgr noto installed");
  } catch {}

  // 3. Copy any .ttf fonts from the project's fonts/ dir into the system font path
  const projectFontsDir = path.join(__dirname, "fonts");
  if (fs.existsSync(projectFontsDir)) {
    const destDir = "/usr/local/share/fonts/atomictest/";
    try {
      fs.mkdirSync(destDir, { recursive: true });
      const fonts = fs.readdirSync(projectFontsDir).filter(f => /\.(ttf|otf)$/i.test(f));
      for (const f of fonts) {
        fs.copyFileSync(path.join(projectFontsDir, f), path.join(destDir, f));
        console.log("✓ copied font:", f);
      }
      execSync("fc-cache -fv 2>/dev/null || true", { timeout: 30_000, stdio: "pipe" });
      console.log("✓ fc-cache refreshed");
    } catch (e) {
      console.log("font copy error:", e.message);
    }
  }

  // 4. Refresh TeX font DB
  try {
    execSync("mktexlsr 2>/dev/null || true", { timeout: 30_000, stdio: "pipe" });
    console.log("✓ mktexlsr done");
  } catch {}

  // 5. List available Bengali fonts for debugging
  try {
    const fonts = execSync("fc-list :lang=bn 2>/dev/null | head -20", { timeout: 10_000 }).toString();
    console.log("Bengali fonts available:\n", fonts || "(none — will use FreeSerif fallback)");
  } catch {}
}

// ── MiKTeX startup (Windows) ──────────────────────────────────────────────────
function setupWindowsFonts() {
  if (!IS_WINDOWS) return;
  console.log("🪟 Windows detected — refreshing MiKTeX…");
  try {
    execSync("mpm --install=kalpurush 2>nul", { timeout: 60_000, stdio: "pipe" });
    execSync("mpm --install=bengali   2>nul", { timeout: 60_000, stdio: "pipe" });
    execSync("initexmf --update-fndb",         { timeout: 30_000, stdio: "pipe" });
    execSync("fc-cache -fv",                   { timeout: 30_000, stdio: "pipe" });
    console.log("✓ MiKTeX fonts refreshed");
  } catch (e) {
    console.log("MiKTeX setup skipped:", e.message);
  }
}

setupLinuxFonts();
setupWindowsFonts();

const MAGICK  = findMagick();
const XELATEX = findEngine("xelatex");
const PDFLATEX= findEngine("pdflatex");

// ── Compile LaTeX ──────────────────────────────────────────────────────────────
function compile(latex, engine, dir, passes = 1) {
  const texFile = path.join(dir, "doc.tex");
  const pdfFile = path.join(dir, "doc.pdf");
  const logFile = path.join(dir, "doc.log");

  fs.writeFileSync(texFile, latex, "utf8");

  for (let i = 0; i < passes; i++) {
    // Use spawnSync with args array — no shell quoting issues on any platform
    const result = spawnSync(
      engine,
      ["-interaction=nonstopmode", "-halt-on-error", `-output-directory=${dir}`, texFile],
      { timeout: 120_000, cwd: dir }
    );
    // Log stdout for debugging but don't throw yet — check PDF existence below
    if (result.error) {
      console.error("spawnSync error:", result.error);
    }
  }

  if (!fs.existsSync(pdfFile)) {
    const rawLog = fs.existsSync(logFile)
      ? fs.readFileSync(logFile, "utf8")
      : "No log file generated";
    throw new Error(extractErrors(rawLog));
  }
  return pdfFile;
}

// ── /compile endpoint ──────────────────────────────────────────────────────────
app.post("/compile", (req, res) => {
  const { latex, engine: requestedEngine, format: outputFormat } = req.body;
  if (!latex) return res.status(400).send("No latex provided");

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

  const passes = /\\documentclass.*\{exam\}/.test(latex) ? 2 : 1;

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "paper-"));
  try {
    let pdfFile;
    try {
      pdfFile = compile(latex, enginePath, dir, passes);
    } catch (e) {
      const errText = String(e.message || e);
      console.error("Compile failed:\n", errText.slice(0, 2000));
      return res.status(422).json({ error: errText });
    }

    const pdfBuffer = fs.readFileSync(pdfFile);

    if (outputFormat === "pdf") {
      res.set("Content-Type", "application/pdf");
      return res.send(pdfBuffer);
    }

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
  platform: process.platform,
}));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 TikZ/Paper compiler on :${PORT}`);
  console.log(`   platform : ${process.platform}`);
  console.log(`   xelatex  : ${XELATEX  || "NOT FOUND"}`);
  console.log(`   pdflatex : ${PDFLATEX || "NOT FOUND"}`);
  console.log(`   magick   : ${MAGICK   || "NOT FOUND"}`);
});
