FROM texlive/texlive:latest

RUN apt-get update && apt-get install -y \
    nodejs npm imagemagick wget \
    && rm -rf /var/lib/apt/lists/*

# Allow ImageMagick to convert PDFs
RUN sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' /etc/ImageMagick-6/policy.xml || true

# Download Kalpurush font (used by latexbangla) from GitHub
RUN mkdir -p /usr/local/share/fonts/bengali && \
    wget -q "https://github.com/nv-h/latexbangla/raw/master/Kalpurush.ttf" \
         -O /usr/local/share/fonts/bengali/Kalpurush.ttf && \
    fc-cache -fv

# Install latexbangla + polyglossia via tlmgr
RUN tlmgr install latexbangla polyglossia || true

WORKDIR /app
COPY package.json .
RUN npm install
COPY server.js .

EXPOSE 3001
CMD ["node", "server.js"]
