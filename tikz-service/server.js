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
async function setupLinuxFonts() {
  if (!IS_LINUX) return;
  console.log("🐧 Linux detected — setting up Bengali fonts…");

  // Font dir inside the service — writable without root
  const fontDir = path.join(__dirname, "fonts");
  fs.mkdirSync(fontDir, { recursive: true });

  // Fonts to download with fallback mirrors
  const FONTS = [
    {
      name: "Kalpurush.ttf",
      urls: [
        "https://github.com/nv-h/latexbangla/raw/master/Kalpurush.ttf",
        "https://raw.githubusercontent.com/lipi/kalpurush/master/Kalpurush.ttf",
      ],
    },
    {
      name: "NotoSerifBengali-Regular.ttf",
      urls: [
        "https://github.com/notofonts/noto-fonts/raw/main/hinted/ttf/NotoSerifBengali/NotoSerifBengali-Regular.ttf",
      ],
    },
  ];

  for (const font of FONTS) {
    const dest = path.join(fontDir, font.name);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 10_000) {
      console.log(`✓ font cached: ${font.name}`);
      continue;
    }
    let downloaded = false;
    for (const url of font.urls) {
      try {
        console.log(`  downloading ${font.name} from ${url}…`);
        const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
        if (!res.ok) continue;
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(dest, buf);
        console.log(`✓ downloaded ${font.name} (${buf.length} bytes)`);
        downloaded = true;
        break;
      } catch (e) {
        console.log(`  failed: ${e.message}`);
      }
    }
    if (!downloaded) console.warn(`⚠ could not download ${font.name}`);
  }

  // Register fonts with fontconfig — try system dirs, fall back to user dir
  const fcDirs = [
    "/usr/local/share/fonts/atomictest",
    "/usr/share/fonts/atomictest",
    path.join(os.homedir(), ".fonts/atomictest"),
  ];

  let registered = false;
  for (const dir of fcDirs) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      for (const f of fs.readdirSync(fontDir).filter(n => /\.(ttf|otf)$/i.test(n))) {
        fs.copyFileSync(path.join(fontDir, f), path.join(dir, f));
      }
      execSync(`fc-cache -f "${dir}" 2>/dev/null || true`, { timeout: 15_000, stdio: "pipe" });
      console.log(`✓ fonts registered in ${dir}`);
      registered = true;
      break;
    } catch {}
  }

  if (!registered) {
    // Last resort: set FONTCONFIG_PATH to local dir
    process.env.FONTCONFIG_PATH = fontDir;
    console.log("⚠ using local fontconfig path:", fontDir);
  }

  // Refresh TeX font DB
  try {
    execSync("mktexlsr 2>/dev/null || true", { timeout: 20_000, stdio: "pipe" });
  } catch {}

  // Log what's available
  try {
    const avail = execSync("fc-list :lang=bn 2>/dev/null | head -10", { timeout: 8_000 }).toString().trim();
    console.log("Bengali fonts available:", avail || "(none — LaTeX will use FreeSerif fallback)");
  } catch {}
}

// ── Download Kalpurush font if missing (works on any Linux — Render Node.js runtime) ──
function downloadKalpurush() {
  if (!IS_LINUX) return;
  const fontDir  = "/usr/local/share/fonts/bengali";
  const fontPath = `${fontDir}/Kalpurush.ttf`;
  if (fs.existsSync(fontPath)) {
    console.log("✓ Kalpurush already present");
    return;
  }
  console.log("⬇ Downloading Kalpurush font…");
  try {
    fs.mkdirSync(fontDir, { recursive: true });
    // Try multiple mirrors
    const urls = [
      "https://github.com/nv-h/latexbangla/raw/master/Kalpurush.ttf",
      "https://github.com/adamRiverBank/BanglaFonts/raw/main/Kalpurush.ttf",
    ];
    let downloaded = false;
    for (const url of urls) {
      try {
        execSync(`curl -fsSL "${url}" -o "${fontPath}"`, { timeout: 30_000, stdio: "pipe" });
        if (fs.existsSync(fontPath) && fs.statSync(fontPath).size > 10000) {
          downloaded = true;
          console.log("✓ Kalpurush downloaded from", url);
          break;
        }
      } catch { fs.rmSync(fontPath, { force: true }); }
    }
    if (downloaded) {
      execSync("fc-cache -fv 2>/dev/null || true", { timeout: 20_000, stdio: "pipe" });
      // Also install Noto Bengali via apt as backup
      execSync("apt-get install -y -q fonts-noto 2>/dev/null || true", { timeout: 60_000, stdio: "pipe" });
      execSync("fc-cache -fv 2>/dev/null || true", { timeout: 20_000, stdio: "pipe" });
      console.log("✓ Font cache refreshed");
      // List available Bengali fonts
      try {
        const list = execSync("fc-list :lang=bn 2>/dev/null | head -5").toString().trim();
        console.log("Bengali fonts:", list || "(none)");
      } catch {}
    } else {
      console.warn("⚠ Kalpurush download failed — will use Noto/FreeSerif fallback");
      // Install Noto as fallback anyway
      execSync("apt-get install -y -q fonts-noto fonts-freefont-ttf 2>/dev/null || true", { timeout: 60_000, stdio: "pipe" });
      execSync("fc-cache -fv 2>/dev/null || true", { timeout: 20_000, stdio: "pipe" });
    }
  } catch (e) {
    console.warn("Font setup error:", e.message);
  }
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

// Run font setup before starting server
(async () => {
  await setupLinuxFonts();
  setupWindowsFonts();
  downloadKalpurush();

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`\n🚀 TikZ/Paper compiler on :${PORT}`);
    console.log(`   platform : ${process.platform}`);
    console.log(`   xelatex  : ${XELATEX  || "NOT FOUND"}`);
    console.log(`   pdflatex : ${PDFLATEX || "NOT FOUND"}`);
    console.log(`   magick   : ${MAGICK   || "NOT FOUND"}`);
  });
})();

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
    // Cleanup helper — called after response finishes
    const cleanup = () => fs.rmSync(dir, { recursive: true, force: true });

    if (outputFormat === "pdf") {
      res.set("Content-Type", "application/pdf");
      res.on("finish", cleanup);
      return res.send(pdfBuffer);
    }

    if (MAGICK) {
      const pngFile = path.join(dir, "doc.png");
      const r = spawnSync(MAGICK, [
        "-density", "150", pdfFile,
        "-background", "white", "-flatten", pngFile,
      ], { timeout: 30_000 });

      if (r.status === 0 && fs.existsSync(pngFile)) {
        const pngBuf = fs.readFileSync(pngFile);
        res.set("Content-Type", "image/png");
        res.on("finish", cleanup);
        return res.send(pngBuf);
      }
      console.warn("magick failed:", r.stderr?.toString());
    }

    res.on("finish", cleanup);
    res.json({ pdf: pdfBuffer.toString("base64") });

  } catch (outerErr) {
    fs.rmSync(dir, { recursive: true, force: true });
    throw outerErr;
  }
});

// ── /health ────────────────────────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({
  xelatex:  !!XELATEX,
  pdflatex: !!PDFLATEX,
  magick:   !!MAGICK,
  platform: process.platform,
}));


