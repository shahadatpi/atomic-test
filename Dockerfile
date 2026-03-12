FROM texlive/texlive:latest

# System packages
RUN apt-get update && apt-get install -y \
    nodejs npm imagemagick wget curl \
    fonts-noto fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

# Allow ImageMagick PDF conversion
RUN sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' \
    /etc/ImageMagick-6/policy.xml 2>/dev/null || \
    sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' \
    /etc/ImageMagick-7/policy.xml 2>/dev/null || true

# ── Install Bengali fonts ─────────────────────────────────────────────────────
RUN mkdir -p /usr/local/share/fonts/bengali

# Kalpurush (primary Bengali font used by AtomicTest)
RUN wget -q "https://github.com/nv-h/latexbangla/raw/master/Kalpurush.ttf" \
         -O /usr/local/share/fonts/bengali/Kalpurush.ttf || \
    wget -q "https://raw.githubusercontent.com/lipi/kalpurush/master/Kalpurush.ttf" \
         -O /usr/local/share/fonts/bengali/Kalpurush.ttf || \
    echo "⚠ Kalpurush download failed — will use Noto fallback"

# Noto Serif Bengali (fallback)
RUN wget -q "https://github.com/notofonts/noto-fonts/raw/main/hinted/ttf/NotoSerifBengali/NotoSerifBengali-Regular.ttf" \
         -O /usr/local/share/fonts/bengali/NotoSerifBengali-Regular.ttf || true

# SolaimanLipi (second fallback)  
RUN wget -q "https://raw.githubusercontent.com/saimumce/bangla-font/master/SolaimanLipi.ttf" \
         -O /usr/local/share/fonts/bengali/SolaimanLipi.ttf || true

RUN fc-cache -fv && fc-list :lang=bn | head -10

# ── TeX packages ──────────────────────────────────────────────────────────────
# texlive/texlive:latest ships with tlmgr in user mode; switch to sys mode
RUN tlmgr init-usertree 2>/dev/null || true
RUN tlmgr install \
    polyglossia \
    fontspec \
    exam \
    tasks \
    enumitem \
    draftwatermark \
    tikz \
    pgfplots \
    circuitikz \
    nicematrix \
    mathtools \
    adjustbox \
    2>/dev/null || true

RUN mktexlsr 2>/dev/null || true

# ── App ───────────────────────────────────────────────────────────────────────
WORKDIR /app
COPY package.json .
RUN npm install --production
COPY server.js .

EXPOSE 3001
CMD ["node", "server.js"]
